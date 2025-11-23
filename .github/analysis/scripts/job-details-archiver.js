#!/usr/bin/env node

/**
 * Job Details Archiver with Encryption
 *
 * Creates encrypted JSON with full job details + routing decisions
 * for both analysis and job board API consumption
 *
 * Security Strategy:
 * - Encrypt job source/platform details (competitive intelligence)
 * - Keep public job information unencrypted (job titles, descriptions)
 * - Encrypt routing confidence metrics (internal optimization data)
 */

const fs = require('fs');
const path = require('path');
const { encryptLog } = require('./encryption-utils');

class JobDetailsArchiver {
  constructor() {
    this.dataDir = path.join(process.cwd(), '.github', 'data');
    this.archivePath = path.join(this.dataDir, 'job-details-archive.json.enc');
    this.publicPath = path.join(this.dataDir, 'job-details-public.json');
  }

  /**
   * Archive job with routing decision and selective encryption
   */
  archiveJob(job, routingDecision, postedSuccessfully = true, discordMessageId = null) {
    const timestamp = new Date().toISOString();

    // Public data (no encryption needed - job seekers need this)
    const publicData = {
      id: job.id || job.job_id || this.generateJobId(job),
      title: job.job_title,
      company: job.employer_name,
      location: job.job_city ? `${job.job_city}${job.job_state ? ', ' + job.job_state : ''}` : null,
      description: job.job_description,
      applyLink: job.job_apply_link,
      postedAt: job.job_posted_at_datetime_utc,
      employmentType: job.job_employment_type,
      category: routingDecision.category,
      channelName: routingDecision.channelName,
      postedAt: timestamp,
      discordMessageId: discordMessageId
    };

    // Encrypted data (competitive intelligence & internal metrics)
    const encryptedData = {
      jobSource: {
        platform: job.description_platform || 'unknown',
        originalUrl: job.job_apply_link,
        fetchSuccess: job.description_success || false,
        dataSource: this.identifyDataSource(job)
      },
      routingMetrics: {
        confidence: routingDecision.confidence,
        source: routingDecision.source,
        keyword: routingDecision.matchedKeyword,
        reason: routingDecision.reason,
        validationIssues: routingDecision.validation?.issues || [],
        processingTimeMs: routingDecision.processingTimeMs || 0
      },
      systemMetadata: {
        postedSuccessfully: postedSuccessfully,
        archivedAt: timestamp,
        workflowRunId: process.env.GITHUB_RUN_ID || 'local',
        version: '1.0'
      }
    };

    // Save public data (unencrypted)
    this.appendToPublicArchive(publicData);

    // Encrypt and save sensitive data
    const encryptedEntry = {
      publicId: publicData.id,
      encrypted: encryptLog(JSON.stringify(encryptedData)),
      timestamp: timestamp
    };

    this.appendToEncryptedArchive(encryptedEntry);

    console.log(`📁 Archived job: ${publicData.title} @ ${publicData.company}`);
    console.log(`   Category: ${publicData.category} | Confidence: ${routingDecision.confidence}%`);

    return publicData.id;
  }

  /**
   * Identify data source from job structure
   */
  identifyDataSource(job) {
    if (job.id && job.id.includes('ashbyhq')) return 'ashby';
    if (job.id && job.id.includes('greenhouse')) return 'greenhouse';
    if (job.id && job.id.includes('lever')) return 'lever';
    if (job.id && job.id.includes('workday')) return 'workday';
    if (job.description_platform) return job.description_platform;
    return 'unknown';
  }

  /**
   * Generate consistent job ID
   */
  generateJobId(job) {
    const company = (job.employer_name || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const title = (job.job_title || '').toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
    const city = (job.job_city || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now();

    return `${company}-${title}-${city}-${timestamp}`;
  }

  /**
   * Append to public archive (unencrypted)
   */
  appendToPublicArchive(publicData) {
    let archive = [];

    if (fs.existsSync(this.publicPath)) {
      try {
        archive = JSON.parse(fs.readFileSync(this.publicPath, 'utf8'));
      } catch (error) {
        console.warn('Corrupted public archive, starting fresh:', error.message);
        archive = [];
      }
    }

    // Remove existing entry with same ID (updates)
    archive = archive.filter(entry => entry.id !== publicData.id);

    // Add new entry
    archive.push(publicData);

    // Keep only last 1000 entries to manage file size
    if (archive.length > 1000) {
      archive = archive.slice(-1000);
    }

    fs.writeFileSync(this.publicPath, JSON.stringify(archive, null, 2), 'utf8');
  }

  /**
   * Append to encrypted archive
   */
  appendToEncryptedArchive(encryptedEntry) {
    // Append as line-delimited encrypted JSON
    const line = JSON.stringify(encryptedEntry) + '\n';
    fs.appendFileSync(this.archivePath, line, 'utf8');
  }

  /**
   * Get recent jobs for job board API
   */
  getRecentJobs(limit = 50, category = null) {
    if (!fs.existsSync(this.publicPath)) {
      return [];
    }

    const archive = JSON.parse(fs.readFileSync(this.publicPath, 'utf8'));
    let jobs = archive.reverse(); // Most recent first

    if (category) {
      jobs = jobs.filter(job => job.category === category);
    }

    return jobs.slice(0, limit);
  }

  /**
   * Get encrypted details for specific job (admin use)
   */
  getEncryptedDetails(jobId) {
    if (!fs.existsSync(this.archivePath)) {
      return null;
    }

    const lines = fs.readFileSync(this.archivePath, 'utf8')
      .split('\n')
      .filter(line => line.trim());

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.publicId === jobId) {
          return {
            ...JSON.parse(require('./encryption-utils').decryptLog(entry.encrypted)),
            publicId: entry.publicId,
            timestamp: entry.timestamp
          };
        }
      } catch (error) {
        console.warn('Failed to parse encrypted entry:', error.message);
      }
    }

    return null;
  }

  /**
   * Generate analysis report from archived data
   */
  generateAnalysisReport() {
    if (!fs.existsSync(this.publicPath)) {
      return "No data available for analysis";
    }

    const archive = JSON.parse(fs.readFileSync(this.publicPath, 'utf8'));

    const categoryStats = {};
    const sourceStats = {};
    const confidenceStats = { high: 0, medium: 0, low: 0 };

    archive.forEach(job => {
      // Category distribution
      categoryStats[job.category] = (categoryStats[job.category] || 0) + 1;

      // Source analysis (from encrypted data)
      const encryptedDetails = this.getEncryptedDetails(job.id);
      if (encryptedDetails) {
        const source = encryptedDetails.jobSource.dataSource;
        sourceStats[source] = (sourceStats[source] || 0) + 1;

        // Confidence distribution
        const confidence = encryptedDetails.routingMetrics.confidence;
        if (confidence >= 90) confidenceStats.high++;
        else if (confidence >= 60) confidenceStats.medium++;
        else confidenceStats.low++;
      }
    });

    return `# Job Archive Analysis Report

**Generated:** ${new Date().toISOString()}
**Total Jobs:** ${archive.length}

## 📊 Category Distribution
${Object.entries(categoryStats)
  .sort(([,a], [,b]) => b - a)
  .map(([cat, count]) => `- **${cat.toUpperCase()}:** ${count} jobs (${((count/archive.length)*100).toFixed(1)}%)`)
  .join('\n')}

## 🔍 Data Source Distribution
${Object.entries(sourceStats)
  .sort(([,a], [,b]) => b - a)
  .map(([source, count]) => `- **${source}:** ${count} jobs`)
  .join('\n')}

## 📈 Confidence Distribution
- **High Confidence (90%+):** ${confidenceStats.high} jobs
- **Medium Confidence (60-89%):** ${confidenceStats.medium} jobs
- **Low Confidence (<60%):** ${confidenceStats.low} jobs

## 💡 Insights
- Most common category: ${Object.entries(categoryStats).sort(([,a], [,b]) => b - a)[0][0]}
- Average jobs per day: ${(archive.length / Math.max(1, this.getDaysBetweenFirstAndLastJob(archive))).toFixed(1)}
`;
  }

  getDaysBetweenFirstAndLastJob(jobs) {
    if (jobs.length < 2) return 1;
    const first = new Date(jobs[jobs.length - 1].postedAt);
    const last = new Date(jobs[0].postedAt);
    return Math.max(1, (last - first) / (1000 * 60 * 60 * 24));
  }
}

module.exports = JobDetailsArchiver;