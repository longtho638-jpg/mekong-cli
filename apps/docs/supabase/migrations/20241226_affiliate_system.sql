-- =====================================================
-- AFFILIATE SYSTEM FOR AGENCYOS
-- Version: 2.0 (Refactored)
-- Created: 2024-12-26
-- Description: Complete affiliate tracking, commissions, and achievements
-- =====================================================

-- ===================
-- TABLE: affiliates
-- Core affiliate accounts
-- ===================
CREATE TABLE IF NOT EXISTS affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Profile
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    referral_code TEXT UNIQUE NOT NULL,
    
    -- Payment settings
    payment_method TEXT DEFAULT 'paypal',
    payment_email TEXT,
    
    -- Stats (denormalized for performance)
    total_clicks INTEGER DEFAULT 0 NOT NULL,
    total_conversions INTEGER DEFAULT 0 NOT NULL,
    total_earnings DECIMAL(10,2) DEFAULT 0 NOT NULL,
    pending_payout DECIMAL(10,2) DEFAULT 0 NOT NULL,
    lifetime_earnings DECIMAL(10,2) DEFAULT 0 NOT NULL,
    
    -- Gamification
    badge TEXT DEFAULT 'new' NOT NULL,
    rank INTEGER,
    
    -- Meta
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('paypal', 'wise', 'bank', 'crypto')),
    CONSTRAINT valid_badge CHECK (badge IN ('new', 'first_blood', 'rising_star', 'diamond', 'king')),
    CONSTRAINT positive_stats CHECK (total_clicks >= 0 AND total_conversions >= 0 AND total_earnings >= 0)
);

-- Documentation
COMMENT ON TABLE affiliates IS 'Core affiliate accounts with stats and payment info';
COMMENT ON COLUMN affiliates.referral_code IS 'Unique 8-char code for tracking (e.g., ALEX2024)';
COMMENT ON COLUMN affiliates.badge IS 'Achievement tier: new → first_blood → rising_star → diamond → king';

-- ===================
-- TABLE: affiliate_clicks
-- Click tracking with UTM
-- ===================
CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    
    -- UTM tracking
    source TEXT,
    medium TEXT,
    campaign TEXT,
    
    -- Context
    landing_page TEXT,
    ip_hash TEXT,       -- Hashed for privacy
    user_agent TEXT,
    country TEXT,
    device TEXT,
    browser TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints  
    CONSTRAINT valid_device CHECK (device IS NULL OR device IN ('desktop', 'mobile', 'tablet'))
);

COMMENT ON TABLE affiliate_clicks IS 'All clicks on affiliate links with UTM and device info';

-- ===================
-- TABLE: affiliate_conversions
-- Successful referrals
-- ===================
CREATE TABLE IF NOT EXISTS affiliate_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    click_id UUID REFERENCES affiliate_clicks(id) ON DELETE SET NULL,
    
    -- Order info
    order_id TEXT NOT NULL UNIQUE,
    product_name TEXT NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    
    -- Commission
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    is_recurring BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Status workflow
    status TEXT DEFAULT 'pending' NOT NULL,
    customer_email TEXT,
    lemon_squeezy_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'paid', 'refunded')),
    CONSTRAINT valid_commission CHECK (commission_rate > 0 AND commission_rate <= 1),
    CONSTRAINT valid_prices CHECK (product_price >= 0 AND commission_amount >= 0)
);

COMMENT ON TABLE affiliate_conversions IS 'Successful referral conversions with commission tracking';

-- ===================
-- TABLE: affiliate_payouts
-- Payout history
-- ===================
CREATE TABLE IF NOT EXISTS affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    
    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    
    -- Payment
    method TEXT NOT NULL,
    payment_email TEXT,
    transaction_id TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' NOT NULL,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_payout_method CHECK (method IN ('paypal', 'wise', 'bank', 'crypto')),
    CONSTRAINT valid_payout_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT min_payout CHECK (amount >= 50)  -- $50 minimum
);

COMMENT ON TABLE affiliate_payouts IS 'Payout requests and history ($50 minimum)';

-- ===================
-- TABLE: affiliate_achievements
-- Earned badges with bonuses
-- ===================
CREATE TABLE IF NOT EXISTS affiliate_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL,
    bonus_amount DECIMAL(10,2) NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- One achievement per type per affiliate
    CONSTRAINT unique_achievement UNIQUE(affiliate_id, achievement_type),
    CONSTRAINT valid_achievement CHECK (achievement_type IN ('first_blood', 'rising_star', 'diamond', 'king'))
);

COMMENT ON TABLE affiliate_achievements IS 'Achievement badges with cash bonuses';

-- ===================
-- TABLE: affiliate_monthly_stats
-- Aggregated for leaderboard
-- ===================
CREATE TABLE IF NOT EXISTS affiliate_monthly_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    
    -- Stats
    clicks INTEGER DEFAULT 0 NOT NULL,
    conversions INTEGER DEFAULT 0 NOT NULL,
    earnings DECIMAL(10,2) DEFAULT 0 NOT NULL,
    rank INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT unique_month_stats UNIQUE(affiliate_id, month)
);

COMMENT ON TABLE affiliate_monthly_stats IS 'Monthly aggregated stats for leaderboard display';

-- =====================================================
-- INDEXES (Optimized for common queries)
-- =====================================================

-- Affiliates: lookup by code and email
CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON affiliates(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON affiliates(email);
CREATE INDEX IF NOT EXISTS idx_affiliates_active ON affiliates(is_active) WHERE is_active = TRUE;

-- Clicks: analytics queries
CREATE INDEX IF NOT EXISTS idx_clicks_affiliate ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_clicks_referral ON affiliate_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_clicks_created ON affiliate_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_country ON affiliate_clicks(country) WHERE country IS NOT NULL;

-- Conversions: status-based queries
CREATE INDEX IF NOT EXISTS idx_conversions_affiliate ON affiliate_conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON affiliate_conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_pending ON affiliate_conversions(affiliate_id, status) WHERE status = 'pending';

-- Payouts: status tracking
CREATE INDEX IF NOT EXISTS idx_payouts_affiliate ON affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_payouts_pending ON affiliate_payouts(status) WHERE status IN ('pending', 'processing');

-- Monthly stats: leaderboard
CREATE INDEX IF NOT EXISTS idx_monthly_month ON affiliate_monthly_stats(month DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_rank ON affiliate_monthly_stats(month, rank) WHERE rank IS NOT NULL;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Generate unique referral code (8 chars)
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8 uppercase alphanumeric chars
        v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
        
        -- Check uniqueness
        SELECT EXISTS(SELECT 1 FROM affiliates WHERE referral_code = v_code) INTO v_exists;
        
        IF NOT v_exists THEN
            RETURN v_code;
        END IF;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION generate_referral_code IS 'Generates unique 8-char referral code';

-- Update affiliate stats after new conversion (TRIGGER)
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE affiliates
        SET 
            total_conversions = total_conversions + 1,
            total_earnings = total_earnings + NEW.commission_amount,
            pending_payout = pending_payout + NEW.commission_amount,
            updated_at = NOW()
        WHERE id = NEW.affiliate_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'refunded' AND OLD.status != 'refunded' THEN
        -- Handle refunds
        UPDATE affiliates
        SET 
            total_conversions = GREATEST(0, total_conversions - 1),
            total_earnings = GREATEST(0, total_earnings - OLD.commission_amount),
            pending_payout = GREATEST(0, pending_payout - OLD.commission_amount),
            updated_at = NOW()
        WHERE id = NEW.affiliate_id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_affiliate_stats ON affiliate_conversions;
CREATE TRIGGER trigger_update_affiliate_stats
    AFTER INSERT OR UPDATE ON affiliate_conversions
    FOR EACH ROW
    EXECUTE FUNCTION update_affiliate_stats();

-- Check and award achievements (TRIGGER)
CREATE OR REPLACE FUNCTION check_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conv_count INTEGER;
    v_aff_id UUID;
BEGIN
    v_aff_id := NEW.affiliate_id;
    SELECT total_conversions INTO v_conv_count FROM affiliates WHERE id = v_aff_id;
    
    -- First Blood: 1 sale → $25 bonus
    IF v_conv_count >= 1 THEN
        INSERT INTO affiliate_achievements (affiliate_id, achievement_type, bonus_amount)
        VALUES (v_aff_id, 'first_blood', 25.00)
        ON CONFLICT (affiliate_id, achievement_type) DO NOTHING;
        
        UPDATE affiliates SET badge = 'first_blood' WHERE id = v_aff_id AND badge = 'new';
    END IF;
    
    -- Rising Star: 5 sales → $50 bonus
    IF v_conv_count >= 5 THEN
        INSERT INTO affiliate_achievements (affiliate_id, achievement_type, bonus_amount)
        VALUES (v_aff_id, 'rising_star', 50.00)
        ON CONFLICT (affiliate_id, achievement_type) DO NOTHING;
        
        UPDATE affiliates SET badge = 'rising_star' 
        WHERE id = v_aff_id AND badge IN ('new', 'first_blood');
    END IF;
    
    -- Diamond: 25 sales → $250 bonus
    IF v_conv_count >= 25 THEN
        INSERT INTO affiliate_achievements (affiliate_id, achievement_type, bonus_amount)
        VALUES (v_aff_id, 'diamond', 250.00)
        ON CONFLICT (affiliate_id, achievement_type) DO NOTHING;
        
        UPDATE affiliates SET badge = 'diamond' 
        WHERE id = v_aff_id AND badge IN ('new', 'first_blood', 'rising_star');
    END IF;
    
    -- King: 100 sales → $1000 bonus
    IF v_conv_count >= 100 THEN
        INSERT INTO affiliate_achievements (affiliate_id, achievement_type, bonus_amount)
        VALUES (v_aff_id, 'king', 1000.00)
        ON CONFLICT (affiliate_id, achievement_type) DO NOTHING;
        
        UPDATE affiliates SET badge = 'king' WHERE id = v_aff_id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_achievements ON affiliate_conversions;
CREATE TRIGGER trigger_check_achievements
    AFTER INSERT ON affiliate_conversions
    FOR EACH ROW
    EXECUTE FUNCTION check_achievements();

-- Get affiliate dashboard stats
CREATE OR REPLACE FUNCTION get_affiliate_dashboard(p_affiliate_id UUID)
RETURNS TABLE (
    total_clicks INTEGER,
    total_conversions INTEGER,
    total_earnings DECIMAL,
    pending_payout DECIMAL,
    badge TEXT,
    rank INTEGER,
    clicks_today INTEGER,
    conversions_this_month INTEGER,
    earnings_this_month DECIMAL
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        a.total_clicks,
        a.total_conversions,
        a.total_earnings,
        a.pending_payout,
        a.badge,
        a.rank,
        (SELECT COUNT(*)::INTEGER FROM affiliate_clicks WHERE affiliate_id = p_affiliate_id AND created_at >= CURRENT_DATE),
        (SELECT COUNT(*)::INTEGER FROM affiliate_conversions WHERE affiliate_id = p_affiliate_id AND created_at >= DATE_TRUNC('month', CURRENT_DATE)),
        (SELECT COALESCE(SUM(commission_amount), 0) FROM affiliate_conversions WHERE affiliate_id = p_affiliate_id AND created_at >= DATE_TRUNC('month', CURRENT_DATE))
    FROM affiliates a
    WHERE a.id = p_affiliate_id;
$$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_monthly_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies safely
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Affiliates can view own data" ON affiliates;
    DROP POLICY IF EXISTS "Affiliates can update own data" ON affiliates;
    DROP POLICY IF EXISTS "Affiliates can view own clicks" ON affiliate_clicks;
    DROP POLICY IF EXISTS "Affiliates can view own conversions" ON affiliate_conversions;
    DROP POLICY IF EXISTS "Affiliates can view own payouts" ON affiliate_payouts;
    DROP POLICY IF EXISTS "Affiliates can view own achievements" ON affiliate_achievements;
    DROP POLICY IF EXISTS "Anyone can view monthly stats for leaderboard" ON affiliate_monthly_stats;
    DROP POLICY IF EXISTS "Service role full access" ON affiliates;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Policies: Affiliates own data
CREATE POLICY "Affiliates can view own data" ON affiliates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Affiliates can update own data" ON affiliates
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role bypass for API access
CREATE POLICY "Service role full access" ON affiliates
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Affiliates can view own clicks" ON affiliate_clicks
    FOR SELECT USING (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    );

CREATE POLICY "Affiliates can view own conversions" ON affiliate_conversions
    FOR SELECT USING (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    );

CREATE POLICY "Affiliates can view own payouts" ON affiliate_payouts
    FOR SELECT USING (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    );

CREATE POLICY "Affiliates can view own achievements" ON affiliate_achievements
    FOR SELECT USING (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    );

-- Leaderboard is public (limited data)
CREATE POLICY "Anyone can view monthly stats for leaderboard" ON affiliate_monthly_stats
    FOR SELECT USING (TRUE);

-- =====================================================
-- COMPLETE
-- =====================================================
