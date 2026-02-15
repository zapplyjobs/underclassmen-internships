#!/usr/bin/env node

/**
 * validate-secrets.js
 *
 * Purpose: Validate that all required secrets are documented and properly referenced
 * Usage: node .github/scripts/validate-secrets.js
 * Exit codes: 0 = success, 1 = validation failed
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Required secrets from SECRETS.md
const REQUIRED_SECRETS = [
  'JSEARCH_API_KEY',
  'LOG_ENCRYPT_PASSWORD'
];

const OPTIONAL_SECRETS = [
  'USE_JSEARCH',
  'JOB_PROCESSOR_URL'
];

const AUTOMATIC_SECRETS = [
  'GITHUB_TOKEN'
];

/**
 * Log message with color
 */
function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

/**
 * Read SECRETS.md and extract documented secrets
 */
function extractSecretsFromDocs() {
  const secretsPath = path.join(process.cwd(), 'SECRETS.md');

  if (!fs.existsSync(secretsPath)) {
    log(colors.red, '❌', 'SECRETS.md not found!');
    return [];
  }

  const content = fs.readFileSync(secretsPath, 'utf8');
  const secrets = [];

  // Extract secrets from headers (## 1. SECRET_NAME)
  const headerRegex = /## \d+\.\s+([A-Z_]+)/g;
  let match;
  while ((match = headerRegex.exec(content)) !== null) {
    secrets.push(match[1]);
  }

  // Extract secrets from table format (| `SECRET_NAME` |)
  const tableRegex = /\|\s*`([A-Z_]+)`\s*\|/g;
  while ((match = tableRegex.exec(content)) !== null) {
    const secret = match[1];
    if (!secrets.includes(secret)) {
      secrets.push(secret);
    }
  }

  log(colors.green, '✅', `Found ${secrets.length} secrets documented in SECRETS.md`);
  return secrets;
}

/**
 * Scan workflow files for secret references
 */
function findSecretsInWorkflows() {
  const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
  const secretReferences = new Set();

  if (!fs.existsSync(workflowsDir)) {
    log(colors.yellow, '⚠️',  'Workflows directory not found');
    return Array.from(secretReferences);
  }

  const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

  files.forEach(file => {
    const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
    // Match secrets.SECRET_NAME or secrets.SECRET_NAME ||
    const secretRegex = /secrets\.([A-Z_]+)/g;
    let match;
    while ((match = secretRegex.exec(content)) !== null) {
      secretReferences.add(match[1]);
    }
  });

  log(colors.blue, '📋', `Found ${secretReferences.size} secret references in workflow files`);
  return Array.from(secretReferences);
}

/**
 * Check for hardcoded secrets (basic patterns)
 */
function checkForHardcodedSecrets() {
  const issues = [];
  const sensitivePatterns = [
    /api[_-]?key\s*[:=]\s*['"][^'"]{10,}['"]/gi,
    /password\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    /token\s*[:=]\s*['"][^'"]{20,}['"]/gi,
    /sk-[a-zA-Z0-9]{32,}/g,  // Stripe-like keys
    /ghp_[a-zA-Z0-9]{36,}/g   // GitHub personal access tokens
  ];

  // Skip test/example values (not real secrets)
  const skipPatterns = [
    /test[_-]?password/i,
    /example[_-]?key/i,
    /demo[_-]?token/i,
    /placeholder/i,
    /xxx/i,
    /test-123/i,
    /dummy/i,
    /process\.env\./i,  // Environment variable references are OK
    /LOG_DECRYPT_PASSWORD/i,
    /LOG_ENCRYPT_PASSWORD/i,
    /\/\/.*password/i,   // Comments mentioning password are OK
    /NOTE:.*password/i,  // Notes mentioning password are OK
    /symmetric encryption/i  // Encryption comments are OK
  ];

  // Files to skip (known false positives)
  const skipFiles = [
    'decrypt-routing-logs.js',
    'encryption-utils.js'
  ];

  // Check common script locations (only scripts, not app code)
  const scriptDirs = [
    path.join(process.cwd(), '.github', 'scripts')
  ];

  scriptDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;

    const scanDir = (d) => {
      const items = fs.readdirSync(d, { withFileTypes: true });
      items.forEach(item => {
        const fullPath = path.join(d, item.name);
        if (item.isDirectory()) {
          scanDir(fullPath);
        } else if (item.name.endsWith('.js')) {
          // Skip known false positive files
          if (skipFiles.some(sf => fullPath.includes(sf))) {
            return;
          }
          const content = fs.readFileSync(fullPath, 'utf8');
          sensitivePatterns.forEach((pattern, idx) => {
            if (pattern.test(content)) {
              // Reset regex for exec
              pattern.lastIndex = 0;
              let match;
              let foundRealSecret = false;
              while ((match = pattern.exec(content)) !== null) {
                const matchText = match[0];
                // Check if this is a test value
                const isTestValue = skipPatterns.some(skipPattern => skipPattern.test(matchText));
                if (!isTestValue) {
                  foundRealSecret = true;
                  break;
                }
              }
              if (foundRealSecret) {
                issues.push(`${fullPath}:${idx + 1} - potential hardcoded secret`);
              }
            }
          });
        }
      });
    };

    scanDir(dir);
  });

  return issues;
}

/**
 * Main validation function
 */
function validate() {
  console.log('\n' + '='.repeat(60));
  console.log('🔐 Secrets Validation');
  console.log('='.repeat(60) + '\n');

  let hasErrors = false;
  const documentedSecrets = extractSecretsFromDocs();
  const referencedSecrets = findSecretsInWorkflows();

  // Check 1: All required secrets are documented
  console.log('\n📋 Checking required secrets...');
  REQUIRED_SECRETS.forEach(secret => {
    if (documentedSecrets.includes(secret)) {
      log(colors.green, '  ✅', `${secret} is documented`);
    } else {
      log(colors.red, '  ❌', `${secret} is NOT documented in SECRETS.md`);
      hasErrors = true;
    }
  });

  // Check 2: All referenced secrets are documented
  console.log('\n📋 Checking workflow references...');
  referencedSecrets.forEach(secret => {
    if (AUTOMATIC_SECRETS.includes(secret)) {
      log(colors.blue, '  ℹ️', `${secret} is automatic (provided by GitHub)`);
    } else if (documentedSecrets.includes(secret)) {
      log(colors.green, '  ✅', `${secret} is documented`);
    } else {
      log(colors.yellow, '  ⚠️', `${secret} is referenced but NOT documented`);
      hasErrors = true;
    }
  });

  // Check 3: No hardcoded secrets
  console.log('\n🔍 Checking for hardcoded secrets...');
  const hardcodedIssues = checkForHardcodedSecrets();
  if (hardcodedIssues.length === 0) {
    log(colors.green, '✅', 'No hardcoded secrets detected');
  } else {
    log(colors.red, '❌', `Found ${hardcodedIssues.length} potential hardcoded secrets:`);
    hardcodedIssues.forEach(issue => {
      log(colors.red, '  ❌', issue);
    });
    hasErrors = true;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (hasErrors) {
    log(colors.red, '❌', 'Validation FAILED - Please fix the issues above');
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  } else {
    log(colors.green, '✅', 'All checks PASSED - Secrets are properly configured');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  }
}

// Run validation
validate();
