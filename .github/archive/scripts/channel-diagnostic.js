#!/usr/bin/env node

/**
 * Discord Channel Diagnostic Dashboard
 *
 * Provides comprehensive metrics for job routing and Discord posting:
 * - Channel distribution (where jobs are being posted)
 * - Location routing analysis (which cities/states → which channels)
 * - Recent posting activity and failures
 * - Schema migration status
 * - Data quality metrics
 */

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║     DISCORD CHANNEL DIAGNOSTIC DASHBOARD - NEW-GRAD-JOBS      ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Mock environment for testing (use real secrets in production)
const mockEnvIfNeeded = () => {
  const envVars = [
    'DISCORD_TECH_CHANNEL_ID', 'DISCORD_AI_CHANNEL_ID', 'DISCORD_DS_CHANNEL_ID',
    'DISCORD_FINANCE_CHANNEL_ID', 'DISCORD_BAY_AREA_CHANNEL_ID', 'DISCORD_NY_CHANNEL_ID',
    'DISCORD_PNW_CHANNEL_ID', 'DISCORD_REMOTE_USA_CHANNEL_ID', 'DISCORD_OTHER_USA_CHANNEL_ID'
  ];

  const missing = envVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.log('⚠️  Missing environment variables (using mock IDs for testing):\n');
    missing.forEach(v => console.log(`   ${v}`));
    console.log('\n   To use real channel IDs, run: gh secret list\n');

    // Mock values for local testing
    process.env.DISCORD_TECH_CHANNEL_ID = 'TECH';
    process.env.DISCORD_AI_CHANNEL_ID = 'AI';
    process.env.DISCORD_DS_CHANNEL_ID = 'DS';
    process.env.DISCORD_FINANCE_CHANNEL_ID = 'FIN';
    process.env.DISCORD_BAY_AREA_CHANNEL_ID = 'BAY';
    process.env.DISCORD_NY_CHANNEL_ID = 'NYC';
    process.env.DISCORD_PNW_CHANNEL_ID = 'PNW';
    process.env.DISCORD_REMOTE_USA_CHANNEL_ID = 'REMOTE';
    process.env.DISCORD_OTHER_USA_CHANNEL_ID = 'OTHER';
  }
};

mockEnvIfNeeded();

// Load modules after env setup
const { getJobLocationChannel } = require('./src/routing/location');
const { LOCATION_CHANNEL_CONFIG } = require('./src/discord/config');

// ============================================================================
// 1. DATA FILES STATUS
// ============================================================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. DATA FILES STATUS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const dataDir = path.join(process.cwd(), '.github', 'data');
const files = {
  new: path.join(dataDir, 'new_jobs.json'),
  posted: path.join(dataDir, 'posted_jobs.json'),
  seen: path.join(dataDir, 'seen_jobs.json')
};

const data = {};
Object.entries(files).forEach(([key, filePath]) => {
  if (fs.existsSync(filePath)) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const size = fs.statSync(filePath).size;

    // Handle both array and object formats
    let count, items;
    if (Array.isArray(content)) {
      count = content.length;
      items = content;
    } else if (content.jobs && Array.isArray(content.jobs)) {
      count = content.jobs.length;
      items = content.jobs;
    } else if (typeof content === 'object') {
      items = Object.values(content);
      count = items.length;
    }

    console.log(`   ✅ ${key.padEnd(10)} ${String(count).padStart(5)} items  (${(size/1024).toFixed(1).padStart(7)} KB)`);
    data[key] = { exists: true, content, items, count, size };
  } else {
    console.log(`   ❌ ${key.padEnd(10)} NOT FOUND`);
    data[key] = { exists: false };
  }
});

// ============================================================================
// 2. SCHEMA MIGRATION STATUS
// ============================================================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('2. SCHEMA MIGRATION STATUS (V1 → V2)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (data.posted?.exists && data.posted.items?.length > 0) {
  const sampleJob = data.posted.items[0];
  const hasV2Schema = !!sampleJob.discordPosts;
  const hasV1Schema = !!sampleJob.discordThreadId;

  if (hasV2Schema) {
    console.log('   ✅ Schema V2 (multi-channel): ACTIVE');
    console.log('      Jobs have discordPosts object for multiple channels\n');
  } else if (hasV1Schema) {
    console.log('   ⚠️  Schema V1 (single forum thread): DETECTED');
    console.log('      Jobs have discordThreadId (old schema)');
    console.log('      Run migration: node .github/scripts/migrate-to-multi-channel-schema.js\n');
  } else {
    console.log('   ⚠️  Unknown schema format\n');
  }
} else {
  console.log('   ⚠️  No posted jobs to analyze\n');
}

// ============================================================================
// 3. LOCATION CHANNEL ROUTING ANALYSIS
// ============================================================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('3. LOCATION CHANNEL ROUTING ANALYSIS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test routing with sample locations
const testCases = [
  { city: 'San Francisco', state: 'CA', expected: 'bay-area' },
  { city: 'Mountain View', state: 'CA', expected: 'bay-area' },
  { city: 'New York', state: 'NY', expected: 'new-york' },
  { city: 'Seattle', state: 'WA', expected: 'pacific-northwest' },
  { city: 'Redmond', state: 'WA', expected: 'pacific-northwest' },
  { city: 'Austin', state: 'TX', expected: 'other-usa' },
  { city: 'Chicago', state: 'IL', expected: 'other-usa' },
  { city: 'Boston', state: 'MA', expected: 'other-usa' },
  { city: 'Los Angeles', state: 'CA', expected: 'other-usa' },
  { city: 'Grove City', state: 'PA', expected: 'other-usa' },
  { city: 'Denver', state: 'CO', expected: 'other-usa' },
  { city: 'Miami', state: 'FL', expected: 'other-usa' },
  { city: '', state: '', title: 'Remote Software Engineer', desc: 'Work from anywhere in USA', expected: 'remote-usa' }
];

console.log('   Testing routing for sample locations:\n');
let passCount = 0;
testCases.forEach((test, i) => {
  const job = {
    job_city: test.city,
    job_state: test.state?.toLowerCase() || '',
    job_title: test.title || 'Test Job',
    job_description: test.desc || ''
  };

  const result = getJobLocationChannel(job);
  const expectedId = LOCATION_CHANNEL_CONFIG[test.expected];
  const pass = result === expectedId;

  if (pass) passCount++;

  const location = test.city && test.state ? `${test.city}, ${test.state}` :
                   test.title ? test.title : 'Unknown';

  console.log(`   ${pass ? '✓' : '✗'} ${location.padEnd(30)} → ${test.expected.padEnd(20)} ${pass ? '✓' : '✗ FAIL'}`);
});

console.log(`\n   Results: ${passCount}/${testCases.length} tests passed\n`);

// ============================================================================
// 4. NEW JOBS LOCATION DISTRIBUTION
// ============================================================================
if (data.new?.exists && data.new.count > 0) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4. NEW JOBS LOCATION DISTRIBUTION (Ready to Post)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const channelCounts = {};
  const locationExamples = {};

  data.new.items.forEach(job => {
    const channelId = getJobLocationChannel(job);

    if (channelId) {
      // Find channel name from LOCATION_CHANNEL_CONFIG
      const channelName = Object.entries(LOCATION_CHANNEL_CONFIG)
        .find(([_, id]) => id === channelId)?.[0] || 'unknown';

      channelCounts[channelName] = (channelCounts[channelName] || 0) + 1;

      // Store example locations
      if (!locationExamples[channelName]) {
        locationExamples[channelName] = [];
      }
      if (locationExamples[channelName].length < 3) {
        const loc = job.job_city && job.job_state ?
          `${job.job_city}, ${job.job_state}` :
          job.job_city || job.job_state || 'Remote';
        locationExamples[channelName].push(loc);
      }
    }
  });

  console.log('   Channel distribution for new jobs:\n');
  Object.entries(channelCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([channel, count]) => {
      const pct = ((count / data.new.count) * 100).toFixed(1);
      console.log(`   📍 ${channel.padEnd(20)} ${String(count).padStart(3)} jobs (${pct.padStart(5)}%)`);
      if (locationExamples[channel]) {
        console.log(`      Examples: ${locationExamples[channel].join(', ')}`);
      }
    });

  const noLocation = data.new.count - Object.values(channelCounts).reduce((a, b) => a + b, 0);
  if (noLocation > 0) {
    const pct = ((noLocation / data.new.count) * 100).toFixed(1);
    console.log(`\n   ⚠️  ${noLocation} jobs (${pct}%) have no location routing (will skip location channels)`);
  }
  console.log('');
}

// ============================================================================
// 5. POSTED JOBS CHANNEL DISTRIBUTION (Historical)
// ============================================================================
if (data.posted?.exists && data.posted.items?.length > 0) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('5. POSTED JOBS CHANNEL DISTRIBUTION (Historical)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const sampleJob = data.posted.items[0];
  if (sampleJob.discordPosts) {
    // V2 schema - count by channel
    const channelCounts = {};
    data.posted.items.forEach(job => {
      if (job.discordPosts) {
        Object.keys(job.discordPosts).forEach(channel => {
          channelCounts[channel] = (channelCounts[channel] || 0) + 1;
        });
      }
    });

    console.log('   Historical channel usage (V2 schema):\n');
    Object.entries(channelCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([channel, count]) => {
        const pct = ((count / data.posted.count) * 100).toFixed(1);
        console.log(`   📊 ${channel.padEnd(25)} ${String(count).padStart(4)} posts (${pct.padStart(5)}%)`);
      });
  } else {
    console.log('   ⚠️  V1 schema detected - run migration for channel distribution analysis\n');
  }
  console.log('');
}

// ============================================================================
// 6. CONFIGURATION STATUS
// ============================================================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('6. CHANNEL CONFIGURATION STATUS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const channels = [
  { name: 'bay-area', env: 'DISCORD_BAY_AREA_CHANNEL_ID', description: 'SF, Mountain View, San Jose, Palo Alto' },
  { name: 'new-york', env: 'DISCORD_NY_CHANNEL_ID', description: 'NYC, Manhattan, Brooklyn, Jersey City' },
  { name: 'pacific-northwest', env: 'DISCORD_PNW_CHANNEL_ID', description: 'Seattle, Redmond, Bellevue' },
  { name: 'remote-usa', env: 'DISCORD_REMOTE_USA_CHANNEL_ID', description: 'Remote-friendly jobs' },
  { name: 'other-usa', env: 'DISCORD_OTHER_USA_CHANNEL_ID', description: 'Austin, Chicago, Boston, LA, PA, etc.' }
];

console.log('   Location channels:\n');
channels.forEach(ch => {
  const configured = !!LOCATION_CHANNEL_CONFIG[ch.name];
  const channelId = LOCATION_CHANNEL_CONFIG[ch.name] || 'NOT SET';
  console.log(`   ${configured ? '✅' : '❌'} ${ch.name.padEnd(20)} ${channelId.padEnd(25)} ${ch.description}`);
});

console.log('\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('DIAGNOSTIC COMPLETE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
