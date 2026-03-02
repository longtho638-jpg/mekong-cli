---
phase: 5
title: "Monitoring & Docker"
status: pending
effort: 4h
parallel: false
depends_on: [4]
---

# Phase 5: Monitoring & Docker

## Context

- Current: No metrics collection; health endpoint exists but basic
- Current: No containerization; runs via ts-node locally
- Goal: Prometheus metrics + Grafana dashboards, Docker Compose full stack

## Key Insights

- prom-client: standard Node.js Prometheus library; built-in default metrics
- Multi-stage Docker build: compile TS in builder, ship only dist + node_modules
- Docker Compose: api + redis + postgres(+timescale) + grafana + prometheus

## Requirements

### Functional
- Prometheus /metrics endpoint on port 9090 (or same Fastify server)
- Custom metrics: trades_total, backtest_jobs_total, active_strategies, pnl_gauge
- Default metrics: CPU, memory, event loop lag, GC
- Grafana provisioned dashboards: Trading, System, Tenant
- Docker Compose: single `docker compose up` boots everything

### Non-Functional
- Scrape interval: 15s
- Metrics endpoint < 50ms
- Docker image < 200MB (alpine-based)

## Architecture

```
src/metrics/
├── metrics-registry.ts       # prom-client Registry + custom metrics
├── metrics-plugin.ts         # Fastify plugin: /metrics route on main server
└── collectors/
    ├── trading-collector.ts  # trades_total, pnl_gauge, position_count
    └── system-collector.ts   # Default metrics + event loop lag

docker/
├── Dockerfile                # Multi-stage: builder → production
├── docker-compose.yml        # Full stack: api, redis, postgres, grafana, prometheus
├── prometheus/
│   └── prometheus.yml        # Scrape config
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── datasource.yml  # Prometheus + PostgreSQL datasources
        └── dashboards/
            ├── dashboard.yml    # Dashboard provisioner config
            └── trading.json     # Pre-built trading dashboard
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/metrics/metrics-registry.ts` | prom-client Registry + custom metrics |
| `src/metrics/metrics-plugin.ts` | Fastify route: GET /metrics |
| `src/metrics/collectors/trading-collector.ts` | Trading-specific counters/gauges |
| `src/metrics/collectors/system-collector.ts` | Default + event loop metrics |
| `docker/Dockerfile` | Multi-stage Node.js build |
| `docker/docker-compose.yml` | Full stack services |
| `docker/prometheus/prometheus.yml` | Scrape config |
| `docker/grafana/provisioning/datasources/datasource.yml` | Data sources |
| `docker/grafana/provisioning/dashboards/dashboard.yml` | Provisioner |
| `docker/grafana/provisioning/dashboards/trading.json` | Pre-built dashboard |
| `.dockerignore` | Exclude node_modules, .git, tests |

## Files to Modify

| File | Change |
|------|--------|
| `src/api/server.ts` | Register metrics plugin |
| `package.json` | Add prom-client |

## Custom Metrics

```typescript
// Counters
trades_total         { tenant_id, pair, side, exchange }
backtest_jobs_total  { tenant_id, status: "completed"|"failed" }
api_requests_total   { method, route, status_code }

// Gauges
active_strategies    { tenant_id }
pnl_current_usd      { tenant_id, strategy_id }
ws_connections       { channel }

// Histograms
api_response_time    { method, route }   -- buckets: 10, 50, 100, 500, 1000ms
backtest_duration    { tenant_id }       -- buckets: 1, 5, 10, 30, 60s
```

## Dockerfile

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src/ ./src/
RUN pnpm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3000 3001 9090
HEALTHCHECK --interval=30s CMD wget -qO- http://localhost:3000/health || exit 1
USER node
CMD ["node", "dist/index.js", "api:serve"]
```

## Docker Compose Services

| Service | Image | Ports | Purpose |
|---------|-------|-------|---------|
| api | ./docker/Dockerfile | 3000, 3001 | Algo Trader API + WebSocket |
| redis | redis:7-alpine | 6379 | BullMQ + pub/sub + rate limiting |
| postgres | timescale/timescaledb:latest-pg16 | 5432 | Tenant data + candles |
| prometheus | prom/prometheus:latest | 9090 | Metrics scraping |
| grafana | grafana/grafana:latest | 3002 | Dashboards |

## Implementation Steps

1. Install: `prom-client`
2. Create `src/metrics/metrics-registry.ts` -- singleton Registry + metric definitions
3. Create `src/metrics/collectors/trading-collector.ts` -- increment on trade events
4. Create `src/metrics/collectors/system-collector.ts` -- collectDefaultMetrics()
5. Create `src/metrics/metrics-plugin.ts` -- Fastify route returning registry.metrics()
6. Register metrics plugin in server.ts
7. Create `docker/Dockerfile` (multi-stage)
8. Create `docker/docker-compose.yml` with all 5 services
9. Create prometheus.yml scrape config
10. Create Grafana provisioning files
11. Create `.dockerignore`
12. Write tests

## Todo

- [ ] Install prom-client
- [ ] Create metrics registry + custom metrics
- [ ] Create trading collector
- [ ] Create system collector
- [ ] Create metrics Fastify plugin
- [ ] Create Dockerfile (multi-stage)
- [ ] Create docker-compose.yml
- [ ] Create Prometheus config
- [ ] Create Grafana provisioning
- [ ] Create .dockerignore
- [ ] Write 5+ tests

## Tests

- `tests/metrics/metrics-registry.test.ts` -- counter increment, gauge set
- `tests/metrics/metrics-plugin.test.ts` -- /metrics returns text/plain
- `tests/metrics/collectors/trading-collector.test.ts` -- trade event updates counter

Docker integration: `docker compose up -d && curl localhost:9090/metrics`

## Success Criteria

- [ ] GET /metrics returns Prometheus text format
- [ ] Custom trading metrics update on events
- [ ] `docker compose up` starts all 5 services
- [ ] Grafana accessible on port 3002 with pre-loaded dashboard
- [ ] Docker image < 200MB
- [ ] Health check passes in container

## Risk

- **pnpm in Docker:** Workspace packages need proper COPY; may need `--filter` or bundle
- **TimescaleDB image:** Larger than standard postgres; ~400MB but includes extensions
- **Port conflicts:** 3000, 3001, 5432, 6379, 9090, 3002 -- document in .env.example
