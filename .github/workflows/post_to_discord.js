// .github/scripts/post_to_discord.js

import fs from 'fs';
import process from 'process';

// Node 18+ has fetch built-in. If you're on Node <18, install node-fetch and uncomment the next line:
// import fetch from 'node-fetch';

const WEBHOOK = process.env.DISCORD_WEBHOOK;
if (!WEBHOOK) {
  console.error('❌ Missing DISCORD_WEBHOOK env var');
  process.exit(1);
}

async function main() {
  let jobs;
  try {
    jobs = JSON.parse(
      fs.readFileSync('.github/data/new_jobs.json', 'utf8')
    );
  } catch (err) {
    console.error('❌ Could not read new_jobs.json:', err);
    process.exit(1);
  }

  if (!jobs.length) {
    console.log('ℹ️ No new jobs to post.');
    return;
  }

  for (const job of jobs) {
    const body = {
      username: 'JobBot',
      avatar_url: 'https://i.imgur.com/AfFp7pu.png',  // optional
      embeds: [{
        title: job.title,
        description: `**${job.company}** • ${job.location}`,
        url: job.job_apply_link,
        timestamp: job.job_posted_at_datetime_utc,
      }]
    };

    const res = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      console.error(`❌ Failed to post "${job.title}":`, await res.text());
    } else {
      console.log(`✅ Posted: ${job.title}`);
    }
  }
}

main();
