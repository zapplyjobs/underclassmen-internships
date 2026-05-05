# Documentation Standard - New-Grad-Jobs-2026

**Created:** 2026-02-10
**Purpose:** Single source of truth for documentation structure
**Status:** CANONICAL - All docs must follow this structure

---

## Documentation Hierarchy (3 Tiers)

### Tier 1: Primary (MUST exist)
**Location:** Repository root
- `README.md` - Job board display for users
- `.github/QUICK-REFERENCE.md` - Fast lookup for common operations

### Tier 2: Technical Reference (as needed)
**Location:** `.github/scripts/docs/`
- `LOGGING_STANDARDS.md` - How to use structured logging
- `CONFIGURATION_MANAGEMENT.md` - Environment variables and config
- `ERROR_HANDLING_STANDARDS.md` - Error handling patterns

### Tier 3: Code Documentation (inline)
**Location:** Within code files
- JSDoc comments for functions
- Inline comments for complex logic
- README.md in subdirectories (if needed)

---

## What NOT to Document

**Delete/Archive these patterns:**
- ❌ Duplicate information across multiple files
- ❌ Architecture diagrams (Claude can explain from code)
- ❌ Step-by-step tutorials (code + JSDoc is enough)
- ❌ Historical changelogs (use git history)
- ❌ Migration guides after migration complete
- ❌ Audit reports after issues resolved

---

## Documentation Update Rules

### When to Update
1. **API changes** - Update affected docs immediately
2. **Configuration changes** - Update CONFIGURATION_MANAGEMENT.md
3. **New patterns** - Add to relevant standards doc
4. **Bug fixes** - NO need to document (git commit message is enough)

### When to Delete
1. **Information is outdated** - Delete or archive
2. **Duplicates another doc** - Consolidate to single source
3. **Never referenced** - Check git history, delete if unused
4. **Migration/audit complete** - Archive to `.archive/`

---

## Single Source of Truth (SSOT) Principle

**Each concept has ONE canonical location:**

| Concept | Canonical Location | Alternative Locations |
|---------|-------------------|----------------------|
| Job board display | `README.md` | None |
| Quick operations | `.github/QUICK-REFERENCE.md` | None |
| Logging usage | `.github/scripts/docs/LOGGING_STANDARDS.md` | JSDoc in logger.js |
| Configuration | `.github/scripts/docs/CONFIGURATION_MANAGEMENT.md` | .env.example |
| Error handling | `.github/scripts/docs/ERROR_HANDLING_STANDARDS.md` | Code examples |
| Workflow execution | Code + inline comments | NONE (no separate doc) |
| Architecture | Code structure | NONE (Claude explains) |

**Rule:** If information exists in 2+ places, delete all but the canonical version.

---

## Current Documentation Audit (2026-02-10)

### Files to KEEP
- ✅ `README.md` - Job board display
- ✅ `.github/QUICK-REFERENCE.md` - Operations reference
- ✅ `.github/scripts/docs/LOGGING_STANDARDS.md` - Logging patterns
- ✅ `.github/scripts/docs/CONFIGURATION_MANAGEMENT.md` - Config reference
- ✅ `.github/scripts/docs/ERROR_HANDLING_STANDARDS.md` - Error patterns

### Files to ARCHIVE (move to `.archive/`)
- 📦 `BOARD_TYPES_MIGRATION_GUIDE.md` - Migration complete
- 📦 `INTEGRATION_GUIDE.md` - Replaced by QUICK-REFERENCE
- 📦 `IMPROVED-BOT-SETUP.md` - Bot already set up
- 📦 `BUG_FIXES.md` - Historical, use git log instead
- 📦 `AUDIT_REPORT.md` - Audit complete
- 📦 `COMPREHENSIVE_TEST_PLAN.md` - Not being used

### Files to DELETE (redundant/unused)
- ❌ `INDEX.md` - Redundant with QUICK-REFERENCE.md
- ❌ `ENCRYPTED_LOGGING_SETUP.md` - Already documented in LOGGING_STANDARDS.md

---

## Documentation Creation Checklist

Before creating ANY new documentation file:

1. [ ] Does it pass the 4-test framework? (DOCUMENTATION_METHODOLOGY.md)
   - Actual need NOW?
   - Can't be generated on-demand?
   - Immediate value (<10 sec lookup)?
   - Sustainable maintenance?

2. [ ] Is there already a doc for this concept?
   - Check SSOT table above
   - Search existing docs

3. [ ] Where should it live?
   - Tier 1 (root), Tier 2 (docs/), or Tier 3 (inline)?

4. [ ] Who will maintain it?
   - Auto-generated? Code-driven?
   - Manual updates needed?

5. [ ] What's the deletion criteria?
   - When is this doc no longer needed?
   - How will we know to archive it?

**If ANY checkbox fails, DON'T create the doc.**

---

## Maintenance Schedule

### Weekly (automated)
- README.md updated by workflow

### Monthly (manual)
- Review `.github/scripts/docs/` for outdated info
- Check for duplicate information
- Archive completed migration/audit docs

### Quarterly (manual)
- Full documentation audit
- Apply 4-test framework to all docs
- Delete/archive unused docs

---

## Version History

- **2026-02-10:** Initial documentation standard created
- Apply SSOT principle to prevent bloat
- 3-tier hierarchy established

---

**Next Review:** 2026-03-10
