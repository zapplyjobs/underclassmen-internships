const fs = require('fs');

const data = JSON.parse(fs.readFileSync('.github/data/posted_jobs.json', 'utf-8'));
const jobs = data.jobs || data;

const now = Date.now();
const last24h = jobs.filter(j => j.postedToDiscord && (now - new Date(j.postedToDiscord)) < 24*60*60*1000);

// TRUE failures: empty discordPosts AND no discordThreadId
const trueFails = last24h.filter(j => j.discordPosts && Object.keys(j.discordPosts).length === 0 && !j.discordThreadId);

// V1 migration artifacts: empty discordPosts BUT has discordThreadId (posted successfully via V1)
const v1Migrated = last24h.filter(j => j.discordPosts && Object.keys(j.discordPosts).length === 0 && j.discordThreadId);

console.log('\n' + '='.repeat(80));
console.log('ANALYSIS: Empty discordPosts Jobs');
console.log('='.repeat(80));

console.log(`\nTotal jobs in last 24h: ${last24h.length}`);
console.log(`Jobs with empty discordPosts: ${trueFails.length + v1Migrated.length}`);
console.log(`  - V1 migration artifacts (has threadId): ${v1Migrated.length} ✅ POSTED SUCCESSFULLY`);
console.log(`  - TRUE failures (no threadId): ${trueFails.length} ❌ ACTUAL FAILURES`);

console.log('\n' + '='.repeat(80));
console.log('TRUE FAILURES (no threadId, first 10):');
console.log('='.repeat(80));

trueFails.slice(0, 10).forEach((j, i) => {
  console.log(`\n${i+1}. ${j.company} - ${j.title}`);
  console.log(`   location: ${j.job_city}, ${j.job_state}`);
  console.log(`   postedToDiscord: ${j.postedToDiscord}`);
});

// Check unique companies for TRUE failures
const companies = [...new Set(trueFails.map(j => j.company))];
console.log('\n' + '='.repeat(80));
console.log(`Unique companies with TRUE failures: ${companies.length}`);
console.log('Companies:', companies.slice(0, 20).join(', '));
