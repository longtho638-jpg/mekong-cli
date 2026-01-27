/**
 * Hardened PayPal Webhook Handler
 *
 * Implements:
 * - 100% signature verification (fail-closed)
 * - Idempotency protection
 * - Retry handling with exponential backoff
 * - Comprehensive event handling
 */

import {
  verifyPayPalWebhook,
  type PayPalWebhookEvent,
  type PayPalVerificationHeaders
} from './paypal-webhook-verification';
import { withIdempotency } from './idempotency-manager';
import { withRetry } from './retry-handler';

/**
 * Main PayPal webhook processor
 */
export async function processPayPalWebhook(
  headers: Record<string, string>,
  body: string | Buffer
): Promise<{ success: boolean; eventId: string; message: string }> {
  let event: PayPalWebhookEvent;
  const startTime = Date.now();

  // STEP 1: SIGNATURE VERIFICATION (MANDATORY)
  try {
    const paypalHeaders = headers as unknown as PayPalVerificationHeaders;
    event = await verifyPayPalWebhook(paypalHeaders, body);
    console.log(`🔐 PayPal signature verified for event ${event.id} (${event.event_type})`);
  } catch (verificationError) {
    const errorMessage = `PayPal signature verification failed: ${(verificationError as Error).message}`;
    console.error(`❌ ${errorMessage}`);

    // FAIL CLOSED: Reject the webhook entirely
    return {
      success: false,
      eventId: 'unknown',
      message: errorMessage
    };
  }

  // STEP 2: IDEMPOTENCY CHECK
  try {
    const result = await withIdempotency(event.id, event.event_type, async () => {
      // STEP 3: RETRY HANDLING
      return await withRetry(
        async () => {
          await processPayPalEventByType(event);
        },
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 4000,
          backoffMultiplier: 2
        }
      );
    });

    // Check if event was already processed
    if (result === null) {
      const duration = Date.now() - startTime;
      return {
        success: true,
        eventId: event.id,
        message: `Event already processed (duplicate) in ${duration}ms`
      };
    }

    const duration = Date.now() - startTime;
    console.log(`✅ PayPal event ${event.id} (${event.event_type}) processed in ${duration}ms`);

    return {
      success: true,
      eventId: event.id,
      message: `Event processed successfully in ${duration}ms`
    };
  } catch (processingError) {
    const duration = Date.now() - startTime;
    const errorMessage = `Processing failed: ${(processingError as Error).message}`;
    console.error(`❌ PayPal event ${event.id} error after ${duration}ms:`, processingError);

    return {
      success: false,
      eventId: event.id,
      message: errorMessage
    };
  }
}

/**
 * Route PayPal event to appropriate handler
 */
async function processPayPalEventByType(event: PayPalWebhookEvent): Promise<void> {
  console.log(`📨 Processing PayPal event: ${event.event_type} (${event.id})`);

  switch (event.event_type) {
    // ========== PAYMENT CAPTURE ==========
    case 'PAYMENT.CAPTURE.COMPLETED':
      await handlePaymentCaptureCompleted(event);
      break;

    case 'PAYMENT.CAPTURE.DECLINED':
      await handlePaymentCaptureDeclined(event);
      break;

    case 'PAYMENT.CAPTURE.PENDING':
      await handlePaymentCapturePending(event);
      break;

    case 'PAYMENT.CAPTURE.REFUNDED':
      await handlePaymentCaptureRefunded(event);
      break;

    case 'PAYMENT.CAPTURE.REVERSED':
      await handlePaymentCaptureReversed(event);
      break;

    // ========== CHECKOUT ORDER ==========
    case 'CHECKOUT.ORDER.APPROVED':
      await handleCheckoutOrderApproved(event);
      break;

    case 'CHECKOUT.ORDER.COMPLETED':
      await handleCheckoutOrderCompleted(event);
      break;

    // ========== BILLING SUBSCRIPTION ==========
    case 'BILLING.SUBSCRIPTION.CREATED':
      await handleSubscriptionCreated(event);
      break;

    case 'BILLING.SUBSCRIPTION.ACTIVATED':
      await handleSubscriptionActivated(event);
      break;

    case 'BILLING.SUBSCRIPTION.UPDATED':
      await handleSubscriptionUpdated(event);
      break;

    case 'BILLING.SUBSCRIPTION.EXPIRED':
      await handleSubscriptionExpired(event);
      break;

    case 'BILLING.SUBSCRIPTION.CANCELLED':
      await handleSubscriptionCancelled(event);
      break;

    case 'BILLING.SUBSCRIPTION.SUSPENDED':
      await handleSubscriptionSuspended(event);
      break;

    case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
      await handleSubscriptionPaymentFailed(event);
      break;

    // ========== CUSTOMER DISPUTES ==========
    case 'CUSTOMER.DISPUTE.CREATED':
      console.log(`⚠️  DISPUTE CREATED: ${event.id}`);
      // CRITICAL: Alert finance team
      await handleDisputeCreated(event);
      break;

    case 'CUSTOMER.DISPUTE.RESOLVED':
      await handleDisputeResolved(event);
      break;

    case 'CUSTOMER.DISPUTE.UPDATED':
      await handleDisputeUpdated(event);
      break;

    // ========== REFUNDS ==========
    case 'PAYMENT.SALE.REFUNDED':
      await handleSaleRefunded(event);
      break;

    // ========== UNHANDLED ==========
    default:
      console.log(`ℹ️  Unhandled PayPal event type: ${event.event_type}`);
  }
}

// ========== PAYMENT HANDLERS ==========

async function handlePaymentCaptureCompleted(event: PayPalWebhookEvent): Promise<void> {
  const capture = event.resource;
  console.log(`💰 Payment captured: ${capture.id} - Amount: ${capture.amount.value} ${capture.amount.currency_code}`);

  // TODO: Update database with successful payment
  // await db.payments.update({
  //   where: { paypalCaptureId: capture.id },
  //   data: { status: 'completed', capturedAt: new Date() }
  // });
}

async function handlePaymentCaptureDeclined(event: PayPalWebhookEvent): Promise<void> {
  const capture = event.resource;
  console.log(`❌ Payment declined: ${capture.id}`);

  // TODO: Mark payment as failed, notify user
}

async function handlePaymentCapturePending(event: PayPalWebhookEvent): Promise<void> {
  const capture = event.resource;
  console.log(`⏳ Payment pending: ${capture.id}`);

  // TODO: Mark payment as pending
}

async function handlePaymentCaptureRefunded(event: PayPalWebhookEvent): Promise<void> {
  const refund = event.resource;
  console.log(`↩️  Payment refunded: ${refund.id}`);

  // TODO: Process refund
}

async function handlePaymentCaptureReversed(event: PayPalWebhookEvent): Promise<void> {
  const capture = event.resource;
  console.log(`🔄 Payment reversed: ${capture.id}`);

  // TODO: Handle reversal (chargeback)
}

// ========== CHECKOUT HANDLERS ==========

async function handleCheckoutOrderApproved(event: PayPalWebhookEvent): Promise<void> {
  const order = event.resource;
  console.log(`✅ Order approved: ${order.id}`);

  // TODO: Capture the order
}

async function handleCheckoutOrderCompleted(event: PayPalWebhookEvent): Promise<void> {
  const order = event.resource;
  console.log(`🎉 Order completed: ${order.id}`);

  // TODO: Fulfill order
}

// ========== SUBSCRIPTION HANDLERS ==========

async function handleSubscriptionCreated(event: PayPalWebhookEvent): Promise<void> {
  const subscription = event.resource;
  console.log(`🆕 Subscription created: ${subscription.id}`);

  // TODO: Create subscription record
}

async function handleSubscriptionActivated(event: PayPalWebhookEvent): Promise<void> {
  const subscription = event.resource;
  console.log(`✅ Subscription activated: ${subscription.id}`);

  // TODO: Grant access to subscriber
}

async function handleSubscriptionUpdated(event: PayPalWebhookEvent): Promise<void> {
  const subscription = event.resource;
  console.log(`🔄 Subscription updated: ${subscription.id}`);

  // TODO: Update subscription record
}

async function handleSubscriptionExpired(event: PayPalWebhookEvent): Promise<void> {
  const subscription = event.resource;
  console.log(`⏰ Subscription expired: ${subscription.id}`);

  // TODO: Revoke access
}

async function handleSubscriptionCancelled(event: PayPalWebhookEvent): Promise<void> {
  const subscription = event.resource;
  console.log(`❌ Subscription cancelled: ${subscription.id}`);

  // TODO: Revoke access, send exit survey
}

async function handleSubscriptionSuspended(event: PayPalWebhookEvent): Promise<void> {
  const subscription = event.resource;
  console.log(`⏸️  Subscription suspended: ${subscription.id}`);

  // TODO: Suspend access
}

async function handleSubscriptionPaymentFailed(event: PayPalWebhookEvent): Promise<void> {
  const subscription = event.resource;
  console.log(`⚠️  Subscription payment failed: ${subscription.id}`);

  // TODO: Notify customer, implement dunning management
}

// ========== DISPUTE HANDLERS ==========

async function handleDisputeCreated(event: PayPalWebhookEvent): Promise<void> {
  const dispute = event.resource;
  console.log(`🚨 DISPUTE CREATED: ${dispute.dispute_id} - Reason: ${dispute.reason}`);

  // TODO: Alert finance team, prepare evidence
}

async function handleDisputeResolved(event: PayPalWebhookEvent): Promise<void> {
  const dispute = event.resource;
  console.log(`✅ Dispute resolved: ${dispute.dispute_id} - Outcome: ${dispute.dispute_outcome.outcome_code}`);

  // TODO: Update records
}

async function handleDisputeUpdated(event: PayPalWebhookEvent): Promise<void> {
  const dispute = event.resource;
  console.log(`🔄 Dispute updated: ${dispute.dispute_id}`);

  // TODO: Update dispute tracking
}

// ========== REFUND HANDLERS ==========

async function handleSaleRefunded(event: PayPalWebhookEvent): Promise<void> {
  const refund = event.resource;
  console.log(`💸 Sale refunded: ${refund.id}`);

  // TODO: Process refund
}

/**
 * Health check for PayPal webhook configuration
 */
export function verifyPayPalWebhookHealth(): {
  configured: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!process.env.PAYPAL_CLIENT_ID) {
    issues.push('PAYPAL_CLIENT_ID is not configured');
  }

  if (!process.env.PAYPAL_CLIENT_SECRET) {
    issues.push('PAYPAL_CLIENT_SECRET is not configured');
  }

  if (!process.env.PAYPAL_WEBHOOK_ID) {
    issues.push('PAYPAL_WEBHOOK_ID is not configured');
  }

  if (!process.env.PAYPAL_MODE) {
    issues.push('PAYPAL_MODE is not configured (should be "sandbox" or "live")');
  }

  return {
    configured: issues.length === 0,
    issues
  };
}
