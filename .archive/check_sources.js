const fs = require('fs');
const data = JSON.parse(fs.readFileSync('.github/data/posted_jobs.json', 'utf8'));

// Check first job structure
console.log('First job structure:');
console.log(JSON.stringify(data.jobs[0], null, 2).substring(0, 1000));

// Check for 'source' field
const withSource = data.jobs.filter(j => j.source);
console.log('\nJobs with "source" field:', withSource.length);

// Check for 'source_url' field
const withSourceUrl = data.jobs.filter(j => j.source_url);
console.log('Jobs with "source_url" field:', withSourceUrl.length);

// Check distribution
const sources = {};
data.jobs.forEach(j => {
  const src = j.source || j.source_url || 'unknown';
  sources[src] = (sources[src] || 0) + 1;
});

console.log('\nSource distribution:');
Object.entries(sources).sort((a,b) => b[1] - a[1]).forEach(([s, n]) => {
  console.log(`  ${s}: ${n}`);
});
