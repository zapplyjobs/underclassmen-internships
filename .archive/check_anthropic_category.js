// Check if Anthropic is in the software.json categories
const softwareCategories = require('./.github/scripts/job-fetcher/software.json');
const fs = require('fs');

// Search for Anthropic in categories
console.log('Searching for "Anthropic" in software.json:');
Object.entries(softwareCategories).forEach(([key, category]) => {
  const found = category.companies.find(c => c.toLowerCase() === 'anthropic');
  if (found) {
    console.log(`  ✅ Found in "${key}" (${category.title}): ${found}`);
  }
});

console.log('\nSearching for "anthropic" (lowercase):');
Object.entries(softwareCategories).forEach(([key, category]) => {
  const found = category.companies.find(c => c.toLowerCase() === 'anthropic');
  if (found) {
    console.log(`  ✅ Found in "${key}" (${category.title}): ${found}`);
  }
});

// Check database company name
const jobs = JSON.parse(fs.readFileSync('.github/data/posted_jobs.json', 'utf8')).jobs;
const anthropicJobs = jobs.filter(j => (j.company || '').toLowerCase() === 'anthropic');

if (anthropicJobs.length > 0) {
  console.log('\nFirst Anthropic job from database:');
  console.log(JSON.stringify(anthropicJobs[0], null, 2).substring(0, 500));
}
