/**
 * Usage Billing Adapter
 *
 * Converts internal usage events to billing provider formats.
 * Supports Stripe Metered Billing and Polar.sh usage reporting.
 *
 * @see https://docs.stripe.com/products-prices/billing/metered-usage
 * @see https://docs.polar.sh
 */

import { UsageTrackerService, UsageEvent } from '../metering/usage-tracker-service';
import { usageQueries } from '../db/queries/usage-queries';
import { logger } from '../utils/logger';

/**
 * Stripe Metered Billing record
 *
 * @see https://docs.stripe.com/api/usage_records
 */
export interface StripeUsageRecord {
  /** Stripe subscription item ID */
  subscription_item: string;
  /** Quantity consumed (integer for most meters) */
  quantity: number;
  /** Unix timestamp for when usage occurred */
  timestamp: number;
  /** How to record quantity: 'increment' adds to existing, 'set' overwrites */
  action?: 'increment' | 'set';
}

/**
 * Polar Usage Event format
 *
 * Polar.sh usage reporting structure (future-compatible when Polar supports metered billing)
 */
export interface PolarUsageReport {
  /** Polar subscription ID */
  subscription_id: string;
  /** Metric name (e.g., 'api_calls', 'compute_minutes') */
  metric_name: string;
  /** Quantity consumed */
  quantity: number;
  /** ISO 8601 timestamp */
  timestamp: string;
}

/**
 * Billing provider types
 */
export type BillingProvider = 'stripe' | 'polar';

/**
 * Internal usage summary for billing period
 */
export interface UsageSummary {
  apiCalls: number;
  computeMinutes: number;
  mlInferences: number;
  period: string; // YYYY-MM format
}

/**
 * Estimated cost breakdown
 */
export interface EstimatedCost {
  apiCalls: number;
  computeMinutes: number;
  mlInferences: number;
  total: number;
}

/**
 * Billing summary with usage and cost estimates
 */
export interface BillingSummary {
  period: string;
  usage: {
    apiCalls: number;
    computeMinutes: number;
    mlInferences: number;
    overageUnits?: number; // Overage units beyond quota
  };
  estimatedCost: EstimatedCost;
  overageCost?: number; // Separate overage cost
}

/**
 * Subscription item mapping for Stripe billing
 */
export interface SubscriptionItemMapping {
  licenseKey: string;
  subscriptionId: string;
  subscriptionItemId: string;
  meterId?: string;
  metric: 'api_calls' | 'compute_minutes' | 'ml_inferences';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Overage billing configuration per license
 */
export interface OverageBillingConfig {
  licenseKey: string;
  subscriptionItemId: string;
  quotaLimit: number;
  overagePricePerUnit: number;
  overageEnabled: boolean;
  metric: 'api_calls' | 'compute_minutes' | 'ml_inferences';
}

/**
 * Overage usage record for Stripe
 */
export interface OverageStripeRecord {
  /** Stripe subscription item ID */
  subscription_item: string;
  /** Overage quantity consumed */
  quantity: number;
  /** Unix timestamp for when usage occurred */
  timestamp: number;
  /** How to record quantity: 'increment' adds to existing, 'set' overwrites */
  action?: 'increment' | 'set';
  /** Mark as overage record */
  isOverage: true;
}

/**
 * Pricing configuration
 *
 * Adjust per deployment/market
 */
export const USAGE_PRICING = {
  // Per 1,000 API calls
  apiCallsPerUnit: 1000,
  apiCallPricePerUnit: 0.001, // $0.001 per 1000 calls

  // Per compute minute (ML inference)
  computeMinutePrice: 0.05, // $0.05/min

  // Per ML inference
  mlInferencePrice: 0.01, // $0.01 per inference

  // Tier multipliers (discounts)
  tierMultipliers: {
    free: 1.0,
    pro: 0.8, // 20% discount
    enterprise: 0.5, // 50% discount
  },
};

/**
 * Calculate API call cost with tier discount
 */
export function calculateApiCallCost(calls: number, tier: string = 'free'): number {
  const multiplier = USAGE_PRICING.tierMultipliers[tier as keyof typeof USAGE_PRICING.tierMultipliers] || 1;
  const units = Math.ceil(calls / USAGE_PRICING.apiCallsPerUnit);
  return Math.round(units * USAGE_PRICING.apiCallPricePerUnit * multiplier * 1000) / 1000;
}

/**
 * Calculate compute cost with tier discount
 */
export function calculateComputeCost(minutes: number, tier: string = 'free'): number {
  const multiplier = USAGE_PRICING.tierMultipliers[tier as keyof typeof USAGE_PRICING.tierMultipliers] || 1;
  return Math.round(minutes * USAGE_PRICING.computeMinutePrice * multiplier * 100) / 100;
}

/**
 * Calculate ML inference cost with tier discount
 */
export function calculateMlInferenceCost(inferences: number, tier: string = 'free'): number {
  const multiplier = USAGE_PRICING.tierMultipliers[tier as keyof typeof USAGE_PRICING.tierMultipliers] || 1;
  return Math.round(inferences * USAGE_PRICING.mlInferencePrice * multiplier * 100) / 100;
}

/**
 * Usage Billing Adapter
 *
 * Converts internal usage data to billing provider formats.
 * Singleton pattern for consistent state across the application.
 */
export class UsageBillingAdapter {
  private static instance: UsageBillingAdapter;
  private tracker: UsageTrackerService;
  private subscriptionItemMap: Map<string, SubscriptionItemMapping>;
  private overageConfigMap: Map<string, OverageBillingConfig>;

  private constructor() {
    this.tracker = UsageTrackerService.getInstance();
    this.subscriptionItemMap = new Map();
    this.overageConfigMap = new Map();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): UsageBillingAdapter {
    if (!UsageBillingAdapter.instance) {
      UsageBillingAdapter.instance = new UsageBillingAdapter();
    }
    return UsageBillingAdapter.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    UsageBillingAdapter.instance = new UsageBillingAdapter();
  }

  /**
   * Register subscription item mapping for a license
   */
  registerSubscriptionItem(mapping: SubscriptionItemMapping): void {
    this.subscriptionItemMap.set(mapping.licenseKey, mapping);
    logger.info('[UsageBillingAdapter] Registered subscription item', {
      licenseKey: mapping.licenseKey,
      subscriptionItemId: mapping.subscriptionItemId,
      metric: mapping.metric,
    });
  }

  /**
   * Get subscription item mapping for a license
   */
  getSubscriptionItem(licenseKey: string): SubscriptionItemMapping | null {
    return this.subscriptionItemMap.get(licenseKey) || null;
  }

  /**
   * Register overage billing configuration
   */
  registerOverageConfig(config: OverageBillingConfig): void {
    this.overageConfigMap.set(config.licenseKey, config);
    logger.info('[UsageBillingAdapter] Registered overage config', {
      licenseKey: config.licenseKey,
      quotaLimit: config.quotaLimit,
      overagePricePerUnit: config.overagePricePerUnit,
      overageEnabled: config.overageEnabled,
    });
  }

  /**
   * Get overage configuration for a license
   */
  getOverageConfig(licenseKey: string): OverageBillingConfig | null {
    return this.overageConfigMap.get(licenseKey) || null;
  }

  /**
   * Calculate overage units for a license
   */
  async calculateOverageUnits(licenseKey: string): Promise<number> {
    const config = this.getOverageConfig(licenseKey);
    if (!config || !config.overageEnabled) {
      return 0;
    }

    const usage = await this.getUsageSummarySync(licenseKey);
    const currentUsage = this.getCurrentUsageForMetric(usage, config.metric);

    const overageUnits = Math.max(0, currentUsage - config.quotaLimit);
    return overageUnits;
  }

  /**
   * Generate overage billing records for Stripe
   */
  async generateOverageRecords(licenseKey: string): Promise<OverageStripeRecord[]> {
    const config = this.getOverageConfig(licenseKey);
    if (!config || !config.overageEnabled) {
      return [];
    }

    const overageUnits = await this.calculateOverageUnits(licenseKey);
    if (overageUnits <= 0) {
      return [];
    }

    const record = this.toOverageStripeRecord(overageUnits, config.subscriptionItemId);
    return record ? [record] : [];
  }

  /**
   * Get all licenses with overage billing enabled
   */
  getOverageLicenses(): string[] {
    const licenses: string[] = [];
    for (const [key, config] of this.overageConfigMap.entries()) {
      if (config.overageEnabled) {
        licenses.push(key);
      }
    }
    return licenses;
  }

  /**
   * Helper to get current usage for a specific metric
   */
  private getCurrentUsageForMetric(
    usage: UsageSummary,
    metric: 'api_calls' | 'compute_minutes' | 'ml_inferences'
  ): number {
    switch (metric) {
      case 'api_calls':
        return usage.apiCalls;
      case 'compute_minutes':
        return Math.ceil(usage.computeMinutes);
      case 'ml_inferences':
        return usage.mlInferences;
      default:
        return 0;
    }
  }

  /**
   * Synchronous version of getUsageSummary for internal use
   */
  private async getUsageSummarySync(licenseKey: string): Promise<UsageSummary> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const aggregated = await this.tracker.getUsage(licenseKey, currentMonth);

    return {
      apiCalls: aggregated.byEventType['api_call'] || 0,
      computeMinutes: aggregated.byEventType['compute_minute'] || 0,
      mlInferences: aggregated.byEventType['ml_inference'] || 0,
      period: currentMonth,
    };
  }

  /**
   * Convert internal usage to Stripe Metered Billing format
   *
   * Stripe expects:
   * - quantity as integer counts
   * - API calls: 1 record per call
   * - Compute: minutes rounded up
   * - Timestamps as Unix epoch seconds
   *
   * @param usage - Internal usage summary
   * @param subscriptionItemId - Stripe subscription item ID
   * @param meterId - Stripe meter ID for the metric
   * @returns Array of Stripe usage records
   */
  toStripeUsageRecords(
    usage: UsageSummary,
    subscriptionItemId: string,
    meterId?: string
  ): StripeUsageRecord[] {
    const records: StripeUsageRecord[] = [];
    const now = Math.floor(Date.now() / 1000);

    // API calls metric
    if (usage.apiCalls > 0) {
      records.push({
        subscription_item: subscriptionItemId,
        quantity: usage.apiCalls,
        timestamp: now,
        action: 'increment',
      });
    }

    // Compute minutes metric (rounded up)
    if (usage.computeMinutes > 0) {
      records.push({
        subscription_item: subscriptionItemId,
        quantity: Math.ceil(usage.computeMinutes),
        timestamp: now,
        action: 'increment',
      });
    }

    // ML inferences metric
    if (usage.mlInferences > 0) {
      records.push({
        subscription_item: subscriptionItemId,
        quantity: usage.mlInferences,
        timestamp: now,
        action: 'increment',
      });
    }

    logger.info('[UsageBillingAdapter] Generated Stripe records', {
      count: records.length,
      subscription_item: subscriptionItemId,
      meter_id: meterId,
      usage,
    });

    return records;
  }

  /**
   * Convert overage usage to Stripe format
   *
   * @param overageUnits - Number of overage units
   * @param subscriptionItemId - Stripe subscription item ID
   * @returns Overage Stripe record
   */
  toOverageStripeRecord(
    overageUnits: number,
    subscriptionItemId: string
  ): OverageStripeRecord | null {
    if (overageUnits <= 0) {
      return null;
    }

    return {
      subscription_item: subscriptionItemId,
      quantity: overageUnits,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'increment',
      isOverage: true,
    };
  }

  /**
   * Convert internal usage to Polar usage report format
   *
   * Polar expects:
   * - subscription_id: Polar subscription identifier
   * - metric_name: Name of the metric being reported
   * - quantity: Integer or float quantity
   * - timestamp: ISO 8601 format
   *
   * @param usage - Internal usage summary
   * @param subscriptionId - Polar subscription ID
   * @returns Array of Polar usage reports
   */
  toPolarUsageReport(
    usage: UsageSummary,
    subscriptionId: string
  ): PolarUsageReport[] {
    const reports: PolarUsageReport[] = [];
    const now = new Date().toISOString();

    // API calls metric
    if (usage.apiCalls > 0) {
      reports.push({
        subscription_id: subscriptionId,
        metric_name: 'api_calls',
        quantity: usage.apiCalls,
        timestamp: now,
      });
    }

    // Compute minutes metric
    if (usage.computeMinutes > 0) {
      reports.push({
        subscription_id: subscriptionId,
        metric_name: 'compute_minutes',
        quantity: Math.ceil(usage.computeMinutes),
        timestamp: now,
      });
    }

    // ML inferences metric
    if (usage.mlInferences > 0) {
      reports.push({
        subscription_id: subscriptionId,
        metric_name: 'ml_inferences',
        quantity: usage.mlInferences,
        timestamp: now,
      });
    }

    logger.info('[UsageBillingAdapter] Generated Polar reports', {
      count: reports.length,
      subscription_id: subscriptionId,
      usage,
    });

    return reports;
  }

  /**
   * Sync usage data to Stripe Metered Billing
   *
   * Note: This method generates the records. The actual Stripe API call
   * should be made by the caller using the Stripe SDK.
   *
   * @example
   * ```typescript
   * const adapter = UsageBillingAdapter.getInstance();
   * const records = await adapter.syncUsageToStripe(licenseKey, subscriptionItemId);
   *
   * // Then push to Stripe:
   * for (const record of records) {
   *   await stripe.subscriptionItems.createUsageRecord(
   *     record.subscription_item,
   *     { quantity: record.quantity, timestamp: record.timestamp, action: record.action }
   *   );
   * }
   * ```
   *
   * @param licenseKey - License identifier
   * @param subscriptionItemId - Stripe subscription item ID
   * @param meterId - Optional Stripe meter ID
   * @returns Stripe usage records ready to be sent to Stripe API
   */
  async syncUsageToStripe(
    licenseKey: string,
    subscriptionItemId: string,
    meterId?: string
  ): Promise<StripeUsageRecord[]> {
    try {
      const usage = await this.getUsageSummary(licenseKey);
      const records = this.toStripeUsageRecords(usage, subscriptionItemId, meterId);

      logger.info('[UsageBillingAdapter] Synced usage to Stripe format', {
        license_key: licenseKey,
        subscription_item: subscriptionItemId,
        records_count: records.length,
      });

      return records;
    } catch (error) {
      logger.error('[UsageBillingAdapter] Stripe sync failed', {
        license_key: licenseKey,
        error,
      });
      throw error;
    }
  }

  /**
   * Report usage to Polar.sh
   *
   * Note: This method generates the reports. The actual Polar API call
   * should be made by the caller using the Polar SDK or REST API.
   *
   * @example
   * ```typescript
   * const adapter = UsageBillingAdapter.getInstance();
   * const reports = await adapter.reportUsageToPolar(tenantId, subscriptionId);
   *
   * // Then push to Polar:
   * for (const report of reports) {
   *   await polarClient.post('/usage', report);
   * }
   * ```
   *
   * @param tenantId - Tenant identifier
   * @param subscriptionId - Polar subscription ID
   * @returns Polar usage reports ready to be sent to Polar API
   */
  async reportUsageToPolar(
    tenantId: string,
    subscriptionId: string
  ): Promise<PolarUsageReport[]> {
    try {
      // Get usage from tracker (tenantId is used as licenseKey in our system)
      const usage = await this.getUsageSummary(tenantId);
      const reports = this.toPolarUsageReport(usage, subscriptionId);

      logger.info('[UsageBillingAdapter] Reported usage to Polar format', {
        tenant_id: tenantId,
        subscription_id: subscriptionId,
        reports_count: reports.length,
      });

      return reports;
    } catch (error) {
      logger.error('[UsageBillingAdapter] Polar report failed', {
        tenant_id: tenantId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get billing summary for a license/tenant
   *
   * @param licenseKey - License or tenant identifier
   * @param tier - Subscription tier for pricing calculation
   * @returns Billing summary with usage and cost estimates
   */
  async getBillingSummary(
    licenseKey: string,
    tier: string = 'free'
  ): Promise<BillingSummary> {
    const usage = await this.getUsageSummary(licenseKey);

    const estimatedCost: EstimatedCost = {
      apiCalls: calculateApiCallCost(usage.apiCalls, tier),
      computeMinutes: calculateComputeCost(usage.computeMinutes, tier),
      mlInferences: calculateMlInferenceCost(usage.mlInferences, tier),
      total: 0, // Will be calculated below
    };

    estimatedCost.total = Math.round(
      (estimatedCost.apiCalls + estimatedCost.computeMinutes + estimatedCost.mlInferences) * 100
    ) / 100;

    return {
      period: usage.period,
      usage: {
        apiCalls: usage.apiCalls,
        computeMinutes: usage.computeMinutes,
        mlInferences: usage.mlInferences,
      },
      estimatedCost,
    };
  }

  /**
   * Internal helper to get usage summary from tracker
   */
  private async getUsageSummary(licenseKey: string): Promise<UsageSummary> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const aggregated = await this.tracker.getUsage(licenseKey, currentMonth);

    return {
      apiCalls: aggregated.byEventType['api_call'] || 0,
      computeMinutes: aggregated.byEventType['compute_minute'] || 0,
      mlInferences: aggregated.byEventType['ml_inference'] || 0,
      period: currentMonth,
    };
  }
}

// Export singleton instance for convenience
export const usageBillingAdapter = UsageBillingAdapter.getInstance();
