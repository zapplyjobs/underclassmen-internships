# Diagnostic Scripts

Quick reference for GitHub Discord health monitoring and diagnostics.

## Quick Commands

```bash
# Check overall health (recommended)
npm run health

# Run all diagnostics
npm run diagnose:all

# Individual diagnostics
npm run diagnose:failures   # Analyze failure patterns
npm run diagnose:routing    # Test routing logic
npm run diagnose:queue      # Check pending queue bloat
```

## Scripts Overview

### Health Monitoring
- `check-recent-failures.js` - Check last 24h failure rate
- `workflow-health-report.js` - Full health report with company breakdown

### Failure Analysis
- `analyze-failures.js` - Comprehensive failure analysis (companies, duplicates, patterns)
- `investigate-routing.js` - Deep dive into routing issues and field names
- `test-routing.js` - Test router with real failing jobs

### Pipeline Debugging
- `analyze-debug-trace.js` - Automated analysis of pipeline traces with anomaly detection
  - Detects >50% data loss at any stage
  - Generates ASCII flow diagrams
  - Suggests root causes and fixes
  - Usage: `node scripts/analyze-debug-trace.js <trace-file.json>`

### Created: 2026-01-22
### Updated: 2026-02-11 (added analyze-debug-trace.js)

## GitHub Actions

Daily health report runs at 9 AM UTC with:
- ✅ Workflow step summary (metrics table)
- ✅ Full logs (detailed analysis)
- ✅ Automatic issue creation if <70% success rate

## Sources

- [GitHub Actions Job Summaries](https://github.blog/news-insights/product-news/supercharging-github-actions-with-job-summaries/)
- [Workflow Commands](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands)
