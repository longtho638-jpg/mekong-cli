/**
 * @agencyos/vibe-stripe — Stripe Subscription Lifecycle Hooks
 *
 * Framework-agnostic hooks for Stripe subscription management.
 * Wraps StripeAdapter into composable lifecycle functions.
 *
 * Usage:
 *   import { createStripeSubscriptionHooks } from '@agencyos/vibe-stripe/hooks';
 *   const hooks = createStripeSubscriptionHooks({ secretKey: 'sk_...' });
 *   const session = await hooks.startCheckout({ priceId: 'price_...', email: '...' });
 */

import type { PlanTier } from '@agencyos/vibe-subscription';
import type {
  StripeConfig,
  StripeCheckoutResult,
  StripeBillingPortalResult,
  StripeSubscriptionInfo,
  StripeCustomerInfo,
} from './types';
import { StripeAdapter } from './stripe-adapter';

// ─── Hook Config ────────────────────────────────────────────────

export interface StripeSubscriptionHooksConfig extends StripeConfig {
  /** Default success URL after checkout */
  defaultSuccessUrl?: string;
  /** Default cancel URL for checkout */
  defaultCancelUrl?: string;
  /** Default trial period in days */
  defaultTrialDays?: number;
  /** Map internal plan tiers to Stripe price IDs */
  tierToPriceId?: Record<PlanTier, { monthly: string; yearly: string }>;
}

// ─── Hooks Factory ──────────────────────────────────────────────

export function createStripeSubscriptionHooks(config: StripeSubscriptionHooksConfig) {
  const adapter = new StripeAdapter(config);
  const {
    defaultSuccessUrl = '/checkout/success',
    defaultCancelUrl = '/checkout/cancel',
    defaultTrialDays,
    tierToPriceId,
  } = config;

  return {
    /** Get the underlying adapter for direct API access */
    getAdapter: () => adapter,

    /**
     * Start checkout flow — creates a Stripe Checkout Session.
     * Returns the URL to redirect the user to.
     */
    async startCheckout(params: {
      priceId?: string;
      tier?: PlanTier;
      billingCycle?: 'monthly' | 'yearly';
      email?: string;
      customerId?: string;
      trialDays?: number;
      successUrl?: string;
      cancelUrl?: string;
      metadata?: Record<string, string>;
    }): Promise<StripeCheckoutResult> {
      // Resolve price ID from tier if not directly provided
      let priceId = params.priceId;
      if (!priceId && params.tier && tierToPriceId) {
        const cycle = params.billingCycle ?? 'monthly';
        priceId = tierToPriceId[params.tier]?.[cycle];
      }

      if (!priceId) {
        throw new Error('Either priceId or tier (with tierToPriceId config) is required');
      }

      return adapter.createCheckoutSession({
        priceId,
        mode: 'subscription',
        customerEmail: params.email,
        customerId: params.customerId,
        trialDays: params.trialDays ?? defaultTrialDays,
        successUrl: params.successUrl ?? defaultSuccessUrl,
        cancelUrl: params.cancelUrl ?? defaultCancelUrl,
        metadata: params.metadata,
      });
    },

    /**
     * Create a one-time payment checkout (not subscription).
     */
    async startPayment(params: {
      amount: number;
      currency?: string;
      productName: string;
      email?: string;
      successUrl?: string;
      cancelUrl?: string;
      metadata?: Record<string, string>;
    }): Promise<StripeCheckoutResult> {
      return adapter.createCheckoutSession({
        mode: 'payment',
        customerEmail: params.email,
        successUrl: params.successUrl ?? defaultSuccessUrl,
        cancelUrl: params.cancelUrl ?? defaultCancelUrl,
        metadata: params.metadata,
        lineItems: [{
          quantity: 1,
          priceData: {
            currency: params.currency ?? 'usd',
            unitAmount: Math.round(params.amount * 100),
            productData: { name: params.productName },
          },
        }],
      });
    },

    /**
     * Open Stripe Billing Portal for customer self-service.
     * (manage payment methods, view invoices, cancel subscription)
     */
    async openBillingPortal(params: {
      customerId: string;
      returnUrl?: string;
    }): Promise<StripeBillingPortalResult> {
      return adapter.createBillingPortal({
        customerId: params.customerId,
        returnUrl: params.returnUrl ?? defaultSuccessUrl,
      });
    },

    /**
     * Get current subscription status.
     */
    async getSubscriptionStatus(subscriptionId: string): Promise<StripeSubscriptionInfo> {
      return adapter.getSubscription(subscriptionId);
    },

    /**
     * Upgrade or downgrade subscription to a different plan.
     */
    async changePlan(params: {
      subscriptionId: string;
      newPriceId?: string;
      newTier?: PlanTier;
      billingCycle?: 'monthly' | 'yearly';
    }): Promise<StripeSubscriptionInfo> {
      let priceId = params.newPriceId;
      if (!priceId && params.newTier && tierToPriceId) {
        const cycle = params.billingCycle ?? 'monthly';
        priceId = tierToPriceId[params.newTier]?.[cycle];
      }

      if (!priceId) {
        throw new Error('Either newPriceId or newTier (with tierToPriceId config) is required');
      }

      return adapter.updateSubscription(params.subscriptionId, priceId);
    },

    /**
     * Cancel subscription (at period end by default).
     */
    async cancelSubscription(subscriptionId: string, immediately = false): Promise<StripeSubscriptionInfo> {
      return adapter.cancelSubscription(subscriptionId, !immediately);
    },

    /**
     * Find or create a Stripe customer by email.
     */
    async ensureCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<StripeCustomerInfo> {
      return adapter.findOrCreateCustomer(email, name, metadata);
    },

    /**
     * List recent invoices for a customer.
     */
    async getInvoices(customerId: string, limit = 10): Promise<Record<string, unknown>[]> {
      return adapter.listInvoices(customerId, limit);
    },

    /**
     * Resolve a PlanTier to its Stripe price ID.
     */
    resolvePriceId(tier: PlanTier, cycle: 'monthly' | 'yearly' = 'monthly'): string | undefined {
      return tierToPriceId?.[tier]?.[cycle];
    },
  };
}
