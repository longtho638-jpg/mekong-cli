/**
 * @agencyos/webhook-billing-sdk — Provider-Agnostic Webhook & Billing Types
 *
 * Unified type definitions for webhook verification, event routing,
 * billing lifecycle, and subscription management across all providers.
 */

// ─── Webhook Types (Provider-Agnostic) ──────────────────────────

/** Supported payment/webhook providers */
export type WebhookProvider = 'stripe' | 'polar' | 'payos' | string;

/** Universal webhook event structure after provider-specific parsing */
export interface WebhookEvent {
  id: string;
  type: string;
  provider: WebhookProvider;
  data: Record<string, unknown>;
  timestamp: number;
  raw: unknown;
}

/** Result of webhook processing pipeline */
export type WebhookProcessingStatus =
  | 'processed'
  | 'duplicate'
  | 'ignored'
  | 'invalid_signature'
  | 'unknown_provider'
  | 'error';

export interface WebhookProcessingResult {
  status: WebhookProcessingStatus;
  provider: WebhookProvider;
  eventId?: string;
  eventType?: string;
  message?: string;
}

/** Signature verification result */
export interface SignatureVerifyResult {
  valid: boolean;
  event?: WebhookEvent;
  error?: string;
}

/** Idempotency store interface — implement with your DB/Redis */
export interface IdempotencyStore {
  isProcessed: (eventId: string, provider?: string) => Promise<boolean>;
  markProcessed: (eventId: string, provider: string, eventType: string) => Promise<void>;
}

/** Audit logger interface — implement with your logging system */
export interface WebhookAuditLogger {
  onEvent: (event: WebhookEvent, result: WebhookProcessingResult) => Promise<void>;
}

// ─── Billing Types ──────────────────────────────────────────────

/** Standard plan tiers across all SaaS products */
export type PlanTier = 'free' | 'starter' | 'growth' | 'premium' | 'master' | 'enterprise';

/** Billing cycle options */
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

/** Subscription lifecycle states */
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired';

/** Checkout flow steps */
export type CheckoutStep = 'plan_selection' | 'billing_info' | 'payment' | 'confirmation' | 'error';

/** Available subscription actions based on current state */
export type SubscriptionAction = 'upgrade' | 'downgrade' | 'cancel' | 'pause' | 'resume' | 'reactivate';

/** Checkout provider identifiers */
export type CheckoutProvider = 'polar' | 'stripe' | 'payos';

// ─── Webhook Handler Config (Unified) ───────────────────────────

/** Config for creating a unified webhook handler */
export interface WebhookBillingConfig {
  /** Provider-specific handler implementations */
  providers: Record<string, ProviderWebhookHandler>;
  /** Optional idempotency store */
  idempotency?: IdempotencyStore;
  /** Optional audit logger */
  audit?: WebhookAuditLogger;
}

/** Per-provider webhook handler interface */
export interface ProviderWebhookHandler {
  /** Verify webhook signature. Return parsed event on success, null on failure. */
  verify(rawBody: string, headers: Record<string, string>): Promise<WebhookEvent | null>;
  /** Process verified webhook event */
  handle(event: WebhookEvent): Promise<{ processed: boolean; message?: string }>;
}
