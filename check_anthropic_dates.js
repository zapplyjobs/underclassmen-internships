const fs = require('fs');
const jobs = JSON.parse(fs.readFileSync('.github/data/posted_jobs.json', 'utf8')).jobs;

// Filter for Anthropic jobs
const anthropicJobs = jobs.filter(j => j.company === 'anthropic' || j.company === 'Anthropic');

console.log('Anthropic jobs:', anthropicJobs.length);

// Check sourceDate distribution
const dateCounts = {};
anthropicJobs.forEach(j => {
  const date = j.sourceDate ? j.sourceDate.substring(0, 10) : 'null';
  dateCounts[date] = (dateCounts[date] || 0) + 1;
});

console.log('\nAnthropic jobs by date:');
Object.entries(dateCounts)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .forEach(([date, count]) => {
    console.log(`  ${date}: ${count} jobs`);
  });

// Check how many are <7 days old
const now = new Date();
const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

const currentAnthropic = anthropicJobs.filter(j => {
  const jobDate = new Date(j.sourceDate || j.postedToDiscord);
  return jobDate >= weekAgo;
});

console.log('\nCurrent Anthropic jobs (<7 days):', currentAnthropic.length);
console.log('Archived Anthropic jobs (>7 days):', anthropicJobs.length - currentAnthropic.length);

// Check postedToDiscord dates
const postedDates = {};
anthropicJobs.forEach(j => {
  const date = j.postedToDiscord ? j.postedToDiscord.substring(0, 10) : 'null';
  postedDates[date] = (postedDates[date] || 0) + 1;
});

console.log('\nAnthropic jobs by postedToDiscord date:');
Object.entries(postedDates)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .forEach(([date, count]) => {
    console.log(`  ${date}: ${count} jobs`);
  });
