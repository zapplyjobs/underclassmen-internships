#!/usr/bin/env node

/**
 * Schema-Aware Health Check
 *
 * Prevents false positives by understanding V1 vs V2 posting schemas.
 *
 * Context: The 55% false positive incident (2026-01-21) occurred because
 * health monitoring counted V1 legacy posts (discordThreadId) as failures
 * instead of recognizing them as valid migration artifacts.
 *
 * V1 Schema (Legacy): { discordThreadId, postedToDiscord }
 * V2 Schema (Current): { discordPosts: { channelId: { messageId, ... } }, postedToDiscord }
 */

const fs = require('fs');
const path = require('path');

/**
 * Categorize job status based on schema version
 *
 * @param {Object} job - Job object from posted_jobs.json
 * @returns {Object} - { status, schema, channels, reason, migration_artifact }
 */
function categorizeJobStatus(job) {
    const hasV2Posts = job.discordPosts && Object.keys(job.discordPosts).length > 0;
    const hasV1Thread = !!job.discordThreadId;
    const hasPostedTimestamp = !!job.postedToDiscord;

    // V2 Multi-Channel Success
    if (hasV2Posts) {
        return {
            status: 'SUCCESS',
            schema: 'V2',
            channels: Object.keys(job.discordPosts).length,
            posted_at: job.postedToDiscord
        };
    }

    // V1 Legacy Success (migration artifact - NOT a failure!)
    if (hasV1Thread && hasPostedTimestamp) {
        return {
            status: 'SUCCESS',
            schema: 'V1_LEGACY',
            channels: 1,
            posted_at: job.postedToDiscord,
            migration_artifact: true
        };
    }

    // True Failure (no V1 or V2 posting evidence)
    if (!hasV2Posts && !hasV1Thread) {
        return {
            status: 'FAILURE',
            schema: 'UNKNOWN',
            reason: 'no_posting_evidence'
        };
    }

    // Edge case: Has V1 thread but no timestamp (data corruption?)
    if (hasV1Thread && !hasPostedTimestamp) {
        return {
            status: 'DEGRADED',
            schema: 'V1_PARTIAL',
            reason: 'missing_timestamp'
        };
    }

    // Fallback
    return {
        status: 'UNKNOWN',
        schema: 'UNKNOWN',
        reason: 'unexpected_state'
    };
}

/**
 * Generate schema-aware health report
 *
 * @param {string} postedJobsPath - Path to posted_jobs.json
 * @returns {Object} - Health report with breakdown by schema
 */
function generateSchemaAwareHealthReport(postedJobsPath = null) {
    // Default path
    if (!postedJobsPath) {
        postedJobsPath = path.join(process.cwd(), '.github', 'data', 'posted_jobs.json');
    }

    // Load posted jobs
    let postedJobs;
    try {
        if (!fs.existsSync(postedJobsPath)) {
            return {
                error: 'posted_jobs.json not found',
                path: postedJobsPath
            };
        }
        const content = fs.readFileSync(postedJobsPath, 'utf8');
        postedJobs = JSON.parse(content);
    } catch (error) {
        return {
            error: `Failed to load posted_jobs.json: ${error.message}`,
            path: postedJobsPath
        };
    }

    // Initialize counters
    const stats = {
        v2_success: 0,
        v1_legacy_success: 0,
        true_failures: 0,
        degraded: 0,
        unknown: 0
    };

    const failures = [];
    const degraded = [];

    // Categorize each job
    for (const job of postedJobs.jobs || []) {
        const category = categorizeJobStatus(job);

        if (category.status === 'SUCCESS' && category.schema === 'V2') {
            stats.v2_success++;
        } else if (category.status === 'SUCCESS' && category.schema === 'V1_LEGACY') {
            stats.v1_legacy_success++;
        } else if (category.status === 'FAILURE') {
            stats.true_failures++;
            failures.push({
                company: job.company,
                title: job.title,
                url: job.url,
                reason: category.reason,
                timestamp: job.postedToDiscord || 'unknown'
            });
        } else if (category.status === 'DEGRADED') {
            stats.degraded++;
            degraded.push({
                company: job.company,
                title: job.title,
                reason: category.reason,
                timestamp: job.postedToDiscord || 'unknown'
            });
        } else {
            stats.unknown++;
        }
    }

    const total = postedJobs.jobs?.length || 0;
    const successCount = stats.v2_success + stats.v1_legacy_success;
    const success_rate = total > 0 ? (successCount / total * 100).toFixed(2) : 0;

    // Determine health status
    let health_status;
    if (success_rate >= 90) {
        health_status = 'HEALTHY';
    } else if (success_rate >= 70) {
        health_status = 'DEGRADED';
    } else {
        health_status = 'UNHEALTHY';
    }

    return {
        timestamp: new Date().toISOString(),
        total_jobs: total,
        success_count: successCount,
        success_rate: parseFloat(success_rate),
        health_status,
        breakdown: stats,
        failures: failures.slice(0, 10), // Top 10 failures
        degraded: degraded.slice(0, 10), // Top 10 degraded
        notes: {
            v1_legacy_explanation: 'V1 posts are migration artifacts from before multi-channel V2 schema. They are SUCCESS, not failures.',
            false_positive_prevention: 'This schema-aware check prevents the 55% false positive incident from recurring.'
        }
    };
}

/**
 * Check if V1 posts exist (migration artifacts)
 *
 * @param {string} postedJobsPath - Path to posted_jobs.json
 * @returns {Object} - { hasV1Posts, v1Count, v1Examples }
 */
function checkForV1MigrationArtifacts(postedJobsPath = null) {
    const report = generateSchemaAwareHealthReport(postedJobsPath);

    if (report.error) {
        return { error: report.error };
    }

    const hasV1Posts = report.breakdown.v1_legacy_success > 0;
    const v1Count = report.breakdown.v1_legacy_success;

    return {
        hasV1Posts,
        v1Count,
        v1Percentage: report.total_jobs > 0
            ? ((v1Count / report.total_jobs) * 100).toFixed(1)
            : 0,
        recommendation: hasV1Posts
            ? 'V1 posts detected. Consider running V1→V2 conversion script to migrate legacy posts.'
            : 'No V1 migration artifacts found. All posts are V2 schema.'
    };
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'report';
    const filePath = args[1] || null;

    if (command === 'report') {
        const report = generateSchemaAwareHealthReport(filePath);
        console.log(JSON.stringify(report, null, 2));
    } else if (command === 'check-v1') {
        const v1Check = checkForV1MigrationArtifacts(filePath);
        console.log(JSON.stringify(v1Check, null, 2));
    } else {
        console.error('Usage: node schema-aware-health.js [report|check-v1] [path/to/posted_jobs.json]');
        process.exit(1);
    }
}

module.exports = {
    categorizeJobStatus,
    generateSchemaAwareHealthReport,
    checkForV1MigrationArtifacts
};
