/**
 * @agencyos/vibe-stripe — Stripe Subscription & Billing SDK
 *
 * Reusable Stripe adapter for AgencyOS ecosystem.
 * Implements VibePaymentProvider + Stripe-specific subscription hooks.
 *
 * Usage:
 *   import { createStripeAdapter, createStripeSubscriptionHooks, createStripeWebhookHandler } from '@agencyos/vibe-stripe';
 *
 *   // Adapter (low-level API)
 *   const stripe = createStripeAdapter({ secretKey: 'sk_...' });
 *   const session = await stripe.createCheckoutSession({ ... });
 *
 *   // Subscription hooks (high-level lifecycle)
 *   const hooks = createStripeSubscriptionHooks({ secretKey: 'sk_...', tierToPriceId: { ... } });
 *   const checkout = await hooks.startCheckout({ tier: 'growth', email: 'user@example.com' });
 *
 *   // Webhook handler (server-side)
 *   const handler = createStripeWebhookHandler({ webhookSecret: 'whsec_...', onCheckoutCompleted: async (s) => {} });
 *   const result = await handler.handleRequest(rawBody, sigHeader);
 */

// Adapter
export { StripeAdapter, createStripeAdapter } from './stripe-adapter';

// Webhook handler
export { createStripeWebhookHandler, verifyStripeSignatureAsync } from './stripe-webhook-handler';
export type { StripeWebhookHandlerConfig, WebhookResult } from './stripe-webhook-handler';

// Subscription hooks
export { createStripeSubscriptionHooks } from './stripe-subscription-hooks';
export type { StripeSubscriptionHooksConfig } from './stripe-subscription-hooks';

// All types
export type {
  StripeConfig,
  StripeCheckoutConfig,
  StripeCheckoutResult,
  StripeBillingPortalConfig,
  StripeBillingPortalResult,
  StripeWebhookEvent,
  StripeWebhookEventType,
  StripeWebhookVerifyResult,
  StripeWebhookHandlers,
  StripeSubscriptionInfo,
  StripeCustomerInfo,
  StripeLineItem,
  StripeHttpClient,
} from './types';
