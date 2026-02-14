-- EMERGENCY FIX: RLS Policy for Profiles Table
-- This fixes the "Database error querying schema" login issue

BEGIN;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate policies (CRITICAL: Allow SELECT for everyone, including authenticated users)
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

COMMIT;

-- Verification
SELECT 'RLS Policies Fixed' as status;
SELECT id, email, role FROM auth.users WHERE email LIKE '%demo.com' LIMIT 3;
