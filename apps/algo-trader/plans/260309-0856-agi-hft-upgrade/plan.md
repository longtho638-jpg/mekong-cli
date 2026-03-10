---
title: "AGI HFT Upgrade — 3 Predictive Modules"
description: "Predictive orderbook ML, graph-based multi-exchange arb, adaptive latency RL"
status: pending
priority: P1
effort: 6h
branch: master
tags: [ml, hft, arbitrage, rl, tensorflow]
created: 2026-03-09
---

# AGI HFT Upgrade — 3 Modules

## Architecture

All modules follow existing patterns: EventEmitter, LicenseService gate (PRO), @tensorflow/tfjs, <200 LOC per file.

## Phases

| # | Module | File | Status |
|---|--------|------|--------|
| 1 | Predictive Orderbook ML | `src/ml/predictive-orderbook-model.ts` | pending |
| 2 | Graph Multi-Exchange Arb | `src/arbitrage/graph-arbitrage-engine.ts` | pending |
| 3 | Adaptive Latency RL | `src/execution/adaptive-latency-rl.ts` | pending |

## Dependencies

- Phase 1 standalone (consumed by HFTArbitrageEngine)
- Phase 2 standalone (parallel graph arb, complements HFT engine)
- Phase 3 depends on LatencyOptimizer (already exists)
- All gate premium features behind `LicenseService.hasTier(LicenseTier.PRO)`

## Integration Points

- Phase 1 → HFTArbitrageEngine calls `predict()` before `detectCrossSpread`
- Phase 2 → New engine, runs alongside HFTArbitrageEngine
- Phase 3 → Wraps LatencyOptimizer, provides timing offsets to execution

## Test Strategy

- Jest, CPU backend (`tf.setBackend('cpu')`)
- Unit tests with synthetic data (no live exchange)
- TF.js tests marked `.skip` in CI (memory), runnable manually with `--runInBand`

## Detailed Plans

- [Phase 1: Predictive Orderbook ML](./phase-01-predictive-orderbook-ml.md)
- [Phase 2: Graph Multi-Exchange Arbitrage](./phase-02-graph-arbitrage-engine.md)
- [Phase 3: Adaptive Latency RL](./phase-03-adaptive-latency-rl.md)
