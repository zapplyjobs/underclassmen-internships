const fs = require('fs');

const data = JSON.parse(fs.readFileSync('.github/data/posted_jobs.json', 'utf8'));
const companies = {};

data.jobs.forEach(j => {
  const company = j.company || j.employer_name || 'Unknown';
  companies[company] = (companies[company] || 0) + 1;
});

const sorted = Object.entries(companies).sort((a,b) => b[1] - a[1]);

console.log('Total jobs:', data.jobs.length);
console.log('Total companies:', sorted.length);
console.log('\nTop 30 companies:');
sorted.slice(0, 30).forEach(([company, num]) => {
  console.log(`  ${company}: ${num}`);
});
