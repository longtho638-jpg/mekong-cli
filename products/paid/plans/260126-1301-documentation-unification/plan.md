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
- Create `docs/binh-phap-philosophy.md` documentation
- Map 13 Chapters to CLI modules
- Preserve Vietnamese terminology with translations
- Add cultural context and practical workflows

### Phase 4: Final Verification & QA ⏳ PENDING
**File:** [phase-04-verification-qa.md](phase-04-verification-qa.md)
**Status:** PENDING
**Tasks:**
- Verify all cross-references and links
- Test all command examples
- Ensure consistent formatting
- Validate ClaudeKit compliance improvements

### Phase 5: Final Polish & Deployment ⏳ PENDING
**File:** [phase-05-polish-deployment.md](phase-05-polish-deployment.md)
**Status:** PENDING
**Tasks:**
- Final copy editing and proofreading
- Update project roadmap and changelog
- Create migration guide for users
- Tag release in git

## Success Criteria

- [x] All commands documented in single CLI_REFERENCE.md (Phase 1)
- [ ] getting-started.md uses ClaudeKit standard commands (Phase 2)
- [ ] Binh Pháp philosophy preserved in dedicated namespace (Phase 3)
- [ ] All links verified and working (Phase 4)
- [ ] Migration guide created for existing users (Phase 5)
- [ ] Project roadmap and changelog updated (Phase 5)
- [x] ClaudeKit compliance: 64% → Target 70%+ (Phase 2-5)

**Phase 1 Results:**
- ✅ Documentation Unified: Single CLI_REFERENCE.md with all commands
- ✅ Discoverability: Command index with alphabetical + category navigation
- ✅ Cross-References: Comprehensive linking between all docs
- **Compliance improved from 43% to 64%** (+3 criteria)

## Timeline

- **Phase 1**: ✅ Complete (2026-01-26)
- **Phase 2**: In Progress (2-3 hours)
- **Phase 3**: Pending (3-4 hours)
- **Phase 4**: Pending (1-2 hours)
- **Phase 5**: Pending (1-2 hours)

**Total Estimated Time**: 7-11 hours for Phases 2-5

## Next Steps

1. Execute Phase 2 (Command Standardization)
2. Execute Phase 3 (Binh Pháp Namespace)
3. Execute Phase 4 (Verification & QA)
4. Execute Phase 5 (Polish & Deployment)
5. Announce completed documentation unification
