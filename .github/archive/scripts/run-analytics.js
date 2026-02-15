#!/usr/bin/env node
/**
 * Run Analytics Report
 *
 * Generates keyword and location frequency analysis from archived job data.
 *
 * Usage:
 *   node .github/scripts/run-analytics.js [days]
 *
 * Examples:
 *   node .github/scripts/run-analytics.js        # Last 30 days (default)
 *   node .github/scripts/run-analytics.js 7      # Last 7 days
 *   node .github/scripts/run-analytics.js 90     # Last 90 days
 */

const { getAnalyticsSummary, loadCurrentArchive, ensureAnalyticsDir } = require('./src/data/analytics-archive');
const fs = require('fs');
const path = require('path');

// Parse command line args
const daysBack = parseInt(process.argv[2]) || 30;

console.log('═'.repeat(70));
console.log(`JOB ANALYTICS REPORT - Last ${daysBack} days`);
console.log('═'.repeat(70));

// Try to get summary
try {
  const summary = getAnalyticsSummary(daysBack);

  if (summary.totalJobs === 0) {
    console.log('\n⚠️  No jobs found in analytics archive.');
    console.log('   Archive will populate automatically on next workflow run.');

    // Check if archive directory exists
    const analyticsDir = path.join(process.cwd(), '.github', 'data', 'analytics');
    if (!fs.existsSync(analyticsDir)) {
      console.log('\n📁 Analytics directory does not exist yet.');
      console.log('   It will be created on next job processing run.');
    } else {
      const files = fs.readdirSync(analyticsDir);
      console.log(`\n📁 Analytics directory exists with ${files.length} file(s):`);
      files.forEach(f => console.log(`   - ${f}`));
    }

    process.exit(0);
  }

  console.log(`\n📊 Total jobs in range: ${summary.totalJobs}`);
  console.log(`📅 Date range: ${summary.dateRange.from.split('T')[0]} to ${summary.dateRange.to.split('T')[0]}`);

  // Title Keywords
  console.log('\n\n### TITLE KEYWORDS (Top 30)');
  console.log('-'.repeat(50));
  console.log(`${'Keyword'.padEnd(25)} ${'Count'.padStart(8)} ${'%'.padStart(8)}`);
  console.log('-'.repeat(50));

  for (const { key, count } of summary.titleKeywords) {
    const pct = ((count / summary.totalJobs) * 100).toFixed(1);
    console.log(`${key.padEnd(25)} ${String(count).padStart(8)} ${(pct + '%').padStart(8)}`);
  }

  // Locations
  console.log('\n\n### LOCATIONS (Top 20)');
  console.log('-'.repeat(50));
  console.log(`${'Location'.padEnd(30)} ${'Count'.padStart(8)} ${'%'.padStart(8)}`);
  console.log('-'.repeat(50));

  for (const { key, count } of summary.locations) {
    const pct = ((count / summary.totalJobs) * 100).toFixed(1);
    console.log(`${key.substring(0, 30).padEnd(30)} ${String(count).padStart(8)} ${(pct + '%').padStart(8)}`);
  }

  // Companies
  console.log('\n\n### TOP COMPANIES (Top 20)');
  console.log('-'.repeat(50));
  console.log(`${'Company'.padEnd(35)} ${'Count'.padStart(8)} ${'%'.padStart(8)}`);
  console.log('-'.repeat(50));

  for (const { key, count } of summary.companies) {
    const pct = ((count / summary.totalJobs) * 100).toFixed(1);
    console.log(`${key.substring(0, 35).padEnd(35)} ${String(count).padStart(8)} ${(pct + '%').padStart(8)}`);
  }

  // Channel Distribution
  if (summary.channels.length > 0) {
    console.log('\n\n### CHANNEL DISTRIBUTION');
    console.log('-'.repeat(50));
    console.log(`${'Channel'.padEnd(25)} ${'Count'.padStart(8)} ${'%'.padStart(8)}`);
    console.log('-'.repeat(50));

    for (const { key, count } of summary.channels) {
      const pct = ((count / summary.totalJobs) * 100).toFixed(1);
      console.log(`${key.padEnd(25)} ${String(count).padStart(8)} ${(pct + '%').padStart(8)}`);
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('Report complete.');

} catch (error) {
  console.error('❌ Error generating analytics:', error.message);
  process.exit(1);
}
