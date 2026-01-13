import type { APIRoute } from 'astro';

/**
 * Promo Code Validation API
 * 
 * Logic mới: Không dùng generate 100 codes random
 * Thay vào đó dùng pattern-based validation + Polar.sh discount IDs
 * 
 * Patterns chấp nhận:
 * - FOUNDER100: 100% off (for founders/early adopters)
 * - BETA50: 50% off (beta testers)
 * - WELCOME25: 25% off (general welcome)
 * - MEKONG: 100% off (internal use)
 * - Any code ending with "100": 100% off (pattern match)
 */

// Fixed promo codes (no random generation needed)
const PROMO_CODES: Record<string, { name: string; value: number; source: string }> = {
    'FOUNDER100': { name: 'Founder Edition', value: 100, source: 'pattern' },
    'BETA50': { name: 'Beta Tester', value: 50, source: 'pattern' },
    'WELCOME25': { name: 'Welcome Discount', value: 25, source: 'pattern' },
    'AGENCYOS100': { name: 'AgencyOS Launch', value: 100, source: 'pattern' },
    'MEKONG': { name: 'Internal Use', value: 100, source: 'pattern' },
    'LAUNCH100': { name: 'Launch Day', value: 100, source: 'pattern' },
    'VIP100': { name: 'VIP Access', value: 100, source: 'pattern' },
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const { code } = await request.json();

        if (!code || typeof code !== 'string') {
            return new Response(JSON.stringify({
                valid: false,
                error: 'Promo code is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const upperCode = code.trim().toUpperCase();

        // 1. Check fixed promo codes first
        if (PROMO_CODES[upperCode]) {
            const promo = PROMO_CODES[upperCode];
            return new Response(JSON.stringify({
                valid: true,
                code: upperCode,
                name: promo.name,
                value: promo.value,
                source: promo.source,
                discountId: null // No Polar discount ID for pattern codes
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Pattern matching: codes ending with "100" = 100% off
        if (upperCode.endsWith('100')) {
            return new Response(JSON.stringify({
                valid: true,
                code: upperCode,
                name: 'Special 100% Off',
                value: 100,
                source: 'pattern',
                discountId: null
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 3. Pattern matching: codes ending with "50" = 50% off
        if (upperCode.endsWith('50')) {
            return new Response(JSON.stringify({
                valid: true,
                code: upperCode,
                name: '50% Discount',
                value: 50,
                source: 'pattern',
                discountId: null
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 4. TODO: Check Polar.sh discounts (when configured)
        // const polarResponse = await checkPolarDiscount(upperCode);
        // if (polarResponse?.valid) return polarResponse;

        // Invalid code
        return new Response(JSON.stringify({
            valid: false,
            error: 'Invalid promo code'
        }), {
            status: 200, // Still 200, just invalid
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Promo validation error:', error);
        return new Response(JSON.stringify({
            valid: false,
            error: 'Server error validating code'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
