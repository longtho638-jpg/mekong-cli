# Phase 4: Usage Metering — Implementation Plan Summary

**Date:** 2026-03-06
**Status:** READY TO IMPLEMENT
**Effort:** 6 hours total

---

## Overview

Plan for implementing usage metering system to track:
1. **API calls per tenant** — count + timestamps
2. **Compute minutes** — ML model inference time
3. **PostgreSQL storage** — time-series optimized queries
4. **Internal API** — `GET /internal/usage/:licenseKey?month=YYYY-MM`
5. **Stripe/Polar format** — billing provider integration ready

---

## Architecture Summary

```
Client Request
     │
     ▼
Fastify Middleware (auto-tracks API calls)
     │
     ▼
UsageTracker (in-memory buffer, batch writes)
     │
     ▼
UsageQueries (Prisma DB operations)
     │
     ▼
PostgreSQL (usage_events table)
     │
     ▼
Internal API → Stripe/Polar Export
```

---

## Files to Create

| File | Purpose | Phase |
|------|---------|-------|
| `src/metering/usage-tracker.ts` | Core buffered tracking service | 4.2 |
| `src/metering/usage-tracker.test.ts` | Unit tests | 4.6 |
| `src/db/queries/usage-queries.ts` | DB CRUD operations | 4.1 |
| `src/api/middleware/usage-tracking-middleware.ts` | Auto-tracking middleware | 4.3 |
| `src/api/routes/internal/usage-routes.ts` | Internal API endpoint | 4.4 |
| `src/billing/usage-billing-adapter.ts` | Stripe/Polar format adapter | 4.5 |
| `src/config/pricing.config.ts` | Usage pricing configuration | 4.5 |

## Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `UsageEvent` model |
| `src/api/fastify-raas-server.ts` | Register usage routes + middleware |
| `src/index.ts` | Export UsageTracker for external use |

---

## Database Schema

```prisma
model UsageEvent {
  id          BigInt   @id @default(autoincrement())
  tenantId    String
  licenseKey  String
  eventType   String   // api_call, compute_ml, strategy_run
  endpoint    String?
  computeMs   Int      @default(0)
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())

  @@index([tenantId, createdAt(sort: Desc)])
  @@index([licenseKey, createdAt(sort: Desc)])
  @@index([eventType, createdAt(sort: Desc)])
  @@map("usage_events")
}
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/internal/usage/:licenseKey` | Get usage by month |
| GET | `/internal/usage/:licenseKey/export` | Export for Stripe |
| GET | `/internal/usage/:licenseKey/compute` | Get compute minutes only |

**Security:** Requires `X-Internal-API-Key` header

---

## Stripe Billing Format

```typescript
interface StripeUsageRecord {
  subscription_item: string;  // From subscription
  quantity: number;           // API calls or compute minutes
  timestamp: number;          // Unix timestamp
  action: 'increment' | 'set';
}
```

---

## Implementation Phases

| Phase | Description | Effort | Status |
|-------|-------------|--------|--------|
| 4.1 | Database Schema + Usage Queries | 1h | Pending |
| 4.2 | UsageTracker Core Service | 2h | Pending |
| 4.3 | Fastify Middleware | 1h | Pending |
| 4.4 | Internal API Endpoint | 1h | Pending |
| 4.5 | Billing Adapter | 1h | Pending |
| 4.6 | Tests | 1h | Pending |

---

## Success Criteria

- [ ] UsageEvent table created with indexes
- [ ] API calls auto-tracked via middleware
- [ ] Compute minutes tracked for ML endpoints
- [ ] Internal endpoint returns usage by month
- [ ] Export format matches Stripe/Polar
- [ ] All tests passing (unit + integration)
- [ ] 0 TypeScript errors, 0 `any` types

---

## Unresolved Questions

1. **Compute minutes granularity** — Track per-request or aggregate per-minute?
   - **Recommendation:** Per-request (more accurate for billing reconciliation)

2. **Buffer flush threshold** — 30s/100 events optimal?
   - **Recommendation:** Start with defaults, tune based on load testing

3. **Internal endpoint auth** — Use existing API key or separate internal token?
   - **Recommendation:** Separate `INTERNAL_API_KEY` env var for isolation

4. **Polar vs Stripe priority** — Which format to prioritize?
   - **Recommendation:** Stripe first (more mature metered billing API)

---

## Next Steps

1. Review and approve plan
2. Implement Phase 4.1 (Database Schema)
3. Implement Phase 4.2 (UsageTracker)
4. Implement Phase 4.3 (Middleware)
5. Implement Phase 4.4 (Internal API)
6. Implement Phase 4.5 (Billing Adapter)
7. Implement Phase 4.6 (Tests)
8. Run full test suite + verify production ready

---

**Plan Location:** `/Users/macbookprom1/mekong-cli/apps/algo-trader/plans/260306-2055-usage-metering/`
