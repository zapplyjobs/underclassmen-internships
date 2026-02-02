const fs = require('fs');
const jobs = JSON.parse(fs.readFileSync('.github/data/posted_jobs.json', 'utf8')).jobs;

const noDate = jobs.filter(j => !j.sourceDate);
console.log('Jobs without sourceDate:', noDate.length);
console.log('Total jobs:', jobs.length);

// Check by company
const byCompany = {};
noDate.forEach(j => {
  byCompany[j.company] = (byCompany[j.company] || 0) + 1;
});

console.log('\nTop 20 companies without dates:');
Object.entries(byCompany)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([c, n]) => console.log(`  ${c}: ${n}`));
