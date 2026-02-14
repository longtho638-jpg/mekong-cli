-- ============================================
-- CLEANUP: Delete Manually Created Demo Users
-- ============================================
-- Run this BEFORE creating users via Supabase Dashboard

BEGIN;

-- Delete profiles first (foreign key)
DELETE FROM public.profiles 
WHERE id IN (
    SELECT id FROM auth.users WHERE email IN (
        'admin@demo.com', 'farmer@demo.com', 'customer@demo.com'
    )
);

-- Delete auth users
DELETE FROM auth.users 
WHERE email IN ('admin@demo.com', 'farmer@demo.com', 'customer@demo.com');

COMMIT;

-- Verify deletion
SELECT 'Deleted!' as status;
SELECT count(*) as remaining_demo_users 
FROM auth.users 
WHERE email LIKE '%demo.com';
