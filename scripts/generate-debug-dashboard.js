#!/usr/bin/env node

/**
 * Debug Dashboard Generator
 *
 * Creates a compact JSON health check file for quick system status verification.
 * Target: <2k chars instead of 94k workflow logs (90% reduction)
 *
 * Output: .github/data/debug-dashboard.json
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../.github/data');
const OUTPUT_FILE = path.join(DATA_DIR, 'debug-dashboard.json');

// Helper: Read JSON file safely
function readJSON(filename) {
  try {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) return null;
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (error) {
    return null;
  }
}

// Helper: Get file size in human-readable format
function getFileSize(filename) {
  try {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) return null;
    const stats = fs.statSync(filepath);
    const mb = stats.size / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(stats.size / 1024).toFixed(2)} KB`;
  } catch (error) {
    return null;
  }
}

// Helper: Calculate days since a date
function daysSince(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Helper: Get time ago string
function timeAgo(dateString) {
  if (!dateString) return 'unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  const diffMin = Math.floor(diffMs / (1000 * 60));
  return `${diffMin}m ago`;
}

async function generateDashboard() {
  console.log('📊 Generating debug dashboard...\n');

  // Read data files
  const currentJobs = readJSON('current_jobs.json');
  const seenJobs = readJSON('seen_jobs.json');
  const pendingPosts = readJSON('pending_posts.json');
  const workflowMetrics = readJSON('workflow_metrics.json');
  const jsearchUsage = readJSON('jsearch_usage.json');

  // Calculate statistics
  const currentJobsCount = currentJobs ? currentJobs.length : 0;
  const seenJobsCount = seenJobs ? seenJobs.length : 0;
  const pendingCount = pendingPosts ? pendingPosts.length : 0;

  // Find last successful workflow run
  const lastRun = workflowMetrics?.timestamp || null;
  const lastRunAgo = lastRun ? timeAgo(lastRun) : 'never';

  // Check for Discord posts (jobs with enrichment data)
  const postedCount = pendingPosts ?
    pendingPosts.filter(item => item.enriched_at).length : 0;
  const notPostedYet = pendingCount - postedCount;

  // Find newest job date
  const newestJobDate = currentJobs && currentJobs.length > 0 ?
    currentJobs.reduce((newest, job) => {
      const jobDate = new Date(job.posted_at || job.job_posted_at_datetime_utc);
      return jobDate > newest ? jobDate : newest;
    }, new Date(0)).toISOString() : null;

  const daysSinceNewestJob = daysSince(newestJobDate);

  // Determine system health status
  let status = 'healthy';
  const warnings = [];
  const errors = [];

  // Check for issues
  if (!currentJobs) {
    errors.push('current_jobs.json missing');
    status = 'error';
  }
  if (!seenJobs) {
    errors.push('seen_jobs.json missing');
    status = 'error';
  }
  if (!pendingPosts) {
    errors.push('pending_posts.json missing');
    status = 'error';
  }

  if (currentJobsCount === 0 && status !== 'error') {
    warnings.push('No current jobs (unusual)');
    status = status === 'healthy' ? 'warning' : status;
  }

  if (daysSinceNewestJob > 7) {
    warnings.push(`Newest job is ${daysSinceNewestJob}d old (stale data)`);
    status = status === 'healthy' ? 'warning' : status;
  }

  const pendingQueueSize = getFileSize('pending_posts.json');
  const pendingQueueMB = pendingQueueSize ? parseFloat(pendingQueueSize) : 0;
  if (pendingQueueMB > 5) {
    warnings.push(`Large pending queue: ${pendingQueueSize}`);
  }

  // JSearch quota check
  const jsearchQuota = jsearchUsage?.requests_used || 0;
  const jsearchLimit = jsearchUsage?.max_requests_per_day || 90;
  const jsearchRemaining = jsearchLimit - jsearchQuota;
  const jsearchTotalJobs = jsearchUsage?.metrics?.total_jobs || 0;

  if (jsearchRemaining < 10) {
    warnings.push(`Low JSearch quota: ${jsearchRemaining} remaining`);
  }

  // CRITICAL: JSearch ALWAYS returns jobs (10 per request minimum)
  // If we got 0 jobs, something is BROKEN (not "no jobs available")
  if (jsearchQuota > 0 && jsearchTotalJobs === 0) {
    errors.push(`JSearch returned 0 jobs despite ${jsearchQuota} requests - API/config broken!`);
    status = 'error';
  }

  // Warn if JSearch jobs getting filtered out
  const jsearchInSources = workflowMetrics?.sources?.jsearch || 0;
  if (jsearchTotalJobs > 0 && jsearchInSources === 0) {
    warnings.push(`JSearch fetched ${jsearchTotalJobs} jobs but 0 in sources - filtered out!`);
  }

  // Build dashboard
  const dashboard = {
    generated_at: new Date().toISOString(),
    system_health: {
      status, // 'healthy', 'warning', 'error'
      last_workflow_run: lastRunAgo,
      newest_job_age: daysSinceNewestJob !== null ? `${daysSinceNewestJob}d` : 'unknown'
    },
    current_state: {
      current_jobs: currentJobsCount,
      seen_jobs: seenJobsCount,
      pending_queue: pendingCount,
      enriched_ready: postedCount,
      awaiting_enrichment: notPostedYet,
      jsearch_quota: `${jsearchQuota}/${jsearchLimit}`
    },
    file_sizes: {
      current_jobs: getFileSize('current_jobs.json'),
      seen_jobs: getFileSize('seen_jobs.json'),
      pending_posts: getFileSize('pending_posts.json')
    },
    sources: workflowMetrics?.sources || null,
    warnings,
    errors
  };

  // Write dashboard
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dashboard, null, 2));

  // Display summary
  console.log('✅ Dashboard generated!');
  console.log('\nQuick Status:');
  console.log(`  Status: ${status.toUpperCase()}`);
  console.log(`  Current Jobs: ${currentJobsCount}`);
  console.log(`  Pending Queue: ${pendingCount} (${postedCount} enriched, ${notPostedYet} pending)`);
  console.log(`  Last Run: ${lastRunAgo}`);
  console.log(`  Newest Job: ${daysSinceNewestJob}d ago`);

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(w => console.log(`  - ${w}`));
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  console.log(`\n📄 Output: ${OUTPUT_FILE}`);
  console.log(`📏 Size: ${(JSON.stringify(dashboard).length / 1024).toFixed(2)} KB\n`);
}

generateDashboard().catch(error => {
  console.error('❌ Failed to generate dashboard:', error);
  process.exit(1);
});
