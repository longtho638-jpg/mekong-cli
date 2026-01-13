-- =====================================================
-- FIX POLICIES
-- Version: 2.0 (Idempotent)
-- Description: Safe drop and recreate all affiliate RLS policies
-- Usage: Run if you get "policy already exists" errors
-- =====================================================

-- Use DO block for safe execution
DO $$ 
BEGIN
    RAISE NOTICE 'Starting policy cleanup...';
END $$;

-- ===================
-- CLEANUP: Drop existing policies
-- ===================

-- Affiliates table
DROP POLICY IF EXISTS "Affiliates can view own data" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can update own data" ON affiliates;
DROP POLICY IF EXISTS "Service role full access" ON affiliates;
DROP POLICY IF EXISTS "Service role access" ON affiliates;

-- Affiliate clicks
DROP POLICY IF EXISTS "Affiliates can view own clicks" ON affiliate_clicks;
DROP POLICY IF EXISTS "Service role full access" ON affiliate_clicks;

-- Affiliate conversions
DROP POLICY IF EXISTS "Affiliates can view own conversions" ON affiliate_conversions;
DROP POLICY IF EXISTS "Service role full access" ON affiliate_conversions;

-- Affiliate payouts
DROP POLICY IF EXISTS "Affiliates can view own payouts" ON affiliate_payouts;
DROP POLICY IF EXISTS "Service role full access" ON affiliate_payouts;

-- Affiliate achievements
DROP POLICY IF EXISTS "Affiliates can view own achievements" ON affiliate_achievements;
DROP POLICY IF EXISTS "Service role full access" ON affiliate_achievements;

-- Affiliate monthly stats
DROP POLICY IF EXISTS "Anyone can view monthly stats for leaderboard" ON affiliate_monthly_stats;
DROP POLICY IF EXISTS "Public leaderboard access" ON affiliate_monthly_stats;

-- ===================
-- RECREATE: Affiliate policies
-- ===================

-- Affiliates: Own data access
CREATE POLICY "Affiliates can view own data" ON affiliates
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Affiliates can update own data" ON affiliates
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role bypass for API/webhook access
CREATE POLICY "Service role full access" ON affiliates
    FOR ALL 
    USING (auth.role() = 'service_role');

-- Clicks: Own data only
CREATE POLICY "Affiliates can view own clicks" ON affiliate_clicks
    FOR SELECT 
    USING (
        affiliate_id IN (
            SELECT id FROM affiliates 
            WHERE user_id = auth.uid()
        )
    );

-- Conversions: Own data only
CREATE POLICY "Affiliates can view own conversions" ON affiliate_conversions
    FOR SELECT 
    USING (
        affiliate_id IN (
            SELECT id FROM affiliates 
            WHERE user_id = auth.uid()
        )
    );

-- Payouts: Own data only
CREATE POLICY "Affiliates can view own payouts" ON affiliate_payouts
    FOR SELECT 
    USING (
        affiliate_id IN (
            SELECT id FROM affiliates 
            WHERE user_id = auth.uid()
        )
    );

-- Achievements: Own data only
CREATE POLICY "Affiliates can view own achievements" ON affiliate_achievements
    FOR SELECT 
    USING (
        affiliate_id IN (
            SELECT id FROM affiliates 
            WHERE user_id = auth.uid()
        )
    );

-- Monthly stats: Public for leaderboard
CREATE POLICY "Anyone can view monthly stats for leaderboard" ON affiliate_monthly_stats
    FOR SELECT 
    USING (TRUE);

-- ===================
-- VERIFY: Check tables exist
-- ===================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'affiliate%';
    
    RAISE NOTICE 'Found % affiliate tables', v_count;
    
    IF v_count < 6 THEN
        RAISE WARNING 'Expected 6 affiliate tables, found %. Run main migration first.', v_count;
    END IF;
END $$;

-- ===================
-- VERIFY: Check policies created
-- ===================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename LIKE 'affiliate%'
ORDER BY tablename, policyname;
