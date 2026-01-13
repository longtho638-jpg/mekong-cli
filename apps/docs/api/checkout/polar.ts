import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Polar } from '@polar-sh/sdk';

// Initialize Polar SDK
const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN?.trim() || '',
});

// Product IDs from Polar.sh - trim to remove any newlines from env vars
const PRODUCTS = {
    starter: {
        monthly: process.env.POLAR_PRODUCT_STARTER_MONTHLY?.trim(),
        annual: process.env.POLAR_PRODUCT_STARTER_ANNUAL?.trim(),
    },
    pro: {
        monthly: process.env.POLAR_PRODUCT_PRO_MONTHLY?.trim(),
        annual: process.env.POLAR_PRODUCT_PRO_ANNUAL?.trim(),
    },
    franchise: {
        monthly: process.env.POLAR_PRODUCT_FRANCHISE_MONTHLY?.trim(),
        annual: process.env.POLAR_PRODUCT_FRANCHISE_ANNUAL?.trim(),
    },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { plan, billing, email, affiliateCode, discountId, promoCode } = req.body;

        // Validate plan
        if (!plan || !['starter', 'pro', 'franchise'].includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        // Validate billing
        if (!billing || !['monthly', 'annual'].includes(billing)) {
            return res.status(400).json({ error: 'Invalid billing period' });
        }

        // Get product ID
        const productId = PRODUCTS[plan as keyof typeof PRODUCTS]?.[billing as 'monthly' | 'annual'];

        if (!productId) {
            return res.status(400).json({
                error: 'Product not configured',
                hint: 'Set POLAR_PRODUCT_* environment variables in Vercel',
            });
        }

        // Build checkout options (keep it simple - no metadata to avoid validation issues)
        const successUrl = 'https://agencyos.network/success';
        const checkoutOptions: any = {
            products: [productId.trim()],
            successUrl: `${successUrl}?checkout_id={CHECKOUT_ID}&plan=${plan}`,
            ...(email && { customerEmail: email }),
        };

        // Add discount if provided
        if (discountId) {
            checkoutOptions.discountId = discountId;
        }

        // Create checkout session
        const checkout = await polar.checkouts.create(checkoutOptions);

        return res.status(200).json({
            success: true,
            checkoutUrl: checkout.url,
            checkoutId: checkout.id,
        });

    } catch (error: any) {
        console.error('Polar checkout error:', error);
        return res.status(500).json({
            error: 'Failed to create checkout',
            message: error.message,
        });
    }
}
