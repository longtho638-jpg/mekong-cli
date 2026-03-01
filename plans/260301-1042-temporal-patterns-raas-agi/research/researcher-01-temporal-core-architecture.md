# Temporal Core Architecture — Research Report
Date: 2026-03-01 | Researcher: 01

---

## 1. Workflow Engine — Durable Execution via Event Sourcing

**Core Mechanism:**
- Every workflow action (activity call, timer, signal) is written to an **immutable event history** in the Temporal DB before execution
- On worker restart/crash, Temporal **replays** the event history to reconstruct workflow state — no state stored in app memory
- Replay re-executes workflow code; SDK intercepts API calls and checks event history: if event exists → skip actual execution, return recorded result

**Key Design Decisions:**
- Workflows MUST be deterministic: same input → same sequence of API calls every replay
- Non-determinism sources banned in workflow code: `random()`, `time.now()`, goroutine races, I/O — use Temporal's SDK equivalents
- Event history is the single source of truth; DB is append-only for history rows
- History compacted via **Continue-As-New** when it grows too large (>50k events default)

**Why it matters:**
- Crash recovery is free — resume from exact failure point, zero code change
- Enables workflows spanning days/months/years (cron jobs, human-in-loop approvals)
- Distributed transactions without 2PC or distributed locks

---

## 2. Activity System — Side-Effects with Guaranteed Delivery

**Core Mechanism:**
- Activities = units of non-deterministic work (HTTP calls, DB writes, file I/O)
- Scheduled by workflow → placed on task queue → picked up by worker → executed → result persisted to event history
- Worker must **heartbeat** (`RecordHeartbeat`) for long-running activities; timeout = no heartbeat received within `HeartbeatTimeout`

**Key Design Decisions:**
- **Retry Policy**: `MaxAttempts`, `InitialInterval`, `BackoffCoefficient`, `MaxInterval`, `NonRetryableErrors` — configured per activity
- **Timeout hierarchy**: `ScheduleToStart` (queue wait), `StartToClose` (execution), `ScheduleToClose` (total), `HeartbeatTimeout`
- Activities are idempotent by design — retries replay the same activity; implementer must handle duplicates
- Activity result stored in event history; workflow receives it via replay

**Why it matters:**
- Decouples orchestration (workflow) from execution (activity)
- Automatic retry with exponential backoff — no custom retry loops needed
- Heartbeat enables detecting stuck workers; last heartbeat detail survives retry, enabling resume logic

---

## 3. Task Queue Architecture — Work Routing

**Core Mechanism:**
- Task queues are logical channels — workflows/activities are dispatched to queues, workers poll queues
- Two sub-queues per task queue: **workflow task queue** (decisions) and **activity task queue** (work)
- Workers long-poll the server; server pushes tasks when available

**Sticky Queues:**
- After first workflow task, server creates a **sticky queue** bound to the specific worker that handled it
- Next task for that workflow goes to sticky queue → same worker → cached workflow state (no full replay needed)
- Sticky queue timeout (default 10s): if worker unavailable, task falls back to normal queue → full replay on any worker

**Rate Limiting & Priority:**
- Per-task-queue rate limiting: `maxTasksPerSecond` on worker, `MaxConcurrentActivityExecutors`
- Separate queues per workload class (high-CPU, high-memory, external-API) = resource isolation
- No native priority queue yet (as of 2025); workaround = multiple queues + routing logic

**Why it matters:**
- Sticky queues minimize replay overhead for in-progress workflows (common path is cache hit)
- Multiple queues enable multi-tenant isolation, specialized workers, rate limiting per resource
- Worker polling = pull model → workers never overloaded by server push

---

## 4. Saga Pattern — Distributed Transactions

**Core Mechanism:**
- Temporal orchestrates Saga as a sequence of activities with compensation logic
- Pattern: execute step → on failure → run compensating activities in reverse order
- Workflow code holds saga state explicitly; no framework magic — developer writes compensations

**Implementation Pattern:**
```python
def saga_workflow():
    compensations = []
    try:
        result1 = execute_activity(step1)
        compensations.append(lambda: execute_activity(compensate_step1))
        result2 = execute_activity(step2, result1)
        compensations.append(lambda: execute_activity(compensate_step2))
    except Exception:
        for comp in reversed(compensations):
            comp()  # guaranteed to run even after crash
        raise
```

**Key Design Decisions:**
- Orchestration saga (not choreography) — single workflow controls the entire transaction
- Compensations are themselves activities: retryable, durable, observable
- No distributed lock: each local transaction commits independently; saga provides eventual consistency
- Forward recovery (retry) vs backward recovery (compensate) — developer chooses per step

**Why it matters:**
- Replaces XA/2PC with code-level logic that is debuggable, versionable, observable
- Crash mid-saga → replay resumes from last committed event → compensations still run
- Business logic lives in code, not config/BPMN

---

## 5. Visibility & Observability

**Visibility Subsystem:**
- Workflow executions indexed in a **secondary store** (Elasticsearch for advanced, SQL for standard)
- Default search attributes auto-indexed: `WorkflowType`, `WorkflowId`, `RunId`, `ExecutionStatus`, `StartTime`, `CloseTime`
- Custom Search Attributes: strongly typed (keyword, text, int, double, datetime, bool) — set via `UpsertSearchAttributes` in workflow code
- Query language: SQL-like (`WorkflowType = 'OrderWorkflow' AND ExecutionStatus = 'Running'`)

**Metrics:**
- Each SDK emits metrics via Prometheus-compatible endpoint (or StatsD)
- Key metrics: `temporal_workflow_completed`, `temporal_activity_execution_latency`, `temporal_task_queue_poll_latency`, `temporal_sticky_cache_hit`
- Server-side metrics: persistence latency, history service load, matching service throughput

**Tracing:**
- SDK creates spans for: Client calls, workflow task execution, activity execution
- Spans propagated through server (context header injection) → single trace per workflow execution
- Integrations: OpenTelemetry (primary), Datadog, Jaeger

**Web UI:**
- Queries visibility store; shows workflow list, event history, stack traces of stuck workflows
- `temporal workflow list --query "..."` CLI mirrors Web UI

**Why it matters:**
- Elasticsearch visibility enables business-level queries ("all failed orders today")
- Distributed tracing spans workflow → activity → downstream services = full request lineage
- `temporal workflow stack` shows exact goroutine/coroutine where workflow is blocked

---

## Summary — Design Philosophy

| Principle | Implementation |
|-----------|---------------|
| Durability | Event history in DB; replay on crash |
| Scalability | Pull-based task queues; horizontal workers |
| Reliability | Retry policies + timeouts on every activity |
| Observability | Visibility store + OTel tracing + Prometheus metrics |
| Developer UX | Write sequential code; SDK handles durability |

---

## Unresolved Questions

1. History sharding limits: what is the practical max events/sec per workflow before Continue-As-New becomes mandatory?
2. Elasticsearch vs SQL visibility: exact feature delta in Temporal Cloud vs self-hosted?
3. Worker versioning (post-March 2026 removal of legacy): how does the new versioning model affect rolling deployments of workflow code changes?
4. Task queue priority: is native priority queue available in 2025 Cloud offering or still roadmap?
