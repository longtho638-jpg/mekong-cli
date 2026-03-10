---
title: "Phase 4.3: Usage Tracking Middleware"
description: "Fastify middleware for auto-tracking API calls"
status: completed
priority: P0
effort: 1h
parent: plan.md
---

# Phase 4.3: Usage Tracking Middleware

## Overview

Fastify middleware that automatically tracks:
- All API calls per tenant/license
- Compute time for ML endpoints
- Request metadata for audit trail

## Implementation

**File:** `src/api/middleware/usage-tracking-middleware.ts`

**Features implemented:**
- Fastify onRequest + onSend hooks
- Track API calls: licenseKey, path, method, duration, statusCode
- Track compute minutes for ML endpoints
- Uses `UsageTrackerService.track()` method
- Skips internal/health endpoints (`/health`, `/ready`, `/metrics`, `/internal`)
- Exported `usageTrackingPlugin` for easy registration
- Exported `withComputeTracking` helper for manual compute timing

**Integration:**
- Registered in `src/api/fastify-raas-server.ts` via `void server.register(usageTrackingPlugin);`

**Tests:**
- Type check: PASS
- Server startup tests: PASS (5/5)
- Health routes tests: PASS (3/3)
