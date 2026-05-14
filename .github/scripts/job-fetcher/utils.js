/**
 * Job Fetcher Utilities - Wrapper for Consumer Submodule
 *
 * Delegates to the consumer submodule's lib/utils.js which contains
 * all utility functions needed for README generation.
 *
 * Post-INF-SUBMODULE-1: shared/lib/utils no longer exists.
 * All utility functions now live in the consumer submodule.
 */

const fs = require('fs');
const path = require('path');

// Import utilities from consumer submodule
const consumerUtils = require('../consumer/lib/utils');

// Load company database if present (New-Grad and Internships repos have companies.json;
// SEO repos do not — company emoji/career URL features degrade gracefully to defaults)
let companies = {};

const companiesPath = path.join(__dirname, 'companies.json');
if (fs.existsSync(companiesPath)) {
  companies = JSON.parse(fs.readFileSync(companiesPath, 'utf8'));

  // Only initialize for the expected format: {category: [{name, api_names}, ...]}
  const firstCategory = Object.values(companies)[0];
  if (Array.isArray(firstCategory)) {
    consumerUtils.initCompanyDatabase(companies);
  }
}

// Re-export all consumer utilities + repo-specific companies
module.exports = {
  ...consumerUtils,
  companies,
  ALL_COMPANIES: consumerUtils.ALL_COMPANIES,
};
