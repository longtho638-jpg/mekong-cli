/**
 * @agencyos/vibe-stripe — Stripe-Specific Types
 *
 * All Stripe-related type definitions for the adapter layer.
 * Maps Stripe concepts to AgencyOS vibe-payment abstractions.
 */

// ─── Configuration ──────────────────────────────────────────────

export interface StripeConfig {
  /** Stripe secret key (sk_...) */
  secretKey: string;
  /** Stripe publishable key (pk_...) */
  publishableKey?: string;
  /** Webhook signing secret (whsec_...) */
  webhookSecret?: string;
  /** Stripe API version — pinned for stability */
  apiVersion?: string;
  /** Price ID mapping: internal plan → Stripe price_id */
  priceMapping?: Record<string, string>;
}

// ─── Checkout Session ───────────────────────────────────────────

export interface StripeCheckoutConfig {
  priceId?: string;
  mode: 'subscription' | 'payment';
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  customerId?: string;
  trialDays?: number;
  allowPromotionCodes?: boolean;
  metadata?: Record<string, string>;
  lineItems?: StripeLineItem[];
}

export interface StripeLineItem {
  price?: string;
  quantity: number;
  priceData?: {
    currency: string;
    unitAmount: number;
    productData: { name: string; description?: string };
    recurring?: { interval: 'month' | 'year' };
  };
}

export interface StripeCheckoutResult {
  sessionId: string;
  url: string;
}

// ─── Billing Portal ─────────────────────────────────────────────

export interface StripeBillingPortalConfig {
  customerId: string;
  returnUrl: string;
}

export interface StripeBillingPortalResult {
  url: string;
}

// ─── Webhook Events ─────────────────────────────────────────────

export type StripeWebhookEventType =
  | 'checkout.session.completed'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'customer.subscription.paused'
  | 'customer.subscription.resumed'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed';

export interface StripeWebhookEvent {
  id: string;
  type: StripeWebhookEventType;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
  livemode: boolean;
}

export interface StripeWebhookVerifyResult {
  valid: boolean;
  event?: StripeWebhookEvent;
  error?: string;
}

// ─── Subscription ───────────────────────────────────────────────

export interface StripeSubscriptionInfo {
  id: string;
  status: 'active' | 'trialing' | 'past_due' | 'paused' | 'canceled' | 'unpaid' | 'incomplete';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  trialEnd?: number;
  planAmount: number;
  currency: string;
  customerId: string;
  priceId: string;
}

// ─── Customer ───────────────────────────────────────────────────

export interface StripeCustomerInfo {
  id: string;
  email: string;
  name?: string;
  metadata: Record<string, string>;
}

// ─── Webhook Handler Callbacks ──────────────────────────────────

export interface StripeWebhookHandlers {
  onCheckoutCompleted?: (session: Record<string, unknown>) => Promise<void>;
  onPaymentSucceeded?: (invoice: Record<string, unknown>) => Promise<void>;
  onPaymentFailed?: (invoice: Record<string, unknown>) => Promise<void>;
  onSubscriptionCreated?: (subscription: Record<string, unknown>) => Promise<void>;
  onSubscriptionUpdated?: (subscription: Record<string, unknown>) => Promise<void>;
  onSubscriptionDeleted?: (subscription: Record<string, unknown>) => Promise<void>;
}

// ─── Stripe HTTP Client Interface ───────────────────────────────
// Abstraction layer so adapter works with any HTTP client (fetch, axios, Stripe SDK)

export interface StripeHttpClient {
  post<T>(path: string, body: Record<string, unknown>): Promise<T>;
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  del<T>(path: string): Promise<T>;
}
