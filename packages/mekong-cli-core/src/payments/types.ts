/**
 * Payment types for Polar.sh webhook integration.
 * Phase 1 of v0.6 Payment Webhook.
 */
import type { LicenseTier } from '../license/types.js';

/** Polar.sh webhook event types */
export type WebhookEventType =
  | 'checkout.created'
  | 'checkout.updated'
  | 'checkout.completed'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.active'
  | 'subscription.canceled'
  | 'subscription.revoked'
  | 'order.created';

/** Payment processing status */
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded' | 'disputed';

/** Subscription lifecycle state */
export type SubscriptionState =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'unpaid'
  | 'trialing'
  | 'incomplete';

/** Polar.sh product representation */
export interface PolarProduct {
  id: string;
  name: string;
  description?: string;
  price_amount: number;
  price_currency: string;
  /** Mapped license tier for this product */
  tier?: LicenseTier;
}

/** Checkout data in webhook payload */
export interface PolarCheckout {
  id: string;
  status: string;
  customer_email: string;
  customer_id?: string;
  product_id: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

/** Subscription data in webhook payload */
export interface PolarSubscription {
  id: string;
  status: SubscriptionState;
  customer_id: string;
  customer_email?: string;
  product_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end?: boolean;
  metadata?: Record<string, string>;
}

/** Webhook event payload from Polar.sh */
export interface WebhookPayload {
  type: WebhookEventType;
  id: string;
  created_at: string;
  data: PolarCheckout | PolarSubscription | Record<string, unknown>;
}

/** Processed webhook event record */
export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  receivedAt: string;
  processed: boolean;
  customerId?: string;
  customerEmail?: string;
  productId?: string;
  tier?: LicenseTier;
  licenseKey?: string;
  error?: string;
}

/** Product ID → LicenseTier mapping */
export const POLAR_PRODUCT_TIER_MAP: Record<string, LicenseTier> = {
  // Override via POLAR_PRODUCT_MAP env var JSON: {"prod_xxx": "pro"}
};

/** Resolve tier from product ID, checking env override first */
export function resolveTierFromProduct(productId: string): LicenseTier {
  const envMap = process.env['POLAR_PRODUCT_MAP'];
  if (envMap) {
    try {
      const parsed = JSON.parse(envMap) as Record<string, string>;
      if (parsed[productId]) return parsed[productId] as LicenseTier;
    } catch {
      // ignore parse errors
    }
  }
  // Fallback: embedded map
  return POLAR_PRODUCT_TIER_MAP[productId] ?? inferTierFromProductId(productId);
}

/** Infer tier from product ID naming convention */
function inferTierFromProductId(productId: string): LicenseTier {
  const lower = productId.toLowerCase();
  // Check enterprise first (most specific)
  if (lower.includes('enterprise')) return 'enterprise';
  // Check starter before pro — 'prod_' prefix contains 'pro' substring
  if (lower.includes('starter')) return 'starter';
  // Match '_pro' or '-pro' or 'pro_' or 'pro-' to avoid matching 'prod'
  if (/(?:^|[_\-])pro(?:[_\-]|$)/.test(lower)) return 'pro';
  return 'starter'; // default for paid products
}
