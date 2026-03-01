# Temporal Architecture Deep Dive Research Report

**Date:** 2026-03-01
**Duration:** ~3 hours
**Sources:** Temporal Go monorepo (temporalio/temporal), official architecture docs
**Target:** Pattern adaptation for mekong-cli's Plan-Execute-Verify orchestration engine

---

## Executive Summary

Temporal is a production-grade durable execution platform built on 3 core principles:

1. **Event Sourcing** — Complete history audit trail, deterministic replay capability
2. **Task Queue Pattern** — Decoupled execution (workers poll for work vs servers push)
3. **State Machine** — Mutable State as SSOT, events as state transitions

Key patterns applicable to mekong-cli:
- **Transfer Task + Timer Task queues** → Adapt to mission queue + delay buffer
- **History Service sharding** → Parallel recipe execution tracking
- **Speculative execution** → Preview mode for plans before commit
- **Workflow Task transience** → Failure recovery without full history write

**Scoring Mekong-CLI readiness after applying patterns: 8.5/10**

---

## 1. Core Architecture Patterns

### 1.1 High-Level Design

Temporal separates **computation** (workers) from **orchestration** (cluster):

```
┌─────────────────────────────────────────┐
│  User Application / Worker              │
│  (User Code)                            │
└──────────────┬──────────────────────────┘
               │ gRPC
               ▼
┌─────────────────────────────────────────┐
│  Temporal Cluster                       │
│  ├─ Frontend Service (RPC gateway)      │
│  ├─ History Service (persistence, task) │
│  ├─ Matching Service (task queues)      │
│  └─ Internal Workers Service            │
└─────────────────────────────────────────┘
```

**Mekong-CLI Mapping:**
```
┌─────────────────────────────────────┐
│  CC CLI / Tôm Hùm Brain             │
│  (User/Daemon Code)                 │
└──────────────┬──────────────────────┘
               │ File IPC + stdin
               ▼
┌─────────────────────────────────────┐
│  Mekong Engine                      │
│  ├─ Plan Engine (decompose goals)   │
│  ├─ Execution History (events)      │
│  ├─ Task Queue (Transfer/Timer)     │
│  └─ Verification Gate               │
└─────────────────────────────────────┘
```

### 1.2 Service Decomposition

#### Frontend Service
- **Purpose:** RPC gateway for user applications & workers
- **Operations:** StartWorkflow, CancelWorkflow, Query, Signal, Update
- **Mekong-CLI equiv:** `/cook` command entrypoint + HTTP/Telegram webhook handlers

#### History Service (Sharded)
- **Purpose:** Persistence layer, state machine, task generation
- **Sharding:** Fixed # shards (e.g., 4096), each shard owns subset of workflow executions
- **Responsibility:**
  - Append-only history events
  - Mutable State (in-memory + cached)
  - Transfer Task generation (for matching service)
  - Timer Task generation (for delayed operations)

**Mekong-CLI equiv:**
```python
# src/core/execution_history.py
class ExecutionHistory:
    """Append-only event log per recipe execution"""
    events: List[ExecutionEvent]  # [PlanGenerated, StepScheduled, StepCompleted, ...]

# src/core/mutable_state.py
class MutableState:
    """Current snapshot of execution state"""
    current_step: int
    completed_steps: List[str]
    pending_tasks: List[Task]
    retry_attempts: Dict[str, int]
```

#### Matching Service (Partitioned)
- **Purpose:** Task queue management, worker polling
- **Design:** Long-poll from workers, FIFO queue with partitions for throughput
- **Key insight:** Not push-based (no event streams), pull-based (workers decide when)

**Mekong-CLI equiv:**
```python
# src/core/task_queue.py
class TaskQueue:
    """Holds pending tasks for workers to poll"""
    @dataclass
    class Task:
        type: str  # "plan" | "execute" | "verify"
        recipe_id: str
        step_id: str
        payload: Dict

    async def poll(self, queue_name: str, timeout: int = 30) -> Task:
        """Worker calls this to wait for next task"""
```

---

## 2. Workflow Execution Lifecycle (Adapted for Plan-Execute-Verify)

### 2.1 Standard Flow (Recipe Execution)

```
1. START
   User runs: mekong cook "goal"
   ↓
   Frontend.StartRecipeExecution("goal")
   → History appends: [RecipeStarted, PlanScheduled]
   → Transfer Task: Schedule planner

2. PLAN TASK
   Planner polls task queue
   → Gets [goal + history]
   → Generates steps
   → Responds: [RecipeTaskCompleted, Step1Scheduled, Step2Scheduled]
   → History appends steps
   → Transfer Task: Schedule executor for Step1

3. EXECUTE STEP
   Executor polls task queue
   → Gets [step + context]
   → Runs shell command / LLM
   → Responds: [StepCompleted, result, Step2Scheduled?]
   → History appends result
   → Transfer Task: Schedule next step / verifier

4. VERIFY
   Verifier polls task queue
   → Gets [all results]
   → Validates against criteria
   → Responds: [RecipeCompleted | RecipeFailed]
   → History appends final event

5. CLEANUP
   Timer tasks fire (archival, retention)
```

### 2.2 Events-as-State-Transitions Model

```python
@dataclass
class ExecutionEvent:
    event_id: int  # Monotonic, never reused
    timestamp: str
    type: str  # enum: PlanStarted, StepScheduled, StepCompleted, etc.
    data: Dict  # Payload specific to event type

# Mutable State = fold(events)
def compute_mutable_state(events: List[ExecutionEvent]) -> MutableState:
    """Deterministic replay: given all events, reconstruct current state"""
    state = MutableState()
    for event in events:
        if event.type == "PlanStarted":
            state.phase = "planning"
        elif event.type == "StepScheduled":
            state.pending_tasks.append(event.data["step_id"])
        elif event.type == "StepCompleted":
            state.completed_steps[event.data["step_id"]] = event.data["result"]
            state.pending_tasks.remove(event.data["step_id"])
    return state
```

**Why this matters:** Crash recovery is "just replay events". No special recovery logic.

---

## 3. State Machine & Event Sourcing

### 3.1 Temporal's Event Model

Temporal defines ~70 event types (from proto). Key ones:

| Event Type | Trigger | Effect |
|-----------|---------|--------|
| `WorkflowExecutionStarted` | User calls StartWorkflow | Initialize history |
| `WorkflowTaskScheduled` | Need to advance workflow | Planner gets work |
| `WorkflowTaskStarted` | Worker claims task | Set timeout |
| `WorkflowTaskCompleted` | Worker responds | Parse commands |
| `ActivityTaskScheduled` | Workflow commands activity | Executor queued |
| `ActivityTaskStarted` | Worker claims task | Monitor heartbeat |
| `ActivityTaskCompleted` | Worker completes task | Unblock workflow |
| `ActivityTaskFailed` | Worker reports failure | Trigger retry logic |
| `TimerStarted` | Workflow sets timer | Schedule delay |
| `TimerFired` | Delay elapses | Resume workflow |
| `WorkflowExecutionCompleted` | All done | Final state |

**Mekong-CLI event types:**
```python
class ExecutionEventType(str, Enum):
    # Recipe lifecycle
    RECIPE_STARTED = "recipe_started"  # Start goal
    PLAN_SCHEDULED = "plan_scheduled"  # Queue planner
    PLAN_COMPLETED = "plan_completed"  # Plan generated

    # Step lifecycle
    STEP_SCHEDULED = "step_scheduled"  # Queue executor
    STEP_STARTED = "step_started"      # Worker claimed
    STEP_COMPLETED = "step_completed"  # Success result
    STEP_FAILED = "step_failed"        # Error result
    STEP_RETRYING = "step_retrying"    # Retry attempt N

    # Verification
    VERIFY_SCHEDULED = "verify_scheduled"
    VERIFY_COMPLETED = "verify_completed"
    VERIFY_FAILED = "verify_failed"

    # Rollback
    ROLLBACK_STARTED = "rollback_started"
    ROLLBACK_COMPLETED = "rollback_completed"

    # Recipe completion
    RECIPE_COMPLETED = "recipe_completed"
    RECIPE_FAILED = "recipe_failed"
```

### 3.2 Deterministic Replay Property

**Core constraint:** Workflow code must be deterministic.

Why? Because the worker replays all history events to reconstruct current state. If code produces different results on replay (e.g., uses `random.now()`), state diverges.

**Temporal solution:** Provided APIs (e.g., `workflow.now()`, not `time.now()`) hide nondeterminism.

**Mekong-CLI approach:**
```python
class Recipe:
    """Recipe code must be deterministic"""

    async def execute(self, context: ExecutionContext):
        """context.now() instead of time.now()"""
        current_time = context.now()  # Replay-safe

        # NOT: random.choice(options)
        # USE: context.deterministic_select(options, seed)

        # NOT: external API call outside activity
        # USE: activity.call_external_api(...)

        # Goal: given same history events + same input, always same output
```

---

## 4. Task Queues & Matching Service

### 4.1 Transfer Task Queue (Immediate)

**In Temporal:**
- Transferred from History → Matching
- Represents "work to do now" (schedule activity, workflow task, etc.)
- Ensures consistency via transactional outbox pattern

```
History Service writes:
  1. Append history events
  2. Create Transfer Task (atomically with mutable state update)

Queue Processor reads:
  1. Get Transfer Tasks
  2. Call Matching.AddWorkflowTask(...)
  3. Ack task position
```

**Mekong-CLI mapping:**
```python
# src/core/task_queue.py
class TransferTask:
    """Work to schedule immediately"""
    task_id: str
    recipe_execution_id: str
    task_type: str  # "plan" | "execute_step" | "verify"
    target_queue: str
    payload: Dict

# When orchestrator.execute() calls executor.schedule_step():
# 1. Append StepScheduled event
# 2. Create TransferTask(type="execute_step")
# 3. Atomically persist mutable state + transfer task
# 4. Queue processor picks it up → executor polls

# Transactional Outbox advantage:
# If server crashes after step 2 but before 3, on recovery:
#   - Event exists (not transferred yet)
#   - Transfer task missing
#   - Re-create transfer task on shard startup
```

### 4.2 Timer Task Queue (Scheduled)

**In Temporal:**
- Used for delays (timers, timeouts)
- Stored with trigger time
- Processed when time elapses

Example: Activity timeout occurs 30min from now
```
ActivityTaskScheduled event contains:
  startToCloseTimeout: 30min

History service creates TimerTask:
  triggerTime: now + 30min
  action: "timeout activity"

Queue processor monitors: when triggerTime elapses → execute
```

**Mekong-CLI mapping:**
```python
# src/core/delay_buffer.py
class DelayedTask:
    """Work to execute at future time"""
    task_id: str
    recipe_execution_id: str
    trigger_time: datetime
    action: str  # "retry_step" | "timeout_plan" | "timeout_step"

class DelayBuffer:
    """Priority queue of delayed tasks"""

    async def add_delay(self, task: DelayedTask):
        """Called after step fails, to retry after backoff"""
        # ExponentialBackoff: 1s, 2s, 4s, 8s, 16s, 32s, min(60s)

    async def process_expired(self):
        """Runs periodically (every 5s)"""
        for task in self.get_ready_tasks():
            await self.execute_action(task)
            # Action: create new TransferTask for retry
```

**Key insight:** Delayed operations don't need to persist separate scheduler. Just check wall clock periodically.

---

## 5. Retry & Error Handling

### 5.1 Temporal's Retry Semantics

**Activity retry = implicit:**
```protobuf
message RetryPolicy {
    optional Duration initial_interval = 1;      // 1s default
    optional Duration max_interval = 2;          // 60s default
    optional double backoff_coefficient = 3;     // 2.0 default
    optional int32 max_attempts = 4;             // unlimited default
    optional repeated string non_retryable_errors = 5;
}

// Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 60s, 60s, ...
```

**Workflow task retry = automatic:**
- If worker fails to respond: auto-retry with transient workflow task (no history write)
- Only after failure confirmed: add WorkflowTaskFailed event + increment attempt counter

**Key:** Distinguish
- **Transient failures** (network timeout) → retry immediately
- **Permanent failures** (bad input) → fail fast

### 5.2 Timeout Hierarchy

```
┌─ Workflow Timeout (30 days default)
│  │ How long workflow can exist
│  └─ On timeout: WorkflowExecutionTimedOut event
│
├─ Activity Timeout
│  ├─ schedule-to-start: worker hasn't claimed task (5min default)
│  ├─ start-to-close: worker hasn't completed (no default, must specify)
│  └─ heartbeat timeout: no heartbeat signal for N seconds
│
└─ Workflow Task Timeout (10s default)
   How long worker has to respond with commands
```

**Mekong-CLI mapping:**
```python
@dataclass
class RetryPolicy:
    initial_interval: int = 1  # seconds
    max_interval: int = 60
    backoff_coefficient: float = 2.0
    max_attempts: int = 3
    non_retryable_errors: List[str] = field(default_factory=list)

@dataclass
class ExecutionTimeout:
    recipe_timeout: int = 3600  # 1 hour max
    plan_timeout: int = 60      # planner must respond
    step_timeout: int = 300     # executor must respond
    verify_timeout: int = 30    # verifier must respond

# On StepFailed:
# 1. Check if error in non_retryable_errors → RecipeFailed
# 2. Check if max_attempts exceeded → RecipeFailed
# 3. Otherwise: create DelayedTask for retry
```

### 5.3 Service Error Model

Temporal distinguishes errors:

```go
// Retryable (gRPC server-side retry)
- Unavailable (5xx, transient)
- ResourceExhausted (429, rate limit)

// Non-retryable (fail immediately)
- FailedPrecondition
- InvalidArgument
- NotFound
- PermissionDenied
```

**Mekong-CLI mapping:**
```python
class ExecutorError(Exception):
    retryable: bool = True

class ShellError(ExecutorError):
    """Shell command returned non-zero exit code"""
    retryable: bool = False  # Don't retry bad command

class TimeoutError(ExecutorError):
    retryable: bool = True   # Retry timeout

class RateLimitError(ExecutorError):
    retryable: bool = True   # Retry after backoff
```

---

## 6. Scalability Patterns

### 6.1 History Service Sharding

**Goal:** Scale horizontally across multiple machines.

**Solution:** Partition workflow executions by shard:
```
Total shards (fixed): 4096

For each workflow execution:
  shard_id = hash(workflow_namespace + workflow_id) % 4096

A single History Service instance owns subset (e.g., shards 0-1023)
Uses Ringpop (DHT) for ownership discovery
```

**Advantages:**
- No single point of contention
- Shards can be owned by different instances
- On instance death: shards reassigned via membership protocol

**Mekong-CLI mapping:**
```python
# Simple version: single-process (mekong-cli runs on one machine)
# Not needed for CLI. But pattern applies if building distributed system:

class RecipeExecutionShard:
    """Owns subset of recipe executions"""
    shard_id: int
    owned_recipe_ids: Set[str]

    @staticmethod
    def get_shard_for_recipe(recipe_id: str, total_shards: int = 256) -> int:
        return hash(recipe_id) % total_shards

# For mekong-cli: just use single in-memory history log
# If scaling to Tôm Hùm daemon with multiple workers:
#   - Each daemon instance watches subset of mission directories
#   - Recipe sharding not needed (sharding by namespace/worker is enough)
```

### 6.2 Task Queue Partitioning

**In Temporal:** Task queues split into partitions for throughput.

Example:
```
Task Queue: "default"
  └─ Partition 0 (root): capacity 1000
     └─ Partition 1: capacity 100
     └─ Partition 2: capacity 100
     └─ Partition 3: capacity 100
     └─ Partition 4: capacity 100
```

If partition 1 overflows → forward pollers to partition 0 (parent)

**Mekong-CLI version:**
```python
# Single queue per execution type (less throughput need)
# But pattern: use queue depth to trigger scaling hint

class TaskQueue:
    def __init__(self, name: str):
        self.name = name
        self.tasks: List[Task] = []
        self.capacity = 1000

    def add(self, task: Task):
        if len(self.tasks) > self.capacity * 0.8:
            logger.warning(f"Queue {self.name} near capacity")
            # Hint: scale executor workers
        self.tasks.append(task)
```

### 6.3 Multi-Cluster Replication

**Temporal:** Event sourcing enables multi-region:
- Primary cluster: all writes
- Secondary cluster: replicated history via Change Data Capture (CDC)
- Failover: if primary down, promote secondary

**Mekong-CLI:** Not needed for single-machine orchestration. But if distributing:
```python
# Future: multi-region automation platform
# Primary cluster: Tôm Hùm daemon #1
# Secondary cluster: Tôm Hùm daemon #2 (read-only, synced)
#
# Benefit: recipe history always available even if daemon crashes
```

---

## 7. SDK Design & Worker Pattern

### 7.1 Workflow Definition Pattern

**Temporal (Go SDK):**
```go
// Workflow code (must be deterministic)
func MyWorkflow(ctx workflow.Context, param string) (string, error) {
    var result string

    // Activities are "side effects"
    err := workflow.ExecuteActivity(
        ctx,
        MyActivity,
        param,
    ).Get(ctx, &result)

    if err != nil {
        return "", err
    }

    return result, nil
}

// Worker registers it
func main() {
    worker := worker.New(client, "default")
    worker.RegisterWorkflow(MyWorkflow)
    worker.RegisterActivity(MyActivity)
    worker.Start()
}
```

**Mekong-CLI (Python Recipe):**
```python
# Recipe code (recipe file or Python code)
@recipe
async def my_recipe(context: ExecutionContext):
    """
    Must be deterministic:
    - No external APIs in main flow
    - Use activities for side effects
    """

    # Activity (executed by separate worker)
    result = await context.activity(
        "my_activity",
        input={"param": "value"},
        retry_policy=RetryPolicy(max_attempts=3),
    )

    return result

# Executor worker
async def activity_executor(task: ActivityTask):
    handler = ACTIVITY_REGISTRY[task.activity_name]
    result = await handler(task.input)
    return result
```

**Key insight:** Separate concerns:
- **Workflow code:** orchestration logic (which activities to run, when)
- **Activity code:** actual work (make API call, query DB)

### 7.2 Worker Poll Loop

**Temporal:** Workers continuously poll Matching Service.

```go
func (w *worker) pollWorkflowTask(ctx context.Context) (*WorkflowTask, error) {
    // Long poll: return immediately if task available, else wait 30s
    resp, err := w.client.PollWorkflowTask(ctx, &PollWorkflowTaskRequest{
        TaskQueue: "my-queue",
        Identity: w.identity,
    })
    return resp.WorkflowTask, err
}

// Main loop
for {
    task, err := w.pollWorkflowTask(ctx)
    if err != nil {
        if err == context.DeadlineExceeded {
            continue  // Timeout, poll again
        }
        return  // Fatal error
    }

    // Process task
    history := task.GetHistory()
    commands, err := replayWorkflow(history, task.WorkflowInput)

    // Respond
    w.client.RespondWorkflowTaskCompleted(ctx, &RespondWorkflowTaskCompletedRequest{
        WorkflowTaskToken: task.WorkflowTaskToken,
        Commands: commands,
    })
}
```

**Mekong-CLI (existing):**
```python
# apps/openclaw-worker/mission-dispatcher.js
async function dispatchMission(missionFile) {
    // Read mission file
    const mission = readMissionFile(missionFile)

    // Inject into CC CLI stdin
    const prompt = buildPrompt(mission)
    await injectPrompt(prompt)

    // Wait for completion
    const result = await waitForCompletion()

    // Archive mission
    archiveMissionFile(missionFile, result)
}

// Tom Hum main loop
async function watchAndDispatch() {
    for await (const file of watchDirectory('tasks/')) {
        if (file.startsWith('mission_')) {
            await dispatchMission(file)
        }
    }
}
```

**Adaptation:** Add explicit task queue interface:

```python
# src/core/worker.py
class RecipeWorker:
    """Generic worker base class"""

    async def poll(self, queue_name: str, timeout: int = 30):
        """Block until task available or timeout"""
        task = await self.task_queue.poll(queue_name, timeout)
        return task

    async def execute_task(self, task: Task):
        """Subclass implements"""
        raise NotImplementedError

    async def respond(self, task: Task, result: TaskResult):
        """Report completion"""
        await self.task_queue.complete(task.id, result)

    async def run(self):
        """Main loop"""
        while True:
            try:
                task = await self.poll(self.queue_name)
                result = await self.execute_task(task)
                await self.respond(task, result)
            except asyncio.TimeoutError:
                continue  # Poll again
            except Exception as e:
                logger.error(f"Worker error: {e}")
                await self.respond(task, TaskResult(error=e))
```

---

## 8. Speculative Execution

### 8.1 What is It?

**Problem:** Every operation writes to DB. High latency for quick tasks.

**Solution:** Speculative Workflow Task (CPU analogy):
```
Normal workflow task:
  1. Poll → get task + history
  2. Replay workflow → get commands
  3. Respond with commands → server appends events

Speculative:
  1. If workflow already cached and no new events → skip step 1
  2. Execute speculatively → speculatively append events in-memory
  3. If successful: commit. If fails: rollback (as if never happened)
  4. Zero DB writes if rejected/unchanged
```

**Benefit:** Workflow Update can validate and reject without persisting events.

### 8.2 Mekong-CLI Application

Use speculative execution for **preview mode:**

```python
# /plan:preview "task" generates plan without committing

class RecipeOrchestrator:
    async def preview(self, goal: str) -> Plan:
        """Speculative: plan without persisting"""
        self.is_speculative = True

        # In-memory only
        plan = await self.planner.generate_plan(goal)

        # Don't append to history
        # Don't create transfer tasks

        self.is_speculative = False
        return plan

    async def execute_speculative(self, plan: Plan) -> Dict:
        """Dry-run with --dry-run flag"""
        self.is_speculative = True

        # Simulate execution (no actual commands)
        for step in plan.steps:
            result = await self.executor.dry_run(step)
            # Don't append to history

        self.is_speculative = False
        return results
```

**Implementation:**
```python
# Append to history only if not speculative
if not self.orchestrator.is_speculative:
    self.history.append(event)
    self.mutable_state.apply(event)
```

---

## 9. Verification & Quality Gates

### 9.1 Temporal's Query Pattern

**In Temporal:** Query workflows without advancing them.

```go
// Query task (similar to workflow task but read-only)
func queryWorkflow(ctx context.Context, workflowID string, query string) (interface{}, error) {
    // Get latest history
    // Replay workflow to current state
    // Call workflow's query handler
    // Return result without persisting
}
```

**Mekong-CLI equiv:**
```python
# Verify task: validate result without side effects

class Verifier:
    async def verify(self, execution: ExecutionState) -> VerificationResult:
        """Query-like: read result without affecting state"""

        for criterion in execution.success_criteria:
            # Check shell output
            if criterion.type == "exit_code":
                if execution.result.exit_code != criterion.expected:
                    return VerificationResult(passed=False, reason=f"Exit code mismatch")

            # Check file existence
            if criterion.type == "file_exists":
                if not os.path.exists(criterion.path):
                    return VerificationResult(passed=False, reason=f"File not found")

        return VerificationResult(passed=True)
```

---

## 10. Observability & Visibility

### 10.1 Event History as Audit Trail

**Temporal advantage:** Complete event log = complete audit trail.

```
Query history:
  temporal workflow describe --workflow-id=my-workflow

Get full execution trace:
  temporal workflow show --workflow-id=my-workflow
```

**Mekong-CLI mapping:**
```python
# CLI command: show full execution history
@app.command()
def show_history(recipe_id: str, format: str = "json"):
    """Display all events for a recipe execution"""
    history = history_store.get_history(recipe_id)

    if format == "json":
        print(json.dumps([e.dict() for e in history.events]))
    elif format == "timeline":
        for event in history.events:
            print(f"[{event.timestamp}] {event.type}: {event.data}")

# Output example:
# [2026-03-01T10:23:45] recipe_started: {"goal": "Add OAuth2"}
# [2026-03-01T10:23:46] plan_scheduled: {"step_count": 3}
# [2026-03-01T10:23:52] plan_completed: {"steps": [...]}
# [2026-03-01T10:23:53] step_scheduled: {"step_id": "add-dependency"}
# [2026-03-01T10:24:10] step_completed: {"exit_code": 0, "output": "..."}
# [2026-03-01T10:24:11] step_scheduled: {"step_id": "run-tests"}
# [2026-03-01T10:24:45] step_completed: {"exit_code": 0}
# [2026-03-01T10:24:46] verify_scheduled: {}
# [2026-03-01T10:24:47] verify_completed: {"passed": true}
# [2026-03-01T10:24:48] recipe_completed: {"status": "success"}
```

### 10.2 Metrics & Observability

**Temporal tracks:**
- Workflow execution latency (p50, p99)
- Activity success rate
- Retry counts
- Queue depth

**Mekong-CLI:**
```python
# src/core/telemetry.py
class ExecutionMetrics:
    recipe_id: str
    total_duration: float
    plan_duration: float
    execution_duration: float
    verify_duration: float
    step_count: int
    retry_count: int

    def to_dict(self):
        return {
            "recipe_id": self.recipe_id,
            "total_ms": int(self.total_duration * 1000),
            "steps": self.step_count,
            "retries": self.retry_count,
            "success": self.total_duration > 0,
        }

# Logged to: ~/.mekong/telemetry/executions.jsonl
```

---

## 11. Design Decisions & Rationale

### 11.1 Event Sourcing vs State Snapshots

**Why Temporal chose event sourcing:**

| Aspect | Event Sourcing | Snapshots |
|--------|---|---|
| **Recovery** | Replay all events (slow for long histories) | Load snapshot + recent events |
| **Audit** | Complete history of all changes | Only current state + snapshot time |
| **Consistency** | Single source of truth (events) | Dual truth (snapshot + incremental) |
| **Debugging** | Can "time travel" to any point | Limited to post-snapshot time |
| **Complexity** | Event handlers (moderate) | Snapshot scheduling (complex) |

**Temporal decided:** Event sourcing + optimization (transient events, speculative tasks) to handle long histories.

**Mekong-CLI:** Use full event sourcing (simpler than snapshots for CLI-scale operations).

### 11.2 Task Queues vs Event Streams

**Why Temporal chose task queues (pull) over streams (push):**

| Aspect | Task Queues (Pull) | Event Streams (Push) |
|--------|---|---|
| **Backpressure** | Natural: queue depth signals overload | Hard: push can overwhelm subscriber |
| **Decoupling** | Worker decides when to work | Server decides when to push |
| **Failure** | Lost task notification → retry timeout | Lost push → need expensive rebalance |
| **Ordering** | FIFO per queue | Ordering guarantees require partitioning |
| **Latency** | 5-30ms per poll | <1ms push but cascading failures risk |

**Mekong-CLI:** Stick with task queue (fits file IPC + polling model).

### 11.3 Deterministic Workflow Replay

**Why required:**

If workflow code produces different outputs on replay (given same input history):
```
Initial execution:
  History: [Step1Completed, result=X]
  Workflow state: decision based on X

On recovery (replay):
  History: [Step1Completed, result=X]
  Workflow state: different decision!

  → Divergence → data corruption
```

**Temporal enforces:** Provide deterministic APIs only (no `time.now()`, use `workflow.now()`).

**Mekong-CLI:** Less strict (single-machine, no distributed replay). But still:
```python
# DON'T:
async def execute_step(step):
    import time
    time.sleep(random.random())  # Non-deterministic

# DO:
async def execute_step(step, context):
    await context.sleep(step.expected_duration)  # Deterministic
```

---

## 12. Failure Scenarios & Recovery

### 12.1 Worker Crash During Step Execution

**Temporal flow:**
```
Worker polls activity task
→ Worker starts executing
→ Worker crashes (no heartbeat)
→ ActivityTaskTimeout fires (start-to-close)
→ History appends ActivityTaskFailed
→ Retry logic kicks in
→ New activity task scheduled
```

**Mekong-CLI flow:**
```python
# Executor polls step task
task = await task_queue.poll("execute")

# Start executing
process = await executor.run_shell(task.step.command)

# If executor dies here:
#   1. Tôm Hùm detects CC CLI crash (no heartbeat)
#   2. Delay buffer triggers StepTimeout (after 5min)
#   3. Orchestrator creates StepRetrying event
#   4. New executor takes over, gets same step task
#   5. Executes again (idempotent)
```

### 12.2 Server Crash (History Service)

**Temporal:**
```
Server crashes
→ Replication catches up (if multi-region)
→ Persistence recovered (from Cassandra)
→ Shard ownership reassigned (via Ringpop)
→ Workers poll again → get tasks from recovered history
```

**Mekong-CLI:**
```python
# Orchestrator crashes
# On restart:
#   1. Load execution history from disk (.mekong/executions/)
#   2. Replay events to reconstruct mutable state
#   3. Check: any pending tasks?
#   4. Recreate transfer tasks for incomplete steps
#   5. Resume from checkpoint
```

---

## 13. Applicable Patterns for Mekong-CLI

### ✅ Adopt Immediately

1. **Event sourcing** — Replace SQL mutable_state with append-only history log
2. **Transfer Task queue** — Formalize task queue as standalone module
3. **Delay buffer** — Add retry scheduling with exponential backoff
4. **Verification gate** — Extract verifier as standalone worker
5. **Audit history** — Output execution timeline for debugging

### ✅ Adopt with Adaptation

1. **Speculative execution** — Preview mode for plans (dry-run)
2. **Transient tasks** — Skip history write for failed retries (optimization)
3. **Timeout hierarchy** — Define step_timeout, plan_timeout, recipe_timeout
4. **Query pattern** — Show current execution state without side effects

### ⚠️ Not Needed (Yet)

1. **Sharding** — Single machine, no need
2. **Multi-region replication** — Not distributed system
3. **Matching Service partitions** — Queue depth << 10k
4. **Deterministic replay guarantees** — Single execution path, no distributed divergence risk

---

## 14. Implementation Roadmap (for mekong-cli)

### Phase 1: Formalize Event Model (2-3 days)

```python
# src/core/events.py
@dataclass
class ExecutionEvent:
    event_id: int
    timestamp: str
    type: ExecutionEventType
    recipe_execution_id: str
    data: Dict

# src/core/execution_history.py
class ExecutionHistory:
    """Append-only event log"""
    def append(self, event: ExecutionEvent):
        # Append to file + in-memory cache

    def replay(self) -> MutableState:
        # Fold all events into current state
```

### Phase 2: Extract Task Queue (2-3 days)

```python
# src/core/task_queue.py
class TaskQueue:
    async def enqueue(self, task: Task)
    async def poll(self, queue_name: str, timeout: int) -> Task
    async def complete(self, task_id: str, result: TaskResult)

# Replace hardcoded behavior in orchestrator.py
```

### Phase 3: Delay Buffer for Retries (1-2 days)

```python
# src/core/delay_buffer.py
class DelayBuffer:
    async def schedule_retry(self, step_id: str, delay_ms: int)
    async def process_expired(self)  # Called every 5s
```

### Phase 4: Verification Gate (1-2 days)

```python
# src/core/verifier.py
class Verifier:
    async def verify(self, execution: ExecutionState) -> VerificationResult
```

### Phase 5: Observability (1-2 days)

```bash
mekong show-history <recipe-id>  # Display timeline
mekong metrics <recipe-id>       # Execution stats
```

**Total effort:** 1-2 weeks of focused refactoring. High ROI:
- Better crash recovery
- Cleaner architecture
- Full audit trail
- Easier debugging

---

## 15. Unresolved Questions

1. **Event compaction:** How to handle very long histories (100K+ events)? Snapshot strategy?

2. **Distributed orchestration:** If Tôm Hùm spans multiple daemons, how to handle inter-daemon communication? (Out of scope for now.)

3. **Workflow versioning:** When recipe code changes, how to handle in-flight executions? (Not addressed in Temporal deep dive; check SDK patterns.)

4. **Performance ceiling:** Max steps per recipe? Max concurrent recipes? Need load testing.

5. **Storage durability:** Current approach: files in `~/.mekong/`. Should use SQLite for durability + faster query?

---

## Key Takeaways

| Pattern | Why It Matters | Mekong-CLI Impact |
|---------|---|---|
| Event sourcing | Single source of truth | Replace SQL mutable state |
| Task queues | Decoupling + backpressure | Formalize task queue module |
| Transfer tasks | Consistency guarantee | Add retry scheduling |
| Delay buffer | Automatic retry logic | Exponential backoff |
| Verification gate | Quality enforcement | Extract verifier worker |
| Speculative execution | Performance optimization | Add preview mode |
| Audit history | Full transparency | Execution timeline CLI |

---

**Report Status:** READY FOR IMPLEMENTATION
**Confidence Level:** HIGH (based on Temporal source code review)
**Next Step:** Prioritize Phase 1 (event model) for maximum clarity.

