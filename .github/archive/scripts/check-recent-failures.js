const data = require('../data/posted_jobs.json');

const oneDayAgo = new Date(Date.now() - 24*60*60*1000);
const recentJobs = data.jobs.filter(j => new Date(j.postedToDiscord) > oneDayAgo);
const recentFailures = recentJobs.filter(job => {
  const hasV1 = job.discordThreadId;
  const hasV2 = job.discordPosts && Object.keys(job.discordPosts).length > 0;
  return (!hasV1 && !hasV2);
});

console.log('Last 24 hours:');
console.log('  Total jobs:', recentJobs.length);
console.log('  Failures:', recentFailures.length);
console.log('  Failure rate:', (recentFailures.length/recentJobs.length*100).toFixed(1) + '%');

if (recentFailures.length > 0) {
  console.log('\nSample recent failure:');
  console.log(JSON.stringify(recentFailures[0], null, 2));
}
