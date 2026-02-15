#!/usr/bin/env node

/**
 * Job Pipeline Health Monitor
 *
 * Detects issues in the job fetching/posting pipeline:
 * - Low new job acceptance rate (deduplication too aggressive)
 * - Queue corruption (duplicates, stale entries)
 * - seen_jobs.json size issues
 * - Discord bot posting failures
 * - Enrichment bottlenecks
 *
 * Runs after each workflow and reports anomalies.
 */

const fs = require('fs');
const path = require('path');
const { generateJobFingerprint } = require('./job-fetcher/utils');
const { generateSchemaAwareHealthReport } = require('./schema-aware-health');
const { routeAlerts, healthReportToAlerts } = require('./src/monitoring/alert-router');
const { collectQueueMetrics } = require('./src/monitoring/metrics-collector');
const { runAllRunbooks } = require('./src/monitoring/auto-remediation');

// Thresholds for health checks
const THRESHOLDS = {
    MIN_NEW_JOB_RATE: 0.05, // At least 5% of unique jobs should be new
    MAX_SEEN_JOBS_SIZE: 9500, // Warn if approaching 10K limit
    MAX_QUEUE_SIZE: 100, // Warn if queue exceeds this
    MAX_PENDING_AGE_HOURS: 6, // Warn if jobs pending >6 hours
    MIN_POSTED_PER_HOUR: 5, // At least 5 jobs posted per hour
    MAX_DUPLICATE_RATIO: 0.1, // Max 10% duplicates in queue
};

// Health check results
const healthReport = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    issues: [],
    warnings: [],
    metrics: {},
};

/**
 * Load and parse JSON file
 */
function loadJSON(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        healthReport.issues.push({
            severity: 'error',
            component: 'file-loader',
            message: `Failed to load ${filePath}: ${error.message}`,
        });
        return null;
    }
}

/**
 * Check 1: Deduplication Rate
 * Ensure new job acceptance rate is reasonable
 */
function checkDeduplicationRate() {
    const logsDir = path.join(process.cwd(), '.github', 'logs');
    const summaryPath = path.join(logsDir, 'fetch-summary.json');

    const summary = loadJSON(summaryPath);
    if (!summary) {
        healthReport.warnings.push({
            severity: 'warning',
            component: 'deduplication',
            message: 'No fetch summary found - cannot check deduplication rate',
        });
        return;
    }

    const { current_jobs, fresh_jobs } = summary;
    if (!current_jobs || !fresh_jobs) {
        return;
    }

    const newJobRate = fresh_jobs / current_jobs;
    healthReport.metrics.new_job_rate = newJobRate.toFixed(3);
    healthReport.metrics.fresh_jobs = fresh_jobs;
    healthReport.metrics.current_jobs = current_jobs;

    if (newJobRate < THRESHOLDS.MIN_NEW_JOB_RATE) {
        healthReport.status = 'unhealthy';
        healthReport.issues.push({
            severity: 'critical',
            component: 'deduplication',
            message: `Low new job acceptance rate: ${(newJobRate * 100).toFixed(1)}% (${fresh_jobs}/${current_jobs})`,
            recommendation: 'Check seen_jobs.json for expiration issues. Expected >5% acceptance rate.',
            threshold: `${THRESHOLDS.MIN_NEW_JOB_RATE * 100}%`,
        });
    }
}

/**
 * Check 2: seen_jobs.json Size
 * Warn if approaching max capacity
 */
function checkSeenJobsSize() {
    const seenJobsPath = path.join(process.cwd(), '.github', 'data', 'seen_jobs.json');
    const seenJobs = loadJSON(seenJobsPath);

    if (!seenJobs) {
        healthReport.warnings.push({
            severity: 'warning',
            component: 'seen-jobs',
            message: 'seen_jobs.json not found or corrupt',
        });
        return;
    }

    let count;
    if (Array.isArray(seenJobs)) {
        count = seenJobs.length;
        healthReport.metrics.seen_jobs_format = 'array (legacy)';
    } else {
        count = Object.keys(seenJobs).length;
        healthReport.metrics.seen_jobs_format = 'object (timestamped)';
    }

    healthReport.metrics.seen_jobs_count = count;

    if (count > THRESHOLDS.MAX_SEEN_JOBS_SIZE) {
        healthReport.status = 'degraded';
        healthReport.warnings.push({
            severity: 'warning',
            component: 'seen-jobs',
            message: `seen_jobs.json approaching max capacity: ${count} entries`,
            recommendation: 'Consider clearing old entries or increasing limit',
            threshold: THRESHOLDS.MAX_SEEN_JOBS_SIZE,
        });
    }

    // Check if legacy format (array) - should migrate
    if (Array.isArray(seenJobs)) {
        healthReport.warnings.push({
            severity: 'info',
            component: 'seen-jobs',
            message: 'seen_jobs.json using legacy array format',
            recommendation: 'Will auto-migrate to timestamped format on next run',
        });
    }
}

/**
 * Check 3: Queue Health
 * Check for duplicates, stale entries, excessive size
 */
function checkQueueHealth() {
    const queuePath = path.join(process.cwd(), '.github', 'data', 'pending_posts.json');
    const queue = loadJSON(queuePath);

    if (!queue || !Array.isArray(queue)) {
        healthReport.warnings.push({
            severity: 'warning',
            component: 'queue',
            message: 'pending_posts.json not found or invalid format',
        });
        return;
    }

    // Count by status
    const statusCounts = {
        pending: 0,
        enriched: 0,
        posted: 0,
    };

    const jobIds = new Set();
    let duplicates = 0;
    let stalePending = 0;
    const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);

    queue.forEach(item => {
        const status = item.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        // Check for duplicates
        const jobId = item.job?.id || 'unknown';
        if (jobIds.has(jobId)) {
            duplicates++;
        }
        jobIds.add(jobId);

        // Check for stale pending jobs
        if (status === 'pending' && item.addedAt) {
            const addedTime = new Date(item.addedAt).getTime();
            if (addedTime < sixHoursAgo) {
                stalePending++;
            }
        }
    });

    healthReport.metrics.queue_size = queue.length;
    healthReport.metrics.queue_pending = statusCounts.pending;
    healthReport.metrics.queue_enriched = statusCounts.enriched;
    healthReport.metrics.queue_posted = statusCounts.posted;
    healthReport.metrics.queue_duplicates = duplicates;
    healthReport.metrics.queue_stale_pending = stalePending;

    // Check queue size
    if (queue.length > THRESHOLDS.MAX_QUEUE_SIZE) {
        healthReport.status = 'degraded';
        healthReport.warnings.push({
            severity: 'warning',
            component: 'queue',
            message: `Queue size excessive: ${queue.length} items`,
            recommendation: 'Check for enrichment bottleneck or processing issues',
            threshold: THRESHOLDS.MAX_QUEUE_SIZE,
        });
    }

    // Check for duplicates
    if (duplicates > 0) {
        const dupRatio = duplicates / queue.length;
        if (dupRatio > THRESHOLDS.MAX_DUPLICATE_RATIO) {
            healthReport.status = 'unhealthy';
            healthReport.issues.push({
                severity: 'critical',
                component: 'queue',
                message: `Queue corruption detected: ${duplicates} duplicate job IDs (${(dupRatio * 100).toFixed(1)}%)`,
                recommendation: 'Run queue deduplication script or investigate duplicate insertion',
                threshold: `${THRESHOLDS.MAX_DUPLICATE_RATIO * 100}%`,
            });
        }
    }

    // Check for stale pending jobs
    if (stalePending > 10) {
        healthReport.status = 'degraded';
        healthReport.warnings.push({
            severity: 'warning',
            component: 'queue',
            message: `${stalePending} jobs pending >6 hours`,
            recommendation: 'Check enrichment service for failures or rate limits',
        });
    }
}

/**
 * Check 3.5: Content Duplicate Detection (NEW)
 * Detect jobs with same title+company+location but different IDs
 * Auto-recover if duplicates exceed threshold
 */
function checkContentDuplicates() {
    const queuePath = path.join(process.cwd(), '.github', 'data', 'pending_posts.json');
    const queue = loadJSON(queuePath);

    if (!queue || !Array.isArray(queue)) {
        return; // Already handled by checkQueueHealth
    }

    // Detect content duplicates
    const { totalDuplicates, duplicateGroups } = detectContentDuplicates(queue);
    const dupRatio = queue.length > 0 ? totalDuplicates / queue.length : 0;

    healthReport.metrics.queue_content_duplicates = totalDuplicates;
    healthReport.metrics.queue_duplicate_ratio = dupRatio.toFixed(3);

    // Moderate threshold: 10% auto-clean, 25% critical
    if (dupRatio >= 0.25) {
        // CRITICAL: Auto-recover + alert
        const cleaned = autoRecoverDuplicates(queue, duplicateGroups);
        savePendingQueue(cleaned);

        healthReport.status = 'unhealthy';
        healthReport.issues.push({
            severity: 'critical',
            component: 'queue-corruption',
            message: `Critical queue corruption: ${totalDuplicates} content duplicates (${(dupRatio * 100).toFixed(1)}%)`,
            recommendation: `AUTO-RECOVERY EXECUTED: Removed ${queue.length - cleaned.length} duplicates. Kept oldest entry (FIFO).`,
            threshold: '25%',
            recoveryAction: 'automatic',
            duplicateGroups: duplicateGroups.slice(0, 5), // Top 5 examples
        });

        console.log(`🧹 AUTO-RECOVERY: Removed ${queue.length - cleaned.length} content duplicates from queue`);

    } else if (dupRatio >= 0.10) {
        // AUTO-CLEAN: Moderate threshold
        const cleaned = autoRecoverDuplicates(queue, duplicateGroups);
        savePendingQueue(cleaned);

        healthReport.status = 'degraded';
        healthReport.warnings.push({
            severity: 'warning',
            component: 'queue-duplicates',
            message: `Queue duplicates detected and cleaned: ${totalDuplicates} removed (${(dupRatio * 100).toFixed(1)}%)`,
            recommendation: 'Duplicates auto-removed. Monitor for recurrence.',
            threshold: '10%',
        });

        console.log(`🧹 AUTO-CLEAN: Removed ${queue.length - cleaned.length} content duplicates from queue`);
    } else if (dupRatio > 0.05 && dupRatio < 0.10) {
        // Minor duplicates - log warning but don't auto-clean
        healthReport.warnings.push({
            severity: 'info',
            component: 'queue-duplicates',
            message: `Minor queue duplicates detected: ${totalDuplicates} (${(dupRatio * 100).toFixed(1)}%)`,
            recommendation: 'Within acceptable threshold. Monitoring.',
            threshold: '5%',
        });
    }
}

/**
 * Detect content duplicates in queue
 * Returns groups of jobs with same title+company+location but different IDs
 */
function detectContentDuplicates(queue) {
    const contentMap = new Map();
    const duplicateGroups = [];

    queue.forEach((item, index) => {
        const fingerprint = generateJobFingerprint(item.job);

        if (!contentMap.has(fingerprint)) {
            contentMap.set(fingerprint, []);
        }
        contentMap.get(fingerprint).push({ item, index, fingerprint });
    });

    // Find groups with 2+ entries
    for (const [key, items] of contentMap.entries()) {
        if (items.length > 1) {
            duplicateGroups.push({
                fingerprint: key,
                count: items.length,
                items: items.map(i => ({
                    id: i.item.job.id,
                    addedAt: i.item.addedAt,
                    status: i.item.status,
                    index: i.index,
                })),
            });
        }
    }

    return {
        totalDuplicates: duplicateGroups.reduce((sum, g) => sum + (g.count - 1), 0),
        duplicateGroups,
    };
}

/**
 * Auto-recovery: Remove duplicate content from queue
 * Keeps oldest entry (FIFO), removes newer duplicates
 */
function autoRecoverDuplicates(queue, duplicateGroups) {
    const indicesToRemove = new Set();

    duplicateGroups.forEach(group => {
        // Sort: oldest first (FIFO), then by status priority
        const sorted = [...group.items].sort((a, b) => {
            const timeA = new Date(a.addedAt).getTime();
            const timeB = new Date(b.addedAt).getTime();
            if (timeA !== timeB) return timeA - timeB; // Oldest first

            // Status priority: enriched > pending > posted
            const priority = { enriched: 3, pending: 2, posted: 1 };
            return (priority[b.status] || 0) - (priority[a.status] || 0);
        });

        // Keep first (oldest/highest priority), remove rest
        sorted.slice(1).forEach(item => indicesToRemove.add(item.index));
    });

    const cleaned = queue.filter((_, index) => !indicesToRemove.has(index));

    console.log(`   Before: ${queue.length} items | After: ${cleaned.length} items`);

    return cleaned;
}

/**
 * Save pending queue to file (used by auto-recovery)
 */
function savePendingQueue(queue) {
    const dataDir = path.join(process.cwd(), '.github', 'data');
    const queuePath = path.join(dataDir, 'pending_posts.json');

    // Create backup before writing
    try {
        if (fs.existsSync(queuePath)) {
            const backupPath = path.join(dataDir, `pending_posts.backup-${Date.now()}.json`);
            fs.copyFileSync(queuePath, backupPath);
            console.log(`💾 Backup created: ${backupPath}`);
        }
    } catch (backupError) {
        console.error('⚠️ Could not create backup:', backupError.message);
    }

    // Write updated queue
    try {
        const tempPath = queuePath + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(queue, null, 2));
        fs.renameSync(tempPath, queuePath);
        console.log(`✅ Queue saved: ${queue.length} items`);
    } catch (error) {
        console.error('❌ Error saving queue:', error.message);
    }
}

/**
 * Check 4: Posted Jobs Rate (Schema-Aware)
 * Ensure jobs are actually being posted to Discord
 * Uses schema-aware logic to prevent false positives from V1 legacy posts
 */
function checkPostedJobsRate() {
    const postedPath = path.join(process.cwd(), '.github', 'data', 'posted_jobs.json');

    // Generate schema-aware health report
    const schemaReport = generateSchemaAwareHealthReport(postedPath);

    if (schemaReport.error) {
        healthReport.warnings.push({
            severity: 'warning',
            component: 'discord-bot',
            message: schemaReport.error,
        });
        return;
    }

    // Add schema-aware metrics
    healthReport.metrics.posted_total = schemaReport.total_jobs;
    healthReport.metrics.posted_success_rate = schemaReport.success_rate;
    healthReport.metrics.posted_v2_success = schemaReport.breakdown.v2_success;
    healthReport.metrics.posted_v1_legacy = schemaReport.breakdown.v1_legacy_success;
    healthReport.metrics.posted_true_failures = schemaReport.breakdown.true_failures;

    // Check success rate (using schema-aware logic)
    if (schemaReport.health_status === 'UNHEALTHY') {
        healthReport.status = 'unhealthy';
        healthReport.issues.push({
            severity: 'critical',
            component: 'discord-bot',
            message: `Low posting success rate: ${schemaReport.success_rate}% (${schemaReport.success_count}/${schemaReport.total_jobs})`,
            recommendation: 'Check Discord bot logs for errors or rate limits',
            failures: schemaReport.failures.slice(0, 5), // Top 5 failures
        });
    } else if (schemaReport.health_status === 'DEGRADED') {
        healthReport.status = 'degraded';
        healthReport.warnings.push({
            severity: 'warning',
            component: 'discord-bot',
            message: `Degraded posting success rate: ${schemaReport.success_rate}%`,
            recommendation: 'Monitor Discord bot for intermittent failures',
        });
    }

    // Warn if significant V1 legacy posts exist (migration needed)
    const v1Percentage = schemaReport.total_jobs > 0
        ? (schemaReport.breakdown.v1_legacy_success / schemaReport.total_jobs * 100)
        : 0;

    if (v1Percentage > 50) {
        healthReport.warnings.push({
            severity: 'info',
            component: 'schema-migration',
            message: `${v1Percentage.toFixed(1)}% of posts are V1 legacy schema (${schemaReport.breakdown.v1_legacy_success} jobs)`,
            recommendation: 'Consider running V1→V2 conversion script to migrate legacy posts',
        });
    }
}

/**
 * Check 5: Data File Sizes
 * Ensure files aren't growing unbounded
 */
function checkFileSizes() {
    const dataDir = path.join(process.cwd(), '.github', 'data');
    const files = [
        'seen_jobs.json',
        'pending_posts.json',
        'posted_jobs.json',
        'new_jobs.json',
    ];

    const fileSizes = {};
    files.forEach(file => {
        const filePath = path.join(dataDir, file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            fileSizes[file] = `${sizeMB} MB`;

            // Warn if >10MB
            if (stats.size > 10 * 1024 * 1024) {
                healthReport.warnings.push({
                    severity: 'warning',
                    component: 'storage',
                    message: `${file} is large: ${sizeMB} MB`,
                    recommendation: 'Consider archiving old data',
                });
            }
        }
    });

    healthReport.metrics.file_sizes = fileSizes;
}

/**
 * Generate human-readable report
 */
function generateReport() {
    console.log('\n========================================');
    console.log('📊 JOB PIPELINE HEALTH REPORT');
    console.log('========================================\n');

    // Status
    const statusEmoji = {
        healthy: '✅',
        degraded: '⚠️',
        unhealthy: '🔴',
    };
    console.log(`Status: ${statusEmoji[healthReport.status]} ${healthReport.status.toUpperCase()}\n`);

    // Critical Issues
    if (healthReport.issues.length > 0) {
        console.log('🔴 CRITICAL ISSUES:');
        healthReport.issues.forEach(issue => {
            console.log(`  [${issue.component}] ${issue.message}`);
            if (issue.recommendation) {
                console.log(`    → ${issue.recommendation}`);
            }
        });
        console.log('');
    }

    // Warnings
    if (healthReport.warnings.length > 0) {
        console.log('⚠️  WARNINGS:');
        healthReport.warnings.forEach(warning => {
            console.log(`  [${warning.component}] ${warning.message}`);
            if (warning.recommendation) {
                console.log(`    → ${warning.recommendation}`);
            }
        });
        console.log('');
    }

    // Metrics
    console.log('📈 METRICS:');
    Object.entries(healthReport.metrics).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
    });
    console.log('\n========================================\n');

    // Save report to file
    const reportsDir = path.join(process.cwd(), '.github', 'logs');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, 'health-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(healthReport, null, 2));
    console.log(`📁 Full report saved to: ${reportPath}\n`);

    // Route alerts to external channels (Discord, GitHub summary)
    const alerts = healthReportToAlerts(healthReport);
    if (alerts.length > 0) {
        console.log(`📨 Routing ${alerts.length} alerts to external channels...\n`);
        routeAlerts(alerts).then((results) => {
            const discordSuccess = results.filter(r => r.result.discord).length;
            if (discordSuccess > 0) {
                console.log(`✅ Sent ${discordSuccess} alerts to Discord\n`);
            }
        }).catch((error) => {
            console.error('⚠️ Alert routing failed:', error.message);
        });
    }

    // Exit with appropriate code
    if (healthReport.status === 'unhealthy') {
        console.log('❌ Health check FAILED - pipeline requires attention\n');
        process.exit(1);
    } else if (healthReport.status === 'degraded') {
        console.log('⚠️  Health check WARNING - pipeline degraded but operational\n');
        process.exit(0); // Don't fail workflow, just warn
    } else {
        console.log('✅ Health check PASSED - pipeline operating normally\n');
        process.exit(0);
    }
}

/**
 * Run all health checks
 */
async function runHealthChecks() {
    console.log('🏥 Running health checks...\n');

    checkDeduplicationRate();
    checkSeenJobsSize();
    checkQueueHealth();
    checkContentDuplicates(); // NEW: Content-based duplicate detection + auto-recovery
    checkPostedJobsRate();
    checkFileSizes();

    // Collect time-series metrics
    collectQueueMetrics({
        queue_size: healthReport.metrics.queue_size || 0,
        pending_count: healthReport.metrics.queue_pending || 0,
        enriched_count: healthReport.metrics.queue_enriched || 0,
        posted_count: healthReport.metrics.queue_posted || 0,
        duplicate_count: healthReport.metrics.queue_content_duplicates || 0,
        stale_pending_count: healthReport.metrics.queue_stale_pending || 0,
        duplicate_ratio: parseFloat(healthReport.metrics.queue_duplicate_ratio || 0)
    });

    // Run auto-remediation runbooks
    console.log('\n🔧 Running auto-remediation...\n');
    const remediationResults = await runAllRunbooks();

    // Add remediation results to health report
    healthReport.remediation = {
        timestamp: remediationResults.timestamp,
        summary: {
            remediated: remediationResults.runbooks.filter(r => r.status === 'remediated').length,
            detected: remediationResults.runbooks.filter(r => r.status === 'detected').length,
            errors: remediationResults.runbooks.filter(r => r.status === 'error').length
        },
        runbooks: remediationResults.runbooks
    };

    generateReport();
}

// Run if called directly
if (require.main === module) {
    runHealthChecks();
}

module.exports = { runHealthChecks, healthReport };
