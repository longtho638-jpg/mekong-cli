# Phase 1: Core Arbitrage Engine Enhancement

## Context Links
- [plan.md](./plan.md) — Overview
- [AgiArbitrageEngine] `@agencyos/trading-core/arbitrage`
- [ExchangeRouter] `src/execution/exchange-router-with-fallback.ts`
- [ExchangeConnectionPool] `src/execution/exchange-connection-pool.ts`
- [Exchange Factory] `src/cli/exchange-factory.ts`
- [Research: Arb Patterns] `plans/reports/researcher-260302-0635-crypto-arb-raas-patterns.md`
- [Research: Tech Stack] `plans/reports/researcher-260302-0636-tech-stack-validation.md`

## Overview
- **Priority:** P1
- **Effort:** 5h
- **Status:** Complete
- **Description:** Nang cap AgiArbitrageEngine tu polling REST sang real-time WebSocket spread detection, them atomic cross-exchange execution, fee-aware spread calculator.

## Key Insights
- CCXT REST polling hien tai: 2s interval, 100-300ms latency/exchange — OK cho 80% use cases
- WebSocket price feed giam latency xuong <50ms cho spread detection
- Fee breakeven: 0.15-0.25% spread can cover (Binance 0.10% + OKX 0.10% + slippage)
- Orderbook depth validation quan trong — reject <$100k depth trades
- Promise.all cho buy+sell dong thoi giam execution time 50%

## Requirements

### Functional
1. WebSocket multi-exchange price feed (Binance, OKX, Bybit)
2. Real-time spread calculation khi nhan ticker update
3. Fee-aware spread: dynamic fee lookup per exchange (khong hardcode)
4. Atomic execution: buy san A + sell san B dong thoi (Promise.all)
5. Orderbook depth validation truoc khi execute
6. Tich hop voi AgiArbitrageEngine hien tai (regime detection, Kelly)

### Non-Functional
- Spread detection latency < 500ms
- Execution latency < 1s (parallel)
- Memory < 200MB cho 3 exchanges x 5 pairs
- Reconnect auto khi WebSocket disconnect

## Architecture

```
WebSocket Feeds (Binance/OKX/Bybit)
        |
        v
[WebSocketPriceFeedManager]  <-- new
  - connect(exchangeId, symbols)
  - onTick(callback)
  - reconnect logic
        |
        v
[FeeAwareSpreadCalculator]   <-- new
  - calculateNetSpread(buyExchange, sellExchange, symbol)
  - fetchDynamicFees(exchangeId)
  - cacheFeesWithTTL(5min)
        |
        v
[AgiArbitrageEngine]          <-- upgrade
  - attachPriceFeed(manager)
  - onSpreadDetected → score → validate → execute
        |
        v
[AtomicCrossExchangeExecutor] <-- new
  - executeAtomic(buyOrder, sellOrder)
  - Promise.all([buyExchange.createOrder, sellExchange.createOrder])
  - rollback nếu 1 bên fail
```

## Related Code Files

### Files to CREATE
| File | Purpose |
|------|---------|
| `src/execution/websocket-multi-exchange-price-feed-manager.ts` | WebSocket price feed tu nhieu san |
| `src/execution/fee-aware-cross-exchange-spread-calculator.ts` | Tinh spread sau khi tru fee |
| `src/execution/atomic-cross-exchange-order-executor.ts` | Buy+sell dong thoi |
| `tests/execution/websocket-multi-exchange-price-feed-manager.test.ts` | Tests cho WS feed |
| `tests/execution/fee-aware-cross-exchange-spread-calculator.test.ts` | Tests cho spread calc |
| `tests/execution/atomic-cross-exchange-order-executor.test.ts` | Tests cho atomic exec |

### Files to MODIFY
| File | Change |
|------|--------|
| `src/cli/arb-agi-auto-execution-commands.ts` | Them option `--ws` de bat WebSocket mode |
| `src/cli/exchange-factory.ts` | Them `createWebSocketFeed()` factory |

## Implementation Steps

### Step 1: WebSocket Multi-Exchange Price Feed Manager (2h)

1. Tao `src/execution/websocket-multi-exchange-price-feed-manager.ts`
2. Interface:
   ```typescript
   interface PriceTick {
     exchange: string;
     symbol: string;
     bid: number;
     ask: number;
     timestamp: number;
   }

   interface PriceFeedConfig {
     exchanges: string[];        // ['binance', 'okx', 'bybit']
     symbols: string[];          // ['BTC/USDT', 'ETH/USDT']
     reconnectDelayMs?: number;  // default 5000
     maxReconnectAttempts?: number; // default 10
   }
   ```
3. Su dung CCXT Pro (ccxt.pro) `watchTicker()` hoac native WebSocket:
   - Binance: `wss://stream.binance.com:9443/ws/{symbol}@ticker`
   - OKX: `wss://ws.okx.com:8443/ws/v5/public` subscribe `tickers`
   - Bybit: `wss://stream.bybit.com/v5/public/spot` subscribe `tickers`
4. EventEmitter pattern: `feed.on('tick', (tick: PriceTick) => ...)`
5. Auto-reconnect voi exponential backoff (5s, 10s, 20s, 40s, cap 60s)
6. Heartbeat ping/pong 30s
7. Viet tests: mock WebSocket, test reconnect, test multi-exchange

### Step 2: Fee-Aware Spread Calculator (1h)

1. Tao `src/execution/fee-aware-cross-exchange-spread-calculator.ts`
2. Interface:
   ```typescript
   interface SpreadResult {
     buyExchange: string;
     sellExchange: string;
     symbol: string;
     grossSpreadPct: number;     // truoc fee
     netSpreadPct: number;       // sau fee
     buyPrice: number;
     sellPrice: number;
     buyFee: number;             // pct
     sellFee: number;            // pct
     estimatedSlippagePct: number;
     profitable: boolean;
     estimatedProfitUsd: number; // voi position size
     timestamp: number;
   }
   ```
3. Dynamic fee lookup: goi CCXT `exchange.fetchTradingFee(symbol)` — cache 5min TTL
4. Fallback fee table khi API fail:
   ```
   binance: maker 0.10%, taker 0.10%
   okx: maker 0.08%, taker 0.10%
   bybit: maker 0.10%, taker 0.10%
   ```
5. Net spread = grossSpread - buyFee - sellFee - estimatedSlippage
6. `profitable = netSpreadPct > minThreshold` (configurable, default 0.05%)
7. Viet tests: mock fees, test all exchange combos, edge cases (negative spread)

### Step 3: Atomic Cross-Exchange Executor (1.5h)

1. Tao `src/execution/atomic-cross-exchange-order-executor.ts`
2. Interface:
   ```typescript
   interface AtomicExecutionResult {
     success: boolean;
     buyOrder?: IOrder;
     sellOrder?: IOrder;
     buyLatency: number;
     sellLatency: number;
     totalLatency: number;
     netPnl: number;
     error?: string;
     rollbackPerformed: boolean;
   }
   ```
3. Core logic:
   ```typescript
   async executeAtomic(buyExchange, sellExchange, symbol, amount) {
     const [buyResult, sellResult] = await Promise.allSettled([
       buyExchange.createMarketOrder(symbol, 'buy', amount),
       sellExchange.createMarketOrder(symbol, 'sell', amount),
     ]);
     // Handle partial fills + rollback
   }
   ```
4. Rollback strategy: neu 1 ben fail, cancel/reverse ben kia
5. Retry logic: 1 retry voi reduced amount (50%) nếu partial fill
6. Integrate voi ExchangeRouter (fallback nếu 1 san down)
7. Viet tests: mock 2 exchanges, test success/partial/full-fail cases

### Step 4: Integration voi AgiArbitrageEngine (0.5h)

1. Update `src/cli/arb-agi-auto-execution-commands.ts`:
   - Them `--ws` flag de enable WebSocket mode
   - Khi `--ws`: create PriceFeedManager, attach vao engine
   - Khi khong co `--ws`: giu nguyen REST polling
2. Update `src/cli/exchange-factory.ts`:
   - Them `createWebSocketFeed(exchangeIds, symbols)` helper
3. Wire: PriceFeedManager → FeeAwareSpreadCalculator → AgiArbitrageEngine → AtomicExecutor

## Todo List

- [x] Tao `websocket-multi-exchange-price-feed-manager.ts` voi reconnect
- [x] Tao `fee-aware-cross-exchange-spread-calculator.ts` voi dynamic fee
- [x] Tao `atomic-cross-exchange-order-executor.ts` voi rollback
- [x] Viet tests cho 3 modules moi (>90% coverage)
- [ ] Update arb:agi CLI voi `--ws` flag
- [ ] Update exchange-factory voi WS feed helper
- [x] `tsc --noEmit` pass, 0 `any` types
- [x] Chay `npm test` — tat ca tests pass

## Success Criteria
- WebSocket feed nhan tick < 100ms tu 3 san
- Net spread calculation chinh xac (validated bang manual calc)
- Atomic execution < 1s cho 2 orders song song
- Rollback hoat dong khi 1 order fail
- 0 regression tren 342 tests hien tai

## Risk Assessment
- **CCXT Pro license:** CCXT Pro (WebSocket) can license tra phi. Fallback: dung native WS endpoints
- **Exchange rate limits:** WebSocket co rate limit khac REST. Monitor + backoff
- **Partial fill:** Orderbook depth thay doi giua luc scan va execute. Mitigation: validate orderbook ngay truoc execute
- **Network latency variance:** Promise.all khong dam bao dong thoi 100%. Mitigation: acceptable <500ms delta

## Security
- API keys chi doc tu env, khong log ra console
- WebSocket connections authenticate qua query param token
- Fee data cached in-memory, khong persist
