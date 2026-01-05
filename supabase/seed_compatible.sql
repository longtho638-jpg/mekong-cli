-- ═══════════════════════════════════════════════════════════════════════════════
-- AgencyOS Compatible Seed Script
-- Works with current remote schema state
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create demo tenant (tenants table from multi_tenancy migration)
INSERT INTO tenants (id, name, slug, owner_id, plan, status, settings)
SELECT 
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'Binh Phap Agency',
    'binh-phap',
    (SELECT id FROM auth.users LIMIT 1),
    'ENTERPRISE',
    'active',
    '{"currency": "USD", "timezone": "Asia/Ho_Chi_Minh"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE slug = 'binh-phap')
AND EXISTS (SELECT 1 FROM auth.users LIMIT 1);

-- Fallback: Create tenant without user reference if no users exist
INSERT INTO tenants (id, name, slug, owner_id, plan, status, settings)
SELECT 
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'Binh Phap Agency',
    'binh-phap',
    'a1b2c3d4-e5f6-7890-abcd-000000000001'::uuid,
    'ENTERPRISE',
    'active',
    '{"currency": "USD", "timezone": "Asia/Ho_Chi_Minh"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE slug = 'binh-phap')
ON CONFLICT (slug) DO NOTHING;

-- Seed accounts (from accounting migration)
INSERT INTO accounts (id, tenant_id, code, name, type, is_group, balance)
VALUES
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '1000', 'Assets', 'asset', true, 0),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '1100', 'Cash & Bank', 'asset', true, 0),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '1110', 'Operating Account', 'asset', false, 125000),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '1120', 'Savings Account', 'asset', false, 50000),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2000', 'Liabilities', 'liability', true, 0),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2100', 'Accounts Payable', 'liability', false, 15000),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '3000', 'Equity', 'equity', true, 0),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '3100', 'Retained Earnings', 'equity', false, 180000),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4000', 'Revenue', 'income', true, 0),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4100', 'Service Revenue', 'income', false, 250000),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '5000', 'Expenses', 'expense', true, 0),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '5100', 'Payroll', 'expense', false, 120000)
ON CONFLICT DO NOTHING;

-- Seed usage events (from analytics migration)
INSERT INTO usage_events (id, tenant_id, event_type, user_id, page, metadata, created_at)
VALUES
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'page_view', gen_random_uuid(), '/dashboard', '{"source": "direct"}'::jsonb, NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'page_view', gen_random_uuid(), '/investor', '{"source": "nav"}'::jsonb, NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'page_view', gen_random_uuid(), '/revenue', '{"source": "search"}'::jsonb, NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'feature_use', gen_random_uuid(), '/hr', '{"feature": "employee_list"}'::jsonb, NOW()),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'page_view', gen_random_uuid(), '/finops', '{"source": "direct"}'::jsonb, NOW())
ON CONFLICT DO NOTHING;

SELECT 'Demo data seeded!' AS status;
