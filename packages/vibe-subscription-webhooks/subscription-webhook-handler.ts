/**
 * @agencyos/vibe-subscription-webhooks — Webhook Handler
 *
 * Subscription-specific webhook handler that processes lifecycle events
 * with status transition validation, grace period management, and dunning.
 *
 * Usage:
 *   import { createSubscriptionWebhookHandler } from '@agencyos/vibe-subscription-webhooks/handler';
 *   const handler = createSubscriptionWebhookHandler({
 *     callbacks: {
 *       onCreated: async (e) => { await db.activateSubscription(e.subscriptionId) },
 *       onCancelled: async (e) => { await db.revokeAccess(e.userId) },
 *     },
 *   });
 *   const result = await handler.handle(rawPayload, 'polar');
 */

import { createSubscriptionEventRouter } from './subscription-event-router';
import type {
  SubscriptionWebhookHandlerConfig,
  SubscriptionWebhookEvent,
  SubscriptionWebhookResult,
} from './subscription-webhook-types';

export function createSubscriptionWebhookHandler(config: SubscriptionWebhookHandlerConfig) {
  const {
    callbacks,
    gracePeriodDays = 3,
    trialWarningDays = 3,
    strictTransitions = true,
  } = config;

  const router = createSubscriptionEventRouter();

  // Map event types → callback functions
  const callbackMap: Record<string, ((e: SubscriptionWebhookEvent) => Promise<void>) | undefined> = {
    'subscription.created': callbacks.onCreated,
    'subscription.updated': callbacks.onUpdated,
    'subscription.cancelled': callbacks.onCancelled,
    'subscription.renewed': callbacks.onRenewed,
    'subscription.past_due': callbacks.onPastDue,
    'subscription.paused': callbacks.onPaused,
    'subscription.resumed': callbacks.onResumed,
    'subscription.trial_ending': callbacks.onTrialEnding,
    'subscription.expired': callbacks.onExpired,
  };

  return {
    /** Grace period configuration */
    gracePeriodDays,
    /** Trial warning configuration */
    trialWarningDays,

    /**
     * Process raw webhook payload for subscription events.
     * Returns null if event is not subscription-related.
     */
    async handle(
      rawPayload: Record<string, unknown>,
      provider: string,
    ): Promise<SubscriptionWebhookResult | null> {
      const event = router.parseEvent(rawPayload, provider);
      if (!event) return null;

      // Validate status transition (strict mode)
      let transition = undefined;
      if (strictTransitions && event.previousStatus) {
        transition = router.validateTransition(
          event.previousStatus,
          event.currentStatus,
          event.type,
        );
        if (!transition) {
          return {
            processed: false,
            event: event.type,
            subscriptionId: event.subscriptionId,
            message: `Invalid transition: ${event.previousStatus} → ${event.currentStatus} via ${event.type}`,
          };
        }
      }

      // Execute callback
      const callback = callbackMap[event.type];
      if (callback) {
        await callback(event);
      }

      return {
        processed: true,
        event: event.type,
        subscriptionId: event.subscriptionId,
        transition: transition ?? undefined,
        message: callback ? `Handled ${event.type}` : `Acknowledged ${event.type} (no callback)`,
      };
    },

    /**
     * Check if a subscription should be expired based on grace period.
     * Call this periodically (cron) to expire past_due subscriptions.
     */
    shouldExpire(pastDueSince: Date): boolean {
      const now = new Date();
      const deadline = new Date(pastDueSince);
      deadline.setDate(deadline.getDate() + gracePeriodDays);
      return now > deadline;
    },

    /**
     * Check if trial is ending soon (within trialWarningDays).
     */
    isTrialEndingSoon(trialEndDate: Date): boolean {
      const now = new Date();
      const warningDate = new Date(trialEndDate);
      warningDate.setDate(warningDate.getDate() - trialWarningDays);
      return now >= warningDate && now < trialEndDate;
    },

    /**
     * Get the subscription event router (for external use)
     */
    getRouter() {
      return router;
    },
  };
}
