#!/usr/bin/env node

/**
 * Discord Verification CLI Tool
 *
 * Verifies that jobs in posted_jobs.json actually exist in Discord.
 * Detects missing posts, multi-channel routing issues, and duplicates.
 *
 * Usage:
 *   node verify-discord.js [--hours=24] [--json]
 *
 * Options:
 *   --hours=N    How far back to check (default: 24)
 *   --json       Output raw JSON instead of formatted
 *   --summary    Show only summary (default)
 *   --detailed   Show full details including missing jobs list
 */

const fs = require('fs');
const path = require('path');
const { verifyDiscordPosts } = require('./src/monitoring/discord-verifier');
const { CHANNEL_CONFIG, LOCATION_CHANNEL_CONFIG } = require('./src/discord/config');

// Parse arguments
const args = process.argv.slice(2);
const lookbackHours = parseInt(args.find(a => a.startsWith('--hours='))?.split('=')[1] || '24');
const jsonOutput = args.includes('--json');
const detailed = args.includes('--detailed');

async function main() {
  // Load data
  const postedJobsPath = path.join(__dirname, '../data/posted_jobs.json');
  const postedJobsData = JSON.parse(fs.readFileSync(postedJobsPath, 'utf8'));

  // Build channel map (name -> ID)
  // CHANNEL_CONFIG format: { 'tech': '1234567890', 'ai': '1234567891', ... }
  const channels = {};
  Object.entries(CHANNEL_CONFIG).forEach(([name, channelId]) => {
    if (channelId) {
      channels[name] = channelId;
    }
  });
  // Also add location channels
  Object.entries(LOCATION_CHANNEL_CONFIG).forEach(([name, channelId]) => {
    if (channelId) {
      channels[name] = channelId;
    }
  });

  console.error('🔍 Verifying Discord posts...');
  console.error(`   Lookback: ${lookbackHours} hours`);
  console.error(`   Channels: ${Object.keys(channels).length}`);
  console.error(`   Jobs in DB: ${postedJobsData.jobs.length}`);
  console.error();

  const results = await verifyDiscordPosts({
    token: process.env.DISCORD_TOKEN,
    channels,
    postedJobs: postedJobsData.jobs,
    lookbackHours
  });

  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printFormattedResults(results, detailed);
  }

  process.exit(0);
}

function printFormattedResults(results, detailed) {
  console.log('='.repeat(70));
  console.log('📊 DISCORD VERIFICATION RESULTS');
  console.log('='.repeat(70));
  console.log();

  const s = results.summary;

  console.log('📅 Verification Window:');
  console.log(`   Lookback: ${results.lookbackHours} hours`);
  console.log(`   Timestamp: ${results.timestamp}`);
  console.log();

  console.log('📈 Summary:');
  console.log(`   Jobs in database (recent):        ${s.totalJobsInDb}`);
  console.log(`   Jobs with discordPosts field:     ${s.jobsWithDiscordPosts}`);
  console.log(`   Jobs found in Discord:            ${s.totalJobsInDiscord}`);
  console.log();

  // Health indicators
  const healthStatus = s.jobsMissingFromDiscord === 0 && s.multiChannelIssues === 0 && s.duplicatesInDiscord === 0;
  console.log(`🏥 Health Status: ${healthStatus ? '✅ HEALTHY' : '⚠️  ISSUES DETECTED'}`);
  console.log();

  if (s.jobsMissingFromDiscord > 0) {
    console.log(`❌ Missing from Discord:              ${s.jobsMissingFromDiscord} jobs`);
  }
  if (s.multiChannelIssues > 0) {
    console.log(`⚠️  Multi-channel routing issues:    ${s.multiChannelIssues} jobs`);
  }
  if (s.duplicatesInDiscord > 0) {
    console.log(`🔁 Duplicates in Discord:            ${s.duplicatesInDiscord} jobs`);
  }

  if (!healthStatus) {
    console.log();
  }

  // Per-channel breakdown
  console.log('📍 Per-Channel Results:');
  Object.entries(results.channels).forEach(([name, data]) => {
    console.log(`   ${name}: ${data.messagesFound} jobs`);
  });
  console.log();

  // Detailed output
  if (detailed) {
    if (results.missingJobs && results.missingJobs.length > 0) {
      console.log('❌ MISSING FROM DISCORD:');
      results.missingJobs.slice(0, 10).forEach((job, i) => {
        console.log(`   ${i+1}. ${job.title} @ ${job.company}`);
        console.log(`      Posted: ${job.postedAt}`);
        console.log(`      Has discordPosts field: ${job.hasDiscordPostsField}`);
      });
      if (results.missingJobs.length > 10) {
        console.log(`   ... and ${results.missingJobs.length - 10} more`);
      }
      console.log();
    }

    if (results.multiChannelIssues && results.multiChannelIssues.length > 0) {
      console.log('⚠️  MULTI-CHANNEL ROUTING ISSUES:');
      results.multiChannelIssues.slice(0, 5).forEach((job, i) => {
        console.log(`   ${i+1}. ${job.title} @ ${job.company}`);
        console.log(`      Expected channels: ${job.expectedChannels}`);
        console.log(`      Found in: ${job.foundChannels}`);
        console.log(`      Missing from: ${job.missingFromChannels.length} channels`);
      });
      if (results.multiChannelIssues.length > 5) {
        console.log(`   ... and ${results.multiChannelIssues.length - 5} more`);
      }
      console.log();
    }

    if (results.duplicates && results.duplicates.length > 0) {
      console.log('🔁 DUPLICATES IN DISCORD:');
      results.duplicates.slice(0, 5).forEach((dup, i) => {
        console.log(`   ${i+1}. ${dup.title} @ ${dup.company} (${dup.count}x)`);
      });
      if (results.duplicates.length > 5) {
        console.log(`   ... and ${results.duplicates.length - 5} more`);
      }
      console.log();
    }
  }

  // Recommendations
  if (!healthStatus) {
    console.log('💡 RECOMMENDATIONS:');
    if (s.jobsMissingFromDiscord > 0) {
      console.log('   • Check workflow logs for posting failures');
      console.log('   • Verify Discord bot permissions');
      console.log('   • Review pending queue for stuck jobs');
    }
    if (s.multiChannelIssues > 0) {
      console.log('   • Check multi-channel routing logic');
      console.log('   • Verify all expected channels exist and are accessible');
      console.log('   • Review channel validation on bot startup');
    }
    if (s.duplicatesInDiscord > 0) {
      console.log('   • Check for workflow concurrency issues');
      console.log('   • Verify duplicate detection is working');
      console.log('   • Consider clearing pending queue of old jobs');
    }
    console.log();
  }

  console.log('Run with --detailed flag to see full job lists');
  console.log('Run with --json flag for machine-readable output');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
