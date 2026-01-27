/**
 * Hardened Stripe Webhook Handler
 *
 * Implements:
 * - 100% signature verification (fail-closed)
 * - Idempotency protection
 * - Retry handling with exponential backoff
 * - Comprehensive error logging
 */

import Stripe from 'stripe';
import { verifyStripeWebhook } from './webhook-verification';
import { withIdempotency } from './idempotency-manager';
import { withRetry } from './retry-handler';
import {
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed
} from '../webhooks/payment-handlers';
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed
} from '../webhooks/subscription-handlers';

/**
 * Main webhook processor with full hardening
 */
export async function processStripeWebhook(
  body: string | Buffer,
  signature: string
): Promise<{ success: boolean; eventId: string; message: string }> {
  let event: Stripe.Event;
  const startTime = Date.now();

  // STEP 1: SIGNATURE VERIFICATION (MANDATORY)
  // This is 100% blocking - no verification, no processing
  try {
    event = await verifyStripeWebhook(body, signature);
    console.log(`🔐 Signature verified for event ${event.id} (${event.type})`);
  } catch (verificationError) {
    const errorMessage = `Signature verification failed: ${(verificationError as Error).message}`;
    console.error(`❌ ${errorMessage}`);

    // FAIL CLOSED: Reject the webhook entirely
    return {
      success: false,
      eventId: 'unknown',
      message: errorMessage
    };
  }

  // STEP 2: IDEMPOTENCY CHECK
  // Process each event exactly once, even if Stripe retries
  try {
    const result = await withIdempotency(event.id, event.type, async () => {
      // STEP 3: RETRY HANDLING
      // Wrap the actual processing in retry logic for transient failures
      return await withRetry(
        async () => {
          await processEventByType(event);
        },
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 4000,
          backoffMultiplier: 2
        }
      );
    });

    // Check if event was already processed (idempotency kicked in)
    if (result === null) {
      const duration = Date.now() - startTime;
      return {
        success: true,
        eventId: event.id,
        message: `Event already processed (duplicate) in ${duration}ms`
      };
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Event ${event.id} (${event.type}) processed successfully in ${duration}ms`);

    return {
      success: true,
      eventId: event.id,
      message: `Event processed successfully in ${duration}ms`
    };
  } catch (processingError) {
    const duration = Date.now() - startTime;
    const errorMessage = `Processing failed: ${(processingError as Error).message}`;
    console.error(`❌ Event ${event.id} (${event.type}) error after ${duration}ms:`, processingError);

    // Log to error tracking service (Sentry, etc.)
    // await logToSentry(processingError, { eventId: event.id, eventType: event.type });

    // Return error response
    // NOTE: Returning non-2xx status will cause Stripe to retry the webhook
    return {
      success: false,
      eventId: event.id,
      message: errorMessage
    };
  }
}

/**
 * Route event to appropriate handler based on type
 */
async function processEventByType(event: Stripe.Event): Promise<void> {
  console.log(`📨 Processing Stripe event: ${event.type} (${event.id})`);

  switch (event.type) {
    // ========== PAYMENT INTENTS ==========
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    case 'payment_intent.canceled':
      console.log(`PaymentIntent ${event.data.object.id} was canceled`);
      // Add handler if needed
      break;

    // ========== SUBSCRIPTIONS ==========
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.paused':
      console.log(`Subscription ${event.data.object.id} was paused`);
      // Add handler if needed
      break;

    case 'customer.subscription.resumed':
      console.log(`Subscription ${event.data.object.id} was resumed`);
      // Add handler if needed
      break;

    // ========== INVOICES ==========
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.finalized':
      console.log(`Invoice ${event.data.object.id} was finalized`);
      // Add handler if needed
      break;

    // ========== CHECKOUT SESSIONS ==========
    case 'checkout.session.completed':
      console.log(`Checkout session ${event.data.object.id} completed`);
      // Add handler if needed
      break;

    case 'checkout.session.expired':
      console.log(`Checkout session ${event.data.object.id} expired`);
      break;

    // ========== CUSTOMER EVENTS ==========
    case 'customer.created':
      console.log(`Customer ${event.data.object.id} created`);
      break;

    case 'customer.updated':
      console.log(`Customer ${event.data.object.id} updated`);
      break;

    case 'customer.deleted':
      console.log(`Customer ${event.data.object.id} deleted`);
      break;

    // ========== PAYMENT METHOD EVENTS ==========
    case 'payment_method.attached':
      console.log(`Payment method attached to customer`);
      break;

    case 'payment_method.detached':
      console.log(`Payment method detached from customer`);
      break;

    // ========== CHARGE EVENTS ==========
    case 'charge.succeeded':
      console.log(`Charge ${event.data.object.id} succeeded`);
      break;

    case 'charge.failed':
      console.log(`Charge ${event.data.object.id} failed`);
      break;

    case 'charge.refunded':
      console.log(`Charge ${event.data.object.id} was refunded`);
      break;

    case 'charge.dispute.created':
      console.log(`⚠️  DISPUTE CREATED for charge ${event.data.object.id}`);
      // CRITICAL: Alert finance team immediately
      break;

    // ========== UNHANDLED EVENTS ==========
    default:
      console.log(`ℹ️  Unhandled event type: ${event.type}`);
      // Log to monitoring system to track which events are not handled
  }
}

/**
 * Health check endpoint to verify webhook configuration
 */
export function verifyWebhookHealth(): {
  configured: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    issues.push('STRIPE_WEBHOOK_SECRET is not configured');
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    issues.push('STRIPE_SECRET_KEY is not configured');
  }

  return {
    configured: issues.length === 0,
    issues
  };
}
