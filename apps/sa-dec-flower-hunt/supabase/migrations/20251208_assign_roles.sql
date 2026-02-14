-- =============================================
-- ASSIGN ROLES: Dashboard-Created Demo Users
-- =============================================
-- Run this AFTER creating users via Supabase Dashboard
-- This sets the role in user_metadata and creates profiles

BEGIN;

-- 1. Update user_metadata with roles
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data::jsonb, '{}'),
    '{role}',
    '"admin"'
)
WHERE email = 'admin@demo.com';

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data::jsonb, '{}'),
    '{role}',
    '"farmer"'
)
WHERE email = 'farmer@demo.com';

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data::jsonb, '{}'),
    '{role}',
    '"customer"'
)
WHERE email = 'customer@demo.com';

-- 2. Create/Update profiles with roles
INSERT INTO public.profiles (id, role, full_name)
SELECT id, 'admin', 'Admin Demo'
FROM auth.users WHERE email = 'admin@demo.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

INSERT INTO public.profiles (id, role, full_name)
SELECT id, 'farmer', 'Nông Dân Demo'
FROM auth.users WHERE email = 'farmer@demo.com'
ON CONFLICT (id) DO UPDATE SET role = 'farmer';

INSERT INTO public.profiles (id, role, full_name)
SELECT id, 'customer', 'Khách Hàng Demo'
FROM auth.users WHERE email = 'customer@demo.com'
ON CONFLICT (id) DO UPDATE SET role = 'customer';

COMMIT;

-- Verification
SELECT u.email, u.raw_user_meta_data->>'role' as metadata_role, p.role as profile_role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email LIKE '%demo.com'
ORDER BY u.email;
