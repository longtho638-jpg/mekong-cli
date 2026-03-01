---
title: "Temporal Patterns for RaaS AGI"
description: "Apply Temporal.io durable execution, saga, and activity patterns to mekong-cli"
status: pending
priority: P1
effort: "8h"
branch: master
tags: [temporal, architecture, durability, orchestration]
created: 2026-03-01
---

# Temporal Patterns for RaaS AGI

Apply Temporal.io architectural concepts natively to mekong-cli Python/Node.js codebase. No Temporal SDK dependency -- learn patterns, implement in existing stack.

## Research
- [Temporal Core Architecture](research/researcher-01-temporal-core-architecture.md)
- [Temporal Advanced Patterns](research/researcher-02-temporal-advanced-patterns.md)

## Phases

| # | Phase | Priority | Effort | Status | Files |
|---|-------|----------|--------|--------|-------|
| 1 | [Durable Execution Event Log](phase-01-durable-execution-event-log.md) | P1 | 2h | pending | `src/core/execution-log.py`, `orchestrator.py` |
| 2 | [Timeout Hierarchy & Heartbeat](phase-02-timeout-hierarchy-heartbeat.md) | P1 | 1.5h | pending | `src/core/activity-timeout.py`, `executor.py` |
| 3 | [Saga Compensation Registry](phase-03-saga-compensation-registry.md) | P1 | 1.5h | pending | `src/core/saga-registry.py`, `orchestrator.py` |
| 4 | [Continue-As-New State Compaction](phase-04-continue-as-new-state-compaction.md) | P2 | 1h | pending | `lib/state-compactor.js`, `auto-cto-pilot.js` |
| 5 | [Priority Task Queue](phase-05-priority-task-queue.md) | P2 | 1h | pending | `lib/task-queue.js` |
| 6 | [Signals & Queries IPC](phase-06-signals-queries-ipc.md) | P2 | 1h | pending | `src/core/workflow-signals.py`, `event_bus.py` |

## Key Dependencies
- Phase 1 must complete first (event log is foundation for phases 2, 3)
- Phase 4-6 are independent of each other
- All phases preserve backward compatibility with Recipe/Step/Executor interfaces

## Architecture Principle
```
Temporal Concept        --> Mekong Native Implementation
-----------------------------------------------------------
Event History           --> JSON append-only log per execution
Activity                --> RecipeStep execution
Workflow                --> RecipeOrchestrator.run_from_recipe()
Task Queue              --> task-queue.js FIFO + priority
Signal                  --> EventBus + signal file IPC
Query                   --> Read-only state accessor
Continue-As-New         --> State snapshot + log rotation
Saga                    --> CompensationRegistry per recipe run
```

## Constraints
- Python 3.9.6, no new pip dependencies
- Node.js CommonJS, no new npm dependencies
- Files < 200 lines, type hints, docstrings
- M1 16GB -- minimal memory overhead
