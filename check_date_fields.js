// Check if jobs have job_posted_at_datetime_utc field
const fs = require('fs');
const jobs = JSON.parse(fs.readFileSync('.github/data/posted_jobs.json', 'utf8')).jobs;

// Since we can't check the actual currentJobs from processJobs,
// let's check the ATS jobs which have job_posted_at_datetime_utc

console.log('Total jobs in database:', jobs.length);

// Check for job_posted_at_datetime_utc field (note: database uses different field names)
const withSourceDate = jobs.filter(j => j.sourceDate).length;
const withoutSourceDate = jobs.filter(j => !j.sourceDate).length;

console.log('Jobs with sourceDate:', withSourceDate);
console.log('Jobs without sourceDate:', withoutSourceDate);

// The database doesn't have job_posted_at_datetime_utc - it uses sourceDate
// So the issue must be in how jobs are transformed before reaching the readme

console.log('\nDatabase schema fields:');
console.log(Object.keys(jobs[0]));

// Check Anthropic specifically
const anthropicJobs = jobs.filter(j => (j.company || '').toLowerCase() === 'anthropic');
console.log('\nAnthropic jobs in database:', anthropicJobs.length);
console.log('First Anthropic job fields:', Object.keys(anthropicJobs[0]));
