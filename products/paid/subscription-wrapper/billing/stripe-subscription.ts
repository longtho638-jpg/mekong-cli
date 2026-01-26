import Stripe from 'stripe';
import { IBillingAdapter } from '../src/shared/types';

export class StripeBillingAdapter implements IBillingAdapter {
  private stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly PRICE_IDS = {
    starter: process.env.STRIPE_PRICE_STARTER || 'price_starter_mock',
    pro: process.env.STRIPE_PRICE_PRO || 'price_pro_mock',
    agency: process.env.STRIPE_PRICE_AGENCY || 'price_agency_mock',
  };

  constructor(apiKey: string, webhookSecret?: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
    });
    this.webhookSecret = webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || '';
    if (!this.webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required for secure webhook verification');
    }
  }

  async createSubscription(tier: string, customerEmail: string): Promise<{ subscriptionId: string; clientSecret: string }> {
    const priceId = this.PRICE_IDS[tier as keyof typeof this.PRICE_IDS];
    if (!priceId) throw new Error(`Invalid tier: ${tier}`);

    // Create or find customer
    const customers = await this.stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId = customers.data[0]?.id;

    if (!customerId) {
      const customer = await this.stripe.customers.create({ email: customerEmail });
      customerId = customer.id;
    }

    // Create subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret || '',
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await this.stripe.subscriptions.cancel(subscriptionId);
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }

  async getInvoice(subscriptionId: string): Promise<any> {
    const invoices = await this.stripe.invoices.list({ subscription: subscriptionId, limit: 1 });
    return invoices.data[0];
  }

  async verifyWebhook(signature: string, payload: string | Buffer): Promise<Stripe.Event> {
    if (!signature) {
      throw new Error('Missing Stripe signature header');
    }

    try {
      // Cryptographically verify the webhook signature
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
      return event;
    } catch (err) {
      const error = err as Error;
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }
}
