#!/usr/bin/env node

/**
 * Audit Log Generator - Creates obfuscated logs for git commits
 *
 * Sanitizes bot logs for repository commits while preserving debugging capability.
 * Company names, job titles, and Discord IDs are hashed for privacy.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Paths
const logsDir = path.join(process.cwd(), '.github', 'logs');
const auditDir = path.join(process.cwd(), '.github', 'audit');
const latestLogPath = path.join(logsDir, 'latest.log');

// Create audit directory if it doesn't exist
if (!fs.existsSync(auditDir)) {
  fs.mkdirSync(auditDir, { recursive: true });
}

// Hash function for obfuscation
function obfuscate(text) {
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 8);
}

// Read the latest bot log
if (!fs.existsSync(latestLogPath)) {
  console.log('ℹ️  No latest.log found, skipping audit log creation');
  process.exit(0);
}

const logContent = fs.readFileSync(latestLogPath, 'utf8');
const lines = logContent.split('\n');

// Sanitize log lines
const sanitizedLines = lines.map(line => {
  let sanitized = line;

  // Remove Discord channel IDs (long numbers starting with 14)
  sanitized = sanitized.replace(/\d{18,}/g, (match) => `CH_${obfuscate(match)}`);

  // Obfuscate company names (after "@ ")
  sanitized = sanitized.replace(/@\s+([A-Z][A-Za-z\s&.]+?)(?=\s|$|in)/g, (match, company) => {
    return `@ ORG_${obfuscate(company.trim())}`;
  });

  // Obfuscate job titles (specific patterns)
  sanitized = sanitized.replace(/Posted:\s+([A-Z][A-Za-z\s]+?)\s+at/g, (match, title) => {
    return `Posted: ROLE_${obfuscate(title.trim())} at`;
  });

  sanitized = sanitized.replace(/Skipping already posted.*?:\s+([A-Z][A-Za-z\s]+?)\s+at/g, (match, title) => {
    return match.replace(title, `ROLE_${obfuscate(title.trim())}`);
  });

  // Obfuscate job IDs (alphanumeric with dashes)
  sanitized = sanitized.replace(/\b([a-z0-9]+-){2,}[a-z0-9]+\b/g, (match) => {
    return `JID_${obfuscate(match)}`;
  });

  // Keep emojis, status indicators, and numbers
  return sanitized;
});

// Extract key metrics for audit summary
const metrics = {
  timestamp: new Date().toISOString(),
  botExitCode: 0,
  jobsPosted: 0,
  jobsFailed: 0,
  jobsSkipped: 0,
  databaseSaved: false,
  errors: []
};

for (const line of lines) {
  if (line.includes('Successfully posted:')) {
    const match = line.match(/Successfully posted:\s+(\d+)/);
    if (match) metrics.jobsPosted = parseInt(match[1]);
  }
  if (line.includes('Failed:')) {
    const match = line.match(/Failed:\s+(\d+)/);
    if (match) metrics.jobsFailed = parseInt(match[1]);
  }
  if (line.includes('Skipping already posted')) {
    metrics.jobsSkipped++;
  }
  if (line.includes('💾 Saved')) {
    metrics.databaseSaved = true;
  }
  if (line.includes('Bot exited with code:')) {
    const match = line.match(/code:\s+(\d+)/);
    if (match) metrics.botExitCode = parseInt(match[1]);
  }
  if (line.includes('❌') || line.includes('ERROR')) {
    metrics.errors.push(line.substring(line.indexOf(']') + 1).trim());
  }
}

// Create audit log content
const auditContent = [
  '# Discord Bot Execution Audit',
  `**Timestamp:** ${metrics.timestamp}`,
  `**Exit Code:** ${metrics.botExitCode === 0 ? '✅ Success' : '❌ Failed'}`,
  '',
  '## Metrics',
  `- **Jobs Posted:** ${metrics.jobsPosted}`,
  `- **Jobs Failed:** ${metrics.jobsFailed}`,
  `- **Jobs Skipped:** ${metrics.jobsSkipped}`,
  `- **Database Saved:** ${metrics.databaseSaved ? '✅ Yes' : '❌ No'}`,
  '',
  '## Sanitized Log Output',
  '```',
  ...sanitizedLines,
  '```',
  '',
  metrics.errors.length > 0 ? '## Errors Detected' : '',
  ...metrics.errors.map(err => `- ${err}`),
  '',
  '---',
  '*Log sanitized for repository commit. Full logs available as GitHub Actions artifacts.*'
].filter(line => line !== '').join('\n');

// Save audit log with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
const auditFilePath = path.join(auditDir, `audit-${timestamp}.md`);
fs.writeFileSync(auditFilePath, auditContent);

console.log(`✅ Audit log created: ${path.relative(process.cwd(), auditFilePath)}`);

// Also save as latest.md for easy access
const latestAuditPath = path.join(auditDir, 'latest.md');
fs.writeFileSync(latestAuditPath, auditContent);
console.log(`✅ Latest audit log: ${path.relative(process.cwd(), latestAuditPath)}`);

// Output metrics for workflow
console.log(`\n📊 Session Summary:`);
console.log(`   Posted: ${metrics.jobsPosted} | Failed: ${metrics.jobsFailed} | Skipped: ${metrics.jobsSkipped}`);
console.log(`   Database Saved: ${metrics.databaseSaved ? 'YES' : 'NO'}`);

// Exit with error if database wasn't saved but jobs were posted
if (metrics.jobsPosted > 0 && !metrics.databaseSaved) {
  console.error('\n❌ CRITICAL: Jobs were posted but database was not saved!');
  console.error('   This will cause duplicate postings in the next run.');
  process.exit(1);
}

process.exit(0);
