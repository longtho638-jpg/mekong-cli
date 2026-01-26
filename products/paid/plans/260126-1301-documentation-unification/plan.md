# Documentation Unification - ClaudeKit Command Style

**Created:** 2026-01-26 13:01
**Status:** IN_PROGRESS
**Priority:** HIGH

## Overview

Unify all documentation to use ClaudeKit /command style consistently based on command consistency analysis findings.

## Background

Analysis identified 3 competing paradigms:
1. `mekong` CLI (Vietnamese naming)
2. Slash commands (`/cook`, `/quote`, `/win3`)
3. `cc` module system (`cc revenue`, `cc sales`)

**Goal:** Standardize to ClaudeKit conventions while preserving Binh Pháp cultural identity.

## Phases

### Phase 1: Documentation Consolidation ✅ COMPLETE
**File:** [phase-01-consolidate-commands.md](phase-01-consolidate-commands.md)
**Status:** COMPLETE
**Completed:** 2026-01-26
**Tasks:**
- ✅ Merged all commands into single CLI_REFERENCE.md
- ✅ Added cross-references from getting-started.md
- ✅ Created command index (alphabetical + by category)
- ✅ Documented command equivalences (slash → module)

**Deliverables:**
- Updated `docs/CLI_REFERENCE.md` (1823 lines) with all slash and mekong commands
- Created `docs/command-index.md` (420 lines) with comprehensive indexing
- Updated `docs/getting-started.md` (178 lines) with cross-references
- Created `verification-report.md` documenting 100% coverage

**Verification:** See [verification-report.md](verification-report.md)

### Phase 2: Command Standardization ⏳ PENDING
**File:** [phase-02-standardize-commands.md](phase-02-standardize-commands.md)
**Status:** PENDING
**Tasks:**
- Update getting-started.md to use standard commands
- Add deprecation warnings for old commands
- Create migration guide (old → new)
- Update all code examples

### Phase 3: Binh Pháp Namespace ⏳ PENDING
**File:** [phase-03-binh-phap-namespace.md](phase-03-binh-phap-namespace.md)
**Status:** PENDING
**Tasks:**
- Create `claude binh-phap` namespace documentation
- Map 13 Chapters to CLI modules
- Preserve Vietnamese terminology in dedicated namespace
- Add cultural context documentation

## Success Criteria

- [x] All commands documented in single CLI_REFERENCE.md
- [ ] getting-started.md uses ClaudeKit standard commands (Phase 2)
- [ ] Binh Pháp philosophy preserved in dedicated namespace (Phase 3)
- [ ] Migration guide created for existing users (Phase 2)
- [x] ClaudeKit compliance: 64% (7/11 criteria met after Phase 1)

**Phase 1 Results:**
- ✅ Documentation Unified: Single CLI_REFERENCE.md with all commands
- ✅ Discoverability: Command index with alphabetical + category navigation
- ✅ Cross-References: Comprehensive linking between all docs
- **Compliance improved from 43% to 64%** (+3 criteria)

## Next Steps

After Phase 1:
1. Review with team
2. Begin Phase 2 (Command Standardization)
3. Implement alias system for backward compatibility
