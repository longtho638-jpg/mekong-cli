import Stripe from 'stripe';
import { verifyStripeWebhook } from '../lib/webhook-verification';
import {
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed
} from './payment-handlers';
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed
} from './subscription-handlers';

/**
 * Main Webhook Handler
 * Use this function in your Next.js API Route (e.g., app/api/webhooks/route.ts)
 */
export async function processStripeEvent(body: string | Buffer, signature: string) {
  let event: Stripe.Event;

  try {
    event = await verifyStripeWebhook(body, signature);
  } catch (err) {
    console.error(`Webhook signature verification failed.`);
    throw err;
  }

  console.log(`Processing Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error processing event ${event.type}:`, error);
    throw new Error(`Error processing event: ${error}`);
  }
}
