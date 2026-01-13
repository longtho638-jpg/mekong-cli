import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

// Product prices in AGC
const PRODUCT_PRICES: Record<string, number> = {
    starter_monthly: 29,
    starter_annual: 249,
    pro_monthly: 99,
    pro_annual: 799,
    franchise_monthly: 299,
    franchise_annual: 2399,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Get user from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const { product_id } = req.body;

    if (!product_id || !PRODUCT_PRICES[product_id]) {
        return res.status(400).json({
            error: 'Invalid product',
            available: Object.keys(PRODUCT_PRICES)
        });
    }

    const price = PRODUCT_PRICES[product_id];

    // Check balance
    const { data: credits } = await supabase
        .from('ag_credits')
        .select('balance')
        .eq('user_id', user.id)
        .single();

    if (!credits || credits.balance < price) {
        return res.status(400).json({
            error: 'Insufficient balance',
            required: price,
            available: credits?.balance || 0
        });
    }

    // Execute purchase
    const { error: spendError } = await supabase.rpc('spend_ag_credits', {
        p_user_id: user.id,
        p_amount: price,
        p_description: `Purchase: ${product_id}`,
        p_reference_id: `agc_purchase_${Date.now()}`,
    });

    if (spendError) {
        console.error('Redeem error:', spendError);
        return res.status(500).json({ error: 'Purchase failed' });
    }

    // Generate license key
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segments = [];
    for (let s = 0; s < 4; s++) {
        let segment = '';
        for (let i = 0; i < 4; i++) {
            segment += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        segments.push(segment);
    }
    const licenseKey = segments.join('-');

    // Create license in database
    await supabase.from('licenses').insert({
        user_id: user.id,
        product_tier: product_id.split('_')[0],
        billing_period: product_id.includes('annual') ? 'annual' : 'monthly',
        license_key: licenseKey,
        payment_method: 'ag_credits',
        status: 'active',
        expires_at: new Date(Date.now() + (product_id.includes('annual') ? 365 : 30) * 24 * 60 * 60 * 1000),
    });

    return res.json({
        success: true,
        message: `Purchased ${product_id} with ${price} AGC`,
        license_key: licenseKey,
        remaining_balance: (credits?.balance || 0) - price,
    });
}
