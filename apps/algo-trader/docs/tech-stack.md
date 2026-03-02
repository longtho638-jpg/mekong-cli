# Tech Stack — AGI RaaS Platform

## Current Stack (Retained)

| Layer | Technology | Status |
|-------|-----------|--------|
| Language | TypeScript 5.9 | ✅ Production |
| Runtime | Node.js 20 | ✅ Production |
| Exchange | CCXT 4.5 | ✅ 100+ exchanges |
| CLI | Commander 11 | ✅ 14 commands |
| Validation | Zod 4.3 | ✅ All schemas |
| Logging | Winston 3.19 | ✅ Structured |
| WebSocket | ws 8.19 | ✅ tick/signal/health |
| Testing | Jest 29 | ✅ 342+ tests |
| Indicators | technicalindicators 3.1 | ✅ RSI, SMA, EMA |

## New Stack (AGI RaaS Layer)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| API | Fastify 5 | 30k req/sec, native Zod, TS-first |
| Job Queue | BullMQ 5 | Backtest jobs, scheduled scans |
| Cache/Events | Redis | Rate limiting, Pub/Sub, BullMQ backend |
| TSDB | TimescaleDB | Tick/candle storage, continuous aggregates |
| OLTP | PostgreSQL 16 | Tenants, strategies, trades (RLS) |
| Auth | JWT + API Keys | Multi-tenant isolation |
| Containers | Docker + PM2 | Cluster mode, health checks |
| Monitoring | Prometheus + Grafana | Trading metrics dashboards |
| Billing | Polar.sh | Subscription tiers (per project rules) |

## Architecture Decision Records

### ADR-1: Keep Plain HTTP for Internal API
Existing `raas-api-router.ts` uses raw `http.createServer`. Migrate to Fastify for production (schema validation, plugins, middleware pipeline). Retain backward compat via Fastify route registration.

### ADR-2: Dual Database Strategy
- TimescaleDB for time-series (ticks, candles, equity curves)
- PostgreSQL for transactional (tenants, orders, API keys)
- Both accessible via same connection (TimescaleDB extends PG)

### ADR-3: Redis as Infrastructure Backbone
Single Redis instance serves: BullMQ queues, rate limiting counters, Pub/Sub events, session cache. Reduces operational complexity.

### ADR-4: Multi-Tenant via RLS + JWT
PostgreSQL Row-Level Security enforces tenant isolation at DB level. JWT middleware extracts tenantId. API keys for programmatic access.

## Module Map

```
src/
├── api/              # Fastify routes (NEW)
│   ├── server.ts     # Fastify app bootstrap
│   ├── routes/       # RESTful endpoints
│   └── middleware/    # Auth, rate-limit, tenant
├── core/             # Trading engine (EXISTING)
├── strategies/       # Strategy implementations (EXISTING)
├── arbitrage/        # AGI arbitrage (EXISTING)
├── execution/        # Exchange gateway (EXISTING)
├── backtest/         # Backtesting framework (EXISTING)
├── netdata/          # Metrics & monitoring (EXISTING)
├── a2ui/             # Agent-to-UI layer (EXISTING)
├── pipeline/         # Workflow engine (EXISTING)
├── jobs/             # BullMQ workers (NEW)
├── db/               # Database schemas & migrations (NEW)
└── cli/              # CLI commands (EXISTING)
```

## Deployment Targets

| Environment | Infrastructure |
|-------------|---------------|
| Local Dev | Docker Compose (PG + Redis + TimescaleDB) |
| Staging | Docker on VPS (Hetzner/AWS) |
| Production | K8s or Docker Swarm |
