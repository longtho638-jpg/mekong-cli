/**
 * Revenue Analytics Service — Tenant Revenue Metrics & Trends
 *
 * Provides revenue analytics and metrics for the RaaS (Reward-as-a-Service) platform:
 * - MRR (Monthly Recurring Revenue) calculation
 * - DAL (Daily Active Licenses) tracking
 * - Churn rate analysis
 * - ARPA (Average Revenue Per Account)
 * - Revenue breakdown by tier (FREE/PRO/ENTERPRISE)
 * - Utilization trends and quota consumption
 *
 * Data sources: Polar/Stripe webhooks + usage metering data
 */

import { TenantTier } from '../billing/polar-subscription-service';
import { PolarAuditLogger } from '../billing/polar-audit-logger';
import { usageQueries } from '../db/queries/usage-queries';

/**
 * MRR (Monthly Recurring Revenue) result
 */
export interface MRRResult {
  /** Month in YYYY-MM format */
  month: string;
  /** Total MRR in USD */
  totalMRR: number;
  /** MRR by tier */
  byTier: Record<TenantTier, number>;
  /** Number of active subscriptions */
  activeSubscriptions: number;
  /** Month-over-month growth rate (percentage) */
  growthRate?: number;
}

/**
 * DAL (Daily Active Licenses) result
 */
export interface DALResult {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Total active licenses */
  totalLicenses: number;
  /** Active licenses by tier */
  byTier: Record<TenantTier, number>;
  /** Licenses with API calls in last 24h */
  licensesWithActivity: number;
}

/**
 * Churn rate result
 */
export interface ChurnRateResult {
  /** Month in YYYY-MM format */
  month: string;
  /** Churn rate as percentage (0-100) */
  churnRate: number;
  /** Number of cancellations in period */
  cancellations: number;
  /** Number of active subscriptions at start */
  startSubscriptions: number;
  /** Tier breakdown of churned subscriptions */
  byTier: Record<TenantTier, number>;
}

/**
 * ARPA (Average Revenue Per Account) result
 */
export interface ARPAResult {
  /** Month in YYYY-MM format */
  month: string;
  /** Average revenue per account in USD */
  arpa: number;
  /** Total revenue */
  totalRevenue: number;
  /** Number of accounts */
  totalAccounts: number;
  /** ARPA by tier */
  byTier: Record<TenantTier, number>;
}

/**
 * Revenue by tier breakdown
 */
export interface RevenueByTierResult {
  /** Month in YYYY-MM format */
  month: string;
  /** Total revenue */
  totalRevenue: number;
  /** Revenue breakdown by tier */
  tiers: Array<{
    tier: TenantTier;
    revenue: number;
    percentage: number;
    subscriptionCount: number;
  }>;
}

/**
 * Usage revenue from overage charges
 */
export interface UsageRevenueResult {
  /** Month in YYYY-MM format */
  month: string;
  /** Total usage-based revenue */
  totalUsageRevenue: number;
  /** Breakdown by license */
  byLicense: Array<{
    licenseKey: string;
    overageCharges: number;
    overageUnits: number;
  }>;
  /** Aggregated overage metrics */
  overageMetrics: {
    totalOverageUnits: number;
    averageOveragePerLicense: number;
    licensesWithOverage: number;
  };
}

/**
 * Utilization trend data point
 */
export interface UtilizationDataPoint {
  /** License/tenant identifier */
  licenseKey: string;
  /** Tier */
  tier: TenantTier;
  /** API calls used */
  apiCalls: number;
  /** Compute minutes used */
  computeMinutes: number;
  /** ML inferences used */
  mlInferences: number;
  /** Overall utilization percentage (0-100) */
  utilizationPercent: number;
}

/**
 * Utilization trends result
 */
export interface UtilizationTrendsResult {
  /** Month in YYYY-MM format */
  month: string;
  /** Average utilization across all tenants */
  averageUtilization: number;
  /** Utilization by tier */
  byTier: Record<TenantTier, {
    averageUtilization: number;
    tenantCount: number;
  }>;
  /** Top consumers by utilization */
  topConsumers: UtilizationDataPoint[];
}

/**
 * Revenue event for tracking
 */
export interface RevenueEvent {
  eventId: string;
  tenantId: string;
  tier: TenantTier;
  amount: number;
  eventType: 'subscription.created' | 'subscription.active' | 'subscription.canceled' | 'usage.billed';
  timestamp: string;
  subscriptionId?: string;
}

/**
 * Tier pricing configuration
 */
const TIER_PRICING: Record<TenantTier, number> = {
  free: 0,
  pro: 49,
  enterprise: 199,
};

/**
 * Revenue Analytics Service
 *
 * Provides comprehensive revenue analytics:
 * - MRR tracking and growth analysis
 * - Daily active license monitoring
 * - Churn rate calculation
 * - ARPA computation
 * - Tier-based revenue breakdown
 * - Usage utilization trends
 */
export class RevenueAnalyticsService {
  private static instance: RevenueAnalyticsService;
  private auditLogger: PolarAuditLogger;

  // In-memory subscription tracking (in production, use database)
  private subscriptions = new Map<string, {
    tenantId: string;
    tier: TenantTier;
    subscriptionId: string;
    startedAt: string;
    cancelledAt?: string;
  }>();

  // Revenue events log
  private revenueEvents: RevenueEvent[] = [];

  // Usage data cache
  private usageCache = new Map<string, {
    apiCalls: number;
    computeMinutes: number;
    mlInferences: number;
    period: string;
  }>();

  private constructor() {
    this.auditLogger = PolarAuditLogger.getInstance();
  }

  static getInstance(): RevenueAnalyticsService {
    if (!RevenueAnalyticsService.instance) {
      RevenueAnalyticsService.instance = new RevenueAnalyticsService();
    }
    return RevenueAnalyticsService.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    const instance = new RevenueAnalyticsService();
    RevenueAnalyticsService.instance = instance;
  }

  /**
   * Record subscription activation from webhook
   */
  async recordSubscription(
    tenantId: string,
    subscriptionId: string,
    tier: TenantTier,
    startedAt: string,
  ): Promise<void> {
    this.subscriptions.set(subscriptionId, {
      tenantId,
      tier,
      subscriptionId,
      startedAt,
    });

    // Record revenue event
    this.revenueEvents.push({
      eventId: `sub_${subscriptionId}_${Date.now()}`,
      tenantId,
      tier,
      amount: TIER_PRICING[tier],
      eventType: 'subscription.active',
      timestamp: startedAt,
      subscriptionId,
    });

    this.auditLogger.log({
      eventId: `revenue_sub_${subscriptionId}`,
      eventType: 'revenue.subscription_active',
      tenantId,
      timestamp: startedAt,
      action: 'activated',
      success: true,
      idempotencyKey: `revenue_${subscriptionId}`,
    });
  }

  /**
   * Record subscription cancellation from webhook
   */
  async recordCancellation(
    subscriptionId: string,
    cancelledAt: string,
  ): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.cancelledAt = cancelledAt;

      // Record revenue event
      this.revenueEvents.push({
        eventId: `cancel_${subscriptionId}_${Date.now()}`,
        tenantId: subscription.tenantId,
        tier: subscription.tier,
        amount: 0,
        eventType: 'subscription.canceled',
        timestamp: cancelledAt,
        subscriptionId,
      });
    }
  }

  /**
   * Get Monthly Recurring Revenue (MRR) for a given month
   *
   * @param month - Month in YYYY-MM format
   * @returns MRR result with breakdown and growth rate
   */
  async getMRR(month: string): Promise<MRRResult> {
    // Filter active subscriptions for the given month
    const activeSubs = Array.from(this.subscriptions.values()).filter(sub => {
      const startMonth = sub.startedAt.slice(0, 7);
      const isCancelled = sub.cancelledAt && sub.cancelledAt.slice(0, 7) <= month;
      return startMonth <= month && !isCancelled;
    });

    // Calculate MRR by tier
    const byTier: Record<TenantTier, number> = {
      free: 0,
      pro: 0,
      enterprise: 0,
    };

    for (const sub of activeSubs) {
      byTier[sub.tier] += TIER_PRICING[sub.tier];
    }

    const totalMRR = Object.values(byTier).reduce((sum, val) => sum + val, 0);

    // Calculate growth rate from previous month (inline calculation to avoid recursion)
    let growthRate: number | undefined;
    const prevMonth = this.getPreviousMonth(month);
    const prevActiveSubs = Array.from(this.subscriptions.values()).filter(sub => {
      const startMonth = sub.startedAt.slice(0, 7);
      const isCancelled = sub.cancelledAt && sub.cancelledAt.slice(0, 7) <= prevMonth;
      return startMonth <= prevMonth && !isCancelled;
    });

    let prevMRR = 0;
    for (const sub of prevActiveSubs) {
      prevMRR += TIER_PRICING[sub.tier];
    }

    if (prevMRR > 0) {
      growthRate = ((totalMRR - prevMRR) / prevMRR) * 100;
    }

    return {
      month,
      totalMRR,
      byTier,
      activeSubscriptions: activeSubs.length,
      growthRate,
    };
  }

  /**
   * Get Daily Active Licenses (DAL) for a given date
   *
   * @param date - Date in YYYY-MM-DD format
   * @returns DAL result with tier breakdown
   */
  async getDAL(date: string): Promise<DALResult> {
    const month = date.slice(0, 7);

    // Get all active subscriptions
    const activeSubs = Array.from(this.subscriptions.values()).filter(sub => {
      const startMonth = sub.startedAt.slice(0, 7);
      const isCancelled = sub.cancelledAt && sub.cancelledAt.slice(0, 7) <= month;
      return startMonth <= month && !isCancelled;
    });

    // Count by tier
    const byTier: Record<TenantTier, number> = {
      free: 0,
      pro: 0,
      enterprise: 0,
    };

    for (const sub of activeSubs) {
      byTier[sub.tier]++;
    }

    // Count licenses with API activity (from usage cache or queries)
    const licensesWithActivity = Array.from(this.usageCache.values())
      .filter(u => u.period === month && u.apiCalls > 0)
      .length;

    return {
      date,
      totalLicenses: activeSubs.length,
      byTier,
      licensesWithActivity,
    };
  }

  /**
   * Get Churn Rate for a given month
   *
   * Churn Rate = (Cancellations / Start of Month Subscriptions) * 100
   *
   * @param month - Month in YYYY-MM format
   * @returns Churn rate result with breakdown
   */
  async getChurnRate(month: string): Promise<ChurnRateResult> {
    // Get subscriptions that existed at start of month
    const startSubs = Array.from(this.subscriptions.values()).filter(sub => {
      const startMonth = sub.startedAt.slice(0, 7);
      return startMonth < month;
    });

    // Get cancellations during the month
    const cancellations = startSubs.filter(sub => {
      return sub.cancelledAt && sub.cancelledAt.slice(0, 7) === month;
    });

    // Count by tier
    const byTier: Record<TenantTier, number> = {
      free: 0,
      pro: 0,
      enterprise: 0,
    };

    for (const cancel of cancellations) {
      byTier[cancel.tier]++;
    }

    const startCount = startSubs.length;
    const churnRate = startCount > 0
      ? (cancellations.length / startCount) * 100
      : 0;

    return {
      month,
      churnRate,
      cancellations: cancellations.length,
      startSubscriptions: startCount,
      byTier,
    };
  }

  /**
   * Get Average Revenue Per Account (ARPA) for a given month
   *
   * ARPA = Total Revenue / Number of Accounts
   *
   * @param month - Month in YYYY-MM format
   * @returns ARPA result with tier breakdown
   */
  async getARPA(month: string): Promise<ARPAResult> {
    const mrrResult = await this.getMRR(month);
    const totalAccounts = mrrResult.activeSubscriptions;

    // Calculate ARPA by tier
    const byTier: Record<TenantTier, number> = {
      free: 0,
      pro: 0,
      enterprise: 0,
    };

    for (const [tier, revenue] of Object.entries(mrrResult.byTier)) {
      const tierKey = tier as TenantTier;
      const tierCount = Array.from(this.subscriptions.values())
        .filter(sub => {
          const startMonth = sub.startedAt.slice(0, 7);
          const isCancelled = sub.cancelledAt && sub.cancelledAt.slice(0, 7) <= month;
          return sub.tier === tierKey && startMonth <= month && !isCancelled;
        })
        .length;
      byTier[tierKey] = tierCount > 0 ? revenue / tierCount : 0;
    }

    const arpa = totalAccounts > 0 ? mrrResult.totalMRR / totalAccounts : 0;

    return {
      month,
      arpa,
      totalRevenue: mrrResult.totalMRR,
      totalAccounts,
      byTier,
    };
  }

  /**
   * Get Revenue breakdown by tier for a given month
   *
   * @param month - Month in YYYY-MM format
   * @returns Revenue by tier result with percentages
   */
  async getRevenueByTier(month: string): Promise<RevenueByTierResult> {
    const mrrResult = await this.getMRR(month);
    const totalRevenue = mrrResult.totalMRR;

    const tiers = Object.entries(mrrResult.byTier).map(([tierRaw, revenue]) => {
      const tier = tierRaw as TenantTier;
      const subscriptionCount = Array.from(this.subscriptions.values())
        .filter(sub => {
          const startMonth = sub.startedAt.slice(0, 7);
          const isCancelled = sub.cancelledAt && sub.cancelledAt.slice(0, 7) <= month;
          return sub.tier === tier && startMonth <= month && !isCancelled;
        })
        .length;

      return {
        tier,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
        subscriptionCount,
      };
    });

    return {
      month,
      totalRevenue,
      tiers,
    };
  }

  /**
   * Get Utilization Trends for a given month
   *
   * Analyzes usage quota consumption across all tenants
   *
   * @param month - Month in YYYY-MM format
   * @returns Utilization trends with top consumers
   */
  async getUtilizationTrends(month: string): Promise<UtilizationTrendsResult> {
    // Get all active subscriptions
    const activeSubs = Array.from(this.subscriptions.values()).filter(sub => {
      const startMonth = sub.startedAt.slice(0, 7);
      const isCancelled = sub.cancelledAt && sub.cancelledAt.slice(0, 7) <= month;
      return startMonth <= month && !isCancelled;
    });

    // Group by tier and calculate utilization
    const byTierData: Record<TenantTier, { totalUtilization: number; count: number }> = {
      free: { totalUtilization: 0, count: 0 },
      pro: { totalUtilization: 0, count: 0 },
      enterprise: { totalUtilization: 0, count: 0 },
    };

    const allUtilization: UtilizationDataPoint[] = [];

    for (const sub of activeSubs) {
      // Get usage from cache or query database
      const usage = this.usageCache.get(sub.tenantId) || {
        apiCalls: 0,
        computeMinutes: 0,
        mlInferences: 0,
        period: month,
      };

      // Calculate utilization percentage (simplified - in production, compare against tier limits)
      const maxApiCalls = this.getMaxApiCallsForTier(sub.tier);
      const utilizationPercent = maxApiCalls > 0
        ? Math.min((usage.apiCalls / maxApiCalls) * 100, 100)
        : 0;

      const dataPoint: UtilizationDataPoint = {
        licenseKey: sub.tenantId,
        tier: sub.tier,
        apiCalls: usage.apiCalls,
        computeMinutes: usage.computeMinutes,
        mlInferences: usage.mlInferences,
        utilizationPercent,
      };

      allUtilization.push(dataPoint);
      byTierData[sub.tier].totalUtilization += utilizationPercent;
      byTierData[sub.tier].count++;
    }

    // Calculate averages
    const byTier: Record<TenantTier, { averageUtilization: number; tenantCount: number }> = {
      free: {
        averageUtilization: byTierData.free.count > 0
          ? byTierData.free.totalUtilization / byTierData.free.count
          : 0,
        tenantCount: byTierData.free.count,
      },
      pro: {
        averageUtilization: byTierData.pro.count > 0
          ? byTierData.pro.totalUtilization / byTierData.pro.count
          : 0,
        tenantCount: byTierData.pro.count,
      },
      enterprise: {
        averageUtilization: byTierData.enterprise.count > 0
          ? byTierData.enterprise.totalUtilization / byTierData.enterprise.count
          : 0,
        tenantCount: byTierData.enterprise.count,
      },
    };

    const totalUtilization = allUtilization.reduce((sum, u) => sum + u.utilizationPercent, 0);
    const averageUtilization = allUtilization.length > 0
      ? totalUtilization / allUtilization.length
      : 0;

    // Get top consumers (top 10 by utilization)
    const topConsumers = allUtilization
      .sort((a, b) => b.utilizationPercent - a.utilizationPercent)
      .slice(0, 10);

    return {
      month,
      averageUtilization,
      byTier,
      topConsumers,
    };
  }

  /**
   * Get Usage Revenue from overage charges for a given month
   *
   * @param month - Month in YYYY-MM format
   * @returns Usage revenue result with breakdown by license
   */
  async getUsageRevenue(month: string): Promise<UsageRevenueResult> {
    // Get usage events from database for the month
    const usageEvents = await usageQueries.getRecentUsage(1000);

    // Filter events for the target month
    const [year, monthNum] = month.split('-').map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const filteredEvents = usageEvents.filter(event => {
      const eventDate = new Date(event.createdAt);
      return eventDate >= monthStart && eventDate <= monthEnd;
    });

    // Group by license and calculate overage
    const licenseOverage = new Map<string, {
      apiCalls: number;
      computeMinutes: number;
      mlInferences: number;
      overageUnits: number;
      overageCharges: number;
    }>();

    // Tier limits for overage calculation
    const tierLimits: Record<TenantTier, { apiCalls: number; computeMinutes: number; mlInferences: number }> = {
      free: { apiCalls: 1000, computeMinutes: 60, mlInferences: 100 },
      pro: { apiCalls: 50000, computeMinutes: 500, mlInferences: 5000 },
      enterprise: { apiCalls: 1000000, computeMinutes: 5000, mlInferences: 50000 },
    };

    // Overage rates per unit
    const overageRates = {
      apiCalls: 0.001, // $0.001 per API call over limit
      computeMinutes: 0.05, // $0.05 per compute minute over limit
      mlInferences: 0.01, // $0.01 per ML inference over limit
    };

    // Aggregate usage by license
    for (const event of filteredEvents) {
      const licenseKey = event.licenseKey;
      if (!licenseOverage.has(licenseKey)) {
        licenseOverage.set(licenseKey, {
          apiCalls: 0,
          computeMinutes: 0,
          mlInferences: 0,
          overageUnits: 0,
          overageCharges: 0,
        });
      }

      const licenseData = licenseOverage.get(licenseKey)!;
      if (event.eventType === 'api_call') {
        licenseData.apiCalls += event.units;
      } else if (event.eventType === 'compute_minute') {
        licenseData.computeMinutes += event.units;
      } else if (event.eventType === 'ml_inference') {
        licenseData.mlInferences += event.units;
      }
    }

    // Calculate overage for each license
    const byLicense: Array<{
      licenseKey: string;
      overageCharges: number;
      overageUnits: number;
    }> = [];

    let totalOverageRevenue = 0;
    let totalOverageUnits = 0;
    let licensesWithOverage = 0;

    for (const [licenseKey, data] of licenseOverage.entries()) {
      // Get license tier
      const tier = this.getTenantTier(licenseKey);
      const limits = tierLimits[tier];

      // Calculate overage units
      const apiOverage = Math.max(0, data.apiCalls - limits.apiCalls);
      const computeOverage = Math.max(0, data.computeMinutes - limits.computeMinutes);
      const mlOverage = Math.max(0, data.mlInferences - limits.mlInferences);

      const totalOverageUnitsForLicense = apiOverage + computeOverage + mlOverage;

      // Calculate overage charges
      const overageCharges =
        (apiOverage * overageRates.apiCalls) +
        (computeOverage * overageRates.computeMinutes) +
        (mlOverage * overageRates.mlInferences);

      if (overageCharges > 0) {
        licensesWithOverage++;
        totalOverageUnits += totalOverageUnitsForLicense;
        totalOverageRevenue += overageCharges;

        byLicense.push({
          licenseKey,
          overageCharges: Math.round(overageCharges * 100) / 100, // Round to 2 decimal places
          overageUnits: totalOverageUnitsForLicense,
        });
      }
    }

    return {
      month,
      totalUsageRevenue: Math.round(totalOverageRevenue * 100) / 100,
      byLicense,
      overageMetrics: {
        totalOverageUnits,
        averageOveragePerLicense: licensesWithOverage > 0
          ? Math.round((totalOverageUnits / licensesWithOverage) * 100) / 100
          : 0,
        licensesWithOverage,
      },
    };
  }

  /**
   * Update usage data for a tenant
   */
  async updateUsage(
    licenseKey: string,
    usage: {
      apiCalls: number;
      computeMinutes: number;
      mlInferences: number;
      period: string;
    },
  ): Promise<void> {
    this.usageCache.set(licenseKey, usage);

    // Also record usage event
    this.revenueEvents.push({
      eventId: `usage_${licenseKey}_${usage.period}_${Date.now()}`,
      tenantId: licenseKey,
      tier: this.getTenantTier(licenseKey),
      amount: 0, // Usage-based pricing would calculate this
      eventType: 'usage.billed',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get all revenue events (for debugging/audit)
   */
  getRevenueEvents(limit: number = 100): RevenueEvent[] {
    return this.revenueEvents.slice(-limit);
  }

  /**
   * Reset cached data (testing only)
   */
  reset(): void {
    this.subscriptions.clear();
    this.revenueEvents = [];
    this.usageCache.clear();
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  /**
   * Get previous month in YYYY-MM format
   */
  private getPreviousMonth(month: string): string {
    const [year, monthNum] = month.split('-').map(Number);
    const prevMonth = monthNum - 1;
    if (prevMonth === 0) {
      return `${year - 1}-12`;
    }
    return `${year}-${prevMonth.toString().padStart(2, '0')}`;
  }

  /**
   * Get max API calls for tier (for utilization calculation)
   */
  private getMaxApiCallsForTier(tier: TenantTier): number {
    const limits: Record<TenantTier, number> = {
      free: 1000,
      pro: 50000,
      enterprise: 1000000,
    };
    return limits[tier];
  }

  /**
   * Get tenant tier from subscription
   */
  private getTenantTier(tenantId: string): TenantTier {
    for (const sub of this.subscriptions.values()) {
      if (sub.tenantId === tenantId) {
        return sub.tier;
      }
    }
    return 'free';
  }
}

/**
 * Export singleton instance for convenience
 */
export const revenueAnalytics = RevenueAnalyticsService.getInstance();
