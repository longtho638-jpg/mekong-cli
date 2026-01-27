-- Multi-Tenancy v2.1 DOWN

BEGIN;

-- Drop Trigger
DROP TRIGGER IF EXISTS on_agency_created ON public.agencies;
DROP FUNCTION IF EXISTS create_agency_owner;
DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;

-- Revert Policies (This is hard to do perfectly without knowing original state,
-- but we can try to restore the single-user policy if needed, or just drop the new ones)

-- Drop the new policies
DROP POLICY IF EXISTS "Team members can view agency" ON public.agencies;
DROP POLICY IF EXISTS "Team members can view clients" ON public.clients;
DROP POLICY IF EXISTS "Team members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Team members can view invoices" ON public.invoices;

-- Restore old policies (Best effort assumption based on standard RLS)
CREATE POLICY "Users can view own agency" ON public.agencies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own clients" ON public.clients FOR SELECT USING (agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid()));

-- Drop Tables
DROP TABLE IF EXISTS public.team_invitations;
DROP TABLE IF EXISTS public.team_members;

COMMIT;
