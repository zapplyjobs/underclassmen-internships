# Branch Protection Setup TODO

## Task: Enable Branch Protection on All 6 Job Board Repositories

**Status:** Pending manual setup (API access denied)

**Repositories to configure:**
1. New-Grad-Jobs-2026
2. New-Grad-Internships-2026
3. New-Grad-Nursing-Jobs-2026
4. New-Grad-Software-Engineering-Jobs-2026
5. New-Grad-Data-Science-Jobs-2026
6. New-Grad-Hardware-Engineering-Jobs-2026

**Quick access links:**
1. https://github.com/zapplyjobs/New-Grad-Jobs-2026/settings/branch_protection_rules/new
2. https://github.com/zapplyjobs/New-Grad-Internships-2026/settings/branch_protection_rules/new
3. https://github.com/zapplyjobs/New-Grad-Nursing-Jobs-2026/settings/branch_protection_rules/new
4. https://github.com/zapplyjobs/New-Grad-Software-Engineering-Jobs-2026/settings/branch_protection_rules/new
5. https://github.com/zapplyjobs/New-Grad-Data-Science-Jobs-2026/settings/branch_protection_rules/new
6. https://github.com/zapplyjobs/New-Grad-Hardware-Engineering-Jobs-2026/settings/branch_protection_rules/new

**Required settings:**
- ✅ Branch name pattern: `main`
- ✅ Require pull request before merging (1 approval)
- ⚠️ UNCHECK "Do not allow bypassing the above settings" (so admins can push directly)
- ✅ Lock branch (prevent force pushes and deletions)

**Goal:** Collaborators must use PRs to change main branch, but repository admins (owner + Mahd-Amjad when added) can push directly.

**Estimated time:** ~12 minutes (2 min per repo)

---

## ✅ RESOLVED: Duplicate Posts Issue (Nov 27, 2025)

**Status:** ✅ FIXED - Workflow re-enabled

**Problem:** Duplicate job posts appearing in tech-jobs and remote-usa channels
- Example: 9x "Agentic AI Teacher - Agi Ds" @ Amazon, Boston (same exact job)
- Example: 2x "Software Engineer 1" @ Intuit, Mountain View

**Root Cause:** Deduplication only checked `title + company`, missing location variations

**Solution Implemented:**
1. ✅ Added location to deduplication key: `title + company + location` (commit 189f339a)
2. ✅ Team name suffix stripping still active (commit 4ec6c5c1)
3. ✅ Created test script to verify dedup logic (analyze-duplicates.js)
4. ✅ Re-enabled workflow schedule (commit 4e3a97ba)

**Impact (verified with test data):**
- Before: 15 jobs would be posted
- After: 5 unique jobs posted, 10 duplicates skipped
- **67% duplicate reduction**

**Duplicates now caught:**
- ✅ Same title + company + location (e.g., 9 Amazon jobs in Boston)
- ✅ Team name variations (e.g., "Job Title - Team Name" vs "Job Title")

**Workflow Status:** Running automatically every 15 minutes (schedule re-enabled)
