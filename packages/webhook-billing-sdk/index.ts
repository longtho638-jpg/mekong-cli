/**
 * @agencyos/webhook-billing-sdk — Unified Webhook & Billing SDK
 *
 * Facade package that consolidates all webhook verification, event routing,
 * billing lifecycle, and subscription management from the AgencyOS ecosystem.
 *
 * Quick Start:
 *   // Webhook handling
 *   import { createWebhookBillingHandler, createStripeWebhookHandler } from '@agencyos/webhook-billing-sdk';
 *
 *   // Billing hooks
 *   import { createPricingHook, createCheckoutHook } from '@agencyos/webhook-billing-sdk';
 *
 *   // Subscription engine
 *   import { createSubscriptionEngine, createChurnAnalyzer } from '@agencyos/webhook-billing-sdk';
 *
 * Sub-path imports:
 *   import { createWebhookBillingHandler } from '@agencyos/webhook-billing-sdk/webhook';
 *   import { createPricingHook } from '@agencyos/webhook-billing-sdk/billing';
 *   import type { WebhookEvent } from '@agencyos/webhook-billing-sdk/types';
 */

// ─── Webhook Handler (unified + provider-specific) ──────────────

export {
  // Unified handler
  createWebhookBillingHandler,
  webhookResultToResponse,
  // Stripe-specific
  createStripeWebhookHandler,
  verifyStripeSignatureAsync,
  // Multi-provider dispatcher
  createWebhookDispatcher,
} from './webhook-handler';

export type {
  StripeWebhookHandlerConfig,
  WebhookResult,
  WebhookDispatcherConfig,
  WebhookProviderHandler,
  ParsedWebhookEvent,
} from './webhook-handler';

// ─── Billing Hooks ──────────────────────────────────────────────

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
  // Subscription engine
  createSubscriptionEngine,
  createUsageMeter,
  createChurnAnalyzer,
} from './billing-hooks';

export type {
  PricingHookConfig,
  PricingState,
  CheckoutState,
  CheckoutHookConfig,
  SubscriptionManagementState,
  SubscriptionHookConfig,
  InvoiceFilter,
  PlanDefinition,
  PlanLimits,
  Subscription,
  UsageRecord,
  SubscriptionEngineConfig,
  ChurnRisk,
} from './billing-hooks';

// ─── Types ──────────────────────────────────────────────────────

export type {
  // Webhook types
  WebhookProvider,
  WebhookEvent,
  WebhookProcessingStatus,
  WebhookProcessingResult,
  SignatureVerifyResult,
  IdempotencyStore,
  WebhookAuditLogger,
  WebhookBillingConfig,
  ProviderWebhookHandler,
  // Billing types
  PlanTier,
  BillingCycle,
  SubscriptionStatus,
  CheckoutStep,
  SubscriptionAction,
  CheckoutProvider,
} from './webhook-billing-types';
