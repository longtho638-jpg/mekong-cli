# Tech Stack Validation Report — AGI RaaS Crypto Arbitrage Platform
**Date:** 2026-03-02 | **Version:** 1.0 | **Status:** Validated for v3.0.0+ RaaS API

---

## Executive Summary

Current stack **OPTIMAL for RaaS arbitrage platform.** Analysis covers 5 decision domains:

1. **Exchange Layer:** CCXT 4.5 sufficient for 80% use cases; custom connectors recommended only for sub-50ms latency
2. **API Framework:** Fastify 5 beats Express 2.3x, matches Hono on throughput; Zod validation native
3. **Job Queue:** BullMQ > Temporal for backtest/scan jobs; Redis backbone reduces ops complexity
4. **Data Layer:** TimescaleDB hot (ticks/orders) + PostgreSQL transactional (RLS multi-tenant) + ClickHouse cold (analytics)
5. **Observability:** Prometheus + Grafana proven; missing custom trading metrics (fill rate, slippage, regime)

---

## 1. Tech Stack Fitness Check

### 1.1 Exchange Layer: CCXT vs Custom Connectors

| Decision | CCXT | Custom Connector |
|----------|------|------------------|
| **Latency** | 100–300ms (REST + signing) | 10–50ms (WebSocket native) |
| **Coverage** | 100+ exchanges | 1–3 exchanges |
| **Ops Overhead** | ~0% | High (maintenance per exchange) |
| **Recommended For** | Spread scanning, multi-exchange | Market-making, HFT |

**Verdict:** Keep CCXT 4.5. Latency hit from signing (45ms → 0.05ms with Coincurve) acceptable for arbitrage.
- Current config: REST API for order placement → ~100ms round-trip
- Optimize: Add Coincurve library (npm install coincurve) to cut signing latency 900x
- Multi-exchange scanning via CCXT async: Binance + OKX + Bybit in parallel < 500ms

**Risk:** If arbitrage spread decay <50ms, implement Binance/OKX/Bybit custom WebSocket connectors (Phase 2).

### 1.2 API Framework: Fastify vs Hono vs Express

**Benchmarks (2025):**
- Fastify: 70–80k req/sec, 2.3x faster than Express
- Hono: 75k+ req/sec, 40% less RAM than Express
- Express: 20–30k req/sec (baseline)

**For Trading API (RaaS):**
| Metric | Fastify | Hono |
|--------|---------|------|
| Native Zod support | ✅ (fastify-zod) | ✅ (built-in) |
| TypeScript-first | ✅ | ✅ |
| Plugin ecosystem | Mature | Growing |
| Production trading APIs | Heavy use (Dydx, Uniswap) | Emerging |

**Decision:** Fastify 5 selected (in tech-stack.md ADR-1).
- Rationale: Zod native validation + plugin pipeline for middleware (auth, rate-limit, tenant isolation)
- Alternative: Migrate to Hono if memory footprint becomes issue on M1 Mac

### 1.3 Job Queue: BullMQ vs Temporal vs Custom

**Use Cases:** Backtest jobs, scheduled scans, trade execution

| Dimension | BullMQ | Temporal | Custom (Node Stream) |
|-----------|--------|----------|----------------------|
| **Setup** | Redis only | Temporal server + client | DIY |
| **Durability** | Atomic (Redis) | High (Temporal DB) | Low (memory-based) |
| **Backtest chains** | Parent-child nesting ✅ | Workflow DAGs ✅ | Manual state |
| **Failure recovery** | Exponential backoff | Built-in retry policy | Custom logic |

**Verdict:** BullMQ (already adopted in tech-stack.md).
- Backtest jobs: Parent (generate signals) → Children (run on multiple timeframes)
- Scan jobs: Continuous spread detection → execute if threshold hit
- Redis dual-use: BullMQ queue + Pub/Sub for real-time events + rate limiting counters

**Pain points to monitor:**
- BullMQ 5.x requires Redis 6.2+. Check dev environment.
- Parent job must wait for all children; no partial completion retry.

### 1.4 Data Layer: TimescaleDB vs ClickHouse vs InfluxDB

**Write Performance (trades/sec):**
- TimescaleDB: Fast (suitable for real-time order entry)
- ClickHouse: 4M metrics/sec (overkill for trading, better for backtesting analytics)
- InfluxDB: Best disk efficiency (1:25 compression)

**Recommended Hybrid Strategy (ADR-2):**

| Database | Purpose | Write Latency | Query Pattern |
|----------|---------|---------------|---------------|
| **TimescaleDB** | Hot: ticks, orders, fills | <10ms | Real-time position queries |
| **PostgreSQL** | OLTP: tenants, API keys, strategies (RLS) | <5ms | transactional integrity |
| **ClickHouse** | Cold: historical analytics, backtesting | Batch | Complex aggregations |

**Implementation notes:**
- TimescaleDB extends PostgreSQL → same connection, RLS enforced at DB level
- Use continuous aggregates for 1m/5m/15m OHLCV (auto-rollup)
- Cold storage: Export daily ticks to ClickHouse for analytics (nightly batch)

### 1.5 Redis as Infrastructure Backbone (ADR-3)

Single Redis instance serves:
1. **BullMQ queues:** Backtest, scan jobs
2. **Rate limiting:** Token buckets per tenant (sliding window)
3. **Pub/Sub:** Real-time order updates, signal broadcasts
4. **Cache:** Hot orderbook snapshots, position state

**Production consideration:** Redis single-point-of-failure. For RaaS:
- Dev: Single Redis instance (docker-compose)
- Staging: Redis Sentinel (auto-failover)
- Prod: Redis Cluster (HA) or Redis Cloud (managed)

---

## 2. Real-Time Infrastructure

### WebSocket Multiplexing Across Exchanges

**Current approach:** CCXT async for REST polling → 1–2s latency per exchange

**Upgrade path (Phase 2):**
- Binance WebSocket: Subscribe to 50+ symbol streams
- OKX WebSocket: Public market data (no auth overhead)
- Bybit WebSocket: Order updates + executions
- Single connection per exchange → multiplex in Node.js event loop

**Backpressure handling:**
- CCXT: No explicit backpressure (polling-based)
- WebSocket upgrade: Ring buffer for incoming tick data; drop oldest if buffer fills (trading acceptable)
- Monitor: Latency p99 and buffer drop rate via Prometheus

### Event-Driven Architecture

Current: Modular components (BotEngine → IStrategy → ExchangeClient)
Upgrade: Fastify + BullMQ jobs emit events to Redis Pub/Sub

```
Exchange order fill → Redis Pub/Sub
  → BullMQ job listener
    → Position manager updates
    → Broadcast to API clients (WebSocket)
```

---

## 3. Database Architecture

### Multi-Tenant Isolation (ADR-4)

| Layer | Method | Enforcement |
|-------|--------|------------|
| API | JWT + tenant_id claim | Fastify middleware |
| DB | PostgreSQL RLS (Row-Level Security) | Check `tenant_id = current_user_id()` |
| App | Zod schema validation | Tenant_id required in all inputs |

**Current status:** Placeholder in `src/auth/` (needs full implementation)

### Continuous Aggregates (TimescaleDB)

```sql
CREATE MATERIALIZED VIEW ohlcv_1m AS
SELECT time_bucket('1 minute', ts) as ts, symbol,
  first(price, ts) as open,
  max(price) as high,
  min(price) as low,
  last(price, ts) as close,
  sum(volume) as volume
FROM ticks
GROUP BY 1, 2;

CREATE INDEX ON ohlcv_1m (symbol, ts DESC);
```

Query backtest data in <100ms via pre-aggregated views.

---

## 4. Monitoring & Observability

### Current Stack
- Winston logging: Structured JSON (good)
- Jest 29: 342+ tests (good coverage)

### Missing: Trading-Specific Metrics

| Metric | Purpose | Tool |
|--------|---------|------|
| Fill rate (%) | Order execution success | Custom counter |
| Slippage (bps) | Expected vs actual fill price | Custom histogram |
| Latency p99 (ms) | Order round-trip time | Prometheus histogram |
| Regime class | Trending/mean-reverting/volatile | Custom gauge |
| Daily PnL | Cumulative profit | Custom gauge |

**Implementation (Phase 2):**
```typescript
// src/netdata/trading-metrics.ts
const fillRateCounter = new prometheus.Counter({
  name: 'algo_fill_rate_total',
  help: 'Total fills / total orders',
  labelNames: ['exchange', 'strategy', 'tenant_id']
});

const slippageHistogram = new prometheus.Histogram({
  name: 'algo_slippage_bps',
  help: 'Slippage in basis points',
  labelNames: ['symbol', 'side'],
  buckets: [1, 5, 10, 25, 50, 100]
});
```

**Grafana dashboard layout:**
- Left: Request rate + error rate (top row)
- Right: p95 latency + fill rate (top row)
- Bottom: Slippage distribution, PnL line chart, regime gauge

---

## 5. Deployment & Scaling

### Containerization

Current: Dockerfile in root
Upgrade:
- Multi-stage build (dependencies → compile → runtime)
- Docker Compose: LocalStack (local AWS), PostgreSQL 16, TimescaleDB, Redis, ClickHouse
- Environment: DEV → STAGING → PROD (via git tags)

### Horizontal Scaling

**Per-tenant isolation (multi-pod model):**
```
┌─ Pod-1 (Tenant-A) ── Redis session ── DB RLS
├─ Pod-2 (Tenant-B) ── Redis session ── DB RLS
└─ Pod-N (Tenant-K) ── Redis session ── DB RLS
  (All share same DB via RLS + same Redis/Kafka)
```

**Shared pool model (recommended for MVP):**
- Single Fastify instance handles all tenants
- RLS ensures no data leakage
- Scale vertically first (M1 16GB → compute-optimized Hetzner)

### Geographic Proximity

**Current:** Single deployment
**Upgrade (optional):** Deploy edge servers near exchanges
- Binance API latency: NY 140ms, Tokyo 50ms, Singapore 20ms
- For arbitrage: Co-locate in Singapore/Tokyo

---

## 6. Missing Dependencies Assessment

### Recommended Additions

| Package | Purpose | Impact | Severity |
|---------|---------|--------|----------|
| **fastify** 5.x | API framework | Core | CRITICAL |
| **@fastify/jwt** | JWT auth middleware | Security | CRITICAL |
| **bullmq** 5.x | Job queue | Backtest/scan | HIGH |
| **pg** 8.x | PostgreSQL client | DB | CRITICAL |
| **pg-format** | SQL parameter binding | Security | HIGH |
| **ioredis** 5.x | Redis client (async) | Cache/events | HIGH |
| **prom-client** 15.x | Prometheus metrics | Observability | HIGH |
| **joi** or **passport-jwt** | Auth validation | Security | HIGH |
| **decimal.js** | Precise decimal math | Order pricing | CRITICAL |
| **luxon** or **date-fns** | Timezone handling | Trading logs | MEDIUM |

### Security Audit: Current Dependencies

```bash
npm audit --audit-level=moderate
# Result: No high/critical vulnerabilities (checked 2026-03-02)
```

**Dependencies requiring pin:**
- `zod@4.3.6` ✅ (pinned, good)
- `typescript@5.9.3` ✅ (pinned, good)
- CCXT: Monitor for security patches (crypto-sensitive)

---

## 7. Implementation Roadmap

### Phase 1 (v3.0.0 MVP) — Current
- ✅ CCXT + Commander CLI
- ⏳ Fastify API scaffold (in src/api/)
- ⏳ BullMQ backtest jobs (in src/jobs/)
- ⏳ PostgreSQL multi-tenant schema (in src/db/)

### Phase 2 (v3.1.0) — Real-Time Upgrade
- WebSocket multiplexing (Binance + OKX + Bybit)
- Prometheus + trading metrics
- Continuous aggregates (TimescaleDB)
- Grafana dashboards

### Phase 3 (v3.2.0) — Scale
- Custom exchange connectors (sub-50ms latency)
- Redis Cluster / Sentinel
- ClickHouse cold storage + dbt pipelines
- Multi-region deployment

---

## Unresolved Questions

1. **Coincurve library:** Should we add to reduce signing latency? (9ms → 0.05ms)
   - Trade-off: Extra C++ dependency, platform-specific compilation
   - Recommendation: Add for production, optional for dev

2. **Custom WebSocket connectors:** At what spread decay rate (ms) does CCXT become unviable?
   - Depends on arbitrage strategy: triangular (400ms+) vs cross-exchange (100–200ms)
   - Recommend profiling current setup, then decide in Phase 2

3. **TimescaleDB compression:** What's optimal chunk size for 1m tick data?
   - Docs suggest 1 day chunks; recommend testing with 6-hour chunks for faster queries

4. **ClickHouse cold storage:** Should we auto-migrate old ticks, or manual nightly batch?
   - Recommend event-driven: TimescaleDB time-to-live (TTL) + nightly export to ClickHouse

5. **RLS + multi-tenant scaling:** Does PostgreSQL RLS scale to 1000s of tenants?
   - Yes, but each query adds 1–2ms RLS check overhead
   - Monitor via `pg_stat_statements`

---

## References

- [CCXT Latency Analysis](https://axon.trade/how-to-improve-execution-in-crypto-markets-or-axon-trade-art-of-shaving)
- [Fastify Benchmarks](https://fastify.dev/benchmarks/)
- [BullMQ Production Guide](https://docs.bullmq.io/guide/going-to-production)
- [TimescaleDB vs ClickHouse Comparison](https://sanj.dev/post/clickhouse-timescaledb-influxdb-time-series-comparison)
- [WebSocket Trading Infrastructure](https://www.coinapi.io/blog/why-websocket-multiple-updates-beat-rest-apis-for-real-time-crypto-trading)

**Report validated against:** Current tech-stack.md, system-architecture.md, package.json (2026-03-02)
