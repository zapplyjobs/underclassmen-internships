# Private Logs Directory

**Purpose:** Store detailed execution logs during GitHub Actions runs

## How Logs Work

**Public Output (visible to anyone):**
- ✅ Job collection completed
- 📊 Total positions: [count]
- Generic status messages

**Private Logs (collaborators only):**
- Full job fetcher output
- Company-specific results
- API endpoint details
- Error diagnostics
- Discord bot activity

## Accessing Private Logs

1. **Go to:** Actions tab → Select workflow run
2. **Download:** Scroll to "Artifacts" section
3. **Extract:** `job-processing-logs-[run-number].zip`
4. **View:** Contains `job-fetcher.log` and `discord-bot.log`

## Retention

- Artifacts kept for **90 days**
- Automatically deleted after retention period
- Logs never committed to git (see `.gitignore`)

## Security Note

These logs contain:
- Company names and job counts
- API endpoint URLs
- Data collection methodology
- Discord channel IDs

**Never commit logs to repository** - they're security-sensitive!
