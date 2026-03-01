# Scout Report: Algo-Trader Cross-Exchange Arbitrage Structure

**Date:** 2026-03-01  
**Scope:** Cross-exchange arbitrage monitoring code, packages structure, @agencyos/* patterns

---

## 1. CURRENT CROSS-EXCHANGE ARBITRAGE MONITORING CODE

### Location: `/Users/macbookprom1/mekong-cli/apps/algo-trader/src/arbitrage/`

**23 arbitrage modules organized by function:**

#### Core Scanning & Detection (3 files)
- `ArbitrageScanner.ts` — Multi-exchange price aggregator + spread detector
  - Polls N exchanges in parallel
  - Direct price comparison (not candle-based)
  - Flow: poll() → aggregatePrices() → detectSpreads() → emit opportunities
  - Emits `ArbitrageOpportunity` objects with profit/latency metrics

- `SpreadDetectorEngine.ts` — Detects profitable spread patterns
  - Analyzes order book depth
  - Filters stale prices
  - Supports custom alert thresholds

- `RealTimePriceAggregator.ts` — WebSocket-based real-time price feeds
  - Aggregates prices from multiple exchanges simultaneously

#### Execution & Management (3 files)
- `ArbitrageExecutor.ts` — Executes buy/sell trades across exchanges
  - Places orders atomically
  - Tracks execution timing & slippage
  - Enforces position size limits & daily loss caps

- `ArbitrageOrchestrator.ts` — Coordinates scanner + executor
  - Handles strategy & risk management
  - Triggers execution based on scoring
  - Monitors cumulative P&L

- `MultiExchangeConnector.ts` — Manages exchange connections
  - Handles connection pooling for Binance, OKX, Bybit, Gate.io
  - Health checks, auto-reconnect, balance tracking
  - Disables exchanges after max failures

#### Risk & Performance (7 files)
- `EmergencyCircuitBreaker.ts` — Stops trading on system failures
- `LatencyOptimizer.ts` — Reduces order execution latency
- `BalanceRebalancer.ts` — Maintains balanced positions across exchanges
- `ProfitTracker.ts` — Tracks cumulative P&L by symbol/exchange
- `SpreadHistoryTracker.ts` — Analyzes spread patterns (Z-score detection)
- `AdaptiveSpreadThreshold.ts` — Dynamic threshold adjustment
- `OrderBookAnalyzer.ts` — Analyzes order book liquidity depth

#### Scoring & Analysis (3 files)
- `ArbitrageSignalScorer.ts` — Multi-factor confidence scoring (0-100)
  - Combines: spread quality, liquidity, latency risk, fee impact, historical pattern
  - Outputs: grade (A-F), recommendation (execute/wait/skip)
  - Configurable weights for each factor

- `FeeCalculator.ts` — Exchange-specific fee tier calculation
  - Supports Binance/OKX/Bybit/Gate.io with VIP tiers
  - Calculates break-even spread threshold

- `WebSocketPriceFeed.ts` — WebSocket-based live price streaming

#### Testing (4 files)
- `ArbitrageRound*.test.ts` — Test suites for different scenarios
  - Rounds 4-7 covering spread detection, execution, scoring

---

## 2. EXISTING PACKAGE STRUCTURE

### Location: `/Users/macbookprom1/mekong-cli/packages/`

**35 packages in monorepo with clear @agencyos/* pattern:**

```
packages/
├── trading-core/          ← NEW SDK (Feb 2026)
├── billing/              ← NEW SDK (Mar 1 2026)
├── agents/
├── business/
├── cleo/ (31 dirs)
├── core/
├── docs/
├── i18n/
├── integrations/
├── mekong-clawwork/
├── mekong-moltbook/
├── memory/
├── newsletter/
├── observability/
├── openclaw-agents/
├── shared/
├── tooling/
├── ui/
├── vibe/ (14 dirs with vibe-*, vibe-agents, vibe-analytics, vibe-auth, vibe-bridge, vibe-crm, vibe-dev)
└── CLAUDE.md
```

---

## 3. @agencyos/* PACKAGES NAMING PATTERN

### Trading-Core Package
**Name:** `@agencyos/trading-core`  
**Version:** 0.1.0  
**Location:** `/Users/macbookprom1/mekong-cli/packages/trading-core/`  
**Main:** `index.ts`  
**Types:** `index.ts`

**Exports structure:**
```json
{
  ".": "./index.ts",
  "./interfaces": "./interfaces/index.ts",
  "./core": "./core/index.ts",
  "./analysis": "./analysis/index.ts",
  "./arbitrage": "./arbitrage/index.ts"
}
```

**Directory structure:**
- `interfaces/` — Shared type definitions
- `core/` — Risk management, signal processing
- `analysis/` — Technical indicators
- `arbitrage/` — Cross-exchange arbitrage primitives
- `index.ts` — Unified export barrel

**Package.json metadata:**
```json
{
  "name": "@agencyos/trading-core",
  "description": "Reusable algorithmic trading primitives — interfaces, risk management, signal processing, technical indicators, cross-exchange arbitrage",
  "peerDependencies": {
    "technicalindicators": "^3.1.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### Billing Package (Related Pattern)
**Name:** `@agencyos/billing`  
**Version:** 0.1.0  
**Location:** `/Users/macbookprom1/mekong-cli/packages/billing/`

**Exports:**
```json
{
  ".": "./index.ts",
  "./payment": "./payment-utils.ts",
  "./orders": "./order-state-machine.ts",
  "./validation": "./validation-schemas.ts"
}
```

---

## 4. TRADING-CORE ARBITRAGE MODULE (ALREADY EXTRACTED)

### Location: `/Users/macbookprom1/mekong-cli/packages/trading-core/arbitrage/`

**12 arbitrage SDK files (extracted from app-level code):**

1. `arbitrage-types.ts` — Shared types
   - `ExchangePrice`, `ArbitrageOpportunity`, `ExecutionResult`
   - `ScannerConfig`, `ExecutorConfig`, `PnLDashboard`
   - `ArbitrageTradeLog`, `ProfitTracker` types

2. `arb-logger.ts` — Logging utilities

3. `signal-scorer.ts` — Signal scoring system
   - `SignalFactors`, `ScoredSignal`, `FactorScores`
   - Multi-factor confidence scoring (0-100)
   - Configurable weights

4. `spread-history-tracker.ts` — Historical pattern analysis

5. `fee-calculator.ts` — Exchange fee tier calculation
   - Binance/OKX/Bybit/Gate.io fee schedules
   - VIP tier support, break-even spread calculation

6. `emergency-circuit-breaker.ts` — System failure protection

7. `profit-tracker.ts` — P&L tracking

8. `adaptive-spread-threshold.ts` — Dynamic thresholds

9. `latency-optimizer.ts` — Latency reduction

10. `order-book-analyzer.ts` — Liquidity analysis

11. `balance-rebalancer.ts` — Position balancing

12. `index.ts` — Barrel export

**Key observation:** SDK already extracted, but app still has its own Scanner/Executor classes!

---

## 5. HOW ALGO-TRADER IMPORTS TRADING-CORE

### Import pattern in `/Users/macbookprom1/mekong-cli/apps/algo-trader/package.json`:
```json
{
  "dependencies": {
    "@agencyos/trading-core": "workspace:*"
  }
}
```

### Current imports in app code:
- `SpreadDetectorEngine.ts` imports: `ArbitrageSignalScorer`, `SpreadHistoryTracker` from `@agencyos/trading-core/arbitrage`
- `ArbitrageOrchestrator.ts` imports: `LatencyOptimizer`, `ProfitTracker`, `AdaptiveSpreadThreshold` from `@agencyos/trading-core/arbitrage`

**Problem identified:** Most arbitrage classes (Scanner, Executor, MultiExchangeConnector, etc.) are NOT imported from SDK—they remain in app-level code.

---

## 6. FILE STRUCTURE SUMMARY

### Algo-Trader Arbitrage (23 files, ~3000 LOC total)
```
src/arbitrage/
├── ArbitrageScanner.ts              [Scanner - price aggregation]
├── SpreadDetectorEngine.ts          [Spread detection]
├── ArbitrageExecutor.ts             [Order execution]
├── ArbitrageOrchestrator.ts         [Coordination]
├── MultiExchangeConnector.ts        [Exchange connections]
├── RealTimePriceAggregator.ts       [WebSocket prices]
├── OrderBookAnalyzer.ts             [Liquidity analysis]
├── FeeCalculator.ts                 [Fee calculation]
├── ProfitTracker.ts                 [P&L tracking]
├── LatencyOptimizer.ts              [Latency reduction]
├── BalanceRebalancer.ts             [Position balancing]
├── EmergencyCircuitBreaker.ts       [Circuit breaker]
├── SpreadHistoryTracker.ts          [Pattern analysis]
├── AdaptiveSpreadThreshold.ts       [Dynamic thresholds]
├── ArbitrageSignalScorer.ts         [Signal scoring]
├── WebSocketPriceFeed.ts            [WS streaming]
├── ArbitrageRound4.test.ts
├── ArbitrageRound5.test.ts
├── ArbitrageRound6.test.ts
├── ArbitrageRound7.test.ts
├── ArbitrageEngine.test.ts
└── (others)
```

### Trading-Core Arbitrage (12 files, ~1500 LOC)
```
packages/trading-core/arbitrage/
├── arbitrage-types.ts               [Shared types]
├── arb-logger.ts
├── signal-scorer.ts                 [Scoring - reusable]
├── spread-history-tracker.ts        [Pattern - reusable]
├── fee-calculator.ts                [Fees - reusable]
├── emergency-circuit-breaker.ts     [Circuit breaker - reusable]
├── profit-tracker.ts                [Tracking - reusable]
├── adaptive-spread-threshold.ts     [Thresholds - reusable]
├── latency-optimizer.ts             [Latency - reusable]
├── order-book-analyzer.ts           [Analysis - reusable]
├── balance-rebalancer.ts            [Balancing - reusable]
└── index.ts                         [Barrel export]
```

---

## 7. KEY FINDINGS

### ✅ Strengths
1. **Modular organization** — Clear separation of concerns (scanning, execution, risk, analysis)
2. **Trading-core SDK exists** — Already has arbitrage module with 12 reusable components
3. **@agencyos/* pattern established** — Consistent package naming (`@agencyos/trading-core`, `@agencyos/billing`)
4. **Workspace linking** — Using `workspace:*` for local monorepo dependencies
5. **Type-safe primitives** — Strong type definitions in SDK (interfaces, types)
6. **Multi-exchange support** — Binance, OKX, Bybit, Gate.io via CCXT

### ⚠️ Gaps & Opportunities
1. **Duplicate implementations** — App has `ArbitrageScanner.ts` (23 files) while SDK only exports utility classes
2. **Scanner/Executor not SDK-ified** — Core scanning & execution logic remains in app, not as reusable SDK
3. **No monitoring service** — No persistent background service for continuous arbitrage monitoring
4. **Real-time streaming incomplete** — WebSocketPriceFeed exists but not fully integrated with SDK
5. **No event system** — Manual listener pattern instead of EventEmitter for opportunities
6. **Limited SDK scope** — SDK focuses on calculation (fees, scoring, tracking) not orchestration

### 🎯 Extraction Opportunity
**Current state:** App has 23 arbitrage files + SDK has 12 utility files (separate)  
**Desired state:** SDK should export:
- `ArbitrageScanner` class
- `ArbitrageExecutor` class  
- `MultiExchangeConnector` class
- `SpreadDetectorEngine` class
- (Utilities already in SDK)

---

## 8. UNRESOLVED QUESTIONS

1. **Should we extract Scanner/Executor to SDK?**
   - Pro: Enables reuse across projects
   - Con: App-specific logic (order placement, risk enforcement)
   - Decision pending: Architecture review needed

2. **What about WebSocket integration?**
   - Should `WebSocketPriceFeed` be in SDK or app?
   - SDK currently has `RealTimePriceAggregator` concept

3. **Exchange connector versioning?**
   - `MultiExchangeConnector` uses CCXT v4.5.36
   - Should SDK pin CCXT version or allow peer dependency?

4. **Monitoring daemon structure?**
   - How should background polling be exposed from SDK?
   - EventEmitter vs manual listener callbacks?

5. **Fee schedule updates?**
   - `FeeCalculator` has hardcoded fee tiers (Dec 2024 rates)
   - Should this be externalized to config or API?

---

## SUMMARY

**Arbitrage codebase:** Well-organized with clear separation of concerns  
**Trading-core SDK:** Partially extracted (utilities, not orchestration)  
**@agencyos/* pattern:** Established and used correctly  
**Next step:** Decide scope of SDK expansion (Scanner/Executor extraction)

