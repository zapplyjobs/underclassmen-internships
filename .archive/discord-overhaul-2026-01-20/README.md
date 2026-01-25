# Archived Code - Discord Overhaul 2026-01-20

## Summary

This directory contains code removed during the Discord text channels overhaul.

**Date:** 2026-01-20
**Reason:** Switched from forum channels to text channels, removed duplicate code and redundant features

---

## Files Archived

### 1. `buildJobMessage.js`
**Original location:** `.github/scripts/src/discord/poster.js`
**Removed in commit:** 6966fe01d
**Reason:** Switched from text+embed to embed-only messages

**What it did:** Built the text message content that displayed alongside embeds, creating duplicate information.

**Why removed:** Discord messages were showing the same job twice (once as text, once as embed). Removed text to avoid redundancy.

---

### 2. `duplicate-functions.js`
**Original location:** `.github/scripts/enhanced-discord-bot.js` (lines 266-348)
**Removed in commits:** 96b645371, 9216af01b
**Reason:** Functions were imported from poster.js but also declared locally, causing SyntaxError

**What it contained:**
- `generateTags()` - 83 lines - Tag generation for job posts
- `buildJobEmbed()` - 52 lines - Discord embed builder
- `buildActionRow()` - 17 lines - Action button builder

**Why removed:** All three functions were already imported from `poster.js` on line 27. The local declarations created duplicate identifiers, causing:
```
SyntaxError: Identifier 'generateTags' has already been declared
SyntaxError: Identifier 'buildJobEmbed' has already been declared
```

---

## How to Restore

If you need to restore any of this code:

1. **buildJobMessage:** Copy function to `poster.js` and add to `module.exports`
2. **Duplicate functions:** These still exist in `poster.js` - just remove the imports from enhanced-discord-bot.js if you want local versions

---

## Related Commits

- `f131ba2e4` - Discord overhaul initial deployment (failed)
- `96b645371` - Fix: remove duplicate generateTags
- `9216af01b` - Fix: remove duplicate buildJobEmbed and buildActionRow
- `2d23e6a73` - Fix: dataManager → postedJobsManager
- `6966fe01d` - Fix: remove text message, use embed only

---

## Context

**Problem:** Discord forum channels have 1,000 active thread limit per server
**Solution:** Switched to text channels (unlimited messages)
**Side effect:** Code cleanup revealed duplicate functions and redundant features
**Result:** 4 bugs fixed, 164+ lines of duplicate code removed

---

**Preserved:** 2026-01-20
**Accessible at:** `.archive/discord-overhaul-2026-01-20/`
