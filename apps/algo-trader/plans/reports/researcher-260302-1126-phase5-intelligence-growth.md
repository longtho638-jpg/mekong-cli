# Phase 5 Intelligence & Growth — Research Report
**Date:** 2026-03-02 | **Researcher:** researcher-260302-1126
**Stack:** TypeScript · Fastify · CCXT · BullMQ · Prisma · WebSocket · PostgreSQL

---

## Context: What Already Exists

- `BacktestOptimizer.ts` — grid search over param combinations, Sharpe ranking (135 lines)
- `hyperparameter-optimization-job-routes.ts` — POST/GET `/api/v1/optimization`, in-memory job store
- `strategy-marketplace-routes.ts` — search/stats/top/rate endpoints with auth scopes
- `strategy-performance-ranker-multi-metric-sharpe-sortino-drawdown.ts` — composite scorer
- Phase 5 plan exists at `plans/260302-0947-phase5-ai-ml-hyperparameter-optimization/plan.md`

**Implication:** Phase 5 scope is narrower than a greenfield build. Priority = upgrade existing grid search → Bayesian, wire BullMQ, build real dashboard, add VaR.

---

## Area 1: AI/ML Hyperparameter Optimization

### Current Gap
`BacktestOptimizer` does exhaustive grid search — O(N^M) complexity. With 5 params × 10 values = 100,000 combos; infeasible for real workloads.

### Recommendation: TPE (Tree-Structured Parzen Estimator) via Optuna-style logic in TS

**Option A — Python sidecar (Optuna 4.7.0, Jan 2026):**
- Spawn Python subprocess per optimization job via BullMQ worker
- Optuna runs TPE/GP sampler, returns best params as JSON
- Pros: production-grade, 300+ citations, supports pruning (Hyperband/ASHA)
- Cons: adds Python runtime dependency; need IPC (stdout JSON)

**Option B — Pure TS Bayesian (hpjs / custom TPE):**
- `hpjs` library provides grid/random/Bayesian in JS
- Simpler stack; no Python needed
- Cons: far less mature than Optuna; no pruning support

**Option C — Random Search (quick win, KISS):**
- Replace grid search with random sampling over param space
- Proven to match grid search at 10-20x fewer evaluations (Bergstra 2012)
- Zero new dependencies; implement in 50 lines

### Walk-Forward Validation Pattern
```
Train window: 60 days → Optimize params
Test window: 30 days → Validate (out-of-sample)
Roll forward 30 days → Repeat
Avoid: using same data for optimization + evaluation = overfitting
```

### Priority Recommendation
1. **Immediate (P1):** Implement random search in `BacktestOptimizer` — replaces grid, no deps
2. **Phase 5.2 (P2):** Python Optuna sidecar via BullMQ worker — call `python3 optuna_worker.py`
3. **Phase 5.3 (P3):** Walk-forward validation wrapper (split train/test windows per job)

### Risk
- Overfitting: optimized params work in-sample, fail live → mitigate with walk-forward
- BullMQ worker timeout: long optimization jobs (1000+ combos × 30 days) → set `opts.timeout = 300000`

---

## Area 2: Strategy Marketplace

### Architecture Pattern (Collective2 / QuantConnect model)
```
Strategy Author (Tenant A) → publishes strategy + backtest results
Marketplace DB → stores metadata, rating, subscription_count, author_id
Subscriber (Tenant B) → pays to copy signals → copy-trade bridge
Revenue split: 70% author / 30% platform (configurable per tier)
```

### DB Schema Extension (Prisma)
```sql
StrategyListing {
  id, authorTenantId, strategyName, description
  price (USDC/month), isPublic, tags[], pairWhitelist[]
  sharpe, sortino, maxDrawdown, winRate  -- cached from last backtest
  subscriptionCount, totalRating, ratingCount
  createdAt, updatedAt
}
StrategySubscription {
  subscriberTenantId, listingId, status (active/cancelled)
  billingCycleStart, lastChargedAt
}
```

### Revenue Model Options
| Model | Complexity | Recommended |
|-------|-----------|-------------|
| Flat monthly fee per listing | Low | Phase 5 ✓ |
| Revenue share (% of subscriber profit) | High | Phase 6 |
| One-time purchase (signal code download) | Medium | Phase 5.2 |

### Copy-Trade Bridge
- Subscriber receives signals from author's live positions via WebSocket broadcast
- Bridge: `paper-trading-arbitrage-bridge.ts` already exists — extend for copy-trade
- Auth: subscriber's API key validates SCOPES.LIVE_TRADE per signal execution

### Implementation Priority
1. Prisma migration: `StrategyListing` + `StrategySubscription` tables
2. Polar.sh billing integration (already present) → subscription product per listing
3. Signal relay via existing WebSocket server
4. Rating/review system (already stubbed in marketplace routes)

---

## Area 3: Web Dashboard (React + WebSocket)

### Tech Stack Recommendation
| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | React 19 + Vite | Fast build, RSC ready if needed |
| State | Zustand | Lightweight, no Redux boilerplate |
| WS hook | `react-use-websocket` | Auto-reconnect, JWT auth on upgrade |
| Charts | TradingView Lightweight Charts v4 | Purpose-built for OHLCV, free OSS |
| Tables | TanStack Table v8 | Virtualized rows for 1000+ trades |
| Styling | Tailwind CSS v4 | Already in docs guidelines |

### Real-Time Data Architecture
```
WS Server (existing: src/core/websocket-server.ts)
  ↓ broadcasts: price_update, position_update, trade_executed, alert_triggered
React app (useWebSocket hook)
  ↓ buffer messages in useRef, flush via setInterval(200ms)
  ↓ Zustand store: prices{}, positions{}, recentTrades[]
  ↓ Components: PriceGrid, PositionTable, PnLChart, AlertFeed
```

### Performance Rules
- Batch state updates: flush WS messages every 200ms, not on every message
- Virtualize trade history table: TanStack Virtual for 10k+ rows
- Memoize chart data: `useMemo` on OHLCV arrays
- Web Worker: move indicator calculation (RSI, SMA) off main thread

### MVP Page Structure (5 pages)
1. **Dashboard** — live prices, open positions, PnL summary, recent alerts
2. **Backtests** — submit optimization job, view results table
3. **Marketplace** — browse strategies, subscribe, star rating
4. **Settings** — API keys, alert rules, tenant config
5. **Reporting** — trade history export (CSV/JSON — already exists)

---

## Area 4: Multi-Region Deployment

### Latency Reality Check for Crypto Trading
- CEX APIs (Binance, OKX) have server-side rate limits; sub-10ms network matters less than order queue position
- True HFT requires co-location; not feasible for a Node.js platform
- **Target: < 50ms order submission latency** — achievable without exotic infra

### Recommended Architecture
```
Primary Region: US-East (Fly.io / Railway / Render)
  └── Fastify API + BullMQ workers + WebSocket server
  └── PostgreSQL (Neon.tech — serverless, branching)
  └── Redis (Upstash — multi-region read replicas)

Edge (Cloudflare Workers):
  └── Market data caching (KV store, 60s TTL)
  └── Rate limiting + auth validation
  └── WebSocket upgrade routing → primary region

Secondary Region (Phase 6): EU-West
  └── Read-replica PostgreSQL
  └── Separate BullMQ workers for EU tenants
```

### Cloudflare Workers Fit Assessment
- Cold start: <1ms (V8 isolates, no containers) — excellent for order routing
- Limitation: max 50ms CPU per request (Bundled plan) — insufficient for strategy execution
- Use Workers for: auth, rate limiting, market data proxy
- Keep on primary region: backtesting, optimization, order execution

### Deployment Stack (YAGNI — start simple)
1. **Fly.io** — multi-region Node.js with `fly.toml` regions config; $0 for 3 shared VMs
2. **Neon.tech** — serverless Postgres with read replicas (compatible with Prisma)
3. **Upstash Redis** — multi-region Redis for BullMQ (compatible with ioredis)
4. **Cloudflare Workers** — edge routing layer (already in mekong-cli `apps/raas-gateway`)

---

## Area 5: Advanced Risk Management

### Current Gap
Existing execution layer (`atomic-cross-exchange-order-executor.ts`) handles individual orders. No portfolio-level risk aggregation.

### Trailing Stops — Implementation Pattern
```typescript
// ATR-based trailing stop (volatility-adjusted)
trailingStopPrice = entryPrice * (1 - ATR_multiplier * currentATR / entryPrice)
// Update on each price tick: if price > highWaterMark → update stop
// Trigger: if price < trailingStopPrice → close position
```
- Store `highWaterMark` and `trailingStopPrice` per position in Redis (fast read on tick)
- Existing `tenant-arbitrage-position-tracker.ts` — extend with trailing stop state

### Portfolio VaR — Historical Simulation
```typescript
// Historical VaR (simpler than Monte Carlo, no distribution assumptions)
// 1. Collect daily PnL returns for each open position (30-day window)
// 2. Sort combined portfolio returns
// 3. VaR(95%) = 5th percentile of loss distribution
// 4. VaR(99%) = 1st percentile
portfolioVaR = quantile(combinedReturns, 0.05) * totalPortfolioValue
```
- Compute on 5-min schedule via BullMQ recurring job
- Store in Redis for dashboard display
- Alert if VaR > threshold (existing `alert-rules-routes.ts`)

### Correlation Risk
```typescript
// Pearson correlation between position pairs
// If corr(A, B) > 0.85 → flag as correlated → reduce combined size
// Matrix: O(N^2) positions — feasible up to ~50 positions
```

### Risk Rule Engine Extension
| Rule | Trigger | Action |
|------|---------|--------|
| Max position size | size > 5% portfolio | Reject order |
| Trailing stop breach | price < trailing level | Market close |
| VaR breach | VaR > 2% portfolio | Halt new positions |
| Correlation limit | corr > 0.85 | Warn + reduce size |
| Daily loss limit | realized loss > 3% | Kill switch |

---

## Implementation Priority (Phase 5 Sequencing)

| Priority | Area | Effort | Value |
|----------|------|--------|-------|
| P1 | Random search optimizer (upgrade BacktestOptimizer) | 2h | High |
| P1 | BullMQ wire-up for optimization jobs (plan exists) | 2h | High |
| P1 | Trailing stop + VaR (extend position tracker) | 4h | High |
| P2 | React dashboard MVP (5 pages) | 1.5 days | High |
| P2 | Marketplace Prisma migration + Polar billing | 4h | Medium |
| P3 | Walk-forward validation wrapper | 3h | Medium |
| P3 | Multi-region Fly.io deploy | 2h | Medium |
| P4 | Python Optuna sidecar | 4h | Low (P3 sufficient) |

---

## Unresolved Questions

1. **Dashboard hosting**: Same Fastify server (serve static) or separate Vite app? Separate is cleaner but adds deploy complexity.
2. **Marketplace payment settlement**: Polar.sh handles subscription billing, but how are author payouts triggered? Manual or automated webhook → bank transfer?
3. **Walk-forward data source**: MockDataProvider exists; does real OHLCV data (via CCXT `fetchOHLCV`) need to be stored in DB for reproducible backtests?
4. **VaR computation frequency**: Every 5 min is adequate for swing trading; if HFT tenants are added, needs real-time computation.
5. **Correlation matrix scope**: Per-tenant or cross-tenant? Cross-tenant leaks position data — privacy concern.
6. **Fly.io vs Railway**: Railway is simpler but no true multi-region; Fly.io supports 35+ regions but has steeper learning curve.

---

Sources:
- [Optuna 4.7.0 — Hyperparameter Optimization Framework](https://optuna.org/)
- [Walk-forward optimization on cloud architecture](https://eveince.substack.com/p/walk-forward-optimization-for-algorithmic)
- [hpjs — Hyperparameter Optimization for JavaScript](https://hyperjs.herokuapp.com/)
- [Bayesian Optimization in Trading](https://hackernoon.com/bayesian-optimization-in-trading-4fb918fc52a7)
- [Collective2 — Strategy Marketplace Model](https://trade.collective2.com/algorithmic-trading)
- [Portfolio-Level Risk Constraints](https://breakingalpha.io/insights/portfolio-level-risk-constraints)
- [VaR for Algorithmic Trading](https://www.quantstart.com/articles/Value-at-Risk-VaR-for-Algorithmic-Trading-Risk-Management-Part-I/)
- [Cloudflare Workers Edge Computing 2026](https://www.digitalapplied.com/blog/edge-computing-cloudflare-workers-development-guide-2026)
- [WebSocket Architecture Best Practices](https://ably.com/topic/websocket-architecture-best-practices)
- [TradingView Lightweight Charts](https://www.tradingview.com/lightweight-charts/)
