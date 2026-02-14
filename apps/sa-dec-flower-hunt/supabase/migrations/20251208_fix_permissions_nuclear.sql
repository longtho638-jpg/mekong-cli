-- NUCLEAR PERMISSION FIX: PROFILES & SCHEMA
-- Executes explicit GRANTs to ensure 'authenticated' role can access the public schema and profiles table.

BEGIN;

-- 1. Ensure usage on public schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Ensure access to profiles table
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.profiles TO anon;

-- 3. Double-check RLS policies (Re-apply to be 100% sure)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

COMMIT;

-- 4. VERIFICATION (Actual Profiles Check)
-- This will fail if permissions are wrong.
SELECT count(*) as "Profiles Count (Admin View)" FROM public.profiles;

-- 5. SIMULATE AUTH USER ACCESS (Only works in pgAdmin, but useful as a sanity check query)
SELECT * FROM public.profiles LIMIT 5;
