'use server';

import { stripe, STRIPE_PRICES } from './server';
import { auth } from '@/lib/auth/config';

export async function createCheckoutSession(plan: 'PRO' | 'ENTERPRISE') {
  try {
    const session = await auth.api.getSession({
      headers: new Headers(),
    });

    if (!session?.user) {
      return { error: 'Authentication required' };
    }

    const priceId = STRIPE_PRICES[plan];
    if (!priceId) {
      return { error: 'Invalid plan' };
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      client_reference_id: session.user.id,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
        plan,
      },
    });

    return { url: checkoutSession.url };
  } catch (error) {
    console.error('Checkout error:', error);
    return { error: 'Failed to create checkout session' };
  }
}

export async function createCustomerPortalSession(): Promise<{ url?: string; error?: string }> {
  try {
    const session = await auth.api.getSession({
      headers: new Headers(),
    });

    if (!session?.user) {
      return { error: 'Authentication required' };
    }

    // TODO: Get Stripe customer ID from database when subscription table is ready
    // For now, create a new customer
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: {
        userId: session.user.id,
      },
    });

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
    });

    return { url: portalSession.url };
  } catch (error) {
    console.error('Portal error:', error);
    return { error: 'Failed to create portal session' };
  }
}
