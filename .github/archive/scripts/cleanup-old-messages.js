#!/usr/bin/env node

/**
 * Discord Message Cleanup Script
 * Deletes job messages older than 14 days from all channels
 *
 * Usage:
 *   node cleanup-old-messages.js
 *
 * Environment Variables:
 *   DISCORD_TOKEN - Discord bot token
 *   DELETION_AGE_DAYS - Age threshold for deletion (default: 14)
 *   DRY_RUN - Set to 'true' to preview without deleting
 */

const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Configuration
const DELETION_AGE_DAYS = parseInt(process.env.DELETION_AGE_DAYS) || 14;
const DRY_RUN = process.env.DRY_RUN === 'true';
const TOKEN = process.env.DISCORD_TOKEN;

// Data paths
const dataDir = path.join(process.cwd(), '.github', 'data');
const postedJobsPath = path.join(dataDir, 'posted_jobs.json');

/**
 * Main cleanup function
 */
async function cleanupOldMessages() {
  console.log('🧹 Starting Discord message cleanup...');
  console.log(`📅 Deletion threshold: ${DELETION_AGE_DAYS} days`);
  console.log(`🔬 Dry run mode: ${DRY_RUN ? 'YES (preview only)' : 'NO (will delete)'}`);
  console.log('');

  // Initialize Discord client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages
    ]
  });

  try {
    // Login to Discord
    await client.login(TOKEN);
    console.log('✅ Connected to Discord');

    // Load posted jobs database
    if (!fs.existsSync(postedJobsPath)) {
      console.log('⚠️  No posted_jobs.json found, nothing to clean up');
      client.destroy();
      return;
    }

    const rawData = fs.readFileSync(postedJobsPath, 'utf8');
    const data = JSON.parse(rawData);

    if (!data.jobs || data.jobs.length === 0) {
      console.log('✅ No jobs in database, nothing to clean up');
      client.destroy();
      return;
    }

    console.log(`📊 Database loaded: ${data.jobs.length} jobs total`);

    // Calculate deletion threshold
    const now = Date.now();
    const deletionThreshold = now - (DELETION_AGE_DAYS * 24 * 60 * 60 * 1000);
    const thresholdDate = new Date(deletionThreshold).toISOString().split('T')[0];

    console.log(`🗓️  Deleting jobs posted before: ${thresholdDate}`);
    console.log('');

    // Track statistics
    let jobsToDelete = 0;
    let jobsToKeep = 0;
    let messagesDeleted = 0;
    let messagesFailed = 0;
    const failedDeletions = [];

    // Filter jobs by age
    const jobsToProcess = [];
    const jobsToRetain = [];

    for (const job of data.jobs) {
      const jobPostedAt = new Date(job.postedToDiscord).getTime();

      if (jobPostedAt < deletionThreshold) {
        jobsToDelete++;
        jobsToProcess.push(job);
      } else {
        jobsToKeep++;
        jobsToRetain.push(job);
      }
    }

    console.log(`📋 Summary:`);
    console.log(`   Jobs to delete: ${jobsToDelete}`);
    console.log(`   Jobs to keep: ${jobsToKeep}`);
    console.log('');

    if (jobsToDelete === 0) {
      console.log('✅ No jobs old enough to delete');
      client.destroy();
      return;
    }

    // Process deletions
    console.log('🗑️  Starting deletions...');
    console.log('');

    for (const job of jobsToProcess) {
      const jobAge = Math.floor((now - new Date(job.postedToDiscord).getTime()) / (1000 * 60 * 60 * 24));
      console.log(`📦 Processing: ${job.title || 'Unknown'} @ ${job.company || 'Unknown'} (${jobAge} days old)`);

      // Delete from all channels this job was posted to
      const discordPosts = job.discordPosts || {};

      if (Object.keys(discordPosts).length === 0) {
        console.log(`   ⚠️  No Discord posts recorded (old schema), skipping`);
        continue;
      }

      for (const [channelId, posting] of Object.entries(discordPosts)) {
        try {
          if (DRY_RUN) {
            console.log(`   🔍 [DRY RUN] Would delete message ${posting.messageId} from channel ${channelId}`);
            messagesDeleted++;
          } else {
            // Fetch channel
            const channel = await client.channels.fetch(channelId);

            if (!channel) {
              console.log(`   ⚠️  Channel ${channelId} not found (may have been deleted)`);
              messagesFailed++;
              failedDeletions.push({
                job: job.title,
                channelId,
                reason: 'Channel not found'
              });
              continue;
            }

            // Fetch and delete message
            const message = await channel.messages.fetch(posting.messageId);
            await message.delete();

            console.log(`   ✅ Deleted from #${channel.name} (${posting.channelType})`);
            messagesDeleted++;

            // Rate limiting: 1 second between deletions (Discord allows 5/sec, we use 1/sec for safety)
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.log(`   ❌ Failed to delete from ${channelId}: ${error.message}`);
          messagesFailed++;
          failedDeletions.push({
            job: job.title,
            channelId,
            messageId: posting.messageId,
            reason: error.message
          });

          // Continue with other channels even if one fails
          continue;
        }
      }

      console.log('');
    }

    // Update database (remove deleted jobs)
    if (!DRY_RUN && messagesDeleted > 0) {
      console.log('💾 Updating database...');

      data.jobs = jobsToRetain;
      data.lastUpdated = new Date().toISOString();
      data.metadata = data.metadata || {};
      data.metadata.lastCleanup = {
        date: new Date().toISOString(),
        deletionAgeDays: DELETION_AGE_DAYS,
        jobsDeleted: jobsToDelete,
        messagesDeleted: messagesDeleted,
        messagesFailed: messagesFailed
      };

      // Atomic write
      const tempPath = postedJobsPath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
      fs.renameSync(tempPath, postedJobsPath);

      console.log(`✅ Database updated: ${jobsToRetain.length} jobs remaining`);
    }

    // Final summary
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📊 CLEANUP SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`Jobs processed: ${jobsToDelete}`);
    console.log(`Messages deleted: ${messagesDeleted}`);
    console.log(`Messages failed: ${messagesFailed}`);
    console.log(`Jobs remaining: ${jobsToRetain.length}`);

    if (failedDeletions.length > 0) {
      console.log('');
      console.log('⚠️  FAILED DELETIONS:');
      failedDeletions.forEach((failed, index) => {
        console.log(`   ${index + 1}. ${failed.job} - ${failed.reason}`);
      });
    }

    if (DRY_RUN) {
      console.log('');
      console.log('🔬 DRY RUN COMPLETE - No changes made');
      console.log('   To perform actual deletion, run without DRY_RUN=true');
    }

    console.log('═══════════════════════════════════════');

    // Cleanup
    client.destroy();
    console.log('');
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('');
    console.error('❌ FATAL ERROR:', error);
    console.error('');
    console.error('Stack trace:', error.stack);
    client.destroy();
    process.exit(1);
  }
}

// Run cleanup
if (require.main === module) {
  if (!TOKEN) {
    console.error('❌ ERROR: DISCORD_TOKEN environment variable is required');
    process.exit(1);
  }

  cleanupOldMessages()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { cleanupOldMessages };
