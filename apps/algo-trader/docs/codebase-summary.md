# Codebase Summary — Algo Trader v3.0.0

## Overview
Algo Trader là nền tảng RaaS (Robot-as-a-Service) giao dịch tự động multi-tenant. Hỗ trợ 6+ chiến thuật trading, real-time WebSocket price feeds, paper trading, và Fastify API gateway.

## Project Structure

### src/core/ — Engine & Multi-Tenant
- `BotEngine.ts` — Signal routing, strategy orchestration
- `RiskManager.ts` — Position sizing, risk calculation
- `OrderManager.ts` — Order state tracking
- `TenantArbPositionTracker.ts` — Multi-tenant position store, tier limits
- `TenantStrategyManager.ts` — Tenant CRUD, strategy assignment
- `PaperTradingEngine.ts` — Virtual trading simulation
- `WebSocketServer.ts` — Real-time stream broadcasting
- `StrategyAutoDetector.ts` — Nixpacks-inspired auto-detection, build plan generator
- `StrategyLoader.ts` — Dynamic strategy loading by name

### src/strategies/ — Trading Strategies
- Technical: RSI+SMA, RSI Crossover, Bollinger, MACD, MACD+Bollinger+RSI
- Arbitrage: Cross-Exchange, Triangular, Statistical, AGI

### src/execution/ — Order Execution Pipeline
- `WebSocketMultiExchangePriceFeedManager.ts` — Binance/OKX/Bybit streams, auto-reconnect
- `FeeAwareCrossExchangeSpreadCalculator.ts` — Net spread = gross - fees - slippage
- `AtomicCrossExchangeOrderExecutor.ts` — Promise.allSettled buy/sell, rollback
- `PaperTradingArbitrageBridge.ts` — Paper trading multi-exchange simulator

### src/api/ — RaaS API Layer (Fastify 5)
- `fastify-raas-server.ts` — Server bootstrap, plugin registration
- `routes/arbitrage-scan-execute-routes.ts` — POST /arb/scan, /arb/execute
- `routes/arbitrage-positions-history-routes.ts` — GET /positions, /history, /stats
- `routes/tenant-crud-routes.ts` — Tenant CRUD endpoints
- `routes/backtest-job-submission-routes.ts` — Backtest job submission
- `schemas/` — Zod validation schemas

### src/auth/ — Authentication & Security
- `tenant-auth-middleware.ts` — JWT + API Key auth, tenant isolation
- `jwt-token-service.ts` — JWT sign/verify
- `api-key-manager.ts` — API key validation
- `sliding-window-rate-limiter.ts` — In-memory + Redis rate limiting
- `scopes.ts` — Permission scopes (ADMIN, BACKTEST, TRADE, READ)

### src/jobs/ — BullMQ Background Processing
- `bullmq-named-queue-registry-backtest-scan-webhook.ts` — Queue factory
- `workers/bullmq-backtest-worker-*.ts` — Backtest job processor
- `workers/bullmq-scan-worker-*.ts` — Scheduled strategy scan
- `ioredis-connection-factory-and-singleton-pool.ts` — Redis connection pool
- `redis-sliding-window-rate-limiter-*.ts` — Redis-backed rate limiter

### src/cli/ — CLI Commands
- `arb-cli-commands.ts` — arb:scan, arb:run, arb:engine, arb:orchestrator
- `arb-agi-auto-execution-commands.ts` — arb:auto, arb:agi
- `spread-detector-command.ts` — arb:spread
- `strategy-marketplace-tenant-cli-commands.ts` — Marketplace CLI

### src/backtest/ — Backtesting Framework
- `BacktestRunner.ts` — Standard backtest execution
- `BacktestEngine.ts` — Advanced: equity curve, Sortino, Calmar, Monte Carlo, walk-forward

### src/reporting/ — Export & Analytics
- `ArbitrageTradeHistoryExporter.ts` — CSV/JSON export

### src/ui/ — Dashboard
- `ArbitrageCLIRealtimeDashboard.ts` — Real-time terminal metrics (chalk)

### prisma/ — Database Schema
- `schema.prisma` — Tenant, Strategy, Order, Trade models (PostgreSQL)

### tests/ — Test Suite
- `tests/execution/` — Spread calc, order executor, price feed, paper trading
- `tests/jobs/` — BullMQ workers, Redis pub/sub, rate limiter
- `tests/reporting/` — Trade history exporter
- `tests/ui/` — CLI dashboard

## Key Metrics
- **176 source files** (TypeScript 5.9, strict mode)
- **868 tests** (Jest 29, **100% pass rate** ✅)
- **14 CLI commands** (Commander)
- **6+ trading strategies** (RSI, SMA, Bollinger, MACD, Statistical, Cross-Exchange, Triangular, AGI)
- **8+ API endpoints** + WebSocket channel (Fastify 5)
- **3 exchange integrations** (Binance, OKX, Bybit via CCXT 4.5)
- **4 database models** (Tenant, Strategy, Order, Trade via Prisma)

## Quality Metrics (Phase 4 ✅)
- **0 TypeScript errors** (strict mode enforced)
- **0 `any` types** (100% type coverage)
- **0 console.log** (production clean)
- **0 TODO/FIXME** (zero tech debt)
- **0 secrets in code** (.env gitignored)
- **Binh Phap 6/6 fronts passing** (tech debt, type safety, performance, security, UX, documentation)

## Tech Stack
TypeScript 5.9 | Node.js 20 | Fastify 5 | CCXT 4.5 | BullMQ 5 | Redis (IoRedis) | PostgreSQL (Prisma) | Zod 4.3 | Winston | Jest 29 | Commander CLI

Updated: 2026-03-02
