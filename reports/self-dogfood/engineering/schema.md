# RaaS DB Schema Design
Generated: 2026-03-11

## Overview

Mekong CLI v5.0 uses SQLite (`/data/tenants.db` on Fly.io) for multi-tenant state.
This document defines the canonical schema for: users, credits, missions, invoices, webhooks.

---

## Tables

### `tenants`
Primary identity unit — one per API key holder.

```sql
CREATE TABLE tenants (
    id            TEXT PRIMARY KEY,           -- UUID
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    tier          TEXT NOT NULL DEFAULT 'starter', -- starter|growth|premium|enterprise
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    is_active     INTEGER NOT NULL DEFAULT 1,
    metadata      TEXT                        -- JSON blob for extra fields
);
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_tier ON tenants(tier);
```

### `api_keys`
Bearer tokens issued to tenants (mk_ prefix).

```sql
CREATE TABLE api_keys (
    id            TEXT PRIMARY KEY,           -- UUID
    tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key_hash      TEXT UNIQUE NOT NULL,       -- SHA-256 of actual key
    prefix        TEXT NOT NULL,              -- first 8 chars for lookup (mk_xxxxx)
    label         TEXT,                       -- human-readable name
    last_used_at  TEXT,
    expires_at    TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    is_active     INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(prefix);
```

### `credits`
Credit balance ledger per tenant (append-only for audit).

```sql
CREATE TABLE credits (
    id            TEXT PRIMARY KEY,           -- UUID
    tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount        REAL NOT NULL,              -- positive=credit, negative=debit
    balance_after REAL NOT NULL,              -- running balance snapshot
    reason        TEXT NOT NULL,              -- 'purchase'|'mission'|'refund'|'expiry'
    reference_id  TEXT,                       -- mission_id or invoice_id
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    metadata      TEXT                        -- JSON: MCU breakdown, etc.
);
CREATE INDEX idx_credits_tenant ON credits(tenant_id);
CREATE INDEX idx_credits_created ON credits(created_at);
```

### `missions` (= tasks in API)
Each submitted goal execution.

```sql
CREATE TABLE missions (
    id            TEXT PRIMARY KEY,           -- UUID (= task_id in API)
    tenant_id     TEXT NOT NULL REFERENCES tenants(id),
    goal          TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending',
                                              -- pending|running|success|failed|partial|rolled_back
    total_steps   INTEGER NOT NULL DEFAULT 0,
    completed_steps INTEGER NOT NULL DEFAULT 0,
    failed_steps  INTEGER NOT NULL DEFAULT 0,
    success_rate  REAL NOT NULL DEFAULT 0.0,
    mcu_cost      REAL NOT NULL DEFAULT 0.0,  -- MCU units charged
    errors        TEXT,                       -- JSON array
    warnings      TEXT,                       -- JSON array
    steps         TEXT,                       -- JSON array of StepDetail
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at  TEXT
);
CREATE INDEX idx_missions_tenant ON missions(tenant_id);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_created ON missions(created_at);
```

### `invoices`
Polar.sh payment records.

```sql
CREATE TABLE invoices (
    id            TEXT PRIMARY KEY,           -- UUID
    tenant_id     TEXT NOT NULL REFERENCES tenants(id),
    polar_order_id TEXT UNIQUE,               -- from Polar webhook
    amount_usd    REAL NOT NULL,
    credits_added REAL NOT NULL,
    tier          TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending', -- pending|paid|refunded|failed
    polar_payload TEXT,                       -- raw webhook JSON
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    paid_at       TEXT
);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_polar ON invoices(polar_order_id);
```

### `webhooks`
Incoming webhook event log (idempotency + audit).

```sql
CREATE TABLE webhooks (
    id            TEXT PRIMARY KEY,           -- UUID
    source        TEXT NOT NULL,              -- 'polar'|'stripe'|'github'
    event_type    TEXT NOT NULL,              -- e.g. 'order.paid'
    payload_hash  TEXT NOT NULL,              -- SHA-256 for dedup
    payload       TEXT NOT NULL,              -- raw JSON body
    processed     INTEGER NOT NULL DEFAULT 0,
    error         TEXT,                       -- if processing failed
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    processed_at  TEXT
);
CREATE UNIQUE INDEX idx_webhooks_dedup ON webhooks(source, payload_hash);
CREATE INDEX idx_webhooks_source ON webhooks(source);
```

---

## MCU Pricing Model

| Tier | MCU/month | USD/mo | Credits per MCU |
|------|-----------|--------|-----------------|
| Starter | 200 | $49 | 1 |
| Growth | 1,000 | $149 | 1 |
| Premium | unlimited | $499 | 1 |

1 MCU = 1 mission step execution unit (roughly 1 LLM call + tool use).

---

## Migration Files

Located in `src/db/migrations/`:
- `001_create_tenants.sql`
- `002_create_credits.sql`
- `003_create_missions.sql`
- `004_create_invoices.sql`
- `005_create_tier_configs.sql` (exists — tier rate limiting)
- `006_create_webhooks.sql` (proposed)
- `007_create_api_keys.sql` (proposed)
