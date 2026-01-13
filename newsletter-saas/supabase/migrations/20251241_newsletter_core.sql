-- =============================================
-- NEWSLETTER SAAS - CORE TABLES
-- Newsletters, Issues, Subscribers, Events
-- Created: 2025-01-14
-- =============================================

-- ===================
-- NEWSLETTERS
-- ===================
CREATE TABLE IF NOT EXISTS newsletters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Info
    name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    
    -- Sender Config
    from_email TEXT DEFAULT 'newsletter@mekongmail.com',
    from_name TEXT,
    reply_to TEXT,
    
    -- Settings
    frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
    timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
    
    -- Stats
    subscriber_count INT DEFAULT 0,
    total_issues INT DEFAULT 0,
    avg_open_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'draft')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletters_agency ON newsletters(agency_id);
CREATE INDEX IF NOT EXISTS idx_newsletters_slug ON newsletters(slug);
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);

-- ===================
-- NEWSLETTER ISSUES
-- ===================
CREATE TABLE IF NOT EXISTS newsletter_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
    
    -- Content
    subject TEXT NOT NULL,
    preview_text TEXT,
    html_content TEXT,
    json_content JSONB,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    
    -- Stats
    recipients_count INT DEFAULT 0,
    opens_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    bounces_count INT DEFAULT 0,
    unsubscribes_count INT DEFAULT 0,
    open_rate DECIMAL(5,4) DEFAULT 0,
    click_rate DECIMAL(5,4) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issues_newsletter ON newsletter_issues(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON newsletter_issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_sent_at ON newsletter_issues(sent_at DESC);

-- ===================
-- NEWSLETTER SUBSCRIBERS
-- ===================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
    
    -- Contact Info
    email TEXT NOT NULL,
    name TEXT,
    
    -- Metadata
    source TEXT DEFAULT 'form',
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained')),
    
    -- Engagement
    opens_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    last_opened_at TIMESTAMPTZ,
    last_clicked_at TIMESTAMPTZ,
    
    -- Timestamps
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,
    
    UNIQUE(newsletter_id, email)
);

CREATE INDEX IF NOT EXISTS idx_subscribers_newsletter ON newsletter_subscribers(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON newsletter_subscribers(status);

-- ===================
-- NEWSLETTER EVENTS
-- ===================
CREATE TABLE IF NOT EXISTS newsletter_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    issue_id UUID REFERENCES newsletter_issues(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE SET NULL,
    
    -- Event Info
    event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
    
    -- Click tracking
    link_url TEXT,
    link_index INT,
    
    -- Metadata
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT,
    location JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_issue ON newsletter_events(issue_id);
CREATE INDEX IF NOT EXISTS idx_events_subscriber ON newsletter_events(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON newsletter_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON newsletter_events(created_at DESC);

-- ===================
-- ROW LEVEL SECURITY
-- ===================
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_events ENABLE ROW LEVEL SECURITY;

-- Newsletters: Users can manage their org newsletters
CREATE POLICY "Users can manage org newsletters"
    ON newsletters FOR ALL
    USING (
        agency_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Issues: Users can manage issues of their newsletters
CREATE POLICY "Users can manage newsletter issues"
    ON newsletter_issues FOR ALL
    USING (
        newsletter_id IN (
            SELECT id FROM newsletters WHERE agency_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Subscribers: Users can manage subscribers of their newsletters
CREATE POLICY "Users can manage newsletter subscribers"
    ON newsletter_subscribers FOR ALL
    USING (
        newsletter_id IN (
            SELECT id FROM newsletters WHERE agency_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Events: Users can view events of their newsletters
CREATE POLICY "Users can view newsletter events"
    ON newsletter_events FOR SELECT
    USING (
        issue_id IN (
            SELECT id FROM newsletter_issues WHERE newsletter_id IN (
                SELECT id FROM newsletters WHERE agency_id IN (
                    SELECT organization_id FROM organization_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Service role full access
CREATE POLICY "Service role full access newsletters"
    ON newsletters FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access issues"
    ON newsletter_issues FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access subscribers"
    ON newsletter_subscribers FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access events"
    ON newsletter_events FOR ALL
    USING (auth.role() = 'service_role');

-- ===================
-- UPDATE TRIGGERS
-- ===================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER newsletters_updated_at
    BEFORE UPDATE ON newsletters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER newsletter_issues_updated_at
    BEFORE UPDATE ON newsletter_issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===================
-- STATS UPDATE FUNCTION
-- ===================
CREATE OR REPLACE FUNCTION update_issue_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.event_type = 'opened' THEN
        UPDATE newsletter_issues 
        SET opens_count = opens_count + 1,
            open_rate = (opens_count + 1.0) / NULLIF(recipients_count, 0)
        WHERE id = NEW.issue_id;
        
        UPDATE newsletter_subscribers
        SET opens_count = opens_count + 1,
            last_opened_at = NOW()
        WHERE id = NEW.subscriber_id;
    ELSIF NEW.event_type = 'clicked' THEN
        UPDATE newsletter_issues 
        SET clicks_count = clicks_count + 1,
            click_rate = (clicks_count + 1.0) / NULLIF(opens_count, 0)
        WHERE id = NEW.issue_id;
        
        UPDATE newsletter_subscribers
        SET clicks_count = clicks_count + 1,
            last_clicked_at = NOW()
        WHERE id = NEW.subscriber_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_newsletter_event
    AFTER INSERT ON newsletter_events
    FOR EACH ROW EXECUTE FUNCTION update_issue_stats();
