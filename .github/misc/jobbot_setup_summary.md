# Zapply Jobs Bot Setup & Fixes Summary

A comprehensive log of the end-to-end setup, issues encountered, and solutions applied while integrating a Discord bot to post new job listings from GitHub Actions.

---

## 1. Initial Webhook-Based Poster

* Originally, job updates were sent via a **Discord webhook** (in `post_to_discord.js`).
* **Limitations encountered**:

  * No threaded discussions for each job.
  * Limited formatting (raw URLs, no buttons).
  * Webhook posts were restricted to **Announcement** channels only.

---

## 2. Fetcher Script Enhancements (`advanced-job-fetcher.js`)

### 2.1. File-Based JSON Dump

* **Problem**: The bot poster needed a structured JSON file with new jobs.
* **Solution**: Inserted a `writeNewJobsJson()` helper:

  ```js
  const fs   = require('fs');
  const path = require('path');

  function writeNewJobsJson(jobs) {
    const dataDir = path.join(process.cwd(), '.github', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const outPath = path.join(dataDir, 'new_jobs.json');
    fs.writeFileSync(outPath, JSON.stringify(jobs, null, 2), 'utf8');
    console.log(`✨ Wrote ${jobs.length} new jobs to ${outPath}`);
  }
  ```
* **Integration Point**: Called `writeNewJobsJson(currentJobs);` immediately before rewriting `README.md`.

### 2.2. Code Cleanup & Structure

* **Removed** duplicate `fs.writeFileSync` blocks that referenced undefined variables.
* **Ensured** a single JSON dump and a single README update in the same run.
* **Wrapped** top-level logic in an **async IIFE** to allow `await` for all operations:

  ```js
  (async () => {
    // fetch, filter, dump JSON, update README
  })();
  ```
* **Eliminated** the placeholder `require('./yourHelpers')` since all helper functions (`fetchAllRealJobs`, `fetchInternshipData`, etc.) are declared in-file.

---

## 3. Bot Poster Conversion (`post_with_bot.js`)

### 3.1. Module Format Fix

* **Issue**: Original script used ESM `import` syntax, causing `SyntaxError` under Node18.
* **Action**: Converted entire file to **CommonJS**:

  ```js
  // from:
  import 'dotenv/config';
  import { Client, ... } from 'discord.js';

  // to:
  require('dotenv').config();  // later removed
  const { Client, ... } = require('discord.js');
  ```
* **Final**: Removed `dotenv` entirely, relying on GitHub Actions `env` for `DISCORD_TOKEN` and `DISCORD_CHANNEL_ID`.

### 3.2. Bot Logic

* **Functions**:

  * `buildJobEmbed(job)` → creates a rich `EmbedBuilder` with title, fields, tags.
  * `buildApplyButton(job)` → creates a link button using `ButtonBuilder`.
* **Runtime Flow**:

  1. **Login** to Discord with `client.login(TOKEN)`.
  2. **Read** `.github/data/new_jobs.json`.
  3. **For each** job:

     * `channel.send({ embeds: [...], components: [...] })`
     * `msg.startThread({ name: 'Discuss: …', autoArchiveDuration: 60 })`

---

## 4. GitHub Actions Workflow Updates

* **Workflow Name**: `Update Zapply Jobs`
* **Trigger**: `cron: '0 * * * *'`, `workflow_dispatch`, and `push` to `main` on specific script changes.

### 4.1. Steps Overview

1. **Checkout Repo** (`actions/checkout@v4`)
2. **Setup Node 18**
3. **Run Fetcher**: `node .github/scripts/advanced-job-fetcher.js` with `JSEARCH_API_KEY`
4. **Install Bot Dependencies**:

   ```yaml
   - name: Install bot dependencies
     working-directory: .github/scripts
     run: npm install discord.js@14
   ```
5. **Post via Bot**: `node .github/scripts/post_with_bot.js` with `DISCORD_TOKEN` & `DISCORD_CHANNEL_ID`
6. **Verify Changes** in `README.md`
7. **Commit & Push** if updated
8. **Generate Job Summary** in GitHub Steps Summary

---

## 5. Permission & Channel Configuration

### 5.1. Announcement Channel Issue

* **Error**: `DiscordAPIError[50013]: Missing Permissions` when posting embeds.
* **Cause**: Bots cannot post to **Announcement (News)** channels without `Manage Messages`.

### 5.2. Solution: Dedicated Text Channel

1. **Convert** existing channel to **Text Channel** (`Edit Channel → Overview → Text Channel`).
2. **@everyone** role: **Send Messages** ❌ (locks out manual posting).
3. **Bot Role**: **Send Messages**, **Embed Links**, **Create Public Threads** ✅.

*Outcome*: A write-protected, bot-only feed channel with threaded discussions.

---

**Result**: On every Action run, new jobs are fetched, saved as JSON, README is updated, and the bot posts sleek embeds with buttons and threads in the designated channel.  This document captures the whole process and decisions for future reference.
