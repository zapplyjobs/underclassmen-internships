/**
 * New-Grad-Jobs-2026 Configuration
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
  headingImageAlt: 'New Grad Jobs 2026',

  // Branding text
  title: 'New Grad Jobs 2026',
  tagline: '',
  jobCountBadgeLabel: 'New Grad Jobs',

  // Description paragraphs
  descriptionLine1: '🚀 Entry-level jobs across tech, finance, healthcare, and more for new graduates, updated in real time.',
  descriptionLine2: '',

  // Note box
  noteType: 'TIP',
  noteText: '🛠 Help us grow! Add new jobs by submitting an issue! View contributing steps [here](CONTRIBUTING-GUIDE.md).',

  // Section headers
  jobsSectionHeader: 'Fresh New Grad Jobs 2026',

  // Feature flags
  features: {
    internships: false,     // Internship section not used (no companyPrograms data)
    moreResources: true     // Show links to other job board repos
  },

  // Job categorization
  defaultCategory: 'other'
};
