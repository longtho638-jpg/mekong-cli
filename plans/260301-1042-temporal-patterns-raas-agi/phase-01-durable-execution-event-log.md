# Phase 1: Durable Execution Event Log

## Context Links
- [Temporal Core Architecture - Event Sourcing](research/researcher-01-temporal-core-architecture.md#1-workflow-engine)
- Current orchestrator: `src/core/orchestrator.py` (539 lines, no crash recovery)
- Current telemetry: `src/core/telemetry.py` (writes single trace file, overwritten each run)

## Overview
- **Priority:** P1 (highest -- foundation for phases 2, 3)
- **Status:** pending
- **Effort:** 2h
- **Description:** Add append-only JSON event log per recipe execution enabling crash recovery (resume from last successful step).

## Key Insights
- Temporal's core power: every action persisted to event history BEFORE execution. On crash, replay history to reconstruct state.
- mekong-cli currently loses ALL progress on crash. `orchestrator.py` has no checkpoint mechanism.
- We do NOT need full deterministic replay (Temporal's strict requirement). We need simpler: skip-completed-steps resume.
- Event log doubles as observability -- replaces the single-file telemetry trace with richer per-step event stream.

## Requirements

### Functional
- F1: Each `run_from_recipe()` call creates a unique execution log file
- F2: Before executing each step, write `STEP_SCHEDULED` event to log
- F3: After step completes, write `STEP_COMPLETED` or `STEP_FAILED` event with result
- F4: On `run_from_recipe()` start, check for existing incomplete log. If found, resume from last completed step.
- F5: Log file format: JSONL (one JSON object per line, append-friendly)

### Non-Functional
- NF1: Log writes must be fsync'd (crash-safe on disk)
- NF2: Max overhead per step: <5ms for log I/O
- NF3: Log files stored in `.mekong/execution-logs/` directory
- NF4: Old logs auto-pruned (keep last 50 executions)

## Architecture

### Event Schema
```python
@dataclass
class ExecutionEvent:
    event_type: str          # "EXECUTION_STARTED" | "STEP_SCHEDULED" | "STEP_COMPLETED" | "STEP_FAILED" | "EXECUTION_COMPLETED"
    execution_id: str        # UUID per run
    timestamp: float
    step_order: Optional[int]
    data: Dict[str, Any]     # step result, error info, etc.
```

### Event Flow
```
run_from_recipe(recipe)
  │
  ├─ Check for incomplete log with same recipe hash → RESUME if found
  │
  ├─ Write EXECUTION_STARTED {recipe_name, step_count, recipe_hash}
  │
  ├─ For each step:
  │   ├─ If step already completed in log → SKIP
  │   ├─ Write STEP_SCHEDULED {step_order, title}
  │   ├─ Execute step
  │   └─ Write STEP_COMPLETED or STEP_FAILED {exit_code, stdout_preview}
  │
  └─ Write EXECUTION_COMPLETED {status, completed_steps, failed_steps}
```

### Resume Logic
```
1. Hash recipe (name + step titles + step descriptions) → recipe_hash
2. Scan .mekong/execution-logs/ for files matching recipe_hash
3. If latest file has EXECUTION_STARTED but NO EXECUTION_COMPLETED:
   → Parse completed step_orders from STEP_COMPLETED events
   → Skip those steps in current run
   → Append to SAME log file (continuation)
4. Else: start fresh log
```

## Related Code Files

### Files to Create
- `src/core/execution-log.py` -- ExecutionEvent dataclass, ExecutionLog class (read/write/resume logic)

### Files to Modify
- `src/core/orchestrator.py` -- integrate ExecutionLog into `run_from_recipe()` and `run_from_goal()`
- `src/core/parser.py` -- add `recipe_hash()` property to Recipe dataclass

## Implementation Steps

1. Create `src/core/execution-log.py`:
   - `ExecutionEvent` dataclass with `to_json()` / `from_json()` methods
   - `ExecutionLog` class:
     - `__init__(log_dir, recipe_hash)` -- resolves or creates log file
     - `write_event(event)` -- append JSONL line + fsync
     - `get_completed_steps()` -- parse log, return set of completed step_orders
     - `is_incomplete()` -- has STARTED but no COMPLETED event
     - `prune_old_logs(keep=50)` -- delete oldest log files

2. Add `recipe_hash` property to `Recipe` in `parser.py`:
   - Hash from `name + sorted(step.title + step.description for step in steps)`
   - Use `hashlib.md5` (not security-critical, just identity)

3. Modify `orchestrator.py` `run_from_recipe()`:
   - Create `ExecutionLog` at start
   - Write `EXECUTION_STARTED` event
   - Before each step: check if step_order in completed set → skip
   - Write `STEP_SCHEDULED` before execute
   - Write `STEP_COMPLETED` / `STEP_FAILED` after execute
   - Write `EXECUTION_COMPLETED` at end
   - Pass execution_id to telemetry for correlation

4. Write tests in `tests/test_execution_log.py`

## Todo List
- [ ] Create `ExecutionEvent` dataclass
- [ ] Create `ExecutionLog` class with JSONL read/write
- [ ] Add `recipe_hash` to `Recipe`
- [ ] Integrate into `run_from_recipe()` -- write events
- [ ] Implement resume logic (skip completed steps)
- [ ] Add log pruning (keep last 50)
- [ ] Write unit tests
- [ ] Manual test: kill mid-execution, resume

## Success Criteria
- Crash mid-recipe → restart → resumes from last completed step
- Log files are valid JSONL, each line independently parseable
- No performance regression (log I/O < 5ms per step)
- Existing tests (62) still pass
- `run_from_recipe()` backward compatible (no signature change)

## Risk Assessment
- **Risk:** Log file corruption on hard crash mid-write
  - **Mitigation:** Each line is independent JSONL. Corrupt last line = ignored on parse. fsync after each write.
- **Risk:** Recipe changes between crash and resume (steps added/removed)
  - **Mitigation:** `recipe_hash` mismatch → fresh execution, no resume
- **Risk:** Log directory grows unbounded
  - **Mitigation:** `prune_old_logs(keep=50)` called on each new execution start

## Security Considerations
- Log files may contain stdout/stderr snippets. Truncate to 500 chars.
- No secrets in log events -- only step metadata and result codes.
- Logs stored in `.mekong/` (gitignored by convention).

## Next Steps
- Phase 2 builds on this: timeout events added to the log
- Phase 3 builds on this: compensation events added to the log
