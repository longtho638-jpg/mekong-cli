# Project Overview & PDR — Algo Trader v3.0.0

## Project Description
Algo Trader là nền tảng **RaaS (Robot-as-a-Service)** giao dịch tự động, xây dựng trên Node.js + TypeScript. Hệ thống multi-tenant cho phép nhiều khách hàng sử dụng các chiến thuật trading thông qua API, với real-time price feeds, paper trading, và auto-execution.

## Functional Requirements

### Core Trading
- **Data Acquisition**: OHLCV qua CCXT + WebSocket real-time (Binance/OKX/Bybit)
- **Strategy Execution**: 6+ chiến thuật (RSI+SMA, RSI Crossover, Bollinger, MACD, Statistical Arb, Cross-Exchange Arb)
- **AGI Arbitrage**: Regime detection (Hurst exponent), Kelly sizing, self-tuning thresholds

### Arbitrage Pipeline
- **WebSocket Price Feed**: Multi-exchange real-time, auto-reconnect, heartbeat monitoring
- **Fee-Aware Spread Calculator**: Net spread = gross - fees - slippage, dynamic fee cache 5min TTL
- **Atomic Order Executor**: Promise.allSettled buy/sell, rollback on partial failure

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
- **CLI Dashboard**: Real-time terminal display (chalk)
- **Trade History Exporter**: CSV/JSON export
- **Paper Trading**: Virtual execution, P&L tracking

## Non-Functional Requirements
- **Performance**: WebSocket tick-to-decision < 100ms, API 30k req/sec (Fastify)
- **Reliability**: Auto-reconnect, circuit breaker, max daily loss protection
- **Extensibility**: Interface-driven (`IStrategy`, `IDataProvider`, `IExchange`)
- **Type Safety**: TypeScript strict mode, Zod validation, 0 `any` types
- **Testing**: 868 tests, Jest 29, unit + integration + load/stress

## Technical Stack
- TypeScript 5.9, Node.js 20, Fastify 5, CCXT 4.5
- BullMQ 5, Redis (IoRedis), PostgreSQL (Prisma), Zod 4.3
- Winston logging, Jest testing, Commander CLI

## Acceptance Criteria
✅ **All Completed (Phase 4: Production Hardening)**
- ✅ API server starts, authenticates tenants, enforces rate limits
- ✅ Arbitrage scanner detects cross-exchange opportunities in real-time
- ✅ Paper trading simulates execution without real capital
- ✅ **868/868 tests passing** (100% pass rate)
- ✅ **0 TypeScript errors** (strict mode enabled)
- ✅ **0 `any` types** (full type safety)
- ✅ **0 console.log** (production clean)
- ✅ **0 TODO/FIXME** (zero tech debt)
- ✅ Tenant tier limits enforced (position count, per-symbol max)

## Phase 4 Status Summary
**Completion: 100% ✅**
- All 48 previously failing tests now passing
- TypeScript strict compliance verified
- Quality gates: 6/6 Binh Phap fronts passed
- Ready for Phase 5 (Intelligence & Growth)

Updated: 2026-03-02
