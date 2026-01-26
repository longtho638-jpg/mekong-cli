import Stripe from 'stripe';

export type StripeEventType =
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed';

export interface StripeEventParams {
  event: Stripe.Event;
}

export interface PaymentIntentSucceededEvent extends Stripe.Event {
  type: 'payment_intent.succeeded';
  data: {
    object: Stripe.PaymentIntent;
  };
}

export interface CustomerSubscriptionEvent extends Stripe.Event {
  type: 'customer.subscription.created' | 'customer.subscription.updated' | 'customer.subscription.deleted';
  data: {
    object: Stripe.Subscription;
  };
}

export interface InvoiceEvent extends Stripe.Event {
  type: 'invoice.payment_succeeded' | 'invoice.payment_failed';
  data: {
    object: Stripe.Invoice;
  };
}
