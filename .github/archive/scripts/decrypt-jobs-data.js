#!/usr/bin/env node

/**
 * Decrypt jobs-data-encrypted.json
 * Displays the decrypted contents for debugging/verification
 */

const fs = require('fs');
const path = require('path');
const { decryptLog } = require('./encryption-utils');

const ENCRYPTED_FILE = path.join(process.cwd(), '.github', 'data', 'jobs-data-encrypted.json');
const PASSWORD = process.env.LOG_ENCRYPT_PASSWORD;

if (!PASSWORD) {
  console.error('❌ Error: LOG_ENCRYPT_PASSWORD environment variable not set');
  process.exit(1);
}

if (!fs.existsSync(ENCRYPTED_FILE)) {
  console.error('❌ Error: jobs-data-encrypted.json not found');
  process.exit(1);
}

console.log('🔓 Decrypting jobs-data-encrypted.json...\n');

try {
  const encryptedData = JSON.parse(fs.readFileSync(ENCRYPTED_FILE, 'utf8'));
  const decryptedData = decryptLog(encryptedData, PASSWORD);

  console.log('✅ Decryption successful!\n');
  console.log('📊 Metadata:');
  console.log(`   Version: ${decryptedData.metadata?.version || 'N/A'}`);
  console.log(`   Created: ${decryptedData.metadata?.created || 'N/A'}`);
  console.log(`   Last Updated: ${decryptedData.metadata?.lastUpdated || 'N/A'}`);
  console.log(`   Total Jobs: ${decryptedData.metadata?.totalJobs || 0}`);

  if (decryptedData.jobs && Array.isArray(decryptedData.jobs)) {
    console.log(`\n📋 Jobs (${decryptedData.jobs.length} total):\n`);

    // Show first 5 jobs
    const samplesToShow = Math.min(5, decryptedData.jobs.length);
    for (let i = 0; i < samplesToShow; i++) {
      const job = decryptedData.jobs[i];
      console.log(`${i + 1}. ${job.title || 'N/A'} @ ${job.company || 'N/A'}`);
      console.log(`   Location: ${job.location || 'N/A'}`);
      console.log(`   Posted: ${job.postedDate || 'N/A'}`);
      console.log(`   Description: ${job.description ? (job.description.substring(0, 100) + '...') : 'N/A'}`);
      console.log('');
    }

    if (decryptedData.jobs.length > samplesToShow) {
      console.log(`... and ${decryptedData.jobs.length - samplesToShow} more jobs\n`);
    }

    // Check for jobs without descriptions
    const jobsWithoutDesc = decryptedData.jobs.filter(j => !j.description || j.description.trim() === '');
    if (jobsWithoutDesc.length > 0) {
      console.log(`⚠️  Warning: ${jobsWithoutDesc.length} jobs have missing descriptions`);
    } else {
      console.log(`✅ All ${decryptedData.jobs.length} jobs have descriptions`);
    }
  }

  // Optional: Write decrypted data to file for inspection
  if (process.env.WRITE_DECRYPTED === 'true') {
    const outputPath = path.join(process.cwd(), '.github', 'data', 'jobs-data-decrypted.json');
    fs.writeFileSync(outputPath, JSON.stringify(decryptedData, null, 2));
    console.log(`\n💾 Decrypted data written to: ${outputPath}`);
  }

} catch (error) {
  console.error('❌ Decryption failed:', error.message);
  process.exit(1);
}
