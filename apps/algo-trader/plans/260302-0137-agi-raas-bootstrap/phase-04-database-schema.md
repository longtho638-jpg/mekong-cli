---
phase: 4
title: "Database Schema"
status: pending
effort: 4h
parallel: false
depends_on: [1, 2, 3]
---

# Phase 4: Database Schema

## Context

- Current: Tenant state stored in JSON files (persistent-tenant-state-store.ts)
- Current: No persistent trade history, backtest results, or API key storage
- Goal: PostgreSQL schema with migrations, RLS, TimescaleDB hypertables

## Key Insights

- TimescaleDB extends PostgreSQL; single DB engine, hypertables for time-series
- RLS (Row Level Security) enforces tenant isolation at DB level
- Keep JSON file store as fallback for local/dev mode
- Use raw SQL migrations (no ORM); pg driver for queries

## Requirements

### Functional
- Tables: tenants, api_keys, strategies, trades, backtest_results, candles
- RLS policies: all tenant-scoped tables filtered by tenant_id
- Hypertable: candles table compressed + downsampled
- Migration runner: sequential SQL files in `src/db/migrations/`
- Query layer: typed functions returning TS interfaces

### Non-Functional
- Connection pool: 5-20 connections (pg Pool)
- Query timeout: 5s default
- Migration idempotent (IF NOT EXISTS patterns)

## Architecture

```
src/db/
├── pool.ts                    # pg Pool factory (DATABASE_URL env)
├── migrate.ts                 # Run migrations sequentially
├── migrations/
│   ├── 001-create-tenants.sql
│   ├── 002-create-api-keys.sql
│   ├── 003-create-strategies.sql
│   ├── 004-create-trades.sql
│   ├── 005-create-backtest-results.sql
│   ├── 006-create-candles-hypertable.sql
│   └── 007-enable-rls.sql
└── queries/
    ├── tenant-queries.ts      # CRUD for tenants table
    ├── api-key-queries.ts     # Insert/lookup hashed keys
    ├── trade-queries.ts       # Insert/query trades
    └── backtest-queries.ts    # Store/retrieve backtest results
```

## Schema

### tenants

```sql
CREATE TABLE IF NOT EXISTS tenants (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  tier        TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','pro','enterprise')),
  max_strategies     INT NOT NULL DEFAULT 1,
  max_daily_loss_usd NUMERIC(12,2) NOT NULL DEFAULT 100,
  max_position_usd   NUMERIC(12,2) NOT NULL DEFAULT 1000,
  allowed_exchanges  TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### api_keys

```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id),
  key_hash    TEXT NOT NULL UNIQUE,
  key_prefix  TEXT NOT NULL,          -- first 8 chars for identification
  scopes      TEXT[] NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  last_used   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### strategies

```sql
CREATE TABLE IF NOT EXISTS strategies (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  config      JSONB NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'paused' CHECK (status IN ('active','paused','stopped')),
  pnl         NUMERIC(12,2) NOT NULL DEFAULT 0,
  trades      INT NOT NULL DEFAULT 0,
  started_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### trades

```sql
CREATE TABLE IF NOT EXISTS trades (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id),
  strategy_id TEXT NOT NULL,
  pair        TEXT NOT NULL,
  side        TEXT NOT NULL CHECK (side IN ('buy','sell')),
  price       NUMERIC(18,8) NOT NULL,
  amount      NUMERIC(18,8) NOT NULL,
  fee         NUMERIC(12,8) DEFAULT 0,
  pnl         NUMERIC(12,2),
  exchange    TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_trades_tenant ON trades(tenant_id, executed_at DESC);
```

### backtest_results

```sql
CREATE TABLE IF NOT EXISTS backtest_results (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id),
  strategy_id TEXT NOT NULL,
  pair        TEXT NOT NULL,
  timeframe   TEXT NOT NULL,
  days        INT NOT NULL,
  result      JSONB NOT NULL,          -- full result payload
  sharpe      NUMERIC(6,3),
  max_dd      NUMERIC(6,3),
  total_return NUMERIC(8,3),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### candles (TimescaleDB hypertable)

```sql
CREATE TABLE IF NOT EXISTS candles (
  time    TIMESTAMPTZ NOT NULL,
  pair    TEXT NOT NULL,
  exchange TEXT NOT NULL,
  open    NUMERIC(18,8) NOT NULL,
  high    NUMERIC(18,8) NOT NULL,
  low     NUMERIC(18,8) NOT NULL,
  close   NUMERIC(18,8) NOT NULL,
  volume  NUMERIC(18,8) NOT NULL
);
SELECT create_hypertable('candles', 'time', if_not_exists => TRUE);
CREATE INDEX idx_candles_pair ON candles(pair, exchange, time DESC);
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/db/pool.ts` | pg Pool factory from DATABASE_URL |
| `src/db/migrate.ts` | Read + run SQL files in order |
| `src/db/migrations/001-create-tenants.sql` | Tenants table |
| `src/db/migrations/002-create-api-keys.sql` | API keys table |
| `src/db/migrations/003-create-strategies.sql` | Strategies table |
| `src/db/migrations/004-create-trades.sql` | Trades table + index |
| `src/db/migrations/005-create-backtest-results.sql` | Backtest results |
| `src/db/migrations/006-create-candles-hypertable.sql` | Candles + hypertable |
| `src/db/migrations/007-enable-rls.sql` | RLS policies all tables |
| `src/db/queries/tenant-queries.ts` | CRUD for tenants |
| `src/db/queries/api-key-queries.ts` | Insert/lookup keys |
| `src/db/queries/trade-queries.ts` | Insert/query trades |
| `src/db/queries/backtest-queries.ts` | Store/retrieve results |

## Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add pg, @types/pg |
| `src/api/server.ts` | Run migrations on startup (optional flag) |
| `src/auth/api-key-service.ts` | Use api-key-queries for persistence |
| `src/index.ts` | Add `db:migrate` CLI command |

## Implementation Steps

1. Install: `pg`, `@types/pg`
2. Create `src/db/pool.ts` -- `getPool(): Pool` singleton from DATABASE_URL
3. Create migration SQL files (001-007)
4. Create `src/db/migrate.ts` -- reads migrations dir, runs in order, tracks applied
5. Create query files -- parameterized queries, return typed interfaces
6. Wire api-key-service to use DB when available (fallback to in-memory)
7. Add `db:migrate` CLI command
8. Write tests

## Todo

- [ ] Install pg
- [ ] Create pool.ts connection factory
- [ ] Write 7 migration SQL files
- [ ] Create migrate.ts runner
- [ ] Create tenant-queries.ts
- [ ] Create api-key-queries.ts
- [ ] Create trade-queries.ts
- [ ] Create backtest-queries.ts
- [ ] Add db:migrate CLI command
- [ ] Write 8+ tests

## Tests

- `tests/db/migrate.test.ts` -- migration ordering, idempotent re-run
- `tests/db/queries/tenant-queries.test.ts` -- CRUD operations
- `tests/db/queries/api-key-queries.test.ts` -- hash lookup
- `tests/db/queries/trade-queries.test.ts` -- insert, query by tenant

Use test PostgreSQL (docker or pg_tmp) for integration tests.

## Success Criteria

- [ ] All 7 migrations run without error on clean PostgreSQL
- [ ] RLS policies block cross-tenant reads
- [ ] Candles table creates as hypertable
- [ ] Query functions return typed TS results
- [ ] Existing 342+ tests unaffected (DB optional)

## Risk

- **TimescaleDB extension:** Must be installed in PostgreSQL; Docker image includes it
- **No ORM:** Raw SQL means manual type mapping; keep queries simple + tested
- **Migration state:** Simple tracker (applied_migrations table); no Prisma/Knex overhead
