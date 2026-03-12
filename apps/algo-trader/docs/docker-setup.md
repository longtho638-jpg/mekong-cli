# Docker Infrastructure for Algo Trader

Production-ready Docker setup for Polymarket trading bot with monitoring stack.

## Quick Start

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
# Required: POLYMATRIX_API_KEY, POLYMATRIX_SECRET

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down
```

## Services

| Service     | Port  | Description                    |
|-------------|-------|--------------------------------|
| app         | 3000  | Polymarket trading bot         |
| postgres    | 5432  | PostgreSQL database            |
| redis       | 6379  | Redis for job queues           |
| prometheus  | 9090  | Metrics collection             |
| grafana     | 3002  | Dashboard & visualization      |

## Architecture

```
┌─────────────┐     ┌──────────────┐
│   Grafana   │────▶│  Prometheus  │
│   :3002     │     │    :9090     │
└─────────────┘     └──────┬───────┘
                           │
┌─────────────┐     ┌──────▼───────┐
│     App     │────▶│   Postgres   │
│   :3000     │     │    :5432     │
└──────┬──────┘     └──────────────┘
       │
       │     ┌──────────────┐
       └────▶│    Redis     │
             │    :6379     │
             └──────────────┘
```

## Resource Limits (M1 Mac Optimized)

| Service    | CPU Limit | Memory Limit |
|------------|-----------|--------------|
| app        | 2.0       | 1GB          |
| postgres   | 2.0       | 1GB          |
| redis      | 1.0       | 512MB        |
| prometheus | 1.0       | 512MB        |
| grafana    | 1.0       | 512MB        |

**Total:** ~3.5GB RAM, 6 CPU cores

## Health Checks

```bash
# Check service health
docker-compose ps

# Individual health checks
curl http://localhost:3000/health         # App
curl http://localhost:9090/-/healthy      # Prometheus
curl http://localhost:3002/api/health     # Grafana
```

## Database Management

```bash
# Run migrations
docker-compose exec app pnpm prisma migrate deploy

# Reset database (WARNING: destroys data)
docker-compose down -v

# Backup database
docker-compose exec postgres pg_dump -U algo_trader algo_trader > backup.sql

# Restore database
docker-compose exec -T postgres psql -U algo_trader algo_trader < backup.sql
```

## Monitoring

### Grafana Dashboard

1. Open http://localhost:3002
2. Login: admin / admin (change in .env!)
3. Dashboard: Algo Trader Main

### Prometheus Queries

```promql
# Request rate
rate(http_requests_total{job="algo-trader"}[5m])

# p95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status=~"5.."}[5m])
```

## Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app
```

## Production Deployment

```bash
# Build production image
docker-compose build

# Deploy with production config
NODE_ENV=production docker-compose up -d

# Scale app instances (if using swarm)
docker-compose up -d --scale app=3
```

## Troubleshooting

### App won't start
```bash
# Check logs
docker-compose logs app

# Verify database is ready
docker-compose logs postgres
```

### Database connection failed
```bash
# Restart dependent services
docker-compose restart postgres app
```

### Out of memory
```bash
# Reduce resource limits in docker-compose.yml
# Or increase Docker Desktop memory allocation
```

## Network Isolation

All services communicate via `algo-trader-net` bridge network.
External access only through exposed ports.

## Volume Persistence

| Volume        | Purpose                    |
|---------------|----------------------------|
| pgdata        | PostgreSQL data            |
| redisdata     | Redis persistence (AOF)    |
| promdata      | Prometheus metrics (7 days)|
| grafanadata   | Grafana dashboards/users   |
