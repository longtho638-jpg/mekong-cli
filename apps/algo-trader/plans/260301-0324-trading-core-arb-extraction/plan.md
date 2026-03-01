---
title: "Extract Arbitrage Logic → @agencyos/trading-core"
description: "Canonicalize arbitrage modules in package; reduce app/src/arbitrage/ to thin re-export wrappers"
status: pending
priority: P1
effort: 3h
branch: master
tags: [refactor, trading-core, arbitrage, extraction]
created: 2026-03-01
---

# Plan: Extract Cross-Exchange Arbitrage → @agencyos/trading-core

## Context

**Work dir:** `/Users/macbookprom1/mekong-cli/apps/algo-trader`
**Package:** `/Users/macbookprom1/mekong-cli/packages/trading-core`

## Research Findings

### Current State (Critical Discovery)

The package already has **kebab-case copies** of almost every app module, but they have **architecturally diverged**:

| Dimension | App (`src/arbitrage/`) | Package (`trading-core/arbitrage/`) |
|---|---|---|
| Naming | PascalCase (`ArbitrageScanner.ts`) | kebab-case (`arbitrage-scanner.ts`) |
| Exchange API | `ExchangeClient` (app-specific) | `IExchange` interface (generic) |
| Logging | `utils/logger` (app logger) | `arb-logger` (package logger) |
| Types | Inline interfaces in each file | Centralized `arbitrage-types.ts` |
| Orchestrator | `ArbitrageOrchestrator.ts` — **ONLY IN APP** | Not in package |

### File Mapping: App → Package

| App (PascalCase) | Package (kebab-case) | Status |
|---|---|---|
| `ArbitrageOrchestrator.ts` | _(missing)_ | **ONLY IN APP — keep in app** |
| `SpreadDetectorEngine.ts` | `spread-detector-engine.ts` | Diverged — package is canonical |
| `ArbitrageScanner.ts` | `arbitrage-scanner.ts` | Diverged — package is canonical |
| `ArbitrageExecutor.ts` | `arbitrage-executor.ts` | Diverged — package is canonical |
| `MultiExchangeConnector.ts` | `multi-exchange-connector.ts` | Diverged — package is canonical |
| `RealTimePriceAggregator.ts` | `real-time-price-aggregator.ts` | Diverged — package is canonical |
| `WebSocketPriceFeed.ts` | `websocket-price-feed.ts` | Diverged — package is canonical |
| `ArbitrageBacktester.ts` | `arbitrage-backtester.ts` | Diverged — package is canonical |
| `ArbitrageSignalScorer.ts` | `signal-scorer.ts` | Diverged — package is canonical |
| `OrderBookAnalyzer.ts` | `order-book-analyzer.ts` | Diverged — package is canonical |
| `FeeCalculator.ts` | `fee-calculator.ts` | Diverged — package is canonical |
| `SpreadHistoryTracker.ts` | `spread-history-tracker.ts` | Diverged — package is canonical |
| `LatencyOptimizer.ts` | `latency-optimizer.ts` | Diverged — package is canonical |
| `EmergencyCircuitBreaker.ts` | `emergency-circuit-breaker.ts` | Diverged — package is canonical |
| `ProfitTracker.ts` | `profit-tracker.ts` | Diverged — package is canonical |
| `AdaptiveSpreadThreshold.ts` | `adaptive-spread-threshold.ts` | Diverged — package is canonical |
| `BalanceRebalancer.ts` | `balance-rebalancer.ts` | Diverged — package is canonical |

### Key Architectural Decision

`ArbitrageOrchestrator` uses `MultiExchangeConnector` (which uses `ExchangeClient`) + `logger` from utils. Since the package version replaces `ExchangeClient` with `IExchange`, `ArbitrageOrchestrator` **stays in app** as an app-layer orchestrator that wires together package primitives.

### Import Graph (Current)

```
CLI (arb-cli-commands.ts)
  → ArbitrageOrchestrator (app)     ← imports from local + @agencyos/trading-core
  → SpreadDetectorEngine (app)      ← imports from local + @agencyos/trading-core
  → ArbitrageScanner (app)          ← imports from local ExchangeClient
  → ArbitrageExecutor (app)         ← imports from local ExchangeClient
```

### Import Graph (Target)

```
CLI (arb-cli-commands.ts)
  → ArbitrageOrchestrator (app)     ← imports from @agencyos/trading-core/arbitrage + local ExchangeClient adapter
  → SpreadDetectorEngine (re-export)← export * from '@agencyos/trading-core/arbitrage'
  → [all others] (re-export wrappers) ← export * from '@agencyos/trading-core/arbitrage'
```

### Test Impact

All 6 test files import from local `./PascalCase` paths. After conversion, local files become re-export wrappers, so **tests need no import changes** — they still resolve through the local barrel.

---

## Phases

### Phase 1 — Verify package is current canonical source

**Goal:** Confirm package exports are complete, index is correct, tsconfig path mapping works.

**Steps:**
1. Run `npx tsc --noEmit` in `apps/algo-trader` — record baseline error count
2. Confirm `packages/trading-core/arbitrage/index.ts` exports all 18 modules (already done per research)
3. Confirm `packages/trading-core/package.json` exports `"./arbitrage": "./arbitrage/index.ts"` ✓

**Output:** Baseline error count documented.

---

### Phase 2 — Convert 15 app modules to re-export wrappers

**Goal:** Replace full implementations in app with `export * from '@agencyos/trading-core/arbitrage'` for all modules that have a package counterpart.

**Modules to convert (15 files):**

```
ArbitrageSignalScorer.ts   → re-export signal-scorer
OrderBookAnalyzer.ts       → re-export order-book-analyzer
FeeCalculator.ts           → re-export fee-calculator
SpreadHistoryTracker.ts    → re-export spread-history-tracker
LatencyOptimizer.ts        → re-export latency-optimizer
EmergencyCircuitBreaker.ts → re-export emergency-circuit-breaker
ProfitTracker.ts           → re-export profit-tracker
AdaptiveSpreadThreshold.ts → re-export adaptive-spread-threshold
BalanceRebalancer.ts       → re-export balance-rebalancer
ArbitrageScanner.ts        → re-export arbitrage-scanner
ArbitrageExecutor.ts       → re-export arbitrage-executor
MultiExchangeConnector.ts  → re-export multi-exchange-connector
RealTimePriceAggregator.ts → re-export real-time-price-aggregator
WebSocketPriceFeed.ts      → re-export websocket-price-feed
ArbitrageBacktester.ts     → re-export arbitrage-backtester
SpreadDetectorEngine.ts    → re-export spread-detector-engine
```

**Template for each wrapper:**
```ts
// ArbitrageScanner.ts — app re-export wrapper
// Canonical source: @agencyos/trading-core/arbitrage/arbitrage-scanner
export * from '@agencyos/trading-core/arbitrage';
```

**Note:** Use broad `export * from '@agencyos/trading-core/arbitrage'` (re-exports entire barrel) — avoids needing to enumerate named exports. If conflicts arise, switch to named re-exports.

**Order:** Start with pure-logic modules (no app deps) first (Phase 2a), then execution modules (Phase 2b):

- **2a (pure logic):** SignalScorer, OrderBookAnalyzer, FeeCalculator, SpreadHistoryTracker, LatencyOptimizer, EmergencyCircuitBreaker, ProfitTracker, AdaptiveSpreadThreshold, BalanceRebalancer
- **2b (execution):** ArbitrageScanner, ArbitrageExecutor, MultiExchangeConnector, RealTimePriceAggregator, WebSocketPriceFeed, ArbitrageBacktester, SpreadDetectorEngine

---

### Phase 3 — Update ArbitrageOrchestrator imports

**Goal:** `ArbitrageOrchestrator` stays in app but must import from package (not local files).

**Current imports in `ArbitrageOrchestrator.ts`:**
```ts
import { MultiExchangeConnector, ExchangeConfig } from './MultiExchangeConnector';
import { RealTimePriceAggregator } from './RealTimePriceAggregator';
import { ArbitrageScanner, ArbitrageOpportunity, ScannerConfig } from './ArbitrageScanner';
import { ArbitrageExecutor, ExecutorConfig, ExecutionResult } from './ArbitrageExecutor';
import { LatencyOptimizer, ProfitTracker, AdaptiveSpreadThreshold } from '@agencyos/trading-core/arbitrage';
import { WebSocketPriceFeed } from './WebSocketPriceFeed';
import { logger } from '../utils/logger';
```

**After Phase 2**, local wrappers re-export from package, so these local imports still resolve correctly. However, ideally migrate to direct package imports:

```ts
import {
  MultiExchangeConnector, ExchangeConfig,
  RealTimePriceAggregator,
  ArbitrageScanner, ArbitrageOpportunity, ScannerConfig,
  ArbitrageExecutor, ExecutorConfig, ExecutionResult,
  LatencyOptimizer, ProfitTracker, AdaptiveSpreadThreshold,
  WebSocketPriceFeed,
} from '@agencyos/trading-core/arbitrage';
import { logger } from '../utils/logger';
```

**Decision:** Keep `logger` from `../utils/logger` — it's app-specific.

---

### Phase 4 — Verify CLI commands still work

**File:** `src/cli/arb-cli-commands.ts`

**Current imports:**
```ts
import { ArbitrageScanner } from '../arbitrage/ArbitrageScanner';
import { ArbitrageExecutor } from '../arbitrage/ArbitrageExecutor';
import { SpreadDetectorEngine } from '../arbitrage/SpreadDetectorEngine';
import { ArbitrageOrchestrator } from '../arbitrage/ArbitrageOrchestrator';
```

**After Phase 2:** These imports still resolve (wrappers re-export from package). **No changes needed to CLI.**

---

### Phase 5 — Type-check and test

```bash
# From apps/algo-trader
npx tsc --noEmit

# Run full test suite
npm test
```

**Success criteria:**
- `npx tsc --noEmit` exits 0
- All 296 tests pass (or same pass count as baseline)

---

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| `export *` causes name collision (two modules export same symbol) | Medium | Use named re-exports if collision detected |
| Package's `IExchange`-based files behave differently at runtime | Low | Tests cover behavior; divergence is abstraction-level not logic |
| `ArbitrageOrchestrator` breaks if package types differ from app types | Medium | Run tsc after Phase 2 before Phase 3 |
| Test files import names not exported by package | Low | Package index already exports all symbols per research |

---

## Unresolved Questions

1. **Collision risk:** `export * from '@agencyos/trading-core/arbitrage'` from 15 different wrapper files will all try to re-export the same symbols — TypeScript may complain about duplicate exports within the app's module graph. If so, the alternative is a single `src/arbitrage/index.ts` barrel that re-exports everything, with individual wrapper files deleted or kept as single-line named re-exports.

2. **Runtime IExchange vs ExchangeClient:** Package's `ArbitrageScanner` and `ArbitrageExecutor` use `IExchange` interface — does `ExchangeClient` implement `IExchange`? Need to verify structural compatibility before ArbitrageOrchestrator can use the package versions at runtime (not just compile-time).

3. **ArbitrageOrchestrator in package?** If `ExchangeClient` implements `IExchange`, it could also move to package. Out of scope for this plan (YAGNI — no consumer needs it except this app).
