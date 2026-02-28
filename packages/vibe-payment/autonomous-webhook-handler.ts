/**
 * Autonomous Billing Webhook Handler
 *
 * Provider-agnostic webhook processing pipeline.
 * Handles: signature verification, idempotency, state machine, event routing.
 *
 * Designed for Supabase Edge Functions but decoupled from any specific provider.
 */

import type {
  VibePaymentProvider,
  VibePaymentStatusCode,
  VibeWebhookConfig,
  VibeWebhookEvent,
  WebhookProcessingResult,
} from './types';

// ─── State Machine ──────────────────────────────────────────────

/** Valid status transitions — prevents invalid state changes */
const VALID_TRANSITIONS: Record<string, VibePaymentStatusCode[]> = {
  pending: ['PAID', 'CANCELLED'],
  paid: [], // terminal state
  cancelled: [], // terminal state
  failed: ['PENDING'], // retry allowed
};

function isValidTransition(current: string, next: VibePaymentStatusCode): boolean {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed) return false;
  return allowed.includes(next);
}

// ─── Webhook Handler Types ──────────────────────────────────────

interface OrderRecord {
  id: string;
  status: string;
  userId: string | null;
  orderCode: number;
}

interface SubscriptionIntentRecord {
  id: string;
  userId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  status: string;
  orgId?: string | null;
}

interface WebhookHandlerDeps {
  /** Find order by orderCode */
  findOrder: (orderCode: number) => Promise<OrderRecord | null>;
  /** Find subscription intent by orderCode */
  findSubscriptionIntent: (orderCode: number) => Promise<SubscriptionIntentRecord | null>;
  /** Atomically update order status (only if current status matches) */
  updateOrderStatus: (orderId: string, fromStatus: string, toStatus: string, paymentData: Record<string, unknown>) => Promise<boolean>;
  /** Update subscription intent status */
  updateSubscriptionIntent: (intentId: string, status: string) => Promise<void>;
  /** Activate a subscription after payment */
  activateSubscription: (intent: SubscriptionIntentRecord) => Promise<void>;
  /** Log to audit table */
  logAudit: (userId: string | null, action: string, payload: Record<string, unknown>, severity: string) => Promise<void>;
}

// ─── Main Handler ───────────────────────────────────────────────

/**
 * Process a webhook event autonomously.
 *
 * Pipeline:
 * 1. Parse & verify signature via provider adapter
 * 2. Route to order or subscription handler
 * 3. Apply state machine + idempotency guard
 * 4. Execute side effects (via config callbacks)
 * 5. Return processing result
 */
export async function processWebhookEvent(
  provider: VibePaymentProvider,
  rawPayload: unknown,
  signature: string,
  config: VibeWebhookConfig,
  deps: WebhookHandlerDeps,
): Promise<WebhookProcessingResult> {
  const event = await provider.parseWebhookEvent(rawPayload, signature, config.checksumKey);

  if (!event) {
    await deps.logAudit(null, 'WEBHOOK_SIGNATURE_FAILED', { provider: provider.name }, 'failure');
    return { status: 'error', message: 'Invalid signature' };
  }

  const order = await deps.findOrder(event.orderCode);

  if (order) {
    return processOrderWebhook(event, order, config, deps);
  }

  const intent = await deps.findSubscriptionIntent(event.orderCode);

  if (intent) {
    return processSubscriptionWebhook(event, intent, config, deps);
  }

  await deps.logAudit(null, 'WEBHOOK_ORDER_NOT_FOUND', { orderCode: event.orderCode }, 'failure');
  return { status: 'error', message: `Order ${event.orderCode} not found` };
}

// ─── Order Processing ───────────────────────────────────────────

async function processOrderWebhook(
  event: VibeWebhookEvent,
  order: OrderRecord,
  config: VibeWebhookConfig,
  deps: WebhookHandlerDeps,
): Promise<WebhookProcessingResult> {
  const newStatus = eventTypeToStatus(event.type);

  if (!isValidTransition(order.status, newStatus)) {
    await deps.logAudit(order.userId, 'WEBHOOK_IGNORED', {
      orderId: order.id,
      currentStatus: order.status,
      attemptedStatus: newStatus,
      reason: 'Invalid state transition',
    }, 'info');

    return { status: 'ignored', orderCode: event.orderCode, reason: `Order already ${order.status}` };
  }

  const updated = await deps.updateOrderStatus(order.id, order.status, newStatus.toLowerCase(), event.raw);

  if (!updated) {
    return { status: 'ignored', orderCode: event.orderCode, reason: 'Concurrent webhook already processed' };
  }

  await deps.logAudit(order.userId, 'WEBHOOK_SUCCESS', {
    orderId: order.id,
    oldStatus: order.status,
    newStatus,
    amount: event.amount,
  }, 'success');

  if (newStatus === 'PAID' && config.onOrderPaid) {
    config.onOrderPaid(event, order.id).catch(() => { /* fire-and-forget */ });
  }

  if (newStatus === 'CANCELLED' && config.onOrderCancelled) {
    config.onOrderCancelled(event, order.id).catch(() => { /* fire-and-forget */ });
  }

  return { status: 'processed', orderCode: event.orderCode, newStatus };
}

// ─── Subscription Processing ────────────────────────────────────

async function processSubscriptionWebhook(
  event: VibeWebhookEvent,
  intent: SubscriptionIntentRecord,
  config: VibeWebhookConfig,
  deps: WebhookHandlerDeps,
): Promise<WebhookProcessingResult> {
  if (intent.status !== 'pending') {
    return { status: 'ignored', orderCode: event.orderCode, reason: 'Subscription already processed' };
  }

  const isPaid = event.type === 'payment.paid';
  const isCancelled = event.type === 'payment.cancelled';
  const newIntentStatus = isPaid ? 'paid' : isCancelled ? 'canceled' : 'pending';
  const newStatus: VibePaymentStatusCode = isPaid ? 'PAID' : isCancelled ? 'CANCELLED' : 'PENDING';

  await deps.updateSubscriptionIntent(intent.id, newIntentStatus);

  if (isPaid) {
    await deps.activateSubscription(intent);

    if (config.onSubscriptionPaid) {
      config.onSubscriptionPaid(event, {
        id: intent.id,
        userId: intent.userId,
        planId: intent.planId,
        billingCycle: intent.billingCycle,
        amount: event.amount,
        status: 'paid',
      }).catch(() => { /* fire-and-forget */ });
    }
  }

  if (isCancelled && config.onSubscriptionCancelled) {
    config.onSubscriptionCancelled(event, {
      id: intent.id,
      userId: intent.userId,
      planId: intent.planId,
      billingCycle: intent.billingCycle,
      amount: event.amount,
      status: 'canceled',
    }).catch(() => { /* fire-and-forget */ });
  }

  return { status: 'processed', orderCode: event.orderCode, newStatus };
}

// ─── Helpers ────────────────────────────────────────────────────

function eventTypeToStatus(type: string): VibePaymentStatusCode {
  switch (type) {
    case 'payment.paid': return 'PAID';
    case 'payment.cancelled': return 'CANCELLED';
    default: return 'PENDING';
  }
}

export type { WebhookHandlerDeps, OrderRecord, SubscriptionIntentRecord };
export { isValidTransition, VALID_TRANSITIONS };
