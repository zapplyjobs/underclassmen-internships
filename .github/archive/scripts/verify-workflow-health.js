#!/usr/bin/env node

/**
 * Workflow Health Verification Script
 *
 * Checks GitHub Actions workflow run history to verify that job posting workflows
 * are running successfully and jobs are being posted (not all filtered out).
 *
 * Usage:
 *   node .github/scripts/verify-workflow-health.js [--runs=10]
 *
 * Arguments:
 *   --runs=N    Number of recent workflow runs to analyze (default: 10)
 *
 * Environment Variables:
 *   - GITHUB_TOKEN: GitHub API token (optional, increases rate limit)
 *   - GITHUB_REPOSITORY: Repository in format "owner/repo" (auto-set in Actions)
 *
 * Output:
 *   - Console report of workflow health
 *   - Exit code 0 if healthy, 1 if critical issues detected
 */

const https = require('https');

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPOSITORY = process.env.GITHUB_REPOSITORY || 'zapplyjobs/New-Grad-Jobs-2026';
const RUNS_TO_ANALYZE = parseInt(process.argv.find(arg => arg.startsWith('--runs='))?.split('=')[1] || '10', 10);

// Thresholds
const MAX_FAILURE_RATE = 0.3;  // Alert if >30% of recent runs failed
const MIN_JOBS_POSTED_RATE = 0.5;  // Alert if <50% of runs posted jobs
const CRITICAL_CONSECUTIVE_FAILURES = 3;  // Alert if 3+ consecutive failures

/**
 * Make GitHub API request
 */
function githubApiRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Discord-Health-Monitor',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    if (GITHUB_TOKEN) {
      options.headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        } else {
          reject(new Error(`API request failed: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Fetch recent workflow runs
 */
async function fetchWorkflowRuns(workflowName = 'update-jobs.yml') {
  const path = `/repos/${REPOSITORY}/actions/workflows/${workflowName}/runs?per_page=${RUNS_TO_ANALYZE}`;
  const response = await githubApiRequest(path);
  return response.workflow_runs || [];
}

/**
 * Fetch workflow run logs to check for job posting activity
 */
async function analyzeWorkflowRun(runId) {
  try {
    const path = `/repos/${REPOSITORY}/actions/runs/${runId}/jobs`;
    const response = await githubApiRequest(path);
    const jobs = response.jobs || [];

    const analysis = {
      id: runId,
      success: false,
      jobsPosted: false,
      allJobsFiltered: false,
      errors: [],
      stepResults: {}
    };

    for (const job of jobs) {
      // Check overall job status
      if (job.conclusion === 'success') {
        analysis.success = true;
      }

      // Analyze steps to determine if jobs were posted
      if (job.steps) {
        for (const step of job.steps) {
          const stepName = step.name.toLowerCase();

          // Check for Discord bot step
          if (stepName.includes('discord') || stepName.includes('post')) {
            analysis.stepResults[step.name] = step.conclusion;

            // If Discord step completed successfully, jobs were likely posted
            if (step.conclusion === 'success') {
              analysis.jobsPosted = true;
            }
          }

          // Check for "all jobs filtered" indicators
          if (stepName.includes('filter') && step.conclusion === 'skipped') {
            analysis.allJobsFiltered = true;
          }

          // Track failures
          if (step.conclusion === 'failure') {
            analysis.errors.push({
              step: step.name,
              message: 'Step failed (check workflow logs for details)'
            });
          }
        }
      }
    }

    return analysis;
  } catch (error) {
    return {
      id: runId,
      success: false,
      jobsPosted: false,
      allJobsFiltered: false,
      errors: [{ step: 'API', message: error.message }]
    };
  }
}

/**
 * Analyze workflow health
 */
function analyzeWorkflowHealth(runs, runAnalyses) {
  const stats = {
    totalRuns: runs.length,
    successfulRuns: 0,
    failedRuns: 0,
    runsWithJobsPosted: 0,
    runsAllFiltered: 0,
    consecutiveFailures: 0,
    recentErrors: [],
    runDetails: []
  };

  // Process runs in reverse chronological order (most recent first)
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const analysis = runAnalyses.find(a => a.id === run.id) || {};

    const detail = {
      number: run.run_number,
      id: run.id,
      status: run.status,
      conclusion: run.conclusion,
      createdAt: run.created_at,
      url: run.html_url,
      jobsPosted: analysis.jobsPosted || false,
      allFiltered: analysis.allJobsFiltered || false,
      errors: analysis.errors || []
    };

    stats.runDetails.push(detail);

    // Count successes/failures
    if (run.conclusion === 'success') {
      stats.successfulRuns++;
      stats.consecutiveFailures = 0;  // Reset counter
    } else if (run.conclusion === 'failure') {
      stats.failedRuns++;
      stats.consecutiveFailures++;

      // Track errors
      if (analysis.errors && analysis.errors.length > 0) {
        stats.recentErrors.push({
          runNumber: run.run_number,
          timestamp: run.created_at,
          errors: analysis.errors
        });
      }
    }

    // Track job posting activity
    if (analysis.jobsPosted) {
      stats.runsWithJobsPosted++;
    }

    if (analysis.allJobsFiltered) {
      stats.runsAllFiltered++;
    }
  }

  // Calculate rates
  stats.failureRate = stats.totalRuns > 0 ? stats.failedRuns / stats.totalRuns : 0;
  stats.jobsPostedRate = stats.totalRuns > 0 ? stats.runsWithJobsPosted / stats.totalRuns : 0;

  return stats;
}

/**
 * Generate health report
 */
function generateReport(stats) {
  console.log('\n' + '='.repeat(80));
  console.log('Workflow Health Report');
  console.log('Repository:', REPOSITORY);
  console.log('Workflow: update-jobs.yml');
  console.log('Generated:', new Date().toISOString());
  console.log('='.repeat(80) + '\n');

  // Summary
  console.log('📊 Summary (Last', stats.totalRuns, 'Runs):');
  console.log(`   Successful Runs: ${stats.successfulRuns}`);
  console.log(`   Failed Runs: ${stats.failedRuns}`);
  console.log(`   Failure Rate: ${(stats.failureRate * 100).toFixed(1)}%`);
  console.log(`   Consecutive Failures: ${stats.consecutiveFailures}`);
  console.log('');

  // Job posting activity
  console.log('📤 Job Posting Activity:');
  console.log(`   Runs with Jobs Posted: ${stats.runsWithJobsPosted}`);
  console.log(`   Job Posting Rate: ${(stats.jobsPostedRate * 100).toFixed(1)}%`);
  console.log(`   Runs with All Jobs Filtered: ${stats.runsAllFiltered}`);
  console.log('');

  // Recent runs
  console.log('📋 Recent Workflow Runs:');
  stats.runDetails.slice(0, 10).forEach((run, idx) => {
    const icon = run.conclusion === 'success' ? '✅' : run.conclusion === 'failure' ? '❌' : '⏸️';
    const jobStatus = run.jobsPosted ? '📤 Jobs Posted' : run.allFiltered ? '🔍 All Filtered' : '❓ Unknown';
    console.log(`   ${icon} Run #${run.number} (${new Date(run.createdAt).toLocaleDateString()})`);
    console.log(`      Status: ${run.conclusion || run.status}`);
    console.log(`      ${jobStatus}`);
    if (run.errors.length > 0) {
      console.log(`      Errors: ${run.errors.length}`);
    }
  });
  console.log('');

  // Errors
  if (stats.recentErrors.length > 0) {
    console.log('🚨 Recent Errors:');
    stats.recentErrors.slice(0, 5).forEach((errRun) => {
      console.log(`   Run #${errRun.runNumber} (${new Date(errRun.timestamp).toLocaleDateString()})`);
      errRun.errors.forEach((err) => {
        console.log(`      - ${err.step}: ${err.message}`);
      });
    });
    console.log('');
  }

  // Health assessment
  console.log('='.repeat(80));
  const issues = [];

  if (stats.failureRate > MAX_FAILURE_RATE) {
    issues.push(`High failure rate: ${(stats.failureRate * 100).toFixed(1)}%`);
  }

  if (stats.consecutiveFailures >= CRITICAL_CONSECUTIVE_FAILURES) {
    issues.push(`${stats.consecutiveFailures} consecutive failures`);
  }

  if (stats.jobsPostedRate < MIN_JOBS_POSTED_RATE && stats.totalRuns > 3) {
    issues.push(`Low job posting rate: ${(stats.jobsPostedRate * 100).toFixed(1)}%`);
  }

  if (stats.runsAllFiltered > stats.totalRuns * 0.5) {
    issues.push(`More than 50% of runs have all jobs filtered`);
  }

  if (issues.length > 0) {
    console.log('❌ WORKFLOW HEALTH CHECK FAILED');
    console.log('\nIssues Detected:');
    issues.forEach((issue, idx) => {
      console.log(`  ${idx + 1}. ${issue}`);
    });
    return 1;
  } else {
    console.log('✅ WORKFLOW HEALTH CHECK PASSED');
    return 0;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Starting Workflow Health Check...');
  console.log(`   Repository: ${REPOSITORY}`);
  console.log(`   Runs to Analyze: ${RUNS_TO_ANALYZE}`);
  console.log('');

  try {
    // Fetch workflow runs
    console.log('📥 Fetching workflow runs...');
    const runs = await fetchWorkflowRuns();

    if (runs.length === 0) {
      console.warn('⚠️  WARNING: No workflow runs found');
      console.log('\nThis could mean:');
      console.log('  1. The workflow has never run');
      console.log('  2. The workflow name is incorrect');
      console.log('  3. API access is restricted');
      process.exit(0);
    }

    console.log(`✅ Found ${runs.length} workflow run(s)`);
    console.log('');

    // Analyze each run (limit to avoid rate limiting)
    console.log('🔍 Analyzing workflow runs...');
    const analysisPromises = runs.slice(0, Math.min(10, runs.length)).map(run =>
      analyzeWorkflowRun(run.id)
    );
    const runAnalyses = await Promise.all(analysisPromises);
    console.log('✅ Analysis complete');
    console.log('');

    // Analyze health
    const stats = analyzeWorkflowHealth(runs, runAnalyses);

    // Generate report
    const exitCode = generateReport(stats);
    process.exit(exitCode);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, fetchWorkflowRuns, analyzeWorkflowRun, analyzeWorkflowHealth };
