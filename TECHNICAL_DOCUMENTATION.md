# Technical Documentation - Job Scraper System

## System Overview

This system fetches job listings from major tech companies using their career APIs and external sources, processes them, and posts new jobs to Discord with smart tagging and subscription features.

## Core Architecture

### 1. Job Fetching (`real-career-scraper.js`)

**How it works:**
- Calls company career APIs directly (not web scraping)
- Each company has a predefined API endpoint and custom parser
- APIs return structured JSON data that gets converted to standardized job objects

**API Structure:**
```javascript
CAREER_APIS = {
    'CompanyName': {
        api: 'https://api.company.com/jobs',     // Direct API endpoint
        method: 'GET',                          // HTTP method
        parser: (data) => {                     // Custom JSON parser
            return data.jobs.map(job => ({
                job_title: job.title,           // Map API fields to standard format
                employer_name: 'CompanyName',
                job_posted_at_datetime_utc: safeISOString(job.date),
                // ... more field mappings
            }));
        }
    }
}
```

**Common API Patterns:**
- **Greenhouse APIs**: `https://api.greenhouse.io/v1/boards/COMPANY/jobs`
- **Lever APIs**: `https://api.lever.co/v0/postings/COMPANY`
- **Custom APIs**: Each company's unique endpoint structure

### 2. Job Processing Pipeline (`job-processor.js`)

**Flow:**
1. Fetch jobs from all company APIs
2. Filter for US-only positions
3. Remove jobs older than 1 week
4. Generate unique IDs for deduplication
5. Filter out previously seen jobs
6. Generate company statistics

### 3. Utility Functions (`utils.js`)

**Key Functions:**
- `generateJobId()` - Creates consistent IDs for deduplication
- `isUSOnlyJob()` - Filters for US positions only
- `formatTimeAgo()` - Converts dates to human-readable format
- `getExperienceLevel()` - Categorizes jobs by experience level

### 4. Discord Integration (`enhanced-discord-bot.js`)

**Features:**
- Auto-generated tags (skills, location, company tier)
- User subscription alerts
- Slash commands for job filtering
- Rich embed formatting with company emojis

## Problem Solutions

### Issue 1: "Invalid time value" Errors

**Problem:** 
Microsoft, Qualcomm, and PayPal APIs returned `null` or invalid date strings, causing `new Date()` to throw "Invalid time value" errors.

**Root Cause:**
```javascript
// This would fail if job.postedDate was null/undefined
job_posted_at_datetime_utc: new Date(job.postedDate).toISOString()
```

**Solution:**
Created `safeISOString()` utility function:
```javascript
function safeISOString(dateValue) {
    if (!dateValue) return new Date().toISOString();
    
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            return new Date().toISOString();
        }
        return date.toISOString();
    } catch (error) {
        return new Date().toISOString();
    }
}
```

**Result:** All date parsing now safely handles invalid dates by falling back to current timestamp.

### Issue 2: API 404 Errors

**Problem:**
Several company APIs returned 404 errors (Amazon, Uber, Discord, Lyft, Slack).

**Likely Causes:**
- Companies changed their API endpoints
- APIs now require authentication
- Rate limiting or CORS restrictions

**Partial Solutions Applied:**
- Updated Amazon API endpoint with proper query parameters
- Increased rate limiting delay from 2s to 3s between requests
- Added better error handling to continue processing other companies

**Status:** Some APIs may need complete endpoint research and updates.

## Data Flow

```
1. real-career-scraper.js
   ↓ (fetches from company APIs)
2. job-processor.js 
   ↓ (filters, deduplicates, processes)
3. README generation
   ↓ (creates job tables)
4. Discord bot posting
   ↓ (posts new jobs with tags)
5. User subscriptions
   ↓ (alerts matching users)
```

## File Structure

```
.github/scripts/
├── job-fetcher/
│   ├── index.js              # Main orchestrator
│   ├── utils.js              # Helper functions
│   ├── job-processor.js      # Job processing logic
│   ├── readme-generator.js   # README generation
│   └── companies.json        # Company database
├── enhanced-discord-bot.js   # Discord integration
├── real-career-scraper.js    # API fetching
└── README-DISCORD-BOT.md     # Documentation
```

## Adding New Companies

To add a new company, you need:

1. **Find their API endpoint** (inspect network requests on their careers page)
2. **Understand their JSON structure** 
3. **Write a custom parser**:

```javascript
'NewCompany': {
    api: 'https://api.newcompany.com/jobs',
    method: 'GET',
    parser: (data) => {
        return data.positions.map(job => ({
            job_title: job.name,
            employer_name: 'NewCompany',
            job_city: job.location.city,
            job_state: job.location.state,
            job_description: job.summary,
            job_apply_link: job.url,
            job_posted_at_datetime_utc: safeISOString(job.created_date),
            job_employment_type: 'FULLTIME'
        }));
    }
}
```

4. **Add to companies.json database** with emoji and metadata

## Key Learnings

1. **Always use safe date parsing** - APIs return inconsistent date formats
2. **Rate limiting is crucial** - Too many requests cause 429/403 errors  
3. **API endpoints change frequently** - Regular maintenance needed
4. **Each company is unique** - No universal job API standard
5. **Fallback to current date** - Better than crashing on invalid dates

## Monitoring & Maintenance

**Watch for:**
- 404 errors (API endpoints changed)
- Invalid time value errors (new date format issues)
- Empty job results (API structure changed)
- Rate limiting (429/503 responses)

**Regular tasks:**
- Update API endpoints when companies change them
- Add new company parsers
- Monitor Discord bot performance
- Clean up seen_jobs.json to prevent excessive growth

---

*Last updated: January 28, 2025*