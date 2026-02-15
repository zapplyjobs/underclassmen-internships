#!/usr/bin/env node

/**
 * Database Migration Script: Single-Channel → Multi-Channel Schema
 *
 * Migrates posted_jobs.json from old schema to new multi-channel tracking schema
 *
 * OLD SCHEMA:
 * {
 *   jobId: "abc123",
 *   discordThreadId: "thread-456",  // Single thread ID
 *   channelId: "channel-789"        // Single channel ID
 * }
 *
 * NEW SCHEMA:
 * {
 *   jobId: "abc123",
 *   discordPosts: {
 *     "channel-789": {
 *       messageId: "thread-456",
 *       channelType: "category",
 *       postedAt: "2026-01-19T10:00:00Z"
 *     }
 *   }
 * }
 *
 * Usage:
 *   node migrate-to-multi-channel-schema.js [--dry-run]
 *
 * Options:
 *   --dry-run    Preview changes without modifying the database
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const dataDir = path.join(process.cwd(), '.github', 'data');
const dataPath = path.join(dataDir, 'posted_jobs.json');
const backupPath = path.join(dataDir, `posted_jobs.backup.${new Date().toISOString().split('T')[0]}.json`);

/**
 * Main migration function
 */
function migrate() {
  console.log('═══════════════════════════════════════');
  console.log('📦 DATABASE MIGRATION');
  console.log('═══════════════════════════════════════');
  console.log(`Mode: ${DRY_RUN ? '🔬 DRY RUN (preview only)' : '✅ LIVE (will modify database)'}`);
  console.log('');

  // Check if database exists
  if (!fs.existsSync(dataPath)) {
    console.error('❌ ERROR: posted_jobs.json not found');
    console.error(`   Expected location: ${dataPath}`);
    console.error('');
    console.error('   Make sure you are running this script from the repository root.');
    process.exit(1);
  }

  // Load database
  console.log('📂 Loading database...');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(rawData);

  if (!data.jobs || !Array.isArray(data.jobs)) {
    console.error('❌ ERROR: Invalid database format (missing "jobs" array)');
    process.exit(1);
  }

  console.log(`✅ Database loaded: ${data.jobs.length} jobs total`);
  console.log('');

  // Analyze current schema
  let oldSchemaCount = 0;
  let newSchemaCount = 0;
  let needsMigrationCount = 0;

  for (const job of data.jobs) {
    if (job.discordPosts && typeof job.discordPosts === 'object') {
      newSchemaCount++;
    } else if (job.discordThreadId || job.channelId) {
      oldSchemaCount++;
      needsMigrationCount++;
    }
  }

  console.log('📊 Schema Analysis:');
  console.log(`   Old schema (needs migration): ${oldSchemaCount}`);
  console.log(`   New schema (already migrated): ${newSchemaCount}`);
  console.log(`   Jobs to migrate: ${needsMigrationCount}`);
  console.log('');

  if (needsMigrationCount === 0) {
    console.log('✅ All jobs already using new schema - no migration needed');
    process.exit(0);
  }

  // Create backup (if not dry run)
  if (!DRY_RUN) {
    console.log('💾 Creating backup...');
    fs.copyFileSync(dataPath, backupPath);
    console.log(`✅ Backup created: ${backupPath}`);
    console.log('');
  }

  // Migrate jobs
  console.log('🔄 Migrating jobs...');
  console.log('');

  let migratedCount = 0;
  const migratedJobs = data.jobs.map((job, index) => {
    // Skip if already new schema
    if (job.discordPosts && typeof job.discordPosts === 'object') {
      return job;
    }

    // Skip if no Discord posting data
    if (!job.discordThreadId && !job.channelId) {
      return job;
    }

    // Migrate to new schema
    migratedCount++;
    const messageId = job.discordThreadId || job.messageId || 'unknown';
    const channelId = job.channelId || 'unknown';
    const postedAt = job.postedToDiscord || new Date().toISOString();

    const migratedJob = {
      ...job,
      discordPosts: {
        [channelId]: {
          messageId: messageId,
          channelType: 'category', // Assume category for old data (can't determine retroactively)
          postedAt: postedAt
        }
      }
    };

    // Remove old fields (cleanup)
    delete migratedJob.discordThreadId;
    delete migratedJob.messageId;
    // Keep channelId for backwards compatibility (some scripts may still reference it)

    if ((migratedCount % 50) === 0 || migratedCount <= 5) {
      console.log(`   ${migratedCount}. ${job.title || 'Unknown'} @ ${job.company || 'Unknown'}`);
      console.log(`      Old: discordThreadId="${messageId}", channelId="${channelId}"`);
      console.log(`      New: discordPosts["${channelId}"] = { messageId, channelType, postedAt }`);
      console.log('');
    }

    return migratedJob;
  });

  // Update metadata
  data.jobs = migratedJobs;
  data.lastUpdated = new Date().toISOString();
  data.metadata = data.metadata || {};
  data.metadata.schemaMigration = {
    migratedAt: new Date().toISOString(),
    migratedCount: migratedCount,
    oldSchemaCount: oldSchemaCount,
    newSchemaCount: newSchemaCount,
    totalJobs: data.jobs.length
  };

  // Save migrated database (if not dry run)
  if (!DRY_RUN) {
    console.log('💾 Saving migrated database...');

    // Atomic write (temp file + rename)
    const tempPath = dataPath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
    fs.renameSync(tempPath, dataPath);

    console.log('✅ Database saved successfully');
    console.log('');
  }

  // Final summary
  console.log('═══════════════════════════════════════');
  console.log('📊 MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Jobs migrated: ${migratedCount}`);
  console.log(`Total jobs: ${data.jobs.length}`);
  console.log(`Backup location: ${DRY_RUN ? '(not created - dry run)' : backupPath}`);
  console.log('');

  if (DRY_RUN) {
    console.log('🔬 DRY RUN COMPLETE - No changes made');
    console.log('   To perform actual migration, run without --dry-run flag:');
    console.log('   node migrate-to-multi-channel-schema.js');
  } else {
    console.log('✅ MIGRATION COMPLETE');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify database: .github/data/posted_jobs.json');
    console.log('2. Test posting jobs to ensure multi-channel tracking works');
    console.log('3. If issues occur, restore from backup:');
    console.log(`   cp "${backupPath}" "${dataPath}"`);
  }

  console.log('═══════════════════════════════════════');
}

// Run migration
if (require.main === module) {
  try {
    migrate();
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ MIGRATION FAILED:', error.message);
    console.error('');
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

module.exports = { migrate };
