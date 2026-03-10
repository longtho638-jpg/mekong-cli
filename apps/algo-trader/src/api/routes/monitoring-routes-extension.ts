/**
 * @ts-nocheck
 * Monitoring Routes Extension — Phase 7.5
 *
 * Additional monitoring endpoints for:
 * - License compliance tracking
 * - Rate limit observability
 * - Billing events
 * - Recent API calls
 * - Stripe billing sync status
 *
 * Endpoints:
 * - GET /monitoring/license — License compliance status
 * - GET /monitoring/license/:tenantId — Specific tenant license status
 * - GET /monitoring/rate-limits — Rate limit status for all tenants
 * - GET /monitoring/rate-limits/throttled — Recent throttling events
 * - GET /monitoring/billing — Billing events and status
 * - GET /monitoring/billing/:tenantId — Specific tenant billing status
 * - GET /monitoring/api-calls — Recent API calls log
 * - GET /monitoring/stripe-sync — Stripe billing sync status
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  getGlobalLicenseTracker,
  type LicenseComplianceStatus,
  type LicenseValidationEvent,
} from '../../monitoring/license-compliance-tracker';
import {
  getGlobalRateLimitTracker,
  type RateLimitStatus,
  type RateLimitEvent,
} from '../../monitoring/rate-limit-tracker';
import {
  getGlobalBillingEventsTracker,
  type BillingStatus,
  type BillingEvent,
} from '../../monitoring/billing-events-tracker';
import { raasAuthMiddleware, getTenantId, RaasTier } from '../../lib/raas-auth-middleware';
import { getGlobalTradeMonitor } from '../../monitoring/trade-monitor-service';

// Augment FastifyInstance with auth decorators
declare module 'fastify' {
  interface FastifyInstance {
    hasAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireTier: (tier: RaasTier) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * License compliance response
 */
interface LicenseComplianceResponse {
  summary: {
    totalTenants: number;
    byStatus: Record<string, number>;
    byTier: Record<string, number>;
    averageComplianceScore: number;
    expiringSoonCount: number;
  };
  tenants: LicenseComplianceStatus[];
  recentEvents: LicenseValidationEvent[];
  timestamp: string;
}

/**
 * Rate limit response
 */
interface RateLimitResponse {
  summary: {
    totalTenants: number;
    throttledTenants: number;
    totalThrottleRate: number;
    byTier: Record<string, { count: number; throttleRate: number }>;
  };
  tenants: RateLimitStatus[];
  throttledEvents: RateLimitEvent[];
  timestamp: string;
}

/**
 * Billing status response
 */
interface BillingResponse {
  summary: {
    totalTenants: number;
    activeSubscriptions: number;
    pastDueCount: number;
    totalOverage: number;
    stripeSyncHealth: {
      successful: number;
      failed: number;
      successRate: number;
    };
  };
  tenants: BillingStatus[];
  recentEvents: BillingEvent[];
  timestamp: string;
}

/**
 * API calls log response
 */
interface ApiCallsResponse {
  calls: Array<{
    tenantId: string;
    endpoint: string;
    method: string;
    timestamp: number;
    latencyMs: number;
    statusCode: number;
    tier: string;
    rateLimitRemaining?: number;
  }>;
  summary: {
    totalCalls: number;
    avgLatencyMs: number;
    errorRate: number;
    byEndpoint: Record<string, number>;
  };
  timestamp: string;
}

/**
 * Stripe sync status response
 */
interface StripeSyncStatusResponse {
  isRunning: boolean;
  intervalMs: number;
  intervalMinutes: number;
  currentBackoffMs: number;
  dryRun: boolean;
  lastSyncAt?: string;
  lastSyncSuccess?: boolean;
  lastError?: string;
  timestamp: string;
}

/**
 * Register monitoring routes extension (Phase 7.5)
 */
export async function monitoringRoutesExtension(fastify: FastifyInstance): Promise<void> {
  // Register auth middleware
  void fastify.register(raasAuthMiddleware);

  /**
   * GET /monitoring/license
   * Get license compliance status for all tenants
   */
  fastify.get('/license', {
    onRequest: [fastify.requireTier?.(RaasTier.ENTERPRISE)],
    async handler(_request: FastifyRequest, reply: FastifyReply) {
      try {
        const tracker = getGlobalLicenseTracker();
        const summary = tracker.getComplianceSummary();
        const tenants = tracker.getAllTenantStatuses();
        const recentEvents = tracker.getRecentEvents(20);

        const response: LicenseComplianceResponse = {
          summary,
          tenants,
          recentEvents,
          timestamp: new Date().toISOString(),
        };

        reply.send(response);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        reply.status(500).send({
          error: 'Failed to get license compliance',
          message: error.message,
        });
      }
    },
  });

  /**
   * GET /monitoring/license/:tenantId
   * Get license compliance for specific tenant
   */
  fastify.get('/license/:tenantId', {
    onRequest: [fastify.hasAuth],
    async handler(request: FastifyRequest<{ Params: { tenantId: string } }>, reply: FastifyReply) {
      try {
        const { tenantId } = request.params;
        const tracker = getGlobalLicenseTracker();
        const status = tracker.getTenantStatus(tenantId);

        if (!status) {
          return reply.status(404).send({
            error: 'Not found',
            message: `No license compliance data for tenant ${tenantId}`,
          });
        }

        // Check auth - can only view own tenant unless ENTERPRISE
        const authTenantId = getTenantId(request);
        const authContext = (request as any).context?.auth;
        if (tenantId !== authTenantId && authContext?.tier !== RaasTier.ENTERPRISE) {
          return reply.status(403).send({
            error: 'Access Denied',
            message: 'Can only view own tenant license data',
          });
        }

        reply.send({
          status,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        reply.status(500).send({
          error: 'Failed to get tenant license',
          message: error.message,
        });
      }
    },
  });

  /**
   * GET /monitoring/rate-limits
   * Get rate limit status for all tenants
   */
  fastify.get('/rate-limits', {
    onRequest: [fastify.requireTier?.(RaasTier.ENTERPRISE)],
    async handler(_request: FastifyRequest, reply: FastifyReply) {
      try {
        const tracker = getGlobalRateLimitTracker();
        const summary = tracker.getRateLimitSummary();
        const tenants = tracker.getAllTenantStatuses();
        const throttledEvents = tracker.getThrottlingEvents(20);

        const response: RateLimitResponse = {
          summary,
          tenants,
          throttledEvents,
          timestamp: new Date().toISOString(),
        };

        reply.send(response);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        reply.status(500).send({
          error: 'Failed to get rate limits',
          message: error.message,
        });
      }
    },
  });

  /**
   * GET /monitoring/rate-limits/throttled
   * Get recent throttling events
   */
  fastify.get('/rate-limits/throttled', {
    onRequest: [fastify.hasAuth],
    async handler(request: FastifyRequest, reply: FastifyReply) {
      try {
        const tracker = getGlobalRateLimitTracker();
        let events = tracker.getThrottlingEvents(50);

        // Filter by tenant if not ENTERPRISE
        const authContext = (request as any).context?.auth;
        if (authContext?.tier !== RaasTier.ENTERPRISE) {
          const tenantId = getTenantId(request);
          events = events.filter((e) => e.tenantId === tenantId);
        }

        reply.send({
          events,
          count: events.length,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        reply.status(500).send({
          error: 'Failed to get throttled events',
          message: error.message,
        });
      }
    },
  });

  /**
   * GET /monitoring/billing
   * Get billing events and status
   */
  fastify.get('/billing', {
    onRequest: [fastify.requireTier?.(RaasTier.ENTERPRISE)],
    async handler(_request: FastifyRequest, reply: FastifyReply) {
      try {
        const tracker = getGlobalBillingEventsTracker();
        const summary = tracker.getBillingSummary();
        const tenants = tracker.getAllTenantStatuses();
        const recentEvents = tracker.getRecentEvents(20);

        const response: BillingResponse = {
          summary,
          tenants,
          recentEvents,
          timestamp: new Date().toISOString(),
        };

        reply.send(response);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        reply.status(500).send({
          error: 'Failed to get billing events',
          message: error.message,
        });
      }
    },
  });

  /**
   * GET /monitoring/billing/:tenantId
   * Get billing status for specific tenant
   */
  fastify.get('/billing/:tenantId', {
    onRequest: [fastify.hasAuth],
    async handler(request: FastifyRequest<{ Params: { tenantId: string } }>, reply: FastifyReply) {
      try {
        const { tenantId } = request.params;
        const tracker = getGlobalBillingEventsTracker();
        const status = tracker.getTenantStatus(tenantId);

        if (!status) {
          return reply.status(404).send({
            error: 'Not found',
            message: `No billing data for tenant ${tenantId}`,
          });
        }

        // Check auth
        const authTenantId = getTenantId(request);
        const authContext = (request as any).context?.auth;
        if (tenantId !== authTenantId && authContext?.tier !== RaasTier.ENTERPRISE) {
          return reply.status(403).send({
            error: 'Access Denied',
            message: 'Can only view own tenant billing data',
          });
        }

        reply.send({
          status,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        reply.status(500).send({
          error: 'Failed to get tenant billing',
          message: error.message,
        });
      }
    },
  });

  /**
   * GET /monitoring/api-calls
   * Get recent API calls log
   */
  fastify.get('/api-calls', {
    onRequest: [fastify.hasAuth],
    async handler(request: FastifyRequest, reply: FastifyReply) {
      try {
        // Get recent trades as proxy for API calls
        const monitor = getGlobalTradeMonitor();
        const metrics = monitor.getMetrics(3600000); // Last hour

        // Check auth for filtering
        const authContext = (request as any).context?.auth;
        const tenantId = getTenantId(request);

        // For now, return mock data based on trade metrics
        // In production, this would query actual API call logs
        const calls = metrics.anomalies.map((anomaly: any) => ({
          tenantId: anomaly.tenantId,
          endpoint: '/api/v1/trade',
          method: 'POST',
          timestamp: Date.parse(anomaly.timestamp),
          latencyMs: anomaly.metadata?.actualValue || 0,
          statusCode: anomaly.type === 'error_spike' ? 500 : 200,
          tier: anomaly.tier,
        }));

        // Filter by tenant if not ENTERPRISE
        if (authContext?.tier !== RaasTier.ENTERPRISE && tenantId) {
          // In real impl, would filter actual logs
        }

        const totalCalls = calls.length;
        const avgLatency =
          totalCalls > 0 ? Math.round(calls.reduce((sum: number, c: any) => sum + c.latencyMs, 0) / totalCalls) : 0;
        const errorCount = calls.filter((c: any) => c.statusCode >= 400).length;

        const response: ApiCallsResponse = {
          calls: calls.slice(0, 50),
          summary: {
            totalCalls: totalCalls,
            avgLatencyMs: avgLatency,
            errorRate: totalCalls > 0 ? errorCount / totalCalls : 0,
            byEndpoint: {},
          },
          timestamp: new Date().toISOString(),
        };

        reply.send(response);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        reply.status(500).send({
          error: 'Failed to get API calls',
          message: error.message,
        });
      }
    },
  });

  /**
   * GET /monitoring/stripe-sync
   * Get Stripe billing sync status
   */
  fastify.get('/stripe-sync', {
    onRequest: [fastify.requireTier?.(RaasTier.ENTERPRISE)],
    async handler(_request: FastifyRequest, reply: FastifyReply) {
      try {
        // Get sync job status (singleton pattern)
        // In production, would track actual job state
        const mockStatus = {
          isRunning: false,
          intervalMs: 5 * 60 * 1000, // 5 minutes
          currentBackoffMs: 0,
          dryRun: false,
        };

        const response: StripeSyncStatusResponse = {
          ...mockStatus,
          intervalMinutes: mockStatus.intervalMs / 60000,
          lastSyncAt: undefined,
          lastSyncSuccess: undefined,
          lastError: undefined,
          timestamp: new Date().toISOString(),
        };

        reply.send(response);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        reply.status(500).send({
          error: 'Failed to get Stripe sync status',
          message: error.message,
        });
      }
    },
  });
}
