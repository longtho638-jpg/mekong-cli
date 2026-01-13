import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Lemon Squeezy webhook secret
const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!;

// Commission rates by product
const COMMISSION_RATES: Record<string, number> = {
    'Starter': 0.40,      // 40%
    'Pro': 0.40,          // 40%
    'Enterprise': 0.30,   // 30%
};

// Verify Lemon Squeezy webhook signature
function verifySignature(payload: string, signature: string): boolean {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only accept POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify webhook signature
    const signature = req.headers['x-signature'] as string;
    const payload = JSON.stringify(req.body);

    if (!signature || !verifySignature(payload, signature)) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
    }

    try {
        const event = req.body;
        const eventName = event.meta.event_name;

        console.log(`Processing Lemon Squeezy event: ${eventName}`);

        // Handle order_created event
        if (eventName === 'order_created') {
            const order = event.data.attributes;
            const orderId = event.data.id;
            const customData = order.custom_data || {};
            const referralCode = customData.ref || customData.referral_code;

            // If no referral code, skip
            if (!referralCode) {
                console.log('No referral code found, skipping affiliate tracking');
                return res.status(200).json({ success: true, message: 'No referral code' });
            }

            // Find affiliate by referral code
            const { data: affiliate, error: affError } = await supabase
                .from('affiliates')
                .select('id, email, name')
                .eq('referral_code', referralCode)
                .eq('is_active', true)
                .single();

            if (affError || !affiliate) {
                console.error('Affiliate not found:', referralCode);
                return res.status(200).json({ success: true, message: 'Affiliate not found' });
            }

            // Get product name and price
            const productName = order.first_order_item?.product_name || 'Unknown';
            const productPrice = parseFloat(order.total_usd) || 0;
            const commissionRate = COMMISSION_RATES[productName] || 0.30;
            const commissionAmount = productPrice * commissionRate;

            // Record conversion
            const { error: convError } = await supabase
                .from('affiliate_conversions')
                .insert({
                    affiliate_id: affiliate.id,
                    order_id: orderId,
                    product_name: productName,
                    product_price: productPrice,
                    commission_rate: commissionRate,
                    commission_amount: commissionAmount,
                    status: 'pending',
                    customer_email: order.user_email,
                    lemon_squeezy_id: orderId,
                });

            if (convError) {
                console.error('Failed to record conversion:', convError);
                return res.status(500).json({ error: 'Failed to record conversion' });
            }

            console.log(`Recorded conversion for affiliate ${affiliate.email}: $${commissionAmount}`);

            return res.status(200).json({
                success: true,
                affiliate: affiliate.email,
                commission: commissionAmount,
            });
        }

        // Handle subscription_payment_success for recurring commissions
        if (eventName === 'subscription_payment_success') {
            const subscription = event.data.attributes;
            const customData = subscription.custom_data || {};
            const referralCode = customData.ref || customData.referral_code;

            if (!referralCode) {
                return res.status(200).json({ success: true, message: 'No referral code' });
            }

            // Find affiliate
            const { data: affiliate } = await supabase
                .from('affiliates')
                .select('id')
                .eq('referral_code', referralCode)
                .eq('is_active', true)
                .single();

            if (!affiliate) {
                return res.status(200).json({ success: true, message: 'Affiliate not found' });
            }

            // Record recurring commission
            const paymentAmount = parseFloat(subscription.total_usd) || 0;
            const commissionRate = 0.40; // Default 40% for recurring
            const commissionAmount = paymentAmount * commissionRate;

            await supabase
                .from('affiliate_conversions')
                .insert({
                    affiliate_id: affiliate.id,
                    order_id: `recurring_${event.data.id}_${Date.now()}`,
                    product_name: subscription.product_name || 'Subscription',
                    product_price: paymentAmount,
                    commission_rate: commissionRate,
                    commission_amount: commissionAmount,
                    is_recurring: true,
                    status: 'pending',
                    lemon_squeezy_id: event.data.id,
                });

            return res.status(200).json({ success: true, recurring: true });
        }

        // Handle order_refunded
        if (eventName === 'order_refunded') {
            const orderId = event.data.id;

            // Mark conversion as refunded
            await supabase
                .from('affiliate_conversions')
                .update({ status: 'refunded' })
                .eq('lemon_squeezy_id', orderId);

            return res.status(200).json({ success: true, message: 'Refund processed' });
        }

        return res.status(200).json({ success: true, message: 'Event processed' });

    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
