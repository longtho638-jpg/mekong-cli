-- =============================================
-- AGENCY NEWSLETTER HUB
-- Multi-client newsletter management for agencies
-- Created: 2024-12-31
-- =============================================

-- ===================
-- NEWSLETTERS (Multi-brand)
-- ===================
CREATE TABLE IF NOT EXISTS newsletters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES guild_members(id) ON DELETE SET NULL,
    
    -- Newsletter Identity
    client_name TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    
    -- Sender Info
    from_email TEXT,
    from_name TEXT,
    reply_to TEXT,
    
    -- Settings
    frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
    timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
    
    -- Stats
    subscriber_count INT DEFAULT 0,
    issues_sent INT DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletters_agency ON newsletters(agency_id);
CREATE INDEX IF NOT EXISTS idx_newsletters_slug ON newsletters(slug);

COMMENT ON TABLE newsletters IS 'Multi-brand newsletters managed by agencies';

-- ===================
-- NEWSLETTER SUBSCRIBERS
-- ===================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
    
    email TEXT NOT NULL,
    name TEXT,
    
    -- Subscription Data
    source TEXT DEFAULT 'manual',  -- manual, import, form, guild_referral
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained')),
    
    -- Engagement
    opens_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    last_opened_at TIMESTAMPTZ,
    last_clicked_at TIMESTAMPTZ,
    
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,
    
    UNIQUE(newsletter_id, email)
);

CREATE INDEX IF NOT EXISTS idx_subscribers_newsletter ON newsletter_subscribers(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON newsletter_subscribers(status);

COMMENT ON TABLE newsletter_subscribers IS 'Subscribers for each newsletter';

-- ===================
-- NEWSLETTER ISSUES
-- ===================
CREATE TABLE IF NOT EXISTS newsletter_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
    
    -- Content
    subject TEXT NOT NULL,
    preview_text TEXT,
    content_markdown TEXT,
    content_html TEXT,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    
    -- Stats
    recipients_count INT DEFAULT 0,
    opens_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    unsubscribes_count INT DEFAULT 0,
    bounces_count INT DEFAULT 0,
    
    -- Open/Click Rates (calculated)
    open_rate FLOAT,
    click_rate FLOAT,
    
    -- AI Generation
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_topic TEXT,
    ai_tone TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issues_newsletter ON newsletter_issues(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON newsletter_issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_scheduled ON newsletter_issues(scheduled_at) WHERE status = 'scheduled';

COMMENT ON TABLE newsletter_issues IS 'Individual newsletter issues/editions';

-- ===================
-- NEWSLETTER ANALYTICS EVENTS
-- ===================
CREATE TABLE IF NOT EXISTS newsletter_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES newsletter_issues(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE SET NULL,
    
    event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'unsubscribed', 'bounced', 'complained')),
    
    -- Click data
    link_url TEXT,
    link_text TEXT,
    
    -- Metadata
    ip_address TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_issue ON newsletter_events(issue_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON newsletter_events(event_type);

-- ===================
-- GUILD CROSS-PROMO
-- ===================
CREATE TABLE IF NOT EXISTS newsletter_cross_promos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    from_newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
    to_newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
    
    promo_text TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'live', 'expired')),
    
    -- Performance
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    UNIQUE(from_newsletter_id, to_newsletter_id)
);

COMMENT ON TABLE newsletter_cross_promos IS 'Guild network cross-promotion between newsletters';

-- ===================
-- FUNCTIONS
-- ===================

-- Update subscriber count when subscribers change
CREATE OR REPLACE FUNCTION update_newsletter_subscriber_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE newsletters
        SET subscriber_count = (
            SELECT COUNT(*) FROM newsletter_subscribers 
            WHERE newsletter_id = NEW.newsletter_id AND status = 'active'
        ),
        updated_at = NOW()
        WHERE id = NEW.newsletter_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE newsletters
        SET subscriber_count = (
            SELECT COUNT(*) FROM newsletter_subscribers 
            WHERE newsletter_id = OLD.newsletter_id AND status = 'active'
        ),
        updated_at = NOW()
        WHERE id = OLD.newsletter_id;
        RETURN OLD;
    END IF;
END;
$$;

CREATE TRIGGER trigger_update_subscriber_count
AFTER INSERT OR UPDATE OR DELETE ON newsletter_subscribers
FOR EACH ROW EXECUTE FUNCTION update_newsletter_subscriber_count();

-- Calculate issue stats
CREATE OR REPLACE FUNCTION calculate_issue_stats(p_issue_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_opens INT;
    v_clicks INT;
    v_recipients INT;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE event_type = 'opened'),
        COUNT(*) FILTER (WHERE event_type = 'clicked'),
        COUNT(*) FILTER (WHERE event_type = 'sent')
    INTO v_opens, v_clicks, v_recipients
    FROM newsletter_events
    WHERE issue_id = p_issue_id;
    
    UPDATE newsletter_issues
    SET 
        opens_count = v_opens,
        clicks_count = v_clicks,
        recipients_count = v_recipients,
        open_rate = CASE WHEN v_recipients > 0 THEN v_opens::FLOAT / v_recipients ELSE 0 END,
        click_rate = CASE WHEN v_opens > 0 THEN v_clicks::FLOAT / v_opens ELSE 0 END,
        updated_at = NOW()
    WHERE id = p_issue_id;
END;
$$;

-- ===================
-- ROW LEVEL SECURITY
-- ===================
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_issues ENABLE ROW LEVEL SECURITY;

-- Service role access
CREATE POLICY "Newsletters service role"
    ON newsletters FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Subscribers service role"
    ON newsletter_subscribers FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Issues service role"
    ON newsletter_issues FOR ALL
    USING (auth.role() = 'service_role');

-- Read access for authenticated
CREATE POLICY "Newsletters read by authenticated"
    ON newsletters FOR SELECT
    USING (auth.role() = 'authenticated');
