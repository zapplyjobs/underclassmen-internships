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

## 🚨 CRITICAL: Duplicate Posts Issue (Nov 27, 2025)

**Status:** ⏸️ Workflow DISABLED - Investigating

**Problem:** Still seeing duplicate job posts in tech-jobs and remote-usa channels after implementing:
1. Title+company deduplication (Nov 26, commit b93928a0)
2. Team name suffix stripping (Nov 27, commit 4ec6c5c1)

**Examples of duplicates still appearing:**
- Jobs with same title appearing multiple times
- Possible issues: Same job different locations, different team variations not caught by regex

**Actions taken:**
1. ✅ Disabled workflow schedule (commented out cron in `.github/workflows/update-jobs.yml`)
2. ✅ Workflow still manually triggerable via `workflow_dispatch` for testing

**Next steps:**
1. [ ] Analyze actual duplicate examples from Discord (get specific job titles)
2. [ ] Review posted_jobs.json to identify duplicate patterns
3. [ ] Consider additional normalization rules:
   - Strip location suffixes (e.g., "- Remote", "- San Francisco")
   - Strip employment type suffixes (e.g., "- Full Time", "- Contract")
   - Strip experience level prefixes (e.g., "Senior", "Junior")
4. [ ] Consider hardcoded filter for specific problematic employers
5. [ ] Test fix with manual workflow trigger before re-enabling schedule

**Temporary mitigation:** Workflow will not run automatically. Manual trigger only.
