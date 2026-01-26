import Stripe from 'stripe';
import { stripe } from './stripe-client';

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is missing. Please set it in your environment variables.');
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      endpointSecret
    );
    return event;
  } catch (err: any) {
    console.error(`⚠️  Webhook signature verification failed.`, err.message);
    throw new Error(`Webhook Error: ${err.message}`);
  }
}
