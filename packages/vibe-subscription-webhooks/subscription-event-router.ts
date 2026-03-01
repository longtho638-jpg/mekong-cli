/**
 * @agencyos/vibe-subscription-webhooks — Event Router
 *
 * Routes raw webhook payloads to subscription-specific handlers.
 * Validates status transitions and extracts subscription metadata.
 *
 * Usage:
 *   import { createSubscriptionEventRouter } from '@agencyos/vibe-subscription-webhooks/router';
 *   const router = createSubscriptionEventRouter();
 *   const event = router.parseEvent(rawPayload, 'polar');
 */

import type {
  SubscriptionWebhookEvent,
  SubscriptionWebhookEventType,
  StatusTransition,
} from './subscription-webhook-types';

// ─── Valid Transitions ──────────────────────────────────────────

const VALID_TRANSITIONS: StatusTransition[] = [
  { from: 'none', to: 'trialing', event: 'subscription.created', requiresAction: true, action: 'provision_access' },
  { from: 'none', to: 'active', event: 'subscription.created', requiresAction: true, action: 'provision_access' },
  { from: 'trialing', to: 'active', event: 'subscription.updated', requiresAction: false },
  { from: 'trialing', to: 'cancelled', event: 'subscription.cancelled', requiresAction: true, action: 'revoke_access' },
  { from: 'active', to: 'past_due', event: 'subscription.past_due', requiresAction: true, action: 'send_dunning' },
  { from: 'active', to: 'cancelled', event: 'subscription.cancelled', requiresAction: true, action: 'revoke_access' },
  { from: 'active', to: 'paused', event: 'subscription.paused', requiresAction: true, action: 'suspend_access' },
  { from: 'active', to: 'active', event: 'subscription.renewed', requiresAction: true, action: 'extend_period' },
  { from: 'past_due', to: 'active', event: 'subscription.renewed', requiresAction: true, action: 'restore_access' },
  { from: 'past_due', to: 'cancelled', event: 'subscription.cancelled', requiresAction: true, action: 'revoke_access' },
  { from: 'past_due', to: 'expired', event: 'subscription.expired', requiresAction: true, action: 'revoke_access' },
  { from: 'paused', to: 'active', event: 'subscription.resumed', requiresAction: true, action: 'restore_access' },
  { from: 'paused', to: 'cancelled', event: 'subscription.cancelled', requiresAction: true, action: 'revoke_access' },
];

/** All recognized subscription event types */
const SUBSCRIPTION_EVENT_TYPES = new Set<string>([
  'subscription.created',
  'subscription.updated',
  'subscription.cancelled',
  'subscription.renewed',
  'subscription.past_due',
  'subscription.paused',
  'subscription.resumed',
  'subscription.trial_ending',
  'subscription.expired',
]);

// ─── Event Router ───────────────────────────────────────────────

export function createSubscriptionEventRouter() {
  return {
    /**
     * Check nếu event type là subscription event
     */
    isSubscriptionEvent(eventType: string): boolean {
      return SUBSCRIPTION_EVENT_TYPES.has(eventType);
    },

    /**
     * Parse raw webhook payload thành SubscriptionWebhookEvent.
     * Hỗ trợ Polar, Stripe, PayOS payload formats.
     */
    parseEvent(
      rawPayload: Record<string, unknown>,
      provider: string,
    ): SubscriptionWebhookEvent | null {
      const eventType = rawPayload.type as string;
      if (!this.isSubscriptionEvent(eventType)) return null;

      const data = (rawPayload.data ?? rawPayload) as Record<string, unknown>;

      // Extract subscription ID (provider-agnostic)
      const subscriptionId =
        (data.subscription_id as string) ??
        (data.id as string) ??
        ((data.subscription as Record<string, unknown>)?.id as string) ??
        '';

      // Extract user ID
      const userId =
        (data.customer_id as string) ??
        ((data.customer as Record<string, unknown>)?.id as string) ??
        ((data.metadata as Record<string, unknown>)?.user_id as string) ??
        '';

      // Extract plan info
      const planTier =
        ((data.plan as Record<string, unknown>)?.tier as string) ??
        ((data.product as Record<string, unknown>)?.name as string) ??
        (data.plan_id as string) ??
        'unknown';

      const billingCycle =
        ((data.plan as Record<string, unknown>)?.interval as string) ??
        (data.billing_cycle as string) ??
        'monthly';

      // Extract status
      const currentStatus =
        (data.status as string) ??
        eventTypeToStatus(eventType as SubscriptionWebhookEventType);

      const previousStatus =
        ((data.previous_attributes as Record<string, unknown>)?.status as string) ??
        undefined;

      return {
        id: (rawPayload.id as string) ?? '',
        type: eventType as SubscriptionWebhookEventType,
        subscriptionId,
        userId,
        planTier,
        billingCycle,
        provider,
        timestamp: (rawPayload.created_at as string) ?? new Date().toISOString(),
        previousStatus,
        currentStatus,
        raw: rawPayload,
      };
    },

    /**
     * Validate status transition (strict mode)
     */
    validateTransition(from: string, to: string, eventType: string): StatusTransition | null {
      const fromNormalized = from.toLowerCase();
      const toNormalized = to.toLowerCase();
      return VALID_TRANSITIONS.find(
        (t) => t.from === fromNormalized && t.to === toNormalized && t.event === eventType,
      ) ?? null;
    },

    /**
     * Get all valid transitions from a given status
     */
    getValidNextStates(currentStatus: string): StatusTransition[] {
      return VALID_TRANSITIONS.filter((t) => t.from === currentStatus.toLowerCase());
    },
  };
}

// ─── Helpers ────────────────────────────────────────────────────

function eventTypeToStatus(eventType: SubscriptionWebhookEventType): string {
  const map: Record<SubscriptionWebhookEventType, string> = {
    'subscription.created': 'active',
    'subscription.updated': 'active',
    'subscription.cancelled': 'cancelled',
    'subscription.renewed': 'active',
    'subscription.past_due': 'past_due',
    'subscription.paused': 'paused',
    'subscription.resumed': 'active',
    'subscription.trial_ending': 'trialing',
    'subscription.expired': 'expired',
  };
  return map[eventType] ?? 'unknown';
}
