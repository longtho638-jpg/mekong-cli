import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Polar } from '@polar-sh/sdk';

// Initialize Polar SDK
const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
});

// Fallback promo codes (when Polar discount not found)
// These can be managed in Supabase or here for quick testing
const FALLBACK_CODES: Record<string, { discount: number; type: 'percentage' | 'fixed'; name: string }> = {
    // 100% off codes - Founder/VIP access
    'FOUNDER100': { discount: 100, type: 'percentage', name: 'Founder Edition' },
    'MEKONG': { discount: 100, type: 'percentage', name: 'Internal Use' },
    'VIP100': { discount: 100, type: 'percentage', name: 'VIP Access' },
    'LAUNCH100': { discount: 100, type: 'percentage', name: 'Launch Day' },
    'AGENCYOS100': { discount: 100, type: 'percentage', name: 'AgencyOS Launch' },
    'VIPFREE': { discount: 100, type: 'percentage', name: 'VIP Free Access' },
    // Partial discount codes
    'BETA50': { discount: 50, type: 'percentage', name: 'Beta Tester' },
    'AFFILIATE50': { discount: 50, type: 'percentage', name: 'Affiliate Special' },
    'WELCOME25': { discount: 25, type: 'percentage', name: 'Welcome Discount' },
    'LAUNCH20': { discount: 20, type: 'percentage', name: 'Launch Discount' },
    'EARLYBIRD': { discount: 30, type: 'percentage', name: 'Early Bird' },
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
        const { code } = req.body;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({
                valid: false,
                error: 'Promo code is required'
            });
        }

        const normalizedCode = code.trim().toUpperCase();

        // Step 1: Try to find discount in Polar.sh
        try {
            const discounts = await polar.discounts.list({
                query: normalizedCode,
                limit: 10,
            });

            // Find exact match by code
            const polarDiscount = discounts.result?.items?.find(
                d => d.code?.toUpperCase() === normalizedCode
            );

            if (polarDiscount) {
                // Check if discount is still valid
                const now = new Date();

                if (polarDiscount.startsAt && new Date(polarDiscount.startsAt) > now) {
                    return res.status(400).json({
                        valid: false,
                        error: 'This discount is not yet active'
                    });
                }

                if (polarDiscount.endsAt && new Date(polarDiscount.endsAt) < now) {
                    return res.status(400).json({
                        valid: false,
                        error: 'This discount has expired'
                    });
                }

                if (polarDiscount.maxRedemptions &&
                    polarDiscount.redemptionsCount >= polarDiscount.maxRedemptions) {
                    return res.status(400).json({
                        valid: false,
                        error: 'This discount has reached maximum redemptions'
                    });
                }

                // Return Polar discount info
                return res.status(200).json({
                    valid: true,
                    source: 'polar',
                    discountId: polarDiscount.id,
                    code: polarDiscount.code,
                    name: polarDiscount.name,
                    type: polarDiscount.type,
                    value: polarDiscount.type === 'percentage'
                        ? (polarDiscount as any).basisPoints / 100
                        : (polarDiscount as any).amount / 100,
                    currency: (polarDiscount as any).currency || 'usd',
                    duration: polarDiscount.duration,
                });
            }
        } catch (polarError) {
            console.log('Polar discount lookup failed, trying fallback:', polarError);
        }

        // Step 2: Check fallback codes
        const fallback = FALLBACK_CODES[normalizedCode];
        if (fallback) {
            return res.status(200).json({
                valid: true,
                source: 'fallback',
                discountId: null, // No Polar discount ID
                code: normalizedCode,
                name: fallback.name,
                type: fallback.type,
                value: fallback.discount,
                currency: 'usd',
                duration: 'once',
                note: 'Fallback code - discount applied at checkout calculation'
            });
        }

        // Step 3: Check pattern-based codes (AGENCYOS-XXXX-XXXX)
        const patternMatch = /^AGENCYOS-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizedCode);
        if (patternMatch) {
            return res.status(200).json({
                valid: true,
                source: 'pattern',
                discountId: null,
                code: normalizedCode,
                name: 'Agency Launch Code',
                type: 'percentage',
                value: 100,
                currency: 'usd',
                duration: 'once',
                note: 'Pattern-matched promotional code'
            });
        }

        // Not found anywhere
        return res.status(400).json({
            valid: false,
            error: 'Invalid promo code'
        });

    } catch (error: any) {
        console.error('Promo validation error:', error);
        return res.status(500).json({
            valid: false,
            error: 'Failed to validate promo code',
            message: error.message
        });
    }
}
