---
title: "Phase 4 - Metering Implementation Plan"
description: "Rate limiting, token counting, compute tracking, usage integration, dashboard APIs"
status: pending
priority: P1
effort: 8h
branch: main
tags: [metering, rate-limiting, billing, roi, usage-tracking]
created: 2026-03-07
---

# Phase 4 - Metering Implementation Plan

## Overview

**Mục tiêu:** Hoàn thiện hệ thống metering cho RaaS licensing với 6 components chính:
1. Rate Limiting Middleware (per tier)
2. Token Counting for LLM/API calls
3. Compute Minutes Tracking
4. Usage Tracking Integration
5. Dashboard API Endpoints
6. Tests & Verification

**ROI Impact:**
- Engineering ROI: Usage-based billing enablement
- Operational ROI: Real-time usage dashboard cho users

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Request Flow                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. License Auth Middleware                                      │
│     - Validate API key / Bearer token                           │
│     - Extract license tier from DB                              │
│     - Attach to request context                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Rate Limiting Middleware (NEW)                               │
│     - Check tier limits (requests/minute)                       │
│     - Redis-based sliding window                                │
│     - Return 429 + retry-after if exceeded                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Usage Tracking Middleware                                    │
│     - Track API call (1 unit)                                   │
│     - Track compute time (ML endpoints)                         │
│     - Track tokens (LLM calls via tokenizer)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Route Handler                                                │
│     - /api/backtest/* → compute_minutes                         │
│     - /api/ml/* → compute_minutes + tokens                      │
│     - /api/arb/* → api_call + ml_inference                      │
│     - /api/strategies/* → api_call                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. UsageTrackerService (buffered)                               │
│     - Buffer events (threshold: 100 or 30s)                     │
│     - Flush to:                                                 │
│       • In-memory store (dev)                                   │
│       • UsageEvent table (prod)                                 │
│       • Redis quota counter (real-time)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Dashboard API (NEW)                                          │
│     - GET /api/usage/current                                    │
│     - GET /api/usage/history                                      │
│     - GET /api/usage/cost-estimate                              │
│     - GET /api/usage/export (Stripe/Polar format)               │
└─────────────────────────────────────────────────────────────────┘
```

## Tier Configuration

| Tier | API Calls/min | API Calls/month | Compute Minutes/month | ML Inferences/month |
|------|---------------|-----------------|----------------------|---------------------|
| FREE | 10 | 1,000 | 10 | 50 |
| PRO | 60 | 10,000 | 100 | 500 |
| ENTERPRISE | 300 | 100,000 | 1,000 | 5,000 |

---

## Phase 1: Rate Limiting Middleware

**Files to create:**
- `src/api/middleware/rate-limit-middleware.ts`
- `src/api/middleware/rate-limit-middleware.test.ts`

**Files to modify:**
- `src/api/fastify-raas-server.ts` (register middleware)

**Tasks:**
- [ ] Implement sliding window rate limiter with Redis
- [ ] Add memory fallback for dev/testing
- [ ] Configure per-tier limits
- [ ] Add `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers
- [ ] Return 429 with `Retry-After` header when exceeded
- [ ] Write unit tests for rate limiter
- [ ] Integration tests with Fastify server

**Success criteria:**
- Rate limiter blocks requests exceeding tier limits
- Headers correctly reflect remaining quota
- Tests pass for all 3 tiers

---

## Phase 2: Token Counting for LLM/API Calls

**Files to create:**
- `src/metering/token-counter.ts`
- `src/metering/token-counter.test.ts`

**Files to modify:**
- `src/api/middleware/usage-tracking-middleware.ts` (add token tracking)

**Tasks:**
- [ ] Implement token counter using `tiktoken` or similar
- [ ] Count input tokens (request body)
- [ ] Count output tokens (response body)
- [ ] Track tokens per event type: `llm_input_tokens`, `llm_output_tokens`
- [ ] Add token counting to UsageTrackerService
- [ ] Write tests for token counter accuracy

**Success criteria:**
- Token count matches OpenAI tokenizer within 5%
- Events tracked with correct token counts
- No performance degradation (<10ms overhead per request)

---

## Phase 3: Compute Minutes Tracking

**Files to create:**
- `src/metering/compute-tracker.ts`

**Files to modify:**
- `src/api/middleware/usage-tracking-middleware.ts` (enhance compute tracking)
- `src/api/routes/backtest-job-submission-routes.ts` (add compute tracking)
- `src/api/routes/hyperparameter-optimization-job-routes.ts` (add compute tracking)

**Tasks:**
- [ ] Create `withComputeTracking()` wrapper for async operations
- [ ] Track compute time for backtest endpoints
- [ ] Track compute time for hyperparameter optimization
- [ ] Track compute time for ML inference endpoints
- [ ] Convert ms to minutes (60000ms = 1 unit)
- [ ] Write tests for compute tracker

**Success criteria:**
- Compute time tracked accurately for all ML/backtest endpoints
- Tests verify timing accuracy within 100ms
- No memory leaks from timing operations

---

## Phase 4: Usage Tracking Integration

**Files to modify:**
- `src/core/BotEngine.ts` (track strategy signals, trades)
- `src/arbitrage/AgiArbitrageEngine.ts` (track arbitrage scans, executions)
- `src/backtest/BacktestEngine.ts` (track backtest runs)

**Event types to track:**
```typescript
// API layer
- api_call (1 unit per request)
- llm_input_tokens (per token)
- llm_output_tokens (per token)

// Compute layer
- compute_minute (per minute, backtest/ML)
- ml_inference (per inference call)

// Trading layer
- signal_generated (per trading signal)
- trade_executed (per executed trade)
- arbitrage_scan (per scan cycle)
- arbitrage_execution (per successful arb trade)
- backtest_run (per backtest job)
```

**Tasks:**
- [ ] Add usage tracking calls to BotEngine signal/trade flow
- [ ] Add tracking to ArbitrageEngine scan/execute flow
- [ ] Add tracking to BacktestEngine run method
- [ ] Ensure license key propagated through all layers
- [ ] Write integration tests for tracking

**Success criteria:**
- All trading events tracked with correct units
- License key correctly propagated
- Buffer flushes working in production

---

## Phase 5: Dashboard API Endpoints

**Files to create:**
- `src/api/routes/usage-dashboard-routes.ts`
- `src/api/routes/usage-dashboard-routes.test.ts`

**Files to modify:**
- `src/api/fastify-raas-server.ts` (register routes)

**Endpoints:**
```typescript
// Current usage (this month)
GET /api/usage/current
Response: {
  licenseKey: string,
  period: string, // YYYY-MM
  apiCalls: number,
  computeMinutes: number,
  mlInferences: number,
  llmInputTokens: number,
  llmOutputTokens: number,
  byEventType: Record<string, number>,
  tier: string,
  limits: { apiCalls: number, computeMinutes: number, ... },
  percentUsed: number
}

// Historical usage
GET /api/usage/history?months=3
Response: {
  periods: Array<{ period: string, totalUnits: number, byEventType: ... }>
}

// Cost estimate
GET /api/usage/cost-estimate
Response: {
  period: string,
  estimatedCost: number,
  breakdown: {
    apiCalls: number,
    computeMinutes: number,
    mlInferences: number,
    tokens: number
  }
}

// Export for billing
GET /api/usage/export?provider=stripe|polar&month=2026-03
Response: Stripe/Polar format
```

**Tasks:**
- [ ] Implement `/api/usage/current` endpoint
- [ ] Implement `/api/usage/history` endpoint
- [ ] Implement `/api/usage/cost-estimate` endpoint
- [ ] Implement `/api/usage/export` endpoint
- [ ] Add authentication (license key required)
- [ ] Add rate limiting to dashboard endpoints
- [ ] Write API tests

**Success criteria:**
- All endpoints return correct data
- Cost estimates match pricing config
- Export format compatible with Stripe/Polar

---

## Phase 6: Tests & Verification

**Files to create:**
- `src/api/tests/metering-integration.test.ts`

**Tasks:**
- [ ] Unit tests: Rate limiter (all tiers)
- [ ] Unit tests: Token counter accuracy
- [ ] Unit tests: Compute tracker timing
- [ ] Integration tests: Usage tracking middleware
- [ ] Integration tests: Dashboard API endpoints
- [ ] E2E test: Full flow from request → tracking → dashboard
- [ ] Load test: Verify rate limiting under concurrent requests
- [ ] Performance test: Verify <50ms overhead per request

**Success criteria:**
- 90%+ code coverage for metering module
- All tests pass
- Performance overhead acceptable
- No memory leaks after 1000 requests

---

## Files Summary

### Create (11 files):
1. `src/api/middleware/rate-limit-middleware.ts`
2. `src/api/middleware/rate-limit-middleware.test.ts`
3. `src/metering/token-counter.ts`
4. `src/metering/token-counter.test.ts`
5. `src/metering/compute-tracker.ts`
6. `src/api/routes/usage-dashboard-routes.ts`
7. `src/api/routes/usage-dashboard-routes.test.ts`
8. `src/api/tests/metering-integration.test.ts`

### Modify (8 files):
1. `src/api/fastify-raas-server.ts`
2. `src/api/middleware/usage-tracking-middleware.ts`
3. `src/api/routes/backtest-job-submission-routes.ts`
4. `src/api/routes/hyperparameter-optimization-job-routes.ts`
5. `src/core/BotEngine.ts`
6. `src/arbitrage/AgiArbitrageEngine.ts`
7. `src/backtest/BacktestEngine.ts`
8. `src/metering/index.ts` (add exports)

---

## Dependencies

**npm packages:**
```json
{
  "tiktoken": "^1.0.11",  // Token counting
  "ioredis": "^5.3.2"     // Already installed for Redis
}
```

**Database migrations:**
- `UsageEvent` model already exists in schema
- No new migrations required

---

## Success Criteria (Overall)

1. **Functional:**
   - Rate limiting works per tier
   - Token counting accurate within 5%
   - Compute tracking accurate within 100ms
   - All events tracked correctly
   - Dashboard APIs return correct data

2. **Performance:**
   - <50ms overhead per request
   - No memory leaks after 1000 requests
   - Buffer flushes working correctly

3. **Testing:**
   - 90%+ code coverage
   - All unit/integration/E2E tests pass

4. **Documentation:**
   - API docs updated with usage endpoints
   - README.md updated with metering info

---

## Unresolved Questions

1. **Pricing:** Cần confirm pricing config cho tokens (input vs output có cùng giá không?)
2. **Redis:** Production Redis URL đã có sẵn chưa hay cần thêm config?
3. **Stripe Integration:** Stripe subscription item IDs đã được map với license tiers chưa?

---

## Next Steps

1. Review và approve plan này
2. Spawn `fullstack-developer` agent để implement từng phase
3. Spawn `tester` agent để viết tests
4. Spawn `code-reviewer` agent để review trước khi merge
