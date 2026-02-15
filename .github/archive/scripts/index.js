/**
 * @zapplyjobs/new-grad-jobs-template
 *
 * Main entry point for the New Grad Jobs Template system.
 * Exports all core modules for use as an NPM package or standalone system.
 *
 * @module index
 * @version 2.0.0
 * @author zapplyjobs
 * @license MIT
 */

// ============================================================================
// Core Job Fetcher Modules
// ============================================================================

const { main: jobFetcherMain, processJobs, updateReadme } = require('./job-fetcher/index');
const { processJobs: jobProcessorProcessJobs } = require('./job-fetcher/job-processor');
const { updateReadme: generateReadme } = require('./job-fetcher/readme-generator');
const { fetchFromJSearch } = require('./job-fetcher/jsearch-source');

// ============================================================================
// Utilities
// ============================================================================

const {
  fetchInternshipData,
  companies,
  fetchUSAJobs,
  fetchLinkedInJobs,
  fetchGreenhouseJobs,
  fetchLeverJobs,
  fetchWorkdayJobs
} = require('./job-fetcher/utils');
const jobUtils = require('./job-fetcher/utils.js');

// ============================================================================
// Configuration Templates
// ============================================================================

const domainConfig = require('./config/domain-config');
const jsearchConfig = require('./config/jsearch-config');

// ============================================================================
// Infrastructure
// ============================================================================

const logger = require('./lib/logger');

// ============================================================================
// Discord Bot Modules
// ============================================================================

const { EnhancedDiscordBot } = require('./enhanced-discord-bot');

// ============================================================================
// Analytics & Monitoring
// ============================================================================

const {
  analyzeFailures,
  analyzeEmptyPosts,
  analyzeJobStatistics,
  analyzeDuplicates
} = require('./analyze-failures');

const {
  checkRecentFailures,
  workflowHealthReport
} = require('./check-recent-failures');

const {
  dailyStats,
  weeklySummary
} = require('./daily-stats');

// ============================================================================
// Health & Diagnostic Tools
// ============================================================================

const {
  diagnosticHealthCheck
} = require('./diagnostic-health-check');

const {
  validateSchema
} = require('./schema-validator');

const {
  channelDiagnostic
} = require('./channel-diagnostic');

// ============================================================================
// Verification Tools
// ============================================================================

const {
  verifyDiscord,
  verifyDiscordChannels,
  verifyJobDistribution,
  verifyWorkflowHealth
} = require('./verify-discord');

// ============================================================================
// Module Exports
// ============================================================================

module.exports = {
  // Core Job Fetcher
  jobFetcher: {
    main: jobFetcherMain,
    processJobs,
    updateReadme,
    jobProcessor: {
      processJobs: jobProcessorProcessJobs
    },
    readmeGenerator: {
      updateReadme: generateReadme
    },
    sources: {
      jsearch: fetchFromJSearch
    }
  },

  // Utilities
  utils: {
    fetchInternshipData,
    companies,
    fetchUSAJobs,
    fetchLinkedInJobs,
    fetchGreenhouseJobs,
    fetchLeverJobs,
    fetchWorkdayJobs,
    ...jobUtils
  },

  // Configuration
  config: {
    domainConfig,
    jsearchConfig
  },

  // Infrastructure
  infrastructure: {
    logger
  },

  // Discord Bot
  discord: {
    EnhancedDiscordBot
  },

  // Analytics
  analytics: {
    analyzeFailures,
    analyzeEmptyPosts,
    analyzeJobStatistics,
    analyzeDuplicates,
    dailyStats,
    weeklySummary
  },

  // Health Monitoring
  health: {
    checkRecentFailures,
    workflowHealthReport,
    diagnosticHealthCheck,
    validateSchema
  },

  // Diagnostics
  diagnostics: {
    channelDiagnostic
  },

  // Verification
  verification: {
    verifyDiscord,
    verifyDiscordChannels,
    verifyJobDistribution,
    verifyWorkflowHealth
  },

  // Version info
  version: '2.0.0',
  name: '@zapplyjobs/new-grad-jobs-template'
};

// ============================================================================
// Convenience exports (direct access)
// ============================================================================

module.exports.processJobs = processJobs;
module.exports.updateReadme = updateReadme;
module.exports.logger = logger;
module.exports.companies = companies;
module.exports.EnhancedDiscordBot = EnhancedDiscordBot;
