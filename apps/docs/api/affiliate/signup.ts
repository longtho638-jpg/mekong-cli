import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate unique referral code
function generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { action, email, name, paymentMethod, paymentEmail, userId } = req.body;

        // Register new affiliate
        if (action === 'register') {
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            // Check if affiliate already exists
            const { data: existing } = await supabase
                .from('affiliates')
                .select('id, referral_code')
                .eq('email', email)
                .single();

            if (existing) {
                return res.status(200).json({
                    success: true,
                    message: 'Affiliate already registered',
                    affiliateId: existing.id,
                    referralCode: existing.referral_code,
                });
            }

            // Generate unique referral code
            let referralCode = generateReferralCode();
            let attempts = 0;
            while (attempts < 10) {
                const { data: existingCode } = await supabase
                    .from('affiliates')
                    .select('id')
                    .eq('referral_code', referralCode)
                    .single();

                if (!existingCode) break;
                referralCode = generateReferralCode();
                attempts++;
            }

            // Create affiliate
            const { data: affiliate, error } = await supabase
                .from('affiliates')
                .insert({
                    email,
                    name: name || email.split('@')[0],
                    referral_code: referralCode,
                    user_id: userId || null,
                    payment_method: paymentMethod || 'paypal',
                    payment_email: paymentEmail || email,
                })
                .select()
                .single();

            if (error) {
                console.error('Failed to create affiliate:', error);
                return res.status(500).json({ error: 'Failed to create affiliate' });
            }

            return res.status(201).json({
                success: true,
                message: 'Affiliate registered successfully',
                affiliateId: affiliate.id,
                referralCode: affiliate.referral_code,
                referralLink: `https://agencyos.network?ref=${affiliate.referral_code}`,
            });
        }

        // Update affiliate settings
        if (action === 'update') {
            const { affiliateId } = req.body;

            if (!affiliateId) {
                return res.status(400).json({ error: 'Affiliate ID is required' });
            }

            const updates: Record<string, any> = {};
            if (name) updates.name = name;
            if (paymentMethod) updates.payment_method = paymentMethod;
            if (paymentEmail) updates.payment_email = paymentEmail;
            updates.updated_at = new Date().toISOString();

            const { error } = await supabase
                .from('affiliates')
                .update(updates)
                .eq('id', affiliateId);

            if (error) {
                return res.status(500).json({ error: 'Failed to update affiliate' });
            }

            return res.status(200).json({ success: true, message: 'Settings updated' });
        }

        // Get affiliate by email
        if (action === 'get') {
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            const { data: affiliate, error } = await supabase
                .from('affiliates')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !affiliate) {
                return res.status(404).json({ error: 'Affiliate not found' });
            }

            return res.status(200).json({
                success: true,
                affiliate: {
                    id: affiliate.id,
                    email: affiliate.email,
                    name: affiliate.name,
                    referralCode: affiliate.referral_code,
                    referralLink: `https://agencyos.network?ref=${affiliate.referral_code}`,
                    paymentMethod: affiliate.payment_method,
                    paymentEmail: affiliate.payment_email,
                    totalClicks: affiliate.total_clicks,
                    totalConversions: affiliate.total_conversions,
                    totalEarnings: affiliate.total_earnings,
                    pendingPayout: affiliate.pending_payout,
                    badge: affiliate.badge,
                    isActive: affiliate.is_active,
                    createdAt: affiliate.created_at,
                },
            });
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
