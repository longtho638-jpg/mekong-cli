---
title: "Live Exchange Manager"
description: "Unified orchestrator composing pool, WS feeds, and router into a single lifecycle manager with health monitoring and auto-recovery"
status: completed
priority: P1
effort: 3h
branch: master
tags: [execution, live-trading, orchestrator]
created: 2026-03-02
---

# Live Exchange Manager

## Overview

Orchestrator layer that composes existing components (connection pool, WS price feed, exchange router) into a unified lifecycle manager. Provides health dashboard, auto-recovery, and event bus for live trading readiness.

## Architecture

```
LiveExchangeManager (orchestrator)
  |-- ExchangeRegistry (config store)           ~80 lines  NEW
  |-- ExchangeConnectionPool (reuse)            EXISTS
  |-- WebSocketPriceFeedManager (reuse)         EXISTS
  |-- ExchangeRouter (reuse)                    EXISTS
  |-- ExchangeHealthMonitor (health + events)   ~120 lines NEW
  |-- LiveExchangeManager (glue)                ~150 lines NEW
```

## Phase 1 — Implementation

| # | File | Lines | What |
|---|------|-------|------|
| 1 | `src/execution/exchange-registry.ts` | ~80 | Central config: active exchanges, credentials, pairs |
| 2 | `src/execution/exchange-health-monitor.ts` | ~120 | Per-exchange health tracking, latency, event bus |
| 3 | `src/execution/live-exchange-manager.ts` | ~150 | Orchestrator: start/stop, compose components, auto-recovery |
| 4 | `tests/execution/exchange-registry.test.ts` | ~60 | Registry CRUD tests |
| 5 | `tests/execution/exchange-health-monitor.test.ts` | ~80 | Health state transitions, event emission |
| 6 | `tests/execution/live-exchange-manager.test.ts` | ~100 | Integration: lifecycle, recovery, graceful shutdown |

**Details:** [phase-01-live-exchange-manager.md](./phase-01-live-exchange-manager.md)

## Key Constraints

- Compose existing components; DO NOT rewrite pool/WS/router
- Each file < 200 lines
- EventEmitter for event bus (same pattern as WS manager)
- No new npm dependencies
- Tests use jest with fake timers (same pattern as existing execution tests)

## Success Criteria

- [x] `LiveExchangeManager.start()` boots all connections (REST pool + WS feeds)
- [x] `LiveExchangeManager.stop()` graceful shutdown with 5s drain timeout
- [x] Health monitor emits `health:change` events on status transitions
- [x] Auto-recovery restarts dead WS feeds within 30s
- [x] All new tests pass (`pnpm test`) — 28/28 PASS
- [x] TSC compiles with 0 errors
