/**
 * Internal Usage API Routes
 *
 * Secure endpoints for usage queries by billing sync jobs and admin dashboards.
 * Requires INTERNAL_API_KEY header for authentication.
 *
 * @example
 * ```bash
 * curl -H "X-Internal-API-Key: secret-key" \
 *   "http://localhost:3000/internal/usage/raas-pro-ABC123-XYZ?month=2026-03"
 * ```
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UsageTrackerService } from '../../../metering/usage-tracker-service';
import { usageQueries } from '../../../db/queries/usage-queries';
import { licenseQueries } from '../../../db/queries/license-queries';
import { logger } from '../../../utils/logger';

/**
 * Usage response schema for billing integration
 */
export interface UsageResponse {
  licenseKey: string;
  month: string; // YYYY-MM format
  totalUnits: number;
  byEventType: Record<string, number>;
  computeMinutes: number;
  apiCalls: number;
}

/**
 * Stripe-compatible billing export format
 */
export interface StripeBillingRecord {
  subscription_item: string;
  quantity: number;
  timestamp: number; // Unix timestamp
  action: 'increment' | 'set';
}

export interface StripeExportResponse {
  licenseKey: string;
  period: string;
  records: StripeBillingRecord[];
}

/**
 * Verify internal API key from headers
 *
 * @param request - Fastify request object
 * @returns true if authenticated, false otherwise
 */
function verifyInternalAuth(request: FastifyRequest): boolean {
  const apiKey = request.headers['x-internal-api-key'] as string;
  const expectedKey = process.env.INTERNAL_API_KEY;

  // Allow if no INTERNAL_API_KEY set (dev mode)
  if (!expectedKey) {
    return true;
  }

  return apiKey === expectedKey;
}

/**
 * Register internal usage routes
 */
export async function registerUsageRoutes(fastify: FastifyInstance) {
  const tracker = UsageTrackerService.getInstance();

  /**
   * GET /internal/usage/:licenseKey
   *
   * Get usage data for a specific license and month.
   * Used by billing sync jobs to calculate charges.
   *
   * Query params:
   * - month: YYYY-MM format (default: current month)
   *
   * Response:
   * - licenseKey: The license identifier
   * - month: The queried month in YYYY-MM format
   * - totalUnits: Total units consumed
   * - byEventType: Breakdown by event type
   * - computeMinutes: Total compute minutes (api_call + compute_minute events)
   * - apiCalls: Total API call count
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
        logger.warn('[Usage API] Unauthorized access attempt');
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Valid X-Internal-API-Key header required',
        });
      }

      const { licenseKey } = request.params;
      const { month } = request.query;

      // Validate license key format (basic check)
      if (!licenseKey || licenseKey.length < 8) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid license key format - must be at least 8 characters',
        });
      }

      // Validate month format if provided
      if (month && !/^\d{4}-\d{2}$/.test(month)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid month format - use YYYY-MM',
        });
      }

      try {
        // Determine period (default to current month)
        const now = new Date();
        const period =
          month ||
          `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Get aggregated usage from database
        let aggregatedUsage: Array<{
          eventType: string;
          totalUnits: number;
          eventCount: number;
        }> = [];
        try {
          aggregatedUsage = await usageQueries.getAggregatedUsage(
            licenseKey,
            period
          );
        } catch (dbError) {
          // Database not available - will use in-memory fallback
          logger.debug('[Usage API] Database unavailable, using in-memory data');
        }

        // Calculate totals
        let totalUnits = 0;
        const byEventType: Record<string, number> = {};
        let computeMinutes = 0;
        let apiCalls = 0;

        for (const usage of aggregatedUsage) {
          totalUnits += usage.totalUnits;
          byEventType[usage.eventType] = usage.totalUnits;

          // Compute minutes = compute_minute events (1 unit = 1 minute)
          if (usage.eventType === 'compute_minute') {
            computeMinutes = usage.totalUnits;
          }

          // API calls = api_call event count
          if (usage.eventType === 'api_call') {
            apiCalls = usage.eventCount;
          }
        }

        // If no DB records, check in-memory tracker (fallback)
        if (aggregatedUsage.length === 0) {
          const memUsage = await tracker.getUsage(licenseKey, period);
          totalUnits = memUsage.totalUnits;
          Object.assign(byEventType, memUsage.byEventType);
          computeMinutes = memUsage.byEventType['compute_minute'] || 0;
          apiCalls = memUsage.byEventType['api_call'] || 0;
        }

        const response: UsageResponse = {
          licenseKey,
          month: period,
          totalUnits,
          byEventType,
          computeMinutes,
          apiCalls,
        };

        logger.debug(
          `[Usage API] Query successful: ${licenseKey} (${period}) - ${totalUnits} units`
        );
        return reply.code(200).send(response);
      } catch (error) {
        logger.error('[Usage API] Query error', {
          licenseKey,
          month,
          error: error instanceof Error ? error.message : error,
        });
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to query usage data',
        });
      }
    }
  );

  /**
   * GET /internal/usage/:licenseKey/export
   *
   * Export usage in Stripe Billing Report format.
   * Required for Stripe metered billing sync.
   *
   * Query params:
   * - month: YYYY-MM format (default: current month)
   * - subscription_item: Stripe subscription item ID (required)
   *
   * Response format:
   * https://stripe.com/docs/api/subscription_items/create_usage_records
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
          message: 'Valid X-Internal-API-Key header required',
        });
      }

      const { licenseKey } = request.params;
      const { month, subscription_item } = request.query;

      // Validate subscription_item is provided
      if (!subscription_item) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'subscription_item query param required for Stripe export',
        });
      }

      // Validate month format if provided
      if (month && !/^\d{4}-\d{2}$/.test(month)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid month format - use YYYY-MM',
        });
      }

      try {
        // Determine period
        const now = new Date();
        const period =
          month ||
          `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Get usage events for the period
        let events: Array<Record<string, unknown>> = [];
        try {
          const [year, monthNum] = period.split('-').map(Number);
          const startDate = new Date(year, monthNum - 1, 1);
          const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

          events = await usageQueries.getUsageByLicense(licenseKey, {
            startDate,
            endDate,
          });
        } catch (dbError) {
          // Database not available - return empty records
          logger.debug('[Usage API] Database unavailable for export');
        }

        // Convert to Stripe format - aggregate by day
        const dailyTotals = new Map<number, number>();

        for (const event of events as Array<{ createdAt: string | Date; units: number }>) {
          const dayStart = new Date(event.createdAt);
          dayStart.setHours(0, 0, 0, 0);
          const timestamp = Math.floor(dayStart.getTime() / 1000);

          const current = dailyTotals.get(timestamp) || 0;
          dailyTotals.set(timestamp, current + event.units);
        }

        // Build Stripe records
        const records: StripeBillingRecord[] = [];
        for (const [timestamp, quantity] of dailyTotals.entries()) {
          records.push({
            subscription_item,
            quantity,
            timestamp,
            action: 'set', // Use 'set' for daily aggregates
          });
        }

        const response: StripeExportResponse = {
          licenseKey,
          period,
          records,
        };

        logger.debug(
          `[Usage API] Stripe export: ${licenseKey} (${period}) - ${records.length} records`
        );
        return reply.code(200).send(response);
      } catch (error) {
        logger.error('[Usage API] Stripe export error', {
          licenseKey,
          error: error instanceof Error ? error.message : error,
        });
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to export usage data for Stripe',
        });
      }
    }
  );

  /**
   * GET /internal/usage/:licenseKey/compute
   *
   * Quick query for compute minutes only.
   * Optimized endpoint for monitoring dashboards.
   *
   * Query params:
   * - month: YYYY-MM format (default: current month)
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

      // Validate month format if provided
      if (month && !/^\d{4}-\d{2}$/.test(month)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid month format - use YYYY-MM',
        });
      }

      try {
        const now = new Date();
        const period =
          month ||
          `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Get compute minutes specifically
        let computeMinutes = 0;
        try {
          const computeUsage = await usageQueries.getAggregatedUsage(
            licenseKey,
            period
          );
          for (const usage of computeUsage) {
            if (usage.eventType === 'compute_minute') {
              computeMinutes = usage.totalUnits;
              break;
            }
          }
        } catch (dbError) {
          logger.debug('[Usage API] Database unavailable for compute query');
        }

        // Fallback to in-memory if no DB records
        if (computeMinutes === 0) {
          const memUsage = await tracker.getUsage(licenseKey, period);
          computeMinutes = memUsage.byEventType['compute_minute'] || 0;
        }

        return reply.code(200).send({
          licenseKey,
          month: period,
          computeMinutes,
        });
      } catch (error) {
        logger.error('[Usage API] Compute query error', {
          licenseKey,
          error: error instanceof Error ? error.message : error,
        });
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to query compute minutes',
        });
      }
    }
  );

  /**
   * GET /internal/usage/recent
   *
   * Get recent usage events across all licenses.
   * For monitoring and debugging purposes.
   *
   * Query params:
   * - limit: Number of events to return (default: 50, max: 100)
   */
  fastify.get(
    '/internal/usage/recent',
    async (
      request: FastifyRequest<{
        Querystring: { limit?: string };
      }>,
      reply: FastifyReply
    ) => {
      if (!verifyInternalAuth(request)) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { limit: limitStr } = request.query;
      const limit = Math.min(parseInt(limitStr || '50', 10), 100);

      try {
        let recentUsage: Array<Record<string, unknown>> = [];
        try {
          recentUsage = await usageQueries.getRecentUsage(limit);
        } catch (dbError) {
          // Database not available - return empty results
          logger.debug('[Usage API] Database unavailable for recent query');
        }

        return reply.code(200).send({
          events: recentUsage,
          count: recentUsage.length,
        });
      } catch (error) {
        logger.error('[Usage API] Recent usage query error', {
          error: error instanceof Error ? error.message : error,
        });
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to query recent usage',
        });
      }
    }
  );

  logger.info('[Usage API] Routes registered');
}
