// Direct seed script using Supabase JS client
// Run with: node supabase/seed-node.mjs

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jcbahdioqoepvoliplqy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_KEY not set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TENANT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

async function seed() {
    console.log('🌱 Seeding AgencyOS demo data...');

    // 1. Create demo tenant
    const { error: tenantError } = await supabase
        .from('tenants')
        .upsert({
            id: TENANT_ID,
            name: 'Binh Phap Agency',
            slug: 'binh-phap',
            owner_id: 'a1b2c3d4-e5f6-7890-abcd-000000000001',
            plan: 'ENTERPRISE',
            status: 'active',
            settings: { currency: 'USD', timezone: 'Asia/Ho_Chi_Minh' }
        }, { onConflict: 'slug' });

    if (tenantError) console.log('Tenant:', tenantError.message);
    else console.log('✅ Tenant created');

    // 2. Seed accounts
    const accounts = [
        { tenant_id: TENANT_ID, code: '1000', name: 'Assets', type: 'asset', is_group: true, balance: 0 },
        { tenant_id: TENANT_ID, code: '1110', name: 'Operating Account', type: 'asset', is_group: false, balance: 125000 },
        { tenant_id: TENANT_ID, code: '1120', name: 'Savings Account', type: 'asset', is_group: false, balance: 50000 },
        { tenant_id: TENANT_ID, code: '2100', name: 'Accounts Payable', type: 'liability', is_group: false, balance: 15000 },
        { tenant_id: TENANT_ID, code: '3100', name: 'Retained Earnings', type: 'equity', is_group: false, balance: 180000 },
        { tenant_id: TENANT_ID, code: '4100', name: 'Service Revenue', type: 'income', is_group: false, balance: 250000 },
        { tenant_id: TENANT_ID, code: '5100', name: 'Payroll', type: 'expense', is_group: false, balance: 120000 },
    ];

    const { error: accError } = await supabase.from('accounts').upsert(accounts, { onConflict: 'tenant_id,code' });
    if (accError) console.log('Accounts:', accError.message);
    else console.log('✅ Accounts seeded (7 records)');

    // 3. Seed usage events
    const events = [
        { tenant_id: TENANT_ID, event_type: 'page_view', user_id: crypto.randomUUID(), page: '/dashboard', metadata: { source: 'direct' } },
        { tenant_id: TENANT_ID, event_type: 'page_view', user_id: crypto.randomUUID(), page: '/investor', metadata: { source: 'nav' } },
        { tenant_id: TENANT_ID, event_type: 'page_view', user_id: crypto.randomUUID(), page: '/revenue', metadata: { source: 'search' } },
        { tenant_id: TENANT_ID, event_type: 'feature_use', user_id: crypto.randomUUID(), page: '/hr', metadata: { feature: 'employee_list' } },
        { tenant_id: TENANT_ID, event_type: 'page_view', user_id: crypto.randomUUID(), page: '/finops', metadata: { source: 'direct' } },
    ];

    const { error: evtError } = await supabase.from('usage_events').insert(events);
    if (evtError) console.log('Events:', evtError.message);
    else console.log('✅ Usage events seeded (5 records)');

    console.log('\n🎉 Seed complete!');
}

seed().catch(console.error);
