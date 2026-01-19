# 10x Codebase Refactor Plan

---
title: "10x Codebase Refactor - Technical Debt Elimination"
description: "Comprehensive refactoring to eliminate technical debt and prepare AgencyOS for go-live"
status: pending
priority: P0
effort: 40h
branch: refactor/10x-cleanup
tags: [refactoring, technical-debt, go-live, architecture]
created: 2026-01-20
---

> **"Thang binh phat muu"** - Win through preparation, not firefighting.

## Overview

### Goals
1. Eliminate all .bak files and legacy code
2. Enforce 250-line max per file across all modules
3. Resolve 61 TODO/FIXME items
4. Align architecture with VIBE development rules
5. Prepare codebase for production deployment

### Scope
| Directory | Files Affected | Priority |
|-----------|----------------|----------|
| antigravity/core/ | 16+ large files | P0 |
| core/ | 20+ large files | P1 |
| backend/ | 5 large files | P1 |
| cli/ | Minor cleanup | P2 |
| scripts/legacy/ | 56 files to archive | P2 |

### Success Criteria
- [ ] Zero .bak files in codebase
- [ ] All Python files <= 250 lines
- [ ] All TODO/FIXME items resolved or documented
- [ ] 100% test pass rate maintained
- [ ] CI/CD pipeline green

---

## Phase 1: Cleanup (4h)

**Objective:** Remove dead code, backup files, and deprecated items.

### 1.1 Remove .bak Files

| File | Action |
|------|--------|
| `.claude/scripts/gemini-bridge.cjs.bak` | Delete |
| `antigravity/core/control_enhanced.py.bak` | Delete |
| `antigravity/core/knowledge_graph.py.bak` | Delete |
| `antigravity/core/agent_chains.py.bak` | Delete |
| `antigravity/core/money_maker.py.bak` | Delete |

```bash
# Execution command
rm -f /Users/macbookprom1/mekong-cli/.claude/scripts/gemini-bridge.cjs.bak
rm -f /Users/macbookprom1/mekong-cli/antigravity/core/*.bak
```

### 1.2 Archive Legacy Scripts

| Directory | Action |
|-----------|--------|
| `scripts/legacy/` (56 files) | Move to `archive/legacy-scripts-260120/` |
| `scripts/legacy/agentops-mvp/` | Evaluate for extraction to core/ |

```bash
mkdir -p archive/legacy-scripts-260120
mv scripts/legacy/* archive/legacy-scripts-260120/
```

### 1.3 Clean Git Status

| Item | Action |
|------|--------|
| `cli/commands/ops.py` | Restore or remove from tracking |
| `external/vibe-kanban` | Update submodule |
| `mekong-docs` | Update submodule |

### Success Criteria - Phase 1
- [ ] Zero .bak files (`find . -name "*.bak" | wc -l` = 0)
- [ ] Legacy scripts archived
- [ ] Clean git status (no untracked .bak files)

---

## Phase 2: antigravity/core/ Refactoring (16h)

**Objective:** Split all files exceeding 250 lines into modular components.

### 2.1 Critical Files (>500 lines)

| File | Lines | Split Strategy |
|------|-------|----------------|
| `algorithm_enhanced.py` | 853 | Split into `algorithm/` module with 4 files |
| `ab_testing_engine.py` | 731 | Split into `ab_testing/` module with 3 files |
| `ml_optimizer.py` | 670 | Split into `ml/` module with 3 files |

#### algorithm_enhanced.py (853 lines) -> algorithm/
```
antigravity/core/algorithm/
  __init__.py           # Exports
  base.py               # Base classes (~100 lines)
  scoring.py            # Scoring algorithms (~150 lines)
  optimization.py       # Optimization logic (~200 lines)
  strategies.py         # Strategy patterns (~200 lines)
  utils.py              # Helper functions (~100 lines)
```

#### ab_testing_engine.py (731 lines) -> ab_testing/
```
antigravity/core/ab_testing/
  __init__.py           # Exports
  engine.py             # Core engine (~150 lines)
  experiments.py        # Experiment management (~200 lines)
  analysis.py           # Statistical analysis (~200 lines)
  reporting.py          # Reports generation (~150 lines)
```

#### ml_optimizer.py (670 lines) -> ml/
```
antigravity/core/ml/
  __init__.py           # Exports
  optimizer.py          # Main optimizer (~150 lines)
  models.py             # ML models (~200 lines)
  training.py           # Training logic (~150 lines)
  inference.py          # Inference pipeline (~150 lines)
```

### 2.2 High Priority Files (350-500 lines)

| File | Lines | Action |
|------|-------|--------|
| `revenue_ai.py` | 445 | Split: engine + strategies + reporting |
| `agent_swarm.py` | 418 | Split: coordinator + workers + messaging |
| `tracing.py` | 400 | Split: tracer + exporters + formatters |
| `self_improve.py` | 394 | Split: analyzer + improver + metrics |
| `observability.py` | 375 | Split: metrics + logging + alerts |
| `code_guardian.py` | 371 | Split: scanner + rules + reporter |

### 2.3 Medium Priority Files (250-350 lines)

| File | Lines | Action |
|------|-------|--------|
| `cashflow_engine.py` | 312 | Extract calculations to utils |
| `algorithm.py` | 305 | Merge into algorithm/ module |
| `control.py` | 291 | Already has control/ module - consolidate |
| `registry.py` | 261 | Extract validators |
| `proposal_generator.py` | 257 | Extract templates |
| `agent_crews.py` | 257 | Extract crew definitions |
| `checkpointing.py` | 254 | Extract storage backends |

### Existing Modular Directories (Verify)
```
antigravity/core/
  chains/       # Already modularized
  config/       # Already modularized
  control/      # Already modularized
  finance/      # Already modularized
  knowledge/    # Already modularized
```

### Success Criteria - Phase 2
- [ ] All files in antigravity/core/ <= 250 lines
- [ ] New modules have __init__.py with clean exports
- [ ] All imports updated across codebase
- [ ] Tests pass after refactoring

---

## Phase 3: cli/ Refactoring (4h)

**Objective:** Clean command structure, ensure consistency.

### Current State Analysis

| File | Lines | Status |
|------|-------|--------|
| `bridge.py` | 153 | OK (under 250) |
| `outreach.py` | 138 | OK |
| `sales.py` | 128 | OK |
| `ops_commands.py` | 125 | OK |
| `setup.py` | 95 | OK |
| `finance.py` | 94 | OK |
| `mcp.py` | 79 | OK |
| `vibe.py` | 67 | OK |

### Actions Required

1. **Restore ops.py**
   - Currently deleted (`D cli/commands/ops.py`)
   - Decision: Restore or confirm removal

2. **Consolidate Overlapping Commands**
   - `ops_commands.py` vs `ops/` directory
   - Evaluate redundancy

3. **Standardize Command Structure**
   - All commands should follow same pattern
   - Add proper docstrings
   - Ensure error handling consistency

### Success Criteria - Phase 3
- [ ] All CLI commands documented
- [ ] Consistent error handling
- [ ] No orphaned command files

---

## Phase 4: core/ Refactoring (8h)

**Objective:** Modularize business logic modules exceeding 250 lines.

### 4.1 Critical Files (>400 lines)

| File | Lines | Split Strategy |
|------|-------|----------------|
| `security/env_manager.py` | 584 | Split: loader + validator + rotator |
| `security/validate_phase2_fixes.py` | 524 | Split: validators + fixers + reporters |

### 4.2 High Priority Files (300-400 lines)

| File | Lines | Action |
|------|-------|--------|
| `repositories/client_portal_repository.py` | 388 | Split CRUD operations |
| `repositories/analytics_repository.py` | 372 | Split by domain |
| `hr/career_development.py` | 369 | Split: paths + skills + assessments |
| `finance/investor_relations.py` | 363 | Split: reports + communications |
| `ops/network.py` | 360 | Split: monitoring + diagnostics |
| `services/analytics_service.py` | 338 | Split by analytics type |
| `hr/talent_acquisition.py` | 334 | Split: sourcing + screening |
| `modules/content/services.py` | 332 | Split by content type |
| `portal/client_portal.py` | 331 | Split: views + actions |
| `finance/term_sheet.py` | 329 | Split: parser + analyzer |
| `agents/personas/ciso.py` | 327 | Extract security rules |
| `services/client_portal_service.py` | 318 | Split: core + helpers |
| `security/auth_middleware.py` | 312 | Split: auth + session |
| `outreach/call_center.py` | 304 | Split: dialer + scripts |
| `analytics/analytics.py` | 298 | Split: collectors + aggregators |
| `memory/memory.py` | 288 | Split: store + retrieval |
| `licensing/generator.py` | 284 | Split: generator + validator |
| `finance/cash_flow.py` | 281 | Split: forecasting + reporting |

### Success Criteria - Phase 4
- [ ] All files in core/ <= 250 lines
- [ ] Clean module boundaries
- [ ] No circular imports

---

## Phase 5: backend/ Refactoring (4h)

**Objective:** Clean API layer and ensure consistent structure.

### Files to Refactor

| File | Lines | Action |
|------|-------|--------|
| `api/tunnel.py` | 406 | Split: handlers + protocols + utils |
| `tests/test_viral_tracing.py` | 270 | Split test cases |
| `services/agentops_service.py` | 265 | Extract agent operations |
| `routes/antigravity.py` | 258 | Split route handlers |
| `main.py` | 250 | Extract middleware setup |

### Directory Structure Optimization
```
backend/
  api/
    middleware/     # Already exists
    handlers/       # NEW: Extract from tunnel.py
    protocols/      # NEW: Protocol implementations
  services/
    agentops/       # NEW: Split agentops_service.py
```

### Success Criteria - Phase 5
- [ ] All backend files <= 250 lines
- [ ] Clean API layer structure
- [ ] Consistent route naming

---

## Phase 6: Architecture Alignment (2h)

**Objective:** Sync .claude/ rules with actual codebase structure.

### Actions

1. **Update .claude/rules/**
   - Verify all rules match current architecture
   - Update file references

2. **Sync Config Precedence**
   - Validate `.claude/config/precedence.md`
   - Ensure no conflicts

3. **Update Documentation**
   - `docs/system-architecture.md`
   - `docs/codebase-summary.md`

### Success Criteria - Phase 6
- [ ] All .claude/ rules accurate
- [ ] Documentation matches code
- [ ] No stale references

---

## Phase 7: Testing & Validation (2h)

**Objective:** Ensure all refactoring maintains functionality.

### Validation Steps

1. **Run Full Test Suite**
```bash
pytest --tb=short -v
npm test --prefix apps/dashboard
```

2. **Linting & Type Checking**
```bash
ruff check .
mypy antigravity/ core/ backend/
```

3. **Line Count Verification**
```bash
find . -name "*.py" -exec wc -l {} \; | awk '$1 > 250 {print}'
```

4. **Import Validation**
```bash
python -c "import antigravity; import core; import backend"
```

### Success Criteria - Phase 7
- [ ] All tests pass
- [ ] No lint errors
- [ ] No files > 250 lines
- [ ] All imports work

---

## Execution Order

| Phase | Depends On | Estimated Time |
|-------|------------|----------------|
| Phase 1: Cleanup | None | 4h |
| Phase 2: antigravity/core/ | Phase 1 | 16h |
| Phase 3: cli/ | Phase 1 | 4h |
| Phase 4: core/ | Phase 1 | 8h |
| Phase 5: backend/ | Phase 1 | 4h |
| Phase 6: Architecture | Phase 2-5 | 2h |
| Phase 7: Validation | Phase 6 | 2h |

**Total Estimated Effort:** 40 hours

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking imports | High | High | Run tests after each file split |
| Missing edge cases | Medium | Medium | Keep refactoring atomic |
| Submodule conflicts | Low | Low | Update submodules first |

---

## Rollback Plan

1. Each phase committed separately with clear message
2. Feature branch: `refactor/10x-cleanup`
3. PR review before merge to main
4. Tag before refactor: `pre-refactor-260120`

---

## TODO/FIXME Resolution Plan

| Location | Count | Action |
|----------|-------|--------|
| `scripts/legacy/` | 12 | Archive (moved to legacy) |
| `backend/agents/` | 8 | Review and fix |
| `core/` | 8 | Review and fix |
| `.agencyos/skills/` | 8 | Review and fix |
| Other | 25 | Triage individually |

Priority: Fix after modularization to avoid duplicate work.

---

## Next Steps

1. [ ] Create feature branch `refactor/10x-cleanup`
2. [ ] Tag current state `pre-refactor-260120`
3. [ ] Begin Phase 1: Cleanup
4. [ ] Daily progress updates in `plans/reports/`

---

> **WIN-WIN-WIN Check:**
> - Owner: Clean, maintainable codebase for faster feature delivery
> - Agency: Reduced technical debt, easier onboarding
> - Client: More stable, production-ready product
