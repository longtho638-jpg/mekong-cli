# Project Overview & PDR — Algo Trader v3.0.0

## Project Description
Algo Trader is a **RaaS (Robot-as-a-Service)** automated trading platform — Node.js + TypeScript, multi-tenant. Supports 10+ strategies, real-time WebSocket price feeds, ML models (GRU, Q-learning), stealth execution, and Fastify API gateway.

## Functional Requirements

### Core Trading
- **Data Acquisition**: OHLCV via CCXT + WebSocket real-time (Binance/OKX/Bybit)
- **Strategy Execution**: 10+ strategies (RSI+SMA, Bollinger, MACD, Statistical Arb, Cross-Exchange Arb, Triangular Arb, Funding Rate Arb, AGI, GRU, Q-Learning)
- **ML Trading**: GRU neural net (TensorFlow.js), tabular Q-learning RL strategy
- **Stealth Execution**: Phantom Order Cloaking Engine, CLI fingerprint masking, anti-detection safety layer

### Arbitrage Pipeline
- **WebSocket Price Feed**: Multi-exchange real-time, auto-reconnect, heartbeat monitoring
- **Fee-Aware Spread Calculator**: Net spread = gross - fees - slippage, 5min TTL cache
- **Atomic Order Executor**: Promise.allSettled buy/sell, rollback on partial failure
- **Live Exchange Manager**: Orchestrates pool + WS feeds + router + health monitor with auto-recovery

### RaaS Platform
- **Multi-tenant API**: Fastify 5, JWT + API Key auth, tenant isolation
- **Endpoints**: POST /arb/scan, /arb/execute, GET /positions, /history, /stats
- **Tenant CRUD**: Create/list/update/delete tenants, assign strategies per tenant
- **Position Tracking**: Tier-based limits (Basic 5 pos, Pro 20, Enterprise unlimited)
- **Rate Limiting**: Sliding window (in-memory + Redis path)

### Background Processing
- **BullMQ Workers**: Backtest jobs, scheduled scans (5min interval), webhook delivery
- **Redis Pub/Sub**: Real-time signal streaming per tenant

### Reporting & Monitoring
- **CLI Dashboard**: Real-time terminal display
- **Trade History Exporter**: CSV/JSON export
- **Paper Trading**: Virtual execution, P&L tracking with real WS data

## Non-Functional Requirements
- **Performance**: WebSocket tick-to-decision < 100ms, API 30k req/sec (Fastify)
- **Reliability**: Auto-reconnect, circuit breaker, max daily loss protection
- **Extensibility**: Interface-driven (`IStrategy`, `IDataProvider`, `IExchange`)
- **Type Safety**: TypeScript strict mode, Zod validation, 0 `any` types
- **Testing**: 1216 tests, Jest 29, 102 suites, unit + integration + load/stress

## Technical Stack
- TypeScript 5.9, Node.js 20, Fastify 5, CCXT 4.5
- BullMQ 5, Redis (IoRedis), PostgreSQL (Prisma), Zod 4.3
- TensorFlow.js (GRU, Q-learning), Winston, Jest, Commander CLI
- React 19, Vite 6, Tailwind CSS, Zustand 5 (dashboard)
- Docker + docker-compose, Prometheus + Grafana

## Acceptance Criteria
✅ **All Completed (Phases 1–17)**
- ✅ **1216/1216 tests passing** (100% pass rate, 102 suites)
- ✅ **0 TypeScript errors** (strict mode enabled)
- ✅ **0 `any` types** (full type safety)
- ✅ **0 console.log** (production clean)
- ✅ **0 TODO/FIXME** (zero tech debt)
- ✅ API server starts, authenticates tenants, enforces rate limits
- ✅ Arbitrage scanner detects cross-exchange opportunities in real-time
- ✅ Paper trading simulates execution without real capital
- ✅ Stealth layer masks bot fingerprints + cloaks orders
- ✅ Live Exchange Manager orchestrates full exchange lifecycle

## Current Status Summary
**All Phases Complete ✅**
- 232+ source files, 102 test suites, 1216 tests
- 20+ src modules: core, strategies, arbitrage, ML, billing, API, execution, stealth, ui, pipeline
- Latest: Phase 17 stealth modules (Phantom Order Cloaking, CLI fingerprint masking)
- Live Exchange Manager: pool + WS feeds + router + health monitor (Phase 7.1)

Updated: 2026-03-03
