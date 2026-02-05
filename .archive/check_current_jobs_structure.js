// Check what fields current jobs have when they reach the readme-generator
// We'll simulate what processJobs returns

const { fetchAllJobs } = require('./.github/scripts/unified-job-fetcher');

async function checkJobStructure() {
  console.log('Fetching jobs to check structure...');
  const jobs = await fetchAllJobs();

  console.log(`Total jobs fetched: ${jobs.length}`);

  // Check first job structure
  console.log('\nFirst job fields:');
  console.log(Object.keys(jobs[0]));

  // Check for employer_name vs company
  const hasEmployerName = jobs.filter(j => j.employer_name).length;
  const hasCompany = jobs.filter(j => j.company).length;

  console.log(`\nJobs with employer_name: ${hasEmployerName}`);
  console.log(`Jobs with company: ${hasCompany}`);

  // Check for Anthropic specifically
  const anthropicJobs = jobs.filter(j =>
    (j.employer_name || '').toLowerCase() === 'anthropic' ||
    (j.company || '').toLowerCase() === 'anthropic'
  );

  console.log(`\nAnthropic jobs in current fetch: ${anthropicJobs.length}`);

  if (anthropicJobs.length > 0) {
    console.log('First Anthropic job fields:', Object.keys(anthropicJobs[0]));
    console.log('employer_name:', anthropicJobs[0].employer_name);
    console.log('company:', anthropicJobs[0].company);
    console.log('job_posted_at:', anthropicJobs[0].job_posted_at);
  }
}

checkJobStructure().catch(console.error);
