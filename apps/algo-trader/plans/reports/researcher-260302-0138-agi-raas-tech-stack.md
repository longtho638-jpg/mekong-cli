# AGI RaaS Tech Stack Research Report

**Date:** 2026-03-02 | **Status:** Complete Research | **Scope:** API, WebSocket, Jobs, DB, Auth, Containers, Monitoring, Events

---

## Executive Summary

Transform algo-trader (TS/Node.js CLI) into AGI RaaS platform. Recommended stack: **Fastify + ws + BullMQ + TimescaleDB + PostgreSQL + JWT/API keys + Docker+PM2 + Prometheus/Grafana + Redis Pub/Sub**. Rationale: High throughput (Fastify: 30k req/sec vs Express: 15k), minimal latency (ws: 3KB/conn vs Socket.io: 15KB), distributed job persistence (BullMQ), dual DB strategy (analytics + transactional), and proven observability (Prom+Graf).

---

## 1. API Framework: Fastify

**Recommendation:** Fastify (Primary) with optional Hono for edge

### Why Fastify
- **Performance:** 2x Express (30k vs 15k req/sec), native validation/serialization
- **Trading fit:** Built-in schema validation (Zod schemas already in codebase), async/await native
- **TypeScript:** Full TS support; matches existing codebase style
- **Built-in:** Logging (pino), error handling, security headers

### vs Competitors
- **Express:** Legacy (battle-tested but slower); justified for prototypes only
- **Hono:** Lighter (5KB bundle), excellent for edge/serverless, but overkill for monolithic RaaS backend

### Migration Path
1. Existing CLI: Keep ts-node/Commander for standalone usage
2. New RaaS API: Fastify server (port 3000) wrapping core trading engine
3. Register existing commands as Fastify routes
4. Keep CCXT, strategy loader, risk manager unchanged

**Sources:**
- [Fastify vs Express vs Hono | Medium](https://medium.com/@arifdewi/fastify-vs-express-vs-hono-choosing-the-right-node-js-framework-for-your-project-da629adebd4e)
- [Beyond Express: Fastify vs Hono | DEV Community](https://dev.to/alex_aslam/beyond-express-fastify-vs-hono-which-wins-for-high-throughput-apis-373i)

---

## 2. WebSocket: ws Library

**Recommendation:** `ws` (thin native WebSocket)

### Why ws
- **Low memory:** 3KB/conn (vs Socket.io: 15KB/conn) → supports 100k concurrent connections
- **Latency:** Minimal overhead; perfect for tick/trade/signal streaming
- **Existing code:** algo-trader already uses `ws@8.19.0` — keep using
- **Real-time:** Ticks, signals, health metrics → low-latency broadcast via channels

### vs Competitors
- **Socket.io:** Rich features (auto-reconnect, rooms), but +60KB bundle; unnecessary for trading
- **uWebSockets:** Ultra-low latency (C++ backend) but higher ops complexity; reserve for extreme scale

### Architecture
```
TickStore (in-memory ring buffer 10k ticks)
    ↓
SignalMesh (pub/sub event bus) ← existing!
    ↓
ws channels: [tick, signal, health]
    ↓
Client WebSocket connections (no fallback needed)
```

**Sources:**
- [Socket.IO vs ws | StackShare](https://stackshare.io/stackups/socket-io-vs-ws)
- [Node.js WebSockets: ws vs Socket.io | DEV Community](https://dev.to/alex_aslam/nodejs-websockets-when-to-use-ws-vs-socketio-and-why-we-switched-di9)

---

## 3. Job Queue: BullMQ

**Recommendation:** BullMQ for distributed task processing

### Why BullMQ
- **Job persistence:** Redis-backed; survives process restarts
- **Retries:** Automatic exponential backoff + DLQ
- **Scaling:** Horizontal scaling across workers (multi-tenant strategies)
- **Scheduling:** Delay, repeat, backoff configurable
- **Dashboard:** Admin UI for monitoring queues

### Trading Use Cases
- Backtest jobs (submitted via RaaS, executed on workers)
- Arbitrage scans (scheduled recurring tasks)
- Strategy parameter tuning (parallel jobs)
- Trade alerts (webhook delivery)

### vs Competitors
- **Bull (v3):** Older; use BullMQ (v5+) for type safety
- **Temporal:** Enterprise workflow engine; overkill unless need complex state machines + durable execution

### Architecture
```
Tenant submits backtest → BullMQ.add(job)
    ↓
Worker pool consumes → execute BacktestRunner
    ↓
Results stored in TimescaleDB → callback to tenant via WebSocket
```

**Sources:**
- [BullMQ vs Bull | GitHub](https://github.com/taskforcesh/bullmq)
- [Job Scheduling in Node.js with BullMQ | Better Stack](https://betterstack.com/community/guides/scaling-nodejs/bullmq-scheduled-tasks/)

---

## 4. Databases: TimescaleDB + PostgreSQL

**Recommendation:** Dual DB strategy

### Primary: TimescaleDB (TSDB for market data)
- **Use case:** Ingest ticks, candles, orderbooks (high-frequency writes)
- **Performance:** 6-13x faster than InfluxDB on ingestion; 16-20x on analytical queries
- **Queries:** Time-based analytics, equity curves, PnL over time
- **Retention:** Keep raw ticks 30d, candles 2y
- **Built-in:** Downsampling, continuous aggregates (1m → 5m → 1h auto)

### Secondary: PostgreSQL (OLTP for transactional data)
- **Use case:** Tenants, strategies, API keys, trades, orders
- **JSONB:** Strategy params, backtest results as JSON
- **RLS:** Row-level security for multi-tenant isolation
- **Transactions:** ACID for trade execution + accounting
- **Hybrid:** TimescaleDB extends PostgreSQL anyway

### vs Competitors
- **InfluxDB:** Strict Core limits (72h retention); v3.0 lacks materialized views; not suitable
- **QuestDB:** 12-36x faster than InfluxDB 3 but more OLAP-focused; less suited for transactional workloads

### Data Flow
```
Live ticks → INSERT INTO candles_raw (symbol, time, open, high, low, close)
Auto downsampled → candles_1m, candles_5m, candles_1h
Queries use continuous aggregates (pre-aggregated)
Trade execution logged to PostgreSQL (orders, positions, PnL)
```

**Sources:**
- [Comparing InfluxDB, TimescaleDB, QuestDB | QuestDB Blog](https://questdb.com/blog/comparing-influxdb-timescaledb-questdb-time-series-databases/)
- [TimescaleDB vs QuestDB Benchmarks | QuestDB](https://questdb.com/blog/timescaledb-vs-questdb-comparison/)

---

## 5. Authentication & Multi-Tenancy: JWT + API Keys

**Recommendation:** Hybrid model

### JWT (Stateless)
- **Use:** Authenticated WebSocket connections, internal service-to-service
- **Flow:** Tenant login → issue JWT (exp: 1h) + refresh token (exp: 7d)
- **Payload:** `{ tenantId, sub, aud: "raas-api" }`
- **Verification:** Middleware on all protected routes

### API Keys (Service Accounts)
- **Use:** Programmatic trading, external integrations, audit logs
- **Format:** Prefix (algo_) + 32 random chars; hashed in DB
- **Scopes:** `backtest`, `live:trade`, `live:monitor`, `admin`
- **Rotation:** Tenant can revoke anytime; audit trail logged

### Rate Limiting
- **Per API key:** 100 requests/min (backtest), 1000 req/min (monitor)
- **Per IP:** Sliding window; 429 on exceed
- **Strategy:** Redis-backed counter; reset each minute
- **Headers:** `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Multi-Tenancy
```
Fastify middleware extracts tenantId from JWT/API key
↓
All queries filtered: `WHERE tenant_id = $1`
↓
RLS policies in PostgreSQL (backup enforcement)
↓
WebSocket channels scoped per tenant
```

**Sources:**
- [Node.js API Authentication Best Practices 2026](https://www.sparkleweb.in/blog/node.js_security_best_practices_for_2026)
- [Multi-Tenant JWT Auth | GitHub](https://github.com/auth0/multitenant-jwt-auth)

---

## 6. Containerization: Docker + PM2

**Recommendation:** Docker (primary) with PM2 inside containers

### Docker Strategy
- **Multi-stage Dockerfile:** Compile TS → ship only dist + node_modules (prod)
- **Base image:** `node:20-alpine` (small, fast)
- **Health checks:** GET /health (liveness), GET /ready (readiness + DB check)
- **Exposed:** Port 3000 (API), port 3001 (WebSocket), port 9090 (metrics)

### PM2 Inside Container
- **Cluster mode:** Fork N processes per container (leverage multi-core)
- **Auto-restart:** Crash recovery; max retries 5
- **Monitoring:** pm2-monitoring logs to stdout (Docker captures)
- **Signal handling:** Graceful shutdown on SIGTERM (drain active connections)

### Scaling
```
Docker: Orchestrate via K8s/ECS (horizontal pod autoscaling)
PM2: Cluster mode within each container (vertical scaling within container)
Combined: 3 replicas × 4 cluster processes = 12 trading engines
```

### vs PM2 Alone
- PM2 useful for local dev/small deployments; Docker essential for RaaS (consistency, isolation, CI/CD)

**Sources:**
- [PM2 and Docker Integration | PM2 Docs](https://pm2.io/docs/runtime/integration/docker/)
- [PM2 vs Docker in NodeJS | DEV Community](https://dev.to/mandraketech/pm2-and-docker-in-the-world-of-nodejs-1lg8)

---

## 7. Monitoring: Prometheus + Grafana

**Recommendation:** Prometheus (metrics) + Grafana (dashboards)

### Prometheus Metrics
- **Application:** Trade count, PnL, Sharpe ratio, drawdown (per strategy, per tenant)
- **System:** CPU, memory, connections (from node/prom client library)
- **Exchange:** API latency, order fill time, cancellation rate
- **Business:** Backtest jobs submitted, strategies live, tenants active
- **Scrape:** 15s interval on port 9090/metrics

### Grafana Dashboards
1. **Trading Dashboard:** Open positions, realized PnL, equity curve (TimescaleDB queries)
2. **Health Dashboard:** API latency, WebSocket connections, queue depth (BullMQ)
3. **Tenant Dashboard:** Per-tenant usage, API key calls, strategy performance
4. **Alerts:** Drawdown > 20% → Slack; API latency > 1s → PagerDuty

### Integration
```
App publishes metrics (prom-client library)
↓
Prometheus scrapes every 15s
↓
Grafana queries Prometheus + TimescaleDB for dashboards
↓
Alerts fired on thresholds → webhooks (Slack, Discord, PagerDuty)
```

### Storage
- **Prometheus:** 30d retention in Docker volume (or S3 via remote storage)
- **Grafana:** Saved dashboards + alert rules in PostgreSQL

**Sources:**
- [Prometheus and Grafana Monitoring | Medium 2026](https://medium.com/@kaustubh.saha/observability-with-prometheus-and-grafana-506a203146c0)
- [Trade Dashboard | Grafana Labs](https://grafana.com/grafana/dashboards/18100-new-trade-dashboard/)

---

## 8. Event-Driven: Redis Pub/Sub

**Recommendation:** Redis Pub/Sub for in-process events; Redis Streams for durable events

### Redis Pub/Sub (In-Process)
- **Use:** Signal events, trade executions, health alerts → workers, WebSocket listeners
- **Channels:** `signal:{strategy}`, `trade:{tenantId}`, `health:{status}`
- **Pattern:** Loose coupling between BotEngine, PluginManager, WebSocket server
- **Latency:** <1ms; no persistence (fire-and-forget)

### Redis Streams (Durable)
- **Use:** Audit trail of all trades, ticks, strategy decisions
- **Retention:** 30d rolling window
- **Consumers:** Multiple workers can replay same stream (idempotent processing)
- **Use case:** Compliance audit, backtesting replay, forensics

### vs NATS
- **NATS:** Cloud-native, complex routing; Redis simpler for this scale
- **Kafka:** Overkill unless handling 100k+ events/sec; Redis Streams sufficient for RaaS

### Architecture
```
BotEngine emits SIGNAL event
↓
Redis Pub/Sub: trade:{tenantId} → all listeners get copy (0 latency)
↓
WebSocket layer broadcasts to connected clients
PostGres audit logger writes event (BullMQ worker subscribes, logs async)
TimescaleDB ingests for analytics (consumer group)
```

**Sources:**
- [Redis as Message Broker | Reintech](https://reintech.io/blog/redis-as-message-broker-event-driven-systems)
- [NATS vs Redis | Hoop Dev](https://hoop.dev/blog/what-nats-redis-actually-does-and-when-to-use-it/)

---

## Implementation Roadmap

| Phase | Timeline | Scope |
|-------|----------|-------|
| 1. API Layer | W1-W2 | Fastify wrapper, route all CLI commands, health endpoints |
| 2. WebSocket | W2-W3 | Real-time tick/signal/health streaming via ws channels |
| 3. Job Queue | W3-W4 | BullMQ for backtests, scheduled tasks; worker pool |
| 4. Databases | W4-W5 | Migrate to TimescaleDB + PostgreSQL; multi-tenant schema |
| 5. Auth | W5-W6 | JWT + API keys; rate limiting middleware; RLS policies |
| 6. Containers | W6-W7 | Dockerfile, docker-compose.yml; local dev stack |
| 7. Monitoring | W7-W8 | Prometheus + Grafana; alert rules |
| 8. Integration | W8-W9 | End-to-end test; load test; multi-tenant validation |

---

## Tech Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **API Framework** | Fastify | 30k req/sec, native validation, TypeScript |
| **WebSocket** | ws | 3KB/conn, low latency, already in use |
| **Job Queue** | BullMQ | Redis-backed, retries, horizontal scaling |
| **TS Database** | TimescaleDB | 6-13x faster ingestion, continuous aggregates |
| **OLTP Database** | PostgreSQL | ACID, RLS, JSONB, transactions |
| **Auth** | JWT + API Keys | Stateless + service accounts, multi-tenant |
| **Containers** | Docker + PM2 | Portable, isolated, cluster mode scaling |
| **Monitoring** | Prometheus + Grafana | Standard stack, trade dashboards |
| **Events** | Redis Pub/Sub + Streams | Low latency + durable audit trail |

---

## Security Considerations

- **Config validation:** Keep existing Zod schemas; validate all API inputs
- **Secrets:** API keys hashed in DB; JWT signed with RS256 (asymmetric)
- **TLS:** Enforce HTTPS in production; WebSocket over WSS
- **RLS:** PostgreSQL row-level policies enforce tenant isolation at DB level
- **Audit:** All trades logged to Streams + PostgreSQL (immutable)
- **Rate limiting:** Per API key, per IP; exponential backoff on 429

---

## Cost & Scale Implications

- **RaaS @ 1000 tenants:** 10-50 simultaneous live bots, 100-500 backtest jobs/day
- **Database:** TimescaleDB single node handles ~50k ticks/sec; scale via sharding if needed
- **Storage:** 30d tick data ≈ 500GB (compress); 2y candles ≈ 50GB
- **Compute:** 4-core server sufficient; scale horizontally via Kubernetes
- **Infrastructure:** Docker on EC2 t3.xlarge (AWS) or Hetzner (cost-optimized)

---

## Unresolved Questions

1. **Data retention policy:** How long to keep ticks vs candles? Compliance requirements?
2. **Multi-exchange:** Priority for initial launch? Binance-only or multi-exchange from v1?
3. **Backtesting API:** Async jobs or sync (blocking) API? Current code is sync.
4. **SLA requirements:** Uptime SLA? RTO/RPO for disaster recovery?
5. **Tenant isolation:** Hard isolation (separate DBs) or soft (RLS)? Cost vs complexity.
6. **Live trading limits:** Max position size per tenant? Per-exchange exposure limits?

---

**Report Author:** Researcher Agent | **Classification:** Internal Technical | **Next Step:** Implementation Planning Phase
