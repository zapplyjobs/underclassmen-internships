# Contributing to New Grad Positions

Thank you for your interest in contributing to our job board! We welcome community contributions to help keep our listings comprehensive and up-to-date.

## How to Contribute

### 🆕 Adding a New Job

If you've found a new grad position that isn't listed in our README, please create an issue with the following information:

**Issue Title:** `[NEW JOB] Company Name - Position Title`

**Required Information:**
- Company name
- Job title
- Location (city/state or "Remote")
- Direct application link
- Experience level (Entry-level, New Grad, etc.)
- Job category (Software Engineer, Data Scientist, etc.)

**Issue Template:**
```
**Company:** [Company Name]
**Position:** [Job Title]
**Location:** [City, State or Remote]
**Link:** [Direct application URL]
**Experience Level:** [Entry-level/New Grad/etc.]
**Category:** [Software Engineer/Data Scientist/etc.]

**Additional Notes:** [Any relevant details about the role]
```

### 🏢 Adding a New Company

Want us to track a company that's not in our scraping list? Create an issue to suggest it!

**Issue Title:** `[NEW COMPANY] Company Name`

**Required Information:**
- Company name
- Company website/careers page
- Why this company should be tracked (e.g., known for hiring new grads, growing startup, etc.)
- Any specific job categories they frequently post

**Issue Template:**
```
**Company:** [Company Name]
**Careers Page:** [URL to careers page]
**Company Type:** [FAANG/Startup/Mid-size/etc.]
**Primary Focus:** [Tech stack/industry focus]
**Hiring Volume:** [High/Medium/Low for new grad positions]

**Why add this company?**
[Brief explanation of why this company should be tracked]
```

## Guidelines

- **Verify Links:** Ensure all job links are direct application URLs, not third-party job boards
- **New Grad Focus:** Only suggest positions that are specifically for new graduates or entry-level candidates
- **No Spam:** Please don't submit multiple issues for the same company/position
- **Check Existing Issues:** Search existing issues before creating a new one

### 🔧 Reporting Broken Links or Issues

Found a broken link, outdated job posting, or other issue in our README? Help us fix it!

**Issue Title:** `[BUG] Brief description of the issue`

**Issue Template:**
```
**Issue Type:** [Broken Link/Outdated Job/Formatting Issue/etc.]
**Location:** [Section of README where issue is found]
**Description:** [What's wrong?]
**Expected:** [What should it be?]
**Evidence:** [Screenshot or additional context if helpful]
```

**For Pull Requests:**
If you'd like to fix the issue yourself:
1. Fork the repository
2. Make your changes to the README.md or other relevant files
3. Submit a pull request with a clear description of what you fixed
4. Reference any related issues in your PR description

### 📝 Commit Message Guidelines

**IMPORTANT:** This repository has automated commit message validation to maintain security and professionalism.

#### ✅ Good Commit Messages (Generic & Professional)

Use **vague, generic descriptions** that focus on WHAT changed, not HOW it works:

```bash
✅ "refactor: improve data collection reliability"
✅ "fix: optimize job fetching process"
✅ "feat: add new data source integration"
✅ "chore: update dependencies"
✅ "fix: resolve timeout issues"
✅ "docs: update README with new features"
```

#### ❌ Blocked Commit Messages (Security Violations)

The following will be **automatically rejected** by our commit hook:

**Never mention specific services:**
```bash
❌ "add SimplifyJobs integration"
❌ "fix Greenhouse API endpoint"
❌ "update JSearch queries"
```

**Never mention data collection methods:**
```bash
❌ "add Amazon scraper"
❌ "fix web scraping timeout"
❌ "disable Google scraper for compliance"
```

**Never name companies in data source context:**
```bash
❌ "add Microsoft API integration"
❌ "fix Netflix endpoint"
❌ "update Stripe data collection"
```

#### 💡 Translation Guide

| ❌ Blocked Message | ✅ Acceptable Alternative |
|-------------------|--------------------------|
| "add SimplifyJobs API" | "add external data aggregation service" |
| "fix Greenhouse scraper" | "fix data collection endpoint" |
| "add Amazon scraper" | "add company data source" |
| "disable Google API" | "disable data source" |
| "update career page scraping" | "update data collection process" |

#### 🔒 Why These Rules?

- **Professional appearance:** Generic messages look more polished
- **Security:** Avoid exposing internal implementation details
- **Maintainability:** Focus on business value, not technical specifics

**Your commit will be automatically blocked if it violates these guidelines.**

## What Happens Next?

1. **Job Submissions:** We'll review and add valid jobs to our next update cycle
2. **Company Suggestions:** We'll evaluate the company and potentially add them to our tracking list
3. **Bug Reports:** We'll investigate and fix issues in our next maintenance cycle
4. **Updates:** Our automated system runs regularly to fetch new positions from tracked companies

## Questions?

If you have questions about contributing, feel free to open a general issue or reach out to the Zapply team.

---

*This repository is maintained by [Zapply](https://zapply.jobs) - helping new grads find their dream job.*
