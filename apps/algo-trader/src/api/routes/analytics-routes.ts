/**
 * Analytics API Routes — Revenue & Usage Metrics
 *
 * Provides analytics endpoints for revenue tracking and license metrics.
 * All routes require ADMIN license tier for access control.
 *
 * Endpoints:
 * - GET /api/v1/analytics/revenue — MRR + revenue trends
 * - GET /api/v1/analytics/active-licenses — DAL metric
 * - GET /api/v1/analytics/churn — Churn rate
 * - GET /api/v1/analytics/by-tier — Revenue breakdown
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { revenueAnalytics, RevenueAnalyticsService } from '../../analytics/revenue-analytics';
import { analyticsService, AnalyticsPeriod } from '../../analytics/analytics-service';
import { licenseAuthPlugin } from '../middleware/license-auth-middleware';
import { LicenseTier } from '../../lib/raas-gate';

/**
 * Revenue response schema
 */
interface RevenueResponse {
  mrr: {
    month: string;
    totalMRR: number;
    byTier: Record<string, number>;
    activeSubscriptions: number;
    growthRate?: number;
  };
  trend: Array<{
    month: string;
    totalMRR: number;
    growthRate?: number;
  }>;
}

/**
 * Active licenses response schema
 */
interface ActiveLicensesResponse {
  date: string;
  totalLicenses: number;
  byTier: Record<string, number>;
  licensesWithActivity: number;
  activityRate: number;
}

/**
 * Churn rate response schema
 */
interface ChurnRateResponse {
  month: string;
  churnRate: number;
  cancellations: number;
  startSubscriptions: number;
  byTier: Record<string, number>;
}

/**
 * Revenue by tier response schema
 */
interface RevenueByTierResponse {
  month: string;
  totalRevenue: number;
  tiers: Array<{
    tier: string;
    revenue: number;
    percentage: number;
    subscriptionCount: number;
  }>;
}

/**
 * License analytics response schema
 */
interface LicenseAnalyticsResponse {
  total: number;
  byTier: { free: number; pro: number; enterprise: number };
  byStatus: { active: number; revoked: number; expired: number };
  usage: {
    apiCalls: number;
    mlFeatures: number;
    premiumData: number;
  };
  revenue: {
    monthly: number;
    projected: number;
  };
  recentActivity: Array<{
    event: string;
    timestamp: string;
    licenseId: string;
    details?: string;
  }>;
  dailyBreakdown: Array<{
    date: string;
    apiCalls: number;
    activeLicenses: number;
  }>;
}

/**
 * Quota response schema
 */
interface QuotaResponse {
  tenantId: string;
  apiCalls: number;
  apiCallsLimit: number;
  mlPredictions: number;
  mlPredictionsLimit: number;
  dataPoints: number;
  dataPointsLimit: number;
  resetDate: string;
}

/**
 * Register analytics routes
 */
export async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  // Register admin-only auth plugin for all analytics routes
  void fastify.register(licenseAuthPlugin, { requiredTier: LicenseTier.ENTERPRISE });

  /**
   * GET /api/v1/analytics/revenue
   * Get Monthly Recurring Revenue (MRR) and revenue trends
   *
   * Query params:
   * - month: YYYY-MM format (optional, defaults to current month)
   */
  fastify.get('/revenue', async (request, reply) => {
    try {
      const { month } = request.query as { month?: string };
      const targetMonth = month || getCurrentMonth();

      // Get MRR for target month
      const mrrData = await revenueAnalytics.getMRR(targetMonth);

      // Calculate trend (last 6 months)
      const trend = await calculateMRRtrend(targetMonth, 6);

      const response: RevenueResponse = {
        mrr: {
          month: mrrData.month,
          totalMRR: mrrData.totalMRR,
          byTier: mrrData.byTier as Record<string, number>,
          activeSubscriptions: mrrData.activeSubscriptions,
          growthRate: mrrData.growthRate,
        },
        trend,
      };

      reply.send(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      request.log.error({ error: error.message }, 'Failed to get revenue analytics');
      reply.status(500).send({
        error: 'Failed to get revenue analytics',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/v1/analytics/active-licenses
   * Get Daily Active Licenses (DAL) metric
   *
   * Query params:
   * - date: YYYY-MM-DD format (optional, defaults to today)
   */
  fastify.get('/active-licenses', async (request, reply) => {
    try {
      const { date } = request.query as { date?: string };
      const targetDate = date || getCurrentDate();

      const dalData = await revenueAnalytics.getDAL(targetDate);

      const response: ActiveLicensesResponse = {
        date: dalData.date,
        totalLicenses: dalData.totalLicenses,
        byTier: dalData.byTier as Record<string, number>,
        licensesWithActivity: dalData.licensesWithActivity,
        activityRate: dalData.totalLicenses > 0
          ? (dalData.licensesWithActivity / dalData.totalLicenses) * 100
          : 0,
      };

      reply.send(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      request.log.error({ error: error.message }, 'Failed to get active licenses');
      reply.status(500).send({
        error: 'Failed to get active licenses',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/v1/analytics/churn
   * Get churn rate analysis
   *
   * Query params:
   * - month: YYYY-MM format (optional, defaults to current month)
   */
  fastify.get('/churn', async (request, reply) => {
    try {
      const { month } = request.query as { month?: string };
      const targetMonth = month || getCurrentMonth();

      const churnData = await revenueAnalytics.getChurnRate(targetMonth);

      const response: ChurnRateResponse = {
        month: churnData.month,
        churnRate: churnData.churnRate,
        cancellations: churnData.cancellations,
        startSubscriptions: churnData.startSubscriptions,
        byTier: churnData.byTier as Record<string, number>,
      };

      reply.send(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      request.log.error({ error: error.message }, 'Failed to get churn rate');
      reply.status(500).send({
        error: 'Failed to get churn rate',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/v1/analytics/by-tier
   * Get revenue breakdown by subscription tier
   *
   * Query params:
   * - month: YYYY-MM format (optional, defaults to current month)
   */
  fastify.get('/by-tier', async (request, reply) => {
    try {
      const { month } = request.query as { month?: string };
      const targetMonth = month || getCurrentMonth();

      const tierData = await revenueAnalytics.getRevenueByTier(targetMonth);

      const response: RevenueByTierResponse = {
        month: tierData.month,
        totalRevenue: tierData.totalRevenue,
        tiers: tierData.tiers.map(t => ({
          tier: t.tier,
          revenue: t.revenue,
          percentage: t.percentage,
          subscriptionCount: t.subscriptionCount,
        })),
      };

      reply.send(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      request.log.error({ error: error.message }, 'Failed to get revenue by tier');
      reply.status(500).send({
        error: 'Failed to get revenue by tier',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/v1/analytics/usage-revenue
   * Get usage-based revenue from overage charges
   *
   * Query params:
   * - month: YYYY-MM format (optional, defaults to current month)
   */
  fastify.get('/usage-revenue', async (request, reply) => {
    try {
      const { month } = request.query as { month?: string };
      const targetMonth = month || getCurrentMonth();

      const usageRevenue = await revenueAnalytics.getUsageRevenue(targetMonth);

      reply.send({
        month: usageRevenue.month,
        totalUsageRevenue: usageRevenue.totalUsageRevenue,
        byLicense: usageRevenue.byLicense,
        overageMetrics: usageRevenue.overageMetrics,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      request.log.error({ error: error.message }, 'Failed to get usage revenue');
      reply.status(500).send({
        error: 'Failed to get usage revenue',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/v1/analytics/usage
   * Get usage metrics for dashboard (API calls, active licenses, quota utilization)
   *
   * Query params:
   * - period: 24h | 7d | 30d | 90d (default: 7d)
   */
  fastify.get('/usage', async (request, reply) => {
    try {
      const { period } = request.query as { period?: AnalyticsPeriod };
      const targetPeriod = period || '7d';

      const metrics = await analyticsService.getUsageMetrics(targetPeriod);

      reply.send({
        success: true,
        ...metrics,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      request.log.error({ error: error.message }, 'Failed to get usage metrics');
      reply.status(500).send({
        error: 'Failed to get usage metrics',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/v1/analytics/top-endpoints
   * Get top consuming endpoints
   *
   * Query params:
   * - limit: Max endpoints (default: 10)
   */
  fastify.get('/top-endpoints', async (request, reply) => {
    try {
      const { limit } = request.query as { limit?: string };
      const targetLimit = parseInt(limit || '10', 10);

      const endpoints = await analyticsService.getTopEndpoints(targetLimit);

      reply.send({
        success: true,
        endpoints,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      request.log.error({ error: error.message }, 'Failed to get top endpoints');
      reply.status(500).send({
        error: 'Failed to get top endpoints',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/v1/analytics/export
   * Export usage data to CSV
   *
   * Query params:
   * - period: 24h | 7d | 30d | 90d (default: 7d)
   */
  fastify.get('/export', async (request, reply) => {
    try {
      const { period } = request.query as { period?: AnalyticsPeriod };
      const targetPeriod = period || '7d';

      const metrics = await analyticsService.getUsageMetrics(targetPeriod);

      // Generate CSV
      const csvRows = [
        ['Date', 'API Calls', 'Backtest Runs', 'Trade Executions', 'ML Inferences'],
        ...metrics.dailyBreakdown.map(d => [
          d.date,
          d.apiCalls,
          d.backtestRuns,
          d.tradeExecutions,
          d.mlInferences,
        ]),
      ];

      const csv = csvRows.map(row => row.join(',')).join('\n');

      reply.header('Content-Type', 'text/csv');
      reply.header(
        'Content-Disposition',
        `attachment; filename="analytics-${targetPeriod}-${Date.now()}.csv"`
      );

      reply.send(csv);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      request.log.error({ error: error.message }, 'Failed to export analytics');
      reply.status(500).send({
        error: 'Failed to export analytics',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/v1/analytics/licenses/analytics
   * Get comprehensive license analytics for dashboard
   *
   * Query params:
   * - period: 7d | 30d | 90d (default: 30d)
   * - licenseKey: Filter by specific license (optional)
   */
  fastify.get('/licenses/analytics', async (request, reply) => {
    try {
      const { period = '30d', licenseKey } = request.query as { period?: '7d' | '30d' | '90d'; licenseKey?: string };

      // Get usage metrics
      const metrics = await analyticsService.getUsageMetrics(period);

      // Get revenue metrics
      const currentMonth = getCurrentMonth();
      const mrrData = await revenueAnalytics.getMRR(currentMonth);

      // Build response
      const response: LicenseAnalyticsResponse = {
        total: metrics.activeLicenses,
        byTier: {
          free: metrics.byTier.find(t => t.tier === 'FREE')?.count || 0,
          pro: metrics.byTier.find(t => t.tier === 'PRO')?.count || 0,
          enterprise: metrics.byTier.find(t => t.tier === 'ENTERPRISE')?.count || 0,
        },
        byStatus: {
          active: metrics.activeLicenses,
          revoked: 0,
          expired: 0,
        },
        usage: {
          apiCalls: metrics.totalApiCalls,
          mlFeatures: metrics.dailyBreakdown.reduce((sum, d) => sum + d.mlInferences, 0),
          premiumData: 0,
        },
        revenue: {
          monthly: mrrData.totalMRR,
          projected: mrrData.totalMRR * (1 + (mrrData.growthRate || 0) / 100),
        },
        recentActivity: metrics.dailyBreakdown.slice(-10).map(d => ({
          event: 'api_usage',
          timestamp: `${d.date}T00:00:00Z`,
          licenseId: licenseKey || 'system',
          details: `${d.apiCalls} API calls`,
        })),
        dailyBreakdown: metrics.dailyBreakdown.map(d => ({
          date: d.date,
          apiCalls: d.apiCalls,
          activeLicenses: Math.round(metrics.activeLicenses / metrics.dailyBreakdown.length),
        })),
      };

      reply.send(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      request.log.error({ error: error.message }, 'Failed to get license analytics');
      reply.status(500).send({
        error: 'Failed to get license analytics',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/v1/analytics/licenses/analytics/quota
   * Get quota utilization for a specific tenant
   *
   * Query params:
   * - tenantId: Tenant identifier (required)
   */
  fastify.get('/licenses/analytics/quota', async (request, reply) => {
    try {
      const { tenantId } = request.query as { tenantId: string };

      if (!tenantId) {
        return reply.status(400).send({
          error: 'Missing tenantId parameter',
        });
      }

      // Get usage from tracker
      const tracker = (await import('../../metering/usage-tracker-service')).UsageTrackerService.getInstance();
      const currentMonth = getCurrentMonth();
      const usage = await tracker.getUsage(tenantId, currentMonth);

      // Mock quota limits (in production, query subscription service)
      const tierLimits = {
        FREE: { apiCalls: 1000, mlPredictions: 100, dataPoints: 10000 },
        PRO: { apiCalls: 10000, mlPredictions: 1000, dataPoints: 100000 },
        ENTERPRISE: { apiCalls: 100000, mlPredictions: 10000, dataPoints: 1000000 },
      };

      // Determine tier from tenant ID (mock - in production, query subscription)
      const tier = tenantId.includes('enterprise') ? 'ENTERPRISE' :
                   tenantId.includes('pro') ? 'PRO' : 'FREE';
      const limits = tierLimits[tier];

      const response: QuotaResponse = {
        tenantId,
        apiCalls: usage.byEventType['api_call'] || 0,
        apiCallsLimit: limits.apiCalls,
        mlPredictions: usage.byEventType['ml_inference'] || 0,
        mlPredictionsLimit: limits.mlPredictions,
        dataPoints: usage.byEventType['data_point'] || 0,
        dataPointsLimit: limits.dataPoints,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      };

      reply.send(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      request.log.error({ error: error.message }, 'Failed to get quota');
      reply.status(500).send({
        error: 'Failed to get quota',
        message: error.message,
      });
    }
  });
}

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate MRR trend for the last N months
 */
async function calculateMRRtrend(
  currentMonth: string,
  monthsBack: number
): Promise<Array<{ month: string; totalMRR: number; growthRate?: number }>> {
  const trend: Array<{ month: string; totalMRR: number; growthRate?: number }> = [];
  const analyticsService = RevenueAnalyticsService.getInstance();

  let [year, monthNum] = currentMonth.split('-').map(Number);
  let prevMRR: number | undefined;

  for (let i = 0; i < monthsBack; i++) {
    // Calculate month
    let currentMonthNum = monthNum - i;
    let currentYear = year;

    while (currentMonthNum <= 0) {
      currentMonthNum += 12;
      currentYear--;
    }

    const monthStr = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

    try {
      const mrrData = await analyticsService.getMRR(monthStr);
      const growthRate = prevMRR && prevMRR > 0
        ? ((mrrData.totalMRR - prevMRR) / prevMRR) * 100
        : undefined;

      trend.unshift({
        month: monthStr,
        totalMRR: mrrData.totalMRR,
        growthRate,
      });

      prevMRR = mrrData.totalMRR;
    } catch (err) {
      // Month might not have data, skip
      continue;
    }
  }

  return trend;
}
