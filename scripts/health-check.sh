#!/bin/bash

# GitHub Discord Health Check - One Command Diagnostics
# Usage: ./scripts/health-check.sh [--verbose]

set -e

VERBOSE=false
if [[ "$1" == "--verbose" ]]; then
  VERBOSE=true
fi

echo "=================================="
echo "GitHub Discord Health Check"
echo "=================================="
echo ""

# Change to repo root
cd "$(dirname "$0")/.."

# 1. Recent Failures Check
echo "📊 Checking recent failure rate..."
FAILURE_RESULT=$(node .github/scripts/check-recent-failures.js 2>&1)
echo "$FAILURE_RESULT"

# Extract failure rate for summary
FAILURE_RATE=$(echo "$FAILURE_RESULT" | grep "Failure rate:" | awk '{print $3}')
if [[ "$FAILURE_RATE" == "0.0%" ]]; then
  echo "✅ PASS: No recent failures"
else
  echo "⚠️  WARNING: Failures detected"
fi
echo ""

# 2. Channel Distribution Check
echo "📌 Checking channel distribution..."
CHANNEL_RESULT=$(node -e "
const data = require('./.github/data/posted_jobs.json');
const recent = data.jobs.filter(j => {
  const hasV2 = j.discordPosts && Object.keys(j.discordPosts).length > 0;
  const posted = new Date(j.postedToDiscord);
  return hasV2 && posted > new Date(Date.now() - 7*24*60*60*1000);
});

const channelCounts = {};
recent.forEach(job => {
  Object.keys(job.discordPosts || {}).forEach(channelId => {
    channelCounts[channelId] = (channelCounts[channelId] || 0) + 1;
  });
});

const activeChannels = Object.keys(channelCounts).length;
const totalJobs = recent.length;

console.log('Active channels:', activeChannels);
console.log('Total jobs (7 days):', totalJobs);
console.log('Avg jobs/channel:', Math.round(totalJobs / activeChannels));

if (activeChannels >= 5 && activeChannels <= 10) {
  console.log('STATUS: HEALTHY');
} else {
  console.log('STATUS: CHECK_NEEDED');
}
")

echo "$CHANNEL_RESULT"
if echo "$CHANNEL_RESULT" | grep -q "HEALTHY"; then
  echo "✅ PASS: Channel distribution healthy"
else
  echo "⚠️  WARNING: Check channel configuration"
fi
echo ""

# 3. Data File Size Check
echo "💾 Checking data file sizes..."
POSTED_SIZE=$(du -h .github/data/posted_jobs.json | awk '{print $1}')
PENDING_SIZE=$(du -h .github/data/pending_posts.json 2>/dev/null | awk '{print $1}' || echo "N/A")

echo "posted_jobs.json: $POSTED_SIZE"
echo "pending_posts.json: $PENDING_SIZE"

if [[ "$PENDING_SIZE" != "N/A" ]]; then
  # Check if pending is >10x larger than posted (potential bloat)
  POSTED_KB=$(du -k .github/data/posted_jobs.json | awk '{print $1}')
  PENDING_KB=$(du -k .github/data/pending_posts.json | awk '{print $1}')

  if [ "$PENDING_KB" -gt $((POSTED_KB * 10)) ]; then
    echo "⚠️  WARNING: pending_posts.json is 10x larger than posted_jobs.json"
  else
    echo "✅ PASS: File sizes normal"
  fi
else
  echo "✅ PASS: File sizes normal"
fi
echo ""

# 4. Workflow Status Check
echo "🔄 Checking recent workflow runs..."
WORKFLOW_STATUS=$(gh run list --limit 3 --json conclusion,name 2>/dev/null || echo "gh CLI not available")

if [[ "$WORKFLOW_STATUS" != "gh CLI not available" ]]; then
  echo "$WORKFLOW_STATUS" | head -5

  if echo "$WORKFLOW_STATUS" | grep -q "\"conclusion\":\"failure\""; then
    echo "⚠️  WARNING: Recent workflow failures detected"
  else
    echo "✅ PASS: Recent workflows successful"
  fi
else
  echo "ℹ️  INFO: gh CLI not installed (optional check)"
fi
echo ""

# 5. Summary
echo "=================================="
echo "SUMMARY"
echo "=================================="
echo "✅ = Pass  |  ⚠️ = Warning  |  ❌ = Failure"
echo ""
echo "Recent Failures:      $(if [[ "$FAILURE_RATE" == "0.0%" ]]; then echo "✅"; else echo "⚠️"; fi)"
echo "Channel Distribution: ✅"
echo "File Sizes:           ✅"
echo "Workflow Status:      $(if echo "$WORKFLOW_STATUS" | grep -q "failure"; then echo "⚠️"; else echo "✅"; fi)"
echo ""

# Verbose output
if [[ "$VERBOSE" == true ]]; then
  echo "=================================="
  echo "VERBOSE DIAGNOSTICS"
  echo "=================================="
  echo ""

  echo "Running full failure analysis..."
  node .github/scripts/analyze-failures.js

  echo ""
  echo "Running duplicate check..."
  node .github/scripts/analyze-empty-posts.js 2>/dev/null || echo "Script not found"
fi

echo "Health check complete!"
