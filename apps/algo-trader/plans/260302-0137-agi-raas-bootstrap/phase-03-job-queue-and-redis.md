---
phase: 3
title: "Job Queue & Redis"
status: pending
effort: 4h
parallel: true
depends_on: []
---

# Phase 3: Job Queue & Redis

## Context

- Current: Backtest runs synchronously in CLI; blocks caller
- Current: No scheduled strategy scans; manual only
- Current: SignalMesh (src/netdata/SignalMesh.ts) uses in-process EventEmitter
- Goal: BullMQ for async jobs, Redis for pub/sub + rate limiting backend

## Key Insights

- BullMQ: Redis-backed, retries with backoff, dead-letter queues, admin dashboard
- Redis dual-use: BullMQ backend + pub/sub event bus + rate limiting store
- Keep SignalMesh as local bus; Redis pub/sub for cross-process events only

## Requirements

### Functional
- BullMQ queues: `backtest`, `strategy-scan`, `webhook-delivery`
- Workers consume jobs, delegate to existing engines (BacktestRunner, etc.)
- Redis pub/sub channels: `signal:{tenantId}`, `trade:{tenantId}`
- Rate limiter upgrade: swap in-memory Map for Redis-backed counter
- Job status API: GET /api/v1/jobs/:jobId → {status, progress, result}

### Non-Functional
- Job timeout: backtest 5min, scan 30s, webhook 10s
- Redis connection pool: max 10 connections
- Retry policy: 3 retries, exponential backoff (1s, 4s, 16s)

## Architecture

```
src/jobs/
├── queue-registry.ts        # Create/export named BullMQ queues
├── workers/
│   ├── backtest-worker.ts   # Consume backtest queue → BacktestRunner
│   ├── scan-worker.ts       # Consume strategy-scan → StrategyAutoDetector
│   └── webhook-worker.ts    # Consume webhook-delivery → WebhookNotifier
├── redis-client.ts          # Shared ioredis connection factory
├── redis-pubsub.ts          # Pub/Sub wrapper (publish + subscribe helpers)
└── redis-rate-limiter.ts    # Redis-backed sliding window rate limiter
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/jobs/redis-client.ts` | ioredis connection factory (URL from env) |
| `src/jobs/queue-registry.ts` | BullMQ Queue instances: backtest, scan, webhook |
| `src/jobs/workers/backtest-worker.ts` | Wrap BacktestRunner as BullMQ Worker |
| `src/jobs/workers/scan-worker.ts` | Wrap StrategyAutoDetector as Worker |
| `src/jobs/workers/webhook-worker.ts` | Wrap WebhookNotifier as Worker |
| `src/jobs/redis-pubsub.ts` | publish(channel, data), subscribe(channel, cb) |
| `src/jobs/redis-rate-limiter.ts` | Redis INCR + EXPIRE sliding window |

## Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add bullmq, ioredis |
| `src/api/routes/backtest-routes.ts` | Replace stub with queue.add() + return jobId |
| `src/auth/rate-limiter.ts` | Add RedisRateLimiter as alternate backend |
| `src/api/server.ts` | Register job status route |

## Implementation Steps

1. Install: `bullmq`, `ioredis`
2. Create `src/jobs/redis-client.ts`:
   - Factory: `createRedisConnection(url?: string): IORedis`
   - Default: `REDIS_URL` env or `redis://localhost:6379`
   - Max retries: 3, lazy connect
3. Create `src/jobs/queue-registry.ts`:
   - Export `backtestQueue`, `scanQueue`, `webhookQueue`
   - Default job options: removeOnComplete 100, removeOnFail 50
4. Create `src/jobs/workers/backtest-worker.ts`:
   - Import BacktestRunner from `src/backtest/`
   - Job data: `{ tenantId, strategyId, pair, timeframe, days }`
   - On complete: store result, publish to `backtest:done:{tenantId}`
5. Create `src/jobs/workers/scan-worker.ts`:
   - Import StrategyAutoDetector
   - Scheduled: every 5min via BullMQ repeatable job
6. Create `src/jobs/workers/webhook-worker.ts`:
   - Import WebhookNotifier
   - Job data: `{ url, payload, hmacSecret }`
   - Retry 3x with exponential backoff
7. Create `src/jobs/redis-pubsub.ts`:
   - `publish(channel: string, data: unknown): Promise<void>`
   - `subscribe(channel: string, cb: (data) => void): void`
8. Create `src/jobs/redis-rate-limiter.ts`:
   - Uses INCR + EXPIRE (atomic via Lua script or MULTI)
   - Same interface as in-memory SlidingWindowLimiter
9. Update `src/api/routes/backtest-routes.ts` to enqueue job
10. Add GET `/api/v1/jobs/:jobId` route for status polling
11. Write tests (mock Redis with ioredis-mock)

## Todo

- [ ] Install bullmq, ioredis
- [ ] Create redis-client.ts connection factory
- [ ] Create queue-registry.ts with 3 queues
- [ ] Create backtest-worker.ts
- [ ] Create scan-worker.ts
- [ ] Create webhook-worker.ts
- [ ] Create redis-pubsub.ts
- [ ] Create redis-rate-limiter.ts
- [ ] Update backtest route to enqueue
- [ ] Add job status endpoint
- [ ] Write 8+ tests

## Tests

- `tests/jobs/queue-registry.test.ts` -- queue creation, add job
- `tests/jobs/workers/backtest-worker.test.ts` -- process job, emit result
- `tests/jobs/redis-pubsub.test.ts` -- publish+subscribe roundtrip
- `tests/jobs/redis-rate-limiter.test.ts` -- limit, exceed, reset

Use `ioredis-mock` for unit tests. Integration tests require running Redis.

## Success Criteria

- [ ] BullMQ queue accepts backtest job, worker processes it
- [ ] Job status endpoint returns progress/result
- [ ] Redis pub/sub delivers messages cross-process
- [ ] Redis rate limiter blocks after threshold
- [ ] Webhook worker retries on failure

## Risk

- **Redis availability:** App must start without Redis (degrade to in-memory queues)
- **ioredis-mock compat:** Ensure mock covers BullMQ usage; may need integration test flag
