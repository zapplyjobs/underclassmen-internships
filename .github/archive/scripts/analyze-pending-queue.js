#!/usr/bin/env node

const pending = require('../data/pending_posts.json');
const posted = require('../data/posted_jobs.json');

console.log('=== PENDING QUEUE ANALYSIS ===\n');
console.log('Total in queue:', pending.length);

const now = new Date();
const ages = pending.map(p => {
  const added = new Date(p.addedAt);
  const hours = (now - added) / (1000 * 60 * 60);
  return {
    job: p.job.job_title,
    company: p.job.employer_name,
    hoursOld: hours.toFixed(1),
    jobId: p.job.id
  };
});

ages.sort((a, b) => parseFloat(b.hoursOld) - parseFloat(a.hoursOld));

console.log('\nOldest 5 jobs:');
ages.slice(0, 5).forEach((a, i) => {
  console.log(`${i+1}. ${a.hoursOld}h old - ${a.job} @ ${a.company}`);
});

console.log('\nNewest 5 jobs:');
ages.slice(-5).reverse().forEach((a, i) => {
  console.log(`${i+1}. ${a.hoursOld}h old - ${a.job} @ ${a.company}`);
});

// Check if jobs are in posted_jobs.json
const postedJobIds = new Set(posted.jobs.map(j => j.jobId));
const alreadyPosted = pending.filter(p => postedJobIds.has(p.job.id));
console.log('\n=== DUPLICATE STATUS ===');
console.log('Jobs in queue already in posted_jobs.json:', alreadyPosted.length);
console.log('Jobs in queue NOT yet posted:', pending.length - alreadyPosted.length);

// Age distribution
const lessThan1h = ages.filter(a => parseFloat(a.hoursOld) < 1).length;
const lessThan6h = ages.filter(a => parseFloat(a.hoursOld) < 6).length;
const lessThan24h = ages.filter(a => parseFloat(a.hoursOld) < 24).length;
const moreThan24h = ages.filter(a => parseFloat(a.hoursOld) >= 24).length;

console.log('\n=== AGE DISTRIBUTION ===');
console.log(`<1 hour:  ${lessThan1h}`);
console.log(`<6 hours: ${lessThan6h}`);
console.log(`<24 hours: ${lessThan24h}`);
console.log(`>=24 hours: ${moreThan24h}`);
