---
phase: 1
title: "Fastify API Migration"
status: completed
effort: 4h
parallel: true
depends_on: []
---

# Phase 1: Fastify API Migration

## Context

- Current: `src/core/raas-api-router.ts` uses plain Node `http` module with manual routing
- Current: `src/core/http-health-check-server.ts` uses plain Node `http` on port 3000
- Goal: Migrate to Fastify for schema validation, plugin system, pino logging

## Key Insights

- Fastify: 30k req/sec (2x Express), native JSON serialization, TypeScript-first
- Keep existing Zod schemas -- Fastify supports `@fastify/type-provider-zod`
- Existing WebSocket server (`ws`) stays separate (port 3001)

## Requirements

### Functional
- Fastify server on port 3000 replacing both http servers
- All existing routes from `raas-api-router.ts` registered as Fastify routes
- Health/readiness probes migrated from `http-health-check-server.ts`
- CORS configured for dev/prod origins
- Request logging via pino (built-in)

### Non-Functional
- Startup < 500ms; route latency < 10ms overhead vs current
- Graceful shutdown (drain connections on SIGTERM)

## Architecture

```
src/api/
├── server.ts                    # Fastify instance + plugin registration
├── routes/
│   ├── tenant-routes.ts         # /api/v1/tenants/* (wrap TenantStrategyManager)
│   ├── strategy-routes.ts       # /api/v1/strategies/* (wrap StrategyMarketplace)
│   ├── backtest-routes.ts       # /api/v1/backtest/* (async job submission)
│   ├── health-routes.ts         # /health, /ready (replace http-health-check-server)
│   └── alert-routes.ts          # /api/v1/alerts/* (wrap AlertRulesEngine)
├── plugins/
│   ├── cors-plugin.ts           # @fastify/cors config
│   └── error-handler-plugin.ts  # Centralized error → JSON response
└── schemas/
    └── shared-schemas.ts        # Re-export existing Zod schemas for Fastify
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/api/server.ts` | Fastify instance, plugin registration, start/stop |
| `src/api/routes/tenant-routes.ts` | Wrap TenantStrategyManager CRUD |
| `src/api/routes/strategy-routes.ts` | Wrap StrategyMarketplace endpoints |
| `src/api/routes/backtest-routes.ts` | POST /backtest (stub for Phase 3 BullMQ) |
| `src/api/routes/health-routes.ts` | GET /health, GET /ready |
| `src/api/routes/alert-routes.ts` | Wrap AlertRulesEngine CRUD |
| `src/api/plugins/cors-plugin.ts` | CORS configuration |
| `src/api/plugins/error-handler-plugin.ts` | Error serialization |
| `src/api/schemas/shared-schemas.ts` | Re-export Zod schemas |

## Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add fastify, @fastify/cors, @fastify/type-provider-zod |
| `src/index.ts` | Add `api:serve` command to start Fastify server |

## Files NOT Modified (Preserved)

- `src/core/raas-api-router.ts` -- kept as fallback, deprecated
- `src/core/http-health-check-server.ts` -- kept as fallback, deprecated
- `src/core/websocket-server.ts` -- unchanged, runs on separate port

## Implementation Steps

1. Install dependencies: `fastify`, `@fastify/cors`, `@fastify/type-provider-zod`
2. Create `src/api/server.ts` -- Fastify instance with pino logger
3. Create `src/api/plugins/error-handler-plugin.ts` -- map Zod errors to 400
4. Create `src/api/plugins/cors-plugin.ts` -- allow configurable origins
5. Create `src/api/routes/health-routes.ts` -- port from http-health-check-server
6. Create `src/api/routes/tenant-routes.ts` -- delegate to TenantStrategyManager
7. Create `src/api/routes/strategy-routes.ts` -- delegate to StrategyMarketplace
8. Create `src/api/routes/alert-routes.ts` -- delegate to AlertRulesEngine
9. Create `src/api/routes/backtest-routes.ts` -- stub (returns 202 Accepted)
10. Create `src/api/schemas/shared-schemas.ts` -- re-export existing Zod schemas
11. Add `api:serve` CLI command in `src/index.ts`
12. Write tests for each route file

## Todo

- [x] Install fastify + plugins (fastify@5.7.4, @fastify/cors@10.1.0, fastify-plugin@5.0.0)
- [x] Create server.ts with plugin registration (src/api/fastify-raas-server.ts)
- [x] Port health/readiness routes (src/api/routes/health-routes.ts)
- [x] Port tenant CRUD routes (src/api/routes/tenant-crud-routes.ts)
- [x] Port strategy marketplace routes (src/api/routes/strategy-marketplace-routes.ts)
- [x] Port alert rules routes (src/api/routes/alert-rules-routes.ts)
- [x] Stub backtest route (src/api/routes/backtest-job-submission-routes.ts)
- [x] Error handler plugin (src/api/plugins/error-handler-plugin.ts)
- [x] CORS plugin (src/api/plugins/cors-plugin.ts)
- [x] Add api:serve CLI command (src/index.ts)
- [x] Write 10+ route tests (28 tests across 5 test files)

## Tests

- `tests/api/server.test.ts` -- startup, shutdown, plugin loading
- `tests/api/routes/tenant-routes.test.ts` -- CRUD, validation errors
- `tests/api/routes/health-routes.test.ts` -- /health 200, /ready 503→200
- `tests/api/routes/strategy-routes.test.ts` -- marketplace search, rate
- `tests/api/routes/alert-routes.test.ts` -- create, evaluate, cooldown

## Success Criteria

- [ ] `npm run test` passes all existing 342+ tests
- [ ] Fastify serves all routes from raas-api-router on same paths
- [ ] /health returns {status: "ok", uptime, version}
- [ ] /ready returns 503 until setReady(true)
- [ ] 10+ new tests for API layer

## Risk

- **Port conflict:** Both old http server and Fastify on 3000 -- mark old as deprecated, conditionally skip
- **Zod compat:** `@fastify/type-provider-zod` requires Zod v3.x; current is 4.3.6 -- verify compat or use manual validation
