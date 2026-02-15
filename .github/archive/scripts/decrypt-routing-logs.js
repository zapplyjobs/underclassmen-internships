#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { decryptLog } = require('./encryption-utils');

// Get password from environment or prompt
// NOTE: For symmetric encryption (AES-256-GCM), use the SAME password as LOG_ENCRYPT_PASSWORD
// LOG_DECRYPT_PASSWORD is kept for backward compatibility but should match LOG_ENCRYPT_PASSWORD
const password = process.env.LOG_DECRYPT_PASSWORD || process.env.LOG_ENCRYPT_PASSWORD;

if (!password) {
  console.error('❌ Error: LOG_DECRYPT_PASSWORD (or LOG_ENCRYPT_PASSWORD) environment variable not set');
  console.error('\nUsage:');
  console.error('  export LOG_DECRYPT_PASSWORD="your-password"');
  console.error('  # OR (same password, symmetric encryption):');
  console.error('  export LOG_ENCRYPT_PASSWORD="your-password"');
  console.error('  node .github/scripts/decrypt-routing-logs.js');
  process.exit(1);
}

// Path to encrypted log file
const encryptedLogPath = path.join(
  process.cwd(),
  '.github',
  'audit',
  'routing-encrypted.json'
);

// Check if file exists
if (!fs.existsSync(encryptedLogPath)) {
  console.error('❌ Error: Encrypted log file not found');
  console.error(`   Expected: ${encryptedLogPath}`);
  console.error('\nThe bot may not have run yet, or no jobs were posted.');
  process.exit(1);
}

try {
  console.log('🔓 Decrypting routing logs...\n');

  // Read encrypted data
  const encryptedData = JSON.parse(fs.readFileSync(encryptedLogPath, 'utf8'));

  // Decrypt
  const decrypted = decryptLog(encryptedData, password);

  // Display results
  console.log('✅ Successfully decrypted!\n');
  console.log('=' .repeat(80));
  console.log('CHANNEL ROUTING DEBUG LOG');
  console.log('=' .repeat(80));
  console.log(`Timestamp: ${encryptedData.timestamp}`);
  console.log(`Total Jobs: ${decrypted.length}`);
  console.log('=' .repeat(80));
  console.log();

  // Display each job routing
  decrypted.forEach((entry, index) => {
    console.log(`[${index + 1}] ${entry.job_title} @ ${entry.company}`);
    console.log(`    Category: ${entry.category}`);
    console.log(`    Matched Keyword: "${entry.matched_keyword || 'default'}"`);
    console.log(`    Channel: ${entry.channel_name || 'N/A'}`);
    console.log(`    Channel ID: ${entry.channel_id}`);
    if (entry.location_channel) {
      console.log(`    Location Channel: ${entry.location_channel_name || 'N/A'}`);
      console.log(`    Location ID: ${entry.location_channel_id}`);
    }
    console.log();
  });

  // Summary by category
  const categoryCount = {};
  decrypted.forEach(entry => {
    categoryCount[entry.category] = (categoryCount[entry.category] || 0) + 1;
  });

  console.log('=' .repeat(80));
  console.log('CATEGORY SUMMARY');
  console.log('=' .repeat(80));
  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`${category.padEnd(20)} ${count} jobs`);
    });
  console.log('=' .repeat(80));

  // Optionally save decrypted JSON
  const outputPath = path.join(process.cwd(), '.local', 'routing-logs-decrypted.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(decrypted, null, 2));
  console.log(`\n💾 Decrypted logs saved to: ${outputPath}`);

} catch (error) {
  if (error.message.includes('Unsupported state or unable to authenticate data')) {
    console.error('❌ Decryption failed: Invalid password');
    console.error('   Please check your LOG_DECRYPT_PASSWORD environment variable');
  } else {
    console.error('❌ Decryption failed:', error.message);
  }
  process.exit(1);
}
