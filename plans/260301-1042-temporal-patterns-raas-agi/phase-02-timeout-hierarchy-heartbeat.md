# Phase 2: Timeout Hierarchy & Heartbeat

## Context Links
- [Temporal Activity System](research/researcher-01-temporal-core-architecture.md#2-activity-system)
- [Temporal Failure Handling](research/researcher-02-temporal-advanced-patterns.md#6-failure-handling)
- Current executor: `src/core/executor.py` (302 lines, flat retry with single timeout)

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 1.5h
- **Description:** Replace flat subprocess timeout with Temporal-inspired timeout hierarchy. Add heartbeat mechanism for long-running LLM steps.

## Key Insights
- Temporal defines 4 timeout layers: `ScheduleToStart`, `StartToClose`, `ScheduleToClose`, `HeartbeatTimeout`
- mekong-cli executor currently has NO timeout on shell steps (uses subprocess default) and no heartbeat
- LLM calls via Antigravity Proxy can hang indefinitely -- no detection mechanism
- Heartbeat enables stuck-detection without waiting for full timeout to expire
- Non-retryable errors (bad prompt, auth failure) should fail fast, not exhaust retries

## Requirements

### Functional
- F1: Each RecipeStep can define timeout config: `schedule_to_start`, `start_to_close`, `heartbeat_interval`
- F2: Shell steps default: `start_to_close=120s` (currently no timeout)
- F3: LLM steps default: `start_to_close=300s`, `heartbeat_interval=30s`
- F4: API steps default: `start_to_close=60s`
- F5: Heartbeat for LLM steps: if no output progress for `heartbeat_interval` → cancel and retry
- F6: Non-retryable error classification: `AuthenticationError`, `InvalidPromptError` → fail immediately

### Non-Functional
- NF1: Heartbeat check runs in separate thread (non-blocking)
- NF2: Zero new dependencies (use stdlib `threading.Timer`)
- NF3: Timeout config mergeable from step.params (override defaults)

## Architecture

### Timeout Config Model
```python
@dataclass
class ActivityTimeout:
    start_to_close: float = 120.0     # Max execution time (seconds)
    heartbeat_interval: float = 0.0   # 0 = disabled. Time between heartbeat checks.
    schedule_to_close: float = 0.0    # 0 = disabled. Total budget including retries.

# Defaults per step type
TIMEOUT_DEFAULTS = {
    "shell": ActivityTimeout(start_to_close=120.0),
    "llm":   ActivityTimeout(start_to_close=300.0, heartbeat_interval=30.0),
    "api":   ActivityTimeout(start_to_close=60.0),
}
```

### Heartbeat Mechanism (LLM steps)
```
Thread 1 (main):  Execute LLM call, write stdout chunks to shared buffer
Thread 2 (timer): Every heartbeat_interval, check if buffer grew since last check
                   If no growth → set cancellation flag → main thread raises TimeoutError
```

### Non-Retryable Error Registry
```python
NON_RETRYABLE_ERRORS = [
    "authentication",      # API key invalid
    "content_policy",      # Content moderation block
    "invalid_model",       # Model not found
    "rate_limit_exceeded", # Different from transient 429 -- account-level block
]
```

### Integration with Executor
```
executor.execute_step(step)
  │
  ├─ Resolve timeout config: step.params.get("timeout") merged with TIMEOUT_DEFAULTS[step_type]
  │
  ├─ Shell: subprocess.run(timeout=start_to_close)
  │
  ├─ LLM:  Start heartbeat timer thread
  │         Execute LLM call with start_to_close deadline
  │         Heartbeat monitors response progress
  │         Cancel on heartbeat stall or total timeout
  │
  ├─ API:  requests.request(timeout=start_to_close)
  │
  └─ On failure: check if error matches NON_RETRYABLE → skip retry, return immediately
```

## Related Code Files

### Files to Create
- `src/core/activity-timeout.py` -- ActivityTimeout dataclass, HeartbeatMonitor class, NonRetryableError classification

### Files to Modify
- `src/core/executor.py` -- integrate timeout config resolution, heartbeat for LLM, non-retryable check
- `src/core/parser.py` -- no change needed (step.params already supports arbitrary keys)

## Implementation Steps

1. Create `src/core/activity-timeout.py`:
   - `ActivityTimeout` dataclass with defaults
   - `TIMEOUT_DEFAULTS` dict keyed by step type
   - `resolve_timeout(step_type, step_params)` -- merge step-level overrides with defaults
   - `HeartbeatMonitor` class:
     - `__init__(interval, on_stall_callback)`
     - `heartbeat()` -- called by main thread to signal progress
     - `start()` / `stop()` -- timer thread lifecycle
   - `is_non_retryable(error_str)` -- check against NON_RETRYABLE_ERRORS patterns

2. Modify `executor.py` `_execute_shell_step()`:
   - Replace hardcoded `subprocess.run()` with `timeout=resolved_timeout.start_to_close`

3. Modify `executor.py` `_execute_llm_step()`:
   - Create `HeartbeatMonitor` if `heartbeat_interval > 0`
   - Call `monitor.heartbeat()` on each response chunk (if streaming) or on response receipt
   - Wrap in try/except for `HeartbeatStallError`

4. Modify `executor.py` shell retry loop:
   - After catching error, check `is_non_retryable(stderr)` → break retry loop immediately

5. Add `schedule_to_close` budget tracking in `orchestrator.py`:
   - Track cumulative step time. If `schedule_to_close` exceeded → abort remaining steps.

6. Write tests in `tests/test_activity_timeout.py`

## Todo List
- [ ] Create `ActivityTimeout` dataclass + defaults
- [ ] Implement `resolve_timeout()` merger
- [ ] Implement `HeartbeatMonitor` with threading.Timer
- [ ] Implement `is_non_retryable()` classifier
- [ ] Update `_execute_shell_step()` with resolved timeout
- [ ] Update `_execute_llm_step()` with heartbeat monitor
- [ ] Add non-retryable short-circuit to retry loop
- [ ] Write unit tests
- [ ] Integration test: LLM step with simulated hang

## Success Criteria
- Shell steps timeout at 120s instead of running forever
- LLM steps detect stall within 30s heartbeat window
- Non-retryable errors (auth, content policy) fail immediately without retry
- Existing 62 tests still pass
- No new dependencies added

## Risk Assessment
- **Risk:** Heartbeat timer thread not cleaned up on exception
  - **Mitigation:** Use context manager (`with HeartbeatMonitor(...) as hb:`) to guarantee cleanup
- **Risk:** Aggressive timeouts kill legitimately slow steps
  - **Mitigation:** Defaults are generous (120s shell, 300s LLM). Step-level params can override.
- **Risk:** Thread safety between heartbeat monitor and main thread
  - **Mitigation:** Use `threading.Event` for cancellation flag (thread-safe by design)

## Security Considerations
- Timeout values from step.params must be validated (positive numbers, max 3600s)
- HeartbeatMonitor must not leak process references after stop()

## Next Steps
- Phase 1's execution log records timeout events for post-mortem analysis
- Timeout config can be extended with `schedule_to_start` for task queue wait time (Phase 5)
