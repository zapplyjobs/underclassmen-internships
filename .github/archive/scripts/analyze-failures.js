#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/posted_jobs.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Find true failures (no V1 threadId, no V2 discordPosts)
const failures = data.jobs.filter(job => {
  const hasV1 = job.discordThreadId;
  const hasV2 = job.discordPosts && Object.keys(job.discordPosts).length > 0;
  return !hasV1 && !hasV2;
});

console.log('=== TRUE FAILURES ANALYSIS ===\n');
console.log(`Total failures: ${failures.length} / ${data.jobs.length} (${(failures.length / data.jobs.length * 100).toFixed(2)}%)`);

// Group by company
const byCompany = {};
failures.forEach(job => {
  const company = job.company || 'Unknown';
  if (!byCompany[company]) {
    byCompany[company] = [];
  }
  byCompany[company].push(job);
});

console.log('\n=== TOP 10 COMPANIES BY FAILURE COUNT ===\n');
const sortedCompanies = Object.entries(byCompany)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 10);

sortedCompanies.forEach(([company, jobs]) => {
  console.log(`${company}: ${jobs.length} failures`);
});

// Check for duplicates (same company + title)
console.log('\n=== DUPLICATE CHECK ===\n');
const duplicates = {};
failures.forEach(job => {
  const key = `${job.company}|||${job.title}`;
  if (!duplicates[key]) {
    duplicates[key] = [];
  }
  duplicates[key].push(job);
});

const actualDuplicates = Object.entries(duplicates)
  .filter(([key, jobs]) => jobs.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

if (actualDuplicates.length > 0) {
  console.log(`Found ${actualDuplicates.length} duplicate job postings:\n`);
  actualDuplicates.slice(0, 5).forEach(([key, jobs]) => {
    const [company, title] = key.split('|||');
    console.log(`- ${company} - "${title}" (${jobs.length} times)`);
  });
} else {
  console.log('No duplicates found - each failure is unique');
}

// Check location patterns
console.log('\n=== LOCATION PATTERNS ===\n');
const locationCounts = {};
failures.forEach(job => {
  const loc = job.location || 'Unknown';
  locationCounts[loc] = (locationCounts[loc] || 0) + 1;
});

const topLocations = Object.entries(locationCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

topLocations.forEach(([location, count]) => {
  console.log(`${location}: ${count} jobs`);
});

// Sample failures
console.log('\n=== SAMPLE FAILURES (First 5) ===\n');
failures.slice(0, 5).forEach((job, i) => {
  console.log(`${i + 1}. ${job.company} - ${job.title}`);
  console.log(`   Location: ${job.location || 'N/A'}`);
  console.log(`   Job ID: ${job.jobId}`);
  console.log(`   Posted at: ${job.postedToDiscord || 'N/A'}`);
  console.log('');
});

// Check if these are recent failures
console.log('=== TEMPORAL ANALYSIS ===\n');
const recentCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
const recentFailures = failures.filter(job => {
  if (!job.postedToDiscord) return false;
  return new Date(job.postedToDiscord) > recentCutoff;
});

console.log(`Recent failures (last 7 days): ${recentFailures.length} / ${failures.length}`);
console.log(`Old failures (>7 days ago): ${failures.length - recentFailures.length} / ${failures.length}`);

if (recentFailures.length === 0) {
  console.log('\n✅ No recent failures! All failures are historical (>7 days old)');
  console.log('   This suggests the fix is working correctly.');
}

console.log('\n=== ANALYSIS COMPLETE ===');
