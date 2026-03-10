---
title: "Phase 2: FastAPI Middleware"
description: "Fastify middleware for license validation on all /api/* routes"
status: pending
priority: P1
effort: 2h
---

# Phase 2: FastAPI Middleware

## Context Links

- Parent: [./plan.md](./plan.md)
- Previous: [./phase-01-license-validator.md](./phase-01-license-validator.md)
- Related: `../src/api/fastify-raas-server.ts`

## Overview

**Priority:** P1 (core protection)
**Status:** pending
**Effort:** 2h

Add Fastify middleware to validate license on all `/api/*` routes.

## Key Insights

1. **Existing auth:** Current auth uses API key + rate limiter (`tenant-auth-middleware.ts`)
2. **License layer:** License validation is separate from auth - user can have valid API key but expired license
3. **Route exclusion:** Health/metrics/webhook routes should bypass license check

## Requirements

### Functional

- [ ] Protect all routes under `/api/*`
- [ ] Return 403 with `{error: 'license_required'}` on failure
- [ ] Inject license tier into request context
- [ ] Exclude health/metrics/webhook routes

### Non-functional

- [ ] Middleware execution < 10ms (cached validation)
- [ ] No breaking changes to existing routes
- [ ] Compatible with existing auth middleware

## Architecture

```
Request Flow:
┌─────────────────────────────────────────────────────────────┐
│  Fastify Request                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────┐                                        │
│  │ Auth Middleware │ ← API key validation                  │
│  └────────┬────────┘                                        │
│           │ (if auth passes)                                │
│           ▼                                                 │
│  ┌─────────────────┐                                        │
│  │License Middleware│ ← Check license tier                │
│  └────────┬────────┘                                        │
│           │ (if license valid)                              │
│           ▼                                                 │
│  ┌─────────────────┐                                        │
│  │ Route Handler   │                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files

### To Create

- `src/api/middleware/license-middleware.ts` - License validation middleware

### To Modify

- `src/api/fastify-raas-server.ts` - Register middleware

## Implementation Steps

### 1. Create License Middleware

```typescript
// src/api/middleware/license-middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { LicenseService, LicenseTier, LicenseError } from '../../lib/raas-gate';

export interface LicenseMiddlewareOptions {
  requiredTier?: LicenseTier;
  excludeRoutes?: string[];
}

export function createLicenseMiddleware(options: LicenseMiddlewareOptions = {}) {
  const { requiredTier = LicenseTier.FREE, excludeRoutes = [] } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip excluded routes
    if (excludeRoutes.some(route => request.url.startsWith(route))) {
      return;
    }

    const licenseService = LicenseService.getInstance();

    try {
      // Validate license (uses cached result or env var)
      await licenseService.validate();

      // Check if license meets required tier
      if (requiredTier !== LicenseTier.FREE) {
        licenseService.requireTier(requiredTier, request.url);
      }

      // Inject license info into request context
      (request as any).license = {
        tier: licenseService.getTier(),
        features: licenseService.hasFeature,
        valid: true,
      };

    } catch (error) {
      if (error instanceof LicenseError) {
        return reply.code(403).send({
          error: 'license_required',
          message: error.message,
          requiredTier: error.requiredTier,
          currentTier: licenseService.getTier(),
        });
      }

      // Unexpected error
      request.log.error({ error }, 'License validation failed');
      return reply.code(500).send({
        error: 'internal_error',
        message: 'License validation failed',
      });
    }
  };
}

/**
 * Feature-specific decorator for route protection
 * Usage: @RequireFeature('ml_models')
 */
export function RequireFeature(feature: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const licenseService = LicenseService.getInstance();

    if (!licenseService.hasFeature(feature)) {
      return reply.code(403).send({
        error: 'feature_not_enabled',
        message: `Feature "${feature}" requires license upgrade`,
        currentTier: licenseService.getTier(),
      });
    }
  };
}
```

### 2. Register Middleware in Fastify Server

Modify `src/api/fastify-raas-server.ts`:

```typescript
import { createLicenseMiddleware } from './middleware/license-middleware';

export function buildServer(opts: RaasServerOptions = {}): FastifyInstance {
  // ... existing code ...

  // License Middleware (after auth)
  const licenseMiddleware = createLicenseMiddleware({
    excludeRoutes: [
      '/health',
      '/ready',
      '/metrics',
      '/api/v1/billing/webhook',  // Webhooks need to process cancellation
    ],
  });

  // Apply to all /api/* routes
  server.addHook('preHandler', async (request, reply) => {
    if (request.url.startsWith('/api/')) {
      return licenseMiddleware(request, reply);
    }
  });

  // ... rest of code ...
}
```

### 3. Add Tier-Specific Route Protection

Example routes with tier requirements:

```typescript
// src/api/routes/tenant-crud-routes.ts
import { LicenseTier, RequireFeature } from '../middleware/license-middleware';

// FREE tier routes (no additional check needed)
export async function getTenant(request: FastifyRequest, reply: FastifyReply) {
  // Basic tenant info - FREE tier OK
}

// PRO tier routes
export async function getAdvancedAnalytics(request: FastifyRequest, reply: FastifyReply) {
  // Requires PRO license
  const middleware = RequireFeature('advanced_optimization');
  await middleware(request, reply);
  // ... rest of handler
}

// ENTERPRISE tier routes
export async function getCustomStrategies(request: FastifyRequest, reply: FastifyReply) {
  // Requires ENTERPRISE license
  const middleware = RequireFeature('custom_strategies');
  await middleware(request, reply);
  // ... rest of handler
}
```

## Success Criteria

- [ ] All `/api/*` routes protected
- [ ] 403 returned for invalid/missing license
- [ ] Health/metrics/webhook routes excluded
- [ ] License tier injected into request context
- [ ] Integration tests pass

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing routes | High | Exclude list, gradual rollout |
| Performance impact | Medium | Cached validation (<10ms) |
| Webhook failures | High | Exclude webhook routes |

## Security Considerations

- [ ] Middleware runs AFTER auth (user must be authenticated)
- [ ] License errors don't leak sensitive info
- [ ] 403 responses include upgrade path info

## Next Steps

1. → Phase 3: Add KV rate limiting to middleware
2. → Phase 4: Startup validation gate
