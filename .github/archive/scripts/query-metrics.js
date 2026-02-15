#!/usr/bin/env node

/**
 * Metrics Query Tool
 *
 * Quick CLI tool for Claude to query job posting metrics.
 * Reads from .github/data/metrics/latest.json
 *
 * Commands:
 *   --channels           Show jobs per channel
 *   --multi-channel      Show multi-channel routing
 *   --failures           Show all failures
 *   --filtered           Show filtered jobs breakdown
 *   --job=<id>           Show specific job routing
 *   --channel=<name>     Show jobs for specific channel
 *   --last-24h           Filter to last 24 hours only
 *   --summary            Show high-level summary (default)
 *   --json               Output raw JSON
 *
 * Examples:
 *   node query-metrics.js --channels
 *   node query-metrics.js --multi-channel --last-24h
 *   node query-metrics.js --job=jobs-smartrecruiters-com-google-12345
 *   node query-metrics.js --channel=tech-jobs
 *   node query-metrics.js --failures
 */

const fs = require('fs');
const path = require('path');

// Load latest metrics
function loadLatestMetrics() {
  const metricsPath = path.join(process.cwd(), '.github', 'data', 'metrics', 'latest.json');

  if (!fs.existsSync(metricsPath)) {
    console.error('❌ Metrics not found. Run generate-metrics-report.js first.');
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(metricsPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Error loading metrics:', error.message);
    process.exit(1);
  }
}

// Filter by time range
function filterByTimeRange(items, hours, timestampField = 'timestamp') {
  const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));

  return items.filter(item => {
    const timestamp = item[timestampField] || item.posted_at;
    if (!timestamp) return false;

    const itemDate = new Date(timestamp);
    return itemDate >= cutoff;
  });
}

// Show summary
function showSummary(metrics) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 METRICS SUMMARY');
  console.log('='.repeat(60));

  console.log(`\n📅 Period: ${metrics.period}`);
  console.log(`   From: ${new Date(metrics.period_start).toLocaleString()}`);
  console.log(`   To:   ${new Date(metrics.period_end).toLocaleString()}`);

  console.log('\n📈 Statistics:');
  console.log(`   Total postings:      ${metrics.summary.total_jobs_posted}`);
  console.log(`   Unique jobs:         ${metrics.summary.unique_jobs}`);
  console.log(`   Multi-channel jobs:  ${metrics.summary.unique_multi_channel_jobs}`);
  console.log(`   Failed postings:     ${metrics.summary.failed_postings}`);
  console.log(`   Filtered jobs:       ${metrics.summary.filtered_jobs}`);
  console.log(`   Active channels:     ${metrics.summary.channels_active}`);

  const successRate = metrics.summary.total_jobs_posted /
    (metrics.summary.total_jobs_posted + metrics.summary.failed_postings);
  console.log(`   Success rate:        ${(successRate * 100).toFixed(1)}%`);

  console.log('\n');
}

// Show channels
function showChannels(metrics, options = {}) {
  console.log('\n' + '='.repeat(60));
  console.log('📍 JOBS PER CHANNEL');
  console.log('='.repeat(60) + '\n');

  const channels = Object.entries(metrics.by_channel)
    .sort((a, b) => b[1].count - a[1].count);

  channels.forEach(([name, data]) => {
    console.log(`${name}:`);
    console.log(`   Total posts: ${data.count}`);
    console.log(`   Unique jobs: ${data.jobs.length}`);

    if (options.verbose && data.recent_jobs.length > 0) {
      console.log('   Recent jobs:');
      data.recent_jobs.slice(0, 5).forEach(job => {
        const date = new Date(job.posted_at).toLocaleString();
        console.log(`      • ${job.title} @ ${job.company} (${date})`);
      });
    }

    console.log('');
  });
}

// Show specific channel
function showChannel(metrics, channelName) {
  console.log('\n' + '='.repeat(60));
  console.log(`📍 CHANNEL: ${channelName}`);
  console.log('='.repeat(60) + '\n');

  const channelData = metrics.by_channel[channelName];

  if (!channelData) {
    console.log(`❌ Channel "${channelName}" not found.\n`);
    console.log('Available channels:');
    Object.keys(metrics.by_channel).forEach(name => {
      console.log(`   • ${name}`);
    });
    return;
  }

  console.log(`Total posts: ${channelData.count}`);
  console.log(`Unique jobs: ${channelData.jobs.length}`);
  console.log(`Channel ID:  ${channelData.channel_id}\n`);

  if (channelData.recent_jobs.length > 0) {
    console.log('Recent jobs:');
    channelData.recent_jobs.forEach(job => {
      const date = new Date(job.posted_at).toLocaleString();
      console.log(`\n   Job ID: ${job.id}`);
      console.log(`   Title:  ${job.title}`);
      console.log(`   Company: ${job.company}`);
      console.log(`   Posted:  ${date}`);
    });
  }

  console.log('\n');
}

// Show multi-channel routing
function showMultiChannelRouting(metrics, options = {}) {
  console.log('\n' + '='.repeat(60));
  console.log('🔀 MULTI-CHANNEL ROUTING');
  console.log('='.repeat(60) + '\n');

  let jobs = metrics.multi_channel_routing;

  if (options.last24h) {
    jobs = filterByTimeRange(jobs, 24, 'posted_at');
    console.log(`Filtered to last 24 hours: ${jobs.length} jobs\n`);
  }

  if (jobs.length === 0) {
    console.log('No multi-channel jobs found.\n');
    return;
  }

  console.log(`Total multi-channel jobs: ${jobs.length}\n`);

  // Group by channel count
  const byChanCount = {};
  jobs.forEach(job => {
    const count = job.channels.length;
    if (!byChanCount[count]) byChanCount[count] = [];
    byChanCount[count].push(job);
  });

  Object.keys(byChanCount)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .forEach(count => {
      console.log(`${count} channels (${byChanCount[count].length} jobs):`);
      byChanCount[count].slice(0, 5).forEach(job => {
        const date = new Date(job.posted_at).toLocaleString();
        console.log(`   • "${job.title}" @ ${job.company}`);
        console.log(`     Channels: ${job.channels.join(', ')}`);
        console.log(`     Posted: ${date}`);
      });
      if (byChanCount[count].length > 5) {
        console.log(`   ... and ${byChanCount[count].length - 5} more`);
      }
      console.log('');
    });
}

// Show failures
function showFailures(metrics, options = {}) {
  console.log('\n' + '='.repeat(60));
  console.log('❌ POSTING FAILURES');
  console.log('='.repeat(60) + '\n');

  let failures = metrics.failures;

  if (options.last24h) {
    failures = filterByTimeRange(failures, 24);
    console.log(`Filtered to last 24 hours: ${failures.length} failures\n`);
  }

  if (failures.length === 0) {
    console.log('No failures found. ✅\n');
    return;
  }

  console.log(`Total failures: ${failures.length}\n`);

  // Group by error type
  const byError = {};
  failures.forEach(fail => {
    const errorKey = fail.error_code || fail.error.substring(0, 50);
    if (!byError[errorKey]) byError[errorKey] = [];
    byError[errorKey].push(fail);
  });

  Object.entries(byError).forEach(([errorKey, fails]) => {
    console.log(`Error: ${errorKey} (${fails.length} occurrences)`);
    fails.slice(0, 3).forEach(fail => {
      const date = new Date(fail.timestamp).toLocaleString();
      console.log(`   • "${fail.title}" @ ${fail.company} → ${fail.channel}`);
      console.log(`     Job ID: ${fail.job_id}`);
      console.log(`     Time: ${date}`);
      console.log(`     Error: ${fail.error}`);
    });
    if (fails.length > 3) {
      console.log(`   ... and ${fails.length - 3} more`);
    }
    console.log('');
  });
}

// Show filtered jobs
function showFiltered(metrics) {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 FILTERED JOBS BREAKDOWN');
  console.log('='.repeat(60) + '\n');

  const filtered = metrics.filtered;

  console.log(`Total filtered: ${metrics.summary.filtered_jobs}\n`);

  console.log(`Blacklisted: ${filtered.blacklisted.length}`);
  if (filtered.blacklisted.length > 0) {
    filtered.blacklisted.slice(0, 5).forEach(job => {
      console.log(`   • "${job.title}" @ ${job.company}`);
      console.log(`     Reason: ${job.reason}`);
    });
    if (filtered.blacklisted.length > 5) {
      console.log(`   ... and ${filtered.blacklisted.length - 5} more`);
    }
  }
  console.log('');

  console.log(`Already posted: ${filtered.already_posted.length}`);
  if (filtered.already_posted.length > 0) {
    filtered.already_posted.slice(0, 5).forEach(job => {
      console.log(`   • "${job.title}" @ ${job.company}`);
    });
    if (filtered.already_posted.length > 5) {
      console.log(`   ... and ${filtered.already_posted.length - 5} more`);
    }
  }
  console.log('');

  console.log(`Invalid data: ${filtered.invalid_data.length}`);
  if (filtered.invalid_data.length > 0) {
    filtered.invalid_data.slice(0, 5).forEach(job => {
      console.log(`   • "${job.title}" @ ${job.company}`);
      console.log(`     Reason: ${job.reason}`);
    });
    if (filtered.invalid_data.length > 5) {
      console.log(`   ... and ${filtered.invalid_data.length - 5} more`);
    }
  }
  console.log('');

  console.log(`Other: ${filtered.other.length}`);
  if (filtered.other.length > 0) {
    filtered.other.slice(0, 5).forEach(job => {
      console.log(`   • "${job.title}" @ ${job.company}`);
      console.log(`     Reason: ${job.reason || 'Not specified'}`);
    });
    if (filtered.other.length > 5) {
      console.log(`   ... and ${filtered.other.length - 5} more`);
    }
  }
  console.log('');
}

// Show specific job
function showJob(metrics, jobId) {
  console.log('\n' + '='.repeat(60));
  console.log(`🔍 JOB: ${jobId}`);
  console.log('='.repeat(60) + '\n');

  // Check multi-channel routing
  const multiChannel = metrics.multi_channel_routing.find(j => j.job_id === jobId);

  if (multiChannel) {
    console.log('✅ Multi-channel job found:\n');
    console.log(`   Title:    ${multiChannel.title}`);
    console.log(`   Company:  ${multiChannel.company}`);
    console.log(`   Posted:   ${new Date(multiChannel.posted_at).toLocaleString()}`);
    console.log(`   Channels: ${multiChannel.channels.join(', ')} (${multiChannel.channels.length} total)\n`);
    return;
  }

  // Check in individual channels
  let found = false;
  Object.entries(metrics.by_channel).forEach(([channelName, data]) => {
    if (data.jobs.includes(jobId)) {
      if (!found) {
        console.log('✅ Single-channel job found:\n');
        found = true;
      }

      console.log(`   Channel: ${channelName}`);

      const jobDetail = data.recent_jobs.find(j => j.id === jobId);
      if (jobDetail) {
        console.log(`   Title:   ${jobDetail.title}`);
        console.log(`   Company: ${jobDetail.company}`);
        console.log(`   Posted:  ${new Date(jobDetail.posted_at).toLocaleString()}`);
      }
      console.log('');
    }
  });

  if (!found) {
    // Check failures
    const failure = metrics.failures.find(f => f.job_id === jobId);
    if (failure) {
      console.log('❌ Job failed to post:\n');
      console.log(`   Title:   ${failure.title}`);
      console.log(`   Company: ${failure.company}`);
      console.log(`   Channel: ${failure.channel}`);
      console.log(`   Error:   ${failure.error}`);
      console.log(`   Time:    ${new Date(failure.timestamp).toLocaleString()}\n`);
      return;
    }

    // Check filtered
    const allFiltered = [
      ...metrics.filtered.blacklisted,
      ...metrics.filtered.already_posted,
      ...metrics.filtered.invalid_data,
      ...metrics.filtered.other
    ];

    const filtered = allFiltered.find(f => f.job_id === jobId);
    if (filtered) {
      console.log('🔍 Job was filtered:\n');
      console.log(`   Title:   ${filtered.title}`);
      console.log(`   Company: ${filtered.company}`);
      console.log(`   Reason:  ${filtered.reason}`);
      console.log(`   Time:    ${new Date(filtered.timestamp).toLocaleString()}\n`);
      return;
    }

    console.log('❌ Job not found in metrics.\n');
    console.log('This could mean:');
    console.log('   • Job is older than the metrics period');
    console.log('   • Job ID is incorrect');
    console.log('   • Job was never processed\n');
  }
}

// Print help
function printHelp() {
  console.log(`
Metrics Query Tool - Query job posting metrics

Usage:
  node query-metrics.js [options]

Options:
  --summary              Show high-level summary (default)
  --channels             Show jobs per channel
  --channel=<name>       Show jobs for specific channel
  --multi-channel        Show multi-channel routing
  --failures             Show all failures
  --filtered             Show filtered jobs breakdown
  --job=<id>             Show specific job routing
  --last-24h             Filter to last 24 hours only
  --json                 Output raw JSON
  --verbose              Show detailed output

Examples:
  node query-metrics.js --summary
  node query-metrics.js --channels
  node query-metrics.js --multi-channel --last-24h
  node query-metrics.js --job=jobs-smartrecruiters-com-google-12345
  node query-metrics.js --channel=tech-jobs
  node query-metrics.js --failures
  node query-metrics.js --filtered

Note: Metrics are generated by generate-metrics-report.js
      Latest metrics: .github/data/metrics/latest.json
`);
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const metrics = loadLatestMetrics();

  const options = {
    last24h: args.includes('--last-24h'),
    verbose: args.includes('--verbose')
  };

  // Handle JSON output
  if (args.includes('--json')) {
    console.log(JSON.stringify(metrics, null, 2));
    process.exit(0);
  }

  // Handle specific commands
  if (args.includes('--channels')) {
    showChannels(metrics, options);
  } else if (args.includes('--multi-channel')) {
    showMultiChannelRouting(metrics, options);
  } else if (args.includes('--failures')) {
    showFailures(metrics, options);
  } else if (args.includes('--filtered')) {
    showFiltered(metrics);
  } else {
    // Check for --job= and --channel=
    const jobArg = args.find(a => a.startsWith('--job='));
    const channelArg = args.find(a => a.startsWith('--channel='));

    if (jobArg) {
      const jobId = jobArg.split('=')[1];
      showJob(metrics, jobId);
    } else if (channelArg) {
      const channelName = channelArg.split('=')[1];
      showChannel(metrics, channelName);
    } else {
      // Default to summary
      showSummary(metrics);
    }
  }
}

module.exports = {
  loadLatestMetrics,
  showSummary,
  showChannels,
  showChannel,
  showMultiChannelRouting,
  showFailures,
  showFiltered,
  showJob
};
