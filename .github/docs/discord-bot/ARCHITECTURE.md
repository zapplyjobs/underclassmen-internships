# Discord Bot Architecture

## System Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  GitHub Actions │────▶│  Discord Bot     │────▶│  Discord Server │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                         │
        │                        │                         │
        ▼                        ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Job Data Files │     │   Log Files      │     │  Forum Channels │
│  - new_jobs     │     │   - .github/logs │     │  - tech-jobs    │
│  - posted_jobs  │     │                  │     │  - sales-jobs   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Component Details

### 1. GitHub Actions Workflows

#### Main Workflow (`update-jobs.yml`)
```yaml
Schedule: Every 6 hours
Steps:
  1. Checkout repository
  2. Setup Node.js
  3. Run job fetcher (updates new_jobs.json)
  4. Run Discord bot wrapper
  5. Commit and push changes
```

#### Test Workflow (`test-discord-bot.yml`)
```yaml
Trigger: Manual
Steps:
  1. Checkout repository
  2. Setup Node.js
  3. Create test jobs
  4. Run Discord bot wrapper
  5. Display logs
```

### 2. Discord Bot (`enhanced-discord-bot.js`)

#### Core Components

**Configuration Module**
```javascript
// Environment variables
DISCORD_TOKEN
DISCORD_CHANNEL_ID (fallback)

// Multi-channel config
CHANNEL_CONFIG = {
  tech: DISCORD_TECH_CHANNEL_ID,
  sales: DISCORD_SALES_CHANNEL_ID,
  // ... etc
}

// Auto-detect mode
MULTI_CHANNEL_MODE = channels have values
```

**Job Categorization**
```javascript
categorizeJob(jobTitle) {
  // Regex patterns for each category
  const patterns = {
    tech: /software|engineer|developer|programmer/i,
    sales: /sales|account executive|business development/i,
    marketing: /marketing|brand|content|social media/i,
    // ... etc
  }

  // Match and return category
  for (const [category, pattern] of Object.entries(patterns)) {
    if (pattern.test(jobTitle)) return category;
  }
  return 'other';
}
```

**Posting Logic**
```javascript
async postJobs() {
  1. Load new_jobs.json
  2. Load posted_jobs.json
  3. Filter unposted jobs
  4. For each job:
     a. Determine channel (categorize or use fallback)
     b. Create embed
     c. Post to channel (message or thread)
     d. Track as posted
  5. Save posted_jobs.json
}
```

### 3. Posted Jobs Management & Archive System

**Database:** `.github/data/posted_jobs.json`
**Archives:** `.github/data/archive/posted_jobs_YYYY_MM.json`
**Deployed:** December 3, 2025 (Commit `f9eb1503`)

#### Overview

The Posted Jobs Manager tracks which jobs have been posted to Discord to prevent duplicates. It uses an archive system to manage database capacity while preserving historical data.

#### Core Components

**PostedJobsManager Class**
```javascript
class PostedJobsManager {
  constructor() {
    this.postedJobs = Set()           // Active database (3500-4500 jobs)
    this.archivesCache = {}            // Lazy-loaded recent archives
    this.archiveDir = '.github/data/archive'
  }

  // Load posted_jobs.json
  loadPostedJobs() → Set

  // Check if job was posted (with archive lookup)
  hasBeenPosted(jobId, jobData) → boolean

  // Mark job as posted and save
  markAsPosted(jobId) → void

  // Save database (triggers archiving if needed)
  savePostedJobs() → void

  // Archive oldest N jobs
  archiveOldestJobs(count) → void

  // Find job in recent archives
  findInArchives(jobId) → {month, found}

  // Calculate age for reopening detection
  getMonthsSinceArchive(month) → number
  getDaysSincePosted(date) → number
}
```

#### Archive System Logic

**Trigger Conditions:**
```javascript
if (postedJobsArray.length > archiveThreshold) {
  // archiveThreshold = 4500 (default)
  // Can be overridden with ARCHIVE_THRESHOLD env var

  if (isFirstArchive) {
    archiveOldestJobs(1500);  // Bootstrap
  } else {
    archiveOldestJobs(1000);  // Normal operation
  }
}
```

**Archive File Structure:**
```json
// .github/data/archive/posted_jobs_2025_12.json
[
  "careers-adobe-com-...",
  "greenhouse-io-...",
  "lyft-android-engineer-...",
  // ... sorted job IDs
]
```

**Deduplication with Archives:**
```
1. Check active database (posted_jobs.json)
   ├─ Found → Skip job (already posted)
   └─ Not found → Check archives

2. Check recent archives (last 2 months)
   ├─ Found → Check age and date for reopening
   │  ├─ Archived <2 months → Skip (prevent duplicate)
   │  ├─ Archived >2 months + recent date → Post (job reopening)
   │  └─ Archived >3 months + no date → Post (assume reopening)
   └─ Not found → Post (new job)
```

#### Job Reopening Detection

**Problem:** Companies reopen positions after months. Need to distinguish between:
- **Evicted jobs** (still active, should NOT repost)
- **Reopened jobs** (closed and reopened, SHOULD repost)

**Solution:**
```javascript
hasBeenPosted(jobId, jobData) {
  // Check active database
  if (this.postedJobs.has(jobId)) return true;

  // Check archives
  const archiveInfo = this.findInArchives(jobId);
  if (!archiveInfo) return false; // New job

  const monthsOld = this.getMonthsSinceArchive(archiveInfo.month);

  // Rule 1: Recent archive (<2 months) = don't repost
  if (monthsOld < 2) return true;

  // Rule 2: Old archive + recent posting date = reopening
  if (jobData?.date_posted) {
    const daysOld = this.getDaysSincePosted(jobData.date_posted);
    if (daysOld <= 30) {
      console.log('♻️ Job reopening detected');
      return false; // Allow repost
    }
  }

  // Rule 3: Very old (>3 months) without date = assume reopening
  if (monthsOld >= 3) return false;

  return true; // Default: don't repost
}
```

#### Benefits

1. **Fast JSON Parsing:** Database stays at 3500-4500 jobs (vs 5000)
2. **No Data Loss:** Old jobs archived, not deleted
3. **Prevents Duplicates:** 2-month lookback catches capacity-related duplicates
4. **Allows Reopenings:** Date-based logic allows legitimate job reopenings
5. **Graceful Errors:** Corrupted archives ignored, doesn't crash bot

#### Monitoring

**Success Indicators (Workflow Logs):**
```
📚 Loaded archive: 2025-12 (1500 jobs)
💾 Active database now has 3501 jobs
📦 CAPACITY REACHED: Archiving oldest 1000 jobs
♻️ Job reopening detected: <job-id>
```

**Error Indicators:**
```
❌ ERROR during archiving: <error>
⚠️ Corrupted archive 2025-12, ignoring: <error>
⚠️ Emergency trim to 5000 jobs
```

#### Testing

**Local Testing:**
```bash
# Set low threshold to trigger archiving
ARCHIVE_THRESHOLD=10 node .github/scripts/enhanced-discord-bot.js
```

**Verification:**
```bash
# Check archive directory
ls -la .github/data/archive/

# Check database size (should be 3500-4500, not 5000)
node -p 'require("./.github/data/posted_jobs.json").length'
```

#### Related Files
- Implementation: `.github/scripts/enhanced-discord-bot.js` (lines 215-485)
- Troubleshooting: `TROUBLESHOOTING.md` (Issue #5)
- Deployment Commit: `f9eb1503`

---

### 4. Logging System (`save-discord-logs.js`)

**Wrapper Script**
```javascript
// Captures all output
const botProcess = spawn('node', ['enhanced-discord-bot.js'])

// Saves to timestamped file
const logFile = `.github/logs/discord-bot-${timestamp}.log`

// Also creates latest.log symlink
fs.symlinkSync(logFile, '.github/logs/latest.log')
```

### 4. Data Flow

```
1. Job Fetcher → new_jobs.json
   ↓
2. Discord Bot reads new_jobs.json
   ↓
3. Bot filters using posted_jobs.json
   ↓
4. Bot categorizes each job
   ↓
5. Bot posts to appropriate Discord channel
   ↓
6. Bot updates posted_jobs.json
   ↓
7. Git commits and pushes changes
```

## File Structure

```
.github/
├── scripts/
│   ├── enhanced-discord-bot.js      # Main bot logic
│   ├── save-discord-logs.js         # Logging wrapper
│   └── job-fetcher/                 # Job fetching scripts
│       └── index.js
├── data/
│   ├── new_jobs.json                # Jobs to post
│   ├── posted_jobs.json             # Active tracking (3500-4500 jobs)
│   ├── seen_jobs.json               # Legacy tracking (auto-trimmed)
│   └── archive/                     # 🆕 Monthly archives (Dec 2025)
│       ├── posted_jobs_2025_11.json # November archived jobs
│       ├── posted_jobs_2025_12.json # December archived jobs
│       └── ...                      # One file per month
├── logs/
│   ├── latest.log                   # Symlink to latest
│   └── discord-bot-*.log            # Timestamped logs
├── workflows/
│   ├── update-jobs.yml              # Main workflow
│   └── test-discord-bot.yml         # Test workflow
└── docs/discord-bot/
    ├── README.md                     # Overview
    ├── ARCHITECTURE.md               # This file
    ├── SETUP_GUIDE.md                # Setup instructions
    ├── TESTING.md                    # Testing guide
    └── BUG_FIXES.md                  # Bug history
```

## Discord Integration

### Message Format (Text Channel)
```javascript
{
  embeds: [{
    color: 0x0099ff,
    title: jobTitle,
    url: jobApplyLink,
    author: {
      name: companyName,
      icon_url: companyLogo
    },
    fields: [
      { name: 'Location', value: location, inline: true },
      { name: 'Posted', value: postedDate, inline: true }
    ],
    description: jobDescription.substring(0, 200),
    timestamp: new Date(jobPostedDatetime)
  }]
}
```

### Thread Format (Forum Channel)
```javascript
{
  name: `${jobTitle} at ${company}`,
  message: {
    embeds: [/* same as above */]
  },
  appliedTags: [], // Optional forum tags
  autoArchiveDuration: 1440 // 24 hours
}
```

## Job Categorization Rules

| Category | Keywords | Target Forum |
|----------|----------|--------------|
| Tech | software, engineer, developer, programmer, coding, IT | tech-jobs |
| Sales | sales, account, business development, revenue | sales-jobs |
| Marketing | marketing, brand, content, social media, SEO | marketing-jobs |
| Finance | finance, accounting, analyst, investment, banking | finance-jobs |
| Healthcare | health, medical, clinical, nurse, doctor, pharma | healthcare-jobs |
| Product | product manager, product owner, PM, product design | product-jobs |
| Supply Chain | supply chain, logistics, operations, procurement | supply-chain-jobs |
| PM | project manager, program manager, scrum, agile | pm-jobs |
| HR | human resources, HR, recruiting, talent, people ops | hr-jobs |
| Other | (anything else) | Fallback channel |

## Error Handling

### Connection Errors
```javascript
client.on('error', (error) => {
  console.error('Discord client error:', error);
  // Retry logic with exponential backoff
});
```

### Rate Limiting
```javascript
// Built into Discord.js v14
// Automatically queues and retries
// Additional manual checks:
if (error.code === 50013) {
  console.warn('Missing permissions');
}
```

### File System Errors
```javascript
try {
  const jobs = JSON.parse(fs.readFileSync(jobsFile));
} catch (error) {
  console.error('Failed to read jobs file:', error);
  process.exit(1);
}
```

## Performance Considerations

### Batching
- Posts jobs sequentially to avoid rate limits
- 1-second delay between posts (configurable)
- Handles up to 100 jobs per run

### Caching
- Channel objects are fetched once and reused
- Avoids repeated API calls

### Memory Management
- Processes jobs in chunks
- Cleans up after each batch
- Properly destroys client on exit

## Security

### Token Management
- Never logged or exposed
- Stored in GitHub Secrets
- Accessed via environment variables

### Input Validation
- Job IDs sanitized
- URLs validated
- Description length limited

### Permissions
- Minimal Discord permissions
- Read/write only required files
- No execution of external code

## Deployment States

### Single-Channel Mode
```
Required: DISCORD_TOKEN, DISCORD_CHANNEL_ID
Behavior: All jobs → single text channel
Use case: Simple setup, testing
```

### Multi-Channel Mode
```
Required: DISCORD_TOKEN + all 9 channel IDs
Behavior: Jobs → categorized forum channels
Use case: Production, organized posting
```

## Monitoring

### Health Checks
- Bot login confirmation
- Job count logging
- Success/failure tracking
- Error reporting

### Metrics Logged
- Total jobs found
- Jobs posted vs skipped
- Channel routing decisions
- Posting duration
- Error counts

## Future Enhancements

### Planned Features
1. **Slash Commands**: Interactive job queries
2. **Reactions**: Track user interest
3. **Scheduling**: Time-zone aware posting
4. **Filters**: User preferences
5. **Search**: Find specific jobs
6. **Analytics**: Engagement tracking

### Architecture Improvements
1. **Queue System**: Redis/RabbitMQ for job queue
2. **Database**: PostgreSQL for tracking
3. **Webhooks**: Real-time job updates
4. **API**: RESTful job management
5. **Dashboard**: Admin interface
6. **Clustering**: Multi-process handling

## Troubleshooting Flow

```
Problem detected
       ↓
Check .github/logs/latest.log
       ↓
Identify error type
       ↓
┌──────┴──────┬──────┬──────┬──────┐
Auth    Channel  Data   Rate   Other
 ↓        ↓       ↓      ↓      ↓
Token   Perms   Format  Wait   Debug
```

## Dependencies

### NPM Packages
- `discord.js`: ^14.x (Discord API wrapper)
- `dotenv`: Environment variable loading
- `node-fetch`: HTTP requests (if needed)

### System Requirements
- Node.js: >=16.x
- GitHub Actions runner
- Network access to Discord API
- File system write permissions