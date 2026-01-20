# Planner Report: Refactor Phase 2

**ID:** planner-260120-1227-refactor-phase-2
**Date:** 2026-01-20

## Executive Summary

Codebase scan complete. Found **24 files exceeding 200-line limit** and **100+ Any type usages** in `antigravity/core/`.

Good news: The files specifically mentioned (`code_guardian/guardian.py`, `money_maker/engine.py`, `content_factory/engine.py`) are all under the limit. The `cli/` directory has zero Any types.

## Findings

### Files Exceeding 200 Lines

| Priority | Count | Line Range |
|----------|-------|------------|
| Critical (P0) | 5 | 250-289 |
| High (P1) | 10 | 220-248 |
| Medium (P2) | 9 | 200-220 |
| **Total** | **24** | - |

### Top 5 Offenders
1. `agent_swarm/engine.py` - 289 lines
2. `registry.py` - 261 lines
3. `control/analytics.py` - 257 lines
4. `checkpointing.py` - 254 lines
5. `algorithm/ml_engine.py` - 250 lines

### Type Safety

- `cli/` directory: **0 Any types** (clean)
- `antigravity/core/`: ~100+ Any usages
- Many are acceptable (persistence, ML models)
- ~30-40 could be improved with TypeVar, TypedDict

## Plan Created

**Location:** `/Users/macbookprom1/mekong-cli/plans/260120-refactor-phase-2/`

**Files:**
- `plan.md` - Overview and task list
- `phase-01-critical-modularization.md` - 5 P0 files
- `phase-02-high-priority-modularization.md` - 10 P1 files
- `phase-03-medium-priority-modularization.md` - 9 P2 files
- `phase-04-type-safety-audit.md` - Type improvements

## Effort Estimate

| Phase | Files | Effort |
|-------|-------|--------|
| Phase 1 (Critical) | 5 | 2h |
| Phase 2 (High) | 10 | 3h |
| Phase 3 (Medium) | 9 | 2h |
| Phase 4 (Types) | - | 1h |
| **Total** | **24** | **8h** |

## Recommendation

Proceed with Phase 1 (Critical) first. These 5 files are the worst offenders and provide the most value. Can be done in parallel by multiple developers.

## Unresolved Questions

1. Should we enforce 200-line limit via pre-commit hook?
2. Priority of type safety vs. file size reduction?
3. Any files that should be exempt from the limit?
