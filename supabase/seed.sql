-- ═══════════════════════════════════════════════════════════════════════════════
-- AgencyOS Demo Seeder
-- Run with: supabase db seed
-- ═══════════════════════════════════════════════════════════════════════════════

-- Demo Tenant
INSERT INTO tenants (id, name, slug, plan, status, billing_email, settings) VALUES
('demo-tenant-001', 'Binh Pháp Agency', 'binh-phap', 'enterprise', 'active', 'demo@agencyos.com', '{
  "currency": "USD",
  "timezone": "Asia/Ho_Chi_Minh",
  "locale": "vi-VN",
  "features": ["inventory", "hr", "accounting", "vc"]
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- EMPLOYEES
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO employees (id, tenant_id, employee_code, first_name, last_name, email, department, position, employment_type, hire_date, status, base_salary, currency, work_location) VALUES
('emp-001', 'demo-tenant-001', 'EMP-001', 'Nguyen', 'Minh Anh', 'minh.anh@agency.com', 'Engineering', 'Senior Developer', 'full_time', '2024-01-15', 'active', 2500, 'USD', 'Ho Chi Minh City'),
('emp-002', 'demo-tenant-001', 'EMP-002', 'Tran', 'Duc Thang', 'duc.thang@agency.com', 'Engineering', 'Tech Lead', 'full_time', '2023-06-01', 'active', 4000, 'USD', 'Ho Chi Minh City'),
('emp-003', 'demo-tenant-001', 'EMP-003', 'Le', 'Thu Ha', 'thu.ha@agency.com', 'Sales', 'Account Manager', 'full_time', '2024-03-10', 'active', 2000, 'USD', 'Ha Noi'),
('emp-004', 'demo-tenant-001', 'EMP-004', 'Pham', 'Van Khanh', 'van.khanh@agency.com', 'Operations', 'Project Manager', 'full_time', '2023-09-15', 'active', 3000, 'USD', 'Ho Chi Minh City'),
('emp-005', 'demo-tenant-001', 'EMP-005', 'Hoang', 'Mai Linh', 'mai.linh@agency.com', 'Finance', 'Accountant', 'full_time', '2024-02-01', 'active', 1800, 'USD', 'Da Nang')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ASSETS / INVENTORY
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO assets (id, tenant_id, code, name, type, category, status, purchase_date, purchase_price, current_value, location, assigned_to, warranty_expiry) VALUES
('asset-001', 'demo-tenant-001', 'HW-001', 'MacBook Pro 16" M3', 'hardware', 'Laptop', 'in_use', '2024-01-15', 3499, 3200, 'HCM Office', 'emp-002', '2027-01-15'),
('asset-002', 'demo-tenant-001', 'HW-002', 'MacBook Pro 14" M3', 'hardware', 'Laptop', 'in_use', '2024-02-01', 2499, 2300, 'HCM Office', 'emp-001', '2027-02-01'),
('asset-003', 'demo-tenant-001', 'SW-001', 'Figma Enterprise', 'software', 'Design', 'active', '2024-01-01', 1200, 1000, 'Cloud', NULL, '2025-01-01'),
('asset-004', 'demo-tenant-001', 'SW-002', 'GitHub Enterprise', 'subscription', 'DevTools', 'active', '2024-01-01', 2400, 2400, 'Cloud', NULL, '2025-01-01'),
('asset-005', 'demo-tenant-001', 'HW-003', 'Dell Monitor 27"', 'hardware', 'Monitor', 'in_use', '2024-03-01', 599, 550, 'HCM Office', 'emp-004', '2027-03-01'),
('asset-006', 'demo-tenant-001', 'HW-004', 'iPhone 15 Pro', 'hardware', 'Mobile', 'in_use', '2024-04-01', 1199, 1100, 'Ha Noi Office', 'emp-003', '2026-04-01')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CHART OF ACCOUNTS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO chart_of_accounts (id, tenant_id, code, name, type, parent_code, is_group, balance) VALUES
-- Assets
('acc-001', 'demo-tenant-001', '1000', 'Assets', 'asset', NULL, true, 0),
('acc-002', 'demo-tenant-001', '1100', 'Cash & Bank', 'asset', '1000', true, 0),
('acc-003', 'demo-tenant-001', '1110', 'Operating Account', 'asset', '1100', false, 125000),
('acc-004', 'demo-tenant-001', '1120', 'Savings Account', 'asset', '1100', false, 50000),
('acc-005', 'demo-tenant-001', '1200', 'Accounts Receivable', 'asset', '1000', false, 35000),
-- Liabilities
('acc-010', 'demo-tenant-001', '2000', 'Liabilities', 'liability', NULL, true, 0),
('acc-011', 'demo-tenant-001', '2100', 'Accounts Payable', 'liability', '2000', false, 15000),
('acc-012', 'demo-tenant-001', '2200', 'Credit Cards', 'liability', '2000', false, 8500),
-- Equity
('acc-020', 'demo-tenant-001', '3000', 'Equity', 'equity', NULL, true, 0),
('acc-021', 'demo-tenant-001', '3100', 'Retained Earnings', 'equity', '3000', false, 180000),
-- Revenue
('acc-030', 'demo-tenant-001', '4000', 'Revenue', 'revenue', NULL, true, 0),
('acc-031', 'demo-tenant-001', '4100', 'Service Revenue', 'revenue', '4000', false, 250000),
('acc-032', 'demo-tenant-001', '4200', 'SaaS Revenue', 'revenue', '4000', false, 85000),
-- Expenses
('acc-040', 'demo-tenant-001', '5000', 'Expenses', 'expense', NULL, true, 0),
('acc-041', 'demo-tenant-001', '5100', 'Payroll', 'expense', '5000', false, 120000),
('acc-042', 'demo-tenant-001', '5200', 'Software & Tools', 'expense', '5000', false, 15000),
('acc-043', 'demo-tenant-001', '5300', 'Office & Admin', 'expense', '5000', false, 8000)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- USAGE EVENTS (for Analytics)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO usage_events (id, tenant_id, event_type, user_id, page, metadata, created_at) VALUES
('evt-001', 'demo-tenant-001', 'page_view', 'user-001', '/dashboard', '{"source": "direct"}', NOW() - INTERVAL '1 day'),
('evt-002', 'demo-tenant-001', 'page_view', 'user-001', '/inventory', '{"source": "nav"}', NOW() - INTERVAL '1 day'),
('evt-003', 'demo-tenant-001', 'page_view', 'user-002', '/hr', '{"source": "search"}', NOW() - INTERVAL '2 days'),
('evt-004', 'demo-tenant-001', 'feature_use', 'user-001', '/investor', '{"feature": "mrr_chart"}', NOW() - INTERVAL '3 days'),
('evt-005', 'demo-tenant-001', 'page_view', 'user-003', '/revenue', '{"source": "direct"}', NOW())
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Complete!
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'Demo data seeded successfully!' AS status;
