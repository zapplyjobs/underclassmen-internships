#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/posted_jobs.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Count entries per jobId
const jobIdMap = {};
data.jobs.forEach(j => {
  if (!jobIdMap[j.jobId]) jobIdMap[j.jobId] = [];
  jobIdMap[j.jobId].push(j);
});

const duplicates = Object.entries(jobIdMap).filter(([_, jobs]) => jobs.length > 1);

console.log('=== DUPLICATE ANALYSIS ===');
console.log('Total jobs with duplicate entries:', duplicates.length);
console.log('Total unique job IDs:', Object.keys(jobIdMap).length);
console.log('Total job entries in DB:', data.jobs.length);
console.log();

console.log('=== RECENT DUPLICATES (today) ===');
const today = new Date().toISOString().split('T')[0]; // 2026-01-24
const recentDuplicates = duplicates.filter(([_, entries]) =>
  entries.some(e => e.postedToDiscord && e.postedToDiscord.startsWith(today))
);

console.log('Duplicates posted today:', recentDuplicates.length);
console.log();

recentDuplicates.slice(0, 10).forEach(([jobId, entries]) => {
  console.log('JobID:', jobId);
  console.log('Company:', entries[0].company);
  console.log('Title:', entries[0].title);
  console.log('Entries:', entries.length);
  entries.forEach((e, i) => {
    const hasPosts = e.discordPosts && Object.keys(e.discordPosts).length > 0;
    const channels = hasPosts ? Object.keys(e.discordPosts).length : 0;
    console.log(`  [${i+1}] Posted: ${e.postedToDiscord} | Channels: ${channels} | Has posts: ${hasPosts}`);
  });
  console.log();
});

// Find anthropic jobs specifically
console.log('=== ANTHROPIC JOBS TODAY ===');
const anthropicToday = data.jobs.filter(j =>
  j.company && j.company.toLowerCase() === 'anthropic' &&
  j.postedToDiscord && j.postedToDiscord.startsWith(today)
);

console.log('Found:', anthropicToday.length);
anthropicToday.forEach(j => {
  const hasPosts = j.discordPosts && Object.keys(j.discordPosts).length > 0;
  console.log(`${j.title} | Posted: ${j.postedToDiscord} | Has Discord posts: ${hasPosts}`);
});
