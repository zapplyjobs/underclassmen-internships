// .github/scripts/post_to_discord.js
const fs = require('fs');
const fetch = global.fetch || require('node-fetch');

const WEBHOOK = process.env.DISCORD_WEBHOOK;
if (!WEBHOOK) process.exit(console.error('❌ Missing DISCORD_WEBHOOK'));

let jobs;
try {
  jobs = JSON.parse(fs.readFileSync('.github/data/new_jobs.json','utf8'));
  console.log('🔍 new_jobs.json:', jobs);
} catch {
  return console.log('ℹ️ No new_jobs.json or it’s empty');
}
if (!jobs.length) return console.log('ℹ️ No new jobs to post');

(async()=>{
  for(const job of jobs){
    const title = job.job_title;
    const company = job.employer_name;
    const loc = [job.job_city, job.job_state].filter(Boolean).join(', ');
    const posted = job.job_posted_at_datetime_utc;
    const payload = {
      username: 'JobBot',
      embeds: [{
        title,
        description: `**${company}** • ${loc}`,
        url: job.job_apply_link,
        timestamp: new Date(posted).toISOString(),
        footer: { text: `Posted: ${new Date(posted).toLocaleString()}` }
      }]
    };
    const res = await fetch(WEBHOOK, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify(payload)
    });
    console.log(res.ok?`✅ ${title}`:`❌ ${title} – ${await res.text()}`);
  }
})();
