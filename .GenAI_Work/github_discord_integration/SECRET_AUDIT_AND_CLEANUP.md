# GitHub Secrets Audit & Cleanup Guide

**Date:** November 8, 2025
**Repository:** New-Grad-Positions (Main Repo)
**Purpose:** Identify and remove redundant secrets

---

## 🔍 Audit Results

### ✅ **ACTIVE SECRETS** (Keep - Currently Used)

| Secret Name | Used In | Purpose | Added |
|-------------|---------|---------|-------|
| `EXTERNAL_JOBS_SOURCE` | `update-jobs.yml:47` | External job aggregator URL | 2025-10-30 |
| `DISCORD_TOKEN` | `update-jobs.yml:63` | Discord bot authentication | 2025-07-27 |
| `DISCORD_CHANNEL_ID` | `update-jobs.yml:64` | Main Discord channel | 2025-07-27 |
| `DISCORD_CLIENT_ID` | `update-jobs.yml:65` | Discord client ID | - |
| `DISCORD_GUILD_ID` | `update-jobs.yml:66` | Discord server ID | - |
| `DISCORD_TECH_CHANNEL_ID` | `update-jobs.yml:68` | Tech jobs channel | 2025-10-04 |
| `DISCORD_SALES_CHANNEL_ID` | `update-jobs.yml:69` | Sales jobs channel | 2025-10-04 |
| `DISCORD_MARKETING_CHANNEL_ID` | `update-jobs.yml:70` | Marketing jobs channel | 2025-10-04 |
| `DISCORD_FINANCE_CHANNEL_ID` | `update-jobs.yml:71` | Finance jobs channel | 2025-10-04 |
| `DISCORD_HEALTHCARE_CHANNEL_ID` | `update-jobs.yml:72` | Healthcare jobs channel | 2025-10-04 |
| `DISCORD_PRODUCT_CHANNEL_ID` | `update-jobs.yml:73` | Product jobs channel | 2025-10-04 |
| `DISCORD_SUPPLY_CHANNEL_ID` | `update-jobs.yml:74` | Supply chain jobs channel | 2025-10-04 |
| `DISCORD_PM_CHANNEL_ID` | `update-jobs.yml:75` | Project mgmt jobs channel | 2025-10-04 |
| `DISCORD_HR_CHANNEL_ID` | `update-jobs.yml:76` | HR jobs channel | 2025-10-04 |
| `DISCORD_REMOTE_USA_CHANNEL_ID` | `update-jobs.yml:78` | Remote USA jobs channel | 2025-10-28 |
| `DISCORD_NY_CHANNEL_ID` | `update-jobs.yml:79` | New York jobs channel | 2025-10-28 |
| `DISCORD_AUSTIN_CHANNEL_ID` | `update-jobs.yml:80` | Austin jobs channel | 2025-10-28 |
| `DISCORD_CHICAGO_CHANNEL_ID` | `update-jobs.yml:81` | Chicago jobs channel | 2025-10-28 |
| `DISCORD_SEATTLE_CHANNEL_ID` | `update-jobs.yml:82` | Seattle jobs channel | 2025-10-28 |
| `DISCORD_REDMOND_CHANNEL_ID` | `update-jobs.yml:83` | Redmond jobs channel | 2025-10-28 |
| `DISCORD_MV_CHANNEL_ID` | `update-jobs.yml:84` | Mountain View jobs channel | 2025-10-28 |
| `DISCORD_SF_CHANNEL_ID` | `update-jobs.yml:85` | San Francisco jobs channel | 2025-10-28 |
| `DISCORD_SUNNYVALE_CHANNEL_ID` | `update-jobs.yml:86` | Sunnyvale jobs channel | 2025-10-28 |
| `DISCORD_SAN_BRUNO_CHANNEL_ID` | `update-jobs.yml:87` | San Bruno jobs channel | 2025-10-28 |

**Total Active:** 24 secrets

---

### ❌ **REDUNDANT SECRETS** (Delete - Not Used Anywhere)

| Secret Name | Reason | Added | Verification |
|-------------|--------|-------|--------------|
| `PRIMARY_DATA_SOURCE_URL` | **DUPLICATE** - Same as `EXTERNAL_JOBS_SOURCE` | 2025-11-02 | Not referenced in code |
| `FINANCE_JOBS` | Never used in any workflow or script | 2025-10-04 | grep found 0 matches |
| `HEALTHCARE_JOBS` | Never used in any workflow or script | 2025-10-04 | grep found 0 matches |
| `HUMAN_RESOURCES_JOBS` | Never used in any workflow or script | 2025-10-04 | grep found 0 matches |
| `MARKETING_JOBS` | Never used in any workflow or script | 2025-10-04 | grep found 0 matches |
| `PRODUCT_JOBS` | Never used in any workflow or script | 2025-10-04 | grep found 0 matches |
| `PROJECT_MANAGEMENT_JOBS` | Never used in any workflow or script | 2025-10-04 | grep found 0 matches |
| `SALES_JOBS` | Never used in any workflow or script | 2025-10-04 | grep found 0 matches |
| `SUPPLY_CHAIN_JOBS` | Never used in any workflow or script | 2025-10-04 | grep found 0 matches |

**Total Redundant:** 9 secrets

---

## 🔧 **How to Delete Secrets**

### Option 1: GitHub Web UI (Recommended for First Time)

1. Go to: https://github.com/zapplyjobs/New-Grad-Jobs/settings/secrets/actions
2. Find the secret in the list
3. Click **"Remove"** button
4. Confirm deletion

### Option 2: GitHub CLI (Faster for Multiple Deletions)

```bash
# Navigate to repo
cd New-Grad-Positions

# Delete single secret
gh secret remove PRIMARY_DATA_SOURCE_URL

# Delete all redundant secrets (one command per secret)
gh secret remove PRIMARY_DATA_SOURCE_URL
gh secret remove FINANCE_JOBS
gh secret remove HEALTHCARE_JOBS
gh secret remove HUMAN_RESOURCES_JOBS
gh secret remove MARKETING_JOBS
gh secret remove PRODUCT_JOBS
gh secret remove PROJECT_MANAGEMENT_JOBS
gh secret remove SALES_JOBS
gh secret remove SUPPLY_CHAIN_JOBS

# Verify deletion
gh secret list
```

### Option 3: Batch Delete Script

```bash
#!/bin/bash
# Save as: cleanup-secrets.sh

SECRETS_TO_DELETE=(
  "PRIMARY_DATA_SOURCE_URL"
  "FINANCE_JOBS"
  "HEALTHCARE_JOBS"
  "HUMAN_RESOURCES_JOBS"
  "MARKETING_JOBS"
  "PRODUCT_JOBS"
  "PROJECT_MANAGEMENT_JOBS"
  "SALES_JOBS"
  "SUPPLY_CHAIN_JOBS"
)

cd New-Grad-Positions

for secret in "${SECRETS_TO_DELETE[@]}"; do
  echo "Deleting $secret..."
  gh secret remove "$secret"
done

echo "✅ Cleanup complete! Remaining secrets:"
gh secret list
```

---

## 📊 **Impact Analysis**

### Before Cleanup
- **Total secrets:** 33
- **Active:** 24
- **Redundant:** 9
- **Waste:** 27% unused

### After Cleanup
- **Total secrets:** 24
- **Active:** 24
- **Redundant:** 0
- **Efficiency:** 100%

---

## 🚨 **Important Notes**

### Why `PRIMARY_DATA_SOURCE_URL` is Redundant

**History:**
1. **Oct 30, 2025:** `EXTERNAL_JOBS_SOURCE` created
2. **Nov 2, 2025:** `PRIMARY_DATA_SOURCE_URL` created (duplicate)
3. **Nov 4, 2025:** Migration used `PRIMARY_DATA_SOURCE_URL` in code
4. **Nov 8, 2025:** Workflow **NEVER** passed env var (neither worked!)

**Current State:**
- Code looks for: `PRIMARY_DATA_SOURCE_URL`
- Secret exists: `EXTERNAL_JOBS_SOURCE` (older, correct name)
- **Fix:** Workflow now passes `EXTERNAL_JOBS_SOURCE` as `PRIMARY_DATA_SOURCE_URL`
- **Result:** `PRIMARY_DATA_SOURCE_URL` secret is now redundant

### Why Job Category Secrets Are Unused

These were likely created for a planned feature that was never implemented:
- `FINANCE_JOBS`, `HEALTHCARE_JOBS`, etc.
- No code references them
- Discord channels use different naming (`DISCORD_FINANCE_CHANNEL_ID`)
- Safe to delete

---

## ✅ **Recommended Action**

**Run this command to delete all 9 redundant secrets:**

```bash
cd New-Grad-Positions && \
gh secret remove PRIMARY_DATA_SOURCE_URL && \
gh secret remove FINANCE_JOBS && \
gh secret remove HEALTHCARE_JOBS && \
gh secret remove HUMAN_RESOURCES_JOBS && \
gh secret remove MARKETING_JOBS && \
gh secret remove PRODUCT_JOBS && \
gh secret remove PROJECT_MANAGEMENT_JOBS && \
gh secret remove SALES_JOBS && \
gh secret remove SUPPLY_CHAIN_JOBS && \
echo "✅ Deleted 9 redundant secrets"
```

**Verification:**
```bash
gh secret list | wc -l  # Should show 24 (down from 33)
```

---

## 🔄 **Apply to Other Repos**

Run the same audit on all 5 other repos:
1. New-Grad-Internships
2. New-Grad-Software-Engineering-Jobs
3. New-Grad-Data-Science-Positions
4. New-Grad-Hardware-Engineering-Positions
5. New-Grad-Nursing-Jobs

**Quick audit command:**
```bash
cd [REPO_NAME]
gh secret list > secrets.txt
grep -r "FINANCE_JOBS\|HEALTHCARE_JOBS\|MARKETING_JOBS" .github/
```

If no matches found → delete those secrets

---

**Last Updated:** November 8, 2025
**Next Review:** When adding new features that require secrets
