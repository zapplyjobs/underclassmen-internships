const { DiagnosticError } = require('./DiagnosticError');
const { DiagnosticSnapshot } = require('./DiagnosticSnapshot');
const { RootCauseAnalyzer } = require('./RootCauseAnalyzer');

/**
 * IssueDiagnosticFormatter - Orchestrates all diagnostic components
 *
 * Combines:
 * - DiagnosticSnapshot: Captures system state (git, files, env, process)
 * - RootCauseAnalyzer: Matches error patterns and provides root cause
 * - DiagnosticError: Formats as GitHub Issue or Claude session output
 *
 * Provides two output formats:
 * 1. GitHub Issue (full diagnostic context for auto-issue creation)
 * 2. Claude format (minimal summary for daily sessions)
 *
 * Usage:
 *   const formatter = new IssueDiagnosticFormatter();
 *   const issue = await formatter.createDiagnosticIssue(error, { component: 'job-processor' });
 *   const claudeFormat = await formatter.formatForClaude(error);
 */
class IssueDiagnosticFormatter {
  constructor(options = {}) {
    this.analyzer = new RootCauseAnalyzer(options.analyzerOptions || {});
    this.defaultCaptureLevel = options.defaultCaptureLevel || 'standard';
  }

  /**
   * Create a GitHub Issue with full diagnostic context
   *
   * @param {Error} error - The error to diagnose
   * @param {Object} options - Configuration options
   * @param {string} options.component - Component where error occurred (e.g., 'job-processor')
   * @param {string} options.captureLevel - Snapshot detail level ('minimal', 'standard', 'verbose')
   * @param {boolean} options.useTimeout - Use timeout protection for analysis (default: true)
   * @returns {Object} GitHub Issue object (title, body, labels)
   */
  async createDiagnosticIssue(error, options = {}) {
    // 1. Capture diagnostic snapshot
    const snapshot = new DiagnosticSnapshot({
      level: options.captureLevel || this.defaultCaptureLevel
    });
    const snapshotData = await snapshot.capture();

    // 2. Analyze root cause (with timeout protection by default)
    const useTimeout = options.useTimeout !== false; // Default true
    const analysis = useTimeout
      ? await this.analyzer.analyzeWithTimeout(error, snapshotData)
      : this.analyzer.analyze(error, snapshotData);

    // 3. Determine severity based on pattern
    const severity = this.determineSeverity(analysis);

    // 4. Create DiagnosticError with analysis
    const diagnosticError = new DiagnosticError(error.message, {
      errorType: analysis.pattern,
      severity: severity,
      component: options.component || 'unknown',
      rootCause: analysis.rootCause,
      recommendedFix: analysis.recommendedFix,
      relatedFiles: analysis.relatedFiles,
      environment: snapshotData.system,
      metadata: {
        confidence: analysis.confidence,
        matched: analysis.matched,
        snapshot: snapshotData,
        originalError: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      }
    });

    // 5. Format as GitHub Issue
    return diagnosticError.toGitHubIssue();
  }

  /**
   * Format error for Claude daily sessions (minimal output)
   *
   * @param {Error} error - The error to diagnose
   * @param {Object} options - Configuration options
   * @param {boolean} options.useTimeout - Use timeout protection (default: true)
   * @returns {Object} Claude-friendly format (summary, rootCause, fix, confidence, files, timestamp)
   */
  async formatForClaude(error, options = {}) {
    // Use minimal snapshot for faster analysis
    const snapshot = new DiagnosticSnapshot({ level: 'minimal' });
    const snapshotData = await snapshot.capture();

    // Analyze with timeout protection by default
    const useTimeout = options.useTimeout !== false;
    const analysis = useTimeout
      ? await this.analyzer.analyzeWithTimeout(error, snapshotData)
      : this.analyzer.analyze(error, snapshotData);

    return {
      summary: `🚨 **${analysis.pattern}**: ${error.message}`,
      rootCause: analysis.rootCause,
      fix: analysis.recommendedFix,
      confidence: analysis.confidence,
      files: analysis.relatedFiles,
      timestamp: snapshotData.timestamp,
      severity: this.determineSeverity(analysis)
    };
  }

  /**
   * Determine severity level based on error pattern
   *
   * Severity levels:
   * - CRITICAL: 0% success rate, total system failure
   * - ERROR: Partial failure, system degraded
   * - WARNING: Recoverable, reduced quality
   *
   * @param {Object} analysis - Analysis result from RootCauseAnalyzer
   * @returns {string} Severity level (CRITICAL, ERROR, WARNING)
   */
  determineSeverity(analysis) {
    // Critical: 0% success rate (total failure)
    if (analysis.pattern === 'API_AUTH_FAILURE') return 'CRITICAL';
    if (analysis.pattern === 'MODULE_NOT_FOUND') return 'CRITICAL';

    // Error: Partial failure, system degraded
    if (analysis.pattern === 'JSEARCH_TIMEOUT') return 'ERROR';
    if (analysis.pattern === 'STALE_DATA') return 'ERROR';
    if (analysis.pattern === 'GIT_INDEX_STALE') return 'ERROR';

    // Warning: Recoverable, reduced quality
    if (analysis.pattern === 'MISSING_FINGERPRINT') return 'WARNING';

    // Regex timeout is critical (indicates system performance issue)
    if (analysis.pattern === 'REGEX_TIMEOUT') return 'CRITICAL';

    // Unknown: Conservative classification as ERROR
    if (analysis.pattern === 'UNKNOWN') return 'ERROR';

    // Default: ERROR (conservative)
    return 'ERROR';
  }

  /**
   * Batch analyze multiple errors (useful for workflow failure analysis)
   *
   * @param {Error[]} errors - Array of errors to analyze
   * @param {Object} options - Configuration options
   * @returns {Object[]} Array of Claude-formatted diagnostics
   */
  async batchAnalyze(errors, options = {}) {
    const results = [];

    for (const error of errors) {
      try {
        const diagnostic = await this.formatForClaude(error, options);
        results.push(diagnostic);
      } catch (analyzeError) {
        // If analysis itself fails, return minimal error info
        results.push({
          summary: `⚠️ **ANALYSIS_FAILED**: ${error.message}`,
          rootCause: 'Diagnostic analysis failed',
          fix: 'Manual investigation required',
          confidence: 0.0,
          files: [],
          timestamp: new Date().toISOString(),
          severity: 'ERROR',
          analysisError: analyzeError.message
        });
      }
    }

    return results;
  }

  /**
   * Get diagnostic statistics (useful for monitoring)
   *
   * @returns {Object} Analyzer statistics
   */
  getStats() {
    return this.analyzer.getPatternStats();
  }
}

module.exports = { IssueDiagnosticFormatter };
