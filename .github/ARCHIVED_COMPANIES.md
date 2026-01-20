# Archived Companies

**Last Updated:** 2026-01-20

This file tracks companies that have been removed from our job fetching system and **should NOT be re-added**.

---

## Dead YC Startups (Removed 2026-01-20)

The following Y Combinator startups were removed because their Greenhouse boards no longer exist (404 errors):

### Acquired Companies
- **PlanGrid** (`plangrid`) - Acquired by Autodesk in 2018
  - Website: http://plangrid.com
  - Greenhouse board: Not found
  - Reason: Company integrated into Autodesk, no separate careers page

### Defunct Companies
- **iCracked** (`icracked`) - Shut down
  - Website: http://icracked.com
  - Greenhouse board: Not found
  - Reason: Company ceased operations

- **42Floors** (`42floors`) - Shut down
  - Website: http://42floors.com
  - Greenhouse board: Not found
  - Reason: Company ceased operations

- **WireOver** (`wireover`) - Shut down
  - Website: http://wireover.com
  - Greenhouse board: Not found
  - Reason: Company ceased operations

- **The Muse** (`the-muse`) - Greenhouse board removed
  - Website: http://themuse.com
  - Greenhouse board: Not found
  - Reason: May have switched ATS providers or shut down hiring

- **SendHub** (`sendhub`) - Shut down
  - Website: http://sendhub.com
  - Greenhouse board: Not found
  - Reason: Company ceased operations

- **Hipmob** (`hipmob`) - Shut down
  - Website: http://hipmob.com
  - Greenhouse board: Not found
  - Reason: Company ceased operations

- **MyVR** (`myvr`) - Status unknown
  - Website: http://myvr.com
  - Greenhouse board: Not found
  - Reason: Greenhouse board no longer active

- **HireArt** (`hireart`) - Status unknown
  - Website: http://hireart.com
  - Greenhouse board: Not found
  - Reason: Greenhouse board no longer active

- **Amiato** (`amiato`) - Shut down
  - Website: http://amiato.com
  - Greenhouse board: Not found
  - Reason: Company ceased operations

- **Medigram** (`medigram`) - Acquired
  - Website: http://medigram.com
  - Greenhouse board: Not found
  - Reason: Acquired by Klick Health

- **Couple** (`couple`) - Shut down
  - Website: http://couple.me
  - Greenhouse board: Not found
  - Reason: App discontinued in 2016

- **HackPad** (`hackpad`) - Acquired by Dropbox
  - Website: http://hackpad.com
  - Greenhouse board: Not found
  - Reason: Acquired by Dropbox in 2014, service shut down in 2017

- **Rescale** (`rescale`) - Greenhouse board removed
  - Website: http://rescale.com
  - Greenhouse board: Not found
  - Reason: May have switched ATS providers or paused hiring

- **SlidePay** (`slidepay`) - Shut down
  - Website: http://slidepay.com
  - Greenhouse board: Not found
  - Reason: Company ceased operations

- **Tap to Learn** (`tap-to-learn`) - Shut down
  - Website: http://taptolearn.com
  - Greenhouse board: Not found
  - Reason: Company ceased operations

---

## Files Modified

Removed from:
- `.github/scripts/job-fetcher/sources/company-list.json`
- `.github/scripts/job-fetcher/sources/yc-discovered.json`

---

## Why We Don't Re-Add These

1. **No active career pages** - These companies don't have job boards
2. **Wasted API calls** - Fetching returns 404 errors every run
3. **Log pollution** - Warning messages clutter workflow logs
4. **No hiring activity** - Dead companies don't post jobs

---

## Before Re-Adding Any Company

1. Verify the company still exists and is hiring
2. Check their Greenhouse board manually: `https://boards.greenhouse.io/SLUG`
3. Confirm they have new grad or entry-level positions
4. Update this file if status changes
