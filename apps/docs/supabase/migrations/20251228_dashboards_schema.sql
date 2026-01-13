-- AgencyOS Dashboard Backend - Supabase Schema Migration
-- Version: 1.0
-- Date: 2025-12-28

-- =====================================================
-- TABLE: clients
-- Purpose: Store client information and portal codes
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  portal_code VARCHAR(12) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_portal_code ON clients(portal_code);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- =====================================================
-- TABLE: projects
-- Purpose: Track client projects and progress
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'planning',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  budget DECIMAL(10, 2),
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- =====================================================
-- TABLE: tasks
-- Purpose: Individual project tasks and assignments
-- =====================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo',
  assigned_to VARCHAR(255),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- =====================================================
-- TABLE: invoices
-- Purpose: Client billing and payment tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- =====================================================
-- TABLE: messages
-- Purpose: Client-agency communication
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  sender VARCHAR(50) NOT NULL CHECK (sender IN ('client', 'agency')),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- =====================================================
-- TABLE: agency_stats
-- Purpose: Real-time agency metrics (single row)
-- =====================================================
CREATE TABLE IF NOT EXISTS agency_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_mtd DECIMAL(10, 2) DEFAULT 0,
  active_clients INTEGER DEFAULT 0,
  profit_margin DECIMAL(5, 2) DEFAULT 0,
  utilization DECIMAL(5, 2) DEFAULT 0,
  nps_score INTEGER DEFAULT 0,
  pipeline DECIMAL(10, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: affiliate_stats
-- Purpose: Affiliate performance tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS affiliate_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) UNIQUE NOT NULL,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  pending_payout DECIMAL(10, 2) DEFAULT 0,
  rank VARCHAR(50) DEFAULT 'Bronze',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_stats_user_id ON affiliate_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_stats_rank ON affiliate_stats(rank);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables
-- =====================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_stats ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: Clients can only see their own data
-- =====================================================

-- Clients: See only own record via portal_code
CREATE POLICY "Clients can view own data"
ON clients FOR SELECT
USING (portal_code = current_setting('app.portal_code', true));

-- Projects: See only projects belonging to their client_id
CREATE POLICY "Clients can view own projects"
ON projects FOR SELECT
USING (client_id IN (
  SELECT id FROM clients 
  WHERE portal_code = current_setting('app.portal_code', true)
));

-- Tasks: See only tasks for their projects
CREATE POLICY "Clients can view own tasks"
ON tasks FOR SELECT
USING (project_id IN (
  SELECT p.id FROM projects p
  JOIN clients c ON p.client_id = c.id
  WHERE c.portal_code = current_setting('app.portal_code', true)
));

-- Invoices: See only own invoices
CREATE POLICY "Clients can view own invoices"
ON invoices FOR SELECT
USING (client_id IN (
  SELECT id FROM clients 
  WHERE portal_code = current_setting('app.portal_code', true)
));

-- Messages: See only own messages
CREATE POLICY "Clients can view own messages"
ON messages FOR SELECT
USING (client_id IN (
  SELECT id FROM clients 
  WHERE portal_code = current_setting('app.portal_code', true)
));

-- Agency Stats: Admin only (future: use auth.uid())
CREATE POLICY "Admin can view agency stats"
ON agency_stats FOR SELECT
USING (true); -- TODO: Restrict to admin users

-- Affiliate Stats: Users see only their own stats
CREATE POLICY "Users can view own affiliate stats"
ON affiliate_stats FOR SELECT
USING (user_id = current_setting('app.user_id', true));

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- Enable Realtime for critical tables
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE agency_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE affiliate_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- =====================================================
-- SEED DATA (Demo purposes)
-- =====================================================

-- Insert demo agency stats
INSERT INTO agency_stats (revenue_mtd, active_clients, profit_margin, utilization, nps_score, pipeline)
VALUES (45200, 15, 42, 82, 72, 125000)
ON CONFLICT DO NOTHING;

-- Insert demo client
INSERT INTO clients (name, company, email, portal_code, status)
VALUES 
  ('John Smith', 'Acme Corp', 'john@acmecorp.com', 'TEST12345678', 'active'),
  ('Jane Doe', 'Coffee Lab', 'jane@coffeelab.com', 'DEMO98765432', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert demo project (assuming client exists)
DO $$
DECLARE
  client_uuid UUID;
BEGIN
  SELECT id INTO client_uuid FROM clients WHERE email = 'john@acmecorp.com';
  
  IF client_uuid IS NOT NULL THEN
    INSERT INTO projects (client_id, name, description, status, progress, budget, deadline)
    VALUES (
      client_uuid,
      'Website Redesign',
      'Complete website overhaul with modern design',
      'in_progress',
      43,
      5000,
      '2026-01-15'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert demo tasks
DO $$
DECLARE
  project_uuid UUID;
BEGIN
  SELECT id INTO project_uuid FROM projects WHERE name = 'Website Redesign';
  
  IF project_uuid IS NOT NULL THEN
    INSERT INTO tasks (project_id, title, status, due_date)
    VALUES 
      (project_uuid, 'Research competitors', 'done', '2025-12-10'),
      (project_uuid, 'Create wireframes', 'done', '2025-12-15'),
      (project_uuid, 'Design system setup', 'done', '2025-12-20'),
      (project_uuid, 'Homepage design', 'in_progress', '2025-12-30')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert demo invoice
DO $$
DECLARE
  client_uuid UUID;
BEGIN
  SELECT id INTO client_uuid FROM clients WHERE email = 'john@acmecorp.com';
  
  IF client_uuid IS NOT NULL THEN
    INSERT INTO invoices (client_id, invoice_number, amount, status, paid_at)
    VALUES (
      client_uuid,
      'INV-001',
      2500,
      'paid',
      '2025-12-15'
    )
    ON CONFLICT (invoice_number) DO NOTHING;
  END IF;
END $$;

-- Insert demo affiliate stats
INSERT INTO affiliate_stats (user_id, total_earnings, total_clicks, conversions, conversion_rate, pending_payout, rank)
VALUES ('user_demo', 1250.50, 3420, 28, 0.82, 450.00, 'Gold')
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE clients IS 'Client information and portal access codes';
COMMENT ON TABLE projects IS 'Client projects with progress tracking';
COMMENT ON TABLE tasks IS 'Individual project tasks and assignments';
COMMENT ON TABLE invoices IS 'Client billing and payment records';
COMMENT ON TABLE messages IS 'Client-agency communication messages';
COMMENT ON TABLE agency_stats IS 'Real-time agency performance metrics';
COMMENT ON TABLE affiliate_stats IS 'Affiliate user performance and earnings';
