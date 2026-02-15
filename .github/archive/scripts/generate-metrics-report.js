#!/usr/bin/env node

/**
 * Metrics Report Generator
 *
 * Aggregates job posting data from posted_jobs.json database:
 * - Primary source: posted_jobs.json (all posted jobs with channel info)
 * - Secondary: discord-posts-*.jsonl logs (if available, for failures/filtered)
 * - Optional: routing-encrypted.json (channel routing decisions)
 *
 * Generates comprehensive JSON report for debugging:
 * - Per-channel job counts and listings
 * - Multi-channel routing analysis (same job → multiple channels)
 * - Failure tracking (what failed, why, when)
 * - Filter analysis (what was filtered, why)
 *
 * Output:
 * - .github/data/metrics/latest.json (committed to git)
 * - .github/data/metrics/YYYY-MM-DD.json (7-day retention)
 */

const fs = require('fs');
const path = require('path');
const { decryptLog } = require('./encryption-utils');

// Constants
const DATA_DIR = path.join(process.cwd(), '.github', 'data');
const METRICS_DIR = path.join(DATA_DIR, 'metrics');
const AUDIT_DIR = path.join(process.cwd(), '.github', 'audit');
const LOGS_DIR = path.join(process.cwd(), '.github', 'logs');

// Ensure metrics directory exists
if (!fs.existsSync(METRICS_DIR)) {
  fs.mkdirSync(METRICS_DIR, { recursive: true });
}

/**
 * Load posted jobs database
 */
function loadPostedJobs() {
  const filePath = path.join(DATA_DIR, 'posted_jobs.json');

  if (!fs.existsSync(filePath)) {
    console.log('⚠️ posted_jobs.json not found');
    return { jobs: [] };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // Handle both v1 (array) and v2 (object with jobs array) formats
    if (Array.isArray(data)) {
      return { jobs: data };
    }

    return data;
  } catch (error) {
    console.error('❌ Error loading posted_jobs.json:', error.message);
    return { jobs: [] };
  }
}

/**
 * Load Discord posting logs from last N days
 */
function loadRecentDiscordLogs(days = 7) {
  const logs = [];
  const now = new Date();

  // Check for log files from last N days
  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const dateStr = date.toISOString().split('T')[0];
    const logPath = path.join(LOGS_DIR, `discord-posts-${dateStr}.jsonl`);

    if (fs.existsSync(logPath)) {
      try {
        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.trim().split('\n').filter(line => line);
        lines.forEach(line => {
          try {
            logs.push(JSON.parse(line));
          } catch (e) {
            // Skip invalid lines
          }
        });
      } catch (error) {
        console.warn(`⚠️ Failed to load ${logPath}:`, error.message);
      }
    }
  }

  return logs;
}

/**
 * Load encrypted routing logs
 */
function loadRoutingLogs() {
  const routingPath = path.join(AUDIT_DIR, 'routing-encrypted.json');

  if (!fs.existsSync(routingPath)) {
    console.log('⚠️ routing-encrypted.json not found');
    return [];
  }

  const password = process.env.LOG_ENCRYPT_PASSWORD;
  if (!password) {
    console.log('⚠️ LOG_ENCRYPT_PASSWORD not set, skipping routing logs');
    return [];
  }

  try {
    const encryptedData = JSON.parse(fs.readFileSync(routingPath, 'utf8'));
    const decrypted = decryptLog(encryptedData, password);
    return decrypted;
  } catch (error) {
    console.error('❌ Error loading routing logs:', error.message);
    return [];
  }
}

/**
 * Build channel name mapping from environment variables
 */
function buildChannelMapping() {
  const mapping = {};

  // Role-based channels
  const roleChannels = {
    'DISCORD_TECH_CHANNEL_ID': 'tech-jobs',
    'DISCORD_AI_CHANNEL_ID': 'ai-ml-jobs',
    'DISCORD_DS_CHANNEL_ID': 'data-science-jobs',
    'DISCORD_SALES_CHANNEL_ID': 'sales-jobs',
    'DISCORD_MARKETING_CHANNEL_ID': 'marketing-jobs',
    'DISCORD_FINANCE_CHANNEL_ID': 'finance-jobs',
    'DISCORD_HEALTHCARE_CHANNEL_ID': 'healthcare-jobs',
    'DISCORD_PRODUCT_CHANNEL_ID': 'product-jobs',
    'DISCORD_SUPPLY_CHANNEL_ID': 'supply-chain-jobs',
    'DISCORD_PM_CHANNEL_ID': 'project-management-jobs',
    'DISCORD_HR_CHANNEL_ID': 'hr-jobs'
  };

  // Location-based channels
  const locationChannels = {
    'DISCORD_REMOTE_USA_CHANNEL_ID': 'remote-usa-jobs',
    'DISCORD_NY_CHANNEL_ID': 'new-york-jobs',
    'DISCORD_AUSTIN_CHANNEL_ID': 'austin-jobs',
    'DISCORD_CHICAGO_CHANNEL_ID': 'chicago-jobs',
    'DISCORD_SEATTLE_CHANNEL_ID': 'seattle-jobs',
    'DISCORD_REDMOND_CHANNEL_ID': 'redmond-jobs',
    'DISCORD_MV_CHANNEL_ID': 'mountain-view-jobs',
    'DISCORD_SF_CHANNEL_ID': 'san-francisco-jobs',
    'DISCORD_SUNNYVALE_CHANNEL_ID': 'sunnyvale-jobs',
    'DISCORD_SAN_BRUNO_CHANNEL_ID': 'san-bruno-jobs',
    'DISCORD_BOSTON_CHANNEL_ID': 'boston-jobs',
    'DISCORD_LA_CHANNEL_ID': 'los-angeles-jobs'
  };

  // Build mapping from env vars
  Object.entries({ ...roleChannels, ...locationChannels }).forEach(([envVar, name]) => {
    const channelId = process.env[envVar];
    if (channelId) {
      mapping[channelId] = name;
    }
  });

  return mapping;
}

/**
 * Get channel name from ID
 */
function getChannelName(channelId, mapping) {
  if (!channelId) return 'unknown-channel';
  return mapping[channelId] || `channel-${channelId.substring(0, 8)}`;
}

/**
 * Generate comprehensive metrics report
 */
function generateMetricsReport(options = {}) {
  const { days = 7 } = options;

  console.log('📊 Generating metrics report...\n');

  // Load data sources
  console.log('📂 Loading data sources...');
  const postedJobsData = loadPostedJobs();
  const discordLogs = loadRecentDiscordLogs(days);
  const routingLogs = loadRoutingLogs();
  const channelMapping = buildChannelMapping();

  console.log(`   Posted jobs: ${postedJobsData.jobs.length}`);
  console.log(`   Discord logs: ${discordLogs.length} entries (last ${days} days)`);
  console.log(`   Routing logs: ${routingLogs.length} entries`);
  console.log(`   Channels: ${Object.keys(channelMapping).length} mapped\n`);

  // Calculate date range for filtering
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

  // Filter posted jobs to last N days
  const recentJobs = postedJobsData.jobs.filter(job => {
    if (!job.postedToDiscord) return false;
    const postedDate = new Date(job.postedToDiscord);
    return postedDate >= cutoffDate;
  });

  console.log(`📅 Jobs posted in last ${days} days: ${recentJobs.length}`);

  // Build per-channel statistics
  const byChannel = {};
  const multiChannelJobs = {}; // Track jobs posted to multiple channels

  // Build per-channel statistics from posted_jobs.json
  // Each job has a discordPosts object with channelId -> postInfo mapping
  recentJobs.forEach(job => {
    Object.entries(job.discordPosts || {}).forEach(([channelId, postInfo]) => {
      const channelName = getChannelName(channelId, channelMapping);

      if (!byChannel[channelName]) {
        byChannel[channelName] = {
          channel_id: channelId,
          count: 0,
          jobs: [],
          recent_jobs: []
        };
      }

      byChannel[channelName].count++;
      if (!byChannel[channelName].jobs.includes(job.jobId)) {
        byChannel[channelName].jobs.push(job.jobId);
      }

      // Track multi-channel routing
      if (!multiChannelJobs[job.jobId]) {
        multiChannelJobs[job.jobId] = {
          job_id: job.jobId,
          company: job.company,
          title: job.title,
          channels: [],
          posted_at: job.postedToDiscord
        };
      }

      if (!multiChannelJobs[job.jobId].channels.includes(channelName)) {
        multiChannelJobs[job.jobId].channels.push(channelName);
      }
    });
  });

  // Add recent job details to each channel (last 10 jobs, sorted by postedAt)
  Object.keys(byChannel).forEach(channelName => {
    const channelJobs = recentJobs
      .filter(job => {
        // Check if job was posted to this channel
        return Object.keys(job.discordPosts || {}).some(channelId => {
          const name = getChannelName(channelId, channelMapping);
          return name === channelName;
        });
      })
      .sort((a, b) => new Date(a.postedToDiscord) - new Date(b.postedToDiscord))
      .slice(-10)
      .map(job => ({
        id: job.jobId,
        title: job.title,
        company: job.company,
        posted_at: job.postedToDiscord
      }));

    byChannel[channelName].recent_jobs = channelJobs;
  });

  // Find jobs posted to multiple channels
  const multiChannelRouting = Object.values(multiChannelJobs)
    .filter(job => job.channels.length > 1)
    .sort((a, b) => b.channels.length - a.channels.length);

  // Collect failures
  const failures = discordLogs
    .filter(log => log.status === 'FAILED')
    .map(log => ({
      job_id: log.jobId,
      title: log.title,
      company: log.company,
      channel: log.channel_name || getChannelName(log.channel_id, channelMapping),
      error: log.error_message,
      error_code: log.error_code,
      timestamp: log.timestamp
    }));

  // Collect skipped jobs
  const skipped = discordLogs
    .filter(log => log.status === 'SKIPPED')
    .map(log => ({
      job_id: log.jobId,
      title: log.title,
      company: log.company,
      reason: log.reason,
      timestamp: log.timestamp
    }));

  // Group skipped by reason
  const filtered = {
    blacklisted: skipped.filter(s => s.reason && s.reason.includes('blacklist')),
    already_posted: skipped.filter(s => s.reason && s.reason.includes('already posted')),
    invalid_data: skipped.filter(s => s.reason && s.reason.includes('invalid') || s.reason.includes('missing')),
    other: skipped.filter(s =>
      !s.reason ||
      (!s.reason.includes('blacklist') &&
       !s.reason.includes('already posted') &&
       !s.reason.includes('invalid') &&
       !s.reason.includes('missing'))
    )
  };

  // Calculate summary statistics from posted_jobs.json
  // Count total postings (each channel post counts separately)
  let totalPostings = 0;
  recentJobs.forEach(job => {
    totalPostings += Object.keys(job.discordPosts || {}).length;
  });

  // Count unique jobs
  const uniqueJobs = new Set(recentJobs.map(j => j.jobId));

  const summary = {
    total_jobs_posted: totalPostings,
    unique_jobs: uniqueJobs.size,
    multi_channel_postings: multiChannelRouting.reduce((sum, job) => sum + job.channels.length, 0),
    unique_multi_channel_jobs: multiChannelRouting.length,
    failed_postings: failures.length,
    filtered_jobs: skipped.length,
    channels_active: Object.keys(byChannel).length
  };

  // Build final report
  const report = {
    generated: now.toISOString(),
    period: `last_${days}_days`,
    period_start: cutoffDate.toISOString(),
    period_end: now.toISOString(),
    summary,
    by_channel: byChannel,
    multi_channel_routing: multiChannelRouting.slice(0, 50), // Limit to top 50
    failures,
    filtered
  };

  return report;
}

/**
 * Save metrics report
 */
function saveMetricsReport(report) {
  // Save latest.json (always committed)
  const latestPath = path.join(METRICS_DIR, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Saved latest metrics: ${latestPath}`);

  // Save dated file (7-day retention)
  const date = new Date().toISOString().split('T')[0];
  const datedPath = path.join(METRICS_DIR, `${date}.json`);
  fs.writeFileSync(datedPath, JSON.stringify(report, null, 2));
  console.log(`✅ Saved dated metrics: ${datedPath}`);

  // Clean up old dated files (>7 days)
  cleanupOldMetrics(7);

  return { latestPath, datedPath };
}

/**
 * Clean up metrics files older than N days
 */
function cleanupOldMetrics(days) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

  const files = fs.readdirSync(METRICS_DIR)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f));

  let deletedCount = 0;

  files.forEach(file => {
    const dateStr = file.replace('.json', '');
    const fileDate = new Date(dateStr);

    if (fileDate < cutoff) {
      const filePath = path.join(METRICS_DIR, file);
      fs.unlinkSync(filePath);
      deletedCount++;
      console.log(`🗑️  Deleted old metrics: ${file}`);
    }
  });

  if (deletedCount > 0) {
    console.log(`\n🧹 Cleaned up ${deletedCount} old metrics files`);
  }
}

/**
 * Print summary to console
 */
function printSummary(report) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 METRICS SUMMARY');
  console.log('='.repeat(60));

  console.log(`\n📅 Period: ${report.period_start.split('T')[0]} to ${report.period_end.split('T')[0]}`);

  console.log('\n📈 Overall Statistics:');
  console.log(`   Total postings: ${report.summary.total_jobs_posted}`);
  console.log(`   Unique jobs: ${report.summary.unique_jobs}`);
  console.log(`   Multi-channel jobs: ${report.summary.unique_multi_channel_jobs}`);
  console.log(`   Failed postings: ${report.summary.failed_postings}`);
  console.log(`   Filtered jobs: ${report.summary.filtered_jobs}`);
  console.log(`   Active channels: ${report.summary.channels_active}`);

  console.log('\n📍 Top Channels:');
  const sortedChannels = Object.entries(report.by_channel)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  sortedChannels.forEach(([name, data]) => {
    console.log(`   ${name}: ${data.count} posts (${data.jobs.length} unique jobs)`);
  });

  if (report.multi_channel_routing.length > 0) {
    console.log('\n🔀 Multi-Channel Routing (Top 5):');
    report.multi_channel_routing.slice(0, 5).forEach(job => {
      console.log(`   "${job.title}" @ ${job.company}`);
      console.log(`      → ${job.channels.length} channels: ${job.channels.join(', ')}`);
    });
  }

  if (report.failures.length > 0) {
    console.log(`\n❌ Failures: ${report.failures.length}`);
    report.failures.slice(0, 5).forEach(fail => {
      console.log(`   "${fail.title}" @ ${fail.company} → ${fail.channel}`);
      console.log(`      Error: ${fail.error}`);
    });
  }

  console.log('\n🔍 Filtered Jobs:');
  console.log(`   Blacklisted: ${report.filtered.blacklisted.length}`);
  console.log(`   Already posted: ${report.filtered.already_posted.length}`);
  console.log(`   Invalid data: ${report.filtered.invalid_data.length}`);
  console.log(`   Other: ${report.filtered.other.length}`);

  console.log('\n' + '='.repeat(60) + '\n');
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  // Parse options
  const options = {};
  args.forEach(arg => {
    if (arg.startsWith('--days=')) {
      options.days = parseInt(arg.split('=')[1]);
    }
  });

  try {
    const report = generateMetricsReport(options);
    const paths = saveMetricsReport(report);
    printSummary(report);

    console.log('✅ Metrics report generation complete!');
    console.log(`\n📁 Latest metrics: ${paths.latestPath}`);
    console.log(`📁 Dated metrics: ${paths.datedPath}`);

  } catch (error) {
    console.error('❌ Error generating metrics report:', error);
    process.exit(1);
  }
}

module.exports = {
  generateMetricsReport,
  saveMetricsReport,
  loadPostedJobs,
  loadRecentDiscordLogs,
  loadRoutingLogs
};
