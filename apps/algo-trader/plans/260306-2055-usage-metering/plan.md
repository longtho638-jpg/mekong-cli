---
title: "Phase 4: Usage Metering — API Calls & Compute Minutes Tracking"
description: "Track per-tenant API usage and ML compute time for Stripe billing integration"
status: pending
priority: P2
effort: 6h
branch: master
tags: [metering, usage, billing, roiaas]
created: 2026-03-06
---

# Phase 4: Usage Metering Plan

## Context

**Existing Infrastructure:**
- ✅ `src/lib/usage-quota.ts` — Redis-based quota tracking (FREE/PRO/ENTERPRISE tiers)
- ✅ `src/lib/raas-gate.ts` — LicenseService with tenant isolation
- ✅ `prisma/schema.prisma` — License, LicenseAuditLog models
- ✅ `src/billing/polar-subscription-service.ts` — Polar subscription management
- ✅ Fastify API server with tenant auth middleware

**Gaps:**
- ❌ No per-API-call tracking with timestamps
- ❌ No compute minutes (ML inference time) tracking
- ❌ No time-series storage for usage events
- ❌ No internal usage endpoint for billing sync
- ❌ No Stripe/Polar metered billing format

## Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | Track API calls per tenant (count + timestamps) | P0 |
| R2 | Track compute minutes (ML model inference time) | P0 |
| R3 | Store in PostgreSQL (time-series optimized) | P1 |
| R4 | Secure internal endpoint: `GET /internal/usage/:licenseKey?month=YYYY-MM` | P0 |
| R5 | Export format compatible with Stripe Billing | P1 |
| R6 | Middleware for auto-tracking API calls | P0 |
| R7 | Unit + integration tests | P1 |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Request                               │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  Fastify Middleware (usage-tracking-middleware.ts)              │
│  - Extract tenantId from JWT/API key                            │
│  - Record API call event (async, non-blocking)                  │
│  - Start compute timer for ML endpoints                         │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  UsageTracker (src/metering/usage-tracker.ts)                   │
│  - Buffer events in-memory (batch writes)                       │
│  - Track compute time per request                               │
│  - Flush to DB every N seconds or M events                      │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  UsageQueries (src/db/queries/usage-queries.ts)                 │
│  - Insert usage events                                          │
│  - Aggregate by period (hour/day/month)                         │
│  - Export for Stripe/Polar                                      │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  PostgreSQL (usage_events table)                                │
│  - tenant_id, event_type, timestamp, compute_ms                 │
│  - Indexed by (tenant_id, timestamp)                            │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

```prisma
model UsageEvent {
  id          BigInt   @id @default(autoincrement())
  tenantId    String
  licenseKey  String
  eventType   String   // api_call, compute_ml, strategy_run, etc.
  endpoint    String?  // API path
  computeMs   Int      @default(0)  // Compute time in milliseconds
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())

  @@index([tenantId, createdAt(sort: Desc)])
  @@index([licenseKey, createdAt(sort: Desc)])
  @@index([eventType, createdAt(sort: Desc)])
  @@map("usage_events")
}
```

---

## Implementation Phases

### Phase 1: Database Schema + Prisma Migration (1h)

**Files:**
- `prisma/schema.prisma` — Add UsageEvent model
- `src/db/queries/usage-queries.ts` — NEW: DB operations

**Tasks:**
- [ ] Add UsageEvent model to schema
- [ ] Run `npx prisma migrate dev --name add_usage_events`
- [ ] Create `usage-queries.ts` with functions:
  - `recordUsageEvent()` — Insert single event
  - `batchRecordUsageEvents()` — Bulk insert
  - `getUsageByPeriod()` — Query by tenant + month
  - `getComputeMinutesByPeriod()` — Aggregate compute time
  - `exportForStripeBilling()` — Format for Stripe

### Phase 2: UsageTracker Core Service (2h)

**Files:**
- `src/metering/usage-tracker.ts` — NEW: Core tracking service

**Features:**
- Singleton service with in-memory buffer
- Auto-flush every 30s or 100 events
- Compute time tracking (start/stop timer)
- Fallback to memory if DB unavailable

**Interface:**
```typescript
interface UsageTracker {
  init(): Promise<void>;
  recordApiCall(tenantId: string, endpoint: string): void;
  startComputeTimer(): () => number; // Returns stop function
  recordComputeTime(tenantId: string, ms: number, model?: string): void;
  flush(): Promise<void>;
  getUsage(tenantId: string, month: string): Promise<UsageSummary>;
  close(): Promise<void>;
}
```

### Phase 3: Fastify Middleware (1h)

**Files:**
- `src/api/middleware/usage-tracking-middleware.ts` — NEW

**Tasks:**
- [ ] Create middleware factory
- [ ] Extract tenantId from request context
- [ ] Auto-record API calls
- [ ] Wrap ML endpoints with compute timer
- [ ] Register in Fastify route plugins

### Phase 4: Internal Usage API Endpoint (1h)

**Files:**
- `src/api/routes/internal/usage-routes.ts` — NEW

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/internal/usage/:licenseKey` | Get current month usage |
| GET | `/internal/usage/:licenseKey?month=YYYY-MM` | Get historical usage |
| GET | `/internal/usage/:licenseKey/export?month=YYYY-MM` | Export for Stripe |

**Security:**
- Internal routes only (bind to localhost or require internal API key)
- Rate limited

### Phase 5: Stripe/Polar Integration Format (1h)

**Files:**
- `src/billing/usage-billing-adapter.ts` — NEW

**Tasks:**
- [ ] Map UsageEvent → Stripe Metered Billing format
- [ ] Support both Stripe + Polar subscription models
- [ ] Add cron job to sync usage daily (optional)

### Phase 6: Tests (1h)

**Files:**
- `src/metering/usage-tracker.test.ts`
- `tests/integration/usage-tracking-integration.test.ts`
- `tests/billing/usage-billing-adapter.test.ts`

**Test Coverage:**
- Unit: UsageTracker buffer + flush logic
- Integration: API calls → DB → Export format
- E2E: Full billing flow simulation

---

## Files to Create

```
src/
├── metering/
│   ├── usage-tracker.ts          # Core tracking service
│   └── usage-tracker.test.ts     # Unit tests
├── db/queries/
│   └── usage-queries.ts          # DB operations (NEW)
├── api/
│   ├── middleware/
│   │   └── usage-tracking-middleware.ts  # Auto-tracking middleware
│   └── routes/internal/
│       └── usage-routes.ts       # Internal API endpoint
├── billing/
│   └── usage-billing-adapter.ts  # Stripe/Polar format adapter
prisma/
└── migrations/
    └── YYYYMMDDHHMMSS_add_usage_events/
        └── migration.sql
```

## Files to Modify

- `prisma/schema.prisma` — Add UsageEvent model
- `src/api/fastify-raas-server.ts` — Register new routes + middleware
- `src/index.ts` — Export UsageTracker for external use

---

## Success Criteria

- [ ] UsageEvent table created with proper indexes
- [ ] API calls tracked automatically via middleware
- [ ] Compute minutes tracked for ML endpoints
- [ ] Internal endpoint returns usage by month
- [ ] Export format matches Stripe/Polar requirements
- [ ] All tests passing (unit + integration)
- [ ] 0 TypeScript errors, 0 `any` types

---

## Stripe Billing Integration Format

**Stripe Metered Billing API expects:**
```json
{
  "subscription_item": "si_xxx",
  "quantity": 1000,
  "timestamp": 1709769600,
  "price": "price_xxx"
}
```

**Our export format:**
```typescript
interface StripeUsageRecord {
  subscription_item: string;  // From tenant subscription
  quantity: number;           // API calls or compute minutes
  timestamp: number;          // Unix timestamp
  action: 'increment' | 'set'; // Default: increment
}
```

---

## Unresolved Questions

1. **Compute minutes granularity** — Track per-request or aggregate per-minute?
2. **Buffer flush threshold** — 30s/100 events optimal or need tuning?
3. **Internal endpoint auth** — Use existing API key or separate internal token?
4. **Polar vs Stripe** — Which billing provider to prioritize for format?
