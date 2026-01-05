-- ═══════════════════════════════════════════════════════════════════════════════
-- 📊 ANALYTICS SCHEMA - AgencyOS VC-Ready
-- Usage tracking, cohorts, and business metrics
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────────
-- USAGE EVENTS TABLE (Core tracking)
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID,
    
    -- Event Details
    event_type TEXT NOT NULL CHECK (event_type IN (
        'page_view', 'feature_use', 'action', 'error', 'conversion', 'engagement'
    )),
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}',
    
    -- Session Context
    session_id TEXT,
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant ON usage_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_user ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_created ON usage_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_created ON usage_events(tenant_id, created_at DESC);

-- Partition by month for large-scale analytics (optional)
-- CREATE TABLE usage_events_2026_01 PARTITION OF usage_events
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- ─────────────────────────────────────────────────────────────────────────────────
-- SESSIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID,
    session_id TEXT UNIQUE NOT NULL,
    
    -- Session Details
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INT,
    page_views INT DEFAULT 0,
    events_count INT DEFAULT 0,
    
    -- Device Info
    device_type TEXT, -- desktop, mobile, tablet
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,
    
    -- Attribution
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    referrer_domain TEXT,
    landing_page TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────────
-- DAILY METRICS AGGREGATE (Pre-computed for performance)
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- User Metrics
    dau INT DEFAULT 0,
    new_users INT DEFAULT 0,
    returning_users INT DEFAULT 0,
    
    -- Engagement
    total_sessions INT DEFAULT 0,
    avg_session_duration INT DEFAULT 0,
    total_page_views INT DEFAULT 0,
    total_events INT DEFAULT 0,
    
    -- Feature Usage (top 10 as JSONB)
    top_features JSONB DEFAULT '[]',
    top_pages JSONB DEFAULT '[]',
    
    -- Revenue
    mrr DECIMAL(12, 2),
    new_mrr DECIMAL(12, 2),
    churned_mrr DECIMAL(12, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_tenant_date ON daily_metrics(tenant_id, date DESC);

-- ─────────────────────────────────────────────────────────────────────────────────
-- COHORT SNAPSHOTS (Monthly cohort data)
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cohort_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cohort_month DATE NOT NULL, -- First day of cohort month
    snapshot_month DATE NOT NULL, -- First day of snapshot month
    
    -- Cohort Size
    cohort_size INT NOT NULL,
    
    -- Retention
    active_users INT DEFAULT 0,
    retention_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- Revenue
    cohort_mrr DECIMAL(12, 2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, cohort_month, snapshot_month)
);

CREATE INDEX IF NOT EXISTS idx_cohort_snapshots_tenant ON cohort_snapshots(tenant_id);

-- ─────────────────────────────────────────────────────────────────────────────────
-- MRR HISTORY (Monthly MRR snapshots for VC reporting)
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mrr_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month DATE NOT NULL UNIQUE, -- First day of month
    
    -- Revenue Metrics
    total_mrr DECIMAL(12, 2) NOT NULL,
    new_mrr DECIMAL(12, 2) DEFAULT 0,
    expansion_mrr DECIMAL(12, 2) DEFAULT 0,
    contraction_mrr DECIMAL(12, 2) DEFAULT 0,
    churned_mrr DECIMAL(12, 2) DEFAULT 0,
    
    -- Customer Counts
    total_customers INT DEFAULT 0,
    new_customers INT DEFAULT 0,
    churned_customers INT DEFAULT 0,
    
    -- Derived Metrics
    arpu DECIMAL(10, 2),
    nrr DECIMAL(5, 2), -- Net Revenue Retention %
    grr DECIMAL(5, 2), -- Gross Revenue Retention %
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mrr_history_month ON mrr_history(month DESC);

-- ─────────────────────────────────────────────────────────────────────────────────
-- FEATURE FLAGS TABLE (For feature adoption tracking)
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    
    -- Rollout
    rollout_percentage INT DEFAULT 100,
    allowed_plans TEXT[] DEFAULT ARRAY['FREE', 'PRO', 'ENTERPRISE'],
    
    -- Tracking
    first_used_at TIMESTAMPTZ,
    usage_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────────

ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_snapshots ENABLE ROW LEVEL SECURITY;

-- Usage events: Users can only see their tenant's events
CREATE POLICY usage_events_tenant_policy ON usage_events
    FOR SELECT USING (
        tenant_id IN (SELECT unnest(get_user_tenant_ids()))
    );

-- Sessions: Users can only see their tenant's sessions
CREATE POLICY sessions_tenant_policy ON sessions
    FOR SELECT USING (
        tenant_id IN (SELECT unnest(get_user_tenant_ids()))
    );

-- Daily metrics: Users can only see their tenant's metrics
CREATE POLICY daily_metrics_tenant_policy ON daily_metrics
    FOR SELECT USING (
        tenant_id IN (SELECT unnest(get_user_tenant_ids()))
    );

-- Cohort snapshots: Users can only see their tenant's cohorts
CREATE POLICY cohort_snapshots_tenant_policy ON cohort_snapshots
    FOR SELECT USING (
        tenant_id IN (SELECT unnest(get_user_tenant_ids()))
    );

-- ─────────────────────────────────────────────────────────────────────────────────
-- HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────────

-- Calculate DAU for a tenant
CREATE OR REPLACE FUNCTION get_dau(p_tenant_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INT AS $$
DECLARE
    dau_count INT;
BEGIN
    SELECT COUNT(DISTINCT user_id) INTO dau_count
    FROM usage_events
    WHERE tenant_id = p_tenant_id
    AND DATE(created_at) = p_date;
    
    RETURN dau_count;
END;
$$ LANGUAGE plpgsql;

-- Calculate MAU for a tenant
CREATE OR REPLACE FUNCTION get_mau(p_tenant_id UUID, p_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE)
RETURNS INT AS $$
DECLARE
    mau_count INT;
BEGIN
    SELECT COUNT(DISTINCT user_id) INTO mau_count
    FROM usage_events
    WHERE tenant_id = p_tenant_id
    AND created_at >= p_month
    AND created_at < p_month + INTERVAL '1 month';
    
    RETURN mau_count;
END;
$$ LANGUAGE plpgsql;

-- Aggregate daily metrics (run via cron)
CREATE OR REPLACE FUNCTION aggregate_daily_metrics(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_metrics (tenant_id, date, dau, total_sessions, total_page_views, total_events)
    SELECT 
        tenant_id,
        p_date,
        COUNT(DISTINCT user_id),
        COUNT(DISTINCT session_id),
        COUNT(*) FILTER (WHERE event_type = 'page_view'),
        COUNT(*)
    FROM usage_events
    WHERE DATE(created_at) = p_date
    GROUP BY tenant_id
    ON CONFLICT (tenant_id, date) DO UPDATE SET
        dau = EXCLUDED.dau,
        total_sessions = EXCLUDED.total_sessions,
        total_page_views = EXCLUDED.total_page_views,
        total_events = EXCLUDED.total_events;
END;
$$ LANGUAGE plpgsql;
