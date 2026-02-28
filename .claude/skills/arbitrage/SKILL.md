---
name: arbitrage
description: Cross-exchange crypto arbitrage — spread detection, signal scoring, orderbook validation, auto-execution on Binance/OKX/Bybit. Uses @agencyos/vibe-arbitrage-engine + @agencyos/trading-core.
license: MIT
version: 1.0.0
---

# Cross-Exchange Arbitrage Skill

Build and operate cross-exchange crypto arbitrage systems using `@agencyos/vibe-arbitrage-engine` + `@agencyos/trading-core`.

## When to Use

- Set up cross-exchange spread detection (Binance/OKX/Bybit)
- Build auto-execution arbitrage pipeline
- Implement orderbook depth validation
- Configure adaptive spread thresholds (volatility-based)
- Add circuit breakers and risk management
- Track P&L and fee optimization per exchange
- Backtest arbitrage strategies on historical spreads

## SDK Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-arbitrage-engine` | Full arb pipeline: scanner, executor, orchestrator, signal scorer |
| `@agencyos/trading-core/exchanges` | Exchange adapters: Binance, OKX, Bybit (CCXT wrappers) |
| `@agencyos/trading-core/arbitrage` | Re-exports from vibe-arbitrage-engine |
| `@agencyos/vibe-billing-trading` | Fee calculator hooks, profit tracker hooks |

## Architecture

```
Price Feeds (WebSocket/REST)
    │
    ▼
┌─────────────────────────┐
│  RealTimePriceAggregator │ ← polls all exchanges
├─────────────────────────┤
│  ArbitrageScanner        │ ← detects spread > threshold
├─────────────────────────┤
│  ArbitrageSignalScorer   │ ← scores: spread, volume, latency, history
├─────────────────────────┤
│  OrderBookAnalyzer       │ ← validates depth supports trade size
├─────────────────────────┤
│  EmergencyCircuitBreaker │ ← halts on loss/error/volatility spikes
├─────────────────────────┤
│  ArbitrageExecutor       │ ← parallel buy+sell market orders
├─────────────────────────┤
│  ProfitTracker           │ ← tracks P&L, drawdown, equity curve
└─────────────────────────┘
```

## Quick Start — arb:auto (Recommended)

```bash
# Default: BTC/USDT + ETH/USDT on Binance/OKX/Bybit
npx ts-node src/index.ts arb:auto

# Custom config
npx ts-node src/index.ts arb:auto \
  -p BTC/USDT,ETH/USDT \
  -e binance,okx,bybit \
  -s 1000 \
  --score-threshold 65 \
  --max-loss 100
```

## Core Components

### 1. ArbitrageScanner — Spread Detection

```typescript
import { ArbitrageScanner } from '@agencyos/vibe-arbitrage-engine';
import { ExchangeClientBase } from '@agencyos/trading-core/exchanges';

const scanner = new ArbitrageScanner({
  symbols: ['BTC/USDT', 'ETH/USDT'],
  minSpreadPercent: 0.3,
  feeRatePerSide: 0.001,
  slippageBps: 5,
  positionSizeUsd: 1000,
});

scanner.addExchange('binance', new ExchangeClientBase('binance', key, secret));
scanner.addExchange('okx', new ExchangeClientBase('okx', key, secret));

scanner.onOpportunity(opp => {
  // opp: { symbol, buyExchange, sellExchange, spreadPercent, netProfitPercent, estimatedProfitUsd }
});

await scanner.start(); // begins polling loop
```

### 2. ArbitrageExecutor — Trade Execution

```typescript
import { ArbitrageExecutor } from '@agencyos/vibe-arbitrage-engine';

const executor = new ArbitrageExecutor({
  maxPositionSizeUsd: 1000,
  maxConcurrentTrades: 3,
  maxDailyLossUsd: 100,
  minNetProfitUsd: 0.5,
  cooldownMs: 5000,
});

executor.addExchange('binance', binanceClient);
executor.addExchange('okx', okxClient);

const result = await executor.execute(opportunity);
// result: { success, buyOrder, sellOrder, executionTimeMs, error? }
```

### 3. SpreadDetectorEngine — Scoring + Orderbook

```typescript
import { SpreadDetectorEngine } from '@agencyos/vibe-arbitrage-engine';

const engine = new SpreadDetectorEngine({
  symbols: ['BTC/USDT'],
  exchanges: [binanceClient, okxClient],
  scoreThreshold: 65,
  useOrderBook: true,
  useScoring: true,
});

await engine.start(); // polls, scores, validates orderbook depth
```

### 4. ArbitrageOrchestrator — Full Pipeline

```typescript
import { ArbitrageOrchestrator } from '@agencyos/vibe-arbitrage-engine';

const orch = new ArbitrageOrchestrator({
  exchanges: [
    { id: 'binance', enabled: true, label: 'Binance' },
    { id: 'okx', enabled: true, label: 'OKX' },
    { id: 'bybit', enabled: true, label: 'Bybit' },
  ],
  symbols: ['BTC/USDT', 'ETH/USDT'],
  scanIntervalMs: 2000,
  minSpreadPercent: 0.3,
  positionSizeUsd: 1000,
  maxDailyLossUsd: 100,
  scoreThreshold: 65,
});

await orch.init();  // connects all exchanges
await orch.start(); // begins scan→score→validate→execute loop
```

### 5. Exchange Adapters

```typescript
import { BinanceAdapter, OkxAdapter, BybitAdapter } from '@agencyos/trading-core/exchanges';

// Optimized adapters with exchange-specific fee tiers
const binance = new BinanceAdapter({ apiKey, secret, useBnbDiscount: true });
const okx = new OkxAdapter({ apiKey, secret, passphrase });
const bybit = new BybitAdapter({ apiKey, secret });
```

### 6. AdaptiveSpreadThreshold — Volatility-Based

```typescript
import { AdaptiveSpreadThreshold } from '@agencyos/vibe-arbitrage-engine';

const threshold = new AdaptiveSpreadThreshold({
  baseThreshold: 0.3,
  volatilityMultiplier: 1.5,
  emaAlpha: 0.1,
});

// Feed price data, threshold auto-adjusts
threshold.update(currentSpread);
const minSpread = threshold.getCurrentThreshold();
// High volatility → higher threshold (safer), low vol → lower threshold (more trades)
```

### 7. LatencyOptimizer

```typescript
import { LatencyOptimizer } from '@agencyos/vibe-arbitrage-engine';

const optimizer = new LatencyOptimizer({ maxAcceptableMs: 200 });
optimizer.record('binance', 45, 'ticker', true);
optimizer.record('okx', 80, 'order', true);

const ranked = optimizer.rankBySpeed(['binance', 'okx']); // ['binance', 'okx']
const pair = optimizer.selectFastestPair('binance', 'okx');
// pair.estimatedTotalMs = 80 (parallel execution = max of both)
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `arb:scan` | Dry-run spread scan (no API keys needed) |
| `arb:run` | Live scanner + executor (needs API keys) |
| `arb:engine` | SpreadDetectorEngine with scoring + orderbook |
| `arb:orchestrator` | Full ArbitrageOrchestrator pipeline |
| `arb:auto` | **Recommended** — unified detect→score→validate→execute |

## Fee & Billing Hooks

```typescript
import { createArbitrageBillingHook } from '@agencyos/vibe-billing-trading';

const billing = createArbitrageBillingHook({ initialEquity: 10000 });

// Analyze opportunity cost breakdown
const analysis = billing.analyzeOpportunity('binance', 'okx', 'BTC/USDT', buyPrice, sellPrice, amount);
// analysis: { grossProfit, totalFees, netProfit, breakEvenSpread, marginOfSafety }

// Track execution P&L
billing.recordExecution(netProfitUsd);
const report = billing.getSessionReport();
```

## Risk Management Checklist

- [ ] Set `maxDailyLossUsd` — auto-halt on drawdown
- [ ] Set `maxPositionSizeUsd` — cap per-trade exposure
- [ ] Enable `EmergencyCircuitBreaker` — halts on consecutive losses
- [ ] Configure `cooldownMs` between trades per symbol
- [ ] Use `testMode: true` on exchange adapters during development
- [ ] Monitor `LatencyOptimizer` — reject trades if latency > threshold
- [ ] Set `scoreThreshold >= 65` for signal quality filtering

## Environment Variables

```bash
BINANCE_API_KEY=...
BINANCE_SECRET=...
OKX_API_KEY=...
OKX_SECRET=...
OKX_PASSPHRASE=...
BYBIT_API_KEY=...
BYBIT_SECRET=...
```

## File Locations

| Component | Path |
|-----------|------|
| Arbitrage Engine SDK | `packages/vibe-arbitrage-engine/` |
| Exchange Adapters | `packages/trading-core/exchanges/` |
| Trading Core SDK | `packages/trading-core/` |
| Billing Hooks | `packages/vibe-billing-trading/` |
| App (CLI) | `apps/algo-trader/` |
| CLI Commands | `apps/algo-trader/src/cli/arb-cli-commands.ts` |
| Exchange Factory | `apps/algo-trader/src/cli/exchange-factory.ts` |
