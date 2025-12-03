# Troubleshooting Guide - Job Posting System

**Last Updated:** December 3, 2025

This document provides diagnostic tools and procedures for troubleshooting issues with the job posting system.

---

## 🚀 Quick Diagnostic

**Run this first when investigating any issue:**

```bash
node .github/scripts/diagnostic-health-check.js
```

This will check:
- ✅ Data file integrity
- ✅ Database capacity and duplicates
- ✅ Job filtering logic
- ✅ Discord bot configuration
- ✅ Recent posting activity

---

## 📊 Available Diagnostic Tools

### 1. Health Check (Primary Diagnostic)
**File:** `.github/scripts/diagnostic-health-check.js`

**Purpose:** Comprehensive system health check

**Usage:**
```bash
node .github/scripts/diagnostic-health-check.js
```

**Output:**
- Data files status
- README job count
- Posted jobs database analysis
- New jobs analysis (with duplicate detection)
- Discord bot configuration status
- Recent bot execution results
- Actionable recommendations

---

### 2. Job Statistics Analyzer
**File:** `.github/scripts/analyze-job-statistics.js`

**Purpose:** Analyze posting patterns and trends

**Usage:**
```bash
node .github/scripts/analyze-job-statistics.js
```

**Output:**
- Recent posting activity (git commits)
- README change patterns
- Company distribution in database
- Duplicate detection statistics
- Location distribution
- Discord posting success rate

---

### 3. Database Cleanup Utility
**File:** `.github/scripts/cleanup-posted-jobs.js`

**Purpose:** Free space in posted_jobs database (when at capacity)

**Usage:**
```bash
# Preview what will be removed (safe, no changes)
node .github/scripts/cleanup-posted-jobs.js --dry-run

# Execute cleanup (requires --force)
node .github/scripts/cleanup-posted-jobs.js --force
```

**⚠️ Warning:** This removes job IDs from the database. Only use when database is at capacity (5000/5000).

**Safety features:**
- Automatic backup creation
- Dry-run mode for preview
- Requires --force flag to execute
- Keeps IDs for all jobs currently in README

---

## 🔍 Common Issues & Solutions

### Issue #1: No Jobs Being Posted to Discord

**Symptoms:**
- Workflows run successfully
- Audit logs show "Posted: 0"
- Jobs exist in README

**Diagnostic Steps:**

1. **Run health check:**
   ```bash
   node .github/scripts/diagnostic-health-check.js
   ```

2. **Check the "NEW JOBS ANALYSIS" section:**
   - If "Primary in DB: ✅ YES" → Job already posted (expected behavior)
   - If "Legacy in DB: ✅ YES" → Duplicate detected via legacy ID (expected behavior)
   - If both show "❌ NO" but still not posting → Bot configuration issue

3. **Possible causes:**

   **A. All jobs are duplicates (MOST COMMON)**
   - Status: ✅ **SYSTEM WORKING CORRECTLY**
   - Reason: No genuinely new jobs from sources
   - Solution: This is normal. Wait for new jobs to be scraped.

   **B. Database at capacity (5000/5000)**
   - Status: ⚠️ **REQUIRES ACTION**
   - Reason: Database full, can't add new IDs
   - Solution: Run cleanup script
     ```bash
     node .github/scripts/cleanup-posted-jobs.js --force
     ```

   **C. Discord bot misconfiguration**
   - Status: ❌ **REQUIRES FIX**
   - Check: Health check shows "❌ DISCORD_TOKEN: Not set"
   - Solution: Verify GitHub Secrets are set correctly

---

### Issue #2: Database at Maximum Capacity

**Symptoms:**
- Health check shows "Database capacity: 100.0%"
- Warning: "Database at maximum capacity!"

**Impact:**
- New jobs may be rejected even if they're genuinely new
- Old job IDs aren't being removed

**Solution:**

**Option A: Manual Cleanup (Recommended)**
```bash
# 1. Preview cleanup
node .github/scripts/cleanup-posted-jobs.js --dry-run

# 2. Review the output carefully

# 3. Execute cleanup
node .github/scripts/cleanup-posted-jobs.js --force

# 4. Commit changes
git add .github/data/posted_jobs.json
git commit -m "chore: cleanup posted_jobs database (freed capacity)"
git push
```

**Option B: Increase Capacity (Code Change)**

Edit `.github/scripts/enhanced-discord-bot.js`:
```javascript
// Line 226 - Change from 5000 to higher limit
const maxEntries = 10000; // Keep last 10000 posted jobs
```

**⚠️ Trade-off:** Larger database = more memory usage, longer startup time

---

### Issue #3: Jobs in README But Not Posting

**Symptoms:**
- New jobs visible in README
- Discord channels empty
- Health check shows jobs queued

**Diagnostic Steps:**

1. **Check new_jobs.json:**
   ```bash
   cat .github/data/new_jobs.json
   ```

   **Expected:** JSON array with job objects
   **Problem if:** Empty array `[]` or file doesn't exist

2. **Check audit log:**
   ```bash
   cat .github/audit/latest.md
   ```

   Look for:
   - "Jobs Skipped: X" → Duplicate detection working
   - "Jobs Failed: X" → Bot errors (check logs)
   - "Database Saved: NO" → Bot didn't mark jobs as posted

3. **Download full bot logs:**
   ```bash
   # Get latest run ID
   gh run list --limit 1 --json databaseId --jq '.[0].databaseId'

   # Download logs artifact
   gh run download <run-id> --name job-processing-logs-<run-number>
   ```

---

### Issue #4: Duplicate Detection Too Aggressive

**Symptoms:**
- Jobs appear new but are being skipped
- Audit shows high "Skipped" count
- Genuinely different jobs being filtered

**Diagnostic:**

Run health check and look at "NEW JOBS ANALYSIS":
```
Primary ID:  <url-based-id>
Legacy ID:   <company-title-city>
Primary in DB:   ❌ NO
Legacy in DB:    ✅ YES (DUPLICATE - will skip)
```

**Root Cause:** Same job posted with two different ID formats

**Solution:** This is **expected behavior**. The legacy ID check prevents re-posting jobs that were previously posted with the old ID format.

**To verify it's genuinely a duplicate:**
```bash
node -e "
const posted = require('./.github/data/posted_jobs.json');
const legacyId = '<legacy-id-from-health-check>';
console.log('Legacy ID in database:', posted.includes(legacyId));
"
```

---

### Issue #5: Duplicate Job Postings to Same Channel

**Symptoms:**
- Same job posted multiple times to the SAME channel
- Example: "Data Scientist @ Lyft" posted 2-3 times to #tech channel
- Database shows job ID is present, but job still reposts
- Occurs after database reaches 5000 capacity

**Root Cause: Database Capacity Eviction (Identified Dec 3, 2025)**

When `posted_jobs.json` reaches 5000 entries:
1. New jobs added → Database exceeds 5000
2. **Oldest jobs evicted** to maintain 5000 limit
3. Evicted jobs reappear in source data
4. Bot treats them as "new" → Posts again → Duplicate

**Timeline:**
- Nov 10, 2025: Database had 4,984 jobs (below limit)
- Nov 10-20, 2025: Database hit 5000 capacity
- Nov 20-present: Database at capacity, churning jobs daily
- Dec 2, 2025: Duplicate postings observed (Lyft, Adobe jobs)

**Solution: Archive System (Deployed Dec 3, 2025)**

**Commit:** `f9eb1503` - Archive system with job reopening detection

**How it works:**
1. **Automatic archiving:** When database reaches 4500 jobs, archives oldest 1000
2. **Monthly archives:** `.github/data/archive/posted_jobs_YYYY_MM.json`
3. **2-month lookback:** Checks recent archives before posting
4. **Job reopening detection:** Allows reposting if >2 months old + recent posting date

**Expected behavior after deployment:**
```
First run:
📦 FIRST-TIME ARCHIVE: Bootstrapping with 1500 jobs
✅ Archive verified: 1500 total jobs in 2025-12
💾 Active database now has 3501 jobs

Subsequent runs:
- Database grows to 4500 → Archives 1000 → Drops to 3500
- Checks archives before posting (2-month lookback)
- Job from 1 month ago: ✅ Skipped (found in archive)
- Job from 3 months ago + recent date: ♻️ Reposted (job reopening)
```

**Monitoring:**

Check workflow logs for these indicators:

✅ **Success indicators:**
```
📚 Loaded archive: 2025-12 (1500 jobs)
💾 Active database now has 3501 jobs
📦 CAPACITY REACHED: Archiving oldest 1000 jobs
```

♻️ **Job reopening (expected):**
```
♻️ Job reopening detected: <job-id>
   Archived: 3 months ago, Source date: 5 days ago
```

❌ **Issues to watch for:**
```
❌ ERROR during archiving: <error>
⚠️ Corrupted archive 2025-12, ignoring: <error>
⚠️ Emergency trim to 5000 jobs
```

**Verification:**

1. **Check archive directory created:**
   ```bash
   ls -la .github/data/archive/
   # Expected: posted_jobs_2025_12.json (after first run)
   ```

2. **Check database size stays in range:**
   ```bash
   echo "Database size: $(node -p 'require(\"./.github/data/posted_jobs.json\").length')"
   # Expected: 3500-4500 (not 5000)
   ```

3. **Check for duplicate postings:**
   - Monitor Discord channels for next 24-48 hours
   - Should NOT see same job posted multiple times to same channel

**Testing locally:**

Set low threshold to test archiving:
```bash
ARCHIVE_THRESHOLD=10 node .github/scripts/enhanced-discord-bot.js
# Archives when >10 jobs (instead of 4500)
```

**Rollback procedure (if issues):**

If archive system causes problems:
```bash
git revert f9eb1503
git push origin main
```

This will restore the old behavior (eviction at 5000 limit).

**Related files:**
- Implementation: `.github/scripts/enhanced-discord-bot.js`
- Archive directory: `.github/data/archive/`
- Commit: `f9eb1503`

---

### Issue #6: Jobs Stuck in Pending Queue - Enrichment Pipeline Failure

**Symptoms:**
- Hundreds of jobs stuck in pending status for many hours
- new_jobs.json frozen (not updating)
- Workflow shows success but no Discord posts
- Enrichment step fails silently

**Example:**
```
Queue items: 863
Status breakdown:
  "enriched": 50 (stale batch from 14 hours ago)
  "pending": 813 (stuck waiting for enrichment)

Last enriched: 2025-12-03T07:36:00.079Z (14 hours ago)
new_jobs.json last modified: 5+ hours ago
```

**Root Cause: Missing Jobboard Dependencies (Identified Dec 3, 2025)**

**The Issue:**
1. Job description enrichment requires puppeteer (headless browser)
2. Workflow was not installing jobboard dependencies
3. Description fetcher failed silently (puppeteer binaries missing)
4. Logs redirected to file, errors invisible in workflow output
5. Queue accumulated pending jobs indefinitely

**Timeline:**
- Nov 10-20, 2025: Committed 3,285 node_modules files to git (wrong fix attempt)
- Platform-specific binaries caused additional silent failures
- Dec 3 07:36 UTC: Last successful enrichment
- Dec 3 22:00 UTC: Issue discovered (813 jobs stuck for 14+ hours)

**Solution: Dependencies + Visible Logs (Deployed Dec 3, 2025)**

**Commit:** `8225c829` - Fix job posting pipeline issues

**How it works:**
1. **Install jobboard dependencies in workflow:**
   ```yaml
   - name: Install jobboard dependencies
     run: |
       cd jobboard
       npm install --production --no-audit --no-fund
       cd ..
   ```

2. **Make logs visible with tee:**
   ```yaml
   - name: Update job listings
     run: node .github/scripts/job-fetcher/index.js 2>&1 | tee .github/logs/job-fetcher.log
   ```

3. **Always display logs:**
   ```yaml
   - name: Display job-fetcher logs (always run)
     if: always()
     run: |
       echo "📋 Job Fetcher Output (last 100 lines):"
       tail -100 .github/logs/job-fetcher.log || echo "Log file not found"
   ```

4. **Remove committed node_modules files:**
   ```bash
   git rm -r --cached node_modules/
   # Removed 3,285 files from git tracking
   ```

**Expected behavior after deployment:**
```
First run after fix:
📝 Fetching job descriptions for 17 jobs...
✅ Saved pending queue: 17 total (0 pending, 17 enriched, 0 posted)
🎉 Posting complete! Successfully posted: 12, Failed: 0
```

**Verification:**
```bash
# Check workflow logs are visible
gh run view <run-id> --log | grep "📝 Fetching job descriptions"

# Check jobboard dependencies installed
gh run view <run-id> --log | grep "Install jobboard dependencies"

# Expected output:
# added 1460 packages in 31s
```

**Prevention:**
- Never commit node_modules to git (add to .gitignore)
- Always install dependencies in workflow, not pre-commit
- Use visible logging (tee) instead of silent redirection (>)
- Monitor pending queue size daily

**Related Issue:**
- Issue #5: Database capacity duplicates (different root cause)
- Both issues caused no Discord posts but for different reasons

**Related files:**
- Workflow: `.github/workflows/update-jobs.yml`
- Jobboard dependencies: `jobboard/package.json`
- Commit: `8225c829` (New-Grad-Jobs), `4cd4c230` (Internships)

---

## 🛠️ Workflow Debugging

### Check Workflow Status
```bash
# List recent runs
gh run list --limit 10

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log

# Download artifacts (includes full bot logs)
gh run download <run-id>
```

### Check Recent Commits
```bash
# Job updates in last 24 hours
git log --oneline --since="1 day ago" --grep="Update jobs"

# README changes
git diff HEAD~10 HEAD -- README.md
```

### Check Data Files
```bash
# Count jobs in each file
echo "new_jobs: $(node -p 'require(\"./.github/data/new_jobs.json\").length')"
echo "posted_jobs: $(node -p 'require(\"./.github/data/posted_jobs.json\").length')"
echo "seen_jobs: $(node -p 'require(\"./.github/data/seen_jobs.json\").length')"
```

---

## 📈 Monitoring Best Practices

### Daily Health Check
```bash
# Run this daily to catch issues early
node .github/scripts/diagnostic-health-check.js

# Look for:
# - Database capacity > 90%
# - Recent posting activity = 0 for >24 hours
# - Failed jobs > 0
```

### Weekly Statistics Review
```bash
# Run this weekly to understand trends
node .github/scripts/analyze-job-statistics.js

# Look for:
# - Declining job counts (source issues)
# - Increasing filter rate (duplicate issues)
# - Company distribution changes
```

### Alert Conditions

**🚨 Critical (Fix Immediately):**
- Database capacity = 100%
- Bot failing (check workflow status)
- No posts for >48 hours with jobs in README

**⚠️ Warning (Investigate Soon):**
- Database capacity > 90%
- Filter rate > 50%
- No posts for >24 hours

**ℹ️ Info (Normal):**
- No posts for <24 hours (may be no new jobs)
- Filter rate 30-50% (normal duplicate detection)
- Database capacity < 90%

---

## 🔧 Manual Testing

### Test Bot Locally (Without Posting)

1. **Create test environment:**
   ```bash
   cp .github/data/new_jobs.json .github/data/new_jobs.test.json
   ```

2. **Modify bot to use test file:**
   Edit `.github/scripts/enhanced-discord-bot.js` temporarily:
   ```javascript
   const newJobsPath = path.join(dataDir, 'new_jobs.test.json');
   ```

3. **Run bot:**
   ```bash
   # Set required env vars
   export DISCORD_TOKEN="<your-token>"
   export DISCORD_TECH_CHANNEL_ID="<channel-id>"

   # Run bot
   node .github/scripts/enhanced-discord-bot.js
   ```

4. **Check output for errors**

**⚠️ Remember:** Revert changes before committing!

---

## 📞 Getting Help

If you've followed this guide and still have issues:

1. **Gather diagnostic output:**
   ```bash
   node .github/scripts/diagnostic-health-check.js > diagnostic.txt
   node .github/scripts/analyze-job-statistics.js > statistics.txt
   ```

2. **Check recent workflow runs:**
   ```bash
   gh run list --limit 5 > recent-runs.txt
   ```

3. **Include in your issue:**
   - Diagnostic output
   - Statistics output
   - Recent workflow status
   - Description of expected vs actual behavior

---

## 🔄 Maintenance Checklist

### Monthly Tasks
- [ ] Run health check
- [ ] Review database capacity
- [ ] Check for duplicate entries
- [ ] Verify bot configuration
- [ ] Review audit logs for patterns

### Quarterly Tasks
- [ ] Run statistics analyzer
- [ ] Review company distribution
- [ ] Analyze posting trends
- [ ] Update documentation if needed
- [ ] Clean old backup files

### As-Needed Tasks
- [ ] Database cleanup (when capacity > 90%)
- [ ] Bot configuration updates
- [ ] Secret rotation
- [ ] Workflow optimization

---

## 📚 Related Documentation

- **Workflow Configuration:** `.github/workflows/update-jobs.yml`
- **Bot Logic:** `.github/scripts/enhanced-discord-bot.js`
- **Router Logic:** `.github/scripts/enhanced-channel-router.js`
- **Job Fetcher:** `.github/scripts/job-fetcher/index.js`

---

**Questions?** Open an issue with diagnostic output attached.
