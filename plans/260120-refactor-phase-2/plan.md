---
title: "Refactor Phase 2: Eliminate Remaining Technical Debt"
description: "Modularize 24 files exceeding 200 lines and improve type safety across antigravity/core"
status: pending
priority: P1
effort: 8h
branch: refactor/phase-2-modularization
tags: [refactoring, technical-debt, type-safety, vibe]
created: 2026-01-20
---

# Refactor Phase 2: Eliminate Remaining Technical Debt

> Modularize 24 files exceeding 200-line limit and reduce Any type usage.

## Scan Summary

| Metric | Before | Target |
|--------|--------|--------|
| Files > 200 lines | 24 | 0 |
| Any type usages | ~100+ | Minimize to essential only |
| cli/ Any types | 0 | 0 (already clean) |

## Files Requiring Modularization (by priority)

### Critical (>250 lines) - 5 files
| File | Lines | Priority |
|------|-------|----------|
| `agent_swarm/engine.py` | 289 | P0 |
| `registry.py` | 261 | P0 |
| `control/analytics.py` | 257 | P0 |
| `checkpointing.py` | 254 | P0 |
| `algorithm/ml_engine.py` | 250 | P0 |

### High Priority (220-250 lines) - 9 files
| File | Lines | Priority |
|------|-------|----------|
| `hooks_manager.py` | 248 | P1 |
| `control/circuit_breaker.py` | 248 | P1 |
| `ml/inference.py` | 246 | P1 |
| `vibe_workflow.py` | 239 | P1 |
| `control/feature_flags.py` | 236 | P1 |
| `agent_memory/system.py` | 236 | P1 |
| `autonomous_mode.py` | 234 | P1 |
| `knowledge/search_engine.py` | 230 | P1 |
| `ml/optimizer.py` | 227 | P1 |
| `loyalty_rewards.py` | 222 | P1 |

### Medium Priority (200-220 lines) - 10 files
| File | Lines | Priority |
|------|-------|----------|
| `control/enhanced.py` | 220 | P2 |
| `coding_level.py` | 220 | P2 |
| `knowledge/graph.py` | 215 | P2 |
| `swarm/coordinator.py` | 214 | P2 |
| `telemetry.py` | 211 | P2 |
| `knowledge/entity_extractor.py` | 211 | P2 |
| `algorithm/core.py` | 205 | P2 |
| `control/center.py` | 201 | P2 |
| `ab_testing/experiments.py` | 201 | P2 |

## Files Checked (Already Clean)

| File | Lines | Status |
|------|-------|--------|
| `code_guardian/guardian.py` | 176 | OK |
| `money_maker/engine.py` | 105 | OK |
| `content_factory/engine.py` | 81 | OK |
| All cli/*.py files | <160 | OK |

## Execution Phases

- [ ] Phase 1: Critical Files (P0) - 5 files, ~2h
- [ ] Phase 2: High Priority Files (P1) - 10 files, ~3h
- [ ] Phase 3: Medium Priority Files (P2) - 9 files, ~2h
- [ ] Phase 4: Type Safety Audit - ~1h

## Phase Details

See individual phase files:
- `phase-01-critical-modularization.md`
- `phase-02-high-priority-modularization.md`
- `phase-03-medium-priority-modularization.md`
- `phase-04-type-safety-audit.md`

## Success Criteria

1. All Python files in `antigravity/core` are under 200 lines
2. Any types reduced to essential uses only (persistence, ML models)
3. All tests pass after refactoring
4. No regressions in functionality

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking imports | High | Update all imports, run tests |
| Circular dependencies | Medium | Extract interfaces first |
| Test failures | Medium | Run tests after each file |

---

Report: `/Users/macbookprom1/mekong-cli/plans/reports/planner-260120-1227-refactor-phase-2.md`
