/**
 * Usage Events API Routes
 *
 * Public endpoints for usage event streaming and queries.
 * Secured via JWT + mk_ API key authentication (same as RaaS Gateway).
 *
 * Endpoints:
 * - GET /v1/usage/events - Stream usage events in chronological order
 * - GET /v1/usage/events/:licenseKey - Get usage events for specific license
 * - POST /v1/usage/events/sync - Trigger usage sync to external billing
 *
 * @see apps/raas-gateway/index.js - RaaS Gateway auth patterns
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../utils/logger';
import { UsageTrackerService, UsageEvent } from '../../metering/usage-tracker-service';
import { raasKVClient } from '../../lib/raas-gateway-kv-client';

/**
 * Usage events response
 */
export interface UsageEventsResponse {
  success: boolean;
  tenantId?: string;
  licenseKey?: string;
  count: number;
  events: UsageEvent[];
  period?: {
    startTime: string;
    endTime: string;
  };
  error?: string;
  message?: string;
}

/**
 * Usage sync response
 */
export interface UsageSyncResponse {
  success: boolean;
  synced: number;
  period?: string;
  error?: string;
}

/**
 * Verify JWT or mk_ API key from headers
 *
 * Follows same pattern as RaaS Gateway (raas.agencyos.network):
 * - Authorization: Bearer <jwt_token>
 * - X-API-Key: <mk_api_key>
 *
 * @param request - Fastify request object
 * @returns Decoded auth context or null if invalid
 */
async function verifyAuth(
  request: FastifyRequest
): Promise<{ tenantId: string; role: string; licenseKey?: string } | null> {
  // Try mk_ API key first (priority as per RaaS Gateway)
  const apiKey = request.headers['x-api-key'] as string;
  if (apiKey && apiKey.startsWith('mk_')) {
    // Validate mk_ key format: mk_<key>:<tenantId>:<tier>
    const parts = apiKey.slice(3).split(':');
    if (parts.length === 3) {
      const tenantId = parts[1];
      const tier = parts[2];
      logger.debug('[Usage Events API] mk_ API key auth', { tenantId, tier });
      return { tenantId, role: tier, licenseKey: `lic_${tenantId}` };
    }
  }

  // Try JWT token
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);

    try {
      // Decode JWT without verification (edge-side validation like RaaS Gateway)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

        // Check expiry
        if (payload.exp && payload.exp < Date.now() / 1000) {
          logger.warn('[Usage Events API] JWT expired');
          return null;
        }

        const tenantId = payload.tenant_id || payload.sub;
        const role = payload.role || 'user';
        const licenseKey = payload.license_key;

        if (tenantId) {
          logger.debug('[Usage Events API] JWT auth', { tenantId, role, licenseKey });
          return { tenantId, role, licenseKey: licenseKey || `lic_${tenantId}` };
        }
      }
    } catch (e) {
      logger.debug('[Usage Events API] JWT decode failed');
    }
  }

  // Fallback to env-based auth for dev/testing
  const devApiKey = process.env.USAGE_EVENTS_API_KEY;
  if (devApiKey && apiKey === devApiKey) {
    logger.debug('[Usage Events API] Dev API key auth');
    return { tenantId: 'dev', role: 'admin', licenseKey: 'lic_dev' };
  }

  return null;
}

/**
 * Register usage events API routes
 */
export async function registerUsageEventsRoutes(fastify: FastifyInstance) {
  /**
   * GET /v1/usage/events
   *
   * Stream usage events in chronological order.
   *
   * Headers:
   * - Authorization: Bearer <jwt_token> OR
   * - X-API-Key: <mk_api_key>
   *
   * Query params:
   * - startTime: ISO 8601 timestamp (default: 24 hours ago)
   * - endTime: ISO 8601 timestamp (default: now)
   * - eventType: Filter by event type (optional)
   * - limit: Max events to return (default: 1000)
   * - source: 'memory' | 'kv' (default: 'memory')
   *
   * Response:
   * - success: boolean
   * - tenantId: Tenant identifier
   * - count: Number of events returned
   * - events: Array of usage events sorted chronologically
   * - period: Time range covered
   */
  fastify.get(
    '/v1/usage/events',
    async (
      request: FastifyRequest<{
        Querystring: {
          startTime?: string;
          endTime?: string;
          eventType?: string;
          limit?: string;
          source?: 'memory' | 'kv';
        };
      }>,
      reply: FastifyReply
    ) => {
      // Verify auth
      const auth = await verifyAuth(request);
      if (!auth) {
        logger.warn('[Usage Events API] Unauthorized access attempt');
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Valid JWT or mk_ API key required',
        } as UsageEventsResponse);
      }

      const { startTime, endTime, eventType, limit, source } = request.query;
      const maxLimit = Math.min(parseInt(limit || '1000', 10), 10000);

      try {
        const tracker = UsageTrackerService.getInstance();
        const licenseKey = auth.licenseKey || `lic_${auth.tenantId}`;

        // Get events from memory or KV
        let events: UsageEvent[];
        if (source === 'kv') {
          // Stream from KV
          const startTs = startTime ? new Date(startTime).getTime() : 0;
          const endTs = endTime ? new Date(endTime).getTime() : Date.now();
          events = await raasKVClient.streamUsageEvents(licenseKey, startTs, endTs);
        } else {
          // Get from memory (default)
          events = await tracker.getUsageFiltered(
            licenseKey,
            startTime,
            endTime,
            eventType
          );
        }

        // Apply filters if not already applied
        let filtered = events;
        if (eventType && source !== 'kv') {
          filtered = events.filter(e => e.eventType === eventType);
        }

        // Apply limit
        const limited = filtered.slice(0, maxLimit);

        logger.info('[Usage Events API] Events retrieved', {
          tenantId: auth.tenantId,
          source: source || 'memory',
          count: limited.length,
          total: events.length,
        });

        return reply.code(200).send({
          success: true,
          tenantId: auth.tenantId,
          licenseKey,
          count: limited.length,
          events: limited,
          period: {
            startTime: startTime || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            endTime: endTime || new Date().toISOString(),
          },
        } as UsageEventsResponse);
      } catch (error) {
        logger.error('[Usage Events API] Query error', {
          tenantId: auth.tenantId,
          error: error instanceof Error ? error.message : error,
        });
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to retrieve usage events',
        } as UsageEventsResponse);
      }
    }
  );

  /**
   * GET /v1/usage/events/:licenseKey
   *
   * Get usage events for a specific license key.
   * Admin-only endpoint.
   *
   * Path params:
   * - licenseKey: License identifier
   *
   * Query params:
   * - startTime: ISO 8601 timestamp
   * - endTime: ISO 8601 timestamp
   * - eventType: Filter by event type
   * - limit: Max events (default: 1000)
   */
  fastify.get(
    '/v1/usage/events/:licenseKey',
    async (
      request: FastifyRequest<{
        Params: { licenseKey: string };
        Querystring: {
          startTime?: string;
          endTime?: string;
          eventType?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      // Verify auth (admin only)
      const auth = await verifyAuth(request);
      if (!auth || auth.role !== 'admin') {
        return reply.code(403).send({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required',
        } as UsageEventsResponse);
      }

      const { licenseKey } = request.params;
      const { startTime, endTime, eventType, limit } = request.query;
      const maxLimit = Math.min(parseInt(limit || '1000', 10), 10000);

      try {
        const tracker = UsageTrackerService.getInstance();
        const events = await tracker.getUsageFiltered(
          licenseKey,
          startTime,
          endTime,
          eventType
        );

        const limited = events.slice(0, maxLimit);

        logger.info('[Usage Events API] License events retrieved', {
          licenseKey,
          count: limited.length,
        });

        return reply.code(200).send({
          success: true,
          licenseKey,
          count: limited.length,
          events: limited,
          period: {
            startTime: startTime || '2026-03-01T00:00:00Z',
            endTime: endTime || new Date().toISOString(),
          },
        } as UsageEventsResponse);
      } catch (error) {
        logger.error('[Usage Events API] Query error', {
          licenseKey,
          error: error instanceof Error ? error.message : error,
        });
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to retrieve usage events',
        } as UsageEventsResponse);
      }
    }
  );

  /**
   * POST /v1/usage/events/sync
   *
   * Trigger usage sync to external billing system (Stripe/Polar).
   * Admin-only endpoint for billing reconciliation.
   *
   * Body (optional):
   * - period: YYYY-MM format (default: current month)
   * - target: 'stripe' | 'polar' | 'kv' (default: 'kv')
   */
  fastify.post(
    '/v1/usage/events/sync',
    async (
      request: FastifyRequest<{
        Body?: {
          period?: string;
          target?: 'stripe' | 'polar' | 'kv';
        };
      }>,
      reply: FastifyReply
    ) => {
      // Verify auth (admin only)
      const auth = await verifyAuth(request);
      if (!auth || auth.role !== 'admin') {
        return reply.code(403).send({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required',
          synced: 0,
        } as UsageSyncResponse);
      }

      const period = request.body?.period || new Date().toISOString().slice(0, 7);
      const target = request.body?.target || 'kv';

      try {
        const tracker = UsageTrackerService.getInstance();

        // Flush any pending events first
        await tracker.flush();

        // Get all usage for the period
        const allUsage = await tracker.getAllUsage('');
        const periodUsage = allUsage.filter(u => u.month === period);

        // Sync to KV
        let synced = 0;
        if (target === 'kv' || !target) {
          for (const usage of periodUsage) {
            for (const event of usage.events) {
              await raasKVClient.pushUsageEvent(event);
              synced++;
            }
          }
        }

        logger.info('[Usage Events API] Sync complete', {
          period,
          target,
          synced,
        });

        return reply.code(200).send({
          success: true,
          synced,
          period,
        } as UsageSyncResponse);
      } catch (error) {
        logger.error('[Usage Events API] Sync error', {
          period,
          error: error instanceof Error ? error.message : error,
        });
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to sync usage events',
          synced: 0,
        } as UsageSyncResponse);
      }
    }
  );

  logger.info('[Usage Events API] Routes registered');
}
