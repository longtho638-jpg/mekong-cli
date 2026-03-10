/**
 * Polar.sh Subscription Service — manages tenant subscriptions via Polar API.
 * Maps Polar products → internal tiers (free/pro/enterprise).
 * Generates checkout URLs, queries subscription status.
 */

import { z } from 'zod';

export type TenantTier = 'free' | 'pro' | 'enterprise';

export interface PolarProduct {
  polarProductId: string;
  tier: TenantTier;
  name: string;
  priceMonthlyUsd: number;
  maxStrategies: number;
  maxDailyLossUsd: number;
  maxPositionSizeUsd: number;
}

const TIER_PRODUCTS: PolarProduct[] = [
  {
    polarProductId: process.env.POLAR_PRODUCT_FREE ?? 'prod_free',
    tier: 'free',
    name: 'Free',
    priceMonthlyUsd: 0,
    maxStrategies: 1,
    maxDailyLossUsd: 50,
    maxPositionSizeUsd: 500,
  },
  {
    polarProductId: process.env.POLAR_PRODUCT_PRO ?? 'prod_pro',
    tier: 'pro',
    name: 'Pro',
    priceMonthlyUsd: 49,
    maxStrategies: 5,
    maxDailyLossUsd: 500,
    maxPositionSizeUsd: 5000,
  },
  {
    polarProductId: process.env.POLAR_PRODUCT_ENTERPRISE ?? 'prod_enterprise',
    tier: 'enterprise',
    name: 'Enterprise',
    priceMonthlyUsd: 199,
    maxStrategies: Infinity,
    maxDailyLossUsd: 5000,
    maxPositionSizeUsd: 50000,
  },
];

export const CheckoutRequestSchema = z.object({
  tenantId: z.string().min(1),
  tier: z.enum(['free', 'pro', 'enterprise']),
  successUrl: z.url().optional(),
  cancelUrl: z.url().optional(),
});

export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

export interface SubscriptionStatus {
  tenantId: string;
  tier: TenantTier;
  productId: string;
  active: boolean;
  currentPeriodEnd: string | null;
}

export class PolarSubscriptionService {
  private static instance: PolarSubscriptionService;
  private subscriptions = new Map<string, SubscriptionStatus>();

  static getInstance(): PolarSubscriptionService {
    if (!PolarSubscriptionService.instance) {
      PolarSubscriptionService.instance = new PolarSubscriptionService();
    }
    return PolarSubscriptionService.instance;
  }

  /** Reset instance (for testing) */
  static resetInstance(): void {
    PolarSubscriptionService.instance = new PolarSubscriptionService();
  }

  getProducts(): PolarProduct[] {
    return [...TIER_PRODUCTS];
  }

  getProductByTier(tier: TenantTier): PolarProduct | undefined {
    return TIER_PRODUCTS.find(p => p.tier === tier);
  }

  getTierByProductId(productId: string): TenantTier | undefined {
    return TIER_PRODUCTS.find(p => p.polarProductId === productId)?.tier;
  }

  getTierLimits(tier: TenantTier): Omit<PolarProduct, 'polarProductId' | 'name' | 'priceMonthlyUsd'> | undefined {
    const product = this.getProductByTier(tier);
    if (!product) return undefined;
    return {
      tier: product.tier,
      maxStrategies: product.maxStrategies,
      maxDailyLossUsd: product.maxDailyLossUsd,
      maxPositionSizeUsd: product.maxPositionSizeUsd,
    };
  }

  /**
   * Generate checkout URL for Polar.sh.
   * In production, calls Polar API. Here returns structured data for the API layer.
   */
  generateCheckoutData(request: CheckoutRequest): {
    productId: string;
    tenantId: string;
    tier: TenantTier;
    successUrl: string;
    cancelUrl: string;
  } {
    const product = this.getProductByTier(request.tier);
    if (!product) {
      throw new Error(`Unknown tier: ${request.tier}`);
    }

    return {
      productId: product.polarProductId,
      tenantId: request.tenantId,
      tier: request.tier,
      successUrl: request.successUrl ?? `${process.env.APP_URL ?? 'http://localhost:3000'}/billing/success`,
      cancelUrl: request.cancelUrl ?? `${process.env.APP_URL ?? 'http://localhost:3000'}/billing/cancel`,
    };
  }

  /** Record subscription from webhook event. */
  activateSubscription(tenantId: string, tier: TenantTier, productId: string, periodEnd: string | null): void {
    this.subscriptions.set(tenantId, {
      tenantId,
      tier,
      productId,
      active: true,
      currentPeriodEnd: periodEnd,
    });
  }

  /** Deactivate subscription (cancellation/expiry). */
  deactivateSubscription(tenantId: string): void {
    const sub = this.subscriptions.get(tenantId);
    if (sub) {
      sub.active = false;
      sub.tier = 'free';
    }
  }

  getSubscription(tenantId: string): SubscriptionStatus | undefined {
    return this.subscriptions.get(tenantId);
  }

  isActive(tenantId: string): boolean {
    return this.subscriptions.get(tenantId)?.active ?? false;
  }

  getCurrentTier(tenantId: string): TenantTier {
    return this.subscriptions.get(tenantId)?.tier ?? 'free';
  }
}
