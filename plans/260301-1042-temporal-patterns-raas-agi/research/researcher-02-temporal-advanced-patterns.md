# Temporal Advanced Patterns for AI Agent Orchestration
**Date:** 2026-03-01 | **Scope:** temporal.io/temporal advanced patterns → RaaS/AGI applicability

---

## 1. Child Workflows

**Mechanism:**
- Parent spawns child via `startChildWorkflow()` — child gets own WorkflowId, history, and lifecycle
- Parent can `await` child result or fire-and-forget (detach)
- Each child has independent retry policies, task queues, timeouts

**Parent Close Policy (3 options):**
- `ABANDON` — child continues running after parent closes (fire-and-forget agents)
- `REQUEST_CANCEL` — sends cancellation to child (graceful shutdown cascade)
- `TERMINATE` (default) — forceful kill (hard cutoff)
- Each child can have DIFFERENT policy → fine-grained control per sub-task

**Design decisions:**
- ContinueAsNew on child: parent sees entire run chain as single execution
- Child failures propagate to parent only if parent `await`s the result
- Fan-out pattern: parent spawns N children in parallel via `Promise.all()`

**AI Agent applicability:**
- Parent = orchestrator agent spawning tool-calling sub-agents
- `ABANDON` policy for background data-gathering agents that outlive the task
- `REQUEST_CANCEL` for graceful cleanup when orchestrator is cancelled
- Fan-out for parallel tool execution (web search + code exec + memory lookup simultaneously)

---

## 2. Signals & Queries

**Signals (write, async):**
- External event injection into a running workflow without interrupting execution
- Delivered guaranteed-at-least-once, buffered if workflow is processing
- Use cases: human approval gates, upstream data arrival, dynamic parameter updates
- Signal handlers run between workflow coroutine checkpoints

**Queries (read, sync):**
- Synchronous read of workflow state — never modifies state
- Returns current in-memory state without touching event history
- Supports custom handler functions that compute derived views
- Use cases: live status checks, progress polling, state inspection

**Design decisions:**
- Signals are durable: if worker is down, signal is stored and replayed on restart
- Queries require a live worker — they're NOT replayed from history
- `UpdateWithStart` (newer API): atomic signal + workflow start in one call
- Avoid signals for high-frequency updates → prefer polling or side-effects

**AI Agent applicability:**
- Signal = human-in-the-loop injection (approval, correction, new context)
- Query = real-time agent state visibility without side effects
- Signal for dynamic goal injection mid-execution (Antigravity → Tôm Hùm pattern)
- Query for dashboard polling agent progress/health without disturbing execution

---

## 3. Continue-As-New (CAN)

**Mechanism:**
- Closes current workflow run, immediately starts fresh run with same WorkflowId
- Carries forward only explicitly passed arguments — history is truncated
- New run appears in history as a linked continuation, not a new independent workflow
- Callers holding a handle see the entire chain as one logical execution

**Why needed:**
- Temporal event history has a hard limit (~50k events / ~50MB)
- Long-running loops accumulate events: each activity call = multiple events
- CAN resets the counter while preserving logical workflow identity

**Design decisions:**
- Pass only essential state forward (not full accumulated context)
- Trigger CAN proactively before hitting limits (e.g., every 1000 iterations)
- CAN is NOT a retry — it's a clean continuation with explicit state handoff
- Child workflows using CAN: parent sees full chain as one child execution

**AI Agent applicability:**
- Long-running agent loops (daily operations, infinite monitoring) MUST use CAN
- Pass summarized memory forward, not raw history (compression checkpoint)
- Tôm Hùm's eternal daemon loop → CAN every N missions to avoid history bloat
- Enables "eternal agent" pattern: indefinite execution with bounded resource use

---

## 4. Schedules & Cron

**Schedules (preferred, v1.17+):**
- First-class Temporal construct: create/pause/unpause/trigger/backfill/delete via SDK/CLI
- Independent of workflow — scheduler is a separate system component
- Overlap policies: `SKIP`, `BUFFER_ONE`, `BUFFER_ALL`, `CANCEL_OTHER`, `ALLOW_ALL`
- Supports cron expressions, intervals, calendar specs (timezone-aware)
- Backfill: replay missed runs for a time range

**Legacy Cron (deprecated pattern):**
- `cronSchedule` param on workflow start — tightly coupled to workflow definition
- Less flexible than Schedules, no pause/resume, no backfill
- Prefer Schedules for all new implementations

**Design decisions:**
- Schedules decouple triggering from execution — schedule survives worker restarts
- `SKIP` overlap = safe for idempotent jobs; `ALLOW_ALL` = parallel batch jobs
- Use workflow execution timeout on cron to cap each run's duration
- Jitter parameter prevents thundering herd on large-scale deployments

**AI Agent applicability:**
- Periodic agent tasks: daily reports, weekly data syncs, health checks
- Auto-CTO pilot pattern: scheduled quality audits across projects
- Overlap policy `CANCEL_OTHER` for exclusive resource agents (DB maintenance)
- Backfill for catching up after outage (re-run missed intelligence gathering)

---

## 5. Worker Architecture

**Multi-tenant / Namespace isolation:**
- Namespaces = hard isolation boundary (separate history, task queues, auth)
- Workers poll specific task queues — task queue = logical routing unit
- Multiple workers can poll same task queue (horizontal scaling, load balanced)
- Sticky execution: Temporal prefers routing tasks to same worker that started workflow (cache hit for local state)

**Build-ID based versioning (current recommended):**
- Worker Deployment: named group of workers (e.g., `prod-v2`)
- Build ID: specific code revision within deployment
- Pinned Workflow: locked to specific Build ID until completion
- Auto-Upgrade Workflow: automatically moves to new version on rollout
- Enables blue-green deploys without workflow interruption

**Task queue patterns:**
- Separate queues per activity type (CPU-heavy vs I/O-heavy workers)
- Versioned queues for gradual rollout
- Priority queues not native — use separate queues + worker allocation as workaround

**AI Agent applicability:**
- Namespace per tenant/project (84tea vs sophia vs apex) — true isolation
- Separate task queues: `llm-heavy` (GPU workers) vs `io-light` (cheap workers)
- Build-ID versioning for zero-downtime agent code updates
- Sticky execution benefits stateful agents (LLM context stays in worker memory)

---

## 6. Failure Handling

**Timeout types:**
| Type | Scope | Use case |
|------|-------|----------|
| `StartToClose` | Single attempt | ALWAYS SET — prevents zombie activities |
| `ScheduleToClose` | All attempts incl. retries | Total SLA budget |
| `ScheduleToStart` | Queue wait time | Detect dead workers (rarely set) |
| `Heartbeat` | Between pings | Long-running ops, fast failure detection |

**Retry Policy:**
- `initialInterval`, `backoffCoefficient`, `maximumInterval`, `maximumAttempts`
- Default: unbounded retries with exponential backoff (up to ~10 years if unconfigured)
- `nonRetryableErrorTypes`: list of error types that short-circuit retry loop
- Workflow-level retries vs Activity-level retries — independent configuration

**Heartbeat:**
- Activity periodically calls `activity.heartbeat(progress)` — passes state
- If heartbeat misses deadline → activity is rescheduled, receives last heartbeat detail on retry
- Enables resumable long-running ops (e.g., LLM streaming, file processing)
- SDKs throttle heartbeat transmission — safe to call frequently

**Non-retryable errors:**
- Mark business logic failures as non-retryable (invalid input, auth failure)
- Temporal error taxonomy: `ApplicationError(retryable=false)` vs transient errors
- Workflow can catch activity failures and decide: retry, compensate, escalate

**AI Agent applicability:**
- Heartbeat for LLM API calls — detect hung requests without waiting full timeout
- `nonRetryableErrorTypes`: bad prompt, content policy violation → fail fast, don't retry
- `ScheduleToClose` = agent task SLA (user-facing deadline)
- Compensation pattern: on agent failure, run cleanup workflow to undo partial state

---

## Key Design Patterns for RaaS AGI

| Pattern | Temporal Primitive | RaaS Use Case |
|---------|--------------------|---------------|
| Eternal agent loop | ContinueAsNew | Tôm Hùm daemon, daily ops |
| Human-in-the-loop | Signal | Approval gates, goal injection |
| Live status dashboard | Query | Agent progress monitoring |
| Fan-out tool calls | Child Workflows (parallel) | Multi-tool agent execution |
| Isolated tenants | Namespaces | Per-client agent isolation |
| Zero-downtime deploys | Build-ID versioning | Agent code updates |
| Resumable LLM calls | Heartbeat | Long streaming completions |
| Periodic audits | Schedules | Auto-CTO quality sweeps |

---

## Unresolved Questions
1. Temporal Cloud pricing model for high-frequency AI agent workloads (cost at 1M+ events/day)
2. Native support for streaming activity results (needed for LLM token streaming)?
3. Query performance under high load — latency SLA for live agent dashboards?
4. Maximum namespace count per Temporal Cloud account?
5. Interaction between Build-ID pinned workflows and ContinueAsNew chains?

---

**Sources:**
- [Child Workflows | Temporal Docs](https://docs.temporal.io/child-workflows)
- [Parent Close Policy | Temporal Docs](https://docs.temporal.io/parent-close-policy)
- [Worker Versioning | Temporal Docs](https://docs.temporal.io/production-deployment/worker-deployments/worker-versioning)
- [Activity Timeouts | Temporal Blog](https://temporal.io/blog/activity-timeouts)
- [Very Long-Running Workflows | Temporal Blog](https://temporal.io/blog/very-long-running-workflows)
- [Airbyte: Scale with Temporal](https://airbyte.com/blog/scale-workflow-orchestration-with-temporal)
