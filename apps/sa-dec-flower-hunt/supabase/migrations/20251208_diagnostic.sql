-- ============================================
-- DIAGNOSTIC: Check Instance ID and Auth Config
-- ============================================
-- Run this to find the CORRECT instance_id

-- 1. Find actual instance_id from existing healthy users (if any)
SELECT DISTINCT instance_id, count(*) as user_count
FROM auth.users 
GROUP BY instance_id;

-- 2. Check auth.users schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Check our demo users specifically
SELECT id, email, instance_id, aud, role, confirmed_at, email_confirmed_at, created_at
FROM auth.users 
WHERE email LIKE '%demo.com%';

-- 4. Check if auth.uid() function exists
SELECT proname, pronamespace::regnamespace as schema
FROM pg_proc 
WHERE proname = 'uid';
