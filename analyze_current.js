const fs = require('fs');

const data = JSON.parse(fs.readFileSync('.github/data/posted_jobs.json', 'utf8'));

// Get current date and 7 days ago
const now = new Date();
const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

// Filter current jobs (same logic as readme-generator)
function isJobOlderThanWeek(job) {
  const postedDate = new Date(job.sourceDate || job.postedToDiscord);
  const daysDiff = Math.floor((weekAgo - postedDate) / (1000 * 60 * 60 * 24));
  return daysDiff >= 0;
}

const currentJobs = data.jobs.filter(job => !isJobOlderThanWeek(job));

const companies = {};
currentJobs.forEach(j => {
  const company = j.company || j.employer_name || 'Unknown';
  companies[company] = (companies[company] || 0) + 1;
});

const sorted = Object.entries(companies).sort((a,b) => b[1] - a[1]);

console.log('Current jobs (<7 days):', currentJobs.length);
console.log('Total companies in current jobs:', sorted.length);
console.log('\nAll companies with current jobs:');
sorted.forEach(([company, num]) => {
  console.log(`  ${company}: ${num}`);
});
