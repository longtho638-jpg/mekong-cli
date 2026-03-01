# 九變 (Jiu Bian) — Temporal Architecture → Mekong-CLI RaaS AGI

> Binh Phap Ch.8: "Tướng thông cửu biến chi lợi giả, tri dụng binh hĩ"

## Status: IN_PROGRESS

## Overview

Ánh xạ Temporal.io durable execution patterns → mekong-cli PEV engine.
Nâng cấp orchestration engine với: event sourcing, state machine, retry policies, task queue, saga rollback.

## Phase Map

| # | Phase | Status | Files |
|---|-------|--------|-------|
| 1 | Execution History (Event Sourcing) | ⏳ | `src/core/execution_history.py` |
| 2 | Retry Policy Engine | ⏳ | `src/core/retry_policy.py` |
| 3 | Workflow State Machine | ⏳ | `src/core/workflow_state.py` |
| 4 | Task Queue with Priority | ⏳ | `src/core/task_queue.py` |
| 5 | Orchestrator upgrade (Saga + Heartbeat) | ⏳ | `src/core/orchestrator.py` |
| 6 | Production Code Audit | ⏳ | Multiple |
| 7 | Build & Verify GREEN | ⏳ | Tests |

## Key Insights from Research

### Temporal Core Patterns Applied:
1. **Event Sourcing** → Append-only execution history (replay capability)
2. **Deterministic Replay** → State reconstruction from events
3. **Activity Heartbeat** → Progress tracking during long steps
4. **Retry Policy** → Configurable backoff, max attempts, non-retryable errors
5. **Task Queue** → Priority-based dispatch with backpressure
6. **Saga Pattern** → Compensating transactions for rollback
7. **Worker Model** → Parallel step execution capability

## Architecture Mapping

```
Temporal                    →  Mekong-CLI
─────────────────────────────────────────
Workflow                    →  Recipe (enhanced)
Activity                    →  RecipeStep
Worker                      →  RecipeExecutor
Task Queue                  →  TaskQueue (NEW)
Event History               →  ExecutionHistory (NEW)
Retry Policy                →  RetryPolicy (NEW)
Workflow State              →  WorkflowState (NEW)
Timer/Sleep                 →  Scheduler (existing)
Signal                      →  EventBus (existing)
Search Attributes           →  Telemetry (existing)
```
