#!/usr/bin/env node

/**
 * Job Distribution Verification Script
 *
 * Analyzes job posting logs to verify that multi-channel routing is working correctly.
 * Checks for routing failures, distribution patterns, and alerts on anomalies.
 *
 * Usage:
 *   node .github/scripts/verify-job-distribution.js [--days=7]
 *
 * Arguments:
 *   --days=N    Number of days to analyze (default: 7)
 *   --verbose   Show detailed per-job routing information
 *
 * Output:
 *   - Console report of job distribution across channels
 *   - Exit code 0 if healthy, 1 if critical issues detected
 */

const fs = require('fs');
const path = require('path');
const { getBoardConfig, BOARD_TYPES } = require('./src/board-types');

// Configuration
const BOARD_TYPE = process.env.BOARD_TYPE || BOARD_TYPES.NEW_GRAD;
const DAYS_TO_ANALYZE = parseInt(process.argv.find(arg => arg.startsWith('--days='))?.split('=')[1] || '7', 10);
const VERBOSE = process.argv.includes('--verbose');

// Thresholds
const MIN_JOBS_PER_DAY = 5;  // Alert if fewer than this per day
const MAX_FAILURE_RATE = 0.1;  // Alert if >10% failure rate
const MIN_MULTI_CHANNEL_RATE = 0.2;  // Alert if <20% of jobs go to multiple channels

/**
 * Find and read Discord posting logs
 */
function findLogFiles(daysBack = 7) {
  const logsDir = path.join(process.cwd(), '.github', 'data', 'metrics');
  const files = [];

  if (!fs.existsSync(logsDir)) {
    console.warn(`⚠️  Logs directory not found: ${logsDir}`);
    return files;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  // Find all discord-*.jsonl files
  const allFiles = fs.readdirSync(logsDir);
  const discordLogs = allFiles.filter(f => f.startsWith('discord-') && f.endsWith('.jsonl'));

  for (const file of discordLogs) {
    const filePath = path.join(logsDir, file);
    const stats = fs.statSync(filePath);

    // Include file if modified within the time range
    if (stats.mtime >= cutoffDate) {
      files.push(filePath);
    }
  }

  return files;
}

/**
 * Parse JSONL log files
 */
function parseLogFiles(files) {
  const events = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          events.push(event);
        } catch (parseError) {
          console.warn(`⚠️  Failed to parse line in ${file}: ${parseError.message}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Failed to read file ${file}: ${error.message}`);
    }
  }

  return events;
}

/**
 * Analyze job distribution
 */
function analyzeDistribution(events) {
  const stats = {
    totalEvents: events.length,
    totalJobs: 0,
    successfulPosts: 0,
    failedPosts: 0,
    skippedPosts: 0,
    channelDistribution: {},
    jobsToMultipleChannels: 0,
    errors: [],
    dateRange: {
      earliest: null,
      latest: null
    }
  };

  // Track which jobs went to multiple channels
  const jobChannelMap = {};  // jobId -> [channelIds]

  for (const event of events) {
    // Update date range
    if (event.timestamp) {
      const eventDate = new Date(event.timestamp);
      if (!stats.dateRange.earliest || eventDate < stats.dateRange.earliest) {
        stats.dateRange.earliest = eventDate;
      }
      if (!stats.dateRange.latest || eventDate > stats.dateRange.latest) {
        stats.dateRange.latest = eventDate;
      }
    }

    // Track by type
    if (event.type === 'discord') {
      // Aggregate metrics
      stats.totalJobs += event.total_posted || 0;
      stats.failedPosts += event.total_failed || 0;
    } else {
      // Individual post events (from discord-post-logger.js or routing-logger.js)
      if (event.status === 'SUCCESS' || event.result === 'posted') {
        stats.successfulPosts++;

        // Track channel distribution
        const channelName = event.channel_name || event.primaryChannel || 'unknown';
        stats.channelDistribution[channelName] = (stats.channelDistribution[channelName] || 0) + 1;

        // Track multi-channel routing
        const jobId = event.jobId || event.job_id;
        if (jobId) {
          if (!jobChannelMap[jobId]) {
            jobChannelMap[jobId] = new Set();
          }
          jobChannelMap[jobId].add(channelName);

          // Also track additional channels if present
          if (event.additionalChannels && Array.isArray(event.additionalChannels)) {
            event.additionalChannels.forEach(ch => jobChannelMap[jobId].add(ch));
          }
        }
      } else if (event.status === 'FAILED' || event.result === 'failed') {
        stats.failedPosts++;

        // Track error
        stats.errors.push({
          jobId: event.jobId || event.job_id,
          company: event.company,
          title: event.title,
          error: event.error_message || event.error,
          timestamp: event.timestamp
        });
      } else if (event.status === 'SKIPPED' || event.result === 'skipped') {
        stats.skippedPosts++;
      }
    }
  }

  // Count jobs that went to multiple channels
  stats.jobsToMultipleChannels = Object.values(jobChannelMap).filter(channels => channels.size > 1).length;
  stats.totalUniqueJobs = Object.keys(jobChannelMap).length;
  stats.multiChannelRate = stats.totalUniqueJobs > 0
    ? stats.jobsToMultipleChannels / stats.totalUniqueJobs
    : 0;

  return stats;
}

/**
 * Generate distribution report
 */
function generateReport(stats) {
  console.log('\n' + '='.repeat(80));
  console.log('Job Distribution Verification Report');
  console.log('Board Type:', BOARD_TYPE);
  console.log('Analysis Period:', DAYS_TO_ANALYZE, 'days');
  console.log('Generated:', new Date().toISOString());
  console.log('='.repeat(80) + '\n');

  // Date range
  if (stats.dateRange.earliest && stats.dateRange.latest) {
    console.log('📅 Date Range:');
    console.log(`   Earliest: ${stats.dateRange.earliest.toISOString()}`);
    console.log(`   Latest: ${stats.dateRange.latest.toISOString()}`);
    const daysCovered = Math.ceil((stats.dateRange.latest - stats.dateRange.earliest) / (1000 * 60 * 60 * 24));
    console.log(`   Days Covered: ${daysCovered}`);
    console.log('');
  }

  // Summary statistics
  console.log('📊 Summary:');
  console.log(`   Total Events: ${stats.totalEvents}`);
  console.log(`   Unique Jobs: ${stats.totalUniqueJobs}`);
  console.log(`   Successful Posts: ${stats.successfulPosts}`);
  console.log(`   Failed Posts: ${stats.failedPosts}`);
  console.log(`   Skipped Posts: ${stats.skippedPosts}`);
  console.log('');

  // Multi-channel routing
  console.log('🔀 Multi-Channel Routing:');
  console.log(`   Jobs Posted to Multiple Channels: ${stats.jobsToMultipleChannels}`);
  console.log(`   Multi-Channel Rate: ${(stats.multiChannelRate * 100).toFixed(1)}%`);
  if (stats.multiChannelRate < MIN_MULTI_CHANNEL_RATE) {
    console.log(`   ⚠️  WARNING: Multi-channel rate below threshold (${MIN_MULTI_CHANNEL_RATE * 100}%)`);
  }
  console.log('');

  // Success rate
  const totalAttempts = stats.successfulPosts + stats.failedPosts;
  const successRate = totalAttempts > 0 ? stats.successfulPosts / totalAttempts : 0;
  const failureRate = totalAttempts > 0 ? stats.failedPosts / totalAttempts : 0;

  console.log('📈 Success Metrics:');
  console.log(`   Total Posting Attempts: ${totalAttempts}`);
  console.log(`   Success Rate: ${(successRate * 100).toFixed(1)}%`);
  console.log(`   Failure Rate: ${(failureRate * 100).toFixed(1)}%`);
  if (failureRate > MAX_FAILURE_RATE) {
    console.log(`   🚨 CRITICAL: Failure rate above threshold (${MAX_FAILURE_RATE * 100}%)`);
  }
  console.log('');

  // Channel distribution
  console.log('📍 Channel Distribution:');
  const sortedChannels = Object.entries(stats.channelDistribution)
    .sort((a, b) => b[1] - a[1]);

  if (sortedChannels.length === 0) {
    console.log('   ⚠️  No channel distribution data available');
  } else {
    const maxChannelNameLength = Math.max(...sortedChannels.map(([name]) => name.length), 10);
    sortedChannels.forEach(([channel, count]) => {
      const percentage = totalAttempts > 0 ? (count / totalAttempts * 100).toFixed(1) : '0.0';
      const bar = '█'.repeat(Math.min(Math.floor(count / 10), 50));
      console.log(`   ${channel.padEnd(maxChannelNameLength)} : ${count.toString().padStart(4)} (${percentage.padStart(5)}%) ${bar}`);
    });
  }
  console.log('');

  // Errors
  if (stats.errors.length > 0) {
    console.log('🚨 Recent Errors:');
    const recentErrors = stats.errors.slice(-10);  // Show last 10 errors
    recentErrors.forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.company} - ${err.title}`);
      console.log(`      Error: ${err.error}`);
      console.log(`      Time: ${err.timestamp}`);
      if (err.jobId) {
        console.log(`      Job ID: ${err.jobId}`);
      }
      console.log('');
    });

    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more errors`);
      console.log('');
    }
  }

  // Jobs per day
  if (stats.dateRange.earliest && stats.dateRange.latest) {
    const daysCovered = Math.max(1, Math.ceil((stats.dateRange.latest - stats.dateRange.earliest) / (1000 * 60 * 60 * 24)));
    const jobsPerDay = stats.totalUniqueJobs / daysCovered;
    console.log('📊 Activity:');
    console.log(`   Jobs Per Day (avg): ${jobsPerDay.toFixed(1)}`);
    if (jobsPerDay < MIN_JOBS_PER_DAY) {
      console.log(`   ⚠️  WARNING: Below expected threshold (${MIN_JOBS_PER_DAY} jobs/day)`);
    }
    console.log('');
  }

  // Health assessment
  console.log('='.repeat(80));
  const issues = [];

  if (failureRate > MAX_FAILURE_RATE) {
    issues.push(`High failure rate: ${(failureRate * 100).toFixed(1)}%`);
  }

  if (stats.multiChannelRate < MIN_MULTI_CHANNEL_RATE && stats.totalUniqueJobs > 10) {
    issues.push(`Low multi-channel routing: ${(stats.multiChannelRate * 100).toFixed(1)}%`);
  }

  if (stats.dateRange.earliest && stats.dateRange.latest) {
    const daysCovered = Math.max(1, Math.ceil((stats.dateRange.latest - stats.dateRange.earliest) / (1000 * 60 * 60 * 24)));
    const jobsPerDay = stats.totalUniqueJobs / daysCovered;
    if (jobsPerDay < MIN_JOBS_PER_DAY) {
      issues.push(`Low activity: ${jobsPerDay.toFixed(1)} jobs/day`);
    }
  }

  if (issues.length > 0) {
    console.log('❌ VERIFICATION FAILED');
    console.log('\nIssues Detected:');
    issues.forEach((issue, idx) => {
      console.log(`  ${idx + 1}. ${issue}`);
    });
    return 1;
  } else {
    console.log('✅ VERIFICATION PASSED: Job distribution healthy');
    return 0;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Starting Job Distribution Verification...');
  console.log(`   Board Type: ${BOARD_TYPE}`);
  console.log(`   Days to Analyze: ${DAYS_TO_ANALYZE}`);
  console.log('');

  // Find log files
  console.log('📂 Scanning for log files...');
  const logFiles = findLogFiles(DAYS_TO_ANALYZE);

  if (logFiles.length === 0) {
    console.warn('⚠️  WARNING: No log files found');
    console.log('\nThis could mean:');
    console.log('  1. No jobs have been posted yet');
    console.log('  2. Logs directory does not exist');
    console.log('  3. No logs within the specified time range');
    console.log('\nSkipping analysis.');
    process.exit(0);
  }

  console.log(`✅ Found ${logFiles.length} log file(s)`);
  logFiles.forEach(f => console.log(`   - ${path.basename(f)}`));
  console.log('');

  // Parse log files
  console.log('📖 Parsing log files...');
  const events = parseLogFiles(logFiles);
  console.log(`✅ Parsed ${events.length} events`);
  console.log('');

  if (events.length === 0) {
    console.warn('⚠️  WARNING: No events found in log files');
    process.exit(0);
  }

  // Analyze distribution
  console.log('📊 Analyzing job distribution...');
  const stats = analyzeDistribution(events);
  console.log('✅ Analysis complete');

  // Generate report
  const exitCode = generateReport(stats);
  process.exit(exitCode);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, findLogFiles, parseLogFiles, analyzeDistribution };
