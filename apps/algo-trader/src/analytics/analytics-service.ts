/**
 * Analytics Service — Usage Metrics & Aggregation
 *
 * Provides analytics data for dashboard:
 * - Daily/weekly/monthly API call volume
 * - Active license keys
 * - Quota utilization
 * - Top-consuming endpoints
 *
 * Usage:
 * ```typescript
 * const analytics = new AnalyticsService();
 * const metrics = await analytics.getUsageMetrics({ period: '7d' });
 * const topEndpoints = await analytics.getTopEndpoints({ limit: 10 });
 * ```
 */

import { UsageTrackerService, UsageEvent } from '../metering/usage-tracker-service';
import { logger } from '../utils/logger';

/**
 * Time range for analytics queries
 */
export type AnalyticsPeriod = '24h' | '7d' | '30d' | '90d';

/**
 * Usage metrics response
 */
export interface UsageMetrics {
  /** Total API calls in period */
  totalApiCalls: number;
  /** Daily breakdown */
  dailyBreakdown: DailyMetric[];
  /** Active licenses count */
  activeLicenses: number;
  /** Top endpoints by usage */
  topEndpoints: EndpointMetric[];
  /** License tier breakdown */
  byTier: TierMetric[];
  /** Quota utilization */
  quotaUtilization: QuotaMetric[];
}

/**
 * Daily metric data point
 */
export interface DailyMetric {
  date: string; // YYYY-MM-DD
  apiCalls: number;
  backtestRuns: number;
  tradeExecutions: number;
  mlInferences: number;
}

/**
 * Endpoint metric
 */
export interface EndpointMetric {
  endpoint: string;
  count: number;
  avgLatencyMs: number;
}

/**
 * Tier metric
 */
export interface TierMetric {
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  count: number;
  percentage: number;
}

/**
 * Quota utilization metric
 */
export interface QuotaMetric {
  licenseKey: string;
  used: number;
  limit: number;
  percentage: number;
  resetDate: string;
}

export class AnalyticsService {
  private tracker: UsageTrackerService;

  constructor() {
    this.tracker = UsageTrackerService.getInstance();
  }

  /**
   * Get usage metrics for dashboard
   */
  async getUsageMetrics(period: AnalyticsPeriod = '7d'): Promise<UsageMetrics> {
    const now = new Date();
    const startTime = this.getStartTime(period, now);

    logger.info('[Analytics] Getting usage metrics', { period, startTime });

    // Get all usage events
    const allEvents = await this.tracker.getUsageFiltered('', startTime.toISOString(), now.toISOString());

    // Filter to period
    const periodEvents = allEvents.filter(e => new Date(e.timestamp) >= startTime);

    // Calculate metrics
    const totalApiCalls = periodEvents.filter(e => e.eventType === 'api_call').length;
    const activeLicenses = new Set(periodEvents.map(e => e.licenseKey)).size;

    // Daily breakdown
    const dailyBreakdown = this.calculateDailyBreakdown(periodEvents, period);

    // Top endpoints
    const topEndpoints = this.calculateTopEndpoints(periodEvents, 10);

    // Tier breakdown (mock - would need license service integration)
    const byTier = this.calculateTierBreakdown(activeLicenses);

    // Quota utilization
    const quotaUtilization = await this.calculateQuotaUtilization(periodEvents);

    return {
      totalApiCalls,
      dailyBreakdown,
      activeLicenses,
      topEndpoints,
      byTier,
      quotaUtilization,
    };
  }

  /**
   * Get top consuming endpoints
   */
  async getTopEndpoints(limit: number = 10): Promise<EndpointMetric[]> {
    const allEvents = await this.tracker.getUsageFiltered('', undefined, undefined);
    return this.calculateTopEndpoints(allEvents, limit);
  }

  /**
   * Get active licenses count
   */
  async getActiveLicenses(period: AnalyticsPeriod = '7d'): Promise<number> {
    const now = new Date();
    const startTime = this.getStartTime(period, now);
    const events = await this.tracker.getUsageFiltered('', startTime.toISOString(), now.toISOString());
    return new Set(events.map(e => e.licenseKey)).size;
  }

  /**
   * Helper: Calculate start time based on period
   */
  private getStartTime(period: AnalyticsPeriod, now: Date): Date {
    switch (period) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Helper: Calculate daily breakdown
   */
  private calculateDailyBreakdown(events: UsageEvent[], period: AnalyticsPeriod): DailyMetric[] {
    const days = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const result: DailyMetric[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);

      const dayEvents = events.filter(e => e.timestamp.startsWith(dateStr));

      result.push({
        date: dateStr,
        apiCalls: dayEvents.filter(e => e.eventType === 'api_call').length,
        backtestRuns: dayEvents.filter(e => e.eventType === 'backtest_run').length,
        tradeExecutions: dayEvents.filter(e => e.eventType === 'trade_execution').length,
        mlInferences: dayEvents.filter(e => e.eventType === 'ml_inference').length,
      });
    }

    return result;
  }

  /**
   * Helper: Calculate top endpoints
   */
  private calculateTopEndpoints(events: UsageEvent[], limit: number): EndpointMetric[] {
    const endpointCounts = new Map<string, { count: number; latencies: number[] }>();

    for (const event of events) {
      const endpoint = (event.metadata?.endpoint as string) || 'unknown';
      const latency = (event.metadata?.durationMs as number) || 0;

      if (!endpointCounts.has(endpoint)) {
        endpointCounts.set(endpoint, { count: 0, latencies: [] });
      }

      const data = endpointCounts.get(endpoint)!;
      data.count++;
      data.latencies.push(latency);
    }

    return Array.from(endpointCounts.entries())
      .map(([endpoint, data]) => ({
        endpoint,
        count: data.count,
        avgLatencyMs: Math.round(data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Helper: Calculate tier breakdown (mock implementation)
   */
  private calculateTierBreakdown(totalLicenses: number): TierMetric[] {
    // Mock distribution - in production, query license service
    const freeCount = Math.round(totalLicenses * 0.6);
    const proCount = Math.round(totalLicenses * 0.3);
    const enterpriseCount = totalLicenses - freeCount - proCount;

    return [
      { tier: 'FREE', count: freeCount, percentage: totalLicenses > 0 ? (freeCount / totalLicenses) * 100 : 0 },
      { tier: 'PRO', count: proCount, percentage: totalLicenses > 0 ? (proCount / totalLicenses) * 100 : 0 },
      { tier: 'ENTERPRISE', count: enterpriseCount, percentage: totalLicenses > 0 ? (enterpriseCount / totalLicenses) * 100 : 0 },
    ];
  }

  /**
   * Helper: Calculate quota utilization
   */
  private async calculateQuotaUtilization(events: UsageEvent[]): Promise<QuotaMetric[]> {
    const licenseCounts = new Map<string, number>();

    for (const event of events) {
      const current = licenseCounts.get(event.licenseKey) || 0;
      licenseCounts.set(event.licenseKey, current + (event.units || 1));
    }

    // Mock quota limits - in production, query license service
    const mockLimits: Record<string, number> = {
      FREE: 1000,
      PRO: 10000,
      ENTERPRISE: 100000,
    };

    return Array.from(licenseCounts.entries()).map(([licenseKey, used]) => {
      // Determine tier from license key (mock)
      const tier = licenseKey.includes('enterprise') ? 'ENTERPRISE' :
        licenseKey.includes('pro') ? 'PRO' : 'FREE';
      const limit = mockLimits[tier];
      const percentage = (used / limit) * 100;

      // Reset date: first of next month
      const resetDate = new Date();
      resetDate.setMonth(resetDate.getMonth() + 1);
      resetDate.setDate(1);
      resetDate.setHours(0, 0, 0, 0);

      return {
        licenseKey,
        used,
        limit,
        percentage: Math.round(percentage * 10) / 10,
        resetDate: resetDate.toISOString(),
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }
}

// Export singleton
export const analyticsService = new AnalyticsService();
