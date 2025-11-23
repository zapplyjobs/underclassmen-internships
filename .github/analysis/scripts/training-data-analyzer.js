#!/usr/bin/env node

/**
 * Training Data Analyzer - v3 Performance Monitor
 *
 * Analyzes real-world routing performance to identify improvement opportunities
 * and track accuracy over time.
 */

const fs = require('fs');
const path = require('path');
const { decryptLog } = require('./encryption-utils');

class TrainingDataAnalyzer {
  constructor() {
    this.trainingLogPath = path.join(process.cwd(), '.github', 'data', 'training-data-v3.json.enc');
  }

  analyzeRecentPerformance(days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const allEntries = this.loadTrainingData();
    const recentEntries = allEntries.filter(entry =>
      new Date(entry.timestamp) > cutoffDate
    );

    return this.generatePerformanceReport(recentEntries);
  }

  loadTrainingData() {
    if (!fs.existsSync(this.trainingLogPath)) {
      return [];
    }

    const encryptedData = fs.readFileSync(this.trainingLogPath, 'utf8')
      .split('\n')
      .filter(line => line.trim());

    return encryptedData.map(line => {
      try {
        return JSON.parse(decryptLog(line.trim()));
      } catch (error) {
        console.warn('Failed to decrypt training entry:', error.message);
        return null;
      }
    }).filter(entry => entry !== null);
  }

  generatePerformanceReport(entries) {
    const total = entries.length;
    const successful = entries.filter(e => e.outcome.postedSuccessfully).length;
    const needsReview = entries.filter(e => e.validation.needsReview).length;
    const lowConfidence = entries.filter(e => e.routing.confidence < 50).length;
    const highConfidence = entries.filter(e => e.routing.confidence >= 90).length;

    // Category distribution
    const categoryStats = {};
    entries.forEach(entry => {
      const cat = entry.routing.category;
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, avgConfidence: 0, needsReview: 0 };
      }
      categoryStats[cat].total++;
      categoryStats[cat].avgConfidence += entry.routing.confidence;
      if (entry.validation.needsReview) {
        categoryStats[cat].needsReview++;
      }
    });

    // Calculate averages
    Object.keys(categoryStats).forEach(cat => {
      categoryStats[cat].avgConfidence = (categoryStats[cat].avgConfidence / categoryStats[cat].total).toFixed(1);
    });

    const report = `# Training Data Performance Report

**Period:** Last ${days} days
**Total Jobs Analyzed:** ${total}
**Report Generated:** ${new Date().toISOString()}

## 📊 Performance Metrics

- **Success Rate:** ${((successful/total)*100).toFixed(1)}% (${successful}/${total})
- **High Confidence Jobs:** ${highConfidence} (${((highConfidence/total)*100).toFixed(1)}%)
- **Low Confidence Jobs:** ${lowConfidence} (${((lowConfidence/total)*100).toFixed(1)}%)
- **Jobs Needing Review:** ${needsReview} (${((needsReview/total)*100).toFixed(1)}%)

## 🎯 Category Breakdown

${Object.entries(categoryStats)
  .map(([category, stats]) =>
    `**${category.toUpperCase()}:** ${stats.total} jobs (Avg Confidence: ${stats.avgConfidence}%, Needs Review: ${stats.needsReview})`
  )
  .join('\n')}

## 🚨 Quality Alerts

${needsReview > total * 0.1 ? '⚠️ HIGH number of jobs need review' : '✅ Low number of jobs need review'}
${lowConfidence > total * 0.2 ? '⚠️ HIGH number of low confidence routings' : '✅ Low number of low confidence routings'}
${highConfidence/total > 0.8 ? '✅ High confidence routing achieved' : '⚠️ Need to improve confidence levels'}

## 💡 Recommendations

${this.generateRecommendations(entries, categoryStats)}
`;

    return report;
  }

  generateRecommendations(entries, categoryStats) {
    const recommendations = [];
    const totalJobs = entries.length;

    // Check overall confidence levels
    const avgConfidence = entries.reduce((sum, e) => sum + e.routing.confidence, 0) / totalJobs;

    if (avgConfidence < 80) {
      recommendations.push('- Improve pattern matching to increase overall confidence levels');
    }

    // Check for categories with high review rates
    Object.entries(categoryStats).forEach(([category, stats]) => {
      if (stats.needsReview / stats.total > 0.2) {
        recommendations.push(`- Investigate ${category} category routing - high review rate detected`);
      }
    });

    // Check routing sources
    const sourceDistribution = {};
    entries.forEach(entry => {
      sourceDistribution[entry.routing.source] = (sourceDistribution[entry.routing.source] || 0) + 1;
    });

    const descriptionBasedRoutings = sourceDistribution['description-context-aware'] || 0;
    if (descriptionBasedRoutings / totalJobs > 0.3) {
      recommendations.push('- Reduce reliance on description-based routing for better accuracy');
    }

    if (recommendations.length === 0) {
      recommendations.push('- ✅ System performing well - continue monitoring');
    }

    return recommendations.join('\n');
  }
}

// Run analyzer if executed directly
if (require.main === module) {
  const analyzer = new TrainingDataAnalyzer();
  const report = analyzer.analyzeRecentPerformance(7); // Last 7 days

  console.log(report);

  // Save report to file
  const reportPath = path.join(process.cwd(), '.github', 'analysis', 'training-performance-report.md');
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

module.exports = TrainingDataAnalyzer;
