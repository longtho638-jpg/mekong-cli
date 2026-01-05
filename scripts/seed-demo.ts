/**
 * Demo Data Seeder
 * Seeds realistic data for VC demos
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

// ═══════════════════════════════════════════════════════════════════════════════
// 🏢 DEMO TENANT
// ═══════════════════════════════════════════════════════════════════════════════

const DEMO_TENANT = {
    id: 'demo-tenant-001',
    name: 'Demo Agency',
    slug: 'demo-agency',
    plan: 'ENTERPRISE',
};

// ═══════════════════════════════════════════════════════════════════════════════
// 👥 TEAM MEMBERS
// ═══════════════════════════════════════════════════════════════════════════════

const TEAM_MEMBERS = [
    { email: 'owner@demo.agency', name: 'Anh Founder', role: 'owner' },
    { email: 'admin@demo.agency', name: 'Linh Admin', role: 'admin' },
    { email: 'manager@demo.agency', name: 'Hùng Manager', role: 'manager' },
    { email: 'designer@demo.agency', name: 'Mai Designer', role: 'member' },
    { email: 'developer@demo.agency', name: 'Tuấn Developer', role: 'member' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 MRR HISTORY (12 months)
// ═══════════════════════════════════════════════════════════════════════════════

function generateMRRHistory() {
    const history = [];
    const now = new Date();
    const startMRR = 1200; // Starting MRR 12 months ago

    for (let i = 11; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const growthFactor = 1 + (0.15 * Math.random() + 0.10); // 10-25% growth
        const mrr = Math.round(startMRR * Math.pow(1.18, 11 - i)); // ~18% avg growth

        history.push({
            month: month.toISOString().slice(0, 7) + '-01',
            total_mrr: mrr,
            new_mrr: Math.round(mrr * 0.15),
            expansion_mrr: Math.round(mrr * 0.05),
            churned_mrr: Math.round(mrr * 0.03),
            total_customers: Math.round(mrr / 65), // Average $65/customer
            new_customers: Math.round(mrr * 0.15 / 65),
            churned_customers: Math.round(mrr * 0.03 / 65),
        });
    }

    return history;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📈 USAGE EVENTS (30 days)
// ═══════════════════════════════════════════════════════════════════════════════

function generateUsageEvents(tenantId: string) {
    const events = [];
    const eventTypes = ['page_view', 'feature_use', 'action'];
    const features = [
        'dashboard_view', 'hub_open', 'agent_run', 'report_generate',
        'team_invite', 'settings_update', 'analytics_view', 'billing_check'
    ];
    const pages = [
        '/dashboard', '/hub', '/analytics', '/team', '/settings', '/billing'
    ];

    for (let day = 0; day < 30; day++) {
        const date = new Date();
        date.setDate(date.getDate() - day);

        // More events on weekdays
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const eventCount = isWeekend ? 20 + Math.random() * 30 : 50 + Math.random() * 100;

        for (let i = 0; i < eventCount; i++) {
            const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            const hour = Math.floor(Math.random() * 10) + 9; // 9am-7pm
            const minute = Math.floor(Math.random() * 60);

            date.setHours(hour, minute, 0, 0);

            events.push({
                tenant_id: tenantId,
                user_id: `user-${Math.floor(Math.random() * 50) + 1}`,
                event_type: eventType,
                event_name: eventType === 'page_view'
                    ? 'page_view'
                    : features[Math.floor(Math.random() * features.length)],
                page_url: pages[Math.floor(Math.random() * pages.length)],
                session_id: `session-${day}-${i % 10}`,
                created_at: date.toISOString(),
            });
        }
    }

    return events;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💳 SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function generateSubscriptions() {
    const subscriptions = [];
    const plans = { FREE: 80, PRO: 45, ENTERPRISE: 12 }; // Distribution

    let id = 1;
    for (const [plan, count] of Object.entries(plans)) {
        for (let i = 0; i < count; i++) {
            const createdDaysAgo = Math.floor(Math.random() * 365);
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - createdDaysAgo);

            subscriptions.push({
                tenant_id: `tenant-${id}`,
                plan,
                status: 'active',
                currency: ['USD', 'VND', 'THB', 'IDR', 'PHP'][Math.floor(Math.random() * 5)],
                created_at: createdAt.toISOString(),
                current_period_start: createdAt.toISOString(),
                current_period_end: new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });

            id++;
        }
    }

    return subscriptions;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 MAIN SEEDER
// ═══════════════════════════════════════════════════════════════════════════════

async function seedDemoData() {
    console.log('🌱 Seeding demo data...\n');

    try {
        // 1. Create demo tenant
        console.log('1️⃣ Creating demo tenant...');
        await supabase.from('tenants').upsert({
            id: DEMO_TENANT.id,
            name: DEMO_TENANT.name,
            slug: DEMO_TENANT.slug,
            plan: DEMO_TENANT.plan,
            settings: {},
        });
        console.log('   ✅ Demo tenant created\n');

        // 2. Add team members
        console.log('2️⃣ Adding team members...');
        for (const member of TEAM_MEMBERS) {
            await supabase.from('tenant_members').upsert({
                tenant_id: DEMO_TENANT.id,
                email: member.email,
                name: member.name,
                role: member.role,
                status: 'active',
            });
        }
        console.log(`   ✅ ${TEAM_MEMBERS.length} team members added\n`);

        // 3. Seed MRR history
        console.log('3️⃣ Seeding MRR history...');
        const mrrHistory = generateMRRHistory();
        for (const record of mrrHistory) {
            await supabase.from('mrr_history').upsert(record);
        }
        console.log(`   ✅ ${mrrHistory.length} months of MRR data\n`);

        // 4. Seed usage events
        console.log('4️⃣ Seeding usage events...');
        const events = generateUsageEvents(DEMO_TENANT.id);
        // Batch insert in chunks of 100
        for (let i = 0; i < events.length; i += 100) {
            await supabase.from('usage_events').insert(events.slice(i, i + 100));
        }
        console.log(`   ✅ ${events.length} usage events\n`);

        // 5. Seed subscriptions
        console.log('5️⃣ Seeding subscriptions...');
        const subscriptions = generateSubscriptions();
        for (const sub of subscriptions) {
            await supabase.from('subscriptions').upsert(sub);
        }
        console.log(`   ✅ ${subscriptions.length} subscriptions\n`);

        console.log('🎉 Demo data seeded successfully!\n');
        console.log('📊 Summary:');
        console.log(`   - 1 demo tenant`);
        console.log(`   - ${TEAM_MEMBERS.length} team members`);
        console.log(`   - ${mrrHistory.length} months of MRR history`);
        console.log(`   - ${events.length} usage events`);
        console.log(`   - ${subscriptions.length} subscriptions`);
        console.log('\n🚀 Ready for VC demo!');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    }
}

// Run if called directly
seedDemoData();
