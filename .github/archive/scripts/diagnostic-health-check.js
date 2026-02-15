#!/usr/bin/env node

/**
 * Diagnostic Health Check for Job Posting System
 *
 * This script diagnoses issues with job posting by checking:
 * - Data file integrity
 * - Database capacity and duplicates
 * - Job filtering logic
 * - Discord bot configuration
 * - Recent posting activity
 */

const fs = require('fs');
const path = require('path');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║        JOB POSTING SYSTEM - DIAGNOSTIC HEALTH CHECK           ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Load utilities
const { generateJobId, generateEnhancedId } = require('./job-fetcher/utils');

// ============================================================================
// 1. DATA FILES STATUS
// ============================================================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. DATA FILES STATUS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const dataDir = path.join(process.cwd(), '.github', 'data');
const requiredFiles = ['new_jobs.json', 'posted_jobs.json', 'seen_jobs.json'];
const dataFiles = {};

requiredFiles.forEach(file => {
  const filePath = path.join(dataDir, file);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const size = fs.statSync(filePath).size;
    const itemCount = Array.isArray(data) ? data.length : Object.keys(data).length;
    console.log(`   ✅ ${file.padEnd(20)} ${itemCount.toString().padStart(5)} items  (${(size/1024).toFixed(1).padStart(6)} KB)`);
    dataFiles[file] = { exists: true, data, size, itemCount };
  } else {
    console.log(`   ❌ ${file.padEnd(20)} NOT FOUND`);
    dataFiles[file] = { exists: false };
  }
});

// ============================================================================
// 2. README STATUS
// ============================================================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('2. README STATUS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const readme = fs.readFileSync('README.md', 'utf8');
const jobLines = readme.split('\n').filter(line => line.match(/^\|[^|]+\|[^|]+\|[^|]+\|/));
const actualJobCount = jobLines.length - 1; // Subtract header row

console.log(`   📄 Jobs in README:     ${actualJobCount}`);

// Check for README count mismatch
const readmeCountMatch = readme.match(/Active Positions\*\*:\s*(\d+)/);
if (readmeCountMatch) {
  const declaredCount = parseInt(readmeCountMatch[1]);
  console.log(`   📊 Declared count:     ${declaredCount}`);

  if (declaredCount !== actualJobCount) {
    console.log(`   ⚠️  MISMATCH: Declared (${declaredCount}) != Actual (${actualJobCount})`);
  }
}

// ============================================================================
// 3. POSTED JOBS DATABASE ANALYSIS
// ============================================================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('3. POSTED JOBS DATABASE ANALYSIS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (dataFiles['posted_jobs.json'].exists) {
  const posted = dataFiles['posted_jobs.json'].data;
  const uniqueEntries = new Set(posted).size;
  const duplicates = posted.length - uniqueEntries;
  const capacity = (posted.length / 5000 * 100).toFixed(1);

  console.log(`   📊 Total entries:      ${posted.length}`);
  console.log(`   📊 Unique entries:     ${uniqueEntries}`);
  console.log(`   📊 Duplicate entries:  ${duplicates} ${duplicates > 0 ? '⚠️' : '✅'}`);
  console.log(`   📊 Database capacity:  ${capacity}% (max: 5000)`);

  if (posted.length >= 5000) {
    console.log(`   ⚠️  WARNING: Database at maximum capacity!`);
    console.log(`       Old entries will be removed on next save.`);
  }

  // Analyze ID formats
  const idPatterns = {
    legacy: posted.filter(id => !id.includes('http') && !id.includes('.com')).length,
    url_based: posted.filter(id => id.includes('.com') || id.includes('http')).length
  };

  console.log(`\n   ID Format Distribution:`);
  console.log(`   - Legacy format (company-title-location): ${idPatterns.legacy}`);
  console.log(`   - URL-based format (domain-based):        ${idPatterns.url_based}`);
}

// ============================================================================
// 4. NEW JOBS ANALYSIS
// ============================================================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('4. NEW JOBS ANALYSIS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (dataFiles['new_jobs.json'].exists) {
  const newJobs = dataFiles['new_jobs.json'].data;

  if (newJobs.length === 0) {
    console.log('   ℹ️  No new jobs queued for posting (this is normal if no new jobs found)\n');
  } else {
    console.log(`   📬 New jobs queued:    ${newJobs.length}\n`);

    // Analyze each new job
    newJobs.forEach((job, index) => {
      console.log(`   Job #${index + 1}:`);
      console.log(`   ├─ Title:       ${job.job_title}`);
      console.log(`   ├─ Company:     ${job.employer_name}`);
      console.log(`   ├─ Location:    ${job.job_city}, ${job.job_state}`);
      console.log(`   ├─ Posted:      ${job.job_posted_at_datetime_utc}`);

      const primaryId = generateJobId(job);
      const legacyId = generateEnhancedId(job);
      const posted = dataFiles['posted_jobs.json'].data;

      const primaryInDb = posted.includes(primaryId);
      const legacyInDb = posted.includes(legacyId);

      console.log(`   ├─ Primary ID:  ${primaryId}`);
      console.log(`   ├─ Legacy ID:   ${legacyId}`);
      console.log(`   ├─ Primary in DB:   ${primaryInDb ? '✅ YES (will skip)' : '❌ NO'}`);
      console.log(`   └─ Legacy in DB:    ${legacyInDb ? '✅ YES (DUPLICATE - will skip)' : '❌ NO'}`);

      if (primaryInDb || legacyInDb) {
        console.log(`\n   ⚠️  This job will be SKIPPED (detected as duplicate)`);
        if (legacyInDb && !primaryInDb) {
          console.log(`       Reason: Legacy ID match (same job posted with old ID format)`);
        }
      } else {
        console.log(`\n   ✅ This job WILL BE POSTED to Discord`);
      }

      if (index < newJobs.length - 1) {
        console.log(''); // Separator between jobs
      }
    });
  }
}

// ============================================================================
// 5. DISCORD BOT CONFIGURATION
// ============================================================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('5. DISCORD BOT CONFIGURATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const botEnvVars = {
  'DISCORD_TOKEN': !!process.env.DISCORD_TOKEN,
  'DISCORD_CHANNEL_ID': !!process.env.DISCORD_CHANNEL_ID,
  'DISCORD_CLIENT_ID': !!process.env.DISCORD_CLIENT_ID,
  'DISCORD_GUILD_ID': !!process.env.DISCORD_GUILD_ID
};

console.log('   Basic Configuration:');
Object.entries(botEnvVars).forEach(([key, isSet]) => {
  console.log(`   ${isSet ? '✅' : '❌'} ${key.padEnd(25)} ${isSet ? 'Set' : 'Not set'}`);
});

const multiChannelVars = [
  'DISCORD_TECH_CHANNEL_ID',
  'DISCORD_SALES_CHANNEL_ID',
  'DISCORD_MARKETING_CHANNEL_ID',
  'DISCORD_FINANCE_CHANNEL_ID'
];

console.log('\n   Multi-Channel Configuration (sampling):');
const multiChannelEnabled = multiChannelVars.some(varName => process.env[varName]);
multiChannelVars.forEach(varName => {
  const isSet = !!process.env[varName];
  console.log(`   ${isSet ? '✅' : '⭕'} ${varName.padEnd(35)} ${isSet ? 'Set' : 'Not set'}`);
});

console.log(`\n   Multi-Channel Mode: ${multiChannelEnabled ? '✅ ENABLED' : '⭕ DISABLED'}`);

// ============================================================================
// 6. RECENT ACTIVITY ANALYSIS
// ============================================================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('6. RECENT ACTIVITY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check latest audit log
const auditLogPath = path.join(process.cwd(), '.github', 'audit', 'latest.md');
if (fs.existsSync(auditLogPath)) {
  const auditLog = fs.readFileSync(auditLogPath, 'utf8');

  const timestampMatch = auditLog.match(/\*\*Timestamp:\*\*\s*(.+)/);
  const postedMatch = auditLog.match(/Posted:\*\*\s*(\d+)/);
  const failedMatch = auditLog.match(/Failed:\*\*\s*(\d+)/);
  const skippedMatch = auditLog.match(/Skipped:\*\*\s*(\d+)/);
  const dbSavedMatch = auditLog.match(/Database Saved:\*\*\s*(YES|NO)/);

  console.log('   Latest Bot Execution:');
  console.log(`   ├─ Timestamp:       ${timestampMatch ? timestampMatch[1] : 'Unknown'}`);
  console.log(`   ├─ Jobs Posted:     ${postedMatch ? postedMatch[1] : '?'}`);
  console.log(`   ├─ Jobs Failed:     ${failedMatch ? failedMatch[1] : '?'}`);
  console.log(`   ├─ Jobs Skipped:    ${skippedMatch ? skippedMatch[1] : '?'}`);
  console.log(`   └─ Database Saved:  ${dbSavedMatch ? dbSavedMatch[1] : '?'}`);

  if (postedMatch && parseInt(postedMatch[1]) === 0 && skippedMatch && parseInt(skippedMatch[1]) > 0) {
    console.log(`\n   ℹ️  Last run: No jobs posted (${skippedMatch[1]} skipped as duplicates)`);
  }
} else {
  console.log('   ⚠️  No audit log found');
}

// ============================================================================
// 7. RECOMMENDATIONS
// ============================================================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('7. RECOMMENDATIONS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const recommendations = [];

// Check for issues
if (dataFiles['posted_jobs.json'].exists) {
  const posted = dataFiles['posted_jobs.json'].data;

  if (posted.length >= 5000) {
    recommendations.push({
      priority: '⚠️  HIGH',
      issue: 'Posted jobs database at capacity (5000/5000)',
      action: 'Consider: Remove entries older than 90 days to free space'
    });
  }

  const duplicates = posted.length - new Set(posted).size;
  if (duplicates > 0) {
    recommendations.push({
      priority: '⚠️  MEDIUM',
      issue: `Found ${duplicates} duplicate entries in database`,
      action: 'Run: node .github/scripts/cleanup-posted-jobs.js (if script exists)'
    });
  }
}

if (actualJobCount < 50) {
  recommendations.push({
    priority: 'ℹ️  INFO',
    issue: `Only ${actualJobCount} jobs in README (below typical count)`,
    action: 'Verify: Job source is returning data (check PRIMARY_DATA_SOURCE_URL)'
  });
}

if (dataFiles['new_jobs.json'].exists && dataFiles['new_jobs.json'].itemCount === 0) {
  recommendations.push({
    priority: 'ℹ️  INFO',
    issue: 'No new jobs queued for posting',
    action: 'This is normal if: (1) No new jobs scraped, or (2) All scraped jobs are duplicates'
  });
}

if (!process.env.DISCORD_GUILD_ID) {
  recommendations.push({
    priority: '⚠️  LOW',
    issue: 'DISCORD_GUILD_ID not set',
    action: 'Bot will work but may have slower channel fetching'
  });
}

if (recommendations.length === 0) {
  console.log('   ✅ No issues detected - system appears healthy!\n');
} else {
  recommendations.forEach((rec, index) => {
    console.log(`   ${rec.priority} Issue #${index + 1}:`);
    console.log(`      Problem: ${rec.issue}`);
    console.log(`      Action:  ${rec.action}`);
    console.log('');
  });
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                      DIAGNOSTIC COMPLETE                      ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log('📋 Next Steps:');
console.log('   1. Review recommendations above');
console.log('   2. Check latest workflow run: gh run view <run-id> --log');
console.log('   3. Monitor next posting cycle (runs every 15 minutes)');
console.log('   4. For detailed bot logs: Download artifacts from GitHub Actions\n');
