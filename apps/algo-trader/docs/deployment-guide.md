# Deployment Guide — Algo Trader v3.0.0

## Zero-Config Quickstart (Recommended)

```bash
npm install
npm run setup         # Interactive wizard — enter API keys, .env auto-generated
npm run quickstart    # Demo backtest + status check + available commands
```

No Docker required for backtest and dry-run modes.

## One-Click Shell Script

```bash
./scripts/one-click-setup-and-start.sh
```

Handles: prerequisites check → install → setup wizard → optional Docker.

## Full Stack (Docker Compose)

For live trading with RaaS API, database, and monitoring:

```bash
npm run setup                        # Configure .env first
docker compose up -d                 # Start PostgreSQL, Redis, Prometheus, Grafana
npx prisma generate && npx prisma migrate deploy
npm run dev api:serve                # Start API on port 3000

# Verify
curl http://localhost:3000/health    # API health
curl http://localhost:9090           # Prometheus UI
open http://localhost:3001           # Grafana (admin/admin)
```

## Services

| Service | Port | Purpose |
|---------|------|---------|
| algo-trader | 3000 | RaaS API + WebSocket |
| postgres | 5432 | PostgreSQL 16 database |
| redis | 6379 | BullMQ queues, Pub/Sub, rate limiter |
| prometheus | 9090 | Metrics collection |
| grafana | 3001 | Monitoring dashboards |

## Environment Variables

### Required
| Var | Description |
|-----|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `BINANCE_API_KEY` | Binance API key |
| `BINANCE_SECRET` | Binance secret |

### Optional
| Var | Default | Description |
|-----|---------|-------------|
| `API_PORT` | 3000 | API server port |
| `LOG_LEVEL` | info | Logging level |
| `METRICS_ENABLED` | true | Enable /metrics endpoint |
| `GRAFANA_PASSWORD` | admin | Grafana admin password |
| `POSTGRES_PASSWORD` | algo_trader_dev | DB password |

## Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed (optional)
npx prisma db seed
```

## Docker Build

```bash
# Build from monorepo root (context needs workspace packages)
docker build -f apps/algo-trader/Dockerfile -t algo-trader .

# Run standalone
docker run -p 3000:3000 \
  -e DATABASE_URL=... \
  -e REDIS_URL=... \
  algo-trader
```

## Health Checks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Liveness probe — uptime, version |
| `/ready` | GET | Readiness probe — 200 when ready, 503 otherwise |
| `/metrics` | GET | Prometheus metrics (text format) |

## Monitoring

### Prometheus Metrics
- `algo_trader_heap_used_bytes` — Heap memory
- `algo_trader_uptime_seconds` — Process uptime
- `algo_trader_trades_total` — Total executed trades
- `algo_trader_active_tenants` — Active tenant count
- `algo_trader_open_positions` — Open position count
- `algo_trader_circuit_breaker_state` — 0=closed, 1=open, 2=half_open
- `algo_trader_daily_pnl_usd` — Daily P&L

### Grafana
- Default datasource: Prometheus (auto-provisioned)
- Access: `http://localhost:3001` (admin / `GRAFANA_PASSWORD`)

## Production Deployment

### Docker Compose (Single Server)
```bash
docker compose -f docker-compose.yml up -d
```

### Kubernetes
```yaml
# Deployment resource limits (recommended)
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Scaling
- **Horizontal**: Multiple algo-trader replicas behind load balancer
- **Redis**: Single instance sufficient for <100 tenants
- **PostgreSQL**: Read replicas for analytics queries

## Troubleshooting

| Issue | Solution |
|-------|----------|
| DB connection refused | Check `DATABASE_URL`, ensure postgres is healthy |
| Redis timeout | Check `REDIS_URL`, verify redis container |
| 401 on API calls | Verify API key in `x-api-key` header |
| Circuit breaker tripped | Check `/metrics` for `algo_trader_circuit_breaker_state` |
| High memory | Check `algo_trader_heap_used_bytes` in Grafana |

Updated: 2026-03-02
