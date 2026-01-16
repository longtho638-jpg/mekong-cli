/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
/**
 * Stripe Integration for AgencyOS
 * SEA SaaS Billing Module
 */

import Stripe from 'stripe';

// Lazy initialize Stripe to avoid build-time errors
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
    if (!stripeInstance) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY is not configured');
        }
        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-12-15.clover',
            typescript: true,
        });
    }
    return stripeInstance;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 PRICING TIERS (SEA SaaS Standard)
// ═══════════════════════════════════════════════════════════════════════════════

export const PRICING_TIERS = {
    FREE: {
        id: 'free',
        name: 'Starter',
        price: 0,
        currency: 'usd',
        features: [
            '3 team members',
            '5 projects',
            'Basic analytics',
            'Community support',
        ],
        limits: {
            teamMembers: 3,
            projects: 5,
            storage: '1GB',
            apiCalls: 1000,
        },
    },
    PRO: {
        id: 'pro',
        name: 'Professional',
        price: 49,
        currency: 'usd',
        stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
        features: [
            '10 team members',
            'Unlimited projects',
            'Advanced analytics',
            'Priority support',
            'Custom integrations',
            'API access',
        ],
        limits: {
            teamMembers: 10,
            projects: -1, // unlimited
            storage: '50GB',
            apiCalls: 50000,
        },
    },
    ENTERPRISE: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 199,
        currency: 'usd',
        stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
        features: [
            'Unlimited team members',
            'Unlimited projects',
            'Custom analytics',
            'Dedicated support',
            'White-label options',
            'SLA guarantee',
            'Custom contracts',
        ],
        limits: {
            teamMembers: -1,
            projects: -1,
            storage: '500GB',
            apiCalls: -1,
        },
    },
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;

// ═══════════════════════════════════════════════════════════════════════════════
// 💳 CHECKOUT & SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreateCheckoutParams {
    customerId?: string;
    customerEmail: string;
    priceId: string;
    tenantId: string;
    successUrl: string;
    cancelUrl: string;
    currency?: string;
}

export async function createCheckoutSession(params: CreateCheckoutParams) {
    const session = await getStripe().checkout.sessions.create({
        customer: params.customerId,
        customer_email: params.customerId ? undefined : params.customerEmail,
        line_items: [
            {
                price: params.priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
            tenantId: params.tenantId,
        },
        subscription_data: {
            metadata: {
                tenantId: params.tenantId,
            },
        },
        // SEA localization
        locale: 'auto',
        payment_method_types: ['card'],
        allow_promotion_codes: true,
    });

    return session;
}

export async function createCustomer(email: string, name: string, tenantId: string) {
    const customer = await getStripe().customers.create({
        email,
        name,
        metadata: {
            tenantId,
        },
    });

    return customer;
}

export async function getSubscription(subscriptionId: string) {
    return getStripe().subscriptions.retrieve(subscriptionId);
}

export async function cancelSubscription(subscriptionId: string) {
    return getStripe().subscriptions.cancel(subscriptionId);
}

export async function updateSubscription(subscriptionId: string, priceId: string) {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

    return getStripe().subscriptions.update(subscriptionId, {
        items: [
            {
                id: subscription.items.data[0].id,
                price: priceId,
            },
        ],
        proration_behavior: 'create_prorations',
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 BILLING PORTAL
// ═══════════════════════════════════════════════════════════════════════════════

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
    const session = await getStripe().billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });

    return session;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 INVOICES
// ═══════════════════════════════════════════════════════════════════════════════

export async function getInvoices(customerId: string, limit = 10) {
    const invoices = await getStripe().invoices.list({
        customer: customerId,
        limit,
    });

    return invoices.data;
}

export async function getUpcomingInvoice(customerId: string) {
    try {
        // Use list with upcoming filter for new Stripe API
        const invoices = await getStripe().invoices.list({
            customer: customerId,
            limit: 1,
            status: 'draft',
        });
        return invoices.data[0] || null;
    } catch {
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔔 WEBHOOK HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

export type WebhookEvent =
    | 'checkout.session.completed'
    | 'customer.subscription.created'
    | 'customer.subscription.updated'
    | 'customer.subscription.deleted'
    | 'invoice.paid'
    | 'invoice.payment_failed';

export async function constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string
): Promise<Stripe.Event> {
    return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
}

export async function handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            // Activate subscription for tenant
            console.log(`✅ Checkout completed for tenant: ${session.metadata?.tenantId}`);
            break;
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            // Update subscription status in database
            console.log(`🔄 Subscription updated: ${subscription.id}`);
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            // Downgrade tenant to free tier
            console.log(`❌ Subscription cancelled: ${subscription.id}`);
            break;
        }

        case 'invoice.paid': {
            const invoice = event.data.object as Stripe.Invoice;
            // Record successful payment
            console.log(`💰 Invoice paid: ${invoice.id}`);
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice;
            // Handle failed payment - notify user
            console.log(`⚠️ Payment failed: ${invoice.id}`);
            break;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📈 MRR METRICS
// ═══════════════════════════════════════════════════════════════════════════════

export interface MRRMetrics {
    mrr: number;
    arr: number;
    totalCustomers: number;
    paidCustomers: number;
    churnRate: number;
    averageRevenue: number;
    currency: string;
}

export async function calculateMRRMetrics(): Promise<MRRMetrics> {
    // Get all active subscriptions
    const subscriptions = await getStripe().subscriptions.list({
        status: 'active',
        limit: 100,
    });

    let totalMRR = 0;
    let paidCount = 0;

    for (const sub of subscriptions.data) {
        const amount = sub.items.data[0]?.price?.unit_amount || 0;
        const interval = sub.items.data[0]?.price?.recurring?.interval;

        // Normalize to monthly
        if (interval === 'year') {
            totalMRR += amount / 12;
        } else {
            totalMRR += amount;
        }
        paidCount++;
    }

    // Convert from cents to dollars
    const mrr = totalMRR / 100;

    return {
        mrr,
        arr: mrr * 12,
        totalCustomers: paidCount + 10, // Include free tier estimate
        paidCustomers: paidCount,
        churnRate: 5.2, // Placeholder - calculate from historical data
        averageRevenue: paidCount > 0 ? mrr / paidCount : 0,
        currency: 'USD',
    };
}

export { getStripe };
