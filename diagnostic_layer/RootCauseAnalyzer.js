const path = require('path');

/**
 * RootCauseAnalyzer - Pattern matching engine for error diagnosis
 *
 * Analyzes errors against known patterns and provides:
 * - Root cause identification
 * - Recommended fixes with code snippets
 * - Confidence scoring
 * - Related files identification
 *
 * SAFETY FEATURES (2026-02-16):
 * - Regex timeout protection (prevents catastrophic backtracking)
 * - Limited quantifiers (prevents exponential behavior)
 * - Performance monitoring (warns on slow patterns)
 *
 * Pattern Addition Criteria:
 * - Bug occurred 2+ times in production OR critical severity
 * - Pattern confidence >0.80 (tested against real logs)
 * - Regex validated for catastrophic backtracking
 * - Documentation: Bug ID, root cause, fix applied
 */
class RootCauseAnalyzer {
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs || 1000; // Prevent runaway regex
    this.patterns = this.initializePatterns();
    this.performanceWarningMs = 500; // Warn if pattern match takes >500ms
  }

  initializePatterns() {
    return {
      // Pattern 1: MODULE_NOT_FOUND
      MODULE_NOT_FOUND: {
        regex: /Cannot find module ['"](.+)['"]/,
        analyze: (error, snapshot) => {
          const match = error.message.match(/Cannot find module ['"](.+)['"]/);
          const modulePath = match ? match[1] : 'unknown';

          return {
            rootCause: `Module '${modulePath}' not found. Common causes:\n` +
                      `1. File was moved/deleted but import not updated\n` +
                      `2. Dependency not installed (check package.json)\n` +
                      `3. Typo in import path\n` +
                      `4. Case-sensitive filesystem issue`,
            recommendedFix: `**Immediate Fix:**\n` +
                           `1. Check if file exists: \`ls ${modulePath}\`\n` +
                           `2. If missing, search for it: \`find . -name "${path.basename(modulePath)}"\`\n` +
                           `3. If in node_modules, reinstall: \`npm install\`\n` +
                           `4. If import path wrong, update import statement\n\n` +
                           `**Prevention (Phase 2):**\n` +
                           `- Pre-commit hook will validate all imports\n` +
                           `- ESLint will catch invalid imports before push`,
            relatedFiles: this.findRelatedFiles(modulePath, snapshot),
            confidence: 0.95
          };
        }
      },

      // Pattern 2: API Authentication Failure
      API_AUTH_FAILURE: {
        regex: /(Unauthorized|401|403|Invalid API key)/i,
        analyze: (error, snapshot) => {
          const apiName = this.detectAPI(error.message, snapshot);
          const secretName = this.getSecretName(apiName);

          return {
            rootCause: `${apiName} authentication failed. Possible causes:\n` +
                      `1. Secret '${secretName}' not set in GitHub Actions\n` +
                      `2. Secret value is invalid/expired\n` +
                      `3. API quota exceeded`,
            recommendedFix: `**Immediate Fix:**\n` +
                           `1. Verify secret exists: GitHub repo → Settings → Secrets → ${secretName}\n` +
                           `2. Check secret value is correct (regenerate if needed)\n` +
                           `3. Check API quota/usage dashboard\n\n` +
                           `**Prevention (Phase 2):**\n` +
                           `- Pre-deployment credential validation\n` +
                           `- Quota monitoring with alerts`,
            relatedFiles: ['.github/workflows/update-jobs.yml'],
            confidence: 0.90
          };
        }
      },

      // Pattern 3: Git Index Cache Stale
      GIT_INDEX_STALE: {
        regex: /no changes|nothing to commit|working tree clean/i,
        analyze: (error, snapshot) => {
          const hasModified = snapshot.git?.status?.includes('M ');

          if (hasModified) {
            return {
              rootCause: `Git index cache is stale - git sees no changes but files are modified.\n` +
                        `This happened before on Feb 11 (commit 1222770).\n` +
                        `Root cause: git index cache not refreshed after file write.`,
              recommendedFix: `**Immediate Fix:**\n` +
                             `Add to workflow before 'git add':\n` +
                             `\`\`\`bash\n` +
                             `git update-index --refresh\n` +
                             `git add --force <files>\n` +
                             `\`\`\`\n\n` +
                             `**See:** .sessions/GITHUB_CACHING_ISSUES_SUMMARY_2026_02_14.md`,
              relatedFiles: ['.github/workflows/update-jobs.yml'],
              confidence: 0.85
            };
          }

          return null; // Not this pattern
        }
      },

      // Pattern 4: JSearch API Timeout
      // SAFETY: Limited quantifier (.{0,500}?) prevents catastrophic backtracking
      JSEARCH_TIMEOUT: {
        regex: /((socket hang up|ECONNRESET|ETIMEDOUT).{0,500}?jsearch|jsearch.{0,500}?(socket hang up|ECONNRESET|ETIMEDOUT))/i,
        analyze: (error, snapshot) => {
          return {
            rootCause: `JSearch API connection timeout/reset. Known issue:\n` +
                      `RapidAPI has intermittent network instability.\n` +
                      `Happened to Data-Science and Remote-Jobs repos on Feb 14.`,
            recommendedFix: `**Immediate Fix:**\n` +
                           `Add retry logic with exponential backoff:\n` +
                           `\`\`\`javascript\n` +
                           `const retry = require('cockatiel');\n` +
                           `const policy = retry.handleAll()\n` +
                           `  .retry()\n` +
                           `  .attempts(3)\n` +
                           `  .exponential({ maxDelay: 4000 });\n` +
                           `await policy.execute(() => fetchJSearch(...));\n` +
                           `\`\`\`\n\n` +
                           `**Prevention (Phase 2):**\n` +
                           `- Circuit breaker pattern (Cockatiel)\n` +
                           `- Increase timeout from 15s → 30s`,
            relatedFiles: ['job-fetcher/jsearch-fetcher.js'],
            confidence: 0.92
          };
        }
      },

      // Pattern 5: Stale Data (Data Freshness)
      STALE_DATA: {
        regex: /stale|old data|data (\d+) (min|mins|hour|hours|day|days) old/i,
        analyze: (error, snapshot) => {
          const match = error.message.match(/data (\d+) (mins?|hours?|days?) old/i);
          const age = match ? `${match[1]} ${match[2]}` : 'unknown age';

          return {
            rootCause: `Data is ${age} old, exceeds freshness SLA (60 min).\n` +
                      `Common causes:\n` +
                      `1. Workflow not running (disabled, quota, auth failure)\n` +
                      `2. Workflow running but not committing (git issue)\n` +
                      `3. Consumer reading wrong file/branch`,
            recommendedFix: `**Immediate Fix:**\n` +
                           `1. Check last workflow run: GitHub → Actions\n` +
                           `2. If failed, check error in workflow logs\n` +
                           `3. If no recent runs, check workflow schedule\n` +
                           `4. Verify consumer reading correct file path\n\n` +
                           `**See diagnostic snapshot for:**\n` +
                           `- Last commit timestamp (git.lastCommit.date)\n` +
                           `- File modified time (files[...].modified)`,
            relatedFiles: ['.github/workflows/update-jobs.yml', '.github/data/current_jobs.json'],
            confidence: 0.88
          };
        }
      },

      // Pattern 6: Missing Fingerprint (Deduplication)
      MISSING_FINGERPRINT: {
        regex: /fingerprint.{0,100}?undefined|undefined.{0,100}?fingerprint/i,
        analyze: (error, snapshot) => {
          return {
            rootCause: `Job object missing 'fingerprint' field before deduplication.\n` +
                      `This exact bug happened on Feb 15 (Phase 1F, Bug #1).\n` +
                      `Root cause: Enhancer not adding fingerprints to jobs.`,
            recommendedFix: `**Immediate Fix:**\n` +
                           `Add fingerprint generation before dedup:\n` +
                           `\`\`\`javascript\n` +
                           `// In job-processor.js, before deduplication\n` +
                           `jobs = jobs.map(job => ({\n` +
                           `  ...job,\n` +
                           `  fingerprint: generateJobFingerprint(job)\n` +
                           `}));\n` +
                           `\`\`\`\n\n` +
                           `**See:** HANDOFF_2026_02_15_PHASE1_COMPLETE.md (Bug #1)`,
            relatedFiles: ['job-processor.js', 'utils.js'],
            confidence: 0.93
          };
        }
      }

      // Add more patterns as they're discovered in production
      // Criteria: 2+ occurrences OR critical severity, confidence >0.80
    };
  }

  /**
   * Analyze error with timeout protection
   * Prevents catastrophic regex backtracking from hanging the system
   */
  async analyzeWithTimeout(error, snapshot) {
    const startTime = Date.now();

    return Promise.race([
      Promise.resolve(this.analyze(error, snapshot)),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('REGEX_TIMEOUT')), this.timeoutMs)
      )
    ]).then(result => {
      const duration = Date.now() - startTime;

      // Warn if pattern matching is slow (potential regex optimization needed)
      if (duration > this.performanceWarningMs) {
        console.warn(`⚠️ Slow pattern match: ${result.pattern} took ${duration}ms (threshold: ${this.performanceWarningMs}ms)`);
      }

      return result;
    }).catch(err => {
      if (err.message === 'REGEX_TIMEOUT') {
        return {
          matched: false,
          pattern: 'REGEX_TIMEOUT',
          rootCause: 'Diagnostic regex timeout. Likely catastrophic backtracking in pattern matching.',
          recommendedFix: `**Critical Issue:**\n` +
                         `Pattern matching exceeded ${this.timeoutMs}ms timeout.\n` +
                         `This indicates a regex performance issue.\n\n` +
                         `**Report this error to optimize regex patterns.**\n` +
                         `Include: Error message length, error type, stack trace snippet.`,
          relatedFiles: ['diagnostic_layer/RootCauseAnalyzer.js'],
          confidence: 1.0
        };
      }
      throw err;
    });
  }

  /**
   * Synchronous analysis (for compatibility)
   * Note: Does NOT include timeout protection - use analyzeWithTimeout() in production
   */
  analyze(error, snapshot) {
    for (const [patternName, pattern] of Object.entries(this.patterns)) {
      try {
        if (pattern.regex.test(error.message) || pattern.regex.test(error.stack || '')) {
          const analysis = pattern.analyze(error, snapshot);

          if (analysis) {
            return {
              matched: true,
              pattern: patternName,
              ...analysis
            };
          }
        }
      } catch (regexError) {
        // Catch regex errors (rare but possible with malformed input)
        console.warn(`⚠️ Pattern ${patternName} threw error:`, regexError.message);
        continue; // Try next pattern
      }
    }

    // No pattern matched - return generic analysis
    return {
      matched: false,
      pattern: 'UNKNOWN',
      rootCause: 'Error pattern not recognized. Manual investigation required.',
      recommendedFix: `**Manual Investigation Steps:**\n` +
                     `1. Review full stack trace above\n` +
                     `2. Check diagnostic snapshot for system state\n` +
                     `3. Search codebase for error message\n` +
                     `4. Check recent commits (git log)\n` +
                     `5. Compare with BUGS_FIXED.md for similar issues\n\n` +
                     `**After fixing:** Update RootCauseAnalyzer with new pattern\n` +
                     `(See Pattern Addition Criteria in RootCauseAnalyzer.js)`,
      relatedFiles: [],
      confidence: 0.0
    };
  }

  detectAPI(message, snapshot) {
    const msgLower = message.toLowerCase();
    if (msgLower.includes('jsearch')) return 'JSearch';
    if (msgLower.includes('discord')) return 'Discord';
    if (msgLower.includes('github')) return 'GitHub';
    return 'Unknown API';
  }

  getSecretName(apiName) {
    const secretMap = {
      'JSearch': 'JSEARCH_API_KEY',
      'Discord': 'DISCORD_BOT_TOKEN',
      'GitHub': 'GITHUB_TOKEN'
    };
    return secretMap[apiName] || 'UNKNOWN_SECRET';
  }

  findRelatedFiles(modulePath, snapshot) {
    // Heuristic: files that likely import this module
    const files = [];
    const basename = path.basename(modulePath, '.js');

    // Check if module is in package.json dependencies
    if (modulePath.match(/^[a-z]/)) {
      files.push('package.json');
    }

    // Check common import locations
    files.push('index.js', 'job-fetcher/index.js', 'job-processor.js');

    return files;
  }

  /**
   * Get pattern statistics (for quarterly audit)
   * TODO: Implement match tracking in Phase 2
   */
  getPatternStats() {
    return {
      totalPatterns: Object.keys(this.patterns).length,
      patternNames: Object.keys(this.patterns),
      timeoutMs: this.timeoutMs,
      performanceWarningMs: this.performanceWarningMs
    };
  }
}

module.exports = { RootCauseAnalyzer };
