-- Agency OS Database Schema
-- Version: 2.0.0
-- Created: 2025-12-19

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- AGENCIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  website VARCHAR(255),
  niche VARCHAR(100),
  size VARCHAR(50),
  location VARCHAR(255),
  services TEXT[],
  logo_url TEXT,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agency RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agency" ON public.agencies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agency" ON public.agencies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agency" ON public.agencies
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active', -- active, pending, churned
  mrr DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT USING (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own clients" ON public.clients
  FOR INSERT WITH CHECK (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE USING (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own clients" ON public.clients
  FOR DELETE USING (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active', -- draft, active, completed, cancelled
  type VARCHAR(100), -- retainer, project, hourly
  budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT WITH CHECK (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

-- ============================================
-- INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  amount DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  stripe_invoice_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT USING (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own invoices" ON public.invoices
  FOR INSERT WITH CHECK (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own invoices" ON public.invoices
  FOR UPDATE USING (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo', -- todo, in_progress, review, done
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks" ON public.tasks
  FOR ALL USING (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

-- ============================================
-- ACTIVITY LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50), -- client, project, invoice, task
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON public.activity_logs
  FOR SELECT USING (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert activity" ON public.activity_logs
  FOR INSERT WITH CHECK (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_agencies_user_id ON public.agencies(user_id);
CREATE INDEX idx_clients_agency_id ON public.clients(agency_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_projects_agency_id ON public.projects(agency_id);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_invoices_agency_id ON public.invoices(agency_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_tasks_agency_id ON public.tasks(agency_id);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_activity_agency_id ON public.activity_logs(agency_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
