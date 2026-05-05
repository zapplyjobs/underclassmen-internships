# Discord Bot Execution Audit
**Timestamp:** 2026-02-07T15:49:54.562Z
**Exit Code:** ✅ Success
## Metrics
- **Jobs Posted:** 10
- **Jobs Failed:** 0
- **Jobs Skipped:** 2
- **Database Saved:** ✅ Yes
## Sanitized Log Output
```
[2026-02-07T15:49:21.112Z] ========================================
[2026-02-07T15:49:21.114Z] Discord Bot Execution Log
[2026-02-07T15:49:21.114Z] Environment: GitHub Actions
[2026-02-07T15:49:21.114Z] Node Version: v20.20.0
[2026-02-07T15:49:21.114Z] ========================================
[2026-02-07T15:49:21.114Z] Environment Variables Check:
[2026-02-07T15:49:21.114Z] DISCORD_TOKEN: ✅ Set
[2026-02-07T15:49:21.115Z] DISCORD_CHANNEL_ID: ✅ Set
[2026-02-07T15:49:21.115Z] DISCORD_CLIENT_ID: ❌ Not set
[2026-02-07T15:49:21.115Z] DISCORD_GUILD_ID: ❌ Not set
[2026-02-07T15:49:21.115Z] 
Multi-Channel Configuration:
[2026-02-07T15:49:21.115Z] DISCORD_TECH_CHANNEL_ID: ✅ Set
[2026-02-07T15:49:21.115Z] DISCORD_SALES_CHANNEL_ID: ⭕ Not set
[2026-02-07T15:49:21.115Z] DISCORD_MARKETING_CHANNEL_ID: ⭕ Not set
[2026-02-07T15:49:21.115Z] DISCORD_FINANCE_CHANNEL_ID: ✅ Set
[2026-02-07T15:49:21.115Z] DISCORD_HEALTHCARE_CHANNEL_ID: ⭕ Not set
[2026-02-07T15:49:21.115Z] DISCORD_PRODUCT_CHANNEL_ID: ⭕ Not set
[2026-02-07T15:49:21.115Z] DISCORD_SUPPLY_CHANNEL_ID: ⭕ Not set
[2026-02-07T15:49:21.115Z] DISCORD_PM_CHANNEL_ID: ⭕ Not set
[2026-02-07T15:49:21.115Z] DISCORD_HR_CHANNEL_ID: ⭕ Not set
[2026-02-07T15:49:21.116Z] 
Multi-Channel Mode: ✅ ENABLED
[2026-02-07T15:49:21.116Z] 
Data Files Check:
[2026-02-07T15:49:21.117Z] .github/data/new_jobs.json: ✅ Exists (10 items, 146561 bytes)
[2026-02-07T15:49:21.147Z] .github/data/posted_jobs.json: ✅ Exists (4 items, 6081683 bytes)
[2026-02-07T15:49:21.147Z] 
========================================
[2026-02-07T15:49:21.147Z] Starting Enhanced Discord Bot...
[2026-02-07T15:49:21.147Z] ========================================
[2026-02-07T15:49:21.702Z] [BOT] ✅ Loaded V2 database: 1373 jobs
[2026-02-07T15:49:22.669Z] [BOT] ✅ Enhanced Discord bot logged in as Zapply Jobs Bot#9522
[2026-02-07T15:49:22.670Z] [BOT] 🔍 DEBUG: GUILD_ID = "" (type: string)
🔍 DEBUG: Bot is member of 1 guilds
   - Zapply (CH_20db82b8)
[2026-02-07T15:49:22.670Z] [BOT ERROR] ⚠️ DISCORD_GUILD_ID not set
[2026-02-07T15:49:22.696Z] [BOT] ✅ Loaded pending queue: 371 total (321 pending, 50 enriched, 0 posted)
[2026-02-07T15:49:22.697Z] [BOT] [BOT] 📬 Found 50 enriched jobs ready to post from pending queue
[BOT] 🔍 Sample enriched job: Enterprise Account Executive, State & Local Sales at anthropic
[2026-02-07T15:49:22.698Z] [BOT] 🔧 ID mismatch detected: URL-based "JID_c1be21d2-..." not found, but found as SHA256 "860b70f12c622b3e"
[2026-02-07T15:49:22.698Z] [BOT] ⏭️  Skipping duplicate: JID_7e4d456f (posted within 7 days)
[2026-02-07T15:49:22.698Z] [BOT] ⏭️ Skipping already posted: Enterprise Account Executive, State & Local Sales at anthropic
[2026-02-07T15:49:22.698Z] [BOT] 🔧 ID mismatch detected: URL-based "JID_c1be21d2-..." not found, but found as SHA256 "5d10ea8dbeb07322"
[2026-02-07T15:49:22.698Z] [BOT] ⏭️  Skipping duplicate: JID_f7992b83 (posted within 7 days)
[2026-02-07T15:49:22.699Z] [BOT] ⏭️ Skipping already posted: ROLE_8670491d at anthropic
[2026-02-07T15:49:22.710Z] [BOT] 📬 Found 48 new jobs (2 already posted)...
[2026-02-07T15:49:22.710Z] [BOT] 🚫 Skipping blacklisted job: Senior Backend Engineer - Alerts and Operations at verkada
[2026-02-07T15:49:22.710Z] [BOT] 🚫 Skipping blacklisted job: Senior Backend Engineer - Camera Foundation at verkada
🚫 Skipping blacklisted job: Senior Backend Engineer - Device Platform at verkada
🚫 Skipping blacklisted job: Senior Backend Engineer - Intercom at verkada
🚫 Skipping blacklisted job: Senior Backend Engineer - Streaming at verkada
[2026-02-07T15:49:22.711Z] [BOT] 🚫 Skipping blacklisted job: Senior Backend Software Engineer - Workplace Products at verkada
[2026-02-07T15:49:22.711Z] [BOT] 🚫 Skipping blacklisted job: Senior BSP Engineer - Cameras at verkada
🚫 Skipping blacklisted job: Senior Compliance Manager/Director of Compliance at verkada
[2026-02-07T15:49:22.711Z] [BOT] 🚫 Skipping blacklisted job: Senior Data Analyst at verkada
[2026-02-07T15:49:22.711Z] [BOT] 🚫 Skipping blacklisted job: Senior Embedded Engineer - Alarms at verkada
[2026-02-07T15:49:22.711Z] [BOT] 🚫 Skipping blacklisted job: Senior Field Marketing Manager (Global) at verkada
🚫 Skipping blacklisted job: Senior Firmware Engineer at verkada
🚫 Skipping blacklisted job: Senior Frontend Engineer - Access Control at verkada
[2026-02-07T15:49:22.711Z] [BOT] 🚫 Skipping blacklisted job: Senior Frontend Engineer, Business Systems at verkada
🚫 Skipping blacklisted job: Senior Frontend Engineer - Streaming at verkada
[2026-02-07T15:49:22.711Z] [BOT] 🚫 Skipping blacklisted job: Senior Growth Product Manager at verkada
🚫 Skipping blacklisted job: Senior Manager, Accounting at verkada
[2026-02-07T15:49:22.711Z] [BOT] 🚫 Skipping blacklisted job: Senior Product Designer at verkada
🚫 Skipping blacklisted job: Senior Product Manager, Access Control Core Hardware and Fleet Management at verkada
🚫 Skipping blacklisted job: Senior Product Manager, Platform at verkada
[2026-02-07T15:49:22.752Z] [BOT] ✅ Loaded pending queue: 371 total (321 pending, 50 enriched, 0 posted)
[2026-02-07T15:49:22.784Z] [BOT] ✅ Saved pending queue: 351 total (321 pending, 30 enriched, 0 posted)
🗑️ Removed 20 blacklisted jobs from pending queue
[2026-02-07T15:49:22.784Z] [BOT] 📋 After blacklist filter: 28 jobs (20 blacklisted)
📋 After data quality filter: 28 jobs (0 invalid)
[2026-02-07T15:49:22.785Z] [BOT] 📋 After multi-location grouping: 23 unique jobs to post
[2026-02-07T15:49:22.785Z] [BOT] (5 grouped as same job with different locations)
⏸️ Limiting to 10 jobs this run, 38 deferred for next run
📤 Posting 10 jobs...
🔀 Multi-channel mode enabled - routing jobs to appropriate forums
[2026-02-07T15:49:22.789Z] [BOT] 📌 Posting 1 jobs to #🤖・ai-jobs
[2026-02-07T15:49:22.790Z] [BOT] 📍 [ROUTING] "Frontend Software Engineer - University Graduate 2026" @ verkada
[2026-02-07T15:49:22.790Z] [BOT] Category: AI (matched: "AI specialization")
   Channel: 🤖・ai-jobs (1462...9217)
   ⚠️  Multiple matches: aiMatch, techMatch (using ai)
[2026-02-07T15:49:22.790Z] [BOT] 🔢 Loaded persisted counter for channel CH_fff0e4bf: 377
[2026-02-07T15:49:22.808Z] [BOT ERROR] (node:2590) DeprecationWarning: The ready event has been renamed to clientReady to distinguish it from the gateway READY event and will only emit under that name in v15. Please use clientReady instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
[2026-02-07T15:49:23.462Z] [BOT] ✅ Posted message: Frontend Software Engineer - University Graduate 2026 @ verkada in #🤖・ai-jobs
  ✅ Industry: Frontend Software Engineer - University Graduate 2026 @ verkada
[2026-02-07T15:49:23.463Z] [BOT] 💾 Added channel posting: Frontend Software Engineer - University Graduate 2026 @ verkada → category channel (1 total channels)
[2026-02-07T15:49:23.463Z] [BOT] 💾 BEFORE MERGE: 1374 jobs in memory (cached)
[2026-02-07T15:49:23.488Z] [BOT] ✅ Loaded V2 database: 1373 jobs
💾 DISK STATE: 1373 jobs on disk
[2026-02-07T15:49:23.489Z] [BOT] 💾 DEBUG: Iterating cached memory jobs - length=1374
[2026-02-07T15:49:23.492Z] [BOT] 💾 MERGE STATS: 1 new, 0 updated, 0 deep-merged, 0 skipped
[2026-02-07T15:49:23.493Z] [BOT] 💾 AFTER MERGE: 1374 jobs (merged disk + memory)
[2026-02-07T15:49:23.494Z] [BOT] 📁 Created archive directory: /home/runner/work/New-Grad-Jobs-2026/New-Grad-Jobs-2026/.github/data/archive
[2026-02-07T15:49:23.501Z] [BOT] 📦 Archived 10 jobs to 2026-01.json (10 total in archive)
[2026-02-07T15:49:23.501Z] [BOT] ✅ Archiving complete: 10 archived, 1364 active
[2026-02-07T15:49:23.565Z] [BOT] 💾 Saved posted_jobs.json: 1364 active jobs
✅ Verified: Database file matches in-memory state
[2026-02-07T15:49:28.069Z] [BOT] 📌 Posting 2 jobs to #💰・finance-jobs
[2026-02-07T15:49:28.069Z] [BOT] 📍 [ROUTING] "G&A Jr. Recruiter" @ verkada
[2026-02-07T15:49:28.069Z] [BOT] Category: FINANCE (matched: "finance")
   Channel: 💰・finance-jobs (1462...4023)
🔢 Loaded persisted counter for channel CH_bd916e08: 76
[2026-02-07T15:49:28.342Z] [BOT] ✅ Posted message: G&A Jr. Recruiter @ verkada in #💰・finance-jobs
[2026-02-07T15:49:28.342Z] [BOT] ✅ Industry: G&A Jr. Recruiter @ verkada
[2026-02-07T15:49:28.342Z] [BOT] 💾 Added channel posting: G&A Jr. Recruiter @ verkada → category channel (1 total channels)
[2026-02-07T15:49:28.343Z] [BOT] 💾 BEFORE MERGE: 1365 jobs in memory (cached)
[2026-02-07T15:49:28.362Z] [BOT] ✅ Loaded V2 database: 1364 jobs
💾 DISK STATE: 1364 jobs on disk
[2026-02-07T15:49:28.362Z] [BOT] 💾 DEBUG: Iterating cached memory jobs - length=1365
[2026-02-07T15:49:28.365Z] [BOT] 💾 MERGE STATS: 1 new, 0 updated, 0 deep-merged, 0 skipped
[2026-02-07T15:49:28.365Z] [BOT] 💾 AFTER MERGE: 1365 jobs (merged disk + memory)
[2026-02-07T15:49:28.366Z] [BOT] ✅ No jobs to archive (all 1365 jobs within 7-day window)
[2026-02-07T15:49:28.431Z] [BOT] 💾 Saved posted_jobs.json: 1365 active jobs
✅ Verified: Database file matches in-memory state
[2026-02-07T15:49:29.933Z] [BOT] 📍 [ROUTING] "Head of Marketing Operations" @ verkada
[2026-02-07T15:49:29.933Z] [BOT] Category: FINANCE (matched: "tax")
   Channel: 💰・finance-jobs (1462...4023)
[2026-02-07T15:49:30.194Z] [BOT] ✅ Posted message: Head of Marketing Operations @ verkada in #💰・finance-jobs
  ✅ Industry: Head of Marketing Operations @ verkada
[2026-02-07T15:49:30.195Z] [BOT] 💾 Added channel posting: Head of Marketing Operations @ verkada → category channel (1 total channels)
[2026-02-07T15:49:30.195Z] [BOT] 💾 BEFORE MERGE: 1366 jobs in memory (cached)
[2026-02-07T15:49:30.214Z] [BOT] ✅ Loaded V2 database: 1365 jobs
💾 DISK STATE: 1365 jobs on disk
[2026-02-07T15:49:30.215Z] [BOT] 💾 DEBUG: Iterating cached memory jobs - length=1366
[2026-02-07T15:49:30.218Z] [BOT] 💾 MERGE STATS: 1 new, 0 updated, 0 deep-merged, 0 skipped
💾 AFTER MERGE: 1366 jobs (merged disk + memory)
[2026-02-07T15:49:30.218Z] [BOT] ✅ No jobs to archive (all 1366 jobs within 7-day window)
[2026-02-07T15:49:30.275Z] [BOT] 💾 Saved posted_jobs.json: 1366 active jobs
✅ Verified: Database file matches in-memory state
[2026-02-07T15:49:34.778Z] [BOT] 📌 Posting 7 jobs to #💻・tech-jobs
[2026-02-07T15:49:34.779Z] [BOT] 📍 [ROUTING] "Global Solutions Engineer" @ verkada
[2026-02-07T15:49:34.779Z] [BOT] Category: TECH (matched: "engineer/engineering")
   Channel: 💻・tech-jobs (1462...4987)
🔢 Loaded persisted counter for channel CH_44b6ec5f: 845
[2026-02-07T15:49:35.175Z] [BOT] ✅ Posted message: Global Solutions Engineer @ verkada in #💻・tech-jobs
[2026-02-07T15:49:35.175Z] [BOT] ✅ Industry: Global Solutions Engineer @ verkada
[2026-02-07T15:49:35.176Z] [BOT] 💾 Added channel posting: Global Solutions Engineer @ verkada → category channel (1 total channels)
💾 BEFORE MERGE: 1367 jobs in memory (cached)
[2026-02-07T15:49:35.195Z] [BOT] ✅ Loaded V2 database: 1366 jobs
💾 DISK STATE: 1366 jobs on disk
[2026-02-07T15:49:35.195Z] [BOT] 💾 DEBUG: Iterating cached memory jobs - length=1367
[2026-02-07T15:49:35.198Z] [BOT] 💾 MERGE STATS: 1 new, 0 updated, 0 deep-merged, 0 skipped
[2026-02-07T15:49:35.198Z] [BOT] 💾 AFTER MERGE: 1367 jobs (merged disk + memory)
[2026-02-07T15:49:35.200Z] [BOT] ✅ No jobs to archive (all 1367 jobs within 7-day window)
[2026-02-07T15:49:35.265Z] [BOT] 💾 Saved posted_jobs.json: 1367 active jobs
✅ Verified: Database file matches in-memory state
[2026-02-07T15:49:36.768Z] [BOT] 📍 [ROUTING] "GTM Engineer" @ verkada
   Category: TECH (matched: "engineer/engineering")
[2026-02-07T15:49:36.768Z] [BOT] Channel: 💻・tech-jobs (1462...4987)
[2026-02-07T15:49:37.028Z] [BOT] ✅ Posted message: GTM Engineer @ verkada in #💻・tech-jobs
  ✅ Industry: GTM Engineer @ verkada
[2026-02-07T15:49:37.029Z] [BOT] 💾 Added channel posting: GTM Engineer @ verkada → category channel (1 total channels)
[2026-02-07T15:49:37.029Z] [BOT] 💾 BEFORE MERGE: 1368 jobs in memory (cached)
[2026-02-07T15:49:37.048Z] [BOT] ✅ Loaded V2 database: 1367 jobs
💾 DISK STATE: 1367 jobs on disk
[2026-02-07T15:49:37.048Z] [BOT] 💾 DEBUG: Iterating cached memory jobs - length=1368
[2026-02-07T15:49:37.051Z] [BOT] 💾 MERGE STATS: 1 new, 0 updated, 0 deep-merged, 0 skipped
[2026-02-07T15:49:37.051Z] [BOT] 💾 AFTER MERGE: 1368 jobs (merged disk + memory)
[2026-02-07T15:49:37.052Z] [BOT] ✅ No jobs to archive (all 1368 jobs within 7-day window)
[2026-02-07T15:49:37.117Z] [BOT] 💾 Saved posted_jobs.json: 1368 active jobs
✅ Verified: Database file matches in-memory state
[2026-02-07T15:49:38.619Z] [BOT] 📍 [ROUTING] "Hardware Engineer" @ verkada
   Category: TECH (matched: "engineer/engineering")
[2026-02-07T15:49:38.619Z] [BOT] Channel: 💻・tech-jobs (1462...4987)
[2026-02-07T15:49:38.816Z] [BOT] ✅ Posted message: Hardware Engineer @ verkada in #💻・tech-jobs
  ✅ Industry: Hardware Engineer @ verkada
[2026-02-07T15:49:38.816Z] [BOT] 💾 Added channel posting: Hardware Engineer @ verkada → category channel (1 total channels)
[2026-02-07T15:49:38.816Z] [BOT] 💾 BEFORE MERGE: 1369 jobs in memory (cached)
[2026-02-07T15:49:38.835Z] [BOT] ✅ Loaded V2 database: 1368 jobs
💾 DISK STATE: 1368 jobs on disk
[2026-02-07T15:49:38.836Z] [BOT] 💾 DEBUG: Iterating cached memory jobs - length=1369
[2026-02-07T15:49:38.839Z] [BOT] 💾 MERGE STATS: 1 new, 0 updated, 0 deep-merged, 0 skipped
[2026-02-07T15:49:38.839Z] [BOT] 💾 AFTER MERGE: 1369 jobs (merged disk + memory)
[2026-02-07T15:49:38.840Z] [BOT] ✅ No jobs to archive (all 1369 jobs within 7-day window)
[2026-02-07T15:49:38.903Z] [BOT] 💾 Saved posted_jobs.json: 1369 active jobs
✅ Verified: Database file matches in-memory state
[2026-02-07T15:49:40.406Z] [BOT] 📍 [ROUTING] "Hardware Engineer, New Grad 2025" @ verkada
   Category: TECH (matched: "engineer/engineering")
[2026-02-07T15:49:40.406Z] [BOT] Channel: 💻・tech-jobs (1462...4987)
[2026-02-07T15:49:40.830Z] [BOT] ✅ Posted message: Hardware Engineer, New Grad 2025 @ verkada in #💻・tech-jobs
[2026-02-07T15:49:40.830Z] [BOT] ✅ Industry: Hardware Engineer, New Grad 2025 @ verkada
[2026-02-07T15:49:40.831Z] [BOT] 💾 Added channel posting: Hardware Engineer, New Grad 2025 @ verkada → category channel (1 total channels)
[2026-02-07T15:49:40.831Z] [BOT] 💾 BEFORE MERGE: 1370 jobs in memory (cached)
[2026-02-07T15:49:40.850Z] [BOT] ✅ Loaded V2 database: 1369 jobs
💾 DISK STATE: 1369 jobs on disk
[2026-02-07T15:49:40.850Z] [BOT] 💾 DEBUG: Iterating cached memory jobs - length=1370
[2026-02-07T15:49:40.853Z] [BOT] 💾 MERGE STATS: 1 new, 0 updated, 0 deep-merged, 0 skipped
💾 AFTER MERGE: 1370 jobs (merged disk + memory)
[2026-02-07T15:49:40.854Z] [BOT] ✅ No jobs to archive (all 1370 jobs within 7-day window)
[2026-02-07T15:49:40.918Z] [BOT] 💾 Saved posted_jobs.json: 1370 active jobs
✅ Verified: Database file matches in-memory state
[2026-02-07T15:49:42.420Z] [BOT] 📍 [ROUTING] "Hardware Engineer (Summer Co-op)" @ verkada
[2026-02-07T15:49:42.420Z] [BOT] Category: TECH (matched: "engineer/engineering")
   Channel: 💻・tech-jobs (1462...4987)
[2026-02-07T15:49:42.710Z] [BOT] ✅ Posted message: Hardware Engineer (Summer Co-op) @ verkada in #💻・tech-jobs
  ✅ Industry: Hardware Engineer (Summer Co-op) @ verkada
[2026-02-07T15:49:42.710Z] [BOT] 💾 Added channel posting: Hardware Engineer (Summer Co-op) @ verkada → category channel (1 total channels)
[2026-02-07T15:49:42.710Z] [BOT] 💾 BEFORE MERGE: 1371 jobs in memory (cached)
[2026-02-07T15:49:42.729Z] [BOT] ✅ Loaded V2 database: 1370 jobs
💾 DISK STATE: 1370 jobs on disk
[2026-02-07T15:49:42.729Z] [BOT] 💾 DEBUG: Iterating cached memory jobs - length=1371
[2026-02-07T15:49:42.732Z] [BOT] 💾 MERGE STATS: 1 new, 0 updated, 0 deep-merged, 0 skipped
[2026-02-07T15:49:42.733Z] [BOT] 💾 AFTER MERGE: 1371 jobs (merged disk + memory)
[2026-02-07T15:49:42.734Z] [BOT] ✅ No jobs to archive (all 1371 jobs within 7-day window)
[2026-02-07T15:49:42.797Z] [BOT] 💾 Saved posted_jobs.json: 1371 active jobs
✅ Verified: Database file matches in-memory state
[2026-02-07T15:49:44.299Z] [BOT] 📍 [ROUTING] "Hardware Sustaining Engineer" @ verkada
   Category: TECH (matched: "engineer/engineering")
[2026-02-07T15:49:44.300Z] [BOT] Channel: 💻・tech-jobs (1462...4987)
[2026-02-07T15:49:44.491Z] [BOT] ✅ Posted message: Hardware Sustaining Engineer @ verkada in #💻・tech-jobs
[2026-02-07T15:49:44.491Z] [BOT] ✅ Industry: Hardware Sustaining Engineer @ verkada
[2026-02-07T15:49:44.491Z] [BOT] 💾 Added channel posting: Hardware Sustaining Engineer @ verkada → category channel (1 total channels)
[2026-02-07T15:49:44.492Z] [BOT] 💾 BEFORE MERGE: 1372 jobs in memory (cached)
[2026-02-07T15:49:44.510Z] [BOT] ✅ Loaded V2 database: 1371 jobs
💾 DISK STATE: 1371 jobs on disk
[2026-02-07T15:49:44.511Z] [BOT] 💾 DEBUG: Iterating cached memory jobs - length=1372
[2026-02-07T15:49:44.514Z] [BOT] 💾 MERGE STATS: 1 new, 0 updated, 0 deep-merged, 0 skipped
💾 AFTER MERGE: 1372 jobs (merged disk + memory)
[2026-02-07T15:49:44.515Z] [BOT] ✅ No jobs to archive (all 1372 jobs within 7-day window)
[2026-02-07T15:49:44.577Z] [BOT] 💾 Saved posted_jobs.json: 1372 active jobs
✅ Verified: Database file matches in-memory state
[2026-02-07T15:49:46.079Z] [BOT] 📍 [ROUTING] "iOS Engineering Intern - Native Streaming Clients Team 2026" @ verkada
[2026-02-07T15:49:46.080Z] [BOT] Category: TECH (matched: "engineer/engineering")
   Channel: 💻・tech-jobs (1462...4987)
[2026-02-07T15:49:46.308Z] [BOT] ✅ Posted message: iOS Engineering Intern - Native Streaming Clients Team 2026 @ verkada in #💻・tech-jobs
  ✅ Industry: iOS Engineering Intern - Native Streaming Clients Team 2026 @ verkada
[2026-02-07T15:49:46.309Z] [BOT] 💾 Added channel posting: iOS Engineering Intern - Native Streaming Clients Team 2026 @ verkada → category channel (1 total channels)
[2026-02-07T15:49:46.309Z] [BOT] 💾 BEFORE MERGE: 1373 jobs in memory (cached)
[2026-02-07T15:49:46.328Z] [BOT] ✅ Loaded V2 database: 1372 jobs
💾 DISK STATE: 1372 jobs on disk
[2026-02-07T15:49:46.328Z] [BOT] 💾 DEBUG: Iterating cached memory jobs - length=1373
[2026-02-07T15:49:46.331Z] [BOT] 💾 MERGE STATS: 1 new, 0 updated, 0 deep-merged, 0 skipped
[2026-02-07T15:49:46.331Z] [BOT] 💾 AFTER MERGE: 1373 jobs (merged disk + memory)
[2026-02-07T15:49:46.332Z] [BOT] ✅ No jobs to archive (all 1373 jobs within 7-day window)
[2026-02-07T15:49:46.395Z] [BOT] 💾 Saved posted_jobs.json: 1373 active jobs
✅ Verified: Database file matches in-memory state
[2026-02-07T15:49:50.899Z] [BOT] 🎉 Posting complete! Successfully posted: 10, Failed: 0
[2026-02-07T15:49:50.900Z] [BOT] 🔧 ID mismatch detected: URL-based "JID_f0a6e8f9..." not found, but found as SHA256 "644a0c39511d9ea2"
[2026-02-07T15:49:50.900Z] [BOT] ⏭️  Skipping duplicate: JID_944fc5fc (posted within 7 days)
[2026-02-07T15:49:50.901Z] [BOT] 🔧 ID mismatch detected: URL-based "JID_6394bff5..." not found, but found as SHA256 "18d1252f9544dd72"
⏭️  Skipping duplicate: JID_3a6be10c (posted within 7 days)
🔧 ID mismatch detected: URL-based "JID_fbd9d010..." not found, but found as SHA256 "4904985073c4cf33"
⏭️  Skipping duplicate: JID_6abb5708 (posted within 7 days)
🔧 ID mismatch detected: URL-based "JID_da41ab0c..." not found, but found as SHA256 "01fd2f089ddc6cf7"
[2026-02-07T15:49:50.901Z] [BOT] ⏭️  Skipping duplicate: JID_07c4733d (posted within 7 days)
[2026-02-07T15:49:50.901Z] [BOT] 🔧 ID mismatch detected: URL-based "JID_ddd7bef8..." not found, but found as SHA256 "a03eed6ec6392518"
[2026-02-07T15:49:50.901Z] [BOT] ⏭️  Skipping duplicate: JID_82a10467 (posted within 7 days)
[2026-02-07T15:49:50.901Z] [BOT] 🔧 ID mismatch detected: URL-based "JID_f0a6e8f9..." not found, but found as SHA256 "2654e2d72780d3a9"
[2026-02-07T15:49:50.902Z] [BOT] ⏭️  Skipping duplicate: JID_475692bb (posted within 7 days)
🔧 ID mismatch detected: URL-based "JID_fbd9d010..." not found, but found as SHA256 "cb83eb41b3723eab"
⏭️  Skipping duplicate: JID_6d6c0fd5 (posted within 7 days)
[2026-02-07T15:49:50.902Z] [BOT] 🔧 ID mismatch detected: URL-based "JID_6394bff5..." not found, but found as SHA256 "f962e0e756229bd2"
[2026-02-07T15:49:50.902Z] [BOT] ⏭️  Skipping duplicate: JID_7b14cd4a (posted within 7 days)
[2026-02-07T15:49:50.902Z] [BOT] 🔧 ID mismatch detected: URL-based "JID_f0a6e8f9..." not found, but found as SHA256 "3f47aa3be4bb6a19"
[2026-02-07T15:49:50.902Z] [BOT] ⏭️  Skipping duplicate: JID_0497e702 (posted within 7 days)
[2026-02-07T15:49:50.902Z] [BOT] 🔧 ID mismatch detected: URL-based "JID_f0a6e8f9..." not found, but found as SHA256 "e6d45ce2d85a72a6"
[2026-02-07T15:49:50.902Z] [BOT] ⏭️  Skipping duplicate: JID_8a91fea9 (posted within 7 days)
[2026-02-07T15:49:50.921Z] [BOT] ✅ Loaded pending queue: 351 total (321 pending, 30 enriched, 0 posted)
[2026-02-07T15:49:50.956Z] [BOT] ✅ Saved pending queue: 351 total (321 pending, 20 enriched, 10 posted)
📋 Updated queue: marked 10 jobs as posted
[2026-02-07T15:49:50.956Z] [BOT] ✅ All posting operations complete, cleaning up...
[2026-02-07T15:49:51.065Z] [BOT] 📂 Loaded 12661 existing routing entries
[2026-02-07T15:49:51.186Z] [BOT] 🔐 Encrypted routing log saved: /home/runner/work/New-Grad-Jobs-2026/New-Grad-Jobs-2026/.github/audit/routing-encrypted.json
   New entries: 10
   Total entries: 12671
   Timestamp: 2026-02-07T15:49:51.134Z
[2026-02-07T15:49:51.187Z] [BOT] 📝 Discord posting log saved: .github/logs/JID_303ba7bc.jsonl
   Total attempts: 32
[2026-02-07T15:49:51.187Z] [BOT] Successful: 10
   Failed: 0
   Skipped: 22
[2026-02-07T15:49:51.187Z] [BOT] 📊 CHANNEL STATS SINCE LAST CLEANUP:
[2026-02-07T15:49:51.188Z] [BOT] Last cleanup: Never
   Total posts: 10
   Channels used: 3
   Top channels:
     1. #💻・tech-jobs: 7 posts
     2. #💰・finance-jobs: 2 posts
     3. #🤖・ai-jobs: 1 posts
[STATS] Channel stats saved
💾 Saving posted jobs database...
💾 BEFORE MERGE: 1373 jobs in memory (cached)
[2026-02-07T15:49:51.207Z] [BOT] ✅ Loaded V2 database: 1373 jobs
💾 DISK STATE: 1373 jobs on disk
[2026-02-07T15:49:51.208Z] [BOT] 💾 DEBUG: Iterating cached memory jobs - length=1373
[2026-02-07T15:49:51.211Z] [BOT] 💾 MERGE STATS: 0 new, 0 updated, 0 deep-merged, 0 skipped
💾 AFTER MERGE: 1373 jobs (merged disk + memory)
[2026-02-07T15:49:51.212Z] [BOT] ✅ No jobs to archive (all 1373 jobs within 7-day window)
[2026-02-07T15:49:51.282Z] [BOT] 💾 Saved posted_jobs.json: 1373 active jobs
[2026-02-07T15:49:51.282Z] [BOT] ✅ Verified: Database file matches in-memory state
✅ Database saved successfully
[2026-02-07T15:49:53.299Z] 
========================================
```
## Errors Detected
- DISCORD_CLIENT_ID: ❌ Not set
- DISCORD_GUILD_ID: ❌ Not set
- [BOT ERROR] ⚠️ DISCORD_GUILD_ID not set
- [BOT ERROR] (node:2590) DeprecationWarning: The ready event has been renamed to clientReady to distinguish it from the gateway READY event and will only emit under that name in v15. Please use clientReady instead.
---
*Log sanitized for repository commit. Full logs available as GitHub Actions artifacts.*