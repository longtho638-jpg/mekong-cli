# n8n Architecture Patterns for AGI Trading Engine
**Date:** 2026-03-01 | **Researcher:** subagent/researcher
**Sources:** DeepWiki n8n, n8n official docs, GitHub source analysis

---

## 1. Workflow Engine Architecture

**Core orchestration (Plan→Execute→Verify analog):**
- `WorkflowRunner` = router: decides in-process vs queue dispatch
- `WorkflowExecute` (`packages/core`) = stack-based sequential node traversal
- `ActiveWorkflowManager` = lifecycle: activation/deactivation of live workflows
- Context built via `WorkflowExecuteAdditionalData.getBase()` before each run

**Trading mapping:**
- Trade strategy = workflow with chained nodes: signal → validate → size → route → execute → confirm
- `WorkflowRunner`-style router: manual backtest vs live queue vs paper-trade in-process
- Leader election (Redis advisory lock) → single-active-strategy enforcement

---

## 2. Node System (Plugin Architecture)

**Registration:**
- Declared in `package.json` under `n8n.nodes` array → paths to compiled `.js` files
- `LoadNodesAndCredentials` scans installed packages for this field at startup
- `NodeTypes` central registry maps type names → implementations
- Each node = class implementing `INodeType` with `execute(items: INodeExecutionData[])` method

**Node categories → trading equivalents:**
- Trigger nodes → `MarketDataTrigger`, `WebhookTrigger`, `ScheduleTrigger` (cron bars)
- Action nodes → `ExchangeNode`, `DatabaseNode`, `AlertNode`
- Core/logic nodes → `SignalFilter`, `RiskGate`, `PositionSizer`, `OrderRouter`
- AI cluster nodes → `AGIStrategyNode`, `MLSignalNode`, `SentimentNode`

**Key design:**
- `package.json` field discovery = zero-config plugin registration
- Community nodes as npm packages = extensible without core changes
- `n8n-node-dev` CLI for scaffolding → `strategy-dev` toolkit analog

---

## 3. Execution Model & Data Flow

**Data contract:**
```
INodeExecutionData[] → each item = { json: Record<string, unknown>, binary?: IBinaryData }
```
- Nodes receive full array from predecessor, return transformed array
- Operations: filter (reduce), transform (map), split (branch), merge (join)
- Binary data → market tick buffers, OHLCV frames, order blobs

**Execution lifecycle:**
1. Trigger fires → execution record created in DB (`running` status)
2. Stack-based traversal: one node at a time, state persisted per node
3. Status: `running` → `success` | `error` | `crashed` | `waiting`

**Error handling:**
- Per-node error output connections (alternate branch on failure, not crash)
- `ErrorWorkflow` pattern: dedicated error-handling workflow triggered on failure
- BullMQ job-level retries: configurable `attempts` + backoff strategy
- Per-execution timeout (`EXECUTIONS_TIMEOUT` env var)

**Trading applicability:**
- Order rejection → fallback routing branch, not engine crash
- `ErrorWorkflow` → risk-breach workflow (position flatten, alert)
- Retry + backoff → order confirmation polling

---

## 4. Event-Driven Patterns

**Trigger types:**
- Webhook trigger: HTTP endpoint registered at activation → inbound push
- Schedule trigger: cron-based (1m/5m/1h bar close signals)
- Manual trigger: one-shot (backtesting, paper-trade invocation)

**Real-time execution routing:**
- `shouldEnqueue` logic: realtime = priority 50, batch = priority 100 in BullMQ
- Worker→Main progress messages via `job.progress()`:
  - `job-finished` — completion summary
  - `job-failed` — error details
  - `respond-to-webhook` — webhook response data
  - `send-chunk` — SSE streaming chunks
  - `abort-job` — Main→Worker cancellation signal

**Redis Pub/Sub control plane (separate from BullMQ):**
- Command channel (Main→Workers): stop execution, reload config, restart workflow
- Worker response channel (Workers→Main): status ack, health reporting
- MCP relay channel: forward tool responses in multi-main setups

**Trading applicability:**
- Priority 50 → market orders; priority 100 → analytics, reporting
- `abort-job` → emergency kill-switch for runaway strategies
- SSE streaming → real-time P&L / order fill events to dashboard
- Command channel → config reload (risk limits) without restart

---

## 5. Queue/Worker Architecture

**Three process types:**
| Process | Role | Trading Equivalent |
|---------|------|--------------------|
| Main | UI, API, workflow activation, leader election | Strategy manager, REST API |
| Worker | BullMQ consumer, executes workflows | Order execution engine |
| Webhook | Receives triggers, enqueues jobs | Market data ingress |

**Queue mechanics (BullMQ + Redis):**
- Single queue named `bull`; workers register `JobProcessor.processJob()` as handler
- `ScalingService.addJob(jobData, {priority})` = submission
- `JobData` fields: `workflowId`, `executionId`, `loadStaticData`, `pushRef`, `streamingEnabled`
- Worker concurrency: configurable per-instance

**Scaling:**
- Stateless workers → horizontal scaling (add workers, not main instances)
- Main = pure coordinator in queue mode (no execution)
- `OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS=true` for full separation

**Multi-main (enterprise):**
- Redis advisory lock → one leader only
- Leader-only tasks: queue recovery, workflow activation/deactivation
- Non-leaders: handle API/UI only

**Graceful shutdown:**
- SIGTERM → pause BullMQ → poll `getRunningJobsCount() === 0` → exit
- Forced shutdown after 30s (`forceShutdownTimer`)
- Trading: drain in-flight orders before process exit

---

## 6. Task Runner (Sandboxed Code Execution)

- Separate subprocess for user-defined JS/Python code
- JS runner: WebSocket protocol; Python runner: subprocess pipe
- `TaskBrokerService` accepts WS connections; `TaskRequester` sends tasks
- Internal mode (n8n spawns subprocess) or external mode (sidecar container)
- Config: `TASK_RUNNERS_MAX_CONCURRENCY=10`, timeout 300s

**Trading applicability:**
- Quant strategy code runs sandboxed → no access to main engine memory
- Python runner = strategies in pandas/numpy/scipy isolated from core
- External mode = strategy as independently deployed microservice

---

## 7. Package Structure (Monorepo Pattern)

**n8n packages → trading engine analog:**
```
n8n:                          algo-trader:
packages/workflow/   →  types: IBar, ISignal, IOrder, IExecution, IPosition
packages/core/       →  engine: StrategyExecute, RiskEngine, PositionTracker
packages/cli/        →  commands: start, worker, backtest, paper
packages/nodes-base/ →  built-in strategies: momentum, arb, mean-reversion
@n8n/config/         →  typed config: exchange keys, risk limits, DB creds
@n8n/db/             →  TypeORM: orders, positions, executions, strategies
@n8n/di/             →  DI container for engines/services
@n8n/task-runner/    →  sandboxed quant code subprocess
```

---

## 8. Patterns to Adopt (Priority Order)

| Pattern | Why | Effort |
|---------|-----|--------|
| `INodeType.execute()` interface | Uniform strategy API, composable pipeline | Low |
| `package.json` field discovery | Zero-config strategy plugin registration | Low |
| `INodeExecutionData[]` data contract | Standardized tick/bar data between stages | Low |
| BullMQ priority (50 vs 100) | Market orders vs analytics jobs | Low |
| Error output branch (not crash) | Order rejection → fallback, not engine death | Medium |
| `job.progress()` progress events | Real-time order/fill events to UI | Medium |
| Redis Pub/Sub command channel | Kill-switch + config reload without restart | Medium |
| Leader election (Redis lock) | Single active strategy instance guarantee | Medium |
| Task runner subprocess (Python) | Sandboxed quant strategies | High |
| Multi-main + leader election | HA strategy manager failover | High |

---

## Unresolved Questions

1. **Parallel branch execution:** n8n is stack-based sequential per workflow — do conditional branches run in parallel or sequentially? Critical for multi-leg arb execution timing.
2. **BullMQ deduplication:** Does n8n deduplicate by workflowId+executionId? At-most-once order semantics require this.
3. **WebSocket triggers:** n8n uses HTTP webhooks natively. Direct persistent WebSocket market data (exchange feeds) requires custom node — pattern unclear from docs.
4. **ActiveWorkflowManager in multi-main failover:** Is workflow activation state replicated, or held only by leader? Failover behavior on leader crash not documented.
5. **Per-node timeout isolation:** `TASK_RUNNERS_TASK_TIMEOUT` appears global — per-strategy timeout isolation needs verification.
