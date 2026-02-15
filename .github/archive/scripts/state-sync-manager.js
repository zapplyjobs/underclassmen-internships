#!/usr/bin/env node

/**
 * State Sync Manager
 * Manages synchronization of all JSON state files
 *
 * State Files:
 * - posted_jobs.json: Jobs posted to Discord
 * - jobs-data-encrypted.json: Encrypted export for external consumption
 * - new_jobs.json: Current batch from API (temporary)
 *
 * Usage:
 *   node state-sync-manager.js --action=<action>
 *
 * Actions:
 *   - clear-posted: Clear posted_jobs.json (for Discord cleanup sync)
 *   - clear-all: Clear all state files (nuclear option)
 *   - verify: Verify all state files exist and are valid
 *   - sync: Sync posted_jobs.json with Discord (future feature)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), '.github', 'data');
const STATE_FILES = {
  posted: path.join(DATA_DIR, 'posted_jobs.json'),
  encrypted: path.join(DATA_DIR, 'jobs-data-encrypted.json'),
  new: path.join(DATA_DIR, 'new_jobs.json')
};

/**
 * DEPRECATED: clear_database feature removed
 * posted_jobs.json now uses automatic 7-day TTL archiving
 *
 * This function is kept for backwards compatibility but does nothing.
 * Old jobs are automatically archived by PostedJobsManagerV2.
 */
function clearPosted() {
  console.log('⚠️  WARNING: clear_database is deprecated and does nothing');
  console.log('   posted_jobs.json uses automatic 7-day TTL archiving');
  console.log('   Old jobs are automatically moved to monthly archive files');
  console.log('   No manual clearing needed');
  return false; // Return false to indicate operation was not performed
}

/**
 * Clear jobs-data-encrypted.json (delete file)
 */
function clearEncrypted() {
  console.log('🧹 Clearing jobs-data-encrypted.json...');

  if (!fs.existsSync(STATE_FILES.encrypted)) {
    console.log('   ℹ️  File does not exist, nothing to clear');
    return true;
  }

  fs.unlinkSync(STATE_FILES.encrypted);
  console.log('   ✅ jobs-data-encrypted.json deleted');
  return true;
}

/**
 * Clear all state files
 */
function clearAll() {
  console.log('🧹 Clearing ALL state files...\n');

  let success = true;
  success = clearPosted() && success;
  success = clearEncrypted() && success;

  // Don't clear new_jobs.json as it's temporary and recreated each run

  console.log('\n📊 State Reset Summary:');
  console.log('   ✅ posted_jobs.json: Reset to empty array');
  console.log('   ✅ jobs-data-encrypted.json: Deleted');
  console.log('   ℹ️  new_jobs.json: Not touched (temporary file)');

  return success;
}

/**
 * Verify all state files
 */
function verify() {
  console.log('🔍 Verifying state files...\n');

  let allValid = true;

  // Check posted_jobs.json
  console.log('📋 posted_jobs.json:');
  if (fs.existsSync(STATE_FILES.posted)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILES.posted, 'utf8'));
      if (!Array.isArray(data)) {
        console.log('   ❌ Invalid: Not an array');
        allValid = false;
      } else {
        console.log(`   ✅ Valid: ${data.length} job IDs`);
        console.log(`   📊 Size: ${fs.statSync(STATE_FILES.posted).size} bytes`);
      }
    } catch (error) {
      console.log(`   ❌ Invalid JSON: ${error.message}`);
      allValid = false;
    }
  } else {
    console.log('   ⚠️  File does not exist');
    allValid = false;
  }

  // Check jobs-data-encrypted.json
  console.log('\n🔐 jobs-data-encrypted.json:');
  if (fs.existsSync(STATE_FILES.encrypted)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILES.encrypted, 'utf8'));
      if (!data.encrypted || !data.metadata) {
        console.log('   ❌ Invalid: Missing required fields');
        allValid = false;
      } else {
        console.log(`   ✅ Valid: Encrypted data present`);
        console.log(`   📊 Size: ${fs.statSync(STATE_FILES.encrypted).size} bytes`);
        console.log(`   🕒 Last updated: ${data.metadata.lastUpdated || 'unknown'}`);
        console.log(`   📈 Total jobs: ${data.metadata.totalJobs || 0}`);
      }
    } catch (error) {
      console.log(`   ❌ Invalid JSON: ${error.message}`);
      allValid = false;
    }
  } else {
    console.log('   ℹ️  File does not exist (will be created on next run)');
  }

  // Check new_jobs.json (temporary file)
  console.log('\n📦 new_jobs.json:');
  if (fs.existsSync(STATE_FILES.new)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILES.new, 'utf8'));
      if (!Array.isArray(data)) {
        console.log('   ❌ Invalid: Not an array');
        allValid = false;
      } else {
        console.log(`   ✅ Valid: ${data.length} jobs in current batch`);
        console.log(`   📊 Size: ${fs.statSync(STATE_FILES.new).size} bytes`);
      }
    } catch (error) {
      console.log(`   ❌ Invalid JSON: ${error.message}`);
      allValid = false;
    }
  } else {
    console.log('   ℹ️  File does not exist (created by job-fetcher)');
  }

  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('✅ All state files are valid');
  } else {
    console.log('❌ Some state files have issues (see above)');
  }
  console.log('='.repeat(50));

  return allValid;
}

/**
 * Remove specific job IDs from posted_jobs.json
 */
function removeJobIds(jobIds) {
  console.log(`🧹 Removing ${jobIds.length} job IDs from posted_jobs.json...\n`);

  if (!fs.existsSync(STATE_FILES.posted)) {
    console.log('   ⚠️  posted_jobs.json does not exist');
    return false;
  }

  try {
    const data = JSON.parse(fs.readFileSync(STATE_FILES.posted, 'utf8'));
    if (!Array.isArray(data)) {
      console.log('   ❌ Invalid file format (not an array)');
      return false;
    }

    const originalCount = data.length;
    const jobIdsSet = new Set(jobIds);
    const filteredData = data.filter(id => !jobIdsSet.has(id));
    const removedCount = originalCount - filteredData.length;

    fs.writeFileSync(STATE_FILES.posted, JSON.stringify(filteredData, null, 2));

    console.log(`   ✅ Removed ${removedCount} job IDs`);
    console.log(`   📊 Before: ${originalCount} jobs`);
    console.log(`   📊 After: ${filteredData.length} jobs`);

    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Filter posted_jobs.json by time (remove old entries)
 */
function filterByTime(hoursAgo) {
  console.log(`🧹 Removing jobs older than ${hoursAgo} hours from posted_jobs.json...\n`);
  console.log('   ⚠️  Note: posted_jobs.json only stores IDs, not timestamps');
  console.log('   ℹ️  This feature requires new_jobs.json to determine age');
  console.log('   ℹ️  For now, use clear-posted or remove-ids instead');
  return false;
}

// Parse command line arguments
const args = process.argv.slice(2);
const action = args.find(arg => arg.startsWith('--action='))?.split('=')[1];
const jobIds = args.find(arg => arg.startsWith('--job-ids='))?.split('=')[1]?.split(',');
const hoursAgo = args.find(arg => arg.startsWith('--hours-ago='))?.split('=')[1];

// Main execution
console.log('🔧 State Sync Manager');
console.log('='.repeat(50));
console.log(`Action: ${action || 'none'}\n`);

let success = false;

switch (action) {
  case 'clear-posted':
    success = clearPosted();
    break;

  case 'clear-all':
    success = clearAll();
    break;

  case 'verify':
    success = verify();
    break;

  case 'remove-ids':
    if (!jobIds || jobIds.length === 0) {
      console.log('❌ Error: --job-ids parameter required');
      success = false;
    } else {
      success = removeJobIds(jobIds);
    }
    break;

  case 'filter-by-time':
    if (!hoursAgo) {
      console.log('❌ Error: --hours-ago parameter required');
      success = false;
    } else {
      success = filterByTime(parseInt(hoursAgo));
    }
    break;

  default:
    console.log('❌ Error: Invalid or missing action');
    console.log('\nAvailable actions:');
    console.log('  --action=clear-posted    : Clear posted_jobs.json');
    console.log('  --action=clear-all       : Clear all state files');
    console.log('  --action=verify          : Verify all state files');
    console.log('  --action=remove-ids      : Remove specific job IDs (requires --job-ids)');
    console.log('\nExamples:');
    console.log('  node state-sync-manager.js --action=verify');
    console.log('  node state-sync-manager.js --action=clear-posted');
    console.log('  node state-sync-manager.js --action=remove-ids --job-ids=id1,id2,id3');
    process.exit(1);
}

process.exit(success ? 0 : 1);
