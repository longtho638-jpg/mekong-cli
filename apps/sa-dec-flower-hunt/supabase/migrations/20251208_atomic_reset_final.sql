-- ============================================
-- ATOMIC RESET V2: DEMO ACCOUNTS (FIXED)
-- ============================================
-- Fixed: Removed 'confirmed_at' (generated column)
-- Run this in Supabase SQL Editor.

BEGIN;

-- 1. Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. CLEAN SLATE
DELETE FROM public.profiles WHERE id IN (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03'
);

DELETE FROM auth.users WHERE email IN (
    'admin@demo.com',
    'farmer@demo.com',
    'customer@demo.com'
);

-- 3. Get Instance ID
DO $$
DECLARE
    v_instance_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
    IF v_instance_id IS NULL THEN
        v_instance_id := '00000000-0000-0000-0000-000000000000';
    END IF;
    
    -- 4. INSERT Demo Users (WITHOUT confirmed_at - it's auto-generated)
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        role,
        aud
    ) VALUES 
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        v_instance_id,
        'admin@demo.com',
        crypt('123456', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Executive Admin"}',
        false,
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        v_instance_id,
        'farmer@demo.com',
        crypt('123456', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Nông Dân Demo"}',
        false,
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
        v_instance_id,
        'customer@demo.com',
        crypt('123456', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Khách Hàng Demo"}',
        false,
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    );
END $$;

-- 5. INSERT Profiles
INSERT INTO public.profiles (id, role, full_name, address, avatar_url)
VALUES
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'admin', 'Executive Admin', 'HQ Agri-OS', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'farmer', 'Nông Dân Demo', 'Vườn Mẫu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=farmer'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'customer', 'Khách Hàng Demo', 'TP.HCM', 'https://api.dicebear.com/7.x/avataaars/svg?seed=customer')
ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

-- 6. Reload schema
NOTIFY pgrst, 'reload config';

COMMIT;

-- 7. VERIFICATION
SELECT id, email, aud, role, confirmed_at, email_confirmed_at 
FROM auth.users 
WHERE email IN ('admin@demo.com', 'farmer@demo.com', 'customer@demo.com');
