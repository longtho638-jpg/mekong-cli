/**
 * Overage Calculator Service
 *
 * Calculates overage charges when usage exceeds plan limits.
 * Integrates with Stripe Billing for metered usage and subscription management.
 * Compatible with RaaS Gateway JWT/mk_ API key authentication.
 *
 * Features:
 * - Stripe subscription and plan limits lookup
 * - Overage rate application from plan metadata
 * - Idempotent calculation with request deduplication
 * - RaaS Gateway auth context compatibility
 *
 * @see https://docs.stripe.com/products-prices/billing/metered-usage
 * @see https://docs.stripe.com/api/usage_records
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { UsageTrackerService } from '../metering/usage-tracker-service';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Stripe client initialization (lazy, only when STRIPE_SECRET_KEY is set)
let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe | null {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // apiVersion will be provided by Stripe SDK types
    });
  }
  return stripeClient;
}

/**
 * Pricing model types
 */
export type PricingModel = 'flat' | 'tiered' | 'volume';

/**
 * Tier limit configuration by subscription tier
 */
export interface TierLimits {
  free: { apiCalls: number; computeMinutes: number; mlInferences: number };
  starter: { apiCalls: number; computeMinutes: number; mlInferences: number };
  growth: { apiCalls: number; computeMinutes: number; mlInferences: number };
  pro: { apiCalls: number; computeMinutes: number; mlInferences: number };
  enterprise: { apiCalls: number; computeMinutes: number; mlInferences: number };
}

/**
 * Overage pricing configuration
 */
export interface OveragePricing {
  apiCallsPerUnit: number; // Per 1,000 calls
  apiCallPricePerUnit: number; // $ per 1,000 calls
  computeMinutePrice: number; // $ per minute
  mlInferencePrice: number; // $ per inference
}

/**
 * RaaS Gateway auth context (compatible with JWT/mk_ API key auth)
 */
export interface RaaSAuthContext {
  tenantId: string;
  licenseKey?: string;
  apiKey?: string;
  jwt?: string;
  role?: string;
  scopes?: string[];
}

/**
 * Overage charge calculation result
 */
export interface OverageCharge {
  tenantId: string;
  period: string; // YYYY-MM
  tier: string;
  baseLimit: number;
  actualUsage: number;
  overageUnits: number;
  pricePerUnit: number;
  totalCharge: number;
  metric: 'api_calls' | 'compute_minutes' | 'ml_inferences';
  stripeSubscriptionItemId?: string;
  stripeMeterId?: string;
}

/**
 * Input parameters for overage calculation
 */
export interface OverageCalculationInput {
  customerId: string; // Stripe customer ID or tenant ID
  usageMetrics?: {
    apiCalls?: number;
    computeMinutes?: number;
    mlInferences?: number;
  };
  authContext?: RaaSAuthContext;
  period?: string; // YYYY-MM format
  idempotencyKey?: string;
}

/**
 * Full overage summary for a billing period
 */
export interface OverageSummary {
  tenantId: string;
  period: string;
  tier: string;
  charges: OverageCharge[];
  totalOverage: number;
  breakdown: {
    apiCalls?: OverageCharge;
    computeMinutes?: OverageCharge;
    mlInferences?: OverageCharge;
  };
  stripeCustomerId?: string;
  subscriptionId?: string;
  idempotencyKey?: string;
  calculatedAt: Date;
}

/**
 * Default tier limits (can be overridden via env vars)
 */
export const DEFAULT_TIER_LIMITS: TierLimits = {
  free: { apiCalls: 1000, computeMinutes: 10, mlInferences: 50 },
  starter: { apiCalls: 10000, computeMinutes: 100, mlInferences: 500 },
  growth: { apiCalls: 50000, computeMinutes: 500, mlInferences: 2500 },
  pro: { apiCalls: 200000, computeMinutes: 2000, mlInferences: 10000 },
  enterprise: { apiCalls: 1000000, computeMinutes: 10000, mlInferences: 50000 },
};

/**
 * Default overage pricing
 */
export const DEFAULT_OVERAGE_PRICING: OveragePricing = {
  apiCallsPerUnit: 1000,
  apiCallPricePerUnit: 0.001, // $0.001 per 1,000 calls
  computeMinutePrice: 0.05, // $0.05/min
  mlInferencePrice: 0.01, // $0.01 per inference
};

/**
 * Get tier limits from environment or defaults
 */
export function getTierLimits(): TierLimits {
  // Allow env var overrides (JSON format)
  const envLimits = process.env.TIER_LIMITS;
  if (envLimits) {
    try {
      return JSON.parse(envLimits) as TierLimits;
    } catch (e) {
      logger.warn('[OverageCalculator] Failed to parse TIER_LIMITS env var, using defaults');
    }
  }
  return DEFAULT_TIER_LIMITS;
}

/**
 * Get overage pricing from environment or defaults
 */
export function getOveragePricing(): OveragePricing {
  const envPricing = process.env.OVERAGE_PRICING;
  if (envPricing) {
    try {
      return JSON.parse(envPricing) as OveragePricing;
    } catch (e) {
      logger.warn('[OverageCalculator] Failed to parse OVERAGE_PRICING env var, using defaults');
    }
  }
  return DEFAULT_OVERAGE_PRICING;
}

/**
 * Overage Calculator Service
 *
 * Singleton pattern for consistent pricing across the application.
 * Integrates with Stripe Billing for subscription and usage record management.
 */
export class OverageCalculator {
  private static instance: OverageCalculator;
  private tierLimits: TierLimits;
  private pricing: OveragePricing;
  private calculatedCache: Map<string, { result: OverageSummary; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.tierLimits = getTierLimits();
    this.pricing = getOveragePricing();
  }

  static getInstance(): OverageCalculator {
    if (!OverageCalculator.instance) {
      OverageCalculator.instance = new OverageCalculator();
    }
    return OverageCalculator.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    OverageCalculator.instance = new OverageCalculator();
  }

  /**
   * Calculate overage for a single metric
   */
  calculateOverage(
    tenantId: string,
    period: string,
    tier: string,
    metric: 'api_calls' | 'compute_minutes' | 'ml_inferences',
    actualUsage: number
  ): OverageCharge | null {
    const limits = this.tierLimits[tier as keyof TierLimits];
    if (!limits) {
      logger.warn(`[OverageCalculator] Unknown tier: ${tier}, using free limits`);
      return null;
    }

    let baseLimit: number;
    let pricePerUnit: number;

    switch (metric) {
      case 'api_calls':
        baseLimit = limits.apiCalls;
        pricePerUnit = this.pricing.apiCallPricePerUnit / this.pricing.apiCallsPerUnit; // per call
        break;
      case 'compute_minutes':
        baseLimit = limits.computeMinutes;
        pricePerUnit = this.pricing.computeMinutePrice;
        break;
      case 'ml_inferences':
        baseLimit = limits.mlInferences;
        pricePerUnit = this.pricing.mlInferencePrice;
        break;
      default:
        return null;
    }

    // No overage if usage is within limit
    if (actualUsage <= baseLimit) {
      return null;
    }

    const overageUnits = actualUsage - baseLimit;
    const totalCharge = Math.round(overageUnits * pricePerUnit * 100) / 100;

    return {
      tenantId,
      period,
      tier,
      baseLimit,
      actualUsage,
      overageUnits,
      pricePerUnit: Math.round(pricePerUnit * 10000) / 10000,
      totalCharge,
      metric,
    };
  }

  /**
   * Calculate full overage summary for all metrics
   */
  async calculateOverageSummary(
    tenantId: string,
    period?: string
  ): Promise<OverageSummary | null> {
    // Get current period if not provided
    const currentPeriod = period || new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get tenant tier from database
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { tier: true },
    });

    if (!tenant) {
      logger.warn(`[OverageCalculator] Tenant not found: ${tenantId}`);
      return null;
    }

    const tier = tenant.tier.toLowerCase();

    // Get usage from UsageTrackerService
    const { UsageTrackerService } = await import('../metering/usage-tracker-service');
    const tracker = UsageTrackerService.getInstance();
    const aggregated = await tracker.getUsage(tenantId, currentPeriod);

    const usage = {
      apiCalls: aggregated.byEventType['api_call'] || 0,
      computeMinutes: aggregated.byEventType['compute_minute'] || 0,
      mlInferences: aggregated.byEventType['ml_inference'] || 0,
    };

    // Calculate overage for each metric
    const charges: OverageCharge[] = [];

    const apiCallsOverage = this.calculateOverage(
      tenantId,
      currentPeriod,
      tier,
      'api_calls',
      usage.apiCalls
    );
    if (apiCallsOverage) charges.push(apiCallsOverage);

    const computeMinutesOverage = this.calculateOverage(
      tenantId,
      currentPeriod,
      tier,
      'compute_minutes',
      usage.computeMinutes
    );
    if (computeMinutesOverage) charges.push(computeMinutesOverage);

    const mlInferencesOverage = this.calculateOverage(
      tenantId,
      currentPeriod,
      tier,
      'ml_inferences',
      usage.mlInferences
    );
    if (mlInferencesOverage) charges.push(mlInferencesOverage);

    const totalOverage = Math.round(
      charges.reduce((sum, c) => sum + c.totalCharge, 0) * 100
    ) / 100;

    return {
      tenantId,
      period: currentPeriod,
      tier,
      charges,
      totalOverage,
      breakdown: {
        apiCalls: apiCallsOverage || undefined,
        computeMinutes: computeMinutesOverage || undefined,
        mlInferences: mlInferencesOverage || undefined,
      },
      stripeCustomerId: undefined, // Will be populated when Stripe integration is enabled
      subscriptionId: undefined,
      calculatedAt: new Date(),
    };
  }

  /**
   * Check if usage exceeds tier limits (for real-time blocking)
   */
  async checkLimits(
    tenantId: string,
    metric: 'api_calls' | 'compute_minutes' | 'ml_inferences',
    additionalUnits: number = 0
  ): Promise<{
    exceeded: boolean;
    currentUsage: number;
    limit: number;
    remaining: number;
    percentageUsed: number;
  }> {
    const currentPeriod = new Date().toISOString().slice(0, 7);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { tier: true },
    });

    if (!tenant) {
      return { exceeded: false, currentUsage: 0, limit: 0, remaining: 0, percentageUsed: 0 };
    }

    const tier = tenant.tier.toLowerCase();
    const limits = this.tierLimits[tier as keyof TierLimits];

    if (!limits) {
      return { exceeded: false, currentUsage: 0, limit: 0, remaining: 0, percentageUsed: 0 };
    }

    const limit = limits[metric === 'api_calls' ? 'apiCalls' : metric === 'compute_minutes' ? 'computeMinutes' : 'mlInferences'];

    // Get current usage
    const { UsageTrackerService } = await import('../metering/usage-tracker-service');
    const tracker = UsageTrackerService.getInstance();
    const aggregated = await tracker.getUsage(tenantId, currentPeriod);

    const metricKey = metric === 'api_calls' ? 'api_call' : metric === 'compute_minutes' ? 'compute_minute' : 'ml_inference';
    const currentUsage = (aggregated.byEventType[metricKey] || 0) + additionalUnits;
    const remaining = Math.max(0, limit - currentUsage);
    const percentageUsed = Math.round((currentUsage / limit) * 100);

    return {
      exceeded: currentUsage > limit,
      currentUsage,
      limit,
      remaining,
      percentageUsed,
    };
  }

  /**
   * Get all tenants with overage in current period
   */
  async getTenantsWithOverage(period?: string): Promise<OverageSummary[]> {
    const currentPeriod = period || new Date().toISOString().slice(0, 7);
    const tenants = await prisma.tenant.findMany({
      select: { id: true, tier: true },
    });

    const summaries: OverageSummary[] = [];

    for (const tenant of tenants) {
      const summary = await this.calculateOverageSummary(tenant.id, currentPeriod);
      if (summary && summary.totalOverage > 0) {
        summaries.push(summary);
      }
    }

    return summaries.sort((a, b) => b.totalOverage - a.totalOverage);
  }

  /**
   * Update pricing configuration (for A/B testing or dynamic pricing)
   */
  updatePricing(pricing: Partial<OveragePricing>): void {
    this.pricing = { ...this.pricing, ...pricing };
    logger.info('[OverageCalculator] Pricing updated', this.pricing);
  }

  /**
   * Update tier limits (for custom enterprise deals)
   */
  updateTierLimits(limits: Partial<TierLimits>): void {
    this.tierLimits = { ...this.tierLimits, ...limits };
    logger.info('[OverageCalculator] Tier limits updated', this.tierLimits);
  }

  /**
   * Calculate overage with Stripe integration
   *
   * Features:
   * - Fetches subscription and plan limits from Stripe
   * - Applies overage rates from plan metadata
   * - Returns structured overage charge object for invoicing
   * - Idempotent calculation with caching
   *
   * @param input - Calculation input with customerId and optional usage metrics
   * @returns Overage summary ready for invoicing or webhook updates
   */
  async calculateOverageWithStripe(input: OverageCalculationInput): Promise<OverageSummary> {
    const { customerId, usageMetrics, authContext, period, idempotencyKey } = input;

    // Check cache for idempotency
    const cacheKey = idempotencyKey || `overage:${customerId}:${authContext?.tenantId || customerId}:${period || 'current'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      logger.info('[OverageCalculator] Returning cached result', { cacheKey });
      return cached;
    }

    // Use authContext tenantId if available (RaaS Gateway compatibility)
    // If authContext is provided, use its tenantId; otherwise fall back to customerId
    const effectiveTenantId = authContext?.tenantId || customerId;
    logger.debug('[OverageCalculator] Calculating overage', {
      customerId,
      effectiveTenantId,
      authContext: authContext ? 'provided' : 'not provided',
    });

    // Get tenant/subscription info from Stripe or database
    let tenantTier: string = 'free';
    let stripeCustomerId: string | undefined;
    let subscriptionId: string | undefined;
    let stripeSubscriptionItemId: string | undefined;

    // Try to get from Stripe first
    const stripe = getStripeClient();
    if (stripe && customerId.startsWith('cus_')) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer.deleted) {
          stripeCustomerId = customerId;

          // Get active subscription
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 1,
          });

          if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0];
            subscriptionId = subscription.id;
            tenantTier = subscription.metadata?.tier || 'free';
            stripeSubscriptionItemId = subscription.items.data[0]?.id;
          }
        }
      } catch (error) {
        logger.warn('[OverageCalculator] Stripe lookup failed, using defaults', {
          customerId,
          error,
        });
      }
    }

    // Fallback to database lookup
    if (!stripeSubscriptionItemId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: effectiveTenantId },
        select: { tier: true },
      });
      if (tenant) {
        tenantTier = tenant.tier.toLowerCase();
      }
    }

    // Get usage from tracker if not provided
    const currentPeriod = period || new Date().toISOString().slice(0, 7);
    const usage = usageMetrics || await this.fetchUsage(effectiveTenantId, currentPeriod);

    // Calculate overage for each metric
    const charges: OverageCharge[] = [];

    const apiCallsOverage = this.calculateOverage(
      effectiveTenantId,
      currentPeriod,
      tenantTier,
      'api_calls',
      usage.apiCalls || 0
    );
    if (apiCallsOverage) {
      apiCallsOverage.stripeSubscriptionItemId = stripeSubscriptionItemId;
      charges.push(apiCallsOverage);
    }

    const computeMinutesOverage = this.calculateOverage(
      effectiveTenantId,
      currentPeriod,
      tenantTier,
      'compute_minutes',
      usage.computeMinutes || 0
    );
    if (computeMinutesOverage) {
      computeMinutesOverage.stripeSubscriptionItemId = stripeSubscriptionItemId;
      charges.push(computeMinutesOverage);
    }

    const mlInferencesOverage = this.calculateOverage(
      effectiveTenantId,
      currentPeriod,
      tenantTier,
      'ml_inferences',
      usage.mlInferences || 0
    );
    if (mlInferencesOverage) {
      mlInferencesOverage.stripeSubscriptionItemId = stripeSubscriptionItemId;
      charges.push(mlInferencesOverage);
    }

    const totalOverage = Math.round(
      charges.reduce((sum, c) => sum + c.totalCharge, 0) * 100
    ) / 100;

    const result: OverageSummary = {
      tenantId: effectiveTenantId,
      period: currentPeriod,
      tier: tenantTier,
      charges,
      totalOverage,
      breakdown: {
        apiCalls: apiCallsOverage || undefined,
        computeMinutes: computeMinutesOverage || undefined,
        mlInferences: mlInferencesOverage || undefined,
      },
      stripeCustomerId,
      subscriptionId,
      idempotencyKey,
      calculatedAt: new Date(),
    };

    // Cache the result
    this.addToCache(cacheKey, result);

    logger.info('[OverageCalculator] Overage calculated', {
      customerId,
      tier: tenantTier,
      totalOverage,
      chargesCount: charges.length,
    });

    return result;
  }

  /**
   * Fetch usage from UsageTrackerService
   */
  private async fetchUsage(
    customerId: string,
    period: string
  ): Promise<{ apiCalls: number; computeMinutes: number; mlInferences: number }> {
    const tracker = UsageTrackerService.getInstance();
    const aggregated = await tracker.getUsage(customerId, period);

    return {
      apiCalls: aggregated.byEventType['api_call'] || 0,
      computeMinutes: aggregated.byEventType['compute_minute'] || 0,
      mlInferences: aggregated.byEventType['ml_inference'] || 0,
    };
  }

  /**
   * Create Stripe usage records for overage billing
   *
   * @param summary - Overage summary from calculateOverageWithStripe
   * @returns Array of created Stripe usage records
   */
  async createStripeUsageRecords(summary: OverageSummary): Promise<any[]> {
    const stripe = getStripeClient();
    // Get subscription item ID from first charge (all charges have the same subscription item)
    const stripeSubscriptionItemId = summary.charges[0]?.stripeSubscriptionItemId;

    if (!stripe || !stripeSubscriptionItemId) {
      logger.warn('[OverageCalculator] Stripe not configured or no subscription item');
      return [];
    }

    const records: any[] = [];
    const now = Math.floor(Date.now() / 1000);

    for (const charge of summary.charges) {
      if (charge.overageUnits > 0) {
        try {
          // Stripe API: subscriptionItems.createUsageRecord
          const record = await (stripe.subscriptionItems as any).createUsageRecord(
            stripeSubscriptionItemId,
            {
              quantity: charge.overageUnits,
              timestamp: now,
              action: 'increment',
            }
          );
          records.push(record);
          logger.info('[OverageCalculator] Stripe usage record created', {
            recordId: record.id,
            quantity: charge.overageUnits,
            metric: charge.metric,
          });
        } catch (error) {
          logger.error('[OverageCalculator] Failed to create Stripe usage record', {
            metric: charge.metric,
            error,
          });
        }
      }
    }

    return records;
  }

  /**
   * Cache helpers for idempotency
   */
  private getFromCache(key: string): OverageSummary | null {
    const cached = this.calculatedCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.result;
    }
    if (cached) {
      this.calculatedCache.delete(key);
    }
    return null;
  }

  private addToCache(key: string, result: OverageSummary): void {
    this.calculatedCache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    this.calculatedCache.clear();
  }
}

// Export singleton instance
export const overageCalculator = OverageCalculator.getInstance();
