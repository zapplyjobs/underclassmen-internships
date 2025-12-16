# Contributing to New Grad Positions

Thank you for your interest in contributing to our job board! We welcome community contributions to help keep our listings comprehensive and up-to-date.

## How to Contribute

### 🆕 Submit a Job Posting

Found a job that should be on our board? Use our easy form:

**[Submit a Job](../../issues/new?template=job_submission.yml)**

The form will ask for:
- Company name and job title
- Direct application link
- Location type and locations
- Experience level

### 💡 Request a Feature

Have an idea to improve the job board?

**[Request a Feature](../../issues/new?template=feature_request.yml)**

Tell us:
- What problem you're trying to solve
- Your proposed solution
- How important this is to your job search

## Guidelines

- **Verify Links:** Ensure all job links are direct application URLs, not third-party job boards
- **New Grad Focus:** Only suggest positions that are specifically for new graduates or entry-level candidates
- **No Spam:** Please don't submit multiple issues for the same company/position
- **Check Existing Issues:** Search existing issues before creating a new one

### 🔧 Report a Bug

Found a broken link, incorrect data, or other issue?

**[Report a Bug](../../issues/new?template=bug_report.yml)**

Common issues:
- Incorrect job data (wrong company, title, location)
- Broken or expired job links
- Website display problems

**For Pull Requests:**
If you'd like to fix the issue yourself:
1. Fork the repository
2. Make your changes
3. Submit a pull request referencing any related issues

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

**Never mention specific services or platforms:**
```bash
❌ "add [service name] integration"
❌ "fix [platform] API endpoint"
❌ "update [service] queries"
```

**Never mention data collection methods:**
```bash
❌ "add [company] data collection"
❌ "fix web automation timeout"
❌ "disable [source] for compliance"
```

**Never name companies in data source context:**
```bash
❌ "add [company] API integration"
❌ "fix [company] endpoint"
❌ "update [company] data collection"
```

#### 💡 How to Write Generic Commit Messages

**Use generic terms instead of specifics:**
- Instead of naming services → "external data source"
- Instead of naming platforms → "data collection endpoint"
- Instead of naming companies → "company data source"
- Focus on WHAT changed, not HOW it works

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

## Community

Join our community for real-time help and job search tips:

- **Discord**: [Join Server](https://discord.gg/yKWw28q7Yq)
- **Reddit**: [r/Zapply](https://reddit.com/r/Zapply)

## Questions?

For general questions, join our Discord or open a Discussion (when available).

---

*This repository is maintained by [Zapply](https://zapply.jobs) - helping new grads find their dream job.*
