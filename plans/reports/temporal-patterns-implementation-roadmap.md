# Temporal Patterns Implementation Roadmap for Mekong CLI

**Date:** 2026-03-01
**Status:** Planning Phase
**Target:** Improve Plan-Execute-Verify engine reliability via Temporal patterns

---

## Quick Reference: Temporal → Mekong Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│ TEMPORAL CONCEPT        │ MEKONG CLI EQUIVALENT               │
├─────────────────────────────────────────────────────────────────┤
│ Workflow (deterministic)│ Recipe Plan (pure orchestration)     │
│ Activity (non-det)      │ Execute Step (shell/LLM/API)        │
│ Worker (executor)       │ RecipeExecutor (processes steps)    │
│ Event History           │ ExecutionTrace (execution_trace.json)│
│ Retry Policy            │ Step-level retry config (YAML)      │
│ Determinism Constraint  │ No I/O in orchestration logic       │
│ Side Effect             │ Captured UUID/random wrappers       │
│ Child Workflow          │ Nested recipe execution             │
│ Continue-As-New         │ Batch processing with restart       │
│ Signal                  │ Runtime pause/resume/cancel         │
│ Heartbeat               │ Progress checkpoint every N seconds │
│ Compensation (Saga)     │ Step rollback on failure             │
│ Interceptor             │ Observability hooks (logging/trace) │
└─────────────────────────────────────────────────────────────────┘
```

---

## High-Impact Quick Wins (≤4 hours each)

### 1. Execution Trace Checkpointing (2 hours) — HIGHEST IMPACT

**Problem:** Crash mid-recipe → restart from step 1 (wasted work).

**Solution:** Save `execution_trace.json` after each step.

**Implementation:**

```python
# src/core/execution-trace-store.py
import json
from dataclasses import dataclass
from enum import Enum

class StepStatus(str, Enum):
    QUEUED = "queued"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class StepExecution:
    step_name: str
    status: StepStatus
    exit_code: int = None
    stdout: str = None
    stderr: str = None
    timestamp: float = None
    duration: float = None

class ExecutionTraceStore:
    """Temporal-inspired event history for CLI."""

    def __init__(self, path: str = "execution_trace.json"):
        self.path = path
        self.events: list[StepExecution] = self._load()

    def _load(self) -> list[StepExecution]:
        """Load existing trace or start fresh."""
        try:
            with open(self.path, "r") as f:
                data = json.load(f)
                return [StepExecution(**e) for e in data]
        except FileNotFoundError:
            return []

    def save(self):
        """Persist to disk (called after each step)."""
        with open(self.path, "w") as f:
            json.dump(
                [asdict(e) for e in self.events],
                f,
                indent=2,
            )

    def add_event(self, event: StepExecution):
        """Append step event."""
        self.events.append(event)
        self.save()

    def last_completed_step(self) -> int:
        """Find index to resume from."""
        for i in range(len(self.events) - 1, -1, -1):
            if self.events[i].status == StepStatus.COMPLETED:
                return i + 1
        return 0

# Usage in orchestrator.py
async def execute_recipe_with_checkpointing(recipe: Recipe):
    trace = ExecutionTraceStore()
    resume_from = trace.last_completed_step()

    for i, step in enumerate(recipe.steps[resume_from:], start=resume_from):
        trace.add_event(
            StepExecution(
                step_name=step.name,
                status=StepStatus.EXECUTING,
                timestamp=time.time(),
            )
        )

        try:
            result = await executor.execute(step)
            trace.add_event(
                StepExecution(
                    step_name=step.name,
                    status=StepStatus.COMPLETED,
                    exit_code=result.exit_code,
                    stdout=result.stdout,
                    stderr=result.stderr,
                    duration=result.duration,
                    timestamp=time.time(),
                )
            )
        except ExecutionFailure as e:
            trace.add_event(
                StepExecution(
                    step_name=step.name,
                    status=StepStatus.FAILED,
                    exit_code=e.exit_code,
                    stderr=str(e),
                    timestamp=time.time(),
                )
            )
            raise
```

**Benefit:** Crash at step 5 of 10 → resume from step 6 (no retry of 1-5).

**Effort:** 2 hours
**Files to modify:** `src/core/orchestrator.py`, `src/core/executor.py`
**Risk:** Low (JSON persistence is simple)

---

### 2. Exponential Backoff Retry Policies (3 hours) — MEDIUM IMPACT

**Problem:** Transient failures (network blip, temporary quota) fail immediately.

**Solution:** Configure retry per step with exponential backoff (1s → 2s → 4s → ...).

**Implementation:**

```yaml
# recipes/example.yaml
steps:
  - name: fetch-data
    exec: "curl https://api.example.com/data"
    retry:
      max_attempts: 5
      initial_interval_seconds: 1
      backoff_coefficient: 2.0
      max_interval_seconds: 60
      non_retryable_errors:
        - "InvalidInput"
        - "Unauthorized"

  - name: build
    exec: "npm run build"
    retry: null  # No retry
```

**Implementation in executor:**

```python
# src/core/executor-with-retries.py
from dataclasses import dataclass
import asyncio
import random

@dataclass
class RetryPolicy:
    max_attempts: int = 5
    initial_interval_seconds: float = 1.0
    backoff_coefficient: float = 2.0
    max_interval_seconds: float = 60.0
    non_retryable_errors: list[str] = None

async def execute_with_retries(
    step: Step, policy: RetryPolicy
) -> ExecutionResult:
    """Execute step with exponential backoff."""
    for attempt in range(policy.max_attempts):
        try:
            return await executor.execute(step)
        except ExecutionFailure as e:
            # Check if error is non-retryable
            if policy.non_retryable_errors and e.error_type in policy.non_retryable_errors:
                raise

            # Last attempt—fail
            if attempt == policy.max_attempts - 1:
                raise

            # Calculate backoff with jitter
            interval = min(
                policy.initial_interval_seconds * (policy.backoff_coefficient ** attempt),
                policy.max_interval_seconds,
            )
            jitter = random.uniform(0, interval * 0.1)  # ±10% jitter
            wait_time = interval + jitter

            logger.warning(
                f"Step {step.name} failed (attempt {attempt + 1}), "
                f"retrying in {wait_time:.2f}s"
            )
            await asyncio.sleep(wait_time)
```

**Benefit:** 80% reduction in manual retries for transient failures.

**Effort:** 3 hours
**Files to modify:** `src/core/executor.py`, recipe YAML schema
**Risk:** Medium (need to handle jitter correctly)

---

### 3. Step Compensation / Rollback on Failure (4 hours) — HIGH IMPACT

**Problem:** Failed plan leaves artifacts (git branches, built files, deployments).

**Solution:** Define compensation per step, execute in reverse on failure (Saga pattern).

**Implementation:**

```yaml
# recipes/deploy-with-rollback.yaml
steps:
  - name: build
    exec: "npm run build"
    compensation: "rm -rf dist/"

  - name: test
    exec: "npm test"
    compensation: null  # No cleanup needed

  - name: create-branch
    exec: "git checkout -b release/v1.0"
    compensation: "git checkout main && git branch -D release/v1.0"

  - name: deploy
    exec: "vercel --prod"
    compensation: "vercel --rollback"
```

**Implementation in orchestrator:**

```python
# src/core/orchestrator-with-compensation.py
@dataclass
class Step:
    name: str
    exec: str
    compensation: str = None
    retry: RetryPolicy = None

class RecipeOrchestrator:
    async def execute_with_compensation(self, recipe: Recipe):
        """Execute steps + rollback on failure (Saga pattern)."""
        completed_steps: list[Step] = []

        try:
            for step in recipe.steps:
                logger.info(f"Executing: {step.name}")
                result = await self._execute_with_retries(step)
                completed_steps.append(step)
                logger.info(f"Completed: {step.name}")

        except ExecutionFailure as e:
            logger.error(f"Step {e.step_name} failed, rolling back...")

            # Execute compensations in reverse order
            for step in reversed(completed_steps):
                if not step.compensation:
                    logger.info(f"No compensation for {step.name}")
                    continue

                logger.info(f"Compensating: {step.name}")
                try:
                    await executor.execute(
                        Step(name=f"{step.name}-compensation", exec=step.compensation)
                    )
                    logger.info(f"Compensation completed: {step.name}")
                except ExecutionFailure as comp_error:
                    logger.error(
                        f"Compensation failed for {step.name}: {comp_error}. "
                        f"Manual cleanup may be required."
                    )

            raise

    async def _execute_with_retries(self, step: Step) -> ExecutionResult:
        """Execute with retry policy."""
        policy = step.retry or RetryPolicy()
        return await execute_with_retries(step, policy)
```

**Benefit:** Clean failure states, no manual cleanup needed.

**Effort:** 4 hours
**Files to modify:** `src/core/orchestrator.py`, recipe YAML schema, Step dataclass
**Risk:** Medium (compensation order must be correct)

---

## Medium-Impact Improvements (0.5-1 day each)

### 4. Deterministic Plan Definition (4 hours)

**Problem:** LLM-generated plans are non-deterministic (may vary on replay).

**Solution:** Separate deterministic orchestration from non-deterministic planning.

**Current pattern:**
```python
# ❌ Problematic: LLM result not reproducible
def plan(goal: str) -> list[Step]:
    steps = llm_client.call("Decompose: " + goal)
    return parse_steps(steps)
```

**Improved pattern:**
```python
# ✅ Deterministic: Pure function
def plan(goal: str) -> list[Step]:
    """Deterministic orchestration—no I/O."""
    # Hardcoded or statically defined
    if goal.startswith("test"):
        return [
            Step(name="build", exec="npm run build"),
            Step(name="test", exec="npm test"),
        ]
    else:
        return [
            Step(name="build", exec="npm run build"),
        ]

# ✅ Non-deterministic wrapped in activity
async def plan_with_llm(goal: str) -> str:
    """Activity for LLM-based planning."""
    return await llm_client.generate_steps(goal)
```

**Benefit:** Plans are reproducible → deterministic recovery.

**Effort:** 4 hours (refactor `src/core/planner.py`)
**Risk:** Low (mostly reorganization)

---

### 5. Activity Heartbeating for Long Steps (6 hours)

**Problem:** Long-running commands (1h build) appear stuck; on crash, restart from step 1.

**Solution:** Emit heartbeat every N seconds, checkpoint progress.

**Implementation:**

```python
# src/core/executor-with-heartbeat.py
class ActivityContext:
    """Analog of Temporal activity.context()."""

    def __init__(self, step_name: str, heartbeat_interval: float = 5.0):
        self.step_name = step_name
        self.heartbeat_interval = heartbeat_interval
        self.last_heartbeat = time.time()
        self.checkpoint_data = {}

    async def heartbeat(self, details: dict = None):
        """Emit heartbeat with optional progress."""
        now = time.time()
        if now - self.last_heartbeat >= self.heartbeat_interval:
            logger.info(f"Heartbeat: {self.step_name} (progress: {details})")
            self.checkpoint_data = details or {}
            self.last_heartbeat = now

async def execute_with_heartbeat(
    step: Step, heartbeat_interval: float = 5.0
) -> ExecutionResult:
    """Execute subprocess with periodic heartbeat."""
    context = ActivityContext(step.name, heartbeat_interval)

    process = await asyncio.create_subprocess_shell(
        step.exec,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    stdout_data = b""
    stderr_data = b""

    while True:
        try:
            # Non-blocking read (timeout = heartbeat interval)
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), timeout=heartbeat_interval
            )
            stdout_data += stdout
            stderr_data += stderr
            break
        except asyncio.TimeoutError:
            # Still running—send heartbeat
            await context.heartbeat({"elapsed": time.time() - context.last_heartbeat})

    return ExecutionResult(
        exit_code=process.returncode,
        stdout=stdout_data.decode(),
        stderr=stderr_data.decode(),
    )
```

**Benefit:** Progress visibility for long jobs; resume with last checkpoint on crash.

**Effort:** 6 hours
**Files to modify:** `src/core/executor.py`, add `activity-context.py`
**Risk:** Medium (subprocess timeout handling can be tricky)

---

### 6. Parallel Step Execution (4 hours)

**Problem:** Sequential steps are slow; independent steps should run in parallel.

**Solution:** Use `asyncio.gather()` + Temporal-like child workflow pattern.

**Implementation:**

```yaml
# recipes/parallel-example.yaml
steps:
  - name: parallel-group
    type: parallel
    steps:
      - name: test-unit
        exec: "npm run test:unit"
      - name: test-integration
        exec: "npm run test:integration"
      - name: lint
        exec: "npm run lint"

  - name: deploy
    exec: "vercel --prod"
    dependencies: ["parallel-group"]  # Wait for all parallel to complete
```

**Implementation:**

```python
# src/core/orchestrator-parallel.py
async def execute_parallel_group(
    group: ParallelGroup,
) -> dict[str, ExecutionResult]:
    """Execute steps in parallel, wait for all."""
    tasks = [
        executor.execute(step)
        for step in group.steps
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    parallel_results = {}
    for step, result in zip(group.steps, results):
        if isinstance(result, Exception):
            parallel_results[step.name] = result
        else:
            parallel_results[step.name] = result

    # Check for failures
    failures = [r for r in results if isinstance(r, Exception)]
    if failures:
        raise ExecutionFailure(f"{len(failures)} parallel steps failed")

    return parallel_results
```

**Benefit:** 50%+ faster execution for independent steps.

**Effort:** 4 hours
**Files to modify:** `src/core/orchestrator.py`, recipe YAML schema
**Risk:** Low (asyncio.gather is standard)

---

## Advanced Patterns (1-2 days each)

### 7. Continue-As-New for Batch Processing

Process large datasets by restarting workflow.

```yaml
# recipes/batch-process.yaml
input:
  total_items: 10000
  batch_size: 100

steps:
  - name: fetch-batch
    exec: "python scripts/fetch-items.py --offset {{offset}} --limit {{batch_size}}"

  - name: process-batch
    exec: "python scripts/process.py --items batch.json"

  - name: check-more
    exec: "test {{offset}} -lt {{total_items}}"

  - name: continue-if-more
    type: continue_as_new
    condition: "{{ check_more.exit_code == 0 }}"
    next_input:
      offset: "{{ offset + batch_size }}"
```

**Benefit:** Unbounded iteration without event history explosion.

**Effort:** 8 hours
**Complexity:** High (requires recursive CLI invocation)

---

### 8. Message Passing (Signals/Queries/Updates)

Pause, resume, or query running recipes.

```python
# src/core/recipe-control.py
class RunningRecipe:
    """Handle for pausing/resuming/querying."""

    async def signal_pause(self):
        """Pause at next checkpoint."""
        # Write signal file
        Path(f"~/.mekong/signals/{self.run_id}").write_text("pause")

    async def signal_resume(self):
        """Resume from pause."""
        Path(f"~/.mekong/signals/{self.run_id}").write_text("resume")

    async def query_status(self) -> str:
        """Get current status."""
        trace = ExecutionTraceStore(self.trace_path)
        return trace.events[-1].status

# Usage
handle = await orchestrator.start_recipe(recipe)
await handle.signal_pause()  # Pause mid-execution
await handle.signal_resume()  # Resume
status = await handle.query_status()  # Check status
```

**Benefit:** Interactive control of long-running jobs.

**Effort:** 1 day
**Complexity:** Medium (file-based IPC)

---

## Testing Strategy

```python
# tests/test-execution-trace-recovery.py
@pytest.mark.asyncio
async def test_resume_from_checkpoint():
    """Verify checkpoint recovery."""
    recipe = Recipe(
        steps=[
            Step(name="step1", exec="echo 1"),
            Step(name="step2", exec="exit 1"),  # Fails
            Step(name="step3", exec="echo 3"),
        ]
    )

    # First run: step2 fails
    with pytest.raises(ExecutionFailure):
        await orchestrator.execute(recipe)

    # Verify trace shows step1 completed
    trace = ExecutionTraceStore()
    assert trace.events[0].status == StepStatus.COMPLETED
    assert trace.events[1].status == StepStatus.FAILED

    # Fix recipe: remove step2
    fixed_recipe = Recipe(steps=[recipe.steps[0], recipe.steps[2]])

    # Resume: should skip step1, run step3
    result = await orchestrator.execute(fixed_recipe)
    # Verify only step3 executed in second run
```

---

## Rollout Plan

**Phase 1 (Week 1):** Quick wins (checkpointing, retry, compensation)
- Commit hash: Per implementation
- Testing: Unit tests for each component

**Phase 2 (Week 2):** Medium patterns (determinism, heartbeat, parallel)
- Integration testing with sample recipes

**Phase 3 (Week 3+):** Advanced patterns (continue-as-new, signals, queries)
- Production rollout

---

## Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| **Recovery time on crash** | Restart from step 1 | Resume from last completed | Week 1 |
| **Transient failure handling** | Manual retry | Auto-retry with backoff | Week 1 |
| **Failed plan cleanup** | Manual | Auto-compensation | Week 1 |
| **Parallel execution** | 0% | 50% for independent steps | Week 2 |
| **Long job visibility** | None | Heartbeat every 5s | Week 2 |
| **Determinism score** | 60% | 90% plans | Week 2 |

---

## References

- **Full research:** `/Users/macbookprom1/mekong-cli/plans/reports/researcher-260301-1123-temporal-sdk-patterns.md`
- **Temporal Python Docs:** https://docs.temporal.io/develop/python
- **Temporal TypeScript Docs:** https://docs.temporal.io/develop/typescript
- **Temporal Samples:** https://github.com/temporalio/samples-python

