#!/usr/bin/env node

/**
 * Job Statistics Analyzer
 *
 * Analyzes posting patterns and database health:
 * - Job posting frequency over time
 * - Duplicate detection patterns
 * - Database growth rate
 * - ID format distribution
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║              JOB STATISTICS & PATTERN ANALYSIS                ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// ============================================================================
// 1. GIT COMMIT ANALYSIS
// ============================================================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. RECENT POSTING ACTIVITY (Git Commits)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  // Get commits for last 7 days
  const periods = [
    { label: 'Today', since: '1 day ago' },
    { label: 'Last 3 days', since: '3 days ago' },
    { label: 'Last 7 days', since: '7 days ago' }
  ];

  periods.forEach(period => {
    const commitCount = execSync(
      `git log --oneline --since="${period.since}" --grep="Update jobs" | wc -l`,
      { encoding: 'utf8' }
    ).trim();

    console.log(`   ${period.label.padEnd(15)} ${commitCount.padStart(4)} job update commits`);
  });

  // Analyze README changes
  console.log('\n   README Changes (last 7 days):');
  const readmeStats = execSync(
    'git log --stat --since="7 days ago" -- README.md | grep "insertions\\|deletions" | head -20',
    { encoding: 'utf8' }
  );

  const changes = readmeStats.split('\n').filter(line => line.includes('insertion') || line.includes('deletion'));

  if (changes.length > 0) {
    let totalInsertions = 0;
    let totalDeletions = 0;

    changes.forEach(line => {
      const insertMatch = line.match(/(\d+) insertion/);
      const deleteMatch = line.match(/(\d+) deletion/);

      if (insertMatch) totalInsertions += parseInt(insertMatch[1]);
      if (deleteMatch) totalDeletions += parseInt(deleteMatch[1]);
    });

    const avgInsertions = (totalInsertions / changes.length).toFixed(1);
    const avgDeletions = (totalDeletions / changes.length).toFixed(1);

    console.log(`   ├─ Average insertions per commit: ${avgInsertions}`);
    console.log(`   ├─ Average deletions per commit:  ${avgDeletions}`);
    console.log(`   └─ Net change per commit:         ${(avgInsertions - avgDeletions).toFixed(1)}`);
  }
} catch (error) {
  console.log('   ⚠️  Could not analyze git history:', error.message);
}

// ============================================================================
// 2. DATABASE ANALYSIS
// ============================================================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('2. POSTED JOBS DATABASE PATTERNS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const postedJobsPath = path.join(process.cwd(), '.github', 'data', 'posted_jobs.json');
const posted = JSON.parse(fs.readFileSync(postedJobsPath, 'utf8'));

// Analyze company distribution
const companies = {};
posted.forEach(id => {
  // Extract company from ID (first segment before hyphen)
  const company = id.split('-')[0];
  companies[company] = (companies[company] || 0) + 1;
});

const sortedCompanies = Object.entries(companies)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

console.log('   Top 20 Companies (by posted jobs):');
sortedCompanies.forEach(([company, count], index) => {
  const bar = '█'.repeat(Math.ceil(count / 10));
  console.log(`   ${(index + 1).toString().padStart(2)}. ${company.padEnd(25)} ${count.toString().padStart(4)} ${bar}`);
});

// ============================================================================
// 3. SEEN JOBS ANALYSIS
// ============================================================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('3. SEEN JOBS DATABASE (Duplicate Detection)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const seenJobsPath = path.join(process.cwd(), '.github', 'data', 'seen_jobs.json');
const seen = JSON.parse(fs.readFileSync(seenJobsPath, 'utf8'));

console.log(`   Total seen jobs:          ${seen.length}`);
console.log(`   Posted jobs:              ${posted.length}`);
console.log(`   Not posted (filtered):    ${seen.length - posted.length}`);
console.log(`   Filter rate:              ${((1 - posted.length / seen.length) * 100).toFixed(1)}%`);

// ============================================================================
// 4. README ANALYSIS
// ============================================================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('4. CURRENT README STATUS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const readme = fs.readFileSync('README.md', 'utf8');

// Extract all jobs from table
const jobLines = readme.split('\n').filter(line => line.match(/^\|[^|]+\|[^|]+\|[^|]+\|/));
const jobs = jobLines.slice(1).map(line => {
  const cols = line.split('|').map(c => c.trim()).filter(c => c);
  return {
    company: cols[0],
    title: cols[1],
    location: cols[2]
  };
});

console.log(`   Total jobs in README:     ${jobs.length}`);

// Analyze by location
const locations = {};
jobs.forEach(job => {
  const loc = job.location;
  locations[loc] = (locations[loc] || 0) + 1;
});

const topLocations = Object.entries(locations)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

console.log('\n   Top 10 Locations:');
topLocations.forEach(([location, count], index) => {
  console.log(`   ${(index + 1).toString().padStart(2)}. ${location.padEnd(30)} ${count.toString().padStart(3)} jobs`);
});

// ============================================================================
// 5. POSTING SUCCESS RATE
// ============================================================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('5. DISCORD POSTING SUCCESS RATE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Analyze recent audit logs
const auditDir = path.join(process.cwd(), '.github', 'audit');
if (fs.existsSync(auditDir)) {
  const auditFiles = fs.readdirSync(auditDir)
    .filter(file => file.startsWith('audit-') && file.endsWith('.md'))
    .sort()
    .slice(-20); // Last 20 audit logs

  let totalPosted = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalRuns = 0;

  auditFiles.forEach(file => {
    const content = fs.readFileSync(path.join(auditDir, file), 'utf8');

    const postedMatch = content.match(/Posted:\*\*\s*(\d+)/);
    const failedMatch = content.match(/Failed:\*\*\s*(\d+)/);
    const skippedMatch = content.match(/Skipped:\*\*\s*(\d+)/);

    if (postedMatch) {
      totalPosted += parseInt(postedMatch[1]);
      totalFailed += failedMatch ? parseInt(failedMatch[1]) : 0;
      totalSkipped += skippedMatch ? parseInt(skippedMatch[1]) : 0;
      totalRuns++;
    }
  });

  console.log(`   Last ${totalRuns} bot runs:`);
  console.log(`   ├─ Total posted:        ${totalPosted}`);
  console.log(`   ├─ Total failed:        ${totalFailed}`);
  console.log(`   ├─ Total skipped:       ${totalSkipped}`);
  console.log(`   ├─ Success rate:        ${totalPosted + totalFailed > 0 ? ((totalPosted / (totalPosted + totalFailed)) * 100).toFixed(1) : 'N/A'}%`);
  console.log(`   └─ Avg per run:         ${(totalPosted / totalRuns).toFixed(1)} jobs posted`);

  if (totalPosted === 0 && totalSkipped > 0) {
    console.log(`\n   ⚠️  Recent trend: No jobs posted, all filtered as duplicates`);
    console.log(`       This suggests either:`);
    console.log(`       - No genuinely new jobs from sources`);
    console.log(`       - OR: Database full (check capacity)`);
  }
} else {
  console.log('   ⚠️  No audit logs found');
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║                      ANALYSIS COMPLETE                        ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');
