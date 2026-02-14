-- =============================================
-- DEEP CLEANUP: Remove Demo Users
-- =============================================
-- Description: Safely removes all demo.com users from all auth tables
-- Usage: Run in Supabase SQL Editor when needing to reset demo accounts
-- Author: Agri-OS Team
-- Last Updated: 2025-12-08
-- =============================================

BEGIN;

-- Collect target user IDs into a temporary array
DO $$
DECLARE
    target_ids UUID[];
BEGIN
    -- Step 1: Get all demo user IDs
    SELECT array_agg(id) INTO target_ids 
    FROM auth.users 
    WHERE email LIKE '%demo.com';
    
    -- Exit early if no demo users found
    IF target_ids IS NULL OR array_length(target_ids, 1) = 0 THEN
        RAISE NOTICE 'No demo users found. Nothing to clean up.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found % demo user(s). Cleaning up...', array_length(target_ids, 1);
    
    -- Step 2: Delete from all related tables (order matters for FK constraints)
    DELETE FROM auth.identities     WHERE user_id = ANY(target_ids);
    DELETE FROM auth.sessions       WHERE user_id = ANY(target_ids);
    DELETE FROM auth.refresh_tokens WHERE user_id::uuid = ANY(target_ids);
    DELETE FROM public.profiles     WHERE id = ANY(target_ids);
    DELETE FROM auth.users          WHERE id = ANY(target_ids);
    
    RAISE NOTICE 'Cleanup complete!';
END $$;

COMMIT;

-- Verification Query
SELECT 
    'Cleanup Complete!' AS status,
    (SELECT count(*) FROM auth.users WHERE email LIKE '%demo.com') AS remaining_demo_users;
