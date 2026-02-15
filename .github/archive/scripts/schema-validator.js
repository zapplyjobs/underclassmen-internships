#!/usr/bin/env node

/**
 * Schema Validator for posted_jobs.json
 *
 * Validates job records against required schema
 * Prevents missing field bugs (Bug #3 class)
 *
 * Usage: node .github/scripts/schema-validator.js
 */

const fs = require('fs');
const path = require('path');

// Job record schema definition
const JOB_RECORD_SCHEMA = {
  required: ['id', 'jobId', 'company', 'title', 'postedToDiscord', 'sourceDate', 'sourceUrl'],
  optional: ['discordPosts', 'instanceNumber', 'discordThreadId']
};

/**
 * Validate a single job record
 */
function validateJobRecord(job, index) {
  const errors = [];

  // Check required fields exist
  for (const field of JOB_RECORD_SCHEMA.required) {
    if (job[field] === undefined || job[field] === null || job[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate field types
  if (job.id && typeof job.id !== 'string') {
    errors.push(`Field 'id' must be string, got ${typeof job.id}`);
  }

  if (job.jobId && typeof job.jobId !== 'string') {
    errors.push(`Field 'jobId' must be string, got ${typeof job.jobId}`);
  }

  if (job.company && typeof job.company !== 'string') {
    errors.push(`Field 'company' must be string, got ${typeof job.company}`);
  }

  if (job.title && typeof job.title !== 'string') {
    errors.push(`Field 'title' must be string, got ${typeof job.title}`);
  }

  if (job.sourceUrl && typeof job.sourceUrl !== 'string') {
    errors.push(`Field 'sourceUrl' must be string, got ${typeof job.sourceUrl}`);
  }

  // Validate ISO date strings
  if (job.postedToDiscord && !isValidDateString(job.postedToDiscord)) {
    errors.push(`Field 'postedToDiscord' must be valid ISO date, got: ${job.postedToDiscord}`);
  }

  if (job.sourceDate && !isValidDateString(job.sourceDate)) {
    errors.push(`Field 'sourceDate' must be valid ISO date, got: ${job.sourceDate}`);
  }

  // Validate discordPosts is object if present
  if (job.discordPosts && typeof job.discordPosts !== 'object') {
    errors.push(`Field 'discordPosts' must be object, got ${typeof job.discordPosts}`);
  }

  // Validate instanceNumber is number if present
  if (job.instanceNumber !== undefined && typeof job.instanceNumber !== 'number') {
    errors.push(`Field 'instanceNumber' must be number, got ${typeof job.instanceNumber}`);
  }

  return errors;
}

/**
 * Check if string is valid ISO date
 */
function isValidDateString(str) {
  if (typeof str !== 'string') return false;
  const date = new Date(str);
  return date instanceof Date && !isNaN(date);
}

/**
 * Main validation function
 */
function validatePostedJobs(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`✓ No posted_jobs.json file (new repo)`);
    return { valid: true, errorCount: 0 };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let data;

  try {
    data = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Invalid JSON in ${filePath}`);
    console.error(`   Error: ${error.message}`);
    return { valid: false, errorCount: 1 };
  }

  // Check version field
  if (!data.version) {
    console.error(`❌ Missing 'version' field in posted_jobs.json`);
    return { valid: false, errorCount: 1 };
  }

  if (!data.jobs || !Array.isArray(data.jobs)) {
    console.error(`❌ Missing or invalid 'jobs' array in posted_jobs.json`);
    return { valid: false, errorCount: 1 };
  }

  // Validate each job record
  let totalErrors = 0;
  const invalidJobs = [];

  for (let i = 0; i < data.jobs.length; i++) {
    const job = data.jobs[i];
    const errors = validateJobRecord(job, i);

    if (errors.length > 0) {
      totalErrors += errors.length;
      invalidJobs.push({ index: i, jobId: job.jobId || 'unknown', errors });
    }
  }

  // Report results
  if (totalErrors > 0) {
    console.error(`\n❌ Schema validation FAILED: ${totalErrors} errors found\n`);

    // Show first 5 invalid jobs
    const displayJobs = invalidJobs.slice(0, 5);
    for (const { index, jobId, errors } of displayJobs) {
      console.error(`Job #${index} (${jobId}):`);
      for (const error of errors) {
        console.error(`  - ${error}`);
      }
    }

    if (invalidJobs.length > 5) {
      console.error(`\n... and ${invalidJobs.length - 5} more invalid jobs`);
    }

    return { valid: false, errorCount: totalErrors };
  }

  console.log(`✓ Schema validation passed: ${data.jobs.length} job records validated`);
  return { valid: true, errorCount: 0 };
}

// Main execution
if (require.main === module) {
  const dbPath = path.join(__dirname, '../data/posted_jobs.json');
  const result = validatePostedJobs(dbPath);

  process.exit(result.valid ? 0 : 1);
}

module.exports = { validatePostedJobs, validateJobRecord };
