/**
 * Usage API Routes — Trade Metering Endpoints
 *
 * REST API endpoints for usage tracking and limits:
 * - GET /api/usage — Get current usage status
 * - GET /api/usage/:userId — Get usage for specific user
 * - POST /api/usage/track — Track usage event
 * - GET /api/usage/limits — Get tier limits
 *
 * Authentication:
 * - X-User-ID header for user identifier
 * - X-License-Tier header for subscription tier
 */

import { FastifyInstance } from 'fastify';
import { tradeMeteringService, TIER_LIMITS } from './trade-metering';
import { LicenseTier } from '../lib/raas-gate';
import { logger } from '../utils/logger';

/**
 * Request schema for usage endpoints
 */
interface UsageRequest {
  Headers: {
    'x-user-id'?: string;
    'x-license-tier'?: string;
  };
  Params: {
    userId?: string;
  };
  Body: {
    userId?: string;
    resourceType?: 'trade' | 'signal' | 'api_call';
    metadata?: Record<string, unknown>;
  };
}

/**
 * Register usage API routes
 */
export async function registerUsageRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/usage
   * Get current usage status for authenticated user
   */
  fastify.get<UsageRequest>('/api/usage', async (request, reply) => {
    const userId = request.headers['x-user-id'];

    if (!userId) {
      return reply.code(400).send({
        success: false,
        error: 'X-User-ID header required',
      });
    }

    try {
      // Get tier from header or default to FREE
      const tierHeader = request.headers['x-license-tier'] || 'FREE';
      const tier = LicenseTier[tierHeader as keyof typeof LicenseTier] || LicenseTier.FREE;

      // Set user tier if not already set
      tradeMeteringService.setUserTier(userId, tier);

      // Get usage status
      const status = tradeMeteringService.getUsageStatus(userId);

      return reply.code(200).send({
        success: true,
        status,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('[UsageAPI] Error fetching usage:', error instanceof Error ? error.message : String(error));
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch usage status',
      });
    }
  });

  /**
   * GET /api/usage/:userId
   * Get usage for a specific user (admin endpoint)
   */
  fastify.get<UsageRequest>('/api/usage/:userId', async (request, reply) => {
    const { userId } = request.params;

    if (!userId) {
      return reply.code(400).send({
        success: false,
        error: 'User ID required',
      });
    }

    try {
      const status = tradeMeteringService.getUsageStatus(userId);

      return reply.code(200).send({
        success: true,
        status,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[UsageAPI] Error fetching usage for user ${userId}:`, error instanceof Error ? error.message : String(error));
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch user usage',
      });
    }
  });

  /**
   * POST /api/usage/track
   * Track a usage event (trade, signal, or API call)
   */
  fastify.post<UsageRequest>('/api/usage/track', async (request, reply) => {
    const userId = request.body.userId || request.headers['x-user-id'];
    const resourceType = request.body.resourceType || 'api_call';
    const metadata = request.body.metadata;

    if (!userId) {
      return reply.code(400).send({
        success: false,
        error: 'User ID required (via body or X-User-ID header)',
      });
    }

    try {
      let allowed: boolean;

      if (resourceType === 'trade') {
        allowed = await tradeMeteringService.trackTrade(userId, metadata);
      } else if (resourceType === 'signal') {
        allowed = await tradeMeteringService.trackSignal(userId, metadata);
      } else {
        allowed = await tradeMeteringService.trackApiCall(userId);
      }

      const status = tradeMeteringService.getUsageStatus(userId);

      if (!allowed) {
        return reply.code(429).send({
          success: false,
          error: `${resourceType} limit exceeded`,
          status,
          upgradePrompt: status.upgradePrompt,
        });
      }

      return reply.code(200).send({
        success: true,
        tracked: resourceType,
        status,
      });
    } catch (error) {
      logger.error('[UsageAPI] Error tracking usage:', error instanceof Error ? error.message : String(error));
      return reply.code(500).send({
        success: false,
        error: 'Failed to track usage',
      });
    }
  });

  /**
   * GET /api/usage/limits
   * Get tier limits configuration
   */
  fastify.get('/api/usage/limits', async (_request, reply) => {
    return reply.code(200).send({
      success: true,
      limits: TIER_LIMITS,
      alertThresholds: [80, 90, 100],
    });
  });

  /**
   * GET /api/usage/overage
   * Get all users currently in overage (admin endpoint)
   */
  fastify.get('/api/usage/overage', async (_request, reply) => {
    try {
      const overageUsers = tradeMeteringService.getOverageUsers();

      return reply.code(200).send({
        success: true,
        overageUsers,
        count: overageUsers.length,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('[UsageAPI] Error fetching overage users:', error instanceof Error ? error.message : String(error));
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch overage users',
      });
    }
  });
}

/**
 * Usage tracking middleware for API routes
 */
export function usageTrackingMiddleware() {
  return async (
    req: Record<string, unknown>,
    res: { setHeader: (name: string, value: string) => void; status: (code: number) => { json: (data: unknown) => void } },
    next: (err?: unknown) => void
  ) => {
    try {
      const headers = req.headers as Record<string, string | undefined> || {};
      const userId = headers['x-user-id'];
      const tierHeader = headers['x-license-tier'] || 'FREE';
      const tier = LicenseTier[tierHeader as keyof typeof LicenseTier] || LicenseTier.FREE;

      if (userId) {
        // Set tier
        tradeMeteringService.setUserTier(userId, tier);

        // Track API call
        const allowed = await tradeMeteringService.trackApiCall(userId);

        if (!allowed) {
          const status = tradeMeteringService.getUsageStatus(userId);
          res.setHeader('X-RateLimit-Limit', status.apiCalls.limit.toString());
          res.setHeader('X-RateLimit-Remaining', '0');
          res.setHeader('X-RateLimit-Exceeded', 'true');
          return res.status(429).json({
            error: 'API call limit exceeded',
            status,
            upgradePrompt: status.upgradePrompt,
          });
        }

        // Add quota headers
        const apiStatus = tradeMeteringService.getUsageStatus(userId);
        res.setHeader('X-RateLimit-Limit', apiStatus.apiCalls.limit.toString());
        res.setHeader('X-RateLimit-Remaining', apiStatus.apiCalls.remaining.toString());
        res.setHeader('X-RateLimit-Percent-Used', apiStatus.apiCalls.percentUsed.toString());
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
