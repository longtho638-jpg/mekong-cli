/**
 * @agencyos/vibe-subscription-webhooks — Subscription Webhook Types
 *
 * Type definitions for subscription lifecycle webhook events,
 * status transitions, and handler configuration.
 */

// ─── Subscription Event Types ────────────────────────────────────

/** All subscription-related webhook event types */
export type SubscriptionWebhookEventType =
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'subscription.renewed'
  | 'subscription.past_due'
  | 'subscription.paused'
  | 'subscription.resumed'
  | 'subscription.trial_ending'
  | 'subscription.expired';

/** Parsed subscription webhook event */
export interface SubscriptionWebhookEvent {
  id: string;
  type: SubscriptionWebhookEventType;
  subscriptionId: string;
  userId: string;
  planTier: string;
  billingCycle: string;
  provider: string;
  timestamp: string;
  /** Previous state (for transitions) */
  previousStatus?: string;
  /** New state */
  currentStatus: string;
  /** Raw provider-specific data */
  raw: Record<string, unknown>;
}

// ─── Status Transition ──────────────────────────────────────────

/** Valid subscription status transitions */
export interface StatusTransition {
  from: string;
  to: string;
  event: SubscriptionWebhookEventType;
  requiresAction: boolean;
  action?: string;
}

// ─── Handler Config ─────────────────────────────────────────────

/** Callbacks cho mỗi subscription lifecycle event */
export interface SubscriptionWebhookCallbacks {
  onCreated?: (event: SubscriptionWebhookEvent) => Promise<void>;
  onUpdated?: (event: SubscriptionWebhookEvent) => Promise<void>;
  onCancelled?: (event: SubscriptionWebhookEvent) => Promise<void>;
  onRenewed?: (event: SubscriptionWebhookEvent) => Promise<void>;
  onPastDue?: (event: SubscriptionWebhookEvent) => Promise<void>;
  onPaused?: (event: SubscriptionWebhookEvent) => Promise<void>;
  onResumed?: (event: SubscriptionWebhookEvent) => Promise<void>;
  onTrialEnding?: (event: SubscriptionWebhookEvent) => Promise<void>;
  onExpired?: (event: SubscriptionWebhookEvent) => Promise<void>;
}

/** Config for subscription webhook handler */
export interface SubscriptionWebhookHandlerConfig {
  callbacks: SubscriptionWebhookCallbacks;
  /** Grace period in days before marking expired (default: 3) */
  gracePeriodDays?: number;
  /** Days before trial end to trigger trial_ending event (default: 3) */
  trialWarningDays?: number;
  /** Enable strict status transition validation (default: true) */
  strictTransitions?: boolean;
}

// ─── Handler Result ─────────────────────────────────────────────

export interface SubscriptionWebhookResult {
  processed: boolean;
  event: SubscriptionWebhookEventType;
  subscriptionId: string;
  transition?: StatusTransition;
  message?: string;
}
