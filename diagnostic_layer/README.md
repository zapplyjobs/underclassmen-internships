# Diagnostic Layer - Autonomous Error Diagnosis System

**Purpose:** Automated root cause analysis and diagnostic reporting for workflow failures

**Status:** ✅ PRODUCTION READY (Phase 1 Complete)
**Coverage:** 96% average (127 tests, 100% pass rate)
**Components:** 4 (DiagnosticError, DiagnosticSnapshot, RootCauseAnalyzer, IssueDiagnosticFormatter)

---

## 🎯 Quick Start

### Basic Usage - Workflow Error Handler

```javascript
const { IssueDiagnosticFormatter } = require('./diagnostic_layer/IssueDiagnosticFormatter');

// In your workflow error handler
try {
  await processJobs();
} catch (error) {
  const formatter = new IssueDiagnosticFormatter();

  // Get Claude-friendly minimal format
  const diagnostic = await formatter.formatForClaude(error);

  console.error(JSON.stringify(diagnostic, null, 2));
  // Logs:
  // {
  //   "summary": "🚨 **MODULE_NOT_FOUND**: Cannot find module './utils.js'",
  //   "rootCause": "Module './utils.js' not found...",
  //   "fix": "**Immediate Fix:**\n1. Check if file exists: `ls ./utils.js`...",
  //   "confidence": 0.95,
  //   "files": ["package.json", "index.js"],
  //   "timestamp": "2026-02-16T14:30:00Z",
  //   "severity": "CRITICAL"
  // }

  throw error; // Re-throw to mark workflow as failed
}
```

---

## 📚 Components

### 1. **DiagnosticError** - Structured Error Class

Extends JavaScript Error with diagnostic context.

```javascript
const { DiagnosticError } = require('./diagnostic_layer/DiagnosticError');

const error = new DiagnosticError('Module not found', {
  errorType: 'MODULE_NOT_FOUND',
  severity: 'CRITICAL',
  component: 'job-processor',
  rootCause: 'File was deleted but import not updated',
  recommendedFix: 'Check if file exists: `ls ./missing-file.js`',
  relatedFiles: ['index.js', 'job-processor.js']
});

// Get GitHub Issue format
const issue = error.toGitHubIssue();
// Returns: { title, body, labels }
```

**Features:**
- Structured error context (errorType, severity, component)
- GitHub Issue formatter
- JSON serialization
- Environment capture (node version, platform, cwd)

---

### 2. **DiagnosticSnapshot** - System State Capture

Captures complete system state at time of error.

```javascript
const { DiagnosticSnapshot } = require('./diagnostic_layer/DiagnosticSnapshot');

const snapshot = new DiagnosticSnapshot({ level: 'standard' });
const data = await snapshot.capture();

console.log(data);
// {
//   system: { node: 'v20.20.0', platform: 'linux', memory: {...}, uptime: 12345 },
//   git: { branch: 'main', commit: 'abc123', status: '...', remote: '...' },
//   environment: { secrets: { JSEARCH_API_KEY: 'SET', ... } },  // Masked!
//   files: [...],  // Critical files with sizes, modified times
//   process: { pid: 1234, argv: [...], cwd: '...' },
//   timestamp: '2026-02-16T14:30:00Z'
// }
```

**Capture Levels:**
- `minimal` - Fast, basic info (system + git only)
- `standard` - Default (system + git + files + env + process)
- `verbose` - Everything (includes logs, metrics, workflow files)

**Security:** All secrets masked as 'SET' or 'MISSING'

---

### 3. **RootCauseAnalyzer** - Pattern Matching Engine

Matches errors against known patterns, provides root cause + fixes.

```javascript
const { RootCauseAnalyzer } = require('./diagnostic_layer/RootCauseAnalyzer');
const { DiagnosticSnapshot } = require('./diagnostic_layer/DiagnosticSnapshot');

const analyzer = new RootCauseAnalyzer();
const snapshot = new DiagnosticSnapshot();
const snapshotData = await snapshot.capture();

// Analyze with timeout protection
const analysis = await analyzer.analyzeWithTimeout(error, snapshotData);

console.log(analysis);
// {
//   matched: true,
//   pattern: 'MODULE_NOT_FOUND',
//   rootCause: 'Module not found. Common causes:\n1. File was moved/deleted...',
//   recommendedFix: '**Immediate Fix:**\n1. Check if file exists...',
//   relatedFiles: ['package.json', 'index.js'],
//   confidence: 0.95
// }
```

**Built-In Patterns (6):**
1. **MODULE_NOT_FOUND** (confidence: 0.95) - Import/dependency errors
2. **API_AUTH_FAILURE** (confidence: 0.90) - 401/403 authentication failures
3. **GIT_INDEX_STALE** (confidence: 0.85) - Git cache issues
4. **JSEARCH_TIMEOUT** (confidence: 0.92) - API timeout/connection errors
5. **STALE_DATA** (confidence: 0.88) - Data freshness violations
6. **MISSING_FINGERPRINT** (confidence: 0.93) - Deduplication bugs

**Unknown Patterns:** Generic guidance provided (confidence: 0.0)

**Safety Features:**
- Regex timeout protection (1000ms default)
- Limited quantifiers (prevents catastrophic backtracking)
- Performance monitoring (warns if >500ms)

---

### 4. **IssueDiagnosticFormatter** - Orchestration Layer

Combines all components, produces two output formats.

```javascript
const { IssueDiagnosticFormatter } = require('./diagnostic_layer/IssueDiagnosticFormatter');

const formatter = new IssueDiagnosticFormatter();

// Format 1: GitHub Issue (full context)
const issue = await formatter.createDiagnosticIssue(error, {
  component: 'job-processor',
  captureLevel: 'verbose'
});
// Returns: { title, body, labels }

// Format 2: Claude format (minimal)
const claudeFormat = await formatter.formatForClaude(error);
// Returns: { summary, rootCause, fix, confidence, files, timestamp, severity }

// Batch analysis
const errors = [error1, error2, error3];
const diagnostics = await formatter.batchAnalyze(errors);
// Returns: [diagnostic1, diagnostic2, diagnostic3]
```

**Severity Classification:**
- **CRITICAL:** MODULE_NOT_FOUND, API_AUTH_FAILURE, REGEX_TIMEOUT
- **ERROR:** JSEARCH_TIMEOUT, STALE_DATA, GIT_INDEX_STALE, UNKNOWN
- **WARNING:** MISSING_FINGERPRINT

---

## 🔧 Advanced Usage

### Custom Analyzer Options

```javascript
const formatter = new IssueDiagnosticFormatter({
  defaultCaptureLevel: 'verbose',  // Change default from 'standard'
  analyzerOptions: {
    timeoutMs: 2000,               // Increase timeout (default: 1000ms)
    performanceWarningMs: 1000     // Change warning threshold (default: 500ms)
  }
});
```

### Disable Timeout Protection (Not Recommended)

```javascript
const issue = await formatter.createDiagnosticIssue(error, {
  useTimeout: false  // Disable timeout protection (for testing only)
});
```

### Get Analyzer Statistics

```javascript
const stats = formatter.getStats();
console.log(stats);
// {
//   totalPatterns: 6,
//   patternNames: ['MODULE_NOT_FOUND', 'API_AUTH_FAILURE', ...],
//   timeoutMs: 1000,
//   performanceWarningMs: 500
// }
```

---

## 📋 Integration Examples

### Example 1: GitHub Actions Workflow

```yaml
# .github/workflows/update-jobs.yml
jobs:
  update-jobs:
    runs-on: ubuntu-latest
    steps:
      - name: Process Jobs
        run: node job-processor.js
        continue-on-error: true
        id: process

      - name: Create Diagnostic Issue (on failure)
        if: steps.process.outcome == 'failure'
        run: |
          # Diagnostic already logged by error handler
          # Read diagnostic.json and create issue
          node .github/scripts/create-diagnostic-issue.js
```

**Error Handler (job-processor.js):**
```javascript
const { IssueDiagnosticFormatter } = require('./diagnostic_layer/IssueDiagnosticFormatter');
const fs = require('fs');

async function main() {
  try {
    await processJobs();
  } catch (error) {
    const formatter = new IssueDiagnosticFormatter();

    // Save diagnostic for workflow
    const diagnostic = await formatter.createDiagnosticIssue(error, {
      component: 'job-processor',
      captureLevel: 'verbose'
    });

    fs.writeFileSync('diagnostic.json', JSON.stringify(diagnostic, null, 2));

    // Also log Claude format for manual debugging
    const claudeFormat = await formatter.formatForClaude(error);
    console.error(JSON.stringify(claudeFormat, null, 2));

    process.exit(1);
  }
}

main();
```

---

### Example 2: Daily Claude Session

```javascript
// Check for recent failures
const recentErrors = await getRecentWorkflowFailures();

if (recentErrors.length > 0) {
  const formatter = new IssueDiagnosticFormatter();
  const diagnostics = await formatter.batchAnalyze(recentErrors);

  console.log(`📊 Daily Diagnostic Report - ${new Date().toLocaleDateString()}`);
  console.log(`Found ${diagnostics.length} errors\n`);

  diagnostics.forEach((diag, i) => {
    console.log(`${i + 1}. ${diag.summary}`);
    console.log(`   Severity: ${diag.severity}`);
    console.log(`   Confidence: ${diag.confidence}`);
    console.log(`   Fix: ${diag.fix.substring(0, 100)}...`);
    console.log('');
  });
}
```

---

## ✅ Testing

```bash
# Run all diagnostic tests
npm test diagnostic_layer

# Run integration tests only
npm test diagnostic_layer/__tests__/integration.test.js

# Get coverage
npm test diagnostic_layer -- --coverage
```

**Test Results:**
- 127 tests total (16 + 32 + 43 + 36)
- 100% pass rate
- 96% average coverage

---

## 📊 Performance

**Typical Timings:**
- Minimal capture + analysis: ~50-100ms
- Standard capture + analysis: ~200-400ms
- Verbose capture + analysis: ~500-1000ms

**Safety:**
- Regex timeout: 1000ms (prevents hangs)
- Performance warning: 500ms (logs slow patterns)

---

## 🚀 Future Enhancements (Phase 2)

1. **Problem Matchers** - GitHub Actions annotations
2. **Metrics Tracking** - Pattern accuracy monitoring
3. **Auto-Remediation** - Automated fixes for known patterns
4. **Pattern Learning** - Suggest new patterns from unknown errors

---

## 📖 Documentation

**Component Docs:**
- `DiagnosticError.js` - See inline JSDoc comments
- `DiagnosticSnapshot.js` - See inline JSDoc comments
- `RootCauseAnalyzer.js` - See inline JSDoc comments + Pattern Addition Criteria
- `IssueDiagnosticFormatter.js` - See inline JSDoc comments

**Project Docs:**
- `.GenAI_Work/root_problem_analysis_2026_02_15/COMPREHENSIVE_FINAL_PLAN.md` - Full implementation plan
- `.GenAI_Work/ssot/JOB_BOARD_PREVENTION_SYSTEM.md` - SSOT for prevention system
- `.GenAI_Work/.sessions/HANDOFF_2026_02_16_PHASE1_DAY4_COMPLETE.md` - Latest handoff

---

## 🔒 Security

**Secret Masking:**
- All environment variables masked in snapshots
- Secrets shown as 'SET' or 'MISSING' (never actual values)
- No sensitive data in diagnostic outputs

**Regex Safety:**
- Timeout protection prevents DoS via malicious input
- Limited quantifiers prevent exponential backtracking
- Error handling prevents crashes from malformed input

---

**Last Updated:** 2026-02-16
**Status:** Production Ready
**Version:** 1.0
**License:** Internal Use Only
