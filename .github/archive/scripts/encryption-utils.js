#!/usr/bin/env node

const crypto = require('crypto');

/**
 * Encrypt log data using AES-256-GCM
 * @param {Object|Array} data - Data to encrypt
 * @param {string} password - Encryption password
 * @returns {Object} Encrypted data with IV and auth tag
 */
function encryptLog(data, password) {
  const algorithm = 'aes-256-gcm';

  // Derive key from password using scrypt
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 32);

  // Generate random IV
  const iv = crypto.randomBytes(16);

  // Create cipher
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  // Encrypt data
  let encrypted = cipher.update(JSON.stringify(data, null, 2), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    authTag: authTag.toString('hex'),
    algorithm,
    timestamp: new Date().toISOString()
  };
}

/**
 * Decrypt encrypted log data
 * @param {Object} encryptedData - Encrypted data object
 * @param {string} password - Decryption password
 * @returns {Object|Array} Decrypted data
 */
function decryptLog(encryptedData, password) {
  const { encrypted, iv, salt, authTag, algorithm } = encryptedData;

  if (!encrypted || !iv || !salt || !authTag) {
    throw new Error('Invalid encrypted data format');
  }

  // Derive key from password using same salt
  const key = crypto.scryptSync(password, Buffer.from(salt, 'hex'), 32);

  // Create decipher
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(iv, 'hex')
  );

  // Set authentication tag
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  // Decrypt data
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

/**
 * Test encryption/decryption
 */
function testEncryption() {
  const testData = {
    message: 'Test log entry',
    job: 'Software Engineer @ Google',
    channel: 'tech-jobs'
  };

  const password = 'test-password-123';

  console.log('🔐 Testing encryption...');
  console.log('Original data:', testData);

  const encrypted = encryptLog(testData, password);
  console.log('\n✅ Encrypted successfully');
  console.log('Encrypted (preview):', encrypted.encrypted.substring(0, 50) + '...');

  const decrypted = decryptLog(encrypted, password);
  console.log('\n🔓 Decrypted successfully');
  console.log('Decrypted data:', decrypted);

  if (JSON.stringify(testData) === JSON.stringify(decrypted)) {
    console.log('\n✅ Encryption/Decryption test PASSED');
  } else {
    console.log('\n❌ Encryption/Decryption test FAILED');
    process.exit(1);
  }
}

// Run test if executed directly
if (require.main === module) {
  testEncryption();
}

module.exports = {
  encryptLog,
  decryptLog
};
