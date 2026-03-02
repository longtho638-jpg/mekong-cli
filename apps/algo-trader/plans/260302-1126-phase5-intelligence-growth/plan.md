# Phase 5: Intelligence & Growth — Implementation Plan

**Date:** 2026-03-02 | **Status:** PLANNED
**Pre-requisite:** Phase 4 COMPLETE ✅ (842 tests, 0 TS errors)

## Research Reports
- [Phase 5 AI/ML Research](../reports/researcher-260302-1126-phase5-intelligence-growth.md)
- [Trading Dashboard UX](../reports/researcher-260302-1126-trading-dashboard-ux.md)

## Phase Overview

| Phase | Description | Priority | Effort |
|-------|-------------|----------|--------|
| 5.1 | Random Search Optimizer + Trailing Stop/VaR | P1 | 1 day |
| 5.2 | React Dashboard MVP (5 pages) | P2 | 2 days |
| 5.3 | Strategy Marketplace + Prisma Migration | P2 | 1 day |
| 5.4 | Walk-Forward Validation + Multi-Region | P3 | 1 day |

## Phases

### Phase 5.1: Core Intelligence (P1)
- [x] Status: READY TO IMPLEMENT
- **Files:** `src/backtest/`, `src/core/`, `src/jobs/`

**Tasks:**
- [ ] Replace grid search → random search in `BacktestOptimizer` (50 lines, 0 deps)
- [ ] Wire BullMQ optimization job worker (plan already exists)
- [ ] ATR-based trailing stop in `tenant-arbitrage-position-tracker.ts`
- [ ] Historical VaR calculator (30-day window, 5-min BullMQ job)
- [ ] Correlation matrix alert (Pearson, >0.85 threshold)
- [ ] Tests for all new modules

### Phase 5.2: React Dashboard MVP (P2)
- [ ] Status: PLANNED
- **Tech:** React 19 + Vite + Zustand + TradingView Lightweight Charts + Tailwind

**Pages:**
- [ ] Dashboard — live prices, open positions, PnL summary
- [ ] Backtests — submit optimization, view results
- [ ] Marketplace — browse strategies, subscribe
- [ ] Settings — API keys, alert rules, tenant config
- [ ] Reporting — trade history (CSV/JSON export)

**Architecture:**
- WebSocket buffer (25ms) → Zustand store → memoized components
- Separate Vite app, served from `/dashboard` route or standalone

### Phase 5.3: Strategy Marketplace (P2)
- [ ] Status: PLANNED
- **Files:** `prisma/schema.prisma`, `src/api/routes/`, `src/core/`

**Tasks:**
- [ ] Prisma migration: `StrategyListing` + `StrategySubscription` tables
- [ ] Polar.sh subscription per listing
- [ ] Copy-trade signal relay via WebSocket
- [ ] Rating/review system (extend existing marketplace routes)

### Phase 5.4: Walk-Forward + Multi-Region (P3)
- [ ] Status: PLANNED

**Tasks:**
- [ ] Walk-forward validation wrapper (train/test window split)
- [ ] Fly.io deployment config (`fly.toml`)
- [ ] Neon.tech PostgreSQL + Upstash Redis setup
- [ ] Cloudflare Workers edge routing

## Success Criteria
- [ ] Random search optimizer: 10-20x fewer evaluations than grid
- [ ] Dashboard: <100ms chart latency at 60 FPS
- [ ] VaR: computed every 5min, alerts on breach
- [ ] All new code: 0 TS errors, 0 `any`, tests for every module
- [ ] Total test count: 900+ (currently 842)

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Overfitting optimized params | Live trading loss | Walk-forward validation |
| Dashboard WebSocket storm | UI freeze | 25ms buffer + requestAnimationFrame |
| Marketplace payment disputes | Revenue loss | Polar.sh escrow + clear ToS |
| Multi-region data consistency | Position mismatch | Single-writer pattern + read replicas |

Updated: 2026-03-02
