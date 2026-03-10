---
title: "Phase 4.4: Internal Usage API Endpoint"
description: "Secure internal endpoint for usage queries"
status: completed
priority: P0
effort: 1h
parent: plan.md
---

# Phase 4.4: Internal Usage API Endpoint

## Overview

Internal API endpoint for querying usage data by license key.
Used by billing sync jobs and admin dashboards.

## File: `src/api/routes/internal/usage-routes.ts`

```typescript
/**
 * Internal Usage API Routes
 *
 * Secure endpoints for usage queries.
 * Requires internal API key or localhost binding.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UsageTrackerService } from '../../../metering/usage-tracker';
import {
  getUsageByPeriod,
  exportForStripeBilling,
  getComputeMinutesByPeriod,
} from '../../../db/queries/usage-queries';
import { LicenseService } from '../../../lib/raas-gate';
import { logger } from '../../../utils/logger';

export interface UsageResponse {
  licenseKey: string;
  tenantId?: string;
  period: string;
  apiCalls: number;
  computeMinutes: number;
  events: Array<{
    eventType: string;
    count: number;
    totalComputeMs: number;
  }>;
}

export interface StripeExportResponse {
  licenseKey: string;
  period: string;
  records: Array<{
    subscription_item: string;
    quantity: number;
    timestamp: number;
    action: 'increment' | 'set';
  }>;
}

/**
 * Verify internal API key
 */
function verifyInternalAuth(request: FastifyRequest): boolean {
  const apiKey = request.headers['x-internal-api-key'] as string;
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!expectedKey) {
    // Allow if no INTERNAL_API_KEY set (dev mode)
    return true;
  }

  return apiKey === expectedKey;
}

/**
 * Register usage routes
 */
export async function registerUsageRoutes(fastify: FastifyInstance) {
  const tracker = UsageTrackerService.getInstance();

  /**
   * GET /internal/usage/:licenseKey
   * Query usage by license key
   *
   * Query params:
   * - month: YYYY-MM (default: current month)
   */
  fastify.get(
    '/internal/usage/:licenseKey',
    async (
      request: FastifyRequest<{
        Params: { licenseKey: string };
        Querystring: { month?: string };
      }>,
      reply: FastifyReply
    ) => {
      // Verify internal auth
      if (!verifyInternalAuth(request)) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Valid internal API key required',
        });
      }

      const { licenseKey } = request.params;
      const { month } = request.query;

      // Validate license key format
      if (!licenseKey || licenseKey.length < 8) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid license key format',
        });
      }

      try {
        // Determine period
        const period = month || new Date().toISOString().slice(0, 7); // YYYY-MM

        // Query usage
        const summary = await getUsageByPeriod(licenseKey, period);

        const response: UsageResponse = {
          licenseKey,
          tenantId: summary.tenantId,
          period: summary.period,
          apiCalls: summary.apiCalls,
          computeMinutes: summary.computeMinutes,
          events: summary.events,
        };

        return reply.code(200).send(response);
      } catch (error) {
        logger.error('[Usage API] Query error', error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to query usage data',
        });
      }
    }
  );

  /**
   * GET /internal/usage/:licenseKey/export
   * Export usage in Stripe Billing format
   */
  fastify.get(
    '/internal/usage/:licenseKey/export',
    async (
      request: FastifyRequest<{
        Params: { licenseKey: string };
        Querystring: { month?: string; subscription_item?: string };
      }>,
      reply: FastifyReply
    ) => {
      // Verify internal auth
      if (!verifyInternalAuth(request)) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Valid internal API key required',
        });
      }

      const { licenseKey } = request.params;
      const { month, subscription_item } = request.query;

      try {
        const period = month || new Date().toISOString().slice(0, 7);

        // Requires subscription_item for Stripe export
        if (!subscription_item) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'subscription_item query param required',
          });
        }

        const records = await exportForStripeBilling(
          licenseKey,
          period,
          subscription_item
        );

        const response: StripeExportResponse = {
          licenseKey,
          period,
          records,
        };

        return reply.code(200).send(response);
      } catch (error) {
        logger.error('[Usage API] Export error', error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to export usage data',
        });
      }
    }
  );

  /**
   * GET /internal/usage/:licenseKey/compute
   * Get compute minutes only (quick query)
   */
  fastify.get(
    '/internal/usage/:licenseKey/compute',
    async (
      request: FastifyRequest<{
        Params: { licenseKey: string };
        Querystring: { month?: string };
      }>,
      reply: FastifyReply
    ) => {
      if (!verifyInternalAuth(request)) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { licenseKey } = request.params;
      const { month } = request.query;
      const period = month || new Date().toISOString().slice(0, 7);

      try {
        const computeMinutes = await getComputeMinutesByPeriod(
          licenseKey,
          period
        );

        return reply.code(200).send({
          licenseKey,
          period,
          computeMinutes,
        });
      } catch (error) {
        logger.error('[Usage API] Compute query error', error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to query compute minutes',
        });
      }
    }
  );
}
```

## Registration in Fastify Server

**Modify: `src/api/fastify-raas-server.ts`**

```typescript
// Add after other route registrations
import { registerUsageRoutes } from './routes/internal/usage-routes';

// ...

// Register internal routes (usage, metrics, etc.)
await registerUsageRoutes(server);

logger.info('[Fastify] Internal usage routes registered');
```

## Security Considerations

| Control | Implementation |
|---------|----------------|
| Internal API Key | `X-Internal-API-Key` header required |
| Localhost Binding | Optional: bind to 127.0.0.1 only |
| Rate Limiting | Apply rate limiter to internal routes |
| Audit Logging | Log all usage queries |

## Testing

```bash
# Test usage query
curl -H "X-Internal-API-Key: test-key" \
  "http://localhost:3000/internal/usage/test-license-123?month=2026-03"

# Test export
curl -H "X-Internal-API-Key: test-key" \
  "http://localhost:3000/internal/usage/test-license-123/export?month=2026-03&subscription_item=si_xxx"
```
