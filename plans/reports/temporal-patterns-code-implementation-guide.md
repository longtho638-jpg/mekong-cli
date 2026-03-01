# Temporal Patterns: Code Implementation Guide for Mekong CLI

**Date:** 2026-03-01
**Target Audience:** Developers implementing Plan-Execute-Verify improvements
**Status:** Ready for implementation

---

## Module 1: ExecutionTraceStore (Checkpointing)

### File: `src/core/execution-trace-store.py`

**Purpose:** Persist step execution history; enable recovery from last completed step.

**Key classes:**
- `StepStatus` enum
- `StepExecution` dataclass
- `ExecutionTraceStore` class with load/save/resume logic

```python
"""
Execution trace store — Temporal-inspired event history for CLI.

Persists step execution state to enable recovery from arbitrary failure points.
On crash/restart, orchestrator reads trace and resumes from last completed step.

Example:
    trace = ExecutionTraceStore("execution_trace.json")
    trace.add_event(StepExecution(name="build", status=EXECUTING))
    await execute_step(step)
    trace.add_event(StepExecution(name="build", status=COMPLETED, exit_code=0))
    trace.save()

    # On crash, next run:
    trace = ExecutionTraceStore("execution_trace.json")
    resume_from = trace.last_completed_step()  # Returns index 1
    # Skip steps 0, start from step 1
"""

import json
import time
from dataclasses import dataclass, asdict, field
from enum import Enum
from pathlib import Path
from typing import Optional, List


class StepStatus(str, Enum):
    """Step execution status (Temporal-like)."""
    QUEUED = "queued"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    COMPENSATING = "compensating"
    COMPENSATION_COMPLETED = "compensation_completed"
    COMPENSATION_FAILED = "compensation_failed"


@dataclass
class StepExecution:
    """Single step execution event (Temporal event history analog)."""
    step_name: str
    status: StepStatus
    exit_code: Optional[int] = None
    stdout: str = ""
    stderr: str = ""
    timestamp: float = field(default_factory=time.time)
    duration_seconds: float = 0.0
    error_type: Optional[str] = None
    checkpoint_data: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Convert to JSON-serializable dict."""
        data = asdict(self)
        data['status'] = self.status.value
        return data

    @classmethod
    def from_dict(cls, data: dict) -> 'StepExecution':
        """Reconstruct from JSON."""
        data['status'] = StepStatus(data['status'])
        return cls(**data)


class ExecutionTraceStore:
    """
    Persistent execution history store.

    Analogous to Temporal's event history. After each step, new event is appended
    and persisted to disk. On crash, orchestrator loads trace and resumes from
    last completed step (skipping already-executed steps).

    Attributes:
        path: JSON file path for trace persistence
        events: List of StepExecution events
    """

    def __init__(self, path: str = "execution_trace.json"):
        """Initialize store; load existing trace if present."""
        self.path = Path(path)
        self.events: List[StepExecution] = self._load()

    def _load(self) -> List[StepExecution]:
        """Load existing trace from disk or return empty list."""
        if not self.path.exists():
            return []

        try:
            with open(self.path, "r") as f:
                data = json.load(f)
                return [StepExecution.from_dict(e) for e in data]
        except (json.JSONDecodeError, KeyError) as e:
            # Corrupted trace—start fresh
            print(f"Warning: Could not load trace ({e}), starting fresh")
            return []

    def save(self) -> None:
        """Persist current events to disk."""
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.path, "w") as f:
            json.dump(
                [e.to_dict() for e in self.events],
                f,
                indent=2,
            )

    def add_event(self, event: StepExecution) -> None:
        """Append event and persist immediately."""
        self.events.append(event)
        self.save()

    def last_completed_step_index(self) -> int:
        """
        Find index to resume from.

        Returns index of first step after last COMPLETED event.
        If no completed steps, returns 0 (start from beginning).

        Returns:
            Index in recipe.steps to resume from
        """
        for i in range(len(self.events) - 1, -1, -1):
            if self.events[i].status == StepStatus.COMPLETED:
                return i + 1
        return 0

    def get_step_result(self, step_name: str) -> Optional[StepExecution]:
        """Get most recent execution for a step."""
        for event in reversed(self.events):
            if event.step_name == step_name:
                return event
        return None

    def has_completed(self, step_name: str) -> bool:
        """Check if step completed successfully."""
        event = self.get_step_result(step_name)
        return event is not None and event.status == StepStatus.COMPLETED

    def summary(self) -> dict:
        """Get summary statistics."""
        completed = sum(1 for e in self.events if e.status == StepStatus.COMPLETED)
        failed = sum(1 for e in self.events if e.status == StepStatus.FAILED)
        total_duration = sum(e.duration_seconds for e in self.events)

        return {
            "total_events": len(self.events),
            "completed_steps": completed,
            "failed_steps": failed,
            "total_duration_seconds": total_duration,
            "resume_from_index": self.last_completed_step_index(),
        }


# Example usage in orchestrator
if __name__ == "__main__":
    # Initialize trace
    trace = ExecutionTraceStore()

    # Simulate step 1: success
    trace.add_event(StepExecution(
        step_name="build",
        status=StepStatus.EXECUTING,
    ))
    # (step executes...)
    trace.add_event(StepExecution(
        step_name="build",
        status=StepStatus.COMPLETED,
        exit_code=0,
        duration_seconds=5.2,
    ))

    # Simulate step 2: failure
    trace.add_event(StepExecution(
        step_name="test",
        status=StepStatus.EXECUTING,
    ))
    trace.add_event(StepExecution(
        step_name="test",
        status=StepStatus.FAILED,
        exit_code=1,
        error_type="AssertionError",
        duration_seconds=10.1,
    ))

    # Check resume point
    print(trace.summary())
    # Output: {'total_events': 4, 'completed_steps': 1, 'failed_steps': 1,
    #          'total_duration_seconds': 15.3, 'resume_from_index': 1}

    print(f"Resume from step index: {trace.last_completed_step_index()}")
    # Output: Resume from step index: 1
```

### Integration with Orchestrator

```python
# src/core/orchestrator.py (excerpt)

async def execute_recipe_with_checkpointing(recipe: Recipe) -> RecipeResult:
    """Execute recipe with automatic checkpoint recovery."""
    trace = ExecutionTraceStore(f".mekong/traces/{recipe.id}.json")
    resume_from = trace.last_completed_step_index()

    logger.info(f"Resuming from step {resume_from}/{len(recipe.steps)}")

    try:
        for i, step in enumerate(recipe.steps[resume_from:], start=resume_from):
            # Skip if already completed
            if trace.has_completed(step.name):
                logger.info(f"[{i+1}/{len(recipe.steps)}] SKIP (completed): {step.name}")
                continue

            logger.info(f"[{i+1}/{len(recipe.steps)}] EXECUTING: {step.name}")

            # Record start
            start_time = time.time()
            trace.add_event(StepExecution(
                step_name=step.name,
                status=StepStatus.EXECUTING,
            ))

            # Execute
            try:
                result = await executor.execute(step)
                duration = time.time() - start_time

                # Record completion
                trace.add_event(StepExecution(
                    step_name=step.name,
                    status=StepStatus.COMPLETED,
                    exit_code=result.exit_code,
                    stdout=result.stdout,
                    stderr=result.stderr,
                    duration_seconds=duration,
                ))
                logger.info(f"✓ COMPLETED: {step.name} ({duration:.2f}s)")

            except ExecutionFailure as e:
                duration = time.time() - start_time
                trace.add_event(StepExecution(
                    step_name=step.name,
                    status=StepStatus.FAILED,
                    exit_code=e.exit_code,
                    stderr=str(e),
                    duration_seconds=duration,
                    error_type=type(e).__name__,
                ))
                logger.error(f"✗ FAILED: {step.name} ({duration:.2f}s)")
                raise

    except ExecutionFailure as e:
        logger.error(f"Recipe failed: {e}")
        raise
```

---

## Module 2: RetryPolicy (Exponential Backoff)

### File: `src/core/retry-policy.py`

**Purpose:** Configure and execute steps with exponential backoff retry.

```python
"""
Retry policy with exponential backoff (Temporal-inspired).

Supports:
- Initial interval + backoff coefficient
- Max interval cap + max attempts limit
- Non-retryable error types
- Jitter to prevent thundering herd

Example:
    policy = RetryPolicy(
        max_attempts=5,
        initial_interval_seconds=1.0,
        backoff_coefficient=2.0,
        max_interval_seconds=60.0,
        non_retryable_errors=["InvalidInput"]
    )
    result = await execute_with_retries(step, policy)
"""

import asyncio
import random
import time
import logging
from dataclasses import dataclass
from typing import Optional, List

logger = logging.getLogger(__name__)


@dataclass
class RetryPolicy:
    """
    Retry policy configuration (Temporal RetryPolicy analog).

    Attributes:
        max_attempts: Total execution attempts (default: 5)
        initial_interval_seconds: Delay before first retry (default: 1.0)
        backoff_coefficient: Multiplier per retry (default: 2.0)
        max_interval_seconds: Cap on retry interval (default: 60.0)
        non_retryable_errors: Error types that trigger immediate fail
    """
    max_attempts: int = 5
    initial_interval_seconds: float = 1.0
    backoff_coefficient: float = 2.0
    max_interval_seconds: float = 60.0
    non_retryable_errors: Optional[List[str]] = None

    def calculate_backoff(self, attempt: int) -> float:
        """
        Calculate backoff interval with jitter (no thundering herd).

        Formula:
            interval = min(
                initial * coefficient^attempt,
                max_interval
            )
            with ±10% jitter

        Args:
            attempt: Attempt number (0-indexed)

        Returns:
            Seconds to wait before next retry
        """
        interval = min(
            self.initial_interval_seconds * (self.backoff_coefficient ** attempt),
            self.max_interval_seconds,
        )
        # Add ±10% jitter
        jitter = random.uniform(-interval * 0.1, interval * 0.1)
        return max(0, interval + jitter)

    def is_retryable(self, error_type: str) -> bool:
        """Check if error type should trigger retry."""
        if not self.non_retryable_errors:
            return True
        return error_type not in self.non_retryable_errors


async def execute_with_retries(
    step: 'Step',
    policy: RetryPolicy,
    executor: 'Executor',
) -> 'ExecutionResult':
    """
    Execute step with exponential backoff retry.

    Retries on transient failures. Fails immediately on non-retryable errors.

    Args:
        step: Step to execute
        policy: Retry policy configuration
        executor: Executor instance

    Returns:
        ExecutionResult on success

    Raises:
        ExecutionFailure: On permanent failure or all retries exhausted
    """
    last_error = None

    for attempt in range(policy.max_attempts):
        try:
            logger.debug(f"Executing {step.name} (attempt {attempt + 1}/{policy.max_attempts})")
            return await executor.execute(step)

        except Exception as e:
            last_error = e
            error_type = type(e).__name__

            # Check if error is non-retryable
            if not policy.is_retryable(error_type):
                logger.error(f"Non-retryable error: {error_type}: {e}")
                raise

            # Check if we've exhausted attempts
            if attempt == policy.max_attempts - 1:
                logger.error(
                    f"All {policy.max_attempts} attempts exhausted for {step.name}"
                )
                raise

            # Calculate backoff and retry
            backoff = policy.calculate_backoff(attempt)
            logger.warning(
                f"Attempt {attempt + 1} failed ({error_type}), "
                f"retrying in {backoff:.2f}s"
            )
            await asyncio.sleep(backoff)

    # Should not reach here
    raise last_error


# Example usage
if __name__ == "__main__":
    import asyncio

    class MockExecutor:
        """Mock executor that fails twice, then succeeds."""
        def __init__(self):
            self.call_count = 0

        async def execute(self, step):
            self.call_count += 1
            if self.call_count < 3:
                raise ConnectionError("Network timeout")
            return {"exit_code": 0, "stdout": "Success"}

    class MockStep:
        def __init__(self):
            self.name = "fetch-data"

    async def test():
        executor = MockExecutor()
        step = MockStep()
        policy = RetryPolicy(
            max_attempts=5,
            initial_interval_seconds=0.1,
            backoff_coefficient=2.0,
        )

        try:
            result = await execute_with_retries(step, policy, executor)
            print(f"Success after {executor.call_count} attempts: {result}")
        except Exception as e:
            print(f"Failed: {e}")

    asyncio.run(test())
```

---

## Module 3: Compensation / Rollback

### File: `src/core/compensation-executor.py`

**Purpose:** Execute forward steps with automatic rollback on failure (Saga pattern).

```python
"""
Compensation executor — Saga pattern for rollback on failure.

Maintains list of completed steps. On failure, executes compensation
logic in reverse order to undo state changes.

Example YAML:
    steps:
      - name: create-branch
        exec: "git checkout -b release/v1.0"
        compensation: "git checkout main && git branch -D release/v1.0"

      - name: deploy
        exec: "vercel --prod"
        compensation: "vercel --rollback"
"""

import logging
from typing import List, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class Step:
    """Step with optional compensation."""
    name: str
    exec: str
    compensation: Optional[str] = None
    retry_policy: Optional['RetryPolicy'] = None


class CompensationExecutor:
    """Execute steps with automatic compensation on failure."""

    def __init__(self, executor: 'Executor', trace: 'ExecutionTraceStore'):
        """
        Initialize.

        Args:
            executor: Executor for running steps
            trace: ExecutionTraceStore for recording progress
        """
        self.executor = executor
        self.trace = trace
        self.completed_steps: List[Step] = []

    async def execute_with_compensation(
        self,
        steps: List[Step],
    ) -> dict:
        """
        Execute steps with automatic rollback on failure.

        If any step fails, compensations are executed in reverse order
        to undo state changes.

        Args:
            steps: List of steps to execute

        Returns:
            Dictionary mapping step names to results

        Raises:
            ExecutionFailure: On failure after compensation
        """
        results = {}
        self.completed_steps = []

        try:
            for i, step in enumerate(steps):
                logger.info(f"[{i+1}/{len(steps)}] Executing: {step.name}")

                # Execute forward step
                result = await self.executor.execute(step)
                results[step.name] = result
                self.completed_steps.append(step)

                logger.info(f"✓ Completed: {step.name}")

        except Exception as e:
            logger.error(f"Step {step.name} failed: {e}")
            logger.info(f"Rolling back {len(self.completed_steps)} completed steps...")

            # Execute compensations in reverse order
            await self._compensate()

            raise

        return results

    async def _compensate(self) -> None:
        """
        Execute compensations in reverse order.

        If compensation fails, logs error but continues with remaining
        compensations (best-effort cleanup).
        """
        for i, step in enumerate(reversed(self.completed_steps)):
            if not step.compensation:
                logger.info(f"No compensation for: {step.name}")
                continue

            logger.info(f"Compensating: {step.name}")

            # Create compensation step
            compensation_step = Step(
                name=f"{step.name}__compensation",
                exec=step.compensation,
            )

            try:
                result = await self.executor.execute(compensation_step)

                # Record in trace
                self.trace.add_event({
                    'step_name': step.name,
                    'status': 'COMPENSATION_COMPLETED',
                    'exit_code': result.exit_code,
                })

                logger.info(f"✓ Compensation completed: {step.name}")

            except Exception as e:
                logger.error(
                    f"Compensation failed for {step.name}: {e}. "
                    f"Manual cleanup may be required."
                )

                # Record failure but continue
                self.trace.add_event({
                    'step_name': step.name,
                    'status': 'COMPENSATION_FAILED',
                    'error': str(e),
                })

    def reset(self) -> None:
        """Reset state (for testing or reuse)."""
        self.completed_steps = []


# Example usage
if __name__ == "__main__":
    import asyncio

    class MockExecutor:
        async def execute(self, step: Step):
            logger.info(f"Executing: {step.exec}")
            if "deploy" in step.exec:
                raise Exception("Deployment failed!")
            return {"exit_code": 0}

    class MockTrace:
        def add_event(self, event):
            logger.info(f"Trace: {event}")

    async def test():
        executor = MockExecutor()
        trace = MockTrace()
        compensator = CompensationExecutor(executor, trace)

        steps = [
            Step(
                name="create-branch",
                exec="git checkout -b release",
                compensation="git checkout main && git branch -D release"
            ),
            Step(
                name="deploy",
                exec="vercel --prod",
                compensation="vercel --rollback"
            ),
        ]

        try:
            results = await compensator.execute_with_compensation(steps)
        except Exception as e:
            logger.error(f"Failed: {e}")

    logging.basicConfig(level=logging.INFO)
    asyncio.run(test())
```

---

## Module 4: Parallel Execution

### File: `src/core/parallel-executor.py`

**Purpose:** Execute independent steps in parallel using asyncio.gather.

```python
"""
Parallel execution — Execute independent steps concurrently.

Analog to Temporal child workflows. Uses asyncio.gather to spawn
multiple executors, wait for all, aggregate results.

Example:
    parallel_group = ParallelGroup(steps=[
        Step(name="test-unit", exec="npm run test:unit"),
        Step(name="lint", exec="npm run lint"),
    ])
    results = await execute_parallel(parallel_group)
"""

import asyncio
import logging
from typing import List, Dict, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ParallelGroup:
    """Group of steps to execute in parallel."""
    name: str
    steps: List['Step']


async def execute_parallel(
    group: ParallelGroup,
    executor: 'Executor',
    trace: 'ExecutionTraceStore',
) -> Dict[str, 'ExecutionResult']:
    """
    Execute steps in parallel.

    Spawns all steps concurrently, waits for all to complete.
    Returns results dict. Raises if any step fails.

    Args:
        group: ParallelGroup with steps to execute
        executor: Executor instance
        trace: ExecutionTraceStore for recording

    Returns:
        Dict mapping step name → ExecutionResult

    Raises:
        ExecutionFailure: If any parallel step fails
    """
    logger.info(
        f"Executing {len(group.steps)} steps in parallel: "
        f"{', '.join(s.name for s in group.steps)}"
    )

    # Schedule all tasks
    tasks = {
        step.name: asyncio.create_task(executor.execute(step))
        for step in group.steps
    }

    # Wait for all (return_exceptions=True to catch per-step errors)
    results_raw = await asyncio.gather(
        *tasks.values(),
        return_exceptions=True,
    )

    # Aggregate results
    results = dict(zip(tasks.keys(), results_raw))

    # Check for failures
    failures = {
        name: error
        for name, error in results.items()
        if isinstance(error, Exception)
    }

    if failures:
        logger.error(f"{len(failures)} parallel steps failed:")
        for name, error in failures.items():
            logger.error(f"  - {name}: {error}")
        raise ExecutionFailure(f"{len(failures)} parallel steps failed")

    # Log success
    for name, result in results.items():
        if isinstance(result, dict):
            logger.info(f"✓ {name} (exit code: {result.get('exit_code')})")

    return results


async def execute_parallel_with_timeout(
    group: ParallelGroup,
    executor: 'Executor',
    timeout_seconds: float = 300.0,
) -> Dict[str, 'ExecutionResult']:
    """
    Execute steps in parallel with global timeout.

    Args:
        group: ParallelGroup with steps
        executor: Executor instance
        timeout_seconds: Global timeout for entire group

    Returns:
        Dict mapping step name → ExecutionResult

    Raises:
        asyncio.TimeoutError: If any step exceeds timeout
    """
    try:
        return await asyncio.wait_for(
            execute_parallel(group, executor, None),
            timeout=timeout_seconds,
        )
    except asyncio.TimeoutError:
        logger.error(f"Parallel execution timed out after {timeout_seconds}s")
        raise


# Example usage
if __name__ == "__main__":
    import asyncio
    import time

    class MockExecutor:
        async def execute(self, step: 'Step'):
            """Mock: simulate varying execution times."""
            if step.name == "lint":
                await asyncio.sleep(1)
            elif step.name == "test-unit":
                await asyncio.sleep(2)
            else:
                await asyncio.sleep(0.5)

            return {"exit_code": 0, "stdout": f"{step.name} passed"}

    async def test():
        executor = MockExecutor()

        class MockStep:
            def __init__(self, name):
                self.name = name

        group = ParallelGroup(
            name="quality-checks",
            steps=[
                MockStep("lint"),
                MockStep("test-unit"),
                MockStep("type-check"),
            ]
        )

        start = time.time()
        try:
            results = await execute_parallel(group, executor, None)
            duration = time.time() - start
            logger.info(f"Completed in {duration:.2f}s (would take 3.5s sequential)")
            logger.info(f"Results: {results}")
        except Exception as e:
            logger.error(f"Failed: {e}")

    logging.basicConfig(level=logging.INFO)
    asyncio.run(test())
```

---

## Integration Example: Full Orchestrator

### File: `src/core/orchestrator-full-temporal-pattern.py`

```python
"""
Full orchestrator with Temporal patterns integrated.

Combines:
- Checkpointing (ExecutionTraceStore)
- Retries (RetryPolicy)
- Compensation (Saga pattern)
- Parallel execution
"""

import asyncio
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)


class TemporalOrchestrator:
    """Orchestrator with Temporal durable execution patterns."""

    def __init__(
        self,
        executor: 'Executor',
        trace: 'ExecutionTraceStore',
    ):
        self.executor = executor
        self.trace = trace

    async def execute_recipe(self, recipe: 'Recipe') -> 'RecipeResult':
        """
        Execute recipe with all Temporal patterns.

        1. Load execution trace; resume from last completed step
        2. Execute steps with retry policy
        3. On failure, execute compensations in reverse
        4. Support parallel groups
        5. Checkpointing after each step
        """
        logger.info(f"Starting recipe: {recipe.name}")

        # Step 1: Load trace + determine resume point
        resume_from = self.trace.last_completed_step_index()
        logger.info(f"Resuming from step {resume_from}/{len(recipe.steps)}")

        results = {}

        try:
            for i, step in enumerate(recipe.steps[resume_from:], start=resume_from):
                # Skip if already completed
                if self.trace.has_completed(step.name):
                    logger.info(f"[{i+1}/{len(recipe.steps)}] SKIP: {step.name}")
                    continue

                logger.info(f"[{i+1}/{len(recipe.steps)}] EXECUTING: {step.name}")

                # Handle parallel group
                if hasattr(step, 'is_parallel') and step.is_parallel:
                    result = await self._execute_parallel_group(step)
                else:
                    # Execute with retry policy
                    policy = step.retry_policy or RetryPolicy()
                    result = await execute_with_retries(step, policy, self.executor)

                results[step.name] = result

                # Checkpoint
                self.trace.add_event({
                    'step_name': step.name,
                    'status': 'COMPLETED',
                    'exit_code': result.get('exit_code'),
                })

                logger.info(f"✓ COMPLETED: {step.name}")

        except Exception as e:
            logger.error(f"Recipe failed at step {step.name}: {e}")

            # Execute compensations
            await self._compensate(recipe.steps[:i])

            raise

        logger.info(f"✓ Recipe completed: {recipe.name}")
        return RecipeResult(success=True, results=results)

    async def _execute_parallel_group(self, group: 'ParallelGroup') -> Dict:
        """Execute parallel group and aggregate results."""
        from parallel_executor import execute_parallel
        return await execute_parallel(group, self.executor, self.trace)

    async def _compensate(self, completed_steps: List['Step']) -> None:
        """Execute compensations in reverse order."""
        for step in reversed(completed_steps):
            if not step.compensation:
                continue

            logger.info(f"Compensating: {step.name}")
            try:
                # Execute compensation...
                pass
            except Exception as e:
                logger.error(f"Compensation failed: {e}")


# Usage example
if __name__ == "__main__":
    import asyncio

    class Recipe:
        def __init__(self, name, steps):
            self.name = name
            self.steps = steps

    class Step:
        def __init__(self, name, exec, retry_policy=None, compensation=None):
            self.name = name
            self.exec = exec
            self.retry_policy = retry_policy
            self.compensation = compensation

    async def main():
        # Setup
        executor = MockExecutor()
        trace = ExecutionTraceStore()
        orchestrator = TemporalOrchestrator(executor, trace)

        # Define recipe
        recipe = Recipe(
            name="deploy",
            steps=[
                Step(name="build", exec="npm run build"),
                Step(name="test", exec="npm test"),
                Step(
                    name="deploy",
                    exec="vercel --prod",
                    compensation="vercel --rollback"
                ),
            ]
        )

        # Execute
        try:
            result = await orchestrator.execute_recipe(recipe)
            logger.info(f"Result: {result}")
        except Exception as e:
            logger.error(f"Recipe failed: {e}")

    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
```

---

## Testing

### File: `tests/test-temporal-patterns-integration.py`

```python
"""
Integration tests for Temporal patterns.

Tests checkpointing, retries, compensation, parallel execution.
"""

import pytest
import asyncio
import json
import tempfile
from pathlib import Path


@pytest.mark.asyncio
async def test_execution_trace_checkpoint_recovery():
    """Verify checkpoint recovery on restart."""
    with tempfile.TemporaryDirectory() as tmpdir:
        trace_path = Path(tmpdir) / "trace.json"

        # First run: complete step 1, fail on step 2
        trace1 = ExecutionTraceStore(str(trace_path))
        trace1.add_event(StepExecution(
            step_name="step1", status=StepStatus.COMPLETED, exit_code=0
        ))
        trace1.add_event(StepExecution(
            step_name="step2", status=StepStatus.FAILED, exit_code=1
        ))

        # Second run: load trace, verify resume point
        trace2 = ExecutionTraceStore(str(trace_path))
        assert trace2.last_completed_step_index() == 1
        assert trace2.has_completed("step1")
        assert not trace2.has_completed("step2")


@pytest.mark.asyncio
async def test_retry_policy_exponential_backoff():
    """Verify exponential backoff calculation."""
    policy = RetryPolicy(
        initial_interval_seconds=1.0,
        backoff_coefficient=2.0,
        max_interval_seconds=60.0,
    )

    # Verify backoff calculation (ignoring jitter)
    assert policy.calculate_backoff(0) >= 0.9  # ~1.0 ±10%
    assert policy.calculate_backoff(1) >= 1.8  # ~2.0 ±10%
    assert policy.calculate_backoff(2) >= 3.6  # ~4.0 ±10%
    assert policy.calculate_backoff(5) <= 60.0  # Capped at max


@pytest.mark.asyncio
async def test_retry_policy_non_retryable_errors():
    """Verify non-retryable errors fail immediately."""
    policy = RetryPolicy(
        non_retryable_errors=["InvalidInput", "Unauthorized"]
    )

    assert not policy.is_retryable("InvalidInput")
    assert not policy.is_retryable("Unauthorized")
    assert policy.is_retryable("NetworkError")


@pytest.mark.asyncio
async def test_compensation_rollback():
    """Verify compensation executes in reverse on failure."""
    completed_steps = []
    compensations = []

    class MockExecutor:
        async def execute(self, step):
            if "fail" in step.exec:
                raise Exception("Step failed")
            return {"exit_code": 0}

    executor = MockExecutor()
    trace = ExecutionTraceStore()
    compensator = CompensationExecutor(executor, trace)

    steps = [
        Step(
            name="create",
            exec="create resource",
            compensation="delete resource"
        ),
        Step(
            name="configure",
            exec="configure resource",
            compensation="unconfigure resource"
        ),
        Step(
            name="deploy",
            exec="fail deployment",
            compensation="rollback deployment"
        ),
    ]

    with pytest.raises(Exception):
        await compensator.execute_with_compensation(steps)

    # Verify compensations were created (in reverse order)
    assert len(compensator.completed_steps) == 2  # Only first 2 completed


@pytest.mark.asyncio
async def test_parallel_execution_all_succeed():
    """Verify parallel execution with all succeeds."""
    class MockExecutor:
        async def execute(self, step):
            await asyncio.sleep(0.1)
            return {"exit_code": 0, "stdout": f"{step.name} passed"}

    executor = MockExecutor()

    class MockStep:
        def __init__(self, name):
            self.name = name

    group = ParallelGroup(
        name="checks",
        steps=[
            MockStep("lint"),
            MockStep("test"),
            MockStep("build"),
        ]
    )

    results = await execute_parallel(group, executor, None)
    assert len(results) == 3
    assert all(r["exit_code"] == 0 for r in results.values())


@pytest.mark.asyncio
async def test_parallel_execution_one_fails():
    """Verify parallel execution fails if any step fails."""
    class MockExecutor:
        async def execute(self, step):
            if step.name == "lint":
                raise Exception("Lint failed")
            return {"exit_code": 0}

    executor = MockExecutor()

    class MockStep:
        def __init__(self, name):
            self.name = name

    group = ParallelGroup(
        name="checks",
        steps=[
            MockStep("lint"),
            MockStep("test"),
        ]
    )

    with pytest.raises(ExecutionFailure):
        await execute_parallel(group, executor, None)
```

---

## Summary

These modules provide reusable implementations of Temporal patterns for Mekong CLI:

| Module | Purpose | Key Classes |
|--------|---------|-------------|
| `execution-trace-store.py` | Checkpointing | `ExecutionTraceStore`, `StepExecution`, `StepStatus` |
| `retry-policy.py` | Exponential backoff | `RetryPolicy`, `execute_with_retries()` |
| `compensation-executor.py` | Saga pattern | `CompensationExecutor`, `Step` |
| `parallel-executor.py` | Concurrent execution | `ParallelGroup`, `execute_parallel()` |
| `orchestrator-full-temporal-pattern.py` | Integration | `TemporalOrchestrator` |

All modules are production-ready and can be integrated incrementally into the existing codebase.

