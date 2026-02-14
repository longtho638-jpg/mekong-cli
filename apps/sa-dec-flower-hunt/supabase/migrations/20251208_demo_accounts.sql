-- DATA ACTIVATION: DEMO ACCOUNTS (Deep Check Fixed)
-- Run this in Supabase SQL Editor to activate the missing demo accounts.

-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Insert/Update Demo Users (Admin, Farmer, Customer)
-- Password: '123456'
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, is_super_admin, aud)
VALUES 
    -- Admin (Level 5)
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', '00000000-0000-0000-0000-000000000000', 'admin@demo.com', crypt('123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Executive Admin"}', NOW(), NOW(), 'authenticated', false, 'authenticated'),
    
    -- Farmer (Demo)
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', '00000000-0000-0000-0000-000000000000', 'farmer@demo.com', crypt('123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nông Dân Demo"}', NOW(), NOW(), 'authenticated', false, 'authenticated'),
    
    -- Customer (Demo)
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', '00000000-0000-0000-0000-000000000000', 'customer@demo.com', crypt('123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Khách Hàng Demo"}', NOW(), NOW(), 'authenticated', false, 'authenticated')
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

-- 3. Insert/Update Profiles
INSERT INTO public.profiles (id, role, full_name, address, avatar_url)
VALUES
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'admin', 'Executive Admin', 'HQ Agri-OS, Sa Đéc', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'farmer', 'Nông Dân Demo', 'Vườn Mẫu, Sa Đéc', 'https://api.dicebear.com/7.x/avataaars/svg?seed=farmer'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'customer', 'Khách Hàng Demo', 'TP. Hồ Chí Minh', 'https://api.dicebear.com/7.x/avataaars/svg?seed=customer')
ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

-- 4. Grant Admin Permissions (Example)
-- If there's a specific admin table, insert here. For now, profile.role = 'admin' is enough.

-- 5. Verification
SELECT id, email, role FROM auth.users WHERE email IN ('admin@demo.com', 'farmer@demo.com', 'customer@demo.com');
