#!/usr/bin/env node

/**
 * Jobs Data Exporter with Encryption
 * Purpose: Export complete job data (including descriptions) to encrypted JSON
 * Use Case: External job boards can fetch jobs with full details
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class JobsDataExporter {
  constructor() {
    this.dataDir = path.join(process.cwd(), '.github', 'data');
    this.outputPath = path.join(this.dataDir, 'jobs-data-encrypted.json');
    this.password = process.env.LOG_ENCRYPT_PASSWORD;
    if (!this.password) {
      throw new Error('LOG_ENCRYPT_PASSWORD environment variable is required');
    }

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  encrypt(data) {
    const salt = crypto.randomBytes(32);
    const key = crypto.scryptSync(this.password, salt, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const jsonData = JSON.stringify(data);
    let encrypted = cipher.update(jsonData, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: cipher.getAuthTag().toString('hex'),
      salt: salt.toString('hex'),
      algorithm: 'aes-256-gcm'
    };
  }

  decrypt(encryptedData) {
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const key = crypto.scryptSync(this.password, salt, 32);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  loadExistingData() {
    if (!fs.existsSync(this.outputPath)) {
      return {
        metadata: {
          version: '1.0',
          created: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          totalJobs: 0
          // REMOVED: source field (security - don't reveal repo name)
        },
        jobs: []
      };
    }

    try {
      const encryptedData = JSON.parse(fs.readFileSync(this.outputPath, 'utf8'));
      const data = this.decrypt(encryptedData);

      // Apply 7-day TTL: Remove jobs older than 7 days to keep data fresh
      const SEVEN_DAYS_AGO = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const initialJobCount = data.jobs.length;

      data.jobs = data.jobs.filter(job => {
        const jobDate = new Date(job.postedDate || job.addedToDatabase || 0);
        return jobDate.getTime() > SEVEN_DAYS_AGO;
      });

      const expiredCount = initialJobCount - data.jobs.length;
      if (expiredCount > 0) {
        console.log(`🧹 Cleaned up ${expiredCount} jobs older than 7 days`);
      }

      return data;
    } catch (error) {
      console.log(`⚠️ Could not decrypt existing file (password mismatch or corruption): ${error.message}`);
      console.log(`🔄 Starting fresh - file will rebuild incrementally over next 7 days`);
      return {
        metadata: {
          version: '1.0',
          created: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          totalJobs: 0
        },
        jobs: []
      };
    }
  }

  generateJobId(job) {
    // Handle both current (company_name, title, locations[]) and legacy (employer_name, job_title, job_city) data formats
    const company = (job.company_name || job.employer_name || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const title = (job.title || job.job_title || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const location = (
      (Array.isArray(job.locations) && job.locations.length > 0 ? job.locations[0] : null) ||
      job.location ||
      job.job_city ||
      ''
    ).toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${company}-${title}-${location}`.replace(/--+/g, '-').replace(/^-|-$/g, '');
  }

  exportJobs(newJobs) {
    console.log(`\n📦 Exporting ${newJobs.length} jobs to encrypted JSON...`);

    const existingData = this.loadExistingData();
    const existingJobIds = new Set(existingData.jobs.map(j => j.id));

    let addedCount = 0;
    let skippedCount = 0;

    for (const job of newJobs) {
      const jobId = this.generateJobId(job);
      if (existingJobIds.has(jobId)) {
        skippedCount++;
        continue;
      }

      // SECURITY: Sanitize job data for public consumption (repo is public)
      // Remove: source, platform, internal IDs, API references
      // Current data format: company_name, title, locations[], url, date_posted
      const normalizedJob = {
        id: jobId, // Already sanitized: company-title-location format
        title: job.title || job.job_title || '',
        company: job.company_name || job.employer_name || '',
        location: Array.isArray(job.locations) && job.locations.length > 0
          ? job.locations[0]
          : (job.location || job.job_city || 'Remote'),
        state: job.job_state || '',
        description: job.description || job.job_description || '',
        description_html: job.description_html || job.description || job.job_description || '',
        description_format: job.description_format || 'html',
        url: job.url || job.job_apply_link || '',
        salary: job.salary || job.salary_range || null,
        experience: job.experience || job.job_required_experience || 'Entry-Level',
        category: job.category || 'Uncategorized',
        postedDate: job.date_posted || job.job_posted_at_datetime_utc || new Date().toISOString(),
        addedToDatabase: new Date().toISOString()
        // REMOVED: source, platform, employmentType (security - don't reveal data sources)
      };

      existingData.jobs.push(normalizedJob);
      addedCount++;
    }

    existingData.metadata.lastUpdated = new Date().toISOString();
    existingData.metadata.totalJobs = existingData.jobs.length;

    // ALWAYS encrypt for Git commits (protects Git history and data sources)
    const encryptedData = this.encrypt(existingData);
    fs.writeFileSync(this.outputPath, JSON.stringify(encryptedData, null, 2));

    console.log(`✅ Export complete: Added ${addedCount}, Skipped ${skippedCount}, Total ${existingData.metadata.totalJobs}`);

    // HYBRID ENCRYPTION: Optionally create plaintext debug logs (GitHub Actions artifacts only, NOT committed to Git)
    const CREATE_DEBUG_LOGS = process.env.CREATE_DEBUG_LOGS === 'true';
    if (CREATE_DEBUG_LOGS) {
      this.savePlaintextDebug(existingData, addedCount, skippedCount);
    }

    return { success: true, added: addedCount, skipped: skippedCount, total: existingData.metadata.totalJobs };
  }

  /**
   * Save plaintext debug log for GitHub Actions artifacts
   * WARNING: This file is NOT committed to Git (excluded by .gitignore)
   * Only created when CREATE_DEBUG_LOGS=true environment variable is set
   * @param {Object} data - Complete jobs data (metadata + jobs array)
   * @param {number} addedCount - Jobs added this run
   * @param {number} skippedCount - Jobs skipped this run
   */
  savePlaintextDebug(data, addedCount, skippedCount) {
    const logsDir = path.join(process.cwd(), '.github', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const outputPath = path.join(logsDir, `jobs-debug-${timestamp}.log`);

    // Format for easy reading
    const debugOutput = {
      metadata: {
        ...data.metadata,
        generated: new Date().toISOString(),
        addedThisRun: addedCount,
        skippedThisRun: skippedCount,
        warning: 'DEBUG LOG - Not committed to Git (GitHub Actions artifact only)'
      },
      jobs: data.jobs,
      categoryBreakdown: this.getCategoryBreakdown(data.jobs)
    };

    fs.writeFileSync(outputPath, JSON.stringify(debugOutput, null, 2));
    console.log(`📊 Debug log saved (GitHub Actions artifact): ${outputPath}`);
    console.log(`   ⚠️  NOT committed to Git (excluded by .gitignore)`);
  }

  /**
   * Get category breakdown statistics
   * @param {Array} jobs - Array of job objects
   * @returns {Object} Category counts
   */
  getCategoryBreakdown(jobs) {
    const breakdown = {};
    jobs.forEach(job => {
      const category = job.category || 'Uncategorized';
      breakdown[category] = (breakdown[category] || 0) + 1;
    });
    return breakdown;
  }

  getJobs(filters = {}) {
    const data = this.loadExistingData();
    let jobs = data.jobs;

    if (filters.category) jobs = jobs.filter(j => j.category.toLowerCase() === filters.category.toLowerCase());
    if (filters.location) jobs = jobs.filter(j => j.location.toLowerCase().includes(filters.location.toLowerCase()) || j.state.toLowerCase().includes(filters.location.toLowerCase()));
    if (filters.company) jobs = jobs.filter(j => j.company.toLowerCase().includes(filters.company.toLowerCase()));
    if (filters.limit) jobs = jobs.slice(0, filters.limit);

    return jobs;
  }
}

module.exports = JobsDataExporter;

if (require.main === module) {
  const exporter = new JobsDataExporter();
  const newJobsPath = path.join(process.cwd(), '.github', 'data', 'new_jobs.json');
  if (fs.existsSync(newJobsPath)) {
    const newJobs = JSON.parse(fs.readFileSync(newJobsPath, 'utf8'));
    exporter.exportJobs(newJobs);
  }
}
