/**
 * @agencyos/vibe-subscription-webhooks — Subscription Lifecycle Webhook SDK
 *
 * Handles subscription-specific webhook events with status transition validation,
 * grace period management, trial warnings, and dunning support.
 *
 * Quick Start:
 *   import {
 *     createSubscriptionWebhookHandler,
 *     createSubscriptionEventRouter,
 *   } from '@agencyos/vibe-subscription-webhooks';
 *
 *   const handler = createSubscriptionWebhookHandler({
 *     callbacks: {
 *       onCreated: async (e) => activateSubscription(e.subscriptionId),
 *       onCancelled: async (e) => revokeAccess(e.userId),
 *       onPastDue: async (e) => sendDunningEmail(e.userId),
 *     },
 *   });
 *
 *   const result = await handler.handle(webhookPayload, 'polar');
 *
 * Sub-path imports:
 *   import { createSubscriptionWebhookHandler } from '@agencyos/vibe-subscription-webhooks/handler';
 *   import { createSubscriptionEventRouter } from '@agencyos/vibe-subscription-webhooks/router';
 *   import type { SubscriptionWebhookEvent } from '@agencyos/vibe-subscription-webhooks/types';
 */

// ─── Handler ────────────────────────────────────────────────────

export { createSubscriptionWebhookHandler } from './subscription-webhook-handler';

// ─── Event Router ───────────────────────────────────────────────

export { createSubscriptionEventRouter } from './subscription-event-router';

// ─── Types ──────────────────────────────────────────────────────

export type {
  SubscriptionWebhookEventType,
  SubscriptionWebhookEvent,
  StatusTransition,
  SubscriptionWebhookCallbacks,
  SubscriptionWebhookHandlerConfig,
  SubscriptionWebhookResult,
} from './subscription-webhook-types';
