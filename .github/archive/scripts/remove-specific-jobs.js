#!/usr/bin/env node

/**
 * Remove Specific Jobs from Database
 *
 * Purpose: Remove specific job postings from the posted_jobs.json database
 * to allow them to be re-posted with corrected routing logic.
 *
 * Usage:
 *   node .github/scripts/remove-specific-jobs.js --dry-run
 *   node .github/scripts/remove-specific-jobs.js --execute
 *
 * Date Created: 2025-11-26
 */

const fs = require('fs');
const path = require('path');

// Data paths
const dataDir = path.join(process.cwd(), '.github', 'data');
const postedJobsPath = path.join(dataDir, 'posted_jobs.json');
const backupPath = path.join(dataDir, 'posted_jobs_backup.json');

// Jobs to remove (specify exact job ID patterns to match)
// Format: company-title-location (normalized with hyphens, lowercase)
const JOBS_TO_REMOVE = [
  {
    jobIdPattern: /^amazon-.*-agi-.*$/i,
    displayName: 'Agentic AI Teacher - Agi Ds @ Amazon',
    reason: 'Duplicate posting to multiple location channels (remote-usa and other channels)'
  },
  {
    jobIdPattern: /^alkami.*-technical-implementation-engineer/i,
    displayName: 'Technical Implementation Engineer 1 @ Alkami Technology',
    reason: 'Duplicate posting to multiple location channels (new-york and remote-usa)'
  }
];

/**
 * Load posted jobs database
 */
function loadPostedJobs() {
  try {
    if (fs.existsSync(postedJobsPath)) {
      const data = JSON.parse(fs.readFileSync(postedJobsPath, 'utf8'));
      return Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.error('❌ Error loading posted jobs:', error);
    process.exit(1);
  }
  return [];
}

/**
 * Check if a job ID matches the removal criteria
 */
function shouldRemove(jobId) {
  for (const criteria of JOBS_TO_REMOVE) {
    if (criteria.jobIdPattern.test(jobId)) {
      return criteria;
    }
  }

  return null;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  console.log('🔍 Remove Specific Jobs Utility\n');

  if (dryRun) {
    console.log('🟡 DRY RUN MODE - No changes will be made');
    console.log('   Use --execute to actually remove jobs\n');
  } else {
    console.log('🔴 EXECUTE MODE - Changes will be saved\n');
  }

  // Load current database
  const postedJobs = loadPostedJobs();
  console.log(`📊 Total jobs in database: ${postedJobs.length}`);

  // Find jobs to remove
  const jobsToRemove = [];
  const remainingJobs = [];

  for (const jobId of postedJobs) {
    const matchCriteria = shouldRemove(jobId);
    if (matchCriteria) {
      jobsToRemove.push({ jobId, criteria: matchCriteria });
    } else {
      remainingJobs.push(jobId);
    }
  }

  // Display results
  console.log(`\n🔍 Found ${jobsToRemove.length} job(s) matching removal criteria:\n`);

  if (jobsToRemove.length === 0) {
    console.log('   No jobs found matching the removal criteria.');
    console.log('   Jobs may have already been removed or never posted.\n');
    process.exit(0);
  }

  // Display matched jobs
  for (const { jobId, criteria } of jobsToRemove) {
    console.log(`   ❌ ${jobId}`);
    console.log(`      Job: ${criteria.displayName}`);
    console.log(`      Reason: ${criteria.reason}`);
    console.log();
  }

  console.log(`📊 After removal: ${remainingJobs.length} jobs will remain\n`);

  // Execute removal if not dry run
  if (!dryRun) {
    try {
      // Create backup
      console.log('💾 Creating backup...');
      fs.copyFileSync(postedJobsPath, backupPath);
      console.log(`   ✅ Backup saved to: ${backupPath}`);

      // Write updated database
      console.log('\n🔧 Updating database...');
      fs.writeFileSync(postedJobsPath, JSON.stringify(remainingJobs, null, 2));
      console.log(`   ✅ Updated database saved`);

      console.log(`\n✅ Successfully removed ${jobsToRemove.length} job(s)`);
      console.log(`📊 New database size: ${remainingJobs.length} jobs`);

      console.log('\n📝 Next Steps:');
      console.log('   1. Wait for next workflow run');
      console.log('   2. Jobs will be re-posted with current routing logic');
      console.log('   3. Monitor Discord channels to verify correct routing');

    } catch (error) {
      console.error('\n❌ Error during execution:', error);
      console.log('\n🔄 Attempting to restore from backup...');

      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, postedJobsPath);
        console.log('   ✅ Database restored from backup');
      }

      process.exit(1);
    }
  } else {
    console.log('💡 To execute this removal, run:');
    console.log('   node .github/scripts/remove-specific-jobs.js --execute\n');
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { shouldRemove, JOBS_TO_REMOVE };
