const fs = require('fs');

// Parse README to count jobs
const readme = fs.readFileSync('README.md', 'utf8');

// Count table rows (excluding header)
const tableRows = readme.match(/\| 🏢 \*\*[^|]+\*\*/g);
console.log('Found', tableRows?.length || 0, 'company sections');

// Count individual job rows (rows starting with |)
const jobRows = readme.match(/^\| 🎮\|^| 🟦\|^| 🏢\|^| ☁️\|^| 🚗\|^| 🛡️\|^| 💰\|^| 🏥\|^| 🏭\|^| 📊/gm);
console.log('Found', jobRows?.length || 0, 'job rows');

// Extract job counts per category
const categoryMatches = [...readme.matchAll(/\*\*([^*]+)\*\*\s*\((\d+)\s*positions/g)];
console.log('\nJob counts by category:');
categoryMatches.forEach(([, category, count]) => {
  console.log(`  ${category.trim()}: ${count}`);
});

// Find Anthropic mentions
const anthropicMatches = readme.match(/Anthropic/g);
console.log('\nAnthropic mentions:', anthropicMatches?.length || 0);
