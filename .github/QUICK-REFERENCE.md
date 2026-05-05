# Quick Reference - Job Posting System

**For:** Claude and Developers
**Last Updated:** 2026-01-23

## 🚀 Quick Actions

### Debug Job Posting Issues

```bash
# Did a specific job get posted?
node .github/scripts/query-metrics.js --job=<job-id>

# What failed recently?
node .github/scripts/query-metrics.js --failures --last-24h

# Why aren't jobs posting?
node .github/scripts/query-metrics.js --filtered

# Check channel activity
node .github/scripts/query-metrics.js --channels
```

### View Latest Metrics

```bash
# Summary view
node .github/scripts/query-metrics.js --summary

# Or read directly
cat .github/data/metrics/latest.json
```

### Multi-Channel Analysis

```bash
# Which jobs went to multiple channels?
node .github/scripts/query-metrics.js --multi-channel

# Check specific channel
node .github/scripts/query-metrics.js --channel=tech-jobs
```

## 📁 Key Files

| File | Purpose | Location |
|------|---------|----------|
| **latest.json** | Current metrics (7-day window) | `.github/data/metrics/latest.json` |
| **posted_jobs.json** | Master database of all posted jobs | `.github/data/posted_jobs.json` |
| **Discord logs** | Posting success/failure logs | `.github/logs/discord-posts-*.jsonl` |
| **Routing logs** | Channel routing decisions | `.github/audit/routing-encrypted.json` |

## 🔧 Tools

| Script | Purpose | Documentation |
|--------|---------|---------------|
| **query-metrics.js** | Query metrics CLI | `README-VERIFICATION.md` (Claude Metrics section) |
| **generate-metrics-report.js** | Generate metrics report | `METRICS-SYSTEM.md` |
| **enhanced-discord-bot.js** | Main posting bot | `README-VERIFICATION.md` |
| **verify-discord-channels.js** | Channel health check | `README-VERIFICATION.md` |

## 📚 Full Documentation

- **Metrics System:** `.github/METRICS-SYSTEM.md`
- **Verification & Debugging:** `.github/scripts/README-VERIFICATION.md`
- **Discord Health:** See verification section in README-VERIFICATION.md

## 🆘 Common Issues

### "Metrics not found"
```bash
node .github/scripts/generate-metrics-report.js --days=7
```

### "Job not in metrics"
- Job may be older than 7 days
- Check if job exists: `grep "<job-id>" .github/data/posted_jobs.json`
- Generate longer period: `--days=30`

### "No routing logs"
- Routing logs are encrypted
- Set: `export LOG_ENCRYPT_PASSWORD="password"`
- Then regenerate metrics

## 📊 Metrics Snapshot

**What's Tracked:**
- Total jobs posted (last 7 days)
- Jobs per channel
- Multi-channel routing
- Posting failures
- Filtered jobs (and why)

**Updated:** After every job posting run (every 15 minutes)

**Committed to git:** Yes (latest.json always available)

---

**Quick Links:**
- Full Metrics Docs: `.github/METRICS-SYSTEM.md`
- Debugging Guide: `.github/scripts/README-VERIFICATION.md`
- Workflow: `.github/workflows/update-jobs.yml`
