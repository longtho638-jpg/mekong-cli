import Stripe from 'stripe';
import { stripe } from '../lib/stripe-client';

export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`🎉 New subscription created: ${subscription.id}`);

  // TODO: Save subscription details to your database
  // const customerId = subscription.customer as string;
  // await db.users.update({ where: { stripeCustomerId: customerId }, data: { subscriptionStatus: subscription.status, planId: subscription.items.data[0].price.id } });
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`🔄 Subscription updated: ${subscription.id}, Status: ${subscription.status}`);

  // TODO: Update subscription status in DB
  // Check if canceled_at_period_end is set
  if (subscription.cancel_at_period_end) {
    console.log(`⚠️ Subscription ${subscription.id} scheduled to cancel.`);
  }
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`💀 Subscription deleted/canceled: ${subscription.id}`);

  // TODO: Revoke access or update status to 'canceled' in DB
}

export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    console.log(`✅ Invoice paid for subscription: ${invoice.subscription}`);
    // Good place to reset any 'past_due' status if applicable
  }
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    console.log(`❌ Invoice payment failed for subscription: ${invoice.subscription}`);
    // TODO: Handle dunning (e.g., email customer, update status to past_due)
  }
}
