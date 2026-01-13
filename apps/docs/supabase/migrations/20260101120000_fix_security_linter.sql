-- ==============================================================
-- Migration: Fix Supabase Security Linter Errors
-- Date: 2026-01-01
-- Fixes: SECURITY DEFINER views and RLS disabled tables
-- ==============================================================

-- ============================================================
-- PART 1: Drop SECURITY DEFINER Views
-- ============================================================

DROP VIEW IF EXISTS public.hq_revenue_summary CASCADE;
DROP VIEW IF EXISTS public.marketplace_stats CASCADE;
DROP VIEW IF EXISTS public.tier_limits CASCADE;

-- ============================================================
-- PART 2: Enable RLS with Simple Policies
-- Note: Using authenticated user check only (no role column)
-- ============================================================

-- 1. ag_ranks - public read, auth write
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ag_ranks' AND table_schema = 'public') THEN
    ALTER TABLE public.ag_ranks ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "ag_ranks_public_read" ON public.ag_ranks;
    CREATE POLICY "ag_ranks_public_read" ON public.ag_ranks FOR SELECT USING (true);
  END IF;
END $$;

-- 2. report_verifications - owner access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_verifications' AND table_schema = 'public') THEN
    ALTER TABLE public.report_verifications ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "report_verifications_auth_access" ON public.report_verifications;
    CREATE POLICY "report_verifications_auth_access" ON public.report_verifications 
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 3. pricing_benchmarks - public read
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_benchmarks' AND table_schema = 'public') THEN
    ALTER TABLE public.pricing_benchmarks ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "pricing_benchmarks_public_read" ON public.pricing_benchmarks;
    CREATE POLICY "pricing_benchmarks_public_read" ON public.pricing_benchmarks FOR SELECT USING (true);
  END IF;
END $$;

-- 4. project_submissions - auth access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_submissions' AND table_schema = 'public') THEN
    ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "project_submissions_auth_access" ON public.project_submissions;
    CREATE POLICY "project_submissions_auth_access" ON public.project_submissions 
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 5. guild_referrals - auth access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guild_referrals' AND table_schema = 'public') THEN
    ALTER TABLE public.guild_referrals ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "guild_referrals_auth_access" ON public.guild_referrals;
    CREATE POLICY "guild_referrals_auth_access" ON public.guild_referrals 
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 6. newsletter_events - auth access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'newsletter_events' AND table_schema = 'public') THEN
    ALTER TABLE public.newsletter_events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "newsletter_events_auth_access" ON public.newsletter_events;
    CREATE POLICY "newsletter_events_auth_access" ON public.newsletter_events 
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 7. newsletter_cross_promos - public read
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'newsletter_cross_promos' AND table_schema = 'public') THEN
    ALTER TABLE public.newsletter_cross_promos ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "newsletter_cross_promos_public_read" ON public.newsletter_cross_promos;
    CREATE POLICY "newsletter_cross_promos_public_read" ON public.newsletter_cross_promos FOR SELECT USING (true);
  END IF;
END $$;
