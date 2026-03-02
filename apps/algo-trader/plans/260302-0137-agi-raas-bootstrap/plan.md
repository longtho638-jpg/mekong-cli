---
title: "AGI RaaS Platform Bootstrap"
description: "Migrate algo-trader from CLI to production RaaS API with Fastify, auth, jobs, DB, monitoring, billing"
status: pending
priority: P1
effort: 24h
branch: master
tags: [raas, fastify, auth, bullmq, postgres, docker, billing]
created: 2026-03-02
---

# AGI RaaS Platform Bootstrap

## Goal

Upgrade algo-trader from CLI-only to multi-tenant RaaS API platform. Wrap existing modules (never rewrite), add production infrastructure.

## Current State

342+ tests, TypeScript strict, Zod validation. Core modules: TenantStrategyManager, PaperTradingEngine, AlertRulesEngine, StrategyMarketplace, WebSocket server, health probes, webhook notifier, autonomy controller, exchange router, A2UI layer, netdata (TickStore/SignalMesh), arbitrage engine, backtest engine, CLI commands.

## Dependency Graph

```
Phase 1 (Fastify) ──┐
Phase 2 (Auth)   ───┤── Phase 4 (DB) ── Phase 5 (Docker) ── Phase 6 (Billing)
Phase 3 (Redis)  ───┘
```

**Parallel:** Phases 1-3 (no dependencies)
**Sequential:** Phase 4 requires 1-3; Phase 5 requires 4; Phase 6 requires 5

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Fastify API Migration | 4h | pending | [phase-01](./phase-01-fastify-api-migration.md) |
| 2 | Auth & Tenant Isolation | 4h | pending | [phase-02](./phase-02-auth-and-tenant-isolation.md) |
| 3 | Job Queue & Redis | 4h | pending | [phase-03](./phase-03-job-queue-and-redis.md) |
| 4 | Database Schema | 4h | pending | [phase-04](./phase-04-database-schema.md) |
| 5 | Monitoring & Docker | 4h | pending | [phase-05](./phase-05-monitoring-and-docker.md) |
| 6 | Billing Integration | 4h | pending | [phase-06](./phase-06-billing-integration.md) |

## Key Decisions

- **Fastify over Express** -- 30k req/sec, native schema validation, pino logging
- **BullMQ over Temporal** -- simpler, Redis-backed, sufficient for backtest jobs
- **PostgreSQL + TimescaleDB** -- single DB engine, hypertables for ticks
- **Polar.sh for billing** -- per project payment-provider rule
- **Wrap, never rewrite** -- existing core modules stay untouched

## New Directory Structure

```
src/
├── api/           # Fastify server, routes, middleware (NEW)
├── auth/          # JWT, API key management (NEW)
├── jobs/          # BullMQ queues, workers (NEW)
├── db/            # Schema, migrations, queries (NEW)
├── metrics/       # Prometheus collectors (NEW)
├── billing/       # Polar.sh integration (NEW)
├── core/          # Existing (unchanged)
├── execution/     # Existing (unchanged)
├── arbitrage/     # Existing (unchanged)
├── backtest/      # Existing (unchanged)
├── netdata/       # Existing (unchanged)
├── a2ui/          # Existing (unchanged)
└── ...            # Other existing dirs
```

## Success Criteria

- [ ] Fastify serves all existing REST routes + new v1 API
- [ ] JWT + API key auth on all protected endpoints
- [ ] BullMQ processes backtest jobs async
- [ ] PostgreSQL schema with tenant isolation (RLS)
- [ ] Prometheus /metrics endpoint scraped by Grafana
- [ ] Docker Compose boots full stack (api + redis + postgres + grafana)
- [ ] Polar.sh webhook enforces billing tiers
- [ ] All 342+ existing tests still pass
- [ ] New tests cover each phase (target: 50+ new tests)
