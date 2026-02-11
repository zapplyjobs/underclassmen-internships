#!/usr/bin/env node

/**
 * Pipeline Debug Trace Analyzer
 *
 * Analyzes debug-trace.json files from instrumented workflow runs to:
 * - Detect anomalies (>50% data loss between stages)
 * - Generate ASCII flow diagram
 * - Suggest root causes and fixes
 *
 * Usage:
 *   node scripts/analyze-debug-trace.js <path-to-trace.json>
 *   node scripts/analyze-debug-trace.js .github/data/debug-trace.json
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    bold: '\x1b[1m'
};

function analyzeTrace(tracePath) {
    // Load trace file
    if (!fs.existsSync(tracePath)) {
        console.error(`${colors.red}❌ Error: Trace file not found: ${tracePath}${colors.reset}`);
        process.exit(1);
    }

    const trace = JSON.parse(fs.readFileSync(tracePath, 'utf8'));

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 Pipeline Trace Analysis`);
    console.log(`${'='.repeat(80)}\n`);

    displayHeader(trace);
    const anomalies = detectAnomalies(trace.checkpoints);
    displayFlowDiagram(trace.checkpoints, anomalies);
    displayAnomalies(anomalies);
    suggestFixes(anomalies, trace);
    displayFooter(trace);
}

function displayHeader(trace) {
    console.log(`${colors.cyan}📊 Run Information:${colors.reset}`);
    console.log(`   ${colors.bold}Correlation ID:${colors.reset} ${trace.correlation_id}`);
    console.log(`   ${colors.bold}Workflow:${colors.reset} ${trace.workflow}`);
    console.log(`   ${colors.bold}Repository:${colors.reset} ${trace.repository}`);
    console.log(`   ${colors.bold}Started:${colors.reset} ${trace.started_at}`);
    console.log(`   ${colors.bold}Completed:${colors.reset} ${trace.completed_at}`);
    console.log(`   ${colors.bold}Duration:${colors.reset} ${(trace.total_duration_ms / 1000).toFixed(1)}s`);
    if (trace.run_url && trace.run_url !== 'local-run') {
        console.log(`   ${colors.bold}URL:${colors.reset} ${trace.run_url}`);
    }
    console.log();
}

function detectAnomalies(checkpoints) {
    const anomalies = [];

    for (let i = 1; i < checkpoints.length; i++) {
        const prev = checkpoints[i - 1];
        const curr = checkpoints[i];

        // Check total count drop
        const totalLoss = prev.counts.total - curr.counts.total;
        const totalLossPercent = prev.counts.total > 0
            ? (totalLoss / prev.counts.total) * 100
            : 0;

        if (totalLossPercent > 50) {
            anomalies.push({
                type: 'total_drop',
                severity: totalLossPercent === 100 ? 'CRITICAL' : 'WARNING',
                stage: curr.stage,
                prevStage: prev.stage,
                lost: totalLoss,
                lossPercent: totalLossPercent.toFixed(1),
                prevCount: prev.counts.total,
                currCount: curr.counts.total,
                message: `Total jobs dropped from ${prev.counts.total} → ${curr.counts.total} (${totalLossPercent.toFixed(1)}% loss)`
            });
        }

        // Check per-source drops
        const allSources = new Set([
            ...Object.keys(prev.counts.by_source || {}),
            ...Object.keys(curr.counts.by_source || {})
        ]);

        for (const source of allSources) {
            const prevCount = prev.counts.by_source[source] || 0;
            const currCount = curr.counts.by_source[source] || 0;
            const loss = prevCount - currCount;
            const lossPercent = prevCount > 0 ? (loss / prevCount) * 100 : 0;

            if (lossPercent > 50 && prevCount > 0) {
                anomalies.push({
                    type: 'source_drop',
                    severity: lossPercent === 100 ? 'CRITICAL' : 'WARNING',
                    stage: curr.stage,
                    prevStage: prev.stage,
                    source,
                    lost: loss,
                    lossPercent: lossPercent.toFixed(1),
                    prevCount,
                    currCount,
                    message: `${source} jobs dropped from ${prevCount} → ${currCount} (${lossPercent.toFixed(1)}% loss)`
                });
            }
        }
    }

    return anomalies;
}

function displayFlowDiagram(checkpoints, anomalies) {
    console.log(`${colors.cyan}📈 Data Flow Diagram:${colors.reset}\n`);

    checkpoints.forEach((checkpoint, i) => {
        const hasAnomaly = anomalies.some(a => a.stage === checkpoint.stage);
        const color = hasAnomaly ? colors.red : colors.green;
        const indicator = hasAnomaly ? '⚠️ ' : '✅ ';

        // Stage header
        console.log(`${color}┌${'─'.repeat(78)}┐${colors.reset}`);
        console.log(`${color}│ ${indicator}${checkpoint.stage.padEnd(75)} │${colors.reset}`);
        console.log(`${color}├${'─'.repeat(78)}┤${colors.reset}`);

        // Total count
        console.log(`${color}│ ${colors.bold}Total:${colors.reset} ${checkpoint.counts.total.toString().padEnd(70)} │`);

        // Source breakdown
        if (checkpoint.counts.by_source && Object.keys(checkpoint.counts.by_source).length > 0) {
            console.log(`${color}│ ${colors.bold}By Source:${colors.reset}${' '.repeat(66)} │`);
            for (const [source, count] of Object.entries(checkpoint.counts.by_source)) {
                const sourceDisplay = `   ${source}: ${count}`;
                console.log(`${color}│   ${sourceDisplay.padEnd(74)} │${colors.reset}`);
            }
        }

        // Metadata
        if (checkpoint.metadata && Object.keys(checkpoint.metadata).length > 0) {
            console.log(`${color}│ ${colors.gray}Metadata: ${JSON.stringify(checkpoint.metadata).padEnd(65)}${colors.reset} │`);
        }

        console.log(`${color}└${'─'.repeat(78)}┘${colors.reset}`);

        // Show transition arrow if not last checkpoint
        if (i < checkpoints.length - 1) {
            const next = checkpoints[i + 1];
            const diff = checkpoint.counts.total - next.counts.total;
            const diffColor = diff === 0 ? colors.gray : (diff > 0 ? colors.yellow : colors.green);
            const arrow = diff === 0 ? '│' : (diff > 0 ? '▼' : '▲');
            const diffText = diff === 0 ? 'no change' : `${Math.abs(diff)} ${diff > 0 ? 'lost' : 'added'}`;
            console.log(`${diffColor}              ${arrow} ${diffText}${colors.reset}`);
        }

        console.log();
    });
}

function displayAnomalies(anomalies) {
    if (anomalies.length === 0) {
        console.log(`${colors.green}✅ No anomalies detected - all stages passed data through normally${colors.reset}\n`);
        return;
    }

    console.log(`${colors.red}⚠️  Anomalies Detected: ${anomalies.length}${colors.reset}\n`);

    // Group by stage
    const byStage = {};
    anomalies.forEach(a => {
        if (!byStage[a.stage]) byStage[a.stage] = [];
        byStage[a.stage].push(a);
    });

    for (const [stage, stageAnomalies] of Object.entries(byStage)) {
        console.log(`${colors.red}┌${'─'.repeat(78)}┐${colors.reset}`);
        console.log(`${colors.red}│ Stage: ${stage.padEnd(69)} │${colors.reset}`);
        console.log(`${colors.red}├${'─'.repeat(78)}┤${colors.reset}`);

        stageAnomalies.forEach(anomaly => {
            const severityColor = anomaly.severity === 'CRITICAL' ? colors.red : colors.yellow;
            console.log(`${colors.red}│ ${severityColor}[${anomaly.severity}]${colors.reset} ${anomaly.message.padEnd(63)} │`);

            if (anomaly.type === 'source_drop') {
                console.log(`${colors.red}│   Source: ${anomaly.source.padEnd(67)} │${colors.reset}`);
                console.log(`${colors.red}│   ${anomaly.prevStage}: ${anomaly.prevCount} → ${stage}: ${anomaly.currCount}${' '.repeat(40)} │${colors.reset}`);
            } else {
                console.log(`${colors.red}│   ${anomaly.prevStage}: ${anomaly.prevCount} → ${stage}: ${anomaly.currCount}${' '.repeat(40)} │${colors.reset}`);
            }
        });

        console.log(`${colors.red}└${'─'.repeat(78)}┘${colors.reset}\n`);
    }
}

function suggestFixes(anomalies, trace) {
    if (anomalies.length === 0) {
        return;
    }

    console.log(`${colors.cyan}💡 Root Cause Analysis & Suggested Fixes:${colors.reset}\n`);

    // Pattern matching for common issues
    const patterns = identifyPatterns(anomalies, trace);

    if (patterns.length === 0) {
        console.log(`${colors.yellow}No known patterns detected. Manual investigation recommended.${colors.reset}\n`);
        return;
    }

    patterns.forEach((pattern, i) => {
        console.log(`${colors.bold}${i + 1}. ${pattern.title}${colors.reset}`);
        console.log(`   ${colors.gray}Confidence: ${pattern.confidence}${colors.reset}`);
        console.log(`   ${colors.gray}Evidence: ${pattern.evidence}${colors.reset}`);
        console.log();
        console.log(`   ${colors.yellow}Root Cause:${colors.reset}`);
        console.log(`   ${pattern.rootCause}`);
        console.log();
        console.log(`   ${colors.green}Suggested Fix:${colors.reset}`);
        console.log(`   ${pattern.fix}`);
        console.log();
        if (pattern.file) {
            console.log(`   ${colors.cyan}File to modify:${colors.reset} ${pattern.file}`);
        }
        if (pattern.codeExample) {
            console.log(`   ${colors.cyan}Example:${colors.reset}`);
            console.log(`   ${colors.gray}${pattern.codeExample}${colors.reset}`);
        }
        console.log();
    });
}

function identifyPatterns(anomalies, trace) {
    const patterns = [];

    // Pattern 1: JSearch jobs lost at experience filter
    const jsearchExperienceFilter = anomalies.find(a =>
        a.type === 'source_drop' &&
        a.source === 'jsearch' &&
        a.stage.includes('experience') &&
        a.lossPercent >= 100
    );

    if (jsearchExperienceFilter) {
        patterns.push({
            title: 'JSearch jobs filtered by experience level check',
            confidence: 'HIGH',
            evidence: `All JSearch jobs (${jsearchExperienceFilter.prevCount}) lost at ${jsearchExperienceFilter.stage}`,
            rootCause: 'Experience level filter is incorrectly filtering out all JSearch jobs. JSearch API pre-filters by experience level (entry-level, mid-level, senior) so additional filtering is redundant and incorrect.',
            fix: 'Add bypass logic to skip experience filter for job_source === "jsearch"',
            file: '.github/scripts/job-fetcher/job-processor.js',
            codeExample: `// Before filtering by experience level:
if (job.job_source !== 'jsearch') {
    // Apply experience filter only to non-JSearch jobs
    filtered = filtered.filter(filterByExperienceLevel);
}`
        });
    }

    // Pattern 2: Healthcare filter removing too many jobs
    const healthcareFilter = anomalies.find(a =>
        a.type === 'total_drop' &&
        a.stage.includes('healthcare') &&
        a.lossPercent > 30
    );

    if (healthcareFilter) {
        patterns.push({
            title: 'Healthcare filter removing excessive jobs',
            confidence: 'MEDIUM',
            evidence: `${healthcareFilter.lossPercent}% of jobs lost at healthcare filter`,
            rootCause: 'Healthcare keyword filter may be too aggressive or incorrectly configured. Possible false positives removing non-healthcare jobs.',
            fix: 'Review healthcare keyword list and ensure case-insensitive matching is not too broad. Consider using word boundaries to avoid partial matches.',
            file: '.github/scripts/job-fetcher/filters.js'
        });
    }

    // Pattern 3: Deduplication removing all jobs
    const dedupFilter = anomalies.find(a =>
        a.type === 'total_drop' &&
        a.stage.includes('dedup') &&
        a.lossPercent >= 100
    );

    if (dedupFilter) {
        patterns.push({
            title: 'Deduplication removing all jobs',
            confidence: 'HIGH',
            evidence: `All jobs (${dedupFilter.prevCount}) lost during deduplication`,
            rootCause: 'Deduplication logic is incorrectly matching all new jobs as duplicates. Possible issues: incorrect field comparison, stale posted_jobs.json, or hash collision.',
            fix: 'Check deduplication logic and posted_jobs.json contents. Verify job ID generation and comparison logic.',
            file: '.github/scripts/job-fetcher/job-processor.js',
            codeExample: `// Verify dedup uses correct field:
const isDuplicate = postedJobs.some(p =>
    p.id === job.id ||
    p.job_url === job.job_url
);`
        });
    }

    // Pattern 4: TTL filter removing all jobs
    const ttlFilter = anomalies.find(a =>
        a.type === 'total_drop' &&
        a.stage.includes('ttl') &&
        a.lossPercent >= 100
    );

    if (ttlFilter) {
        patterns.push({
            title: 'TTL filter removing all jobs',
            confidence: 'HIGH',
            evidence: `All jobs (${ttlFilter.prevCount}) expired by TTL filter`,
            rootCause: 'All jobs are older than TTL threshold (14 days). Either: (1) No new jobs are being fetched, (2) Date parsing is broken, or (3) System date is incorrect.',
            fix: 'Check: (1) fetchAllJobs is returning fresh jobs, (2) date_posted field parsing is correct, (3) server system time is accurate',
            file: '.github/scripts/job-fetcher/job-processor.js'
        });
    }

    // Pattern 5: Source field null/missing
    const sourceAnomalies = anomalies.filter(a => a.source === 'unknown' || a.source === 'null');
    if (sourceAnomalies.length > 0) {
        patterns.push({
            title: 'Job source field missing or null',
            confidence: 'MEDIUM',
            evidence: `${sourceAnomalies.length} anomalies with unknown/null source`,
            rootCause: 'Field name mismatch between fetcher and processor. Fetcher may write to "source" but processor reads "job_source", or vice versa.',
            fix: 'Standardize field name across all pipeline stages. Use consistent naming: either "source" or "job_source" everywhere.',
            file: '.github/scripts/job-fetcher/job-processor.js',
            codeExample: `// Ensure consistent field access:
const source = job.source || job.job_source || 'unknown';

// Or normalize early:
jobs.forEach(job => {
    if (!job.source && job.job_source) job.source = job.job_source;
});`
        });
    }

    return patterns;
}

function displayFooter(trace) {
    console.log(`${'='.repeat(80)}`);
    console.log(`Analysis complete for run: ${trace.correlation_id}`);
    console.log(`${'='.repeat(80)}\n`);
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error(`${colors.red}Usage: node scripts/analyze-debug-trace.js <trace-file.json>${colors.reset}`);
        console.error(`${colors.gray}Example: node scripts/analyze-debug-trace.js .github/data/debug-trace.json${colors.reset}`);
        process.exit(1);
    }

    const tracePath = args[0];
    analyzeTrace(tracePath);
}

module.exports = { analyzeTrace, detectAnomalies, identifyPatterns };
