/**
 * Channel Stats Manager
 * Tracks posts per channel since last cleanup.
 * Helps identify channel load distribution and verify cleanup effectiveness.
 */

const fs = require('fs');
const path = require('path');

const STATS_FILE = path.join(process.cwd(), '.github', 'data', 'channel_stats.json');

class ChannelStatsManager {
  constructor() {
    this.stats = this.load();
  }

  load() {
    try {
      if (fs.existsSync(STATS_FILE)) {
        const data = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
        return data;
      }
    } catch (error) {
      console.log('[STATS] Error loading channel stats, starting fresh:', error.message);
    }
    return this.getEmptyStats();
  }

  getEmptyStats() {
    return {
      lastCleanup: null,
      lastUpdated: new Date().toISOString(),
      totalPosts: 0,
      channels: {}
    };
  }

  /**
   * Increment post count for a channel
   * @param {string} channelId - Discord channel ID
   * @param {string} channelName - Human-readable channel name
   */
  recordPost(channelId, channelName) {
    if (!this.stats.channels[channelId]) {
      this.stats.channels[channelId] = {
        name: channelName,
        posts: 0,
        lastPost: null
      };
    }

    this.stats.channels[channelId].posts++;
    this.stats.channels[channelId].lastPost = new Date().toISOString();
    this.stats.channels[channelId].name = channelName; // Update name in case it changed
    this.stats.totalPosts++;
    this.stats.lastUpdated = new Date().toISOString();
  }

  /**
   * Clear all stats (called by cleanup workflow)
   */
  clearStats() {
    const summary = this.getSummary();
    this.stats = this.getEmptyStats();
    this.stats.lastCleanup = new Date().toISOString();
    this.save();
    return summary;
  }

  /**
   * Get summary of channel stats
   */
  getSummary() {
    const channels = Object.entries(this.stats.channels)
      .map(([id, data]) => ({
        id,
        name: data.name,
        posts: data.posts,
        lastPost: data.lastPost
      }))
      .sort((a, b) => b.posts - a.posts);

    return {
      lastCleanup: this.stats.lastCleanup,
      lastUpdated: this.stats.lastUpdated,
      totalPosts: this.stats.totalPosts,
      channelCount: channels.length,
      channels,
      topChannels: channels.slice(0, 5)
    };
  }

  /**
   * Log current stats to console
   */
  logSummary() {
    const summary = this.getSummary();
    console.log('\n📊 CHANNEL STATS SINCE LAST CLEANUP:');
    console.log(`   Last cleanup: ${summary.lastCleanup || 'Never'}`);
    console.log(`   Total posts: ${summary.totalPosts}`);
    console.log(`   Channels used: ${summary.channelCount}`);

    if (summary.topChannels.length > 0) {
      console.log('   Top channels:');
      summary.topChannels.forEach((ch, i) => {
        console.log(`     ${i + 1}. #${ch.name}: ${ch.posts} posts`);
      });
    }
    console.log('');
  }

  save() {
    try {
      const dir = path.dirname(STATS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STATS_FILE, JSON.stringify(this.stats, null, 2));
      console.log('[STATS] Channel stats saved');
    } catch (error) {
      console.error('[STATS] Error saving channel stats:', error.message);
    }
  }
}

module.exports = ChannelStatsManager;
