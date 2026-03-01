---
phase: 2
title: "DAG-Based Parallel Execution"
priority: P1
status: pending
effort: 8h
depends_on: [1]
---

# Phase 2: DAG-Based Parallel Execution

## Overview
Extend recipe schema to support dependency DAGs. Steps without mutual dependencies execute concurrently via `concurrent.futures.ThreadPoolExecutor`. Planner already emits `dependencies: []` arrays — orchestrator currently ignores them.

## Key Insights (from research)
- Planner generates `dependencies` field per task (planner.py:146-184) but orchestrator iterates sequentially (orchestrator.py:269)
- RecipeStep.params stores dependencies as `dependencies: [0, 1]` — indices into step list
- Circular dependency detection already exists in `validate_plan()` (planner.py:428-430)
- Orchestrator has no thread safety — `Console`, `telemetry`, `history` shared across steps

## Requirements

### Functional
- F1: `RecipeStep.dependencies` as first-class field (not buried in params)
- F2: DAG scheduler identifies ready steps (all deps satisfied) and runs them in parallel
- F3: Thread pool size configurable (default: `min(4, os.cpu_count())`)
- F4: Sequential fallback when `--sequential` flag passed or single-step recipe
- F5: Step failure cancels downstream dependents, not siblings

### Non-Functional
- NF1: Thread-safe telemetry and history recording
- NF2: Console output doesn't interleave (use per-step buffering)
- NF3: No asyncio dependency — use `concurrent.futures` (stdlib, Python 3.9+)

## Architecture

```python
# src/core/dag_scheduler.py (NEW — ~100 lines)
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict
import threading

class DAGScheduler:
    def __init__(self, steps: List[RecipeStep], max_workers: int = 4):
        self.steps = {s.order: s for s in steps}
        self.max_workers = max_workers
        self._completed = set()
        self._failed = set()
        self._lock = threading.Lock()

    def get_ready_steps(self) -> List[RecipeStep]:
        """Return steps whose dependencies are all completed."""
        ready = []
        for order, step in self.steps.items():
            deps = step.dependencies
            if order not in self._completed and order not in self._failed:
                if all(d in self._completed for d in deps):
                    ready.append(step)
        return ready

    def mark_completed(self, order: int): ...
    def mark_failed(self, order: int): ...
    def get_cancelled(self) -> List[int]:
        """Steps whose deps include a failed step.""" ...

    def execute_all(self, executor_fn) -> Dict[int, StepResult]:
        """Run DAG to completion using ThreadPoolExecutor."""
        results = {}
        with ThreadPoolExecutor(max_workers=self.max_workers) as pool:
            while not self.is_done():
                ready = self.get_ready_steps()
                futures = {pool.submit(executor_fn, s): s for s in ready}
                for future in as_completed(futures):
                    step = futures[future]
                    result = future.result()
                    results[step.order] = result
                    if result.verification.passed:
                        self.mark_completed(step.order)
                    else:
                        self.mark_failed(step.order)
        return results
```

## Related Code Files

### Modify
- `src/core/parser.py` — add `dependencies: List[int]` field to `RecipeStep`
- `src/core/planner.py` — set `step.dependencies` directly instead of params
- `src/core/orchestrator.py` — use `DAGScheduler` in `run_from_recipe()` when deps exist
- `src/core/telemetry.py` — add `threading.Lock` to `record_step()`

### Create
- `src/core/dag_scheduler.py` — DAG topological scheduler with ThreadPoolExecutor

### Delete
- None

## Implementation Steps

1. Add `dependencies: List[int] = field(default_factory=list)` to `RecipeStep` in parser.py
2. Update `RecipePlanner._build_recipe()` to set `step.dependencies` from task dicts
3. Create `src/core/dag_scheduler.py` with `DAGScheduler` class
4. Add `threading.Lock` to `TelemetryCollector.record_step()` and `ExecutionHistory.append()`
5. Update `RecipeOrchestrator.run_from_recipe()`:
   - Check if any step has non-empty dependencies
   - If yes → use `DAGScheduler.execute_all()`
   - If no → keep current sequential loop (backward compat)
6. Add `--sequential` flag to CLI cook/run commands
7. Create `tests/test_dag_scheduler.py` — test parallel execution, failure propagation, circular dep detection
8. Run full test suite

## Success Criteria
- [ ] Steps without mutual deps run concurrently (measurable via timing)
- [ ] Failed step cancels only downstream dependents
- [ ] Sequential mode still works with `--sequential`
- [ ] No console output interleaving
- [ ] All existing 62 tests pass + new DAG tests
- [ ] Circular dependency detected and rejected before execution

## Risk Assessment
- **Medium**: Thread safety for telemetry/history — mitigate with Lock
- **Medium**: Console interleaving — mitigate with per-step output buffering, flush after step completes
- **Low**: Backward compat — sequential fallback when no dependencies defined
- **Note**: `subprocess.run()` in executor is already thread-safe (separate processes)

## Todo
- [ ] Add dependencies field to RecipeStep
- [ ] Create dag_scheduler.py
- [ ] Thread-safe telemetry
- [ ] Update orchestrator with DAG path
- [ ] Add --sequential CLI flag
- [ ] Write DAG tests
- [ ] Integration test with parallel recipe
