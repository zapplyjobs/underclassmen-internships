const fs = require('fs');
const { generateJobId } = require('./job-fetcher/utils');
const scrapeAmazonJobs = require('../../jobboard/src/backend/platforms/amazon/amazonScraper');
// const googleScraper = require('../../jobboard/src/backend/platforms/google/googleScraper'); // DISABLED: Alternative data source configured
// const scrapeMetaJobs = require('../../jobboard/src/backend/platforms/meta/metaScraper'); // DISABLED: Alternative data source configured
// const microsoftScraper = require('../../jobboard/src/backend/platforms/microsoft/microsoftScraper'); // DISABLED: Redundant with API integration (see line 159)
// const scrapeUberJobs = require('../../jobboard/src/backend/platforms/uber/uberScraper'); // DISABLED: Alternative data source provides coverage
// const scrapeSlackJobs = require('../../jobboard/src/backend/platforms/slack/slackScraper'); // DISABLED: Alternative data source configured
const {isUSOnlyJob} = require('./job-fetcher/utils');
// Load company database
const companies = JSON.parse(fs.readFileSync('./.github/scripts/job-fetcher/companies.json', 'utf8'));
const ALL_COMPANIES = Object.values(companies).flat();

// API endpoint configurations
const CAREER_APIS = {
    // Group A
    'Stripe': {
        api: 'https://api.greenhouse.io/v1/boards/stripe/jobs',
        method: 'GET',
        parser: (data) => {
            if (!Array.isArray(data.jobs)) return [];
            return data.jobs
                .filter(job => job.title.toLowerCase().includes('engineer') ||
                    job.title.toLowerCase().includes('developer'))
                .map(job => ({
                    job_title: job.title,
                    employer_name: 'Stripe',
                    job_city: job.location?.name?.split(', ')?.[0] || 'San Francisco',
                    job_state: job.location?.name?.split(', ')?.[1] || 'CA',
                    job_description: job.content || 'Join Stripe to help build the economic infrastructure for the internet.',
                    job_apply_link: job.absolute_url,
                    job_posted_at_datetime_utc: safeISOString(job.updated_at),
                    job_employment_type: 'FULLTIME'
                }));
        }
    },

    'Coinbase': {
        api: 'https://api.greenhouse.io/v1/boards/coinbase/jobs',
        method: 'GET',
        parser: (data) => {
            if (!Array.isArray(data.jobs)) return [];
            return data.jobs
                .filter(job => job.title.toLowerCase().includes('engineer') ||
                    job.title.toLowerCase().includes('developer'))
                .map(job => ({
                    job_title: job.title,
                    employer_name: 'Coinbase',
                    job_city: job.location?.name?.split(', ')?.[0] || 'San Francisco',
                    job_state: job.location?.name?.split(', ')?.[1] || 'CA',
                    job_description: job.content || 'Join Coinbase to build the future of cryptocurrency.',
                    job_apply_link: job.absolute_url,
                    job_posted_at_datetime_utc: safeISOString(job.updated_at),
                    job_employment_type: 'FULLTIME'
                }));
        }
    },

    'Airbnb': {
        api: 'https://api.greenhouse.io/v1/boards/airbnb/jobs',
        method: 'GET',
        parser: (data) => {
            if (!Array.isArray(data.jobs)) return [];
            return data.jobs
                .filter(job => job.title.toLowerCase().includes('engineer') ||
                    job.title.toLowerCase().includes('developer'))
                .map(job => ({
                    job_title: job.title,
                    employer_name: 'Airbnb',
                    job_city: job.location?.name?.split(', ')?.[0] || 'San Francisco',
                    job_state: job.location?.name?.split(', ')?.[1] || 'CA',
                    job_description: job.content || 'Join Airbnb to create a world where anyone can belong anywhere.',
                    job_apply_link: job.absolute_url,
                    job_posted_at_datetime_utc: safeISOString(job.updated_at),
                    job_employment_type: 'FULLTIME'
                }));
        }
    },

    'Databricks': {
        api: 'https://api.greenhouse.io/v1/boards/databricks/jobs',
        method: 'GET',
        parser: (data) => {
            if (!Array.isArray(data.jobs)) return [];
            return data.jobs
                .filter(job => job.title.toLowerCase().includes('engineer') ||
                    job.title.toLowerCase().includes('developer'))
                .map(job => ({
                    job_title: job.title,
                    employer_name: 'Databricks',
                    job_city: job.location?.name?.split(', ')?.[0] || 'San Francisco',
                    job_state: job.location?.name?.split(', ')?.[1] || 'CA',
                    job_description: job.content || 'Join Databricks to unify analytics and AI.',
                    job_apply_link: job.absolute_url,
                    job_posted_at_datetime_utc: safeISOString(job.updated_at),
                    job_employment_type: 'FULLTIME'
                }));
        }
    },

    'Figma': {
        api: 'https://api.greenhouse.io/v1/boards/figma/jobs',
        method: 'GET',
        parser: (data) => {
            if (!Array.isArray(data.jobs)) return [];
            return data.jobs
                .filter(job => job.title.toLowerCase().includes('engineer') ||
                    job.title.toLowerCase().includes('developer'))
                .map(job => ({
                    job_title: job.title,
                    employer_name: 'Figma',
                    job_city: job.location?.name?.split(', ')?.[0] || 'San Francisco',
                    job_state: job.location?.name?.split(', ')?.[1] || 'CA',
                    job_description: job.content || 'Join Figma to make design accessible to all.',
                    job_apply_link: job.absolute_url,
                    job_posted_at_datetime_utc: safeISOString(job.updated_at),
                    job_employment_type: 'FULLTIME'
                }));
        }
    },

    // Group B
    'Apple': {
        api: 'https://jobs.apple.com/api/v1/search',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "query": "engineer",
            "filters": {
                "locations": ["postLocation-USA"]
            },
            "page": 1,
            "locale": "en-us",
            "sort": "newest",
            "format": {
                "longDate": "MMMM D, YYYY",
                "mediumDate": "MMM D, YYYY"
            }
        }),
        parser: (data) => {
            if (!data.searchResults) return [];
            return data.searchResults
                .slice(0, 20)
                .map(job => ({
                    job_title: job.postingTitle,
                    employer_name: 'Apple',
                    job_city: job.locations?.[0]?.name?.split(', ')?.[0] || 'Cupertino',
                    job_state: job.locations?.[0]?.name?.split(', ')?.[1] || 'CA',
                    job_description: job.jobSummary || 'Join Apple to create products that change lives.',
                    job_apply_link: `https://jobs.apple.com/en-us/details/${job.positionId}`,
                    job_posted_at_datetime_utc: safeISOString(job.postDateInGMT),
                    job_employment_type: 'FULLTIME'
                }));
        }
    },

    'Microsoft': {
        api: 'https://gcsservices.careers.microsoft.com/search/api/v1/search?l=en_us&pg=1&pgSz=20&o=Recent&flt=true',
        method: 'GET',
        parser: (data) => {
            if (!data.operationResult?.result?.jobs) return [];
            return data.operationResult.result.jobs
                .filter(job => job.title.toLowerCase().includes('engineer') ||
                    job.title.toLowerCase().includes('developer'))
                .map(job => ({
                    job_title: job.title,
                    employer_name: 'Microsoft',
                    job_city: job.primaryLocation?.city || 'Redmond',
                    job_state: job.primaryLocation?.state || 'WA',
                    job_description: job.description || 'Join Microsoft to empower every person and organization on the planet.',
                    job_apply_link: `https://jobs.careers.microsoft.com/global/en/job/${job.jobId}`,
                    job_posted_at_datetime_utc: safeISOString(job.postedDate),
                    job_employment_type: 'FULLTIME'
                }));
        }
    },

    'Netflix': {
        api: 'https://explore.jobs.netflix.net/api/apply/v2/jobs?domain=netflix.com&query=engineer',
        method: 'GET',
        pagination: true,
        parser: (data) => {
            if (!data.positions) return [];

            // Filter for fresh jobs from past week and engineering roles
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

            return data.positions
                .filter(job => {
                    const isEngineering = job.name.toLowerCase().includes('engineer') ||
                        job.name.toLowerCase().includes('developer') ||
                        job.department === 'Engineering';
                    const isFresh = (job.t_create * 1000) > oneWeekAgo;
                    return isEngineering && isFresh;
                })
                .map(job => ({
                    job_title: job.name,
                    employer_name: 'Netflix',
                    job_city: job.location?.split(',')?.[0] || 'Los Gatos',
                    job_state: job.location?.split(', ')?.[1] || 'CA',
                    job_description: job.job_description || 'Join Netflix to entertain the world.',
                    job_apply_link: job.canonicalPositionUrl,
                    job_posted_at_datetime_utc: safeISOString(job.t_create * 1000),
                    job_employment_type: 'FULLTIME'
                }));
        }
    },

    'Qualcomm': {
        api: 'https://careers.qualcomm.com/api/apply/v2/jobs?domain=qualcomm.com&num=20&query=USA&sort_by=relevance',
        method: 'GET',
        parser: (data) => {
            if (!data.positions) return [];
            return data.positions
                .filter(job => job.name.toLowerCase().includes('engineer') ||
                    job.name.toLowerCase().includes('developer'))
                .map(job => ({
                    job_title: job.name,
                    employer_name: 'Qualcomm',
                    job_city: job.location?.split(', ')?.[0] || 'San Diego',
                    job_state: job.location?.split(', ')?.[1] || 'CA',
                    job_description: job.description || 'Join Qualcomm to invent breakthrough technologies.',
                    job_apply_link: job.canonicalPositionUrl,
                    job_posted_at_datetime_utc: safeISOString(job.publishedDate),
                    job_employment_type: 'FULLTIME'
                }));
        }
    },

    'PayPal': {
        api: 'https://paypal.eightfold.ai/api/apply/v2/jobs?domain=paypal.com&num=20&location=USA&sort_by=relevance',
        method: 'GET',
        parser: (data) => {
            if (!data.positions) return [];
            return data.positions
                .filter(job => job.name.toLowerCase().includes('engineer') ||
                    job.name.toLowerCase().includes('developer'))
                .map(job => ({
                    job_title: job.name,
                    employer_name: 'PayPal',
                    job_city: job.location?.split(', ')?.[0] || 'San Jose',
                    job_state: job.location?.split(', ')?.[1] || 'CA',
                    job_description: job.description || 'Join PayPal to democratize financial services.',
                    job_apply_link: job.canonicalPositionUrl,
                    job_posted_at_datetime_utc: safeISOString(job.publishedDate),
                    job_employment_type: 'FULLTIME'
                }));
        }
    },

    'Discord': {
        api: 'https://boards-api.greenhouse.io/v1/boards/discord/jobs',
        method: 'GET',
        parser: (data) => {
            if (!Array.isArray(data.jobs)) return [];
            return data.jobs
                .filter(job => job.title.toLowerCase().includes('engineer') ||
                              job.title.toLowerCase().includes('developer'))
                .map(job => ({
                    job_title: job.title,
                    employer_name: 'Discord',
                    job_city: job.location?.name?.split(', ')?.[0] || 'San Francisco',
                    job_state: job.location?.name?.split(', ')?.[1] || 'CA',
                    job_description: job.content || 'Join Discord to build connections.',
                    job_apply_link: job.absolute_url,
                    job_posted_at_datetime_utc: safeISOString(job.updated_at),
                    job_employment_type: 'FULLTIME'
                }));
        }
    },

    'Lyft': {
        api: 'https://boards-api.greenhouse.io/v1/boards/lyft/jobs',
        method: 'GET',
        parser: (data) => {
            if (!Array.isArray(data.jobs)) return [];
            return data.jobs
                .filter(job => job.title.toLowerCase().includes('engineer') ||
                              job.title.toLowerCase().includes('developer'))
                .map(job => ({
                    job_title: job.title,
                    employer_name: 'Lyft',
                    job_city: job.location?.name?.split(', ')?.[0] || 'San Francisco',
                    job_state: job.location?.name?.split(', ')?.[1] || 'CA',
                    job_description: job.content || 'Join Lyft to improve people\'s lives with the world\'s best transportation.',
                    job_apply_link: job.absolute_url,
                    job_posted_at_datetime_utc: safeISOString(job.updated_at),
                    job_employment_type: 'FULLTIME'
                }));
        }
    }
};

// Utility functions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function safeISOString(dateValue) {
    if (!dateValue) return new Date().toISOString();
    
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            return new Date().toISOString();
        }
        return date.toISOString();
    } catch (error) {
        return new Date().toISOString();
    }
}

// Fetch jobs from a specific company's career API
async function fetchCompanyJobs(companyName) {
    const config = CAREER_APIS[companyName];
    if (!config) {
        console.log(`⚠️ No API config for ${companyName}`);
        return [];
    }

    try {
        console.log(`🔍 Fetching jobs from ${companyName}...`);

        const options = {
            method: config.method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                ...config.headers
            }
        };

        if (config.body) {
            options.body = config.body;
        }

        const response = await fetch(config.api, options);

        if (!response.ok) {
            console.log(`❌ ${companyName} API returned ${response.status}`);
            return [];
        }

        const data = await response.json();
        const jobs = config.parser(data);

        console.log(`✅ Found ${jobs.length} jobs at ${companyName}`);
        return jobs;

    } catch (error) {
        console.error(`❌ Error fetching ${companyName} jobs:`, error.message);
        return [];
    }
}

// Fetch jobs from secondary data sources
async function fetchExternalJobsData() {
    try {
        console.log('📡 Fetching data from secondary sources...');

        // Fetch from external data source
        const newGradUrl = process.env.EXTERNAL_JOBS_SOURCE || process.env.PRIMARY_DATA_SOURCE_URL;
        if (!newGradUrl) {
            console.log('⚠️ External data source not configured');
            return [];
        }
        const response = await fetch(newGradUrl);

        if (!response.ok) {
            console.log(`⚠️ Could not fetch external data: ${response.status}`);
            return [];
        }

        const data = await response.json();

        const activeJobs = data
            .filter(job => job.active && job.url &&
                (job.title.toLowerCase().includes('engineer') ||
                    job.title.toLowerCase().includes('developer')))
            .map(job => ({
                job_title: job.title,
                employer_name: job.company_name,
                job_city: job.locations?.[0]?.split(', ')?.[0] || 'Multiple',
                job_state: job.locations?.[0]?.split(', ')?.[1] || 'Locations',
                job_description: `Join ${job.company_name} in this exciting opportunity.`,
                job_apply_link: job.url,
                job_posted_at_datetime_utc: safeISOString(job.date_posted * 1000),
                job_employment_type: 'FULLTIME'
            }));

        console.log(`📋 Found ${activeJobs.length} active positions`);
        return activeJobs;

    } catch (error) {
        console.error(`❌ Error fetching external data:`, error.message);
        return [];
    }
}

// Fetch jobs from all configured sources
async function fetchAllRealJobs() {
    console.log('🚀 Starting job data collection...');

    let allJobs = [];
    const [amazonJobs] = await Promise.all([
        scrapeAmazonJobs().catch(err => { console.error('❌ Amazon scraper failed:', err.message); return []; }),
        // googleScraper().catch(err => { console.error('❌ Google scraper failed:', err.message); return []; }), // DISABLED: See line 4
    ]);
    allJobs.push(...amazonJobs);
    const companiesWithAPIs = Object.keys(CAREER_APIS);

    // Fetch from API sources

for (const company of companiesWithAPIs) {
    const jobs = await fetchCompanyJobs(company);
    allJobs.push(...jobs);

    // Rate limiting
    await delay(2000);
}

// Fetch from secondary sources
const externalJobs = await fetchExternalJobsData();
allJobs.push(...externalJobs);

// Filter to keep only US jobs
const removedJobs = [];
allJobs = allJobs.filter(job => {
    const isUSJob = isUSOnlyJob(job);
    
    if (!isUSJob) {
        removedJobs.push(job);
        return false; // Remove non-US job
    }
    
    return true; // Keep US job
});

// Console log the removed jobs
console.log(`Removed ${removedJobs.length} non-US jobs:`, removedJobs);

    // Remove duplicates using standardized job ID generation
    const uniqueJobs = allJobs.filter((job, index, self) => {
        const jobId = generateJobId(job);
        return index === self.findIndex(j => generateJobId(j) === jobId);
    });

    // Sort by posting date (descending - latest first)
    uniqueJobs.sort((a, b) => {
        const dateA = new Date(a.job_posted_at_datetime_utc);
        const dateB = new Date(b.job_posted_at_datetime_utc);
        return dateB - dateA;
    });

    console.log(`📊 Total jobs collected: ${allJobs.length}`);
    console.log(`🧹 After deduplication: ${uniqueJobs.length}`);
    console.log(`✅ Job collection complete`);

    return uniqueJobs;
}

module.exports = { fetchAllRealJobs, fetchExternalJobsData };
