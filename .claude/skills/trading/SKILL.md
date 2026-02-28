---
name: trading
description: Algorithmic trading — strategies, risk management, signal processing, technical indicators, backtesting. Use for crypto/stock bots, arbitrage, quant strategies, exchange integration.
license: MIT
version: 1.0.0
---

# Trading & Algorithmic Trading Skill

Build trading bots, quant strategies, risk management, and exchange integrations using `@agencyos/trading-core` SDK.

## When to Use

- Build new trading strategy (momentum, mean-reversion, arbitrage)
- Implement exchange connector (CEX/DEX)
- Set up risk management (position sizing, stop-loss, trailing stop)
- Create signal processing pipeline (multi-indicator consensus)
- Backtest strategies with historical data
- Market regime detection (trending/ranging/volatile)
- Cross-exchange arbitrage (spread detection, triangular arb)

## SDK Reference — `@agencyos/trading-core`

### Package Structure

```
packages/trading-core/
├── interfaces/          # Type definitions
│   ├── candle-types.ts      # ICandle, ICandleMetadata (OHLCV)
│   ├── strategy-types.ts    # IStrategy, ISignal, SignalType
│   ├── exchange-types.ts    # IExchange, IOrder, IOrderBook, IBalance
│   ├── data-provider-types.ts # IDataProvider (candle feed)
│   └── config-types.ts      # IConfig (bot/exchange/backtest)
├── core/                # Core modules
│   ├── base-strategy.ts     # BaseStrategy (candle buffering)
│   ├── risk-manager.ts      # RiskManager (position sizing, SL/TP, trailing)
│   ├── signal-generator.ts  # SignalGenerator (multi-indicator consensus)
│   └── signal-filter.ts     # SignalFilter (regime detection, scoring)
└── analysis/            # Technical analysis
    └── technical-indicators.ts # Indicators (RSI, SMA, MACD, BBands, Z-Score)
```

### Import Paths

```typescript
// Full import
import { RiskManager, SignalGenerator, Indicators } from '@agencyos/trading-core';

// Selective import
import { IExchange, IOrder } from '@agencyos/trading-core/interfaces';
import { BaseStrategy, RiskManager } from '@agencyos/trading-core/core';
import { Indicators } from '@agencyos/trading-core/analysis';
```

## Core Interfaces

### ICandle (OHLCV Data)

```typescript
interface ICandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  metadata?: ICandleMetadata; // exchangeBPrice, priceETH_BTC, priceB, etc.
}
```

### IStrategy (Strategy Contract)

```typescript
interface IStrategy {
  name: string;
  onCandle(candle: ICandle): Promise<ISignal | null>;
  init(history: ICandle[]): Promise<void>;
}
// SignalType: BUY | SELL | NONE
```

### IExchange (Exchange Abstraction)

```typescript
interface IExchange {
  name: string;
  connect(): Promise<void>;
  fetchTicker(symbol: string): Promise<number>;
  createMarketOrder(symbol: string, side: 'buy' | 'sell', amount: number): Promise<IOrder>;
  fetchBalance(): Promise<Record<string, IBalance>>;
  fetchOrderBook(symbol: string, limit?: number): Promise<IOrderBook>;
}
```

### IDataProvider (Candle Feed)

```typescript
interface IDataProvider {
  init(): Promise<void>;
  subscribe(callback: (candle: ICandle) => void): void;
  getHistory(limit: number): Promise<ICandle[]>;
  start(): Promise<void>;
  stop(): Promise<void>;
}
```

## Strategy Development Pattern

### 1. Extend BaseStrategy

```typescript
import { BaseStrategy } from '@agencyos/trading-core/core';
import { ICandle, ISignal, SignalType } from '@agencyos/trading-core/interfaces';
import { Indicators } from '@agencyos/trading-core/analysis';

class MomentumStrategy extends BaseStrategy {
  name = 'momentum-rsi-macd';

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    this.bufferCandle(candle);
    if (this.candles.length < 30) return null;

    const closes = this.getCloses();
    const rsi = Indicators.getLast(Indicators.rsi(closes));
    const macd = Indicators.macd(closes);
    const lastMacd = macd[macd.length - 1];

    if (rsi < 30 && (lastMacd?.histogram ?? 0) > 0) {
      return { type: SignalType.BUY, price: candle.close, timestamp: candle.timestamp, tag: 'rsi-oversold-macd-cross' };
    }
    if (rsi > 70 && (lastMacd?.histogram ?? 0) < 0) {
      return { type: SignalType.SELL, price: candle.close, timestamp: candle.timestamp, tag: 'rsi-overbought-macd-cross' };
    }
    return null;
  }
}
```

### 2. Multi-Strategy Consensus (SignalGenerator)

```typescript
import { SignalGenerator, WeightedSignal } from '@agencyos/trading-core/core';

const generator = new SignalGenerator({ consensusThreshold: 0.6, minVotes: 2 });

// Aggregate signals from multiple strategies
const signals: WeightedSignal[] = [
  { strategyName: 'momentum', signal: momentumSignal, weight: 0.4 },
  { strategyName: 'mean-rev', signal: meanRevSignal, weight: 0.3 },
  { strategyName: 'breakout', signal: breakoutSignal, weight: 0.3 },
];
const consensus = generator.aggregate(signals);
// consensus?.type === SignalType.BUY when buyWeight/totalWeight >= 0.6
```

### 3. Signal Quality Filter (SignalFilter)

```typescript
import { SignalFilter } from '@agencyos/trading-core/core';

const filter = new SignalFilter({ minScore: 50, cooldownMs: 3600000 });

// Feed candles for regime detection
candles.forEach(c => filter.updateCandle(c));

// Evaluate signal quality
const result = filter.evaluate(consensusSignal, currentCandle);
if (result.pass) {
  // regime: trending | ranging | volatile
  // score: { total, regimeAlignment, volumeScore, momentumScore, confluenceScore }
  executeTrade(result.signal);
  filter.recordTrade(currentCandle.timestamp);
}
```

### 4. Risk Management (RiskManager)

```typescript
import { RiskManager } from '@agencyos/trading-core/core';

// Position sizing: risk 2% of $10,000 balance at $50,000/BTC
const size = RiskManager.calculatePositionSize(10000, 2, 50000); // 0.004 BTC

// Stop-loss & take-profit
const sltp = RiskManager.checkStopLossTakeProfit(48000, 50000, 'buy', {
  stopLossPercent: 5, takeProfitPercent: 10,
}); // { stopLossHit: true, ... }

// Trailing stop
let state = RiskManager.initTrailingStop(50000, { trailingStop: true, trailingStopPositive: 0.02 });
const update = RiskManager.updateTrailingStop(52000, state, { trailingStop: true });
```

## Technical Indicators (Indicators class)

| Method | Args | Output |
|--------|------|--------|
| `rsi(values, period?)` | closes, 14 | number[] |
| `sma(values, period)` | closes, N | number[] |
| `macd(values, fast?, slow?, signal?)` | closes | MacdResult[] |
| `bbands(values, period?, stdDev?)` | closes | BBandsResult[] |
| `zScore(value, mean, stdDev)` | scalars | number |
| `standardDeviation(values)` | number[] | number |
| `correlation(x, y)` | number[], number[] | number (-1 to 1) |
| `getLast(values)` | number[] | number |

## Arbitrage Patterns

### Cross-Exchange Spread Detection

```typescript
const bookA = await exchangeA.fetchOrderBook('BTC/USDT');
const bookB = await exchangeB.fetchOrderBook('BTC/USDT');

const bestAskA = bookA.asks[0]?.price ?? 0;
const bestBidB = bookB.bids[0]?.price ?? 0;
const spread = ((bestBidB - bestAskA) / bestAskA) * 100;

if (spread > 0.3) { // 0.3% minimum profit after fees
  await exchangeA.createMarketOrder('BTC/USDT', 'buy', amount);
  await exchangeB.createMarketOrder('BTC/USDT', 'sell', amount);
}
```

### Statistical Arbitrage (Pairs Trading)

```typescript
// Use ICandleMetadata.priceB for correlated asset
const corr = Indicators.correlation(pricesA, pricesB);
if (corr > 0.85) {
  const zScore = Indicators.zScore(ratio, meanRatio, stdRatio);
  if (zScore > 2) { /* short A, long B */ }
  if (zScore < -2) { /* long A, short B */ }
}
```

## App Reference — `apps/algo-trader/`

Production trading bot app using `@agencyos/trading-core`:
- CLI with `arb:engine` command for cross-exchange spread detection
- Strategy implementations extending BaseStrategy
- Exchange connectors implementing IExchange
- Backtest infrastructure with historical data

## Bot Configuration (IConfig)

```typescript
{
  exchange: { id: 'binance', apiKey: '...', secret: '...', testMode: true },
  bot: { symbol: 'BTC/USDT', riskPercentage: 2, pollInterval: 60000, strategy: 'momentum' },
  backtest: { days: 30, initialBalance: 10000 },
  logging: { level: 'info', directory: './logs' }
}
```

## Security Rules

- API keys in env vars, NEVER in code
- Always use `testMode: true` during development
- Validate all exchange responses (rate limits, partial fills)
- Position size limits: never risk > 5% per trade
- Daily loss limit: auto-halt at configured USD threshold

## File Locations

- SDK: `packages/trading-core/`
- App: `apps/algo-trader/`
- Tests: `apps/algo-trader/src/__tests__/`
