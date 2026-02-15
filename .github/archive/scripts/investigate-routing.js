#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load routing logic (simplified version)
const dataPath = path.join(__dirname, '../data/posted_jobs.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Find true failures
const failures = data.jobs.filter(job => {
  const hasV1 = job.discordThreadId;
  const hasV2 = job.discordPosts && Object.keys(job.discordPosts).length > 0;
  return !hasV1 && !hasV2;
});

console.log('=== ROUTING FAILURE INVESTIGATION ===\n');

// Check what location data looks like
console.log('Sample failure locations (raw data):');
failures.slice(0, 10).forEach((job, i) => {
  console.log(`${i + 1}. ${job.company}`);
  console.log(`   title: "${job.title}"`);
  console.log(`   location: ${JSON.stringify(job.location)}`);
  console.log(`   url: ${job.url}`);
  console.log('');
});

// Check if these jobs have ANY routing metadata
console.log('\n=== ROUTING METADATA CHECK ===\n');
const sample = failures[0];
console.log('Sample job (full object keys):');
console.log(Object.keys(sample).join(', '));

console.log('\n\nSample job (relevant fields):');
console.log({
  jobId: sample.jobId,
  company: sample.company,
  title: sample.title,
  location: sample.location,
  url: sample.url,
  postedToDiscord: sample.postedToDiscord,
  discordPosts: sample.discordPosts,
  discordThreadId: sample.discordThreadId,
});

// Check if location is the issue
console.log('\n\n=== HYPOTHESIS: Location Missing ===\n');
const missingLocation = failures.filter(job => !job.location || job.location === 'N/A' || job.location === 'Unknown');
console.log(`Jobs with missing/invalid location: ${missingLocation.length} / ${failures.length} (${(missingLocation.length / failures.length * 100).toFixed(1)}%)`);

if (missingLocation.length === failures.length) {
  console.log('\n✅ CONFIRMED: ALL failures have missing location data');
  console.log('   This suggests routing requires location, and these jobs lack it.');
}

// Check company patterns
console.log('\n\n=== COMPANY ANALYSIS ===\n');
const topFailingCompanies = ['brex', 'samsara', 'datadog', 'reddit', 'ByteDance'];
topFailingCompanies.forEach(company => {
  const companyJobs = data.jobs.filter(j => j.company === company);
  const companyFailures = failures.filter(j => j.company === company);
  const successRate = ((companyJobs.length - companyFailures.length) / companyJobs.length * 100).toFixed(1);
  console.log(`${company}: ${companyFailures.length} failures / ${companyJobs.length} total (${100 - successRate}% fail rate)`);
});

console.log('\n\n=== RECOMMENDATION ===\n');
console.log('Next steps:');
console.log('1. Check why location data is missing for these jobs');
console.log('2. Look at job scraper/fetcher - is it extracting location?');
console.log('3. Check routing logic - does it have a fallback for missing location?');
console.log('4. Consider: Should jobs without location route to "other-usa-jobs"?');
