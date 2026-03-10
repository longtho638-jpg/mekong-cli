/**
 * Monitoring API Routes — Trade Metrics & Anomaly Detection
 *
 * Provides real-time monitoring endpoints for trade execution metrics,
 * latency percentiles, error rates, and anomaly events.
 *
 * Endpoints:
 * - GET /monitoring/trades?windowMs=3600000 — Trade metrics over time window
 * - GET /monitoring/metrics?tenantId=xxx — Tenant-specific metrics
 * - GET /monitoring/anomalies?since=ISO — Anomaly events since timestamp
 *
 * @see ../lib/raas-auth-middleware — JWT & API key authentication
 * @see ../monitoring/trade-monitor-service — TradeMonitorService
 * @see ../monitoring/anomaly-detector — AnomalyDetector
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getGlobalTradeMonitor } from '../../monitoring/trade-monitor-service';
import { AnomalyDetector, type AnomalyEvent } from '../../monitoring/anomaly-detector';
import { raasAuthMiddleware, getTenantId } from '../../lib/raas-auth-middleware';
import { RaasTier } from '../../lib/raas-auth-middleware';
import { monitoringRoutesExtension } from './monitoring-routes-extension';

// Augment FastifyInstance with auth decorators from raasAuthMiddleware
declare module 'fastify' {
  interface FastifyInstance {
    hasAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireTier: (tier: RaasTier) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Trade metrics response schema
 */
interface TradeMetricsResponse {
  totalTrades: number;
  successRate: number;
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  anomalyCount: number;
  windowMs: number;
  timestamp: string;
}

/**
 * Anomaly event response schema
 */
interface AnomalyResponse {
  tenantId: string;
  tier: string;
  type: string;
  severity: string;
  timestamp: string;
  metadata?: {
    actualValue?: number;
    threshold?: number;
    windowMs?: number;
  };
}

/**
 * Tier thresholds response schema
 */
interface TierThresholdsResponse {
  tier: string;
  latencyMs: number;
  errorRate: number;
  usageMultiplier: number;
}

/**
 * Monitoring routes query params
 */
interface TradesQuery {
  windowMs?: number;
}

interface MetricsQuery {
  tenantId?: string;
  windowMs?: number;
}

interface AnomaliesQuery {
  since?: string;
}

/**
 * Register monitoring routes
 */
export async function monitoringRoutes(fastify: FastifyInstance): Promise<void> {
  // Register auth middleware for monitoring routes
  void fastify.register(raasAuthMiddleware);

  /**
   * GET /monitoring/trades
   * Get trade metrics over a time window
   *
   * Query params:
   * - windowMs: Time window in milliseconds (default: 3600000 = 1 hour)
   *
   * Requires authentication via JWT or API key
   */
  fastify.get('/trades', {
    onRequest: [fastify.hasAuth],
    async handler(request: FastifyRequest<{ Querystring: TradesQuery }>, reply: FastifyReply) {
      try {
        const windowMs = request.query.windowMs || 3600000;
        const monitor = getGlobalTradeMonitor();
        const metrics = monitor.getMetrics(windowMs);

        const response: TradeMetricsResponse = {
          totalTrades: metrics.totalTrades,
          successRate: Math.round(metrics.successRate * 10000) / 10000, // 4 decimal places
          latency: {
            p50: Math.round(metrics.latency.p50 * 100) / 100,
            p95: Math.round(metrics.latency.p95 * 100) / 100,
            p99: Math.round(metrics.latency.p99 * 100) / 100,
          },
          errorRate: Math.round(metrics.errorRate * 10000) / 10000,
          anomalyCount: metrics.anomalies.length,
          windowMs,
          timestamp: new Date().toISOString(),
        };

        reply.send(response);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        request.log.error({ error: error.message }, 'Failed to get trade metrics');
        reply.status(500).send({
          error: 'Failed to get trade metrics',
          message: error.message,
        });
      }
    },
  });

  /**
   * GET /monitoring/metrics
   * Get tenant-specific metrics
   *
   * Query params:
   * - tenantId: Tenant ID (optional, uses authenticated tenant if not provided)
   *
   * Requires authentication via JWT or API key
   */
  fastify.get('/metrics', {
    onRequest: [fastify.hasAuth],
    async handler(
      request: FastifyRequest<{ Querystring: MetricsQuery }>,
      reply: FastifyReply
    ) {
      try {
        // Get tenant from query or auth context
        let tenantId = request.query.tenantId;
        if (!tenantId) {
          tenantId = getTenantId(request) || undefined;
        }

        if (!tenantId) {
          return reply.status(400).send({
            error: 'Missing tenantId',
            message: 'Provide tenantId query param or authenticate first',
          });
        }

        const monitor = getGlobalTradeMonitor();
        const windowMs = request.query.windowMs as number | undefined || 3600000;
        const metrics = monitor.getMetrics(windowMs);

        // Get tenant tier from auth context
        const authContext = (request as any).context?.auth;
        const tier = authContext?.tier || RaasTier.FREE;

        const response = {
          tenantId,
          tier,
          metrics: {
            totalTrades: metrics.totalTrades,
            successRate: Math.round(metrics.successRate * 10000) / 10000,
            latency: {
              p50: Math.round(metrics.latency.p50 * 100) / 100,
              p95: Math.round(metrics.latency.p95 * 100) / 100,
              p99: Math.round(metrics.latency.p99 * 100) / 100,
            },
            errorRate: Math.round(metrics.errorRate * 10000) / 10000,
            anomalies: metrics.anomalies.map(mapAnomalyToResponse),
          },
          timestamp: new Date().toISOString(),
        };

        reply.send(response);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        request.log.error({ error: error.message }, 'Failed to get tenant metrics');
        reply.status(500).send({
          error: 'Failed to get tenant metrics',
          message: error.message,
        });
      }
    },
  });

  /**
   * GET /monitoring/anomalies
   * Get anomaly events since a timestamp
   *
   * Query params:
   * - since: ISO 8601 timestamp or milliseconds since epoch (default: last hour)
   * - tenantId: Filter by tenant (optional)
   * - severity: Filter by severity 'warning' | 'critical' (optional)
   *
   * Requires authentication (ENTERPRISE tier for cross-tenant view)
   */
  fastify.get('/anomalies', {
    onRequest: [fastify.hasAuth],
    async handler(
      request: FastifyRequest<{ Querystring: AnomaliesQuery }>,
      reply: FastifyReply
    ) {
      try {
        const { since } = request.query;
        const tenantId = (request.query as any).tenantId;
        const severity = (request.query as any).severity;

        // Parse since parameter
        let sinceMs = 3600000; // Default: last hour
        if (since) {
          const parsed = Date.parse(since);
          if (!isNaN(parsed)) {
            sinceMs = Date.now() - parsed; // Convert to "since X ms ago"
          } else {
            const msFromIso = parseInt(since, 10);
            if (!isNaN(msFromIso)) {
              sinceMs = msFromIso;
            }
          }
        }

        const monitor = getGlobalTradeMonitor();
        let anomalies = monitor.getAnomalies(sinceMs);

        // Filter by tenant if provided
        if (tenantId) {
          // Check if user has access to view other tenants
          const authContext = (request as any).context?.auth;
          const userTenantId = getTenantId(request);

          if (tenantId !== userTenantId) {
            // Cross-tenant view requires ENTERPRISE tier
            if (authContext?.tier !== RaasTier.ENTERPRISE) {
              return reply.status(403).send({
                error: 'Access Denied',
                message: 'Cross-tenant anomaly view requires ENTERPRISE tier',
              });
            }
          }

          anomalies = anomalies.filter((a) => a.tenantId === tenantId);
        }

        // Filter by severity if provided
        if (severity === 'warning' || severity === 'critical') {
          anomalies = anomalies.filter((a) => a.severity === severity);
        }

        reply.send({
          anomalies: anomalies.map(mapAnomalyToResponse),
          count: anomalies.length,
          sinceMs,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        request.log.error({ error: error.message }, 'Failed to get anomalies');
        reply.status(500).send({
          error: 'Failed to get anomalies',
          message: error.message,
        });
      }
    },
  });

  /**
   * GET /monitoring/thresholds
   * Get tier-based threshold configuration
   *
   * Returns the latency, error rate, and usage thresholds for each tier.
   * Useful for debugging and admin dashboards.
   *
   * Requires authentication (ENTERPRISE tier)
   */
  fastify.get('/thresholds', {
    onRequest: [fastify.requireTier?.(RaasTier.ENTERPRISE)],
    async handler(request: FastifyRequest, reply: FastifyReply) {
      try {
        const detector = new AnomalyDetector();
        const thresholds = detector.getAllTierThresholds();

        const response: TierThresholdsResponse[] = Object.entries(thresholds).map(
          ([tier, config]) => ({
            tier,
            latencyMs: config.latencyMs,
            errorRate: config.errorRate,
            usageMultiplier: config.usageMultiplier,
          })
        );

        reply.send({
          thresholds: response,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        request.log.error({ error: error.message }, 'Failed to get thresholds');
        reply.status(500).send({
          error: 'Failed to get thresholds',
          message: error.message,
        });
      }
    },
  });

  /**
   * GET /monitoring/health
   * Get monitoring service health status
   *
   * Lightweight endpoint for health checks.
   * No authentication required.
   */
  fastify.get('/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    const monitor = getGlobalTradeMonitor();
    const metrics = monitor.getMetrics(300000); // Last 5 minutes

    reply.send({
      status: 'healthy',
      uptime: process.uptime(),
      metrics: {
        totalTrades: metrics.totalTrades,
        errorRate: metrics.errorRate,
        p95Latency: metrics.latency.p95,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Register Phase 7.5 extension routes
  void fastify.register(monitoringRoutesExtension);
}

/**
 * Map internal anomaly event to response schema
 */
function mapAnomalyToResponse(anomaly: AnomalyEvent): AnomalyResponse {
  return {
    tenantId: anomaly.tenantId,
    tier: anomaly.tier,
    type: anomaly.type,
    severity: anomaly.severity,
    timestamp: new Date(anomaly.timestamp).toISOString(),
    metadata: anomaly.metadata,
  };
}
