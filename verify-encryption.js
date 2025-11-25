#!/usr/bin/env node

/**
 * Verification script for jobs-data-encrypted.json decryption
 * Tests that the encryption workflow is working correctly
 *
 * Usage:
 *   Set environment variable: $env:JOBS_DECRYPT_PASSWORD = "your-password"
 *   node verify-encryption.js
 */

const fs = require('fs');
const path = require('path');
const { decryptLog } = require('./.github/scripts/encryption-utils');

// Get password from environment
// NOTE: For symmetric encryption (AES-256-GCM), same key encrypts AND decrypts
// Use LOG_ENCRYPT_PASSWORD for consistency with GitHub workflow
const password = process.env.LOG_ENCRYPT_PASSWORD;

if (!password) {
  console.error('❌ Error: LOG_ENCRYPT_PASSWORD environment variable not set');
  console.error('\nUsage:');
  console.error('  export LOG_ENCRYPT_PASSWORD="aDNQgatCmduwo5ZK/YyPUFp7oiokaG8wrB/G3jYmdAU="');
  console.error('  node verify-encryption.js');
  console.error('\nNote: This is the SAME password used for encryption (symmetric encryption)');
  process.exit(1);
}

// Path to encrypted jobs data
const encryptedFilePath = path.join(process.cwd(), '.github', 'data', 'jobs-data-encrypted.json');

// Check if file exists
if (!fs.existsSync(encryptedFilePath)) {
  console.error('❌ Error: Encrypted jobs data file not found');
  console.error(`   Expected: ${encryptedFilePath}`);
  console.error('\nThe workflow may not have run yet.');
  process.exit(1);
}

try {
  console.log('🔓 Decrypting jobs data...\n');

  // Read encrypted data
  const encryptedData = JSON.parse(fs.readFileSync(encryptedFilePath, 'utf8'));

  // Decrypt
  const decrypted = decryptLog(encryptedData, password);

  // Display results
  console.log('✅ Successfully decrypted!\n');
  console.log('='.repeat(80));
  console.log('JOBS DATA VERIFICATION');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${encryptedData.timestamp || 'N/A'}`);
  console.log(`Algorithm: ${encryptedData.algorithm}`);
  console.log(`Total Jobs: ${Array.isArray(decrypted) ? decrypted.length : 'Invalid format'}`);
  console.log('='.repeat(80));

  // Verify data structure
  if (Array.isArray(decrypted)) {
    console.log('\n✅ Data structure valid (array)');

    if (decrypted.length > 0) {
      console.log('\nFirst job preview:');
      const firstJob = decrypted[0];
      console.log(`  ID: ${firstJob.id || 'N/A'}`);
      console.log(`  Company: ${firstJob.company_name || 'N/A'}`);
      console.log(`  Title: ${firstJob.title || 'N/A'}`);
      console.log(`  Location: ${firstJob.location || (firstJob.locations ? firstJob.locations[0] : 'N/A')}`);

      // Verify sensitive fields are removed (security check)
      console.log('\n🔒 Security verification:');
      const hasSensitiveFields = decrypted.some(job =>
        job.source || job.platform || job.employmentType
      );

      if (hasSensitiveFields) {
        console.log('  ⚠️  WARNING: Sensitive fields detected (source/platform/employmentType)');
        console.log('  These should be sanitized before encryption!');
      } else {
        console.log('  ✅ No sensitive fields detected (sanitization working)');
      }
    } else {
      console.log('  ⚠️  No jobs in encrypted file (workflow may not have posted new jobs yet)');
    }
  } else {
    console.log('  ❌ Invalid data structure (expected array)');
  }

  console.log('\n='.repeat(80));
  console.log('✅ ENCRYPTION WORKFLOW VERIFICATION COMPLETE');
  console.log('='.repeat(80));

} catch (error) {
  console.error('\n❌ Decryption failed!');
  console.error(`Error: ${error.message}`);
  console.error('\nPossible causes:');
  console.error('  1. Wrong password');
  console.error('  2. Corrupted encrypted file');
  console.error('  3. Encryption algorithm mismatch');
  process.exit(1);
}
