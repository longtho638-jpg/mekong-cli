# Temporal.io SDK Patterns Research Report

**Date:** 2026-03-01
**Researcher:** Claude (Haiku 4.5)
**Scope:** Temporal Python & TypeScript SDKs + CLI Orchestration Mapping
**Status:** Complete

---

## Executive Summary

Temporal.io is a **durable execution platform** that brings workflow guarantees (resilience, retries, resumption) to distributed systems without manual state management. Both Python and TypeScript SDKs implement the same conceptual model:

- **Workflows** = Deterministic orchestration logic (no I/O)
- **Activities** = Non-deterministic work (I/O, side effects)
- **Workers** = Executors that process queued tasks
- **Automatic checkpointing** = Invisible state persistence via event history

**Key insight for CLI tools:** Temporal's patterns (especially determinism + activity separation) directly map to improving Plan-Execute-Verify engines by enforcing clean separation of concerns and enabling recovery from arbitrary failure points.

---

## Part 1: Temporal Python SDK (temporalio)

### 1.1 Workflow Definition

**Pattern:** Async class with `@workflow.defn` decorator + `@workflow.run` entry point.

```python
from datetime import timedelta
from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities import say_hello

@workflow.defn
class SayHello:
    @workflow.run
    async def run(self, name: str) -> str:
        # Pure orchestration logic only
        return await workflow.execute_activity(
            say_hello,
            name,
            schedule_to_close_timeout=timedelta(seconds=5)
        )
```

**Constraints:**
- **Deterministic only:** Same input = same output always
- **No direct I/O:** Database calls, API requests, file reads = forbidden in workflows
- **Async def required:** Full asyncio support (sleep, cancellation, tasks)
- **Imports controlled:** `unsafe.imports_passed_through()` for external modules (avoid non-deterministic imports)

**Entry point:** Single `@workflow.run` method that accepts params, returns result.

### 1.2 Activity Definition

**Pattern:** Decorated function or method. Supports both sync and async.

```python
from temporalio import activity

@activity.defn
def say_hello(name: str) -> str:
    """Synchronous activity - executes outside workflow."""
    return f"Hello, {name}!"

# OR async variant
@activity.defn
async def say_hello_async(name: str) -> str:
    """Async activity for I/O-bound work."""
    async with aiohttp.ClientSession() as session:
        async with session.get(f"https://api.example.com/greet/{name}") as resp:
            return await resp.text()
```

**Characteristics:**
- No decorator inheritance—just `@activity.defn`
- Can be sync or async
- Execute external I/O, API calls, database queries
- Exceptions propagate as `ApplicationFailure` to workflow
- Support for heartbeats (for cancellation notification + progress tracking)

### 1.3 Activity Heartbeating & Cancellation

**Pattern:** Periodic `activity.heartbeat()` calls for both cancellation notification and failure recovery.

```python
from temporalio import activity

@activity.defn
async def long_running_task(file_path: str):
    """Activity that checks for cancellation + persists progress."""
    info = activity.info()

    with open(file_path) as f:
        total_lines = sum(1 for _ in f)

    # Restore from last checkpoint if retrying
    last_checkpoint = info.heartbeat_details or 0

    with open(file_path) as f:
        for i, line in enumerate(f):
            if i < last_checkpoint:
                continue  # Skip already-processed lines

            # Process line...
            process(line)

            # Heartbeat every 100 lines
            if i % 100 == 0:
                activity.heartbeat(i)  # Persists progress as detail
                # If activity is cancelled, heartbeat() raises CancelledError
```

**Benefits:**
- **Cancellation awareness:** `heartbeat()` raises `asyncio.CancelledError` if parent workflow cancelled
- **Failure recovery:** On retry, `info().heartbeat_details` contains last checkpointed state
- **Server notification:** Proves activity is still alive, prevents timeout cancellation

### 1.4 Error Handling & Retry Policy

**Default behavior:**
- **Activities:** Retry by default (1s initial, 2.0x backoff, 100s max)
- **Workflows:** No automatic retry (determinism incompatible with replay)

**Retry policy configuration:**

```python
from temporalio.common import RetryPolicy
from datetime import timedelta

@workflow.defn
class OrderWorkflow:
    @workflow.run
    async def run(self, order_id: str):
        # Custom retry policy for activity
        return await workflow.execute_activity(
            process_payment,
            order_id,
            retry_policy=RetryPolicy(
                initial_interval=timedelta(seconds=1),
                backoff_coefficient=2.0,
                maximum_interval=timedelta(minutes=1),
                maximum_attempts=5,
                non_retryable_error_types=["InvalidOrder", "PaymentDeclined"]
            )
        )
```

**Non-retryable errors:** Specify error types that should never retry (e.g., validation errors, permanent failures).

**Workflow failures:** Caught as `ApplicationFailure`. To avoid infinite retry loops, workflows should not retry—instead, catch activity failures + decide inside workflow.

```python
@workflow.defn
class SafeWorkflow:
    @workflow.run
    async def run(self, order_id: str):
        try:
            return await workflow.execute_activity(
                process_payment,
                order_id,
                retry_policy=RetryPolicy(maximum_attempts=3)
            )
        except ApplicationFailure as e:
            # Activity failed 3 times—decide: compensate, alert, or fail workflow
            if e.type == "PaymentDeclined":
                await workflow.execute_activity(notify_user, "Payment declined")
            raise  # Re-raise or return error result
```

### 1.5 Signals, Queries, and Updates

**Signals:** One-way messages from client → workflow (no response).

```python
@workflow.defn
class WorkerWorkflow:
    def __init__(self):
        self.paused = False

    @workflow.signal
    async def pause(self):
        self.paused = True

    @workflow.signal
    async def resume(self):
        self.paused = False

    @workflow.run
    async def run(self):
        for i in range(1000):
            while self.paused:
                await asyncio.sleep(1)  # Wait for resume
            await workflow.execute_activity(process_item, i)
```

**Queries:** Ask workflow for state (read-only, no side effects allowed).

```python
@workflow.defn
class WorkerWorkflow:
    def __init__(self):
        self.processed = 0

    @workflow.query
    def get_status(self) -> str:
        return f"Processed: {self.processed} items"
```

**Updates:** Two-way messages (client waits for response). Can schedule activities.

```python
@workflow.defn
class AuctionWorkflow:
    def __init__(self):
        self.bid = 0

    @workflow.update
    async def place_bid(self, amount: int) -> str:
        if amount > self.bid:
            self.bid = amount
            # Updates can schedule activities
            await workflow.execute_activity(notify_bidders, amount)
            return f"Bid accepted: ${amount}"
        return f"Bid too low. Current: ${self.bid}"
```

### 1.6 Worker Setup & Task Queue Binding

```python
import asyncio
import concurrent.futures
from temporalio.client import Client
from temporalio.worker import Worker

from activities import say_hello, long_task
from workflows import SayHello, OrderWorkflow

async def main():
    # Connect to Temporal server
    client = await Client.connect("localhost:7233")

    # Thread pool for sync activities
    with concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:
        # Create worker with workflows, activities, and task queue
        worker = Worker(
            client,
            task_queue="order-processing",  # Named queue
            workflows=[SayHello, OrderWorkflow],
            activities=[say_hello, long_task],
            activity_executor=executor,  # Thread pool for sync activities
        )
        # Worker runs indefinitely, processing tasks from queue
        await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
```

**Key points:**
- **Task queue binding:** Worker polls named queue (e.g., "order-processing")
- **Activity executor:** Thread pool for sync activities; async activities run natively
- **Workflow types:** All registered workflows available to client
- **Long-lived:** Worker runs indefinitely, pulling tasks from queue

### 1.7 Child Workflows & Continue-As-New

**Child Workflows:** Spawn sub-workflows from parent workflow.

```python
@workflow.defn
class BatchProcessWorkflow:
    @workflow.run
    async def run(self, items: list[str]):
        results = []
        for item in items:
            # Spawn child workflow
            result = await workflow.execute_child_workflow(
                ProcessItemWorkflow,
                item,
                parent_close_policy=ParentClosePolicy.ABANDON
            )
            results.append(result)
        return results
```

**Continue-As-New:** Restart workflow with new parameters (limits history size).

```python
@workflow.defn
class IterativeProcessWorkflow:
    @workflow.run
    async def run(self, batch_number: int, total_batches: int):
        # Process batch...
        await workflow.execute_activity(process_batch, batch_number)

        # If more batches, restart workflow with next batch
        if batch_number < total_batches:
            await workflow.continue_as_new(batch_number + 1, total_batches)
        # else: workflow completes
```

**Why useful:** Prevents event history from growing unbounded for long-running processes.

**Limitation:** Child workflows are **not carried over** when parent uses `continue_as_new`. Parent close policy (ABANDON) allows children to survive.

### 1.8 Interceptors (Python SDK)

```python
from temporalio.client import Interceptor

class LoggingInterceptor(Interceptor):
    async def intercept_activity(self, input: ActivityInInput) -> ActivityOutInput:
        print(f"Starting activity: {input.activity_name}")
        try:
            return await input.execute()
        except Exception as e:
            print(f"Activity failed: {e}")
            raise
```

Less mature than TypeScript counterpart, but available for observability.

---

## Part 2: Temporal TypeScript SDK

### 2.1 Workflow Definition

**Pattern:** Exported workflow function (not class-based like Python).

```typescript
import { proxyActivities, sleep } from '@temporalio/workflow';
import * as activities from './activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 seconds',
});

export async function sayHelloWorkflow(name: string): Promise<string> {
  // Pure orchestration
  return await greet(name);
}
```

**Key differences from Python:**
- **Function-based:** Not class-based
- **Activity proxying:** `proxyActivities()` wraps activities with type safety
- **Timeout declaration:** At proxy definition, not per call
- **No imports restriction:** TypeScript doesn't replay from source—bundled at compile time

### 2.2 Activity Definition

```typescript
export async function greet(name: string): Promise<string> {
  return `Hello, ${name}!`;
}

export async function longRunningTask(filePath: string): Promise<void> {
  // I/O operations allowed
  const fs = require('fs').promises;
  const lines = (await fs.readFile(filePath, 'utf8')).split('\n');

  for (let i = 0; i < lines.length; i++) {
    process(lines[i]);

    // Heartbeat for cancellation + progress
    if (i % 100 === 0) {
      await Context.current().heartbeat(i);
    }
  }
}
```

### 2.3 Interceptors Pattern (TypeScript-Specific)

TypeScript SDK provides rich interceptor system for observability, logging, tracing.

```typescript
import {
  WorkflowInboundCallsInterceptor,
  WorkflowInterceptorsType,
} from '@temporalio/workflow';

export class LoggingInterceptor
  implements WorkflowInboundCallsInterceptor {
  async execute(
    input: WorkflowExecuteInput,
    next: (input: WorkflowExecuteInput) => Promise<any>
  ): Promise<any> {
    console.log(`Workflow started: ${input.args[0]}`);
    try {
      const result = await next(input);
      console.log(`Workflow completed`);
      return result;
    } catch (err) {
      console.error(`Workflow failed: ${err}`);
      throw err;
    }
  }
}

export const interceptors = (): WorkflowInterceptorsType => ({
  workflowInboundCallsInterceptor: new LoggingInterceptor(),
});
```

**Four main interceptor types:**

1. **WorkflowInboundCallsInterceptor** – Intercept execute, signal, query
2. **WorkflowOutboundCallsInterceptor** – Intercept activity scheduling, timers
3. **ActivityInboundCallsInterceptor** – Activity execution
4. **WorkflowClientInterceptor** – Client-side operations (start, signal, query)

**Common use cases:**
- OpenTelemetry tracing
- Logging start/completion
- Authorization checks
- Custom metrics

### 2.4 Worker Setup & Bundling

```typescript
import { Worker } from '@temporalio/worker';
import { Connection } from '@temporalio/client';
import * as workflows from './workflows';
import * as activities from './activities';

async function run() {
  const connection = await Connection.connect({ address: 'localhost:7233' });

  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: 'order-processing',
    workflowsPath: require.resolve('./workflows'),  // Bundled workflows
    activities,  // In-process activities
    interceptors: {
      workflowInboundCallsInterceptor: () => new LoggingInterceptor(),
      activityInboundCallsInterceptor: () => new ActivityLogger(),
    },
  });

  await worker.run();
}

run().catch(console.error);
```

**Bundling:** Workflows must be pre-bundled at build time (no runtime imports).

### 2.5 Client & Workflow Execution

```typescript
import { Connection, Client } from '@temporalio/client';
import { sayHelloWorkflow } from './workflows';

async function main() {
  const client = new Client();

  // Start workflow
  const handle = await client.workflow.start(sayHelloWorkflow, {
    args: ['Alice'],
    taskQueue: 'order-processing',
    workflowId: 'unique-id-123',
  });

  // Wait for result
  const result = await handle.result();
  console.log(result);

  // Or send signal
  await handle.signal(pauseSignal);

  // Query state
  const status = await handle.query(getStatusQuery);
}

main().catch(console.error);
```

---

## Part 3: Common SDK Patterns

### 3.1 Determinism Constraints

**Rule:** Workflows must be deterministic—given same input, always produce same command sequence.

**Allowed in workflows:**
- Activity scheduling
- Timer waits
- Signals/queries
- Local calculations
- Deterministic libraries (math, string ops)

**Forbidden in workflows:**
- `random.random()` → Use `Side Effect`
- `datetime.now()` → Use `workflow.now()`
- Database queries → Use Activities
- API calls → Use Activities
- File I/O → Use Activities
- Non-deterministic libraries

**Why?** Temporal replays workflows from event history. If workflow code changes, or uses non-deterministic operations, replay diverges and errors occur.

**Exception:** `Side Effect` for non-deterministic operations.

```python
# Python: Non-deterministic UUID
import uuid
from temporalio import workflow

@workflow.defn
class OrderWorkflow:
    @workflow.run
    async def run(self, order_data):
        # Generate UUID without replaying every execution
        order_id = await workflow.execute_side_effect(
            uuid.uuid4
        )
        # Rest of workflow uses order_id
        await workflow.execute_activity(store_order, order_id, order_data)
```

**TypeScript equivalent:**

```typescript
export async function orderWorkflow(orderData: unknown): Promise<string> {
  const orderId = await random(() => crypto.randomUUID());
  await storeOrder(orderId, orderData);
  return orderId;
}
```

### 3.2 Retry Policy Strategy

**Activity retries:** Automatic, with exponential backoff.

| Setting | Default | Description |
|---------|---------|-------------|
| Initial Interval | 1s | Delay before first retry |
| Backoff Coefficient | 2.0 | Multiply interval each retry (1s → 2s → 4s → ...) |
| Maximum Interval | 100s | Cap on interval |
| Maximum Attempts | Unlimited | Total retries allowed |
| Non-Retryable Errors | (empty) | Error types that never retry |

**Example:**

```python
RetryPolicy(
    initial_interval=timedelta(seconds=1),
    backoff_coefficient=2.0,
    maximum_interval=timedelta(minutes=1),
    maximum_attempts=5,
    non_retryable_error_types=["InvalidOrder", "PaymentDeclined"]
)
```

**Workflow retries:** Not recommended. Instead:
- Catch activity failures in workflow
- Decide compensation/recovery
- Or fail workflow explicitly

```python
try:
    await workflow.execute_activity(risky_op)
except ApplicationFailure as e:
    if e.type == "TemporaryError":
        # Retry internally
        await workflow.sleep(timedelta(seconds=5))
        return await workflow.execute_activity(risky_op)
    else:
        # Permanent error—compensate
        await workflow.execute_activity(compensation)
        raise
```

### 3.3 Saga Pattern (Compensation)

Distributed transaction using activities as steps, with compensation on failure.

```python
@workflow.defn
class OrderSagaWorkflow:
    @workflow.run
    async def run(self, order: Order):
        # Forward steps
        reservation_id = await workflow.execute_activity(
            reserve_inventory, order.item_id
        )
        try:
            payment_id = await workflow.execute_activity(
                process_payment, order.amount
            )
        except ApplicationFailure:
            # Compensation: undo reservation
            await workflow.execute_activity(
                cancel_reservation, reservation_id
            )
            raise

        try:
            shipment_id = await workflow.execute_activity(
                create_shipment, reservation_id
            )
        except ApplicationFailure:
            # Compensation: refund + undo reservation
            await workflow.execute_activity(refund_payment, payment_id)
            await workflow.execute_activity(cancel_reservation, reservation_id)
            raise

        return {"order_id": order.id, "shipment_id": shipment_id}
```

**Key insight:** Compensation logic (undo steps) defined inline with forward steps.

### 3.4 Child Workflows & Parallelism

**Sequential child workflows:**

```python
@workflow.defn
class ParentWorkflow:
    @workflow.run
    async def run(self, items: list[str]):
        results = []
        for item in items:
            result = await workflow.execute_child_workflow(
                ProcessItemWorkflow, item
            )
            results.append(result)
        return results
```

**Parallel child workflows:**

```python
@workflow.defn
class ParentWorkflow:
    @workflow.run
    async def run(self, items: list[str]):
        # Schedule all at once
        handles = [
            await workflow.start_child_workflow(
                ProcessItemWorkflow, item
            )
            for item in items
        ]
        # Wait all
        results = [await h.result() for h in handles]
        return results
```

**Parent close policy:**

- `TERMINATE` (default): Cancel child on parent close
- `ABANDON`: Let child continue
- `WAIT_FOR_CHILD_COMPLETION`: Parent waits for children

```python
await workflow.execute_child_workflow(
    ChildWorkflow,
    args,
    parent_close_policy=ParentClosePolicy.ABANDON
)
```

### 3.5 Continue-As-New Pattern

Restart workflow to prevent unbounded history growth.

```python
@workflow.defn
class IterativeWorkflow:
    @workflow.run
    async def run(self, offset: int, limit: int = 100):
        # Process batch [offset, offset + limit)
        items = await workflow.execute_activity(
            fetch_items, offset, limit
        )

        processed = 0
        for item in items:
            await workflow.execute_activity(process_item, item)
            processed += 1

        # If more items, restart with next batch
        if processed == limit:
            await workflow.continue_as_new(offset + limit, limit)

        return f"Processed up to {offset + processed}"
```

**Benefits:**
- Event history stays bounded (~1k events)
- Workflow runs indefinitely via restarts
- Each restart = new workflow run with own history

**Limitation:** Child workflows not preserved on `continue_as_new`.

### 3.6 Cancellation Handling

**Workflows:** Cancellation propagates to activities.

```python
@workflow.defn
class CancellableWorkflow:
    @workflow.run
    async def run(self, items: list[str]):
        try:
            for item in items:
                await workflow.execute_activity(process_item, item)
        except asyncio.CancelledError:
            # Workflow was cancelled—notify
            await workflow.execute_activity(cleanup)
            raise
```

**Activities:** Detect via heartbeat.

```python
@activity.defn
async def long_task():
    try:
        for i in range(1000):
            # This raises CancelledError on cancellation
            await activity.heartbeat()
            process_item(i)
    except asyncio.CancelledError:
        # Activity was cancelled—cleanup
        cleanup()
        raise
```

---

## Part 4: Mapping to CLI Orchestration

### 4.1 Plan-Execute-Verify Analogy

| Temporal Concept | Mekong CLI Equivalent | Purpose |
|---|---|---|
| **Workflow** | **Plan** (recipe decomposed to steps) | Deterministic orchestration |
| **Activity** | **Execute step** (shell command, LLM call) | Non-deterministic work |
| **Worker** | **Executor engine** | Polls steps, invokes executors |
| **Event history** | **Execution trace** (JSON log) | State reconstruction on failure |
| **Retry policy** | **Retry logic** (exponential backoff) | Fault tolerance |
| **Determinism constraint** | **Pure orchestration** (no I/O in plan) | Predictable replay |
| **Side effect** | **Nondeterministic wrapping** (UUID, random) | Capture output for replay |
| **Child workflow** | **Subplan** (nested recipe) | Decomposition |
| **Continue-as-new** | **Batch/pagination** | Unbounded iteration |
| **Signal** | **Runtime pause/resume** | Workflow interruption |
| **Heartbeat** | **Progress checkpoint** | Recovery point |

### 4.2 Applying Determinism to Plans

**Current issue in mekong-cli:**

```python
# src/core/planner.py (hypothetical)
def decompose(goal: str) -> list[Step]:
    """Plan returns steps—but if these steps are non-deterministic, replay breaks."""
    # ❌ Problem: LLM-generated steps may vary on re-run
    steps = llm_client.call("Decompose goal: " + goal)
    # If LLM returns different steps, recovery fails
    return parse_steps(steps)
```

**Temporal-inspired fix:**

```python
# src/core/planner.py (improved)
@deterministic
def decompose(goal: str) -> list[Step]:
    """Pure plan logic—no I/O, deterministic."""
    # Hardcoded orchestration
    return [
        Step(name="analyze", executor="shell", cmd="grep ..."),
        Step(name="build", executor="shell", cmd="python -m pytest"),
        Step(name="commit", executor="git", cmd="git commit"),
    ]

@activity
async def plan_with_llm(goal: str) -> str:
    """Non-deterministic planning moved to activity."""
    # LLM call (non-deterministic) wrapped in activity
    steps = await llm_client.generate_steps(goal)
    return steps
```

**Benefit:** If plan is purely orchestration + activities, failures can be recovered by replaying steps from history.

### 4.3 Checkpointing Strategy for CLI

Temporal automatically checkpoints at activity boundaries. For CLI:

```python
# src/core/orchestrator.py (execution trace model)
class ExecutionTrace:
    """Analogous to Temporal event history."""
    events: list[ExecutionEvent]

    def save(self):
        """Persist to disk after each step."""
        with open("execution_trace.json", "w") as f:
            json.dump([e.to_dict() for e in self.events], f)

    def resume(self, step_index: int):
        """Resume from checkpoint."""
        for step in self.steps[step_index:]:
            execute_step(step)

class ExecutionEvent:
    """Temporal-like event."""
    step_name: str
    exit_code: int
    stdout: str
    timestamp: float
    status: str  # QUEUED, EXECUTING, COMPLETED, FAILED
```

**On crash:**
1. Read execution_trace.json
2. Find last COMPLETED event
3. Resume from next step
4. Skip already-completed steps (no re-execution)

### 4.4 Activity Heartbeating for Long Steps

For long-running CLI commands, implement heartbeating:

```python
# src/core/executor.py
async def execute_with_heartbeat(step: Step) -> ExecutionResult:
    """Execute shell command, sending heartbeat every N seconds."""
    process = await asyncio.create_subprocess_shell(
        step.command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    heartbeat_interval = 5  # seconds
    last_heartbeat = time.time()

    while True:
        try:
            # Non-blocking read
            stdout, _ = await asyncio.wait_for(
                process.communicate(), timeout=heartbeat_interval
            )
            # Process completed
            return ExecutionResult(exit_code=process.returncode, stdout=stdout)
        except asyncio.TimeoutError:
            # Still running—heartbeat
            now = time.time()
            if now - last_heartbeat >= heartbeat_interval:
                activity.heartbeat(step_name, now)  # Notify not stuck
                last_heartbeat = now
```

**Benefit:** If CLI tool is killed, on recovery, it knows which steps completed + can skip them.

### 4.5 Saga Pattern for Plan Rollback

Temporal's compensation pattern maps to orchestrator rollback.

```python
# src/core/orchestrator.py
class RecipeOrchestrator:
    async def execute_with_compensation(self, recipe: Recipe):
        """Execute steps + compensation on failure."""
        completed_steps = []
        try:
            for step in recipe.steps:
                result = await self.executor.execute(step)
                completed_steps.append(step)
        except ExecutionFailure as e:
            # Execute compensations in reverse
            for step in reversed(completed_steps):
                if step.compensation:
                    await self.executor.execute(step.compensation)
            raise
```

**Example:**

```yaml
# recipes/deploy.yaml
steps:
  - name: build
    exec: "npm run build"
    compensation: "rm -rf dist"

  - name: test
    exec: "npm test"
    compensation: null  # No rollback needed

  - name: deploy
    exec: "vercel --prod"
    compensation: "vercel --rollback"
```

### 4.6 Parallel Execution (Like Child Workflows)

```python
# src/core/orchestrator.py
async def execute_parallel(self, steps: list[Step]) -> list[ExecutionResult]:
    """Like child workflows—schedule all at once, wait all."""
    tasks = [self.executor.execute(step) for step in steps]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Check failures
    for result in results:
        if isinstance(result, Exception):
            raise ExecutionError(f"Parallel step failed: {result}")

    return results
```

### 4.7 Continue-As-New for Batching

For processing large datasets:

```python
# recipes/batch-process.yaml
steps:
  - name: process-batch
    exec: "python process.py --offset {{offset}} --limit 100"

  - name: check-more
    exec: "test -z $(python check.py --offset {{offset + 100}})"

  - name: continue-if-more
    if: "{{ check-more.exit_code != 0 }}"
    exec: "mekong run --args offset={{offset + 100}} batch-process.yaml"
```

**Temporal equivalent:** Workflow restarts with next offset. CLI tool invokes itself recursively.

### 4.8 Interceptors for Observability

**Python-based CLI interceptor:**

```python
# src/core/interceptors.py
class LoggingInterceptor:
    def before_execute(self, step: Step):
        logger.info(f"Starting: {step.name}")

    def after_execute(self, step: Step, result: ExecutionResult):
        logger.info(f"Completed: {step.name}, exit_code={result.exit_code}")

    def on_error(self, step: Step, error: Exception):
        logger.error(f"Failed: {step.name}, error={error}")

# Usage in orchestrator
for step in recipe.steps:
    interceptor.before_execute(step)
    try:
        result = await executor.execute(step)
        interceptor.after_execute(step, result)
    except Exception as e:
        interceptor.on_error(step, e)
        raise
```

---

## Part 5: Implementation Recommendations

### 5.1 Adopt for Mekong CLI

**High-priority patterns to implement:**

1. **Deterministic Plans** (Temporal workflows)
   - Plan logic = pure orchestration (no I/O)
   - Activities = shell exec, LLM calls
   - Status: Easy—refactor `planner.py`

2. **Execution Trace Checkpointing** (Temporal event history)
   - Save progress after each step
   - Resume from last completed step on crash
   - Status: Medium—modify `orchestrator.py`

3. **Retry Policies** (Temporal RetryPolicy)
   - Exponential backoff for failed steps
   - Non-retryable error list
   - Status: Easy—configure in recipe YAML

4. **Saga Compensation** (Temporal saga pattern)
   - Define compensation for each step
   - Rollback on failure in reverse order
   - Status: Medium—add to step definition

5. **Parallel Execution** (Temporal child workflows)
   - `asyncio.gather()` for parallel steps
   - Aggregate results + failures
   - Status: Easy—refactor executor

6. **Heartbeating** (Temporal activity heartbeat)
   - Periodic progress checkpoint for long steps
   - Resume from last heartbeat on crash
   - Status: Medium—wrap subprocess calls

### 5.2 Non-Temporal Patterns to Avoid

- Don't replay LLM-generated plans (non-deterministic)
- Don't retry entire workflows (triggers determinism issues)
- Don't mix I/O into orchestration logic

### 5.3 Technology Debt / Quick Wins

1. **Checkpointing (HIGH IMPACT)**
   - Currently: No execution history on crash → restart from step 1
   - Fix: Save `execution_trace.json` after each step
   - Effort: 2 hours
   - Benefit: 10x faster recovery

2. **Retry Policies (MEDIUM IMPACT)**
   - Currently: No backoff on shell command failures
   - Fix: Add exponential backoff + max attempts in recipe YAML
   - Effort: 3 hours
   - Benefit: Better handling of transient failures

3. **Compensation/Rollback (HIGH IMPACT)**
   - Currently: Failed plans leave artifacts (git branches, files)
   - Fix: Define compensation per step
   - Effort: 4 hours
   - Benefit: Clean failure states

---

## Part 6: Unresolved Questions

1. **How to implement event sourcing without Temporal server?**
   - Option A: Store execution trace as JSON file (simple, local)
   - Option B: Use lightweight database (SQLite)
   - Decision needed: Performance vs. portability

2. **Should plans be statically defined (YAML) or generated by LLM?**
   - Temporal constraint: Workflows must be deterministic
   - If plans are LLM-generated, replaying may fail
   - Possible solution: LLM-generated plan + static step executors

3. **How to handle long-running activities in CLI (e.g., 1h build)?**
   - Temporal: Activity heartbeat every few seconds
   - CLI: Subprocess I/O polling every N seconds
   - Decision needed: Heartbeat interval (5s? 30s?)

4. **Should CLI support nested workflows (subplans)?**
   - Temporal: `execute_child_workflow()` built-in
   - CLI: Could invoke `mekong run recipe.yaml` recursively
   - Decision needed: Depth limit, naming conventions

5. **Can Continue-As-New be used for infinite job queues?**
   - Temporal: Yes, restart with next batch
   - CLI: Requires invoking tool recursively
   - Decision needed: Exit cleanly vs. continuous loop

6. **How to test deterministic plans?**
   - Temporal: Built-in test harness with replay
   - CLI: Could use execution trace comparison
   - Decision needed: Testing framework

---

## Summary

Temporal.io provides battle-tested patterns for distributed, fault-tolerant execution:

- **Determinism** ensures reproducible workflows
- **Activity separation** isolates non-deterministic work
- **Checkpointing** enables recovery from any step
- **Retry policies** handle transient failures
- **Compensation** implements saga pattern
- **Interceptors** provide observability

For **mekong-cli**, adopting these patterns (especially deterministic plans + checkpointing) will dramatically improve reliability and developer experience. High-impact quick wins: checkpointing (2h), retry policies (3h), compensation (4h).

---

## Sources

- [Temporal Python SDK Documentation](https://docs.temporal.io/develop/python)
- [Temporal Python SDK GitHub](https://github.com/temporalio/sdk-python)
- [Temporal Python Samples](https://github.com/temporalio/samples-python)
- [Temporal TypeScript SDK Documentation](https://docs.temporal.io/develop/typescript)
- [Temporal TypeScript SDK GitHub](https://github.com/temporalio/sdk-typescript)
- [Temporal Interceptors Guide](https://docs.temporal.io/develop/typescript/interceptors)
- [Temporal Retry Policies](https://docs.temporal.io/encyclopedia/retry-policies)
- [Temporal Workflow Definition Constraints](https://docs.temporal.io/workflow-definition)
- [Temporal Side Effects Guide](https://docs.temporal.io/develop/go/side-effects)
- [Temporal Child Workflows](https://docs.temporal.io/child-workflows)
- [Understanding Determinism in Temporal](https://medium.com/@sanhdoan/understanding-non-determinism-in-temporal-io-why-it-matters-how-to-avoid-it-3d397d8a5793)
- [Temporal Durable Execution Platform](https://temporal.io/product)

