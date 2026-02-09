# Secrets Configuration - New-Grad-Jobs-2026

**Purpose:** Document all required secrets for this repository
**Last Updated:** 2026-02-08

---

## Required Secrets

Add these secrets in: **Repository Settings → Secrets and variables → Actions**

### 1. JSEARCH_API_KEY (Required)

**Purpose:** JSearch API authentication for fetching jobs

**How to get:**
1. Sign up at: https://rapidapi.com/jayeshkachhadiya-jayeshkachhadiya/api/jsearch
2. Get your API key from RapidAPI dashboard

**Format:** String (e.g., `abcd1234efgh5678`)

**Used by:** `.github/workflows/update-jobs.yml`, `.github/workflows/catchup-jobs.yml`

**Validation:** Run `node .github/scripts/validate-secrets.js` to verify

---

### 2. USE_JSEARCH (Optional)

**Purpose:** Feature flag to enable/disable JSearch API fetches

**Allowed values:**
- `"true"` - Enable JSearch API (90 jobs/day quota)
- `"false"` - Disable JSearch API, use other sources only
- *Not set* - Defaults to `"true"`

**Used by:** `.github/workflows/update-jobs.yml`

**Default:** `true` (if not set)

---

### 3. LOG_ENCRYPT_PASSWORD (Required)

**Purpose:** Encryption password for logs and metrics export

**Format:** Strong password string (min 16 characters recommended)

**Used by:** `.github/workflows/update-jobs.yml`, `.github/scripts/jobs-data-exporter.js`

**Security:** Do NOT use this password for other repositories

---

### 4. JOB_PROCESSOR_URL (Optional)

**Purpose:** URL to external job processor service

**Format:** Full URL (e.g., `https://example.com/api/process`)

**Used by:** `.github/workflows/update-jobs.yml`

**Note:** If not set, workflow uses default processor

---

### 5. GITHUB_TOKEN (Automatic)

**Purpose:** GitHub Actions automatically provides this token

**Format:** Automatically injected by GitHub Actions

**Used by:** All workflows for git operations (push, commit)

**Note:** DO NOT manually set this secret

---

## Discord Secrets (Optional)

These secrets are only required if using Discord posting features.

### 6. DISCORD_TOKEN (Optional - Discord posting)

**Purpose:** Discord bot token for posting jobs to Discord channels

**How to get:**
1. Go to Discord Developer Portal: https://discord.com/developers/applications
2. Create a bot application
3. Copy the token from the Bot section

**Format:** String (starts with `MTAw...` or similar)

**Used by:** `.github/workflows/update-jobs.yml`, Discord posting workflows

---

### 7-31. DISCORD_CHANNEL_ID Secrets (Optional)

**Purpose:** Target Discord channel IDs for different job categories

| Secret | Purpose |
|--------|---------|
| `DISCORD_CHANNEL_ID` | Default Discord channel ID (fallback) |

**Format:** Numeric channel ID (e.g., `123456789012345678`)

**Available channels:**
| Secret | Purpose |
|--------|---------|
| `DISCORD_CLIENT_ID` | Discord application client ID |
| `DISCORD_GUILD_ID` | Discord server (guild) ID |
| `DISCORD_TECH_CHANNEL_ID` | General tech jobs |
| `DISCORD_SALES_CHANNEL_ID` | Sales jobs |
| `DISCORD_MARKETING_CHANNEL_ID` | Marketing jobs |
| `DISCORD_FINANCE_CHANNEL_ID` | Finance jobs |
| `DISCORD_HEALTHCARE_CHANNEL_ID` | Healthcare jobs |
| `DISCORD_PRODUCT_CHANNEL_ID` | Product jobs |
| `DISCORD_SUPPLY_CHANNEL_ID` | Supply chain jobs |
| `DISCORD_PM_CHANNEL_ID` | Product management jobs |
| `DISCORD_HR_CHANNEL_ID` | HR jobs |
| `DISCORD_REMOTE_USA_CHANNEL_ID` | Remote USA jobs |
| `DISCORD_NY_CHANNEL_ID` | New York area jobs |
| `DISCORD_AUSTIN_CHANNEL_ID` | Austin area jobs |
| `DISCORD_CHICAGO_CHANNEL_ID` | Chicago area jobs |
| `DISCORD_SEATTLE_CHANNEL_ID` | Seattle area jobs |
| `DISCORD_REDMOND_CHANNEL_ID` | Redmond area jobs |
| `DISCORD_MV_CHANNEL_ID` | Mountain View area jobs |
| `DISCORD_SF_CHANNEL_ID` | San Francisco area jobs |
| `DISCORD_SUNNYVALE_CHANNEL_ID` | Sunnyvale area jobs |
| `DISCORD_SAN_BRUNO_CHANNEL_ID` | San Bruno area jobs |
| `DISCORD_AI_CHANNEL_ID` | AI/ML jobs |
| `DISCORD_DS_CHANNEL_ID` | Data science jobs |
| `DISCORD_BOSTON_CHANNEL_ID` | Boston area jobs |
| `DISCORD_LA_CHANNEL_ID` | Los Angeles area jobs |

**How to get channel IDs:**
1. Enable Developer Mode in Discord (Settings → Advanced)
2. Right-click channel → Copy Channel ID

**Used by:** `.github/scripts/enhanced-discord-bot.js`, Discord posting workflows

---

### 31. DISCORD_WEBHOOK_URL (Alternative to bot token)

**Purpose:** Discord webhook URL for posting jobs (alternative to bot token)

**Format:** Full webhook URL (e.g., `https://discord.com/api/webhooks/...`)

**Used by:** Some Discord posting workflows

---

## Validation

### Run Validation Script

```bash
node .github/scripts/validate-secrets.js
```

This script checks:
- ✅ All required secrets are documented in SECRETS.md
- ✅ Secrets are properly referenced in workflows
- ✅ No hardcoded secrets in code

---

## Secret Rotation

**Recommended:** Rotate API keys every 90 days

**To rotate:**
1. Get new API key from provider
2. Update secret in Repository Settings
3. Remove old key from provider dashboard

---

## Security Best Practices

- ✅ Never commit secrets to repository
- ✅ Use different passwords for different repos
- ✅ Rotate API keys regularly
- ✅ Use strong, random passwords
- ✅ Limit secret access to necessary workflows only

---

## Troubleshooting

### "JSEARCH_API_KEY not found"
- Add the secret in Repository Settings → Secrets and variables → Actions
- Wait 1-2 minutes for GitHub to cache the secret

### "Invalid API key"
- Verify the key is correct in RapidAPI dashboard
- Check if you've exceeded quota (90 jobs/day for free tier)

### "LOG_ENCRYPT_PASSWORD error"
- Ensure password is at least 8 characters
- Check for special characters that might need escaping

---

**For questions, check:** [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
