# Engineering: Performance Optimization Analysis — Mekong CLI v5.0

## Command: /review
## Date: 2026-03-11

---

## Source File: src/core/orchestrator.py (1022 lines)

Orchestrator is the largest file in src/core/ and the central bottleneck for all PEV executions.
31 methods (def + async def) in 1022 lines. File exceeds 200-line limit by 5x.

---

## Identified Performance Bottlenecks

### 1. SSE Polling Loop — O(N) per 500ms (gateway.py:326)
```python
await asyncio.sleep(0.5)  # Poll for new events
```
- Every active stream polls MISSION_STORE every 500ms
- 100 concurrent streams = 200 wake-ups/sec on single event loop
- Fix: asyncio.Queue per mission_id; push events instead of polling

### 2. Synchronous subprocess in execute_and_verify (orchestrator.py, executor.py)
- `RecipeExecutor._execute_shell_step()` uses `subprocess.run()` with blocking I/O
- Blocks async event loop when shell steps run
- Orchestrator calls `executor.execute_step()` synchronously from within async context
- Fix: wrap in `loop.run_in_executor()` or use `asyncio.create_subprocess_exec()`

### 3. No Step-Level Parallelism Despite DAG Support
- `DAGScheduler` and `validate_dag` are imported (orchestrator.py:30)
- DAG scheduler exists but steps default to sequential execution
- Parallel-eligible steps (no dependencies) still run one at a time
- Fix: identify parallel batches from DAG topology and execute concurrently

### 4. LLM Self-Healing Call — Synchronous Blocking (orchestrator.py:168)
```python
corrected = self.llm_client.generate(prompt).strip()
```
- `generate()` is a synchronous HTTP call inside execute_and_verify
- Blocks event loop for LLM roundtrip (300ms–2s)
- Fix: use `asyncio.get_event_loop().run_in_executor()` or async LLM client

### 5. Reflection.get_strategy_suggestion — Try/Pass Anti-Pattern (orchestrator.py:143-151)
```python
try:
    reflection_hint = self._reflection.get_strategy_suggestion(...)
except Exception:
    pass
```
- Silent exception swallowing hides failures
- No timing metrics on reflection lookup
- If reflection is slow, adds latency to every failed step

### 6. Memory Import on Every Orchestration (orchestrator.py imports MemoryStore)
- MemoryStore instance created fresh per orchestration cycle
- No singleton or connection pool reuse
- Fix: singleton pattern with lazy init

### 7. Telemetry.record_step — Called Per Step With No Batching
- telemetry.record_step() called in execute_and_verify after every step
- If telemetry backend is remote, N steps = N synchronous write calls
- Fix: batch telemetry writes with flush at end of orchestration

### 8. Rich Console Overhead in CI/Production
- `Console()` instance created per `StepExecutor`, `RollbackHandler`, and `Orchestrator`
- Rich does ANSI detection and terminal capability checks on init
- In headless/CI environment, these are wasted allocations
- Fix: singleton Console with `force_terminal=False` detection

---

## File Size Violation
- orchestrator.py = 1022 lines (limit: 200)
- Recommendation: split into:
  - `step_executor.py` (execute_and_verify, self-healing)
  - `rollback_handler.py` (RollbackHandler class)
  - `workflow_runner.py` (main orchestration loop)
  - `orchestrator.py` (thin coordinator, <200 lines)

---

## Import Analysis
- `subprocess` imported but orchestrator delegates execution to RecipeExecutor
- `shlex` imported — used in executor, not orchestrator itself (possible unused)
- `uuid` used for generating workflow IDs — minimal overhead
- `SmartRouter`, `SwarmRegistry`, `VectorMemoryStore` all imported — heavy init chain

---

## Benchmark Targets (Based on CLAUDE.md Spec)
| Metric | Target | Estimated Current |
|--------|--------|--------------------|
| Build time | < 10s | Unknown |
| LCP | < 2.5s | N/A (CLI) |
| Cold start | < 100ms | ~300-500ms (imports) |
| Step execution overhead | < 10ms | ~50ms (subprocess spawn) |

---

## Quick Wins
1. Add `asyncio.run_in_executor` around all subprocess.run calls — unblocks event loop
2. Replace SSE polling with asyncio.Queue — 10x better throughput
3. Create Console singleton — saves ~3 allocations per execution
4. Batch telemetry writes — reduces I/O calls by N steps
5. Add `__slots__` to StepResult dataclass — reduces per-step memory

---

## Long-Term Refactor
- Split orchestrator.py into 4 focused files (each <200 lines)
- Implement true async execution pipeline end-to-end
- Add execution time tracking per step with P95/P99 metrics
- Profile with `py-spy` on realistic 10-step workflow to confirm bottlenecks

