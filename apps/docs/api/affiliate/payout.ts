import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PAYOUT_THRESHOLD = 50; // Minimum $50 for payout

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET: Get payout history
        if (req.method === 'GET') {
            const { affiliateId } = req.query;

            if (!affiliateId) {
                return res.status(400).json({ error: 'Affiliate ID required' });
            }

            const { data: payouts, error } = await supabase
                .from('affiliate_payouts')
                .select('*')
                .eq('affiliate_id', affiliateId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                return res.status(500).json({ error: 'Failed to fetch payouts' });
            }

            // Get pending amount
            const { data: affiliate } = await supabase
                .from('affiliates')
                .select('pending_payout, payment_method, payment_email')
                .eq('id', affiliateId)
                .single();

            return res.status(200).json({
                success: true,
                pendingAmount: affiliate?.pending_payout || 0,
                paymentMethod: affiliate?.payment_method,
                paymentEmail: affiliate?.payment_email,
                threshold: PAYOUT_THRESHOLD,
                canRequestPayout: (affiliate?.pending_payout || 0) >= PAYOUT_THRESHOLD,
                payouts: payouts || [],
            });
        }

        // POST: Request payout
        if (req.method === 'POST') {
            const { action, affiliateId, method, paymentEmail } = req.body;

            if (action === 'request') {
                if (!affiliateId) {
                    return res.status(400).json({ error: 'Affiliate ID required' });
                }

                // Get affiliate
                const { data: affiliate, error: affError } = await supabase
                    .from('affiliates')
                    .select('*')
                    .eq('id', affiliateId)
                    .single();

                if (affError || !affiliate) {
                    return res.status(404).json({ error: 'Affiliate not found' });
                }

                // Check threshold
                if (affiliate.pending_payout < PAYOUT_THRESHOLD) {
                    return res.status(400).json({
                        error: `Minimum payout is $${PAYOUT_THRESHOLD}. You have $${affiliate.pending_payout.toFixed(2)}.`,
                    });
                }

                // Check for pending payout request
                const { data: existingRequest } = await supabase
                    .from('affiliate_payouts')
                    .select('id')
                    .eq('affiliate_id', affiliateId)
                    .in('status', ['pending', 'processing'])
                    .limit(1);

                if (existingRequest && existingRequest.length > 0) {
                    return res.status(400).json({
                        error: 'You already have a pending payout request',
                    });
                }

                // Create payout request
                const payoutMethod = method || affiliate.payment_method;
                const payoutEmail = paymentEmail || affiliate.payment_email;

                const { data: payout, error: payoutError } = await supabase
                    .from('affiliate_payouts')
                    .insert({
                        affiliate_id: affiliateId,
                        amount: affiliate.pending_payout,
                        method: payoutMethod,
                        payment_email: payoutEmail,
                        status: 'pending',
                    })
                    .select()
                    .single();

                if (payoutError) {
                    return res.status(500).json({ error: 'Failed to create payout request' });
                }

                // Update affiliate - move pending to processing (don't clear yet)
                await supabase
                    .from('affiliates')
                    .update({
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', affiliateId);

                return res.status(201).json({
                    success: true,
                    message: 'Payout request submitted successfully',
                    payout: {
                        id: payout.id,
                        amount: payout.amount,
                        method: payout.method,
                        status: payout.status,
                        estimatedProcessing: '24-48 hours',
                    },
                });
            }

            // Update payment method
            if (action === 'update_payment') {
                if (!affiliateId || !method) {
                    return res.status(400).json({ error: 'Missing required fields' });
                }

                const { error } = await supabase
                    .from('affiliates')
                    .update({
                        payment_method: method,
                        payment_email: paymentEmail,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', affiliateId);

                if (error) {
                    return res.status(500).json({ error: 'Failed to update payment method' });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Payment method updated',
                });
            }

            return res.status(400).json({ error: 'Invalid action' });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
