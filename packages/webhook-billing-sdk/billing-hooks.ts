/**
 * @agencyos/webhook-billing-sdk — Billing Hooks Facade
 *
 * Re-exports billing lifecycle hooks from @agencyos/vibe-billing-hooks
 * and subscription engine from @agencyos/vibe-subscription.
 *
 * Single import for all billing logic:
 *   import { createPricingHook, createSubscriptionEngine } from '@agencyos/webhook-billing-sdk/billing';
 */

// ─── Billing Hooks (from vibe-billing-hooks) ────────────────────

export {
  // Pricing
  createPricingHook,
  // Checkout
  createCheckoutHook,
  // Subscription management
  createSubscriptionHook,
  // Invoicing
  createInvoiceHook,
  // Usage tracking
  createUsageTrackingHook,
} from '@agencyos/vibe-billing-hooks';

export type {
  PricingHookConfig,
  PricingState,
  CheckoutState,
  CheckoutHookConfig,
  SubscriptionManagementState,
  SubscriptionHookConfig,
  InvoiceFilter,
} from '@agencyos/vibe-billing-hooks';

// ─── Subscription Engine (from vibe-subscription) ───────────────

export {
  createSubscriptionEngine,
  createUsageMeter,
  createChurnAnalyzer,
} from '@agencyos/vibe-subscription';

export type {
  PlanDefinition,
  PlanLimits,
  Subscription,
  UsageRecord,
  SubscriptionEngineConfig,
  ChurnRisk,
} from '@agencyos/vibe-subscription';
