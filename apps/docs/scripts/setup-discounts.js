#!/usr/bin/env node
/**
 * POLAR.SH DISCOUNT SETUP SCRIPT
 * 
 * Usage:
 *   POLAR_ACCESS_TOKEN=polar_oat_xxx node scripts/setup-discounts.js
 * 
 * This script will create all promo code discounts in Polar.sh
 */

const POLAR_API = 'https://api.polar.sh/v1';

// Discount configurations - BINH PHÁP MARKETING
const DISCOUNTS = [
    {
        name: 'Launch 20% Off',
        code: 'LAUNCH20',
        type: 'percentage',
        basisPoints: 2000, // 20%
        duration: 'forever',
        maxRedemptions: 1000,
    },
    {
        name: 'Early Bird 30% Off',
        code: 'EARLYBIRD',
        type: 'percentage',
        basisPoints: 3000, // 30%
        duration: 'repeating',
        durationInMonths: 3,
        maxRedemptions: 500,
    },
    {
        name: 'Affiliate Special 50% Off',
        code: 'AFFILIATE50',
        type: 'percentage',
        basisPoints: 5000, // 50%
        duration: 'once',
        maxRedemptions: 200,
    },
    {
        name: 'VIP Free Access',
        code: 'VIPFREE',
        type: 'percentage',
        basisPoints: 10000, // 100%
        duration: 'once',
        maxRedemptions: 50,
    },
    {
        name: 'Partner Program',
        code: 'PARTNER25',
        type: 'percentage',
        basisPoints: 2500, // 25%
        duration: 'forever',
        maxRedemptions: 100,
    },
];

async function polarFetch(endpoint, options = {}) {
    const token = process.env.POLAR_ACCESS_TOKEN;
    if (!token) {
        console.error('❌ POLAR_ACCESS_TOKEN not set');
        process.exit(1);
    }

    const response = await fetch(`${POLAR_API}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Polar API error: ${response.status} - ${error}`);
    }

    return response.json();
}

async function createDiscount(discount) {
    console.log(`🎟️ Creating discount: ${discount.code}...`);

    try {
        const body = {
            name: discount.name,
            code: discount.code,
            type: discount.type,
            basis_points: discount.basisPoints,
            duration: discount.duration,
        };

        if (discount.durationInMonths) {
            body.duration_in_months = discount.durationInMonths;
        }

        if (discount.maxRedemptions) {
            body.max_redemptions = discount.maxRedemptions;
        }

        const created = await polarFetch('/discounts', {
            method: 'POST',
            body: JSON.stringify(body),
        });

        console.log(`   ✅ Created: ${created.id}`);
        return created;
    } catch (error) {
        // Check if discount already exists
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`   ⚠️ Already exists, skipping`);
            return null;
        }
        console.log(`   ❌ Error: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('\n🎟️ POLAR.SH DISCOUNT SETUP\n');
    console.log('='.repeat(50));

    const createdDiscounts = [];

    for (const discount of DISCOUNTS) {
        const created = await createDiscount(discount);
        if (created) {
            createdDiscounts.push({
                code: discount.code,
                id: created.id,
                value: discount.basisPoints / 100,
            });
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 CREATED DISCOUNTS:\n');

    for (const d of createdDiscounts) {
        console.log(`${d.code}: ${d.value}% off (ID: ${d.id})`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ DISCOUNT SETUP COMPLETE!\n');
    console.log('Customers can now use these codes at checkout.\n');
}

main().catch(console.error);
