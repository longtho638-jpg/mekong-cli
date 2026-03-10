# Phase 5: Analytics Dashboard Implementation Plan

> **Real-time Usage Analytics for AgencyOS Dashboard**

**Status:** In Progress
**Priority:** High
**Created:** 2026-03-09

---

## Overview

Implement real-time usage analytics dashboard consuming metered data from RaaS Gateway (raas.agencyos.network) with mk_ API key authentication.

**Goal:** Display API call volume, active licenses, and quota utilization over time with license key and date range filtering.

---

## Key Insights

- Dashboard UI already exists: `dashboard/src/components/usage-analytics-dashboard.tsx`
- Analytics services implemented: `src/analytics/analytics-service.ts`, `src/analytics/revenue-analytics.ts`
- Usage metering ready: `src/metering/usage-tracker-service.ts` with Cloudflare KV sync
- API routes scaffolded: `src/api/routes/analytics-routes.ts` with `/usage` endpoint

---

## Requirements

### Functional
1. Fetch usage data from RaaS Gateway via authenticated mk_ API key requests
2. Display API call volume over time (line chart)
3. Show active licenses count with tier breakdown
4. Display quota utilization gauges per license
5. Support filtering by license key (dropdown)
6. Support date range selection (7d/30d/90d/All)
7. Auto-refresh every 30 seconds

### Non-Functional
1. All API requests use mk_ API key authentication
2. Data fetched through RaaS Gateway (raas.agencyos.network)
3. Frontend uses existing Vercel stack (React + TypeScript + Tailwind)
4. WebSocket for real-time updates (optional enhancement)

---

## Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│  AgencyOS Dashboard (Vercel Frontend)                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Usage Analytics Dashboard                                   │ │
│  │  - API Call Volume Chart                                     │ │
│  │  - Active Licenses Cards                                     │ │
│  │  - Quota Utilization Gauges                                  │ │
│  │  - License/Date Filters                                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                          │                                        │
│                          │ mk_ API Key Auth                       │
│                          ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  API Client (use-api-client.ts)                             │ │
│  │  - JWT/mk_ token management                                  │ │
│  │  - Request interceptors                                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS /api/v1/analytics/*
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  RaaS Gateway (raas.agencyos.network)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Analytics Routes                                            ││
│  │  GET /api/v1/analytics/usage                                ││
│  │  GET /api/v1/analytics/top-endpoints                        ││
│  │  GET /api/v1/analytics/export                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Analytics Service                                           ││
│  │  - getUsageMetrics(period)                                  ││
│  │  - getTopEndpoints(limit)                                   ││
│  │  - getActiveLicenses()                                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Usage Tracker Service (Cloudflare KV)                      ││
│  │  - Buffered writes (100 events / 30s flush)                 ││
│  │  - Per-license, per-month aggregation                       ││
│  │  - Billable event types: API_CALL, BACKTEST, TRADE, etc.    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

| # | Phase | Status | Files |
|---|-------|--------|-------|
| 1 | API Endpoint Enhancement | Pending | `src/api/routes/analytics-routes.ts` |
| 2 | RaaS Gateway Client | Pending | `src/lib/raas-analytics-client.ts` |
| 3 | Dashboard Hook Update | Pending | `dashboard/src/hooks/use-license-analytics.ts` |
| 4 | Filtering UI Components | Pending | `dashboard/src/components/usage-analytics-dashboard.tsx` |
| 5 | Real-time WebSocket | Pending | `dashboard/src/hooks/use-analytics-websocket.ts` |
| 6 | Testing & Validation | Pending | `tests/analytics/` |

---

## Success Criteria

- [ ] Dashboard loads within 2 seconds
- [ ] Data refreshes every 30 seconds (or via WebSocket push)
- [ ] License filter shows all active licenses
- [ ] Date range selector updates chart data
- [ ] Quota gauges display accurate utilization %
- [ ] API calls authenticated with mk_ key
- [ ] Zero TypeScript errors
- [ ] All tests pass

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| RaaS Gateway rate limits | High | Implement client-side caching |
| WebSocket connection drops | Medium | Fallback to polling |
| Large dataset performance | Medium | Server-side pagination |

---

## Next Steps

1. Read current analytics-routes.ts to understand existing endpoints
2. Create RaaS Gateway client with mk_ API auth
3. Update dashboard hook to fetch real-time data
4. Add filtering controls to UI
5. Test with production data
