#!/usr/bin/env node
/**
 * POLAR.SH AUTO-SETUP SCRIPT
 * 
 * Usage:
 *   1. Get Access Token from https://polar.sh/dashboard/settings/developers
 *   2. Run: POLAR_ACCESS_TOKEN=polar_at_xxx node scripts/setup-polar.js
 * 
 * This script will:
 *   - Create all 3 products (Starter, Pro, Franchise)
 *   - Setup webhook
 *   - Output all environment variables
 */

const POLAR_API = 'https://api.polar.sh/v1';

// Product configurations - BINH PHÁP PRICING (Approved)
const PRODUCTS = [
    {
        name: 'AgencyOS Starter',
        description: 'CHIẾN BINH - 125+ AI commands for solo agencies. Perfect for getting started.',
        prices: [
            { amount: 2900, interval: 'month', name: 'Starter Monthly ($29)' },
            { amount: 24900, interval: 'year', name: 'Starter Annual ($249 - Save 29%)' }
        ]
    },
    {
        name: 'AgencyOS Pro',
        description: 'TƯỚNG QUÂN - Everything in Starter + priority support + advanced commands.',
        prices: [
            { amount: 9900, interval: 'month', name: 'Pro Monthly ($99)' },
            { amount: 79900, interval: 'year', name: 'Pro Annual ($799 - Save 33%)' }
        ]
    },
    {
        name: 'AgencyOS Franchise',
        description: 'THỐNG SOÁI - White-label license. Run your own agency platform.',
        prices: [
            { amount: 29900, interval: 'month', name: 'Franchise Monthly ($299)' },
            { amount: 239900, interval: 'year', name: 'Franchise Annual ($2,399 - Save 33%)' }
        ]
    }
];


async function polarFetch(endpoint, options = {}) {
    const token = process.env.POLAR_ACCESS_TOKEN;
    if (!token) {
        console.error('❌ POLAR_ACCESS_TOKEN not set');
        console.log('   Get your token: https://polar.sh/dashboard/settings/developers');
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

async function getOrganization() {
    console.log('📍 Getting organization...');
    const result = await polarFetch('/organizations');
    if (!result.items || result.items.length === 0) {
        throw new Error('No organization found. Create one at polar.sh first.');
    }
    return result.items[0];
}

async function createProduct(org, product) {
    console.log(`📦 Creating product: ${product.name}...`);

    try {
        // Create product with first price (monthly)
        const monthlyPrice = product.prices.find(p => p.interval === 'month');
        const created = await polarFetch('/products', {
            method: 'POST',
            body: JSON.stringify({
                name: product.name,
                description: product.description,
                recurring_interval: 'month',
                prices: [{
                    amount_type: 'fixed',
                    price_amount: monthlyPrice.amount,
                    price_currency: 'usd',
                }],
            }),
        });
        console.log(`   ✅ Created: ${created.id}`);
        return created;
    } catch (error) {

        // Product might already exist
        console.log(`   ⚠️  ${error.message}`);

        // Try to find existing product
        const existing = await polarFetch(`/products?organization_id=${org.id}`);
        const found = existing.items?.find(p => p.name === product.name);
        if (found) {
            console.log(`   ✅ Found existing: ${found.id}`);
            return found;
        }
        throw error;
    }
}

async function setupWebhook(org) {
    console.log('🔗 Setting up webhook...');

    const webhookUrl = 'https://agencyos.network/api/webhook/polar';

    try {
        const webhook = await polarFetch('/webhooks', {
            method: 'POST',
            body: JSON.stringify({
                organization_id: org.id,
                url: webhookUrl,
                events: [
                    'checkout.created',
                    'checkout.updated',
                    'order.created',
                    'subscription.created',
                    'subscription.updated',
                    'subscription.canceled',
                    'refund.created',
                ],
            }),
        });
        console.log(`   ✅ Webhook created`);
        return webhook;
    } catch (error) {
        console.log(`   ⚠️  Webhook may already exist: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('\n🏯 POLAR.SH AUTO-SETUP FOR AGENCYOS\n');
    console.log('='.repeat(50));

    try {
        // Get organization
        const org = await getOrganization();
        console.log(`   Organization: ${org.name} (${org.id})\n`);

        // Create products
        const createdProducts = {};
        for (const product of PRODUCTS) {
            const created = await createProduct(org, product);
            const key = product.name.toLowerCase().replace('agencyos ', '');
            createdProducts[key] = created;
        }

        console.log('');

        // Setup webhook
        const webhook = await setupWebhook(org);

        // Output environment variables
        console.log('\n' + '='.repeat(50));
        console.log('📋 ADD THESE TO VERCEL ENVIRONMENT VARIABLES:\n');

        console.log('# Polar.sh Integration');
        console.log(`POLAR_ACCESS_TOKEN=${process.env.POLAR_ACCESS_TOKEN}`);

        if (webhook?.secret) {
            console.log(`POLAR_WEBHOOK_SECRET=${webhook.secret}`);
        } else {
            console.log('POLAR_WEBHOOK_SECRET=<get from polar.sh webhook settings>');
        }

        console.log('POLAR_SUCCESS_URL=https://agencyos.network/success');
        console.log('');

        // Product IDs
        for (const [key, product] of Object.entries(createdProducts)) {
            if (product.prices) {
                const monthly = product.prices.find(p => p.recurring_interval === 'month');
                const annual = product.prices.find(p => p.recurring_interval === 'year');

                if (monthly) console.log(`POLAR_PRODUCT_${key.toUpperCase()}_MONTHLY=${product.id}`);
                if (annual) console.log(`POLAR_PRODUCT_${key.toUpperCase()}_ANNUAL=${product.id}`);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('✅ SETUP COMPLETE!\n');
        console.log('Next steps:');
        console.log('1. Copy the environment variables above');
        console.log('2. Add them to Vercel: https://vercel.com/dashboard/project/settings/environment-variables');
        console.log('3. Redeploy your app');
        console.log('');

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    }
}

main();
