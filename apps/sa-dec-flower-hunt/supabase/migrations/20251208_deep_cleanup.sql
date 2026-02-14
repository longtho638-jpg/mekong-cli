-- ============================================
-- DEEP CLEANUP: Remove ALL Demo User Traces
-- ============================================
-- This removes demo users from ALL auth-related tables

BEGIN;

-- 1. Delete from auth.identities (CRITICAL!)
DELETE FROM auth.identities 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%demo.com'
);

-- 2. Delete from auth.sessions (if any)
DELETE FROM auth.sessions 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%demo.com'
);

-- 3. Delete from auth.refresh_tokens (if any)
DELETE FROM auth.refresh_tokens 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%demo.com'
);

-- 4. Delete from public.profiles
DELETE FROM public.profiles 
WHERE id IN (
    SELECT id FROM auth.users WHERE email LIKE '%demo.com'
);

-- 5. Finally delete from auth.users
DELETE FROM auth.users 
WHERE email LIKE '%demo.com';

COMMIT;

-- Verify
SELECT 'Cleanup Complete!' as status;
SELECT count(*) as remaining FROM auth.users WHERE email LIKE '%demo.com';
