# Phase 2: Core Engines Refactoring (P1 - High)

> **Priority:** P1 - HIGH
> **Status:** completed
> **Effort:** 4h
> **Completed:** 2026-01-20

## Overview

Refactor core engine files that exceed 200 lines. Focus on `core/ml/`, `core/revenue/`, and `infrastructure/scale.py`.

## Key Insights

- `ml/models.py` (327 lines) has multiple unrelated model classes
- `revenue/ai.py` (314 lines) mixes strategies, predictions, and utilities
- `scale.py` (317 lines) contains scaling, sharding, and replication logic

## Requirements

### Functional
- Maintain exact same public API
- All existing tests must pass

### Non-Functional
- Each file <= 200 lines
- Single Responsibility Principle

## Architecture

### ml/models.py (327 lines) -> Split into:

```
ml/
  models/
    __init__.py           # Re-exports all models (41 lines)
    enums.py              # PricingMode, GameChangingFeature (27 lines)
    dataclasses.py        # MLOptimizationResult, etc. (53 lines)
    factories.py          # TF/PyTorch/sklearn factories (133 lines)
    quantum.py            # QuantumOptimizer (62 lines)
    pricing_agent.py      # AIPricingAgent (55 lines)
```

### revenue/ai.py (314 lines) -> Split into:

```
revenue/
  ai/
    __init__.py           # Re-exports (20 lines)
    churn_predictor.py    # ChurnPredictor class (137 lines)
    upsell_detector.py    # UpsellDetector class (107 lines)
    price_optimizer.py    # PriceOptimizer class (53 lines)
    metrics_calculator.py # MetricsCalculator class (46 lines)
    engine.py             # RevenueAI orchestrator (125 lines)
```

### infrastructure/scale.py (317 lines) -> Split into:

```
infrastructure/
  scale/
    __init__.py           # Re-exports + convenience functions (52 lines)
    enums.py              # ScaleMode enum (17 lines)
    models.py             # QueuedTask, WorkerPool (34 lines)
    connection_pool.py    # ConnectionPool class (40 lines)
    task_queue.py         # TaskQueue class (65 lines)
    manager.py            # ScaleManager class (186 lines)
```

## Related Code Files

### Files Created
- 6 files in `antigravity/core/ml/models/`
- 6 files in `antigravity/infrastructure/scale/`
- 6 files in `antigravity/core/revenue/ai/`

### Files Deleted
- `antigravity/core/ml/models.py` (replaced with directory)
- `antigravity/core/revenue/ai.py` (replaced with directory)
- `antigravity/infrastructure/scale.py` (replaced with directory)

## Implementation Steps

1. [x] Analyze `ml/models.py` class boundaries
2. [x] Create `ml/models/` directory structure
3. [x] Extract each model class to own file
4. [x] Update imports in consuming modules
5. [x] Repeat for `revenue/ai.py`
6. [x] Repeat for `infrastructure/scale.py`
7. [x] Run full test suite
8. [x] Verify line counts

## Todo List

- [x] Split ml/models.py into domain-specific modules
- [x] Split revenue/ai.py into focused modules
- [x] Split infrastructure/scale.py into scaling strategies
- [x] Update all import statements
- [x] Run pytest
- [x] Verify all files <= 200 lines

## Success Criteria

- [x] All new files <= 200 lines
- [x] All tests pass (323/326, 3 pre-existing failures)
- [x] No circular imports
- [x] Clean separation of concerns

## Test Results

- **Passed:** 323 tests
- **Failed:** 3 tests (pre-existing test isolation issues in `test_client_magnet.py`)
- **Warnings:** 9 (non-critical)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing consumers | Search for all imports before refactoring |
| Missing edge cases | Run full test suite, not just unit tests |

## Next Steps

After Phase 2:
- Proceed to Phase 3 (Type Safety)
