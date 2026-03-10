# Trading Architecture SOPs — Kiến Trúc Giao Dịch

> SOPs vận hành kiến trúc trading core của algo-trader v3.0.
> Từ WebSocket tick → Strategy signal → Order execution → P&L tracking.

---

## Tổng Quan Pipeline

```
WebSocket (Binance/OKX/Bybit)
    ↓
TickStore (ring buffer 10K ticks)
    ↓
SignalMesh pub/sub ('tick')
    ↓
BotEngine.onCandle() + onTick()
    ↓
Strategy.onCandle() → ISignal (BUY/SELL/NONE)
    ↓
PluginManager.onSignal() (veto/enrich)
    ↓
AutonomyController.canExecute()
    ↓
RiskManager (position sizing, SL/TP, drawdown check)
    ↓
OrderManager → CCXT Exchange API
    ↓
Stealth Layers (optional: phantom, anti-detect)
    ↓
TelegramAlert + PnlSnapshot + OrderHistory
```

---

## SOP-TA01: Khởi Động Phiên Trading

**Khi:** Bắt đầu phiên giao dịch mới.

### Pre-flight Check (3 phút)
```bash
# 1. Build check
pnpm exec tsc --noEmit     # 0 errors

# 2. Test suite
pnpm test                   # 1216 tests PASS

# 3. Exchange connectivity
/trading:health              # All exchanges reachable

# 4. Config verify
cat config/default.yaml      # Đúng pair, strategy, risk params
```

### Start Sequence
```bash
# Paper mode (khuyến nghị bắt đầu)
/trading:auto BTC/USDT paper

# Hoặc multi-pair
/trading:auto:parallel BTC/USDT ETH/USDT paper

# Live mode (chỉ sau backtest + paper verify)
/trading:auto:agi BTC/USDT live $100 4h
```

### Shutdown Sequence
```bash
# 1. Bot tự close positions khi hết thời gian
# 2. Hoặc manual halt:
/trading:health              # Verify no open positions
# 3. Review kết quả
/trading:report
```

---

## SOP-TA02: Execution Pipeline

### Data Flow Chi Tiết

```
┌─────────────────────────────────────────────────────────┐
│ LAYER 1: DATA INGESTION                                  │
│                                                          │
│ websocket-multi-exchange-price-feed-manager.ts           │
│   ├── Binance WS stream (BTC/USDT, ETH/USDT...)        │
│   ├── OKX WS stream                                     │
│   └── Bybit WS stream                                   │
│   Features: auto-reconnect, heartbeat, backpressure     │
│                                                          │
│ → TickStore.ts (ring buffer 10K ticks hot storage)       │
│ → tick-to-candle-aggregator.ts (tick → OHLCV candle)     │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ LAYER 2: SIGNAL GENERATION                               │
│                                                          │
│ SignalMesh.ts pub/sub → BotEngine.ts                     │
│   ├── StrategyLoader.ts (dynamic strategy by name)       │
│   ├── Strategy.onCandle(candle) → ISignal                │
│   ├── SignalGenerator.ts (multi-strategy consensus)      │
│   └── PluginManager (veto, enrich, filter signals)       │
│                                                          │
│ Signal = { type: BUY|SELL|NONE, price, timestamp, meta } │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ LAYER 3: RISK & EXECUTION                                │
│                                                          │
│ AutonomyController.ts (ACT_FREELY/CONFIRM/SUGGEST/OBS)  │
│   ↓                                                      │
│ RiskManager.ts                                           │
│   ├── Position sizing (Kelly criterion / fixed %)        │
│   ├── SL: 2% default, TP: 5% default                    │
│   ├── Max drawdown: 10% portfolio                        │
│   └── Daily loss limit: configurable                     │
│   ↓                                                      │
│ OrderManager.ts → IExchange (CCXT)                       │
│   ├── Order state: PENDING → FILLED → CLOSED             │
│   ├── Deduplication (no double orders)                   │
│   └── Partial fill handling                              │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ LAYER 4: POST-TRADE                                      │
│                                                          │
│ PnlRealtimeSnapshotService.ts (realized + unrealized)    │
│ TradeAuditLogger.ts (immutable audit trail)              │
│ TelegramTradeAlertBot.ts (notifications)                │
│ AlertRulesEngine.ts (configurable alerts)               │
└─────────────────────────────────────────────────────────┘
```

### Module Paths

| Layer | Module | File |
|-------|--------|------|
| Data | Price Feed | `src/execution/websocket-multi-exchange-price-feed-manager.ts` |
| Data | Tick Store | `src/netdata/TickStore.ts` |
| Data | Candle Agg | `src/execution/tick-to-candle-aggregator.ts` |
| Signal | Bot Engine | `src/core/BotEngine.ts` |
| Signal | Strategy Loader | `src/core/StrategyLoader.ts` |
| Signal | Signal Generator | `src/core/SignalGenerator.ts` |
| Signal | Plugin System | `src/core/bot-engine-plugins.ts` |
| Risk | Risk Manager | `src/core/RiskManager.ts` |
| Risk | Portfolio Risk | `src/core/PortfolioRiskManager.ts` |
| Risk | Autonomy | `src/core/autonomy-controller.ts` |
| Exec | Order Manager | `src/core/OrderManager.ts` |
| Exec | Trade Executor | `src/core/bot-engine-trade-executor-and-position-manager.ts` |
| Post | P&L Snapshot | `src/core/pnl-realtime-snapshot-service.ts` |
| Post | Audit Logger | `src/a2ui/trade-audit-logger.ts` |
| Post | Telegram | `src/execution/telegram-trade-alert-bot.ts` |

---

## SOP-TA03: Strategy Management

### 11 Strategies Có Sẵn

| Strategy | Class | Type | Dùng khi |
|----------|-------|------|----------|
| RSI+SMA | `RsiSmaStrategy` | Technical | Trending market |
| RSI Crossover | `RsiCrossoverStrategy` | Technical | Momentum |
| Bollinger Bands | `BollingerBandStrategy` | Technical | Mean reversion |
| MACD Crossover | `MacdCrossoverStrategy` | Technical | Trend following |
| MACD+Boll+RSI | `MacdBollingerRsiStrategy` | Ensemble | Multi-confirm |
| Cross-Exchange Arb | `Arbitrage` | Arb | Spread >0.1% |
| Triangular Arb | `TriangularArbitrageLiveScanner` | Arb | Intra-exchange |
| Statistical Arb | `StatisticalArbitrage` | Arb | Pair correlation |
| AGI Arb | `AgiArbitrageEngine` | AGI | Multi-strategy unified |
| GRU Neural | `gru-prediction-strategy` | ML | Price prediction |
| Q-Learning | `tabular-q-learning-rl-trading-strategy` | ML/RL | Adaptive policy |

### Chọn Strategy

```
Thị trường trending rõ     → RSI+SMA hoặc MACD
Thị trường sideway/ranging  → Bollinger Bands
Spread cross-exchange >0.1% → Cross-Exchange Arb
Muốn multi-confirm          → MACD+Boll+RSI ensemble
Muốn AI/auto-adapt          → AGI Arb (regime-aware)
Muốn ML prediction          → GRU (cần train trước)
```

### Thêm Strategy Mới
```typescript
// 1. Implement IStrategy interface
// File: src/strategies/MyNewStrategy.ts
export class MyNewStrategy implements IStrategy {
  name = 'MyNew';
  async init(history: ICandle[]) { /* ... */ }
  async onCandle(candle: ICandle): Promise<ISignal | null> { /* ... */ }
}

// 2. Register in StrategyLoader
// File: src/core/StrategyLoader.ts
//   case 'MyNew': return new MyNewStrategy();

// 3. Write tests
// File: tests/strategies/my-new-strategy.test.ts

// 4. Backtest verify
// /trading:auto BTC/USDT backtest --strategy MyNew
```

### Strategy Interface (Bắt Buộc)
```typescript
interface IStrategy {
  name: string;
  init(history: ICandle[], config?: Record<string, unknown>): Promise<void>;
  onCandle(candle: ICandle): Promise<ISignal | null>;
  onTick?(tick: { price: number; timestamp: number }): Promise<ISignal | null>;
  onFinish?(): Promise<void>;
  updateConfig?(config: Record<string, unknown>): Promise<void>;
}
```

---

## SOP-TA04: Risk Management

### 3-Tier Risk Framework

```
TIER 1: PER-TRADE (RiskManager.ts)
├── Position size: 1-2% portfolio
├── Stop loss: 2% (configurable)
├── Take profit: 5% (configurable)
└── Max orders/pair: deduplication

TIER 2: DAILY (Circuit Breakers)
├── Daily loss limit: $100 default (configurable)
├── Max drawdown: 10% portfolio
├── 3 consecutive losses → downgrade autonomy
├── Circuit breaker trip → auto halt
└── Cannot be disabled (hardcoded safety)

TIER 3: STRATEGIC (PortfolioRiskManager.ts)
├── Weekly loss limit
├── Monthly loss limit
├── Correlation check (multi-pair)
├── VaR (Value at Risk)
├── Kelly criterion position sizing
└── Allocation caps per exchange
```

### Circuit Breaker Hoạt Động
```
Per-exchange circuit breaker (adaptive-circuit-breaker-per-exchange.ts):

  CLOSED (normal) → order fails → increment failure count
  failure count > threshold → OPEN (halt trading on this exchange)
  OPEN → wait cooldown → HALF-OPEN (test 1 order)
  HALF-OPEN → success → CLOSED (resume)
  HALF-OPEN → fail → OPEN (wait more)
```

### Config Risk Parameters
```yaml
# config/default.yaml
bot:
  riskPercentage: 1.0        # % portfolio per trade
  stopLossPercent: 2.0        # SL
  takeProfitPercent: 5.0      # TP
  dailyLossLimit: 100         # $ daily max loss
  maxDrawdownPercent: 10.0    # portfolio drawdown halt
```

### Emergency Stop
```bash
# Manual kill — dừng tất cả
/trading:founder:emergency

# Hoặc:
# Circuit breaker tự trigger khi:
# - Daily loss > limit
# - Drawdown > max
# - Exchange health critical
# - 3+ consecutive losses
```

---

## SOP-TA05: Exchange Management

### Connection Architecture
```
exchange-connection-pool.ts
  ├── Binance CCXT instance (spot + futures)
  ├── OKX CCXT instance
  └── Bybit CCXT instance

exchange-router-with-fallback.ts
  ├── Route order to best exchange (latency, fees, liquidity)
  ├── Auto-failover: exchange down → next healthy exchange
  └── Health-based routing: skip unhealthy exchanges

live-exchange-manager.ts
  ├── Lifecycle: init → connect → subscribe → trade → disconnect
  ├── Auto-reconnect on drop
  └── Graceful shutdown (close positions first)
```

### Setup Exchange
```bash
# 1. Interactive setup
pnpm run setup
# → Nhập API key, secret cho mỗi exchange

# 2. Verify connectivity
/trading:health
# → Shows latency, rate limit usage, balance per exchange

# 3. Test paper mode trước
/trading:auto BTC/USDT paper
```

### Exchange Health Monitoring
```
HealthManager.ts giám sát:
├── Connectivity: WebSocket stream alive?
├── Latency: API response <500ms?
├── Rate limits: usage <65%?
├── Balance: sufficient for positions?
└── Order book: depth sufficient for trade size?

Trạng thái: OK → WARNING → CRITICAL → RISK_EVENT
RISK_EVENT → CircuitBreaker trip → halt trading trên exchange đó
```

### Failover Tự Động
```
Exchange A down → ExchangeRouter detect
  → Route orders to Exchange B (next healthy)
  → Log failover event
  → Monitor Exchange A recovery
  → Auto-restore khi Exchange A healthy
```

---

## SOP-TA06: Arbitrage Operations

### 3 Loại Arb

| Type | Module | Cách hoạt động |
|------|--------|----------------|
| **Cross-Exchange** | `realtime-arbitrage-scanner.ts` | BTC rẻ ở Binance, đắt ở OKX → buy Binance, sell OKX |
| **Triangular** | `triangular-arbitrage-live-scanner.ts` | BTC→ETH→USDT→BTC trong 1 exchange |
| **Funding Rate** | `funding-rate-arbitrage-scanner.ts` | Long spot + short perp khi funding rate cao |

### AGI Arb Pipeline (Unified)
```
Market Data (WS + Funding API)
    ↓
MarketRegimeDetector → classify: trending/ranging/volatile
    ↓
ArbParamSuggestion (adaptive thresholds per regime)
    ├── RealtimeArbitrageScanner (cross-exchange)
    ├── TriangularArbitrageLiveScanner (intra-exchange)
    └── FundingRateArbitrageScanner (funding spread)
    ↓
OrderBookDepthAnalyzer (real slippage estimate)
    ↓
fee-aware-cross-exchange-spread-calculator.ts
    Net spread = gross spread - fees(buy) - fees(sell) - estimated slippage
    ↓
AdaptiveCircuitBreaker (per-exchange health gate)
    ↓
AtomicCrossExchangeOrderExecutor
    Buy + Sell via Promise.allSettled
    Rollback on partial failure
    ↓
Stealth layers (optional)
    ↓
P&L + Alert
```

### Arb Thresholds
```
Cross-exchange: net spread >0.1% (after fees)
Triangular: cycle profit >0.05%
Funding rate: rate spread >0.01%/8h

Spread cache: 5 phút (tránh stale data)
Order book depth: phải đủ liquidity cho trade size
Tick age: <3s (reject stale ticks)
```

### Start Arb
```bash
# Scan only (no execute)
/trading:arb:scan BTC/USDT

# Execute with stealth
/trading:auto:stealth BTC/USDT binance,okx $100 4h

# AGI mode (all arb types, regime-aware)
/trading:auto:agi BTC/USDT paper $100 4h
```

---

## SOP-TA07: Stealth Operations

### 3 Lớp Anti-Detection

```
LAYER 1: Order Randomizer (anti-detection-order-randomizer-safety-layer.ts)
├── Timing: ±30% jitter trên order interval
├── Size: ±5% random trên order size
├── Rate governor: không exceed rate limits
└── Pattern breaking: tránh predictable patterns

LAYER 2: Phantom Cloaking (phantom-order-cloaking-engine.ts)
├── Session management: 20-90min active, 5-20min break
├── Order splitting: 1 big order → 3-5 small orders
├── Timing randomization: Poisson distribution
├── Size camouflage: log-normal distribution
└── OTR (Off-The-Record): ephemeral sessions

LAYER 3: Binh Phap Strategy (binh-phap-stealth-trading-strategy.ts)
├── 13-chapter Sun Tzu algorithm
├── Adaptive behavior per exchange detection level
├── Fingerprint masking (CLI, browser, API)
└── Decoy patterns (fake interest signals)
```

### Khi Nào Dùng Stealth
```
✅ Cross-exchange arb (tránh front-running)
✅ Large orders (tránh market impact)
✅ High-frequency patterns (tránh exchange detection)

❌ Paper trading (không cần)
❌ Small single trades (overkill)
❌ Backtest (không applicable)
```

### Stealth Config
```bash
# Default: dry-run (paper) + stealth on
/trading:auto:stealth BTC/USDT binance,okx $100 4h

# Phantom session cycle:
#   Active: 20-90 phút (random)
#   Break: 5-20 phút (random)
#   → Tự động, không cần can thiệp

# Rate governor: auto-adjust 40-65% of exchange rate limit
```

---

## SOP-TA08: Backtesting

### Standard Backtest
```bash
# Basic
/trading:auto BTC/USDT backtest

# With specific strategy
pnpm run backtest              # RSI strategy default

# Advanced (equity curve, Sharpe, Monte Carlo)
pnpm run backtest:advanced
```

### Walk-Forward Optimization
```bash
pnpm run backtest:walk-forward

# Pipeline:
# 1. Split data: 70% train / 30% validate
# 2. Optimize params on train set (grid search)
# 3. Test on validate set (out-of-sample)
# 4. Robustness score = validate Sharpe / train Sharpe
# 5. Score >0.5 = robust, <0.3 = overfit
```

### Metrics Đánh Giá

| Metric | Target | Ý nghĩa |
|--------|--------|---------|
| Sharpe Ratio | >1.0 | Risk-adjusted return |
| Sortino Ratio | >1.5 | Downside risk only |
| Calmar Ratio | >0.5 | Return vs max drawdown |
| Win Rate | >55% | % trades profitable |
| Max Drawdown | <10% | Worst peak-to-trough |
| Profit Factor | >1.5 | Gross profit / gross loss |

### Backtest → Paper → Live Ladder
```
1. Backtest: Sharpe >1, WR >55%, DD <10% → PASS
2. Paper 2h: profitable, no bugs → PASS
3. Paper 24h: consistent, circuit breakers OK → PASS
4. Live small ($50): verify real execution → PASS
5. Live normal ($100-200): scale up dần
```

---

## SOP-TA09: ML Pipeline

### GRU Neural Network
```bash
# Train
pnpm run ml:train

# Pipeline:
# feature-engineering-candle-to-vector-pipeline.ts
#   Candle → [open, high, low, close, volume, RSI, SMA, BB...] vector
#     ↓
# gru-price-prediction-model.ts (TensorFlow.js)
#   GRU layers → predict next candle direction
#     ↓
# gru-prediction-strategy.ts
#   Prediction confidence >70% → BUY/SELL signal
```

### Q-Learning RL
```bash
# Training
# tabular-q-learning-episode-trainer.ts
#   State: [price_change, volume_change, RSI_zone, trend]
#   Actions: BUY, SELL, HOLD
#   Reward: realized P&L
#   Episodes: 1000+ for convergence

# Live
# tabular-q-learning-rl-trading-strategy.ts
#   Load trained Q-table → lookup state → select action
```

### ML Model Monitoring
```
□ Retrain weekly (market regime changes)
□ Compare ML strategy vs technical strategies
□ Monitor prediction accuracy (should be >55%)
□ If accuracy <50% → disable ML, fallback to technical
```

---

## SOP-TA10: RaaS API Operations

### Multi-Tenant Architecture
```
JWT/API Key Auth → Tenant isolation → Rate limiting
    ↓
24 REST endpoints + 5 WebSocket channels
    ↓
Per-tenant: strategies, positions, P&L, orders
```

### Key Endpoints

| Endpoint | Method | Mục đích |
|----------|--------|---------|
| `/api/v1/health` | GET | Liveness probe |
| `/api/v1/ready` | GET | Exchange connectivity |
| `/api/v1/arb/scan` | POST | Scan spreads |
| `/api/v1/arb/execute` | POST | Execute trade (Pro+) |
| `/api/v1/arb/positions` | GET | Current positions |
| `/api/v1/arb/stats` | GET | ROI, win rate |
| `/api/v1/pnl/snapshot` | GET | Current P&L |
| `/api/v1/backtest/submit` | POST | Submit backtest job |
| `/api/v1/strategies/marketplace` | GET | Strategy discovery |

### Tenant Tiers

| Tier | Price | Limits |
|------|-------|--------|
| FREE | $0 | 1 pair, 10 RPM, paper only |
| PRO | $49/mo | 5 pairs, 60 RPM, live trading |
| ENTERPRISE | Custom | Unlimited, priority, dedicated |

### Rate Limiting
```
Per-IP: 60 RPM (sliding window)
Per-tenant: varies by tier
Headers: X-RateLimit-Remaining, X-RateLimit-Reset
429 response: retry after X-RateLimit-Reset
```

---

## SOP-TA11: Monitoring & Health

### Netdata Subsystem
```
TickStore.ts        → Ring buffer 10K ticks (hot storage)
SignalMesh.ts       → In-process pub/sub (topic-based events)
HealthManager.ts    → Metric thresholds → ok/warning/critical
CollectorRegistry.ts → Metrics collector registration

Data flow:
  DataProvider → TickStore → SignalMesh('tick') → BotEngine
                                ↓
                         HealthManager (threshold checks)
                                ↓
                        SignalMesh('RISK_EVENT')
                                ↓
                    CircuitBreaker / AutonomyController
```

### Health Check Endpoints
```bash
# System health
GET /api/v1/health    → { status: "ok", uptime: 12345 }

# Exchange readiness
GET /api/v1/ready     → { binance: "ok", okx: "ok", bybit: "degraded" }

# Trading health
/trading:health       → Full system + exchange + strategy report
```

### Alert Rules
```
alert-rules-engine.ts cho phép config:
├── Trade alert: notify mỗi trade execution
├── P&L alert: notify khi P&L vượt threshold
├── Risk alert: notify khi drawdown > X%
├── Exchange alert: notify khi exchange disconnect
└── Custom: user-defined rules
```

---

## SOP-TA12: Deployment

### Docker Stack
```yaml
# docker-compose.yml
services:
  algo-trader:    # Port 3000, Fastify API + trading engine
  postgres:       # Port 5432, trade history + tenant data
  redis:          # Port 6379, BullMQ job queue + caching
  prometheus:     # Port 9090, metrics collection
  grafana:        # Port 3001, dashboards
```

### PM2 Production
```bash
# Start
pm2 start ecosystem.config.js

# Cluster mode: 4 instances
# Health monitor: fork mode, 1 instance
# Auto-restart on crash
# Log rotation
```

### CLI Quick Start
```bash
# Zero-config demo
pnpm run quickstart          # Backtest BTC/USDT RSI, no API keys needed

# Interactive setup
pnpm run setup               # Enter exchange API keys → .env

# Live
pnpm run live                # Start live trading
```

---

## SOP-TA13: Checklist Vận Hành

### Trước Phiên Trading
```
□ tsc --noEmit = 0 errors
□ pnpm test = all PASS
□ /trading:health = GREEN
□ Exchange API keys valid
□ Risk params set (SL/TP/daily limit)
□ Circuit breakers active (always)
□ Backtest verified (Sharpe>1)
```

### Trong Phiên Trading
```
□ Monitor P&L real-time
□ Check Telegram alerts
□ Watch circuit breaker status
□ Check exchange connectivity
□ No manual intervention unless emergency
```

### Sau Phiên Trading
```
□ Review /trading:report
□ Check all positions closed
□ Analyze win rate, Sharpe
□ Log insights to plans/reports/
□ Adjust strategy params if needed
```

### Weekly
```
□ Walk-forward validation (still robust?)
□ Strategy performance ranking
□ Exchange fee comparison
□ ML model accuracy check
□ Risk parameter review
```

### Monthly
```
□ Full backtest re-run (market changed?)
□ Strategy rotation review
□ Infrastructure audit
□ Dependency update (CCXT, TF.js)
□ Cost analysis (API fees, infra)
```

---

## Quick Reference — Files Quan Trọng

| Category | Key File | Purpose |
|----------|----------|---------|
| Engine | `src/core/BotEngine.ts` | Core orchestrator |
| Strategy | `src/core/StrategyLoader.ts` | Load strategy by name |
| Risk | `src/core/RiskManager.ts` | Position sizing, SL/TP |
| Execution | `src/execution/arbitrage-execution-engine.ts` | Arb orchestrator |
| Data | `src/execution/websocket-multi-exchange-price-feed-manager.ts` | Price feeds |
| Exchange | `src/execution/exchange-router-with-fallback.ts` | Routing + failover |
| Stealth | `src/execution/phantom-order-cloaking-engine.ts` | Anti-detection |
| Monitor | `src/netdata/HealthManager.ts` | Health thresholds |
| API | `src/api/` | 24 REST endpoints |
| ML | `src/ml/gru-prediction-strategy.ts` | Neural network |
| Config | `config/default.yaml` | Trading parameters |
| Tests | `tests/` | 1216 tests, 102 suites |

---

*SOPs v1.0 — 2026-03-03*
*Algo-Trader v3.0.0 — 232+ modules, 1216 tests*
*Ref: system-architecture.md | ARCHITECTURE.md | codebase-summary.md*
