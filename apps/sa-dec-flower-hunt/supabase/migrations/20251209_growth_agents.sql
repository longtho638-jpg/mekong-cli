-- Growth Agent System Database Schema
-- Migration: 20251209_growth_agents.sql

-- Table: content_queue - Nội dung chờ đăng
CREATE TABLE IF NOT EXISTS content_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'tiktok', 'facebook', 'blog', 'email'
    title VARCHAR(255),
    content TEXT NOT NULL,
    hashtags TEXT[], -- Array of hashtags
    media_urls TEXT[], -- URLs to images/videos
    target_audience VARCHAR(100), -- 'buyer', 'farmer', 'general'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'posted', 'failed'
    scheduled_at TIMESTAMPTZ,
    posted_at TIMESTAMPTZ,
    platform_post_id VARCHAR(255), -- ID from TikTok/FB after posting
    engagement_stats JSONB, -- {likes, shares, comments, views}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: referral_codes - Mã giới thiệu
CREATE TABLE IF NOT EXISTS referral_codes (
    code VARCHAR(10) PRIMARY KEY,
    user_id UUID,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    uses_count INT DEFAULT 0,
    credits_earned INT DEFAULT 0, -- VND
    max_uses INT DEFAULT 100,
    discount_amount INT DEFAULT 50000, -- 50k VND
    reward_amount INT DEFAULT 50000, -- 50k per referral
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: referral_uses - Lịch sử sử dụng mã
CREATE TABLE IF NOT EXISTS referral_uses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_code VARCHAR(10) REFERENCES referral_codes(code),
    referred_user_id UUID,
    referred_email VARCHAR(255),
    order_id UUID,
    discount_applied INT, -- VND
    reward_given INT, -- VND
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: email_sequences - Chuỗi email nurture
CREATE TABLE IF NOT EXISTS email_sequences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID, -- Reference to leads table (no FK constraint for flexibility)
    lead_email VARCHAR(255), -- Store email directly for convenience
    lead_name VARCHAR(255),
    sequence_name VARCHAR(50) NOT NULL, -- 'welcome', 'tet_promo', 'abandoned_cart'
    current_step INT DEFAULT 0,
    total_steps INT DEFAULT 5,
    next_send_at TIMESTAMPTZ,
    last_sent_at TIMESTAMPTZ,
    completed BOOLEAN DEFAULT FALSE,
    paused BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: growth_metrics - Theo dõi metrics hàng ngày
CREATE TABLE IF NOT EXISTS growth_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    visitors INT DEFAULT 0,
    leads_captured INT DEFAULT 0,
    orders_count INT DEFAULT 0,
    orders_value INT DEFAULT 0, -- VND
    referral_signups INT DEFAULT 0,
    referral_orders INT DEFAULT 0,
    content_posted INT DEFAULT 0,
    emails_sent INT DEFAULT 0,
    email_opens INT DEFAULT 0,
    email_clicks INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: agent_runs - Log agent executions
CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_name VARCHAR(50) NOT NULL, -- 'content', 'nurture', 'viral', 'seo', 'orchestrator'
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    output JSONB, -- Agent output/results
    error TEXT,
    items_processed INT DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_queue_status ON content_queue(status);
CREATE INDEX IF NOT EXISTS idx_content_queue_scheduled ON content_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_sequences_next_send ON email_sequences(next_send_at) WHERE NOT completed;
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON referral_codes(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_growth_metrics_date ON growth_metrics(date DESC);

-- RLS Policies
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

-- Public read for some tables
CREATE POLICY "Public can view referral codes" ON referral_codes
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Service role full access" ON content_queue
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access referrals" ON referral_codes
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access referral_uses" ON referral_uses
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access email_sequences" ON email_sequences
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access growth_metrics" ON growth_metrics
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access agent_runs" ON agent_runs
    FOR ALL USING (auth.role() = 'service_role');

-- Insert today's metrics row
INSERT INTO growth_metrics (date)
VALUES (CURRENT_DATE)
ON CONFLICT (date) DO NOTHING;
