-- ============================================
-- BYPASS FIX: Store Role in User Metadata
-- ============================================
-- This stores the role in raw_user_meta_data so we can skip profiles query

BEGIN;

-- Update demo users to include role in metadata
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

COMMIT;

-- Verification
SELECT email, raw_user_meta_data->>'role' as role_in_metadata 
FROM auth.users 
WHERE email IN ('admin@demo.com', 'farmer@demo.com', 'customer@demo.com');
