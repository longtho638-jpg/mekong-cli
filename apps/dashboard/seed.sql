-- Mekong-CLI Seed Data for WOW Run
-- Run this in Supabase SQL Editor

-- Clear existing data (optional)
-- TRUNCATE clients, projects, invoices CASCADE;

-- Insert Sample Clients
INSERT INTO clients (name, email, phone, company, status, industry, monthly_revenue, created_at) VALUES
('TechFlow AI', 'contact@techflow.ai', '+84 909 123 456', 'TechFlow AI Corp', 'active', 'AI/ML', 45000, NOW() - INTERVAL '6 months'),
('CloudNative Labs', 'hello@cloudnative.io', '+84 909 234 567', 'CloudNative Labs', 'active', 'Cloud Infrastructure', 32000, NOW() - INTERVAL '8 months'),
('DataSync Pro', 'team@datasync.pro', '+84 909 345 678', 'DataSync Pro VN', 'active', 'Data Analytics', 28000, NOW() - INTERVAL '4 months'),
('AgriChain Mekong', 'info@agrichain.vn', '+84 909 456 789', 'AgriChain Mekong', 'active', 'AgriTech', 55000, NOW() - INTERVAL '10 months'),
('FinPro Plus', 'support@finpro.plus', '+84 909 567 890', 'FinPro Plus', 'active', 'FinTech', 67000, NOW() - INTERVAL '12 months'),
('EduTech Next', 'learn@edutech.next', '+84 909 678 901', 'EduTech Next', 'prospect', 'EdTech', 0, NOW() - INTERVAL '1 month'),
('HealthAI VN', 'care@healthai.vn', '+84 909 789 012', 'HealthAI Vietnam', 'active', 'HealthTech', 38000, NOW() - INTERVAL '5 months'),
('LogiFlow Express', 'ship@logiflow.express', '+84 909 890 123', 'LogiFlow Express', 'churned', 'Logistics', 0, NOW() - INTERVAL '14 months')
ON CONFLICT DO NOTHING;

-- Insert Sample Projects
INSERT INTO projects (name, client_id, status, budget, start_date, end_date, description) 
SELECT 
    'AI Platform Development',
    id,
    'in_progress',
    150000,
    NOW() - INTERVAL '3 months',
    NOW() + INTERVAL '6 months',
    'Building AI-powered platform for TechFlow'
FROM clients WHERE name = 'TechFlow AI' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO projects (name, client_id, status, budget, start_date, end_date, description)
SELECT 
    'Cloud Migration Phase 2',
    id,
    'completed',
    85000,
    NOW() - INTERVAL '6 months',
    NOW() - INTERVAL '1 month',
    'Cloud infrastructure migration for CloudNative'
FROM clients WHERE name = 'CloudNative Labs' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO projects (name, client_id, status, budget, start_date, end_date, description)
SELECT 
    'Data Pipeline Optimization',
    id,
    'in_progress',
    45000,
    NOW() - INTERVAL '2 months',
    NOW() + INTERVAL '4 months',
    'Optimizing data pipelines for DataSync'
FROM clients WHERE name = 'DataSync Pro' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO projects (name, client_id, status, budget, start_date, end_date, description)
SELECT 
    'Supply Chain Tracking',
    id,
    'in_progress',
    200000,
    NOW() - INTERVAL '4 months',
    NOW() + INTERVAL '8 months',
    'Blockchain supply chain for AgriChain'
FROM clients WHERE name = 'AgriChain Mekong' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO projects (name, client_id, status, budget, start_date, end_date, description)
SELECT 
    'Payment Gateway Integration',
    id,
    'completed',
    120000,
    NOW() - INTERVAL '8 months',
    NOW() - INTERVAL '2 months',
    'Payment gateway for FinPro Plus'
FROM clients WHERE name = 'FinPro Plus' LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert Sample Invoices
INSERT INTO invoices (invoice_number, client_id, project_id, amount, status, issue_date, due_date)
SELECT 
    'INV-2026-001',
    c.id,
    p.id,
    45000,
    'paid',
    NOW() - INTERVAL '2 months',
    NOW() - INTERVAL '1 month'
FROM clients c
JOIN projects p ON p.client_id = c.id
WHERE c.name = 'TechFlow AI' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO invoices (invoice_number, client_id, project_id, amount, status, issue_date, due_date)
SELECT 
    'INV-2026-002',
    c.id,
    p.id,
    32000,
    'paid',
    NOW() - INTERVAL '3 months',
    NOW() - INTERVAL '2 months'
FROM clients c
JOIN projects p ON p.client_id = c.id
WHERE c.name = 'CloudNative Labs' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO invoices (invoice_number, client_id, project_id, amount, status, issue_date, due_date)
SELECT 
    'INV-2026-003',
    c.id,
    p.id,
    28000,
    'pending',
    NOW() - INTERVAL '2 weeks',
    NOW() + INTERVAL '2 weeks'
FROM clients c
JOIN projects p ON p.client_id = c.id
WHERE c.name = 'DataSync Pro' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO invoices (invoice_number, client_id, project_id, amount, status, issue_date, due_date)
SELECT 
    'INV-2026-004',
    c.id,
    p.id,
    55000,
    'paid',
    NOW() - INTERVAL '1 month',
    NOW()
FROM clients c
JOIN projects p ON p.client_id = c.id
WHERE c.name = 'AgriChain Mekong' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO invoices (invoice_number, client_id, project_id, amount, status, issue_date, due_date)
SELECT 
    'INV-2026-005',
    c.id,
    p.id,
    67000,
    'paid',
    NOW() - INTERVAL '4 months',
    NOW() - INTERVAL '3 months'
FROM clients c
JOIN projects p ON p.client_id = c.id
WHERE c.name = 'FinPro Plus' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO invoices (invoice_number, client_id, project_id, amount, status, issue_date, due_date)
SELECT 
    'INV-2026-006',
    c.id,
    p.id,
    15000,
    'overdue',
    NOW() - INTERVAL '2 months',
    NOW() - INTERVAL '1 month'
FROM clients c
JOIN projects p ON p.client_id = c.id
WHERE c.name = 'HealthAI VN' LIMIT 1
ON CONFLICT DO NOTHING;

-- Verify data
SELECT 'Clients' as table_name, COUNT(*) as count FROM clients
UNION ALL
SELECT 'Projects', COUNT(*) FROM projects
UNION ALL
SELECT 'Invoices', COUNT(*) FROM invoices;
