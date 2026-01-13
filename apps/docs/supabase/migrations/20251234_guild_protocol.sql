-- =============================================
-- AGENCY GUILD PROTOCOL
-- Blue Ocean Strategy: Uncopiable Network Effect
-- Created: 2024-12-31
-- =============================================

-- ===================
-- GUILD MEMBERS (Constitution)
-- ===================
CREATE TABLE IF NOT EXISTS guild_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL UNIQUE,
    agency_name TEXT NOT NULL,
    tier TEXT DEFAULT 'larvae' CHECK (tier IN ('larvae', 'worker', 'queen')),
    trust_score INT DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
    contributions_count INT DEFAULT 0,
    referrals_count INT DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'expelled')),
    specialties TEXT[] DEFAULT '{}',
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guild_members_tier ON guild_members(tier);
CREATE INDEX IF NOT EXISTS idx_guild_members_status ON guild_members(status);
CREATE INDEX IF NOT EXISTS idx_guild_members_trust ON guild_members(trust_score DESC);

COMMENT ON TABLE guild_members IS 'Guild members with tier system and trust scores';

-- ===================
-- CLIENT DNA PASSPORT
-- ===================
CREATE TABLE IF NOT EXISTS client_dna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    company_domain TEXT,
    industry TEXT,
    
    -- Payment DNA
    payment_score INT DEFAULT 50 CHECK (payment_score >= 0 AND payment_score <= 100),
    avg_payment_days INT,
    payment_disputes_count INT DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    
    -- Project DNA
    scope_creep_risk FLOAT DEFAULT 0.5 CHECK (scope_creep_risk >= 0 AND scope_creep_risk <= 1),
    avg_revision_requests FLOAT,
    projects_count INT DEFAULT 0,
    
    -- Relationship DNA
    agencies_worked_with INT DEFAULT 0,
    repeat_rate FLOAT DEFAULT 0,
    referrals_given INT DEFAULT 0,
    
    -- Status
    blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    blacklisted_at TIMESTAMPTZ,
    
    -- Meta
    verified_by_count INT DEFAULT 0,
    first_reported_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_client_company UNIQUE (company_name, company_domain)
);

CREATE INDEX IF NOT EXISTS idx_client_dna_company ON client_dna(company_name);
CREATE INDEX IF NOT EXISTS idx_client_dna_blacklist ON client_dna(blacklisted) WHERE blacklisted = TRUE;
CREATE INDEX IF NOT EXISTS idx_client_dna_payment ON client_dna(payment_score);

COMMENT ON TABLE client_dna IS 'Collective intelligence on client behavior patterns';

-- ===================
-- CLIENT REPORTS (Contributions)
-- ===================
CREATE TABLE IF NOT EXISTS client_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES client_dna(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES guild_members(id) ON DELETE SET NULL,
    
    report_type TEXT NOT NULL CHECK (report_type IN ('payment', 'scope', 'communication', 'warning', 'positive')),
    
    -- Report Data
    data JSONB DEFAULT '{}',
    payment_days INT,
    project_value DECIMAL(15,2),
    scope_creep_occurred BOOLEAN,
    revision_requests INT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    
    -- Verification
    verified_by_count INT DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_reports_client ON client_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_client_reports_reporter ON client_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_client_reports_type ON client_reports(report_type);

COMMENT ON TABLE client_reports IS 'Individual agency reports on client experiences';

-- ===================
-- REPORT VERIFICATIONS
-- ===================
CREATE TABLE IF NOT EXISTS report_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES client_reports(id) ON DELETE CASCADE,
    verifier_id UUID REFERENCES guild_members(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_id, verifier_id)
);

-- ===================
-- PRICING BENCHMARKS
-- ===================
CREATE TABLE IF NOT EXISTS pricing_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type TEXT NOT NULL UNIQUE,
    
    -- Rate Statistics
    floor_rate DECIMAL(12,2),
    median_rate DECIMAL(12,2),
    top_rate DECIMAL(12,2),
    avg_rate DECIMAL(12,2),
    
    -- Meta
    sample_size INT DEFAULT 0,
    last_30_days_trend FLOAT, -- percentage change
    last_calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_service ON pricing_benchmarks(service_type);

COMMENT ON TABLE pricing_benchmarks IS 'Collective pricing intelligence by service type';

-- ===================
-- PROJECT SUBMISSIONS (For Benchmarks)
-- ===================
CREATE TABLE IF NOT EXISTS project_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_member_id UUID REFERENCES guild_members(id) ON DELETE SET NULL,
    
    service_type TEXT NOT NULL,
    project_value DECIMAL(12,2) NOT NULL,
    hourly_rate DECIMAL(8,2),
    hours_estimated INT,
    
    client_industry TEXT,
    project_complexity TEXT CHECK (project_complexity IN ('simple', 'medium', 'complex', 'enterprise')),
    
    won BOOLEAN,
    actual_hours INT,
    scope_changed BOOLEAN DEFAULT FALSE,
    
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_service ON project_submissions(service_type);
CREATE INDEX IF NOT EXISTS idx_project_member ON project_submissions(guild_member_id);

COMMENT ON TABLE project_submissions IS 'Anonymous project data for market benchmarks';

-- ===================
-- DEFENSE CASES
-- ===================
CREATE TABLE IF NOT EXISTS defense_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES guild_members(id) ON DELETE SET NULL,
    client_id UUID REFERENCES client_dna(id) ON DELETE SET NULL,
    
    case_type TEXT NOT NULL CHECK (case_type IN ('non_payment', 'fraud', 'scope_dispute', 'contract_breach', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    amount_disputed DECIMAL(12,2),
    evidence_urls TEXT[],
    
    -- Voting
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'voting', 'approved', 'rejected', 'resolved')),
    votes_for INT DEFAULT 0,
    votes_against INT DEFAULT 0,
    votes_required INT DEFAULT 5,
    
    -- Resolution
    action_taken TEXT,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    voting_ends_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_defense_status ON defense_cases(status);
CREATE INDEX IF NOT EXISTS idx_defense_client ON defense_cases(client_id);

COMMENT ON TABLE defense_cases IS 'Collective defense cases against problematic clients';

-- ===================
-- GUILD VOTES
-- ===================
CREATE TABLE IF NOT EXISTS guild_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES defense_cases(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES guild_members(id) ON DELETE SET NULL,
    
    vote BOOLEAN NOT NULL, -- true = for, false = against
    reason TEXT,
    
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(case_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_case ON guild_votes(case_id);

-- ===================
-- CROSS-REFERRALS
-- ===================
CREATE TABLE IF NOT EXISTS guild_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES guild_members(id) ON DELETE SET NULL,
    referred_id UUID REFERENCES guild_members(id) ON DELETE SET NULL,
    
    client_name TEXT,
    project_type TEXT,
    project_value DECIMAL(12,2),
    referral_fee_percent DECIMAL(5,2) DEFAULT 20,
    referral_fee_amount DECIMAL(10,2),
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON guild_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON guild_referrals(referred_id);

COMMENT ON TABLE guild_referrals IS 'Cross-pollination referrals between guild members';

-- ===================
-- FUNCTIONS
-- ===================

-- Calculate trust score for a member
CREATE OR REPLACE FUNCTION calculate_trust_score(p_member_id UUID)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_base_score INT := 50;
    v_contribution_bonus INT;
    v_referral_bonus INT;
    v_time_bonus INT;
    v_verification_bonus INT;
    v_final_score INT;
BEGIN
    -- Contribution bonus: +2 per verified report (max 20)
    SELECT LEAST(COUNT(*) * 2, 20) INTO v_contribution_bonus
    FROM client_reports cr
    WHERE cr.reporter_id = p_member_id AND cr.verified = TRUE;
    
    -- Referral bonus: +5 per completed referral (max 25)
    SELECT LEAST(COUNT(*) * 5, 25) INTO v_referral_bonus
    FROM guild_referrals gr
    WHERE gr.referrer_id = p_member_id AND gr.status = 'completed';
    
    -- Time bonus: +1 per month (max 12)
    SELECT LEAST(
        EXTRACT(MONTH FROM AGE(NOW(), gm.joined_at))::INT,
        12
    ) INTO v_time_bonus
    FROM guild_members gm
    WHERE gm.id = p_member_id;
    
    -- Verification bonus: +1 per verification given (max 10)
    SELECT LEAST(COUNT(*), 10) INTO v_verification_bonus
    FROM report_verifications rv
    WHERE rv.verifier_id = p_member_id;
    
    v_final_score := v_base_score + COALESCE(v_contribution_bonus, 0) 
                     + COALESCE(v_referral_bonus, 0) 
                     + COALESCE(v_time_bonus, 0)
                     + COALESCE(v_verification_bonus, 0);
    
    -- Cap at 100
    RETURN LEAST(v_final_score, 100);
END;
$$;

-- Update member tier based on trust score
CREATE OR REPLACE FUNCTION update_member_tier(p_member_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_trust_score INT;
    v_new_tier TEXT;
BEGIN
    SELECT calculate_trust_score(p_member_id) INTO v_trust_score;
    
    IF v_trust_score >= 85 THEN
        v_new_tier := 'queen';
    ELSIF v_trust_score >= 50 THEN
        v_new_tier := 'worker';
    ELSE
        v_new_tier := 'larvae';
    END IF;
    
    UPDATE guild_members
    SET tier = v_new_tier, trust_score = v_trust_score, updated_at = NOW()
    WHERE id = p_member_id;
    
    RETURN v_new_tier;
END;
$$;

-- Recalculate pricing benchmarks for a service type
CREATE OR REPLACE FUNCTION recalculate_pricing_benchmark(p_service_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_floor DECIMAL;
    v_median DECIMAL;
    v_top DECIMAL;
    v_avg DECIMAL;
    v_count INT;
BEGIN
    SELECT 
        PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY project_value),
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY project_value),
        PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY project_value),
        AVG(project_value),
        COUNT(*)
    INTO v_floor, v_median, v_top, v_avg, v_count
    FROM project_submissions
    WHERE service_type = p_service_type
      AND submitted_at > NOW() - INTERVAL '90 days';
    
    INSERT INTO pricing_benchmarks (service_type, floor_rate, median_rate, top_rate, avg_rate, sample_size, last_calculated_at)
    VALUES (p_service_type, v_floor, v_median, v_top, v_avg, v_count, NOW())
    ON CONFLICT (service_type) 
    DO UPDATE SET
        floor_rate = v_floor,
        median_rate = v_median,
        top_rate = v_top,
        avg_rate = v_avg,
        sample_size = v_count,
        last_calculated_at = NOW();
END;
$$;

-- Process defense case votes
CREATE OR REPLACE FUNCTION process_defense_vote(p_case_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_case defense_cases%ROWTYPE;
    v_action TEXT;
BEGIN
    SELECT * INTO v_case FROM defense_cases WHERE id = p_case_id;
    
    IF v_case.votes_for >= v_case.votes_required THEN
        -- Approved: Blacklist client
        UPDATE client_dna
        SET blacklisted = TRUE, 
            blacklist_reason = v_case.case_type,
            blacklisted_at = NOW()
        WHERE id = v_case.client_id;
        
        UPDATE defense_cases
        SET status = 'approved', action_taken = 'Client blacklisted', resolved_at = NOW()
        WHERE id = p_case_id;
        
        v_action := 'approved';
    ELSIF v_case.votes_against >= v_case.votes_required THEN
        -- Rejected
        UPDATE defense_cases
        SET status = 'rejected', resolved_at = NOW()
        WHERE id = p_case_id;
        
        v_action := 'rejected';
    ELSE
        v_action := 'pending';
    END IF;
    
    RETURN v_action;
END;
$$;

-- ===================
-- ROW LEVEL SECURITY
-- ===================
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_dna ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE defense_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_votes ENABLE ROW LEVEL SECURITY;

-- Guild members: read all, write own
CREATE POLICY "Guild members readable by all authenticated"
    ON guild_members FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Guild members writable by service role"
    ON guild_members FOR ALL
    USING (auth.role() = 'service_role');

-- Client DNA: readable by active guild members
CREATE POLICY "Client DNA readable by guild"
    ON client_dna FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Client DNA writable by service role"
    ON client_dna FOR ALL
    USING (auth.role() = 'service_role');

-- Reports: read all, create own
CREATE POLICY "Reports readable by guild"
    ON client_reports FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Reports writable by service role"
    ON client_reports FOR ALL
    USING (auth.role() = 'service_role');

-- Defense cases: readable by all, writable by service
CREATE POLICY "Defense cases readable by guild"
    ON defense_cases FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Defense cases writable by service role"
    ON defense_cases FOR ALL
    USING (auth.role() = 'service_role');

-- Votes: readable by all, writable by service
CREATE POLICY "Votes readable by guild"
    ON guild_votes FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Votes writable by service role"
    ON guild_votes FOR ALL
    USING (auth.role() = 'service_role');

-- ===================
-- SEED DATA: Initial Service Types
-- ===================
INSERT INTO pricing_benchmarks (service_type, floor_rate, median_rate, top_rate, sample_size)
VALUES 
    ('landing_page', 2500, 4200, 8500, 0),
    ('website_design', 5000, 12000, 35000, 0),
    ('web_app', 15000, 45000, 150000, 0),
    ('mobile_app', 20000, 60000, 200000, 0),
    ('seo_monthly', 1500, 3500, 8000, 0),
    ('social_media_management', 1000, 2500, 6000, 0),
    ('branding', 3000, 8000, 25000, 0),
    ('video_production', 2000, 5000, 15000, 0),
    ('content_marketing', 2000, 4000, 10000, 0),
    ('ppc_management', 1500, 3000, 8000, 0)
ON CONFLICT (service_type) DO NOTHING;

COMMENT ON TABLE pricing_benchmarks IS 'Seeded with industry baseline rates - will be updated by collective data';
