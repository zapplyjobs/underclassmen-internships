#!/usr/bin/env node

/**
 * Workflow Health Report Script
 *
 * Analyzes job posting success rate and identifies jobs not posted to Discord.
 *
 * Critical Issue Context:
 * - 55% of jobs (615/1,127) are not posting to ANY Discord channels
 * - This script provides visibility into posting health before we fix the underlying bug
 *
 * Usage:
 *   node .github/scripts/workflow-health-report.js
 *
 * Output:
 *   - Console report (for local runs)
 *   - GitHub Step Summary (when run in GitHub Actions)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DATA_DIR = path.join(__dirname, '../../.github/data');
const POSTED_JOBS_FILE = path.join(DATA_DIR, 'posted_jobs.json');
const OUTPUT_DIR = DATA_DIR;
const REPORT_FILE = path.join(OUTPUT_DIR, 'health-report.json');

/**
 * Load jobs data from posted_jobs.json
 * This file contains the actual Discord posting status for each job
 */
function loadJobs() {
  if (!fs.existsSync(POSTED_JOBS_FILE)) {
    console.error(`❌ Posted jobs file not found: ${POSTED_JOBS_FILE}`);
    process.exit(1);
  }

  try {
    console.log('📂 Loading posted jobs database...');
    const data = JSON.parse(fs.readFileSync(POSTED_JOBS_FILE, 'utf8'));

    // Handle both object with .jobs property and direct array
    const jobs = data.jobs || data;

    if (!Array.isArray(jobs)) {
      console.error('❌ Unexpected format: posted_jobs.json does not contain jobs array');
      process.exit(1);
    }

    console.log(`✅ Loaded ${jobs.length} jobs\n`);
    return jobs;
  } catch (error) {
    console.error(`❌ Failed to load posted jobs: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Analyze posting health
 * @param {Array} jobs - All jobs from posted_jobs.json
 * @param {boolean} last24hOnly - If true, only analyze jobs from last 24 hours
 */
function analyzePostingHealth(jobs, last24hOnly = false) {
  // Filter to last 24 hours if requested
  let analyzedJobs = jobs;
  if (last24hOnly) {
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    analyzedJobs = jobs.filter(j => {
      const postedDate = j.postedToDiscord || j.datePosted || j.date_posted;
      if (!postedDate) return false;
      return (now - new Date(postedDate)) < TWENTY_FOUR_HOURS;
    });
    console.log(`📅 Filtering to last 24 hours: ${analyzedJobs.length} of ${jobs.length} jobs\n`);
  }

  const totalJobs = analyzedJobs.length;

  // Jobs with V2 schema (discordPosts object)
  const jobsWithDiscordPosts = analyzedJobs.filter(job =>
    job.discordPosts && Object.keys(job.discordPosts).length > 0
  );

  // Jobs with V1 schema (discordThreadId) - includes transition jobs with both schemas
  // During V1→V2 migration, some jobs had discordThreadId + empty discordPosts{}
  // These are SUCCESSFUL posts using V1 schema, not failures
  const jobsWithLegacyPost = analyzedJobs.filter(job =>
    job.discordThreadId && (!job.discordPosts || Object.keys(job.discordPosts).length === 0)
  );

  // Jobs with empty discordPosts AND no discordThreadId (TRUE FAILURES)
  const jobsWithZeroChannels = analyzedJobs.filter(job =>
    job.discordPosts && Object.keys(job.discordPosts).length === 0 && !job.discordThreadId
  );

  // Jobs with no schema at all (never processed)
  const jobsNeverProcessed = analyzedJobs.filter(job =>
    !job.discordPosts && !job.discordThreadId
  );

  const postedJobs = jobsWithDiscordPosts.length + jobsWithLegacyPost.length;
  const unpostedJobs = jobsWithZeroChannels.length + jobsNeverProcessed.length;

  // Channel distribution analysis
  const channelDistribution = {};
  jobsWithDiscordPosts.forEach(job => {
    Object.keys(job.discordPosts).forEach(channel => {
      channelDistribution[channel] = (channelDistribution[channel] || 0) + 1;
    });
  });

  // Company distribution for jobs with zero channels (the bug)
  const companiesAffected = {};
  jobsWithZeroChannels.forEach(job => {
    const company = job.company_name || job.company || 'Unknown';
    companiesAffected[company] = (companiesAffected[company] || 0) + 1;
  });

  return {
    totalJobs,
    postedJobs,
    unpostedJobs,
    postingRate: ((postedJobs / totalJobs) * 100).toFixed(2),
    jobsWithDiscordPosts: jobsWithDiscordPosts.length,
    jobsWithZeroChannels: jobsWithZeroChannels.length,
    jobsWithLegacyPost: jobsWithLegacyPost.length,
    jobsNeverProcessed: jobsNeverProcessed.length,
    channelDistribution,
    companiesAffected,
    unpostedJobsSample: jobsWithZeroChannels.slice(0, 10).map(job => ({
      id: job.id,
      company: job.company_name || job.company,
      title: job.title || job.job_title,
      city: job.job_city || 'N/A',
      state: job.job_state || 'N/A',
      datePosted: job.date_posted || job.date_added
    }))
  };
}

/**
 * Generate console report
 */
function generateConsoleReport(analysis) {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('          WORKFLOW HEALTH REPORT');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📊 OVERALL HEALTH:');
  console.log(`   Total Jobs: ${analysis.totalJobs}`);
  console.log(`   Posted to Discord: ${analysis.postedJobs} (${analysis.postingRate}%)`);
  console.log(`   Not Posted: ${analysis.unpostedJobs} (${(100 - analysis.postingRate).toFixed(2)}%)`);
  console.log('');

  console.log('📈 POSTING BREAKDOWN:');
  console.log(`   V2 Multi-Channel Posts: ${analysis.jobsWithDiscordPosts}`);
  console.log(`   V1 Legacy Posts: ${analysis.jobsWithLegacyPost}`);
  console.log(`   ❌ Zero Channels (BUG): ${analysis.jobsWithZeroChannels}`);
  console.log(`   Never Processed: ${analysis.jobsNeverProcessed}`);
  console.log('');

  console.log('📍 CHANNEL DISTRIBUTION:');
  if (Object.keys(analysis.channelDistribution).length > 0) {
    Object.entries(analysis.channelDistribution)
      .sort(([, a], [, b]) => b - a)
      .forEach(([channel, count]) => {
        console.log(`   ${channel}: ${count} jobs`);
      });
  } else {
    console.log('   (No channel data available)');
  }
  console.log('');

  if (analysis.jobsWithZeroChannels > 0) {
    console.log('🚨 CRITICAL: JOBS WITH ZERO CHANNELS (first 10):');
    analysis.unpostedJobsSample.forEach((job, idx) => {
      console.log(`   ${idx + 1}. ${job.company} - ${job.title}`);
      console.log(`      Location: ${job.city}, ${job.state}`);
      console.log(`      Date Posted: ${job.datePosted}`);
    });
    if (analysis.jobsWithZeroChannels > 10) {
      console.log(`   ... and ${analysis.jobsWithZeroChannels - 10} more\n`);
    }
    console.log('');

    console.log('📊 TOP AFFECTED COMPANIES:');
    Object.entries(analysis.companiesAffected)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([company, count]) => {
        console.log(`   ${company}: ${count} jobs`);
      });
    console.log('');
  }

  // Health status
  const healthStatus = analysis.postingRate >= 90 ? '✅ HEALTHY'
    : analysis.postingRate >= 70 ? '⚠️  DEGRADED'
    : '❌ CRITICAL';

  console.log(`🏥 HEALTH STATUS: ${healthStatus}`);
  console.log('═══════════════════════════════════════════════════════\n');
}

/**
 * Generate GitHub Step Summary (markdown)
 */
function generateGitHubSummary(analysis) {
  const summary = [
    '# 📊 Workflow Health Report',
    '',
    '## Overall Health',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| Total Jobs | ${analysis.totalJobs} |`,
    `| Posted to Discord | ${analysis.postedJobs} (${analysis.postingRate}%) |`,
    `| Not Posted | ${analysis.unpostedJobs} (${(100 - analysis.postingRate).toFixed(2)}%) |`,
    '',
    '## Posting Breakdown',
    '',
    '| Type | Count |',
    '|------|-------|',
    `| V2 Multi-Channel Posts | ${analysis.jobsWithDiscordPosts} |`,
    `| V1 Legacy Posts | ${analysis.jobsWithLegacyPost} |`,
    `| ❌ Zero Channels (BUG) | ${analysis.jobsWithZeroChannels} |`,
    `| Never Processed | ${analysis.jobsNeverProcessed} |`,
    ''
  ];

  if (Object.keys(analysis.channelDistribution).length > 0) {
    summary.push(
      '## Channel Distribution',
      '',
      '| Channel | Jobs Posted |',
      '|---------|-------------|',
      ...Object.entries(analysis.channelDistribution)
        .sort(([, a], [, b]) => b - a)
        .map(([channel, count]) => `| ${channel} | ${count} |`),
      ''
    );
  }

  if (analysis.jobsWithZeroChannels > 0) {
    summary.push(
      '## 🚨 CRITICAL: Jobs with Zero Channels',
      '',
      `**${analysis.jobsWithZeroChannels} jobs** have empty \`discordPosts\` object (posted to 0 channels)`,
      '',
      '### Sample Jobs (first 10)',
      '',
      '| Company | Title | Location | Date |',
      '|---------|-------|----------|------|',
      ...analysis.unpostedJobsSample.map(job =>
        `| ${job.company} | ${job.title} | ${job.city}, ${job.state} | ${job.datePosted} |`
      ),
      ''
    );

    summary.push(
      '### Top Affected Companies',
      '',
      '| Company | Jobs with Zero Channels |',
      '|---------|------------------------|',
      ...Object.entries(analysis.companiesAffected)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([company, count]) => `| ${company} | ${count} |`),
      ''
    );
  }

  // Health badge
  const healthStatus = analysis.postingRate >= 90 ? '🟢 HEALTHY'
    : analysis.postingRate >= 70 ? '🟡 DEGRADED'
    : '🔴 CRITICAL';

  summary.push(
    '## Health Status',
    '',
    `### ${healthStatus}`,
    ''
  );

  return summary.join('\n');
}

/**
 * Save report to file
 */
function saveReport(analysis) {
  const report = {
    timestamp: new Date().toISOString(),
    ...analysis
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`✅ Report saved to: ${REPORT_FILE}`);
}

/**
 * Write to GitHub Step Summary
 */
function writeGitHubSummary(summary) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, summary);
    console.log('✅ GitHub Step Summary updated');
  }
}

/**
 * Main execution
 */
function main() {
  // Check for command-line flags
  const args = process.argv.slice(2);
  const last24hOnly = args.includes('--last-24h') || args.includes('--24h');

  console.log('🔍 Loading jobs data...');
  const jobs = loadJobs();

  console.log('📊 Analyzing posting health...');
  const analysis = analyzePostingHealth(jobs, last24hOnly);

  // Generate reports
  generateConsoleReport(analysis);
  saveReport(analysis);

  // Generate GitHub summary if running in Actions
  if (process.env.GITHUB_ACTIONS) {
    const summary = generateGitHubSummary(analysis);
    writeGitHubSummary(summary);
  }

  // Exit with error code if health is critical
  if (analysis.postingRate < 70) {
    console.error('❌ Health check failed: Posting rate below 70%');
    process.exit(1);
  }

  console.log('✅ Health check complete');
}

// Run the script
main();
