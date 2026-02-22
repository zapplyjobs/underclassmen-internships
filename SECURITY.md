# Security Policy

## Supported Versions

This project follows a **rolling release** model — only the latest commit on `main` is actively maintained.

| Version | Supported |
|---------|-----------|
| `main` branch (latest) | ✅ |
| Previous commits | ❌ |

---

## Reporting a Vulnerability

### ⚠️ DO NOT create public issues for security vulnerabilities

Public disclosure before a fix is available puts all users at risk.

### ✅ Report privately

**Option 1: GitHub Security Advisories (preferred)**
1. Go to the [Security tab](https://github.com/zapplyjobs/New-Grad-Jobs-2026/security/advisories)
2. Click "Report a vulnerability"
3. Fill out the form — only repository maintainers will see it

**Option 2: Email**
- Send to: `team@zapply.jobs`
- Subject: `[SECURITY] New-Grad-Jobs-2026: [Brief Description]`

---

## What to Include

- **Vulnerability type** (e.g., secret exposure, workflow injection, dependency CVE)
- **Affected component** (e.g., GitHub Actions workflow, job fetcher script)
- **Attack vector** — how it can be exploited
- **Impact** — what an attacker can achieve
- **Reproduction steps**
- **Proof of concept** (code snippet, screenshot, or curl command)

---

## Response Timeline

| Timeframe | Action |
|-----------|--------|
| Within 24 hours | Acknowledgment |
| Within 72 hours | Initial assessment |
| Within 7 days | Fix for critical/high severity |
| Within 14 days | Fix deployed |
| Within 30 days | Coordinated public disclosure |

---

## Severity Classification (CVSS 3.1)

| Severity | CVSS | Examples |
|----------|------|---------|
| Critical | 9.0–10.0 | RCE on runner, secret exfiltration |
| High | 7.0–8.9 | Workflow injection, privilege escalation |
| Medium | 4.0–6.9 | Dependency CVE with practical exploit |
| Low | 0.1–3.9 | Information disclosure |

---

## Scope

### ✅ In scope

- GitHub Actions workflows (`.github/workflows/`)
- Job fetcher scripts (`.github/scripts/job-fetcher/`)
- Shared aggregator submodule (`.github/scripts/shared/`)
- Secret management (API keys, tokens, Discord webhooks)
- Dependency vulnerabilities (npm packages with practical exploit)

### ❌ Out of scope

- Inaccurate or outdated job listings (data quality, not security)
- Vulnerabilities in Discord, GitHub, or external APIs (report to those providers)
- GitHub Actions logs being public (expected for public repos)
- Missing security headers on GitHub Pages (controlled by GitHub)
- Dependabot alerts on dev-only dependencies with no practical exploit

---

## What We Don't Collect

- No user accounts or passwords
- No personal data or PII
- No cookies or session data
- No analytics tracking

All data is public job postings from external sources.

---

## Disclosure Policy

1. Reporter contacts us privately
2. We acknowledge within 24 hours
3. We develop and test a fix
4. We deploy to production
5. We coordinate public disclosure with reporter (~30 days post-fix)
6. We credit the reporter (if they consent)

---

**Last Updated:** 2026-02-22
**Policy Version:** 2.0
