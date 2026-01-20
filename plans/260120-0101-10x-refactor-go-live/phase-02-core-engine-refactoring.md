---
title: "Phase 2: Core Engine Refactoring"
description: "Modularize antigravity/core critical files"
status: pending
priority: P0
effort: 12h
phase: 2
---

# Phase 2: Core Engine Refactoring

> Systematic modularization of `antigravity/core` - the heart of AgencyOS.

## Context Links

- Phase 1: `./phase-01-architecture-alignment.md`
- Core directory: `/antigravity/core/`
- Existing splits: `/antigravity/core/quota/`, `/antigravity/core/chains/`

## Overview

**Priority:** P0 - Core business logic
**Current Status:** pending
**Description:** Split 7 critical files in `antigravity/core` to sub-modules.

## Key Insights

1. **Existing modular work proves viability** - `quota/` already split successfully
2. **High coupling between files** - algorithm + ml_optimizer + ab_testing share concepts
3. **Agent-related files cluster** - swarm, orchestrator, crews can share base
4. **Revenue domain clear** - revenue_ai, cashflow_engine, money_maker related

## Requirements

### Functional
- Split each file > 200 LOC into sub-modules
- Maintain all existing functionality
- Preserve public API surface

### Non-Functional
- Each sub-module < 200 LOC
- Clear single responsibility
- Testable in isolation

## Target Files (Priority Order)

| File | LOC | Target Directory | Estimated Modules |
|------|-----|------------------|-------------------|
| `algorithm_enhanced.py` | 853 | `algorithm/` | 5-6 modules |
| `ab_testing_engine.py` | 731 | `ab_testing/` | 4-5 modules |
| `ml_optimizer.py` | 670 | `ml/` | 4-5 modules |
| `revenue_ai.py` | 445 | `revenue/` | 3 modules |
| `agent_swarm.py` | 418 | `swarm/` | 3 modules |
| `tracing.py` | 400 | `tracing/` | 2-3 modules |
| `self_improve.py` | 394 | (inline or keep) | evaluate |

## Architecture

### 2.1 Algorithm Module Split

```
antigravity/core/algorithm/
  __init__.py           # Re-export facade
  base.py               # BaseAlgorithm class
  enhanced.py           # EnhancedAlgorithm class
  optimizer.py          # Optimization strategies
  validator.py          # Validation logic
  utilities.py          # Helper functions
  types.py              # Type definitions, enums
```

**Split Strategy:**
1. Extract base class and interfaces -> `base.py`
2. Keep enhanced logic -> `enhanced.py`
3. Move optimization methods -> `optimizer.py`
4. Extract validation -> `validator.py`

### 2.2 AB Testing Module Split

```
antigravity/core/ab_testing/
  __init__.py           # Re-export facade
  engine.py             # Core ABTestingEngine class
  experiments.py        # Experiment configuration
  variations.py         # Variation management
  analysis.py           # Statistical analysis
  reporting.py          # Results reporting
```

**Split Strategy:**
1. Core engine class (reduced) -> `engine.py`
2. Experiment CRUD -> `experiments.py`
3. Variation logic -> `variations.py`
4. Stats calculations -> `analysis.py`

### 2.3 ML Module Split

```
antigravity/core/ml/
  __init__.py           # Already exists
  optimizer.py          # Main optimizer (slim)
  models.py             # Already exists (327 LOC - needs split)
  training.py           # Training pipeline
  inference.py          # Inference engine
  preprocessing.py      # Data preprocessing
  evaluation.py         # Model evaluation
```

### 2.4 Revenue Module Split

```
antigravity/core/revenue/
  __init__.py
  ai.py                 # AI-powered revenue features
  forecasting.py        # Revenue forecasting
  optimization.py       # Revenue optimization
```

### 2.5 Swarm Module Split

```
antigravity/core/swarm/
  __init__.py
  coordinator.py        # Swarm coordination
  agents.py             # Agent definitions
  communication.py      # Inter-agent communication
```

## Implementation Steps

### Batch 1: Highest Priority (853-731 LOC)
1. [ ] Create `algorithm/` directory structure
2. [ ] Split `algorithm_enhanced.py` into 5 modules
3. [ ] Update imports throughout codebase
4. [ ] Run tests, fix failures
5. [ ] Create `ab_testing/` directory structure
6. [ ] Split `ab_testing_engine.py` into 4 modules
7. [ ] Update imports, run tests

### Batch 2: High Priority (670-445 LOC)
8. [ ] Split remaining `ml/` modules (training, inference)
9. [ ] Create `revenue/` directory structure
10. [ ] Split `revenue_ai.py` into 3 modules
11. [ ] Run tests, verify functionality

### Batch 3: Medium Priority (418-394 LOC)
12. [ ] Create `swarm/` directory structure
13. [ ] Split `agent_swarm.py` into 3 modules
14. [ ] Evaluate `self_improve.py` - split or inline
15. [ ] Split `tracing.py` into tracing/ modules

### Batch 4: Cleanup
16. [ ] Update all `__init__.py` with proper exports
17. [ ] Add deprecation warnings to old facades
18. [ ] Update documentation
19. [ ] Final test run

## Todo List

- [ ] `algorithm_enhanced.py` split (853 LOC)
- [ ] `ab_testing_engine.py` split (731 LOC)
- [ ] `ml_optimizer.py` split (670 LOC)
- [ ] `revenue_ai.py` split (445 LOC)
- [ ] `agent_swarm.py` split (418 LOC)
- [ ] `tracing.py` split (400 LOC)
- [ ] `self_improve.py` evaluation (394 LOC)
- [ ] Import updates across codebase
- [ ] Test suite verification

## Success Criteria

- [ ] All 7 target files < 200 LOC (via modularization)
- [ ] Zero import errors
- [ ] All existing tests pass
- [ ] No public API changes
- [ ] Each module has clear responsibility

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Circular imports | High | Careful dependency ordering |
| Missing exports | Medium | Comprehensive `__init__.py` |
| Test coverage gaps | Medium | Add integration tests |
| Performance regression | Low | Benchmark before/after |

## Security Considerations

- ML models may contain sensitive config - review
- Revenue data handling must remain secure
- No credential extraction during refactor

## Next Steps

After Phase 2:
- Phase 3: Security & Infrastructure Refactoring
- Focus on `core/security/` and `antigravity/infrastructure/`
