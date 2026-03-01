/**
 * Subscription Webhooks facade — lifecycle event handling, status transitions, dunning
 */
export {
  createSubscriptionWebhookHandler,
  createSubscriptionEventRouter,
} from '@agencyos/vibe-subscription-webhooks';

export type {
  SubscriptionWebhookEventType,
  SubscriptionWebhookEvent,
  StatusTransition,
  SubscriptionWebhookCallbacks,
  SubscriptionWebhookHandlerConfig,
  SubscriptionWebhookResult,
} from '@agencyos/vibe-subscription-webhooks';

export class SubscriptionWebhooksFacade {
  /**
   * Create a subscription webhook handler with lifecycle callbacks.
   * Facade wrapper around createSubscriptionWebhookHandler.
   */
  createHandler(callbacks: import('@agencyos/vibe-subscription-webhooks').SubscriptionWebhookCallbacks) {
    const { createSubscriptionWebhookHandler: create } = require('@agencyos/vibe-subscription-webhooks');
    return create({ callbacks });
  }

  /**
   * Create an event router for parsing/validating subscription events.
   */
  createRouter() {
    const { createSubscriptionEventRouter: create } = require('@agencyos/vibe-subscription-webhooks');
    return create();
  }
}
