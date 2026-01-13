import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Commission rates by plan
const COMMISSION_RATES: Record<string, number> = {
    'starter': 0.40,
    'pro': 0.40,
    'franchise': 0.30,
};

// Generate license key
function generateLicenseKey(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segments = [];
    for (let s = 0; s < 4; s++) {
        let segment = '';
        for (let i = 0; i < 4; i++) {
            segment += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        segments.push(segment);
    }
    return `AGOS-${segments.join('-')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify webhook signature
        const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('POLAR_WEBHOOK_SECRET not configured');
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }

        let event;
        try {
            event = validateEvent(
                JSON.stringify(req.body),
                req.headers as Record<string, string>,
                webhookSecret
            );
        } catch (error) {
            if (error instanceof WebhookVerificationError) {
                console.error('Webhook verification failed:', error.message);
                return res.status(401).json({ error: 'Invalid signature' });
            }
            throw error;
        }

        console.log(`Processing Polar event: ${event.type}`);

        // Handle checkout.created
        if (event.type === 'checkout.created') {
            console.log('Checkout created:', event.data.id);
            return res.status(200).json({ received: true });
        }

        // Handle order.created (successful payment)
        if (event.type === 'order.created') {
            const order = event.data;
            const metadata = order.metadata || {};
            const plan = metadata.plan || 'pro';
            const affiliateCode = metadata.affiliateCode;

            // Generate license key
            const licenseKey = generateLicenseKey();

            // Store license in Supabase
            const { error: licenseError } = await supabase
                .from('licenses')
                .insert({
                    license_key: licenseKey,
                    email: order.customer?.email,
                    plan: plan,
                    status: 'active',
                    polar_order_id: order.id,
                    polar_customer_id: order.customer?.id,
                    created_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                });

            if (licenseError) {
                console.error('Failed to store license:', licenseError);
            }

            // Track affiliate conversion if referral code exists
            if (affiliateCode) {
                const { data: affiliate } = await supabase
                    .from('affiliates')
                    .select('id, user_id')
                    .eq('referral_code', String(affiliateCode))
                    .eq('is_active', true)
                    .single();

                if (affiliate) {
                    const planStr = String(plan);
                    const commissionRate = COMMISSION_RATES[planStr] || 0.30;
                    const orderAmount = ((order as any).amount || (order as any).total || 0) / 100;
                    const commissionAmount = orderAmount * commissionRate;

                    // Record affiliate conversion
                    await supabase
                        .from('affiliate_conversions')
                        .insert({
                            affiliate_id: affiliate.id,
                            order_id: order.id,
                            product_name: planStr.charAt(0).toUpperCase() + planStr.slice(1),
                            product_price: orderAmount,
                            commission_rate: commissionRate,
                            commission_amount: commissionAmount,
                            status: 'credited', // Changed from 'pending' to 'credited'
                            customer_email: order.customer?.email,
                        });

                    // TÍCH SẢN: Award AG Credits instead of cash
                    if (affiliate.user_id) {
                        await supabase.rpc('add_ag_credits', {
                            p_user_id: affiliate.user_id,
                            p_amount: commissionAmount,
                            p_type: 'earn',
                            p_description: `Commission: ${planStr} plan sale`,
                            p_reference_id: order.id,
                        });
                        console.log(`🎯 TÍCH SẢN: Awarded ${commissionAmount} AGC to affiliate ${affiliateCode}`);
                    }

                    console.log(`Recorded affiliate conversion: ${commissionAmount} AGC for ${affiliateCode}`);
                }
            }

            // 📧 SEND WELCOME EMAIL
            const customerEmail = order.customer?.email;
            const customerName = order.customer?.name || 'there';

            if (customerEmail) {
                // Send welcome email immediately
                try {
                    await fetch(`${process.env.VERCEL_URL || 'https://agencyos.network'}/api/email/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: customerEmail,
                            template: 'welcome',
                            data: { name: customerName, licenseKey, plan },
                        }),
                    });
                    console.log(`📧 Welcome email sent to ${customerEmail}`);
                } catch (emailError) {
                    console.error('Failed to send welcome email:', emailError);
                }

                // Queue onboarding sequence (Day 1, 3, 7)
                await supabase.rpc('queue_onboarding_emails', {
                    p_email: customerEmail,
                    p_name: customerName,
                    p_order_id: order.id,
                });
                console.log(`📧 Onboarding sequence queued for ${customerEmail}`);
            }

            console.log(`Order processed: ${order.id}, License: ${licenseKey}`);
            return res.status(200).json({ received: true, licenseKey });
        }

        // Handle subscription.created
        if (event.type === 'subscription.created') {
            console.log('Subscription created:', event.data.id);
            return res.status(200).json({ received: true });
        }

        // Handle subscription.updated
        if (event.type === 'subscription.updated') {
            const subscription = event.data;

            // Update license status based on subscription status
            if (subscription.status === 'canceled') {
                await supabase
                    .from('licenses')
                    .update({ status: 'canceled' })
                    .eq('polar_customer_id', subscription.customer?.id);
            }

            return res.status(200).json({ received: true });
        }

        // Handle refund
        if (event.type === 'refund.created') {
            const refund = event.data;

            // Mark affiliate conversion as refunded
            await supabase
                .from('affiliate_conversions')
                .update({ status: 'refunded' })
                .eq('order_id', refund.orderId);

            // Deactivate license
            await supabase
                .from('licenses')
                .update({ status: 'refunded' })
                .eq('polar_order_id', refund.orderId);

            return res.status(200).json({ received: true });
        }

        return res.status(200).json({ received: true, type: event.type });

    } catch (error: any) {
        console.error('Webhook error:', error);
        return res.status(500).json({ error: error.message });
    }
}
