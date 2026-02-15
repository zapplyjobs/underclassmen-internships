/**
 * Unified Job Fetcher
 * Orchestrates job collection from all configured sources
 *
 * Sources (ALL used together):
 * 1. JSearch API (new-grad focused) - 90 jobs/day quota
 * 2. ATS platforms (Greenhouse, Lever, Ashby, Workable) - Company career pages
 * 3. API-based companies (legacy - currently disabled)
 *
 * Feature Flags:
 *   - USE_JSEARCH=true: Include JSearch API (90 jobs/day)
 *   - USE_JSEARCH=false: ATS only
 */

const { getCompanies } = require('../../jobboard/src/backend/config/companies.js');
const { fetchAPIJobs } = require('../../jobboard/src/backend/services/apiService.js');
const { generateJobId, isUSOnlyJob } = require('./job-fetcher/utils.js');
const { fetchAllATSJobs } = require('./job-fetcher/sources');
const { searchJSearchNewGrad } = require('./job-fetcher/jsearch-source');

/**
 * Delay helper for rate limiting
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch jobs from all configured sources
 * @returns {Promise<Array>} Array of unique job objects
 */
async function fetchAllJobs() {
  console.log('🚀 Starting unified job collection...');
  console.log('━'.repeat(50));

  const allJobs = [];
  const sources = [];

  // === Source 1: JSearch API (900 jobs/day quota) ===
  const useJSearch = process.env.USE_JSEARCH === 'true' || process.env.USE_JSEARCH === '1';
  console.log(`\n🔧 Feature Flag: USE_JSEARCH=${useJSearch ? 'true' : 'false'}`);

  if (useJSearch) {
    console.log('\n📡 Fetching from JSearch API...');
    console.log('   Quota: 90 requests/day (330 total/day across 7 repos)');

    try {
      const jsearchJobs = await searchJSearchNewGrad();
      allJobs.push(...jsearchJobs);
      sources.push('JSearch API');
      console.log(`📊 JSearch: ${jsearchJobs.length} jobs`);
    } catch (error) {
      console.error(`❌ JSearch failed:`, error.message);
    }
  }

  // === Source 2: ATS platforms (ALWAYS used) ===
  console.log('\n📡 Fetching from ATS platforms...');
  console.log('   Sources: Greenhouse, Lever, Ashby, Workable');

  try {
    const { jobs: atsJobs, stats: atsStats } = await fetchAllATSJobs({ delayMs: 500 });

    // Normalize ATS jobs to match expected format
    const normalizedATSJobs = atsJobs.map(job => {
      // Parse location into city and state
      let job_city = '';
      let job_state = '';

      const location = job.location || job.locations?.[0] || '';

      if (location.toLowerCase() === 'remote') {
        job_city = 'Remote';
        job_state = '';
      } else if (location.includes(',')) {
        const parts = location.split(',').map(p => p.trim());
        job_city = parts[0] || '';
        job_state = parts[1] || '';
      } else {
        job_city = location || '';
        job_state = '';
      }

      return {
        // Map to legacy format expected by downstream processors
        job_title: job.title,
        employer_name: job.company_name,
        job_city: job_city,
        job_state: job_state,
        job_apply_link: job.url,
        job_posted_at_datetime_utc: job.posted_at,
        job_description: job.description,
        // Keep original fields for reference
        ...job
      };
    });

    allJobs.push(...normalizedATSJobs);
    sources.push('ATS platforms');
    console.log(`📊 ATS: ${normalizedATSJobs.length} jobs`);
  } catch (error) {
    console.error(`❌ ATS sources failed:`, error.message);
  }

  // === Source 3: API-based companies ===
  console.log('\n📡 Checking API-based companies...');

  const companies = getCompanies();
  const companyKeys = Object.keys(companies);

  if (companyKeys.length > 0) {
    for (const key of companyKeys) {
      const company = companies[key];

      try {
        const jobs = await fetchAPIJobs(company);

        if (jobs && jobs.length > 0) {
          allJobs.push(...jobs);
        }

        // Rate limiting: 2 second delay between API calls
        await delay(2000);

      } catch (error) {
        console.error(`❌ Error processing ${company.name}:`, error.message);
      }
    }
    console.log(`📊 API companies: ${companyKeys.length} companies configured`);
  } else {
    console.log(`   No API companies configured`);
  }

  // === Filter to US-only jobs ===
  console.log('\n🇺🇸 Filtering to US-only jobs...');

  const removedJobs = [];
  const usJobs = allJobs.filter(job => {
    const isUSJob = isUSOnlyJob(job);

    if (!isUSJob) {
      removedJobs.push(job);
      return false;
    }

    return true;
  });

  console.log(`   Kept: ${usJobs.length} US jobs`);
  console.log(`   Removed: ${removedJobs.length} non-US jobs`);

  // === Remove duplicates ===
  console.log('\n🔄 Removing duplicates...');

  const uniqueJobs = usJobs.filter((job, index, self) => {
    const jobId = generateJobId(job);
    return index === self.findIndex(j => generateJobId(j) === jobId);
  });

  const duplicatesRemoved = usJobs.length - uniqueJobs.length;
  console.log(`   Duplicates removed: ${duplicatesRemoved}`);

  // === Sort by posting date ===
  uniqueJobs.sort((a, b) => {
    const dateA = new Date(a.job_posted_at_datetime_utc || 0);
    const dateB = new Date(b.job_posted_at_datetime_utc || 0);
    return dateB - dateA; // Latest first
  });

  // === Final Summary ===
  console.log('\n' + '━'.repeat(50));
  console.log('✅ Job collection complete!');
  console.log(`📊 Final count: ${uniqueJobs.length} unique jobs`);
  console.log(`📡 Sources: ${sources.join(' + ') || 'ATS only'}`);
  console.log('━'.repeat(50) + '\n');

  return uniqueJobs;
}

module.exports = {
  fetchAllJobs
};
