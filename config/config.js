/**
 * New-Grad-Jobs-2027 Configuration
 *
 * Purpose: Per-repo customization for shared job board library
 * Version: 1.0 (2026-02-12)
 *
 * Template Variables:
 * - {totalCompanies} - Replaced with unique company count
 * - {currentJobs} - Replaced with active job count
 */

module.exports = {
  // Schema version
  version: 1,

  // Image configuration
  repoPrefix: 'ngj',
  headingImageAlt: 'New Grad Jobs 2027',

  // Branding text
  title: 'New Grad Jobs 2027',
  tagline: '',
  jobCountBadgeLabel: 'New Grad Jobs',

  // Description paragraphs
  descriptionLine1: '🚀 New grad, intern/co-op, and adjacent early-career roles across tech, finance, healthcare, and more, updated in real time.',
  descriptionLine2: '',

  // Note box
  noteType: 'TIP',
  noteText: '🛠 Help us grow! Add new jobs by submitting an issue! View contributing steps [here](CONTRIBUTING-GUIDE.md).',

  // Section headers
  jobsSectionHeader: 'Fresh New Grad Jobs 2027',

  // Feature flags
  features: {
    internships: false,     // Internship section not used (no companyPrograms data)
    moreResources: true     // Show links to other job board repos
  },

  // Job categorization
  defaultCategory: 'other',

  // Data filter (single source of truth — imported by index.js and update-readme-only.js)
  filters: { locations: ['us'] },

  // Active window for current_jobs.json (days) — read by write-current-jobs.js
  activeWindowDays: 14
};
