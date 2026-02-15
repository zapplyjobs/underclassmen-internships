#!/usr/bin/env node

/**
 * Cron Syntax Validator for GitHub Actions Workflows
 *
 * Validates cron schedules in .github/workflows/*.yml files
 * Prevents Bug #2 class (invalid cron causing wrong schedules)
 *
 * Usage: node .github/scripts/cron-validator.js
 */

const fs = require('fs');
const path = require('path');

/**
 * Validate a cron schedule for GitHub Actions
 */
function validateCron(cron, file) {
  const errors = [];

  // Basic format check (5 parts separated by spaces)
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    return [`Invalid cron format: expected 5 parts, got ${parts.length}`];
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // GitHub Actions limitation: */n in first position doesn't work as expected
  // Should use specific values like 0, 15, 30, 45 instead
  if (minute.startsWith('*/')) {
    const step = parseInt(minute.substring(2));
    if (60 % step !== 0) {
      errors.push(`Minute '*/${step}' doesn't divide 60 evenly (GitHub Actions limitation)`);
    }
    // GitHub Actions supports */n but it may not work as expected
    // Recommend specific values
    if (step < 15) {
      errors.push(`Cron interval too frequent (${step} minutes). Minimum: 15 minutes for GitHub Actions.`);
    }
  }

  // Check for wildcard in first position (should be avoided)
  if (minute === '*') {
    errors.push(`Wildcard '*' in minute position (may cause issues). Use specific values like '0', '15', '30', '45'.`);
  }

  // Validate hour range (0-23)
  if (hour !== '*') {
    // Handle */n pattern for hours
    if (hour.startsWith('*/')) {
      const step = parseInt(hour.substring(2));
      if (isNaN(step) || step <= 0 || step > 23) {
        errors.push(`Hour step must be 1-23, got: ${hour}`);
      }
    } else {
      const hourNum = parseInt(hour);
      if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
        errors.push(`Hour must be 0-23, got: ${hour}`);
      }
    }
  }

  // Validate day of month (1-31)
  if (dayOfMonth !== '*') {
    const dayNum = parseInt(dayOfMonth);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      errors.push(`Day of month must be 1-31, got: ${dayOfMonth}`);
    }
  }

  // Validate month (1-12)
  if (month !== '*') {
    const monthNum = parseInt(month);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      errors.push(`Month must be 1-12, got: ${month}`);
    }
  }

  // Validate day of week (0-7, where 0 and 7 are Sunday)
  if (dayOfWeek !== '*') {
    const dowNum = parseInt(dayOfWeek);
    if (isNaN(dowNum) || dowNum < 0 || dowNum > 7) {
      errors.push(`Day of week must be 0-7, got: ${dayOfWeek}`);
    }
  }

  // Check minimum interval (15 minutes for GitHub Actions)
  const interval = getCronInterval(cron);
  if (interval > 0 && interval < 15) {
    errors.push(`Cron interval is ${interval} minutes. Minimum: 15 minutes for GitHub Actions.`);
  }

  return errors;
}

/**
 * Calculate cron interval in minutes (simplified)
 */
function getCronInterval(cron) {
  // Simplified check - just look at minute part
  const minute = cron.trim().split(/\s+/)[0];

  if (minute.startsWith('*/')) {
    return parseInt(minute.substring(2));
  }

  // Specific values - hard to determine exact interval
  // Return 0 to indicate "can't determine"
  return 0;
}

/**
 * Extract cron schedules from YAML file
 */
function extractCronSchedules(yamlContent) {
  const cronPatterns = [
    /cron:\s*['"]([^'"]+)['"]/g,
    /cron:\s*\n\s+['"]?([^'"*\n\s]+)['"]?$/gm
  ];

  const schedules = [];
  for (const pattern of cronPatterns) {
    let match;
    while ((match = pattern.exec(yamlContent)) !== null) {
      schedules.push(match[1]);
    }
  }

  return schedules;
}

/**
 * Main validation function
 */
function validateWorkflowCrons(workflowsDir) {
  const workflowFiles = fs.readdirSync(workflowsDir)
    .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

  let totalErrors = 0;
  const results = [];

  for (const file of workflowFiles) {
    const filePath = path.join(workflowsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    const schedules = extractCronSchedules(content);

    if (schedules.length === 0) {
      continue; // No cron schedules in this file
    }

    const fileErrors = [];
    for (const cron of schedules) {
      const errors = validateCron(cron, file);
      if (errors.length > 0) {
        fileErrors.push({ cron, errors });
        totalErrors += errors.length;
      }
    }

    if (fileErrors.length > 0) {
      results.push({ file, errors: fileErrors });
    }
  }

  // Report results
  if (totalErrors > 0) {
    console.error(`\n❌ Cron validation FAILED: ${totalErrors} errors found\n`);

    for (const { file, errors } of results) {
      console.error(`${file}:`);
      for (const { cron, errors: errList } of errors) {
        console.error(`  cron: '${cron}'`);
        for (const err of errList) {
          console.error(`    - ${err}`);
        }
      }
    }

    console.error(`\n⚠️  Recommendations:`);
    console.error(`   - For 15-minute intervals, use: '0,15,30,45 * * * *'`);
    console.error(`   - For hourly: '0 * * * *'`);
    console.error(`   - For daily: '0 0 * * *'`);
    console.error(`   - Avoid: '*/15 * * * *' (unreliable in GitHub Actions)`);

    return { valid: false, errorCount: totalErrors };
  }

  console.log(`✓ Cron validation passed: ${workflowFiles.length} workflow files checked`);
  return { valid: true, errorCount: 0 };
}

// Main execution
if (require.main === module) {
  const workflowsDir = path.join(__dirname, '../workflows');
  const result = validateWorkflowCrons(workflowsDir);

  process.exit(result.valid ? 0 : 1);
}

module.exports = { validateCron, validateWorkflowCrons };
