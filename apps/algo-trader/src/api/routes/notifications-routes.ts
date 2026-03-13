/**
 * Notifications API Routes — /api/notifications/* endpoints
 *
 * ROIaaS Phase 7 — Notification Management Endpoints
 * - GET /api/notifications/preferences — Get user preferences
 * - PUT /api/notifications/preferences — Update preferences
 * - POST /api/notifications/test — Send test notification
 * - GET /api/notifications/history — Get alert history
 *
 * Tier Restrictions:
 * - FREE: Email digest only, basic preferences
 * - PRO: Real-time notifications, webhook support
 * - ENTERPRISE: SMS, custom webhooks, priority delivery
 */

import { FastifyInstance } from 'fastify';
import { alertNotificationSystem, NotificationPreferences, AlertPayload } from '../../notifications/alert-system';
import { LicenseService, LicenseTier } from '../../lib/raas-gate';
import { tradeMeteringService } from '../../metering/trade-metering';
import { logger } from '../../utils/logger';

/**
 * Request schemas
 */
interface PreferencesRequest {
  Headers: {
    'x-user-id'?: string;
  };
  Body: Partial<NotificationPreferences>;
}

interface TestNotificationRequest {
  Headers: {
    'x-user-id'?: string;
  };
  Body: {
    type?: string;
    channel?: string;
    message?: string;
  };
}

interface HistoryRequest {
  Headers: {
    'x-user-id'?: string;
  };
  Querystring: {
    limit?: number;
    type?: string;
  };
}

/**
 * Register notifications API routes
 */
export async function registerNotificationsRoutes(fastify: FastifyInstance): Promise<void> {
  const licenseService = LicenseService.getInstance();

  /**
   * GET /api/notifications/preferences
   * Get user notification preferences
   */
  fastify.get<PreferencesRequest>('/api/notifications/preferences', async (request, reply) => {
    const userId = request.headers['x-user-id'];

    if (!userId) {
      return reply.code(400).send({
        success: false,
        error: 'X-User-ID header required',
      });
    }

    try {
      const prefs = alertNotificationSystem.getPreferences(userId);

      return reply.code(200).send({
        success: true,
        preferences: prefs,
        tier: licenseService.getTier(),
      });
    } catch (error) {
      logger.error(`[NotificationsAPI] Get preferences error: ${error instanceof Error ? error.message : String(error)}`);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get preferences',
      });
    }
  });

  /**
   * PUT /api/notifications/preferences
   * Update user notification preferences
   */
  fastify.put<PreferencesRequest>('/api/notifications/preferences', async (request, reply) => {
    const userId = request.headers['x-user-id'];
    const updates = request.body;

    if (!userId) {
      return reply.code(400).send({
        success: false,
        error: 'X-User-ID header required',
      });
    }

    try {
      const tier = licenseService.getTier();

      // Validate tier-based restrictions
      if (updates.smsEnabled && tier !== LicenseTier.ENTERPRISE) {
        return reply.code(403).send({
          success: false,
          error: 'SMS notifications require ENTERPRISE tier',
          requiredTier: LicenseTier.ENTERPRISE,
        });
      }

      if (updates.webhookEnabled && tier === LicenseTier.FREE) {
        return reply.code(403).send({
          success: false,
          error: 'Webhook notifications require PRO tier',
          requiredTier: LicenseTier.PRO,
        });
      }

      if (updates.realtimeEnabled && tier === LicenseTier.FREE) {
        return reply.code(403).send({
          success: false,
          error: 'Real-time notifications require PRO tier',
          requiredTier: LicenseTier.PRO,
        });
      }

      // Update preferences
      alertNotificationSystem.setPreferences(userId, updates);

      return reply.code(200).send({
        success: true,
        message: 'Preferences updated',
        preferences: alertNotificationSystem.getPreferences(userId),
      });
    } catch (error) {
      logger.error(`[NotificationsAPI] Update preferences error: ${error instanceof Error ? error.message : String(error)}`);
      return reply.code(500).send({
        success: false,
        error: 'Failed to update preferences',
      });
    }
  });

  /**
   * POST /api/notifications/test
   * Send test notification
   */
  fastify.post<TestNotificationRequest>('/api/notifications/test', async (request, reply) => {
    const userId = request.headers['x-user-id'];
    const { type = 'test', channel = 'email', message = 'Test notification from Algo-Trader' } = request.body;

    if (!userId) {
      return reply.code(400).send({
        success: false,
        error: 'X-User-ID header required',
      });
    }

    try {
      // Track usage
      const allowed = await tradeMeteringService.trackApiCall(userId, '/api/notifications/test');
      if (!allowed) {
        return reply.code(429).send({
          success: false,
          error: 'API call limit exceeded',
          status: tradeMeteringService.getUsageStatus(userId),
        });
      }

      const payload: AlertPayload = {
        type: type as any,
        severity: 'low',
        title: 'Test Notification',
        message,
        data: { test: true },
        timestamp: Date.now(),
        userId,
      };

      const results = await alertNotificationSystem.sendAlert(payload);

      return reply.code(200).send({
        success: true,
        message: 'Test notification sent',
        results,
      });
    } catch (error) {
      logger.error(`[NotificationsAPI] Test notification error: ${error instanceof Error ? error.message : String(error)}`);
      return reply.code(500).send({
        success: false,
        error: 'Failed to send test notification',
      });
    }
  });

  /**
   * GET /api/notifications/history
   * Get alert history (placeholder for future implementation)
   */
  fastify.get<HistoryRequest>('/api/notifications/history', async (request, reply) => {
    const userId = request.headers['x-user-id'];
    const { limit = 50, type } = request.query;

    if (!userId) {
      return reply.code(400).send({
        success: false,
        error: 'X-User-ID header required',
      });
    }

    try {
      // TODO: Implement alert history storage and retrieval
      // For now, return empty array
      return reply.code(200).send({
        success: true,
        history: [],
        pagination: {
          limit,
          type,
          total: 0,
        },
      });
    } catch (error) {
      logger.error(`[NotificationsAPI] Get history error: ${error instanceof Error ? error.message : String(error)}`);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get history',
      });
    }
  });

  /**
   * GET /api/notifications/channels
   * Get available notification channels for current tier
   */
  fastify.get('/api/notifications/channels', async (_request, reply) => {
    const tier = licenseService.getTier();

    const channels = {
      [LicenseTier.FREE]: {
        available: ['email'],
        features: {
          digest: true,
          realtime: false,
          webhook: false,
          sms: false,
        },
      },
      [LicenseTier.PRO]: {
        available: ['email', 'telegram', 'webhook', 'push'],
        features: {
          digest: true,
          realtime: true,
          webhook: true,
          sms: false,
        },
      },
      [LicenseTier.ENTERPRISE]: {
        available: ['email', 'telegram', 'webhook', 'push', 'sms'],
        features: {
          digest: true,
          realtime: true,
          webhook: true,
          sms: true,
        },
      },
    };

    return reply.code(200).send({
      success: true,
      tier,
      channels: channels[tier],
      allChannels: ['email', 'telegram', 'webhook', 'push', 'sms'],
    });
  });
}
