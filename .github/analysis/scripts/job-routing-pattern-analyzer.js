#!/usr/bin/env node

/**
 * Job Routing Pattern Analyzer
 *
 * Analyzes existing job postings to identify misclassification patterns
 * and generate data-driven filter improvements.
 *
 * Usage: node job-routing-pattern-analyzer.js
 * Output: pattern-analysis-report.md
 */

const fs = require('fs');
const path = require('path');

// Mock channel config (matching enhanced-discord-bot.js structure)
const CHANNEL_CONFIG = {
  'tech': 'tech-channel-id',
  'sales': 'sales-channel-id',
  'marketing': 'marketing-channel-id',
  'finance': 'finance-channel-id',
  'healthcare': 'healthcare-channel-id',
  'product': 'product-channel-id',
  'supply-chain': 'supply-channel-id',
  'project-management': 'pm-channel-id',
  'hr': 'hr-channel-id'
};

// Channel names for reporting
const CHANNEL_NAMES = {
  'tech': '💻・tech-jobs',
  'sales': '💰・sales-jobs',
  'marketing': '📢・marketing-jobs',
  'finance': '💳・finance-jobs',
  'healthcare': '🏥・healthcare-jobs',
  'product': '📱・product-jobs',
  'supply-chain': '🚚・supply-chain-jobs',
  'project-management': '📋・project-management-jobs',
  'hr': '👥・hr-jobs'
};

/**
 * Simulate current routing logic (copy of enhanced-discord-bot.js logic)
 */
function simulateCurrentRouting(job) {
  const title = (job.job_title || '').toLowerCase();
  const description = (job.job_description || '').toLowerCase();
  const combined = `${title} ${description}`;

  // TECH ROLES - Check first (most common for our job board)
  if (/\b(software engineer|developer|programmer|data scientist|devops|system administrator|systems analyst|IT|technical|backend|frontend|full stack|mobile|cloud|infrastructure|security|qa|test engineer|sre|reliability|platform|machine learning|ai|algorithm)\b/.test(title)) {
    return { category: 'tech', source: 'title-tech', keyword: 'tech' };
  }

  // Sales roles - Check title first to avoid matching company names
  if (/\b(sales|account executive|account manager|bdr|sdr|business development|customer success|revenue|quota)\b/.test(title)) {
    return { category: 'sales', source: 'title-sales', keyword: 'sales' };
  }

  // Marketing roles - Check title first
  if (/\b(marketing|growth|seo|sem|content marketing|brand|campaign|digital marketing|social media|copywriter|creative director)\b/.test(title)) {
    return { category: 'marketing', source: 'title-marketing', keyword: 'marketing' };
  }

  // Finance roles - Check title first
  if (/\b(finance|accounting|financial analyst|controller|treasury|audit|tax|bookkeep|cfo|actuarial|investment|banker)\b/.test(title)) {
    return { category: 'finance', source: 'title-finance', keyword: 'finance' };
  }

  // Healthcare roles - More specific to avoid company name matches
  if (/\b(healthcare|medical|clinical|nurse|doctor|physician|therapist|pharmaceutical|biotech|hospital|patient care|registered nurse|rn|lpn|md|pa|clinical research)\b/.test(title)) {
    return { category: 'healthcare', source: 'title-healthcare', keyword: 'healthcare' };
  }

  // Product Management roles - Check title first
  if (/\b(product manager|product owner|product marketing|(\bpm\b)|product lead|product strategy|product analyst)\b/.test(title)) {
    return { category: 'product', source: 'title-product', keyword: 'product' };
  }

  // Supply Chain/Operations roles - Check title first
  if (/\b(supply chain|logistics|operations manager|procurement|inventory|warehouse|distribution|sourcing|fulfillment|shipping)\b/.test(title)) {
    return { category: 'supply-chain', source: 'title-supply-chain', keyword: 'supply-chain' };
  }

  // Project Management roles - Check title first
  if (/\b(project manager|program manager|scrum master|agile coach|pmo|project coordinator|delivery manager)\b/.test(title)) {
    return { category: 'project-management', source: 'title-pm', keyword: 'pm' };
  }

  // HR roles - Check title first
  if (/\b(human resources|(\bhr\b)|recruiter|talent acquisition|people operations|compensation|benefits|hiring manager|recruitment|workforce)\b/.test(title)) {
    return { category: 'hr', source: 'title-hr', keyword: 'hr' };
  }

  // FALLBACK: Check descriptions for roles that might have different titles
  // Only if title didn't match anything specific

  // Healthcare from description (but exclude company names)
  if (/\b(healthcare|medical|clinical|nurse|doctor|physician|therapist|pharmaceutical|biotech|hospital|patient care|registered nurse|rn|lpn|md|pa|clinical research)\b/.test(description) &&
      !/\b(health|cardinal|united|osf|ascension|hca|tenet)\b/.test(title)) {
    return { category: 'healthcare', source: 'description-healthcare', keyword: 'healthcare' };
  }

  // Finance from description
  if (/\b(finance|accounting|financial analyst|controller|treasury|audit|tax|bookkeep|cfo|actuarial|investment|banker)\b/.test(description)) {
    return { category: 'finance', source: 'description-finance', keyword: 'finance' };
  }

  // Tech roles from description
  if (/\b(software engineer|developer|programmer|data scientist|devops|system administrator|systems analyst|IT|technical|backend|frontend|full stack|mobile|cloud|infrastructure|security|qa|test engineer|sre|reliability|platform|machine learning|ai|algorithm)\b/.test(description)) {
    return { category: 'tech', source: 'description-tech', keyword: 'tech' };
  }

  // Default to tech for all remaining roles
  return { category: 'tech', source: 'default', keyword: 'default' };
}

/**
 * Analyze a job for potential misclassification patterns
 */
function analyzeJob(job, routing) {
  const title = (job.job_title || '').toLowerCase();
  const description = (job.job_description || '').toLowerCase();
  const company = (job.employer_name || '').toLowerCase();

  const analysis = {
    jobTitle: job.job_title,
    company: job.employer_name,
    routedTo: routing.category,
    routingSource: routing.source,
    routingKeyword: routing.keyword,
    potentialIssues: [],
    confidence: 100,
    recommendedCategory: routing.category
  };

  // High confidence indicators
  if (routing.source === 'title-tech' && /\b(software engineer|developer|data scientist|machine learning|ai engineer|devops|sre|backend|frontend|full stack|mobile)\b/.test(title)) {
    analysis.confidence = 100;
  } else if (routing.source.startsWith('description-')) {
    analysis.confidence = 60;
    analysis.potentialIssues.push('Description-based routing - lower confidence');
  } else if (routing.source === 'default') {
    analysis.confidence = 30;
    analysis.potentialIssues.push('Default routing - no clear categorization');
  }

  // Check for tech jobs that might leak to non-tech channels
  const techKeywords = /\b(software|developer|engineer|data|ai|ml|programming|coding|backend|frontend|fullstack|devops|cloud|security|qa|test)\b/i;
  const hasTechIndicators = techKeywords.test(title) || techKeywords.test(description);

  if (hasTechIndicators && routing.category !== 'tech') {
    analysis.potentialIssues.push(`Tech job routed to ${routing.category} channel`);
    analysis.recommendedCategory = 'tech';
    analysis.confidence = Math.min(analysis.confidence, 20);
  }

  // Check for specific problematic patterns
  if (routing.category === 'sales' && /\b(data.*analytics|business.*intelligence|product.*analytics|sales.*engineer)\b/.test(title)) {
    analysis.potentialIssues.push('Data/Analytics role misclassified as sales');
    analysis.recommendedCategory = 'tech';
    analysis.confidence = Math.min(analysis.confidence, 40);
  }

  if (routing.category === 'marketing' && /\b(data.*scientist|machine.*learning|ai.*engineer)\b/.test(title)) {
    analysis.potentialIssues.push('ML/AI role misclassified as marketing');
    analysis.recommendedCategory = 'tech';
    analysis.confidence = Math.min(analysis.confidence, 40);
  }

  if (routing.category === 'supply-chain' && /\b(data.*engineer|platform.*engineer|software.*engineer)\b/.test(title)) {
    analysis.potentialIssues.push('Software/Platform Engineer misclassified as supply-chain');
    analysis.recommendedCategory = 'tech';
    analysis.confidence = Math.min(analysis.confidence, 40);
  }

  return analysis;
}

/**
 * Generate comprehensive analysis report
 */
function generateAnalysisReport(jobs, analyses) {
  const totalJobs = jobs.length;
  const categoryDistribution = {};
  const sourceDistribution = {};
  const potentialMisclassifications = analyses.filter(a => a.potentialIssues.length > 0);
  const lowConfidenceJobs = analyses.filter(a => a.confidence < 70);
  const techJobsInNonTechChannels = analyses.filter(a => a.recommendedCategory === 'tech' && a.routedTo !== 'tech');

  // Calculate distributions
  analyses.forEach(analysis => {
    categoryDistribution[analysis.routedTo] = (categoryDistribution[analysis.routedTo] || 0) + 1;
    sourceDistribution[analysis.routingSource] = (sourceDistribution[analysis.routingSource] || 0) + 1;
  });

  // Generate filter improvement recommendations
  const filterRecommendations = generateFilterRecommendations(potentialMisclassifications);

  const report = `# Job Routing Pattern Analysis Report

**Generated:** ${new Date().toISOString()}
**Total Jobs Analyzed:** ${totalJobs}
**Analysis Date:** ${new Date().toLocaleDateString()}

---

## 📊 Executive Summary

- **Jobs with Potential Issues:** ${potentialMisclassifications.length} (${((potentialMisclassifications.length/totalJobs)*100).toFixed(1)}%)
- **Low Confidence Jobs (<70%):** ${lowConfidenceJobs.length} (${((lowConfidenceJobs.length/totalJobs)*100).toFixed(1)}%)
- **Tech Jobs in Non-Tech Channels:** ${techJobsInNonTechChannels.length} (${((techJobsInNonTechChannels.length/totalJobs)*100).toFixed(1)}%)
- **Current Estimated Accuracy:** ${((totalJobs - potentialMisclassifications.length) / totalJobs * 100).toFixed(1)}%

---

## 🎯 Key Findings

### 1. Category Distribution
${Object.entries(categoryDistribution)
  .sort(([,a], [,b]) => b - a)
  .map(([category, count]) => `- **${category.toUpperCase()}:** ${count} jobs (${((count/totalJobs)*100).toFixed(1)}%)`)
  .join('\n')}

### 2. Routing Source Distribution
${Object.entries(sourceDistribution)
  .sort(([,a], [,b]) => b - a)
  .map(([source, count]) => `- **${source}:** ${count} jobs (${((count/totalJobs)*100).toFixed(1)}%)`)
  .join('\n')}

### 3. Top Misclassification Patterns

${potentialMisclassifications.slice(0, 20).map((analysis, index) => `
${index + 1}. **${analysis.jobTitle}** @ ${analysis.company}
   - **Routed to:** ${analysis.routedTo} (${analysis.routingSource})
   - **Issues:** ${analysis.potentialIssues.join(', ')}
   - **Recommended:** ${analysis.recommendedCategory}
   - **Confidence:** ${analysis.confidence}%
`).join('')}

---

## 🔧 Filter Improvement Recommendations

${filterRecommendations}

---

## 📋 Detailed Misclassification Analysis

### Tech Jobs in Non-Tech Channels (Priority 1)

${techJobsInNonTechChannels.map(analysis => `
- **${analysis.jobTitle}** @ ${analysis.company}
  - Currently: ${CHANNEL_NAMES[analysis.routedTo]} (${analysis.routingSource})
  - Should be: ${CHANNEL_NAMES.tech}
  - Issue: ${analysis.potentialIssues.join(', ')}
`).join('')}

### Low Confidence Jobs (Priority 2)

${lowConfidenceJobs.slice(0, 15).map(analysis => `
- **${analysis.jobTitle}** @ ${analysis.company}
  - Confidence: ${analysis.confidence}%
  - Routing: ${analysis.routingSource} → ${CHANNEL_NAMES[analysis.routedTo]}
  - Issues: ${analysis.potentialIssues.join(', ')}
`).join('')}

---

## 🚀 Implementation Plan

### Phase 1: Quick Wins (Week 1)
${filterRecommendations.split('\n')
  .filter(line => line.includes('IMMEDIATE:'))
  .map(line => `- ${line.replace('IMMEDIATE: ', '')}`)
  .join('\n')}

### Phase 2: Pattern Improvements (Week 2)
${filterRecommendations.split('\n')
  .filter(line => line.includes('PHASE 2:'))
  .map(line => `- ${line.replace('PHASE 2: ', '')}`)
  .join('\n')}

### Phase 3: Enhanced Logic (Week 3)
${filterRecommendations.split('\n')
  .filter(line => line.includes('PHASE 3:'))
  .map(line => `- ${line.replace('PHASE 3: ', '')}`)
  .join('\n')}

---

## 📈 Success Metrics

- **Target Accuracy:** 90% (from current ${((totalJobs - potentialMisclassifications.length) / totalJobs * 100).toFixed(1)}%)
- **Tech Leakage Reduction:** From ${techJobsInNonTechChannels.length} to <10 jobs
- **Low Confidence Reduction:** From ${lowConfidenceJobs.length} to <5% of total

---

*Report generated using Job Routing Pattern Analyzer*
`;

  return report;
}

function generateFilterRecommendations(misclassifications) {
  const recommendations = [];

  // Analyze common misclassification patterns
  const dataScienceIssues = misclassifications.filter(m =>
    m.potentialIssues.some(issue => issue.includes('Data/Analytics role'))
  );

  const mlAiIssues = misclassifications.filter(m =>
    m.potentialIssues.some(issue => issue.includes('ML/AI role'))
  );

  const softwareEngineerIssues = misclassifications.filter(m =>
    m.potentialIssues.some(issue => issue.includes('Software/Platform Engineer'))
  );

  if (dataScienceIssues.length > 0) {
    recommendations.push(`IMMEDIATE: Fix Data/Analytics misclassification (${dataScienceIssues.length} jobs affected)
  - Add explicit "data scientist|data analyst|business intelligence|data engineer" pattern BEFORE sales pattern
  - Move data-related checks to top of routing logic as tech priority`);
  }

  if (mlAiIssues.length > 0) {
    recommendations.push(`IMMEDIATE: Fix ML/AI misclassification (${mlAiIssues.length} jobs affected)
  - Add explicit "machine learning|ai engineer|deep learning|computer vision|nlp" pattern BEFORE marketing pattern
  - Strengthen tech detection for ML roles`);
  }

  if (softwareEngineerIssues.length > 0) {
    recommendations.push(`IMMEDIATE: Fix Software Engineer misclassification (${softwareEngineerIssues.length} jobs affected)
  - Add explicit "software engineer|platform engineer|backend engineer|frontend engineer" pattern
  - Ensure engineer pattern includes negative lookahead for supply chain roles`);
  }

  recommendations.push(`PHASE 2: Reduce description-based routing confidence
  - Only use description routing when title is truly ambiguous (Analyst, Coordinator, Specialist)
  - Add stricter validation for description keyword matching`);

  recommendations.push(`PHASE 3: Implement confidence-based routing
  - Jobs with <50% confidence should be flagged for manual review
  - Consider adding "needs-review" category for ambiguous cases`);

  return recommendations.join('\n\n');
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🔍 Starting Job Routing Pattern Analysis...\n');

    // Load posted jobs data
    const postedJobsPath = path.join(process.cwd(), '.github', 'data', 'posted_jobs.json');

    if (!fs.existsSync(postedJobsPath)) {
      console.error('❌ posted_jobs.json not found');
      process.exit(1);
    }

    const postedJobs = JSON.parse(fs.readFileSync(postedJobsPath, 'utf8'));
    console.log(`📊 Loaded ${postedJobs.length} posted jobs\n`);

    // We need to reconstruct job details from job IDs
    console.log('⚠️  Note: posted_jobs.json contains only job IDs');
    console.log('🔄 For comprehensive analysis, we should also load new_jobs.json or job-fetcher data\n');

    // Load recent jobs for detailed analysis
    const newJobsPath = path.join(process.cwd(), '.github', 'data', 'new_jobs.json');
    let recentJobs = [];

    if (fs.existsSync(newJobsPath)) {
      recentJobs = JSON.parse(fs.readFileSync(newJobsPath, 'utf8'));
      console.log(`📊 Loaded ${recentJobs.length} recent jobs for detailed analysis\n`);
    }

    // Analyze recent jobs with full data
    const analyses = recentJobs.map(job => {
      const routing = simulateCurrentRouting(job);
      return analyzeJob(job, routing);
    });

    // Generate and save report
    const report = generateAnalysisReport(recentJobs, analyses);
    const reportPath = path.join(process.cwd(), '.github', 'analysis', 'job-routing-pattern-analysis.md');

    // Ensure analysis directory exists
    const analysisDir = path.dirname(reportPath);
    if (!fs.existsSync(analysisDir)) {
      fs.mkdirSync(analysisDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, report, 'utf8');

    console.log('✅ Analysis Complete!');
    console.log(`📄 Report saved to: ${reportPath}\n`);

    // Print summary
    const totalJobs = recentJobs.length;
    const issues = analyses.filter(a => a.potentialIssues.length > 0);
    const techLeakage = analyses.filter(a => a.recommendedCategory === 'tech' && a.routedTo !== 'tech');

    console.log('📊 Quick Summary:');
    console.log(`   Total Jobs Analyzed: ${totalJobs}`);
    console.log(`   Jobs with Issues: ${issues.length} (${((issues.length/totalJobs)*100).toFixed(1)}%)`);
    console.log(`   Tech Jobs in Non-Tech: ${techLeakage.length}`);
    console.log(`   Current Accuracy: ${((totalJobs - issues.length) / totalJobs * 100).toFixed(1)}%\n`);

    if (techLeakage.length > 0) {
      console.log('🚨 Priority Issues - Tech Jobs in Wrong Channels:');
      techLeakage.slice(0, 5).forEach(analysis => {
        console.log(`   - "${analysis.jobTitle}" @ ${analysis.company} → ${analysis.routedTo}`);
      });
      if (techLeakage.length > 5) {
        console.log(`   ... and ${techLeakage.length - 5} more`);
      }
      console.log('\n💡 See full report for detailed recommendations.');
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  simulateCurrentRouting,
  analyzeJob,
  generateAnalysisReport
};