-- ============================================
-- MULTI-TENANCY SCHEMA
-- Agency OS v2.1 - Team Members & Roles
-- Created: 2026-01-03
-- ============================================

BEGIN;

-- ============================================
-- TEAM MEMBERS TABLE
-- Links users to agencies with roles
-- ============================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, invited, suspended
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, user_id)
);

-- Team Members RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Members can view other members in their agency
CREATE POLICY "Team members can view own agency members" ON public.team_members
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM public.team_members WHERE user_id = auth.uid())
  );

-- Only admins/owners can insert (invite)
CREATE POLICY "Admins can invite members" ON public.team_members
  FOR INSERT WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Only admins/owners can update
CREATE POLICY "Admins can update members" ON public.team_members
  FOR UPDATE USING (
    agency_id IN (
      SELECT agency_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Only admins/owners can delete
CREATE POLICY "Admins can remove members" ON public.team_members
  FOR DELETE USING (
    agency_id IN (
      SELECT agency_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- TEAM INVITATIONS TABLE
-- Pending invitations for new team members
-- ============================================
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  token VARCHAR(255) NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, email)
);

-- Invitations RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invitations" ON public.team_invitations
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- UPDATE AGENCIES RLS FOR MULTI-TENANCY
-- Allow team members to view their agency
-- ============================================

-- Drop old policy and create new one
DROP POLICY IF EXISTS "Users can view own agency" ON public.agencies;

CREATE POLICY "Team members can view agency" ON public.agencies
  FOR SELECT USING (
    id IN (SELECT agency_id FROM public.team_members WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

-- ============================================
-- UPDATE OTHER TABLES RLS FOR MULTI-TENANCY
-- ============================================

-- Update clients RLS
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
CREATE POLICY "Team members can view clients" ON public.clients
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM public.team_members WHERE user_id = auth.uid())
  );

-- Update projects RLS
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Team members can view projects" ON public.projects
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM public.team_members WHERE user_id = auth.uid())
  );

-- Update invoices RLS
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Team members can view invoices" ON public.invoices
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM public.team_members WHERE user_id = auth.uid())
  );

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_team_members_agency_id ON public.team_members(agency_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_role ON public.team_members(role);
CREATE INDEX idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX idx_team_invitations_email ON public.team_invitations(email);

-- ============================================
-- TRIGGER FOR updated_at
-- ============================================
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Create owner record when agency is created
-- ============================================
CREATE OR REPLACE FUNCTION create_agency_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_members (agency_id, user_id, role, email, status, joined_at)
  VALUES (
    NEW.id,
    NEW.user_id,
    'owner',
    COALESCE(NEW.email, ''),
    'active',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_agency_created
  AFTER INSERT ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION create_agency_owner();
COMMIT;
