/**
 * Overage Middleware for Fastify — Soft Limits Enforcement
 *
 * Allows API requests when overage is enabled, even if quota exceeded.
 * Tracks overage units separately for billing.
 *
 * Features:
 * - Checks overage allowance before each request
 * - Allows/blocks based on overage config
 * - Tracks overage units in metadata
 * - Integrates with RaaS Gateway KV
 *
 * Usage:
 * ```typescript
 * // Register in fastify-raas-server.ts
 * import { overagePlugin } from './middleware/overage-middleware';
 * void server.register(overagePlugin);
 * ```
 */

import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { LicenseService, LicenseTier } from '../../lib/raas-gate';
import { QUOTA_LIMITS } from '../../lib/usage-quota';
import { UsageTrackerService } from '../../metering/usage-tracker-service';
import { OverageMeteringService, OverageCheckResult } from '../../billing/overage-metering-service';
import { RaaSGatewayKVClient } from '../../lib/raas-gateway-kv-client';
import { logger } from '../../utils/logger';

/**
 * Overage middleware options
 */
export interface OverageMiddlewareOptions {
  /** Enable overage checking */
  enabled?: boolean;
  /** Paths to exclude from overage check */
  excludePaths?: string[];
  /** KV client for persistence */
  kvClient?: RaaSGatewayKVClient;
}

const DEFAULT_OPTIONS: Required<OverageMiddlewareOptions> = {
  enabled: true,
  excludePaths: ['/health', '/ready', '/metrics', '/internal', '/api/v1/billing/webhook'],
  kvClient: new RaaSGatewayKVClient(),
};

/**
 * Extract license key from request headers
 */
function extractLicenseKey(request: FastifyRequest): string | undefined {
  // Check X-API-Key header first
  const apiKey = request.headers['x-api-key'] as string;
  if (apiKey) return apiKey;

  // Check Authorization Bearer token
  const authHeader = request.headers['authorization'] as string;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Fall back to environment variable
  return process.env.RAAS_LICENSE_KEY;
}

/**
 * Check if path should be excluded
 */
function isExcludedPath(path: string, excludePaths: string[]): boolean {
  return excludePaths.some((excluded) => {
    if (excluded.endsWith('*')) {
      return path.startsWith(excluded.slice(0, -1));
    }
    return path === excluded || path.startsWith(excluded + '/');
  });
}

/**
 * Get current usage from tracker
 */
async function getCurrentUsage(licenseKey: string): Promise<number> {
  const tracker = UsageTrackerService.getInstance();
  const usage = await tracker.getCurrentMonthUsage(licenseKey);
  return usage.totalUnits;
}

/**
 * Overage middleware factory
 *
 * Creates Fastify hooks that:
 * 1. preHandler: Check overage allowance
 * 2. Allow request if overage enabled, even if quota exceeded
 * 3. Track overage units for billing
 */
export function createOverageMiddleware(
  options: OverageMiddlewareOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const overageMetering = OverageMeteringService.getInstance();

  return {
    preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
      if (!opts.enabled) {
        return;
      }

      // Skip excluded paths
      if (isExcludedPath(request.url, opts.excludePaths)) {
        return;
      }

      const licenseKey = extractLicenseKey(request);
      if (!licenseKey) {
        return; // No license = free tier, skip overage check
      }

      // Get current usage
      const currentUsage = await getCurrentUsage(licenseKey);

      // Get quota limit for tier
      const tier = LicenseService.getInstance().getTier();
      const limit = QUOTA_LIMITS[tier];

      // Check if within quota (always allowed)
      if (currentUsage <= limit) {
        // Add usage headers
        reply.header('X-Usage-Current', currentUsage.toString());
        reply.header('X-Usage-Limit', limit.toString());
        reply.header('X-Usage-Tier', tier);
        reply.header('X-Overage-Status', 'within_quota');
        return;
      }

      // Over quota - check overage allowance
      const checkResult: OverageCheckResult = await overageMetering.checkOverageAllowed(
        licenseKey,
        currentUsage,
        limit
      );

      // Add overage headers
      reply.header('X-Usage-Current', currentUsage.toString());
      reply.header('X-Usage-Limit', limit.toString());
      reply.header('X-Overage-Units', (currentUsage - limit).toString());
      reply.header('X-Overage-Status', checkResult.reason);

      // Store overage check result on request for downstream middleware
      (request as any).overageCheckResult = checkResult;

      // Handle based on check result
      switch (checkResult.reason) {
        case 'within_quota':
          // Already handled above, but just in case
          reply.header('X-Overage-Status', 'within_quota');
          break;

        case 'overage_allowed':
          // Allow request, will track overage
          logger.info('[OverageMiddleware] Overage allowed', {
            licenseKey: licenseKey.substring(0, 8) + '...',
            currentUsage,
            limit,
            overageUnits: checkResult.overageUnits,
          });

          reply.header('X-Overage-Allowed', 'true');
          reply.header('X-Overage-Units', (checkResult.overageUnits || 0).toString());
          break;

        case 'overage_disabled':
          // Block - overage not enabled for this license
          logger.warn('[OverageMiddleware] Overage disabled, blocking', {
            licenseKey: licenseKey.substring(0, 8) + '...',
            currentUsage,
            limit,
          });

          return reply.code(403).send({
            error: 'quota_exceeded',
            message: `Monthly quota exceeded (${currentUsage}/${limit} API calls). Overage not enabled for your plan.`,
            currentUsage,
            limit,
            tier,
            overage_available: false,
            upgrade_url: 'https://agencyos.network/pricing',
          });

        case 'overage_exceeded':
          // Block - max overage limit exceeded
          logger.warn('[OverageMiddleware] Max overage exceeded, blocking', {
            licenseKey: licenseKey.substring(0, 8) + '...',
            currentUsage,
            limit,
            overageUnits: checkResult.overageUnits,
          });

          return reply.code(403).send({
            error: 'overage_exceeded',
            message: `Maximum overage limit exceeded. Current usage: ${currentUsage}/${limit}.`,
            currentUsage,
            limit,
            tier,
            overage_available: true,
            overage_limit_reached: true,
            upgrade_url: 'https://agencyos.network/pricing',
          });
      }
    },
  };
}

/**
 * Fastify plugin for easy registration
 */
export async function overagePlugin(
  fastify: FastifyInstance,
  options: OverageMiddlewareOptions = {}
) {
  const hooks = createOverageMiddleware(options);

  fastify.addHook('preHandler', hooks.preHandler);

  fastify.log.info('[Overage] Plugin registered');
}

/**
 * Track overage after successful request
 * Call this in onSend hook or after request completion
 */
export async function trackOverageForRequest(
  request: FastifyRequest,
  licenseKey: string
): Promise<void> {
  const checkResult = (request as any).overageCheckResult as OverageCheckResult | undefined;

  if (!checkResult || checkResult.reason !== 'overage_allowed') {
    return; // Not in overage, nothing to track
  }

  const overageMetering = OverageMeteringService.getInstance();

  // Track 1 unit of overage for this request
  await overageMetering.trackOverage(licenseKey, 1, {
    path: request.url,
    method: request.method,
    timestamp: new Date().toISOString(),
  });

  logger.debug('[OverageMiddleware] Tracked overage unit', {
    licenseKey: licenseKey.substring(0, 8) + '...',
    path: request.url,
  });
}
