-- Migration 003: Analytics System
-- Description: Create tables for usage analytics and event tracking
-- Author: System
-- Date: 2026-01-24

-- Usage events table (high-volume event tracking)
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL CHECK (event_category IN ('license', 'api', 'feature', 'auth', 'billing', 'team', 'system')),
    event_name VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    client_version VARCHAR(50),
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for usage_events (partitioned for performance)
CREATE INDEX idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX idx_usage_events_license_id ON usage_events(license_id);
CREATE INDEX idx_usage_events_team_id ON usage_events(team_id);
CREATE INDEX idx_usage_events_event_type ON usage_events(event_type);
CREATE INDEX idx_usage_events_event_category ON usage_events(event_category);
CREATE INDEX idx_usage_events_occurred_at ON usage_events(occurred_at DESC);
CREATE INDEX idx_usage_events_session_id ON usage_events(session_id);

-- Daily usage aggregates (for faster reporting)
CREATE TABLE IF NOT EXISTS usage_aggregates_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_count INTEGER NOT NULL DEFAULT 0 CHECK (event_count >= 0),
    unique_sessions INTEGER NOT NULL DEFAULT 0 CHECK (unique_sessions >= 0),
    total_duration_seconds INTEGER DEFAULT 0 CHECK (total_duration_seconds >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(date, user_id, license_id, team_id, event_type)
);

-- Create indexes for usage_aggregates_daily
CREATE INDEX idx_usage_aggregates_daily_user_id ON usage_aggregates_daily(user_id);
CREATE INDEX idx_usage_aggregates_daily_license_id ON usage_aggregates_daily(license_id);
CREATE INDEX idx_usage_aggregates_daily_team_id ON usage_aggregates_daily(team_id);
CREATE INDEX idx_usage_aggregates_daily_date ON usage_aggregates_daily(date DESC);
CREATE INDEX idx_usage_aggregates_daily_event_type ON usage_aggregates_daily(event_type);

-- Monthly usage aggregates (for long-term trends)
CREATE TABLE IF NOT EXISTS usage_aggregates_monthly (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year >= 2024 AND year <= 2100),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    event_type VARCHAR(100) NOT NULL,
    event_count INTEGER NOT NULL DEFAULT 0 CHECK (event_count >= 0),
    unique_sessions INTEGER NOT NULL DEFAULT 0 CHECK (unique_sessions >= 0),
    unique_days_active INTEGER NOT NULL DEFAULT 0 CHECK (unique_days_active >= 0 AND unique_days_active <= 31),
    total_duration_seconds INTEGER DEFAULT 0 CHECK (total_duration_seconds >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(year, month, user_id, license_id, team_id, event_type)
);

-- Create indexes for usage_aggregates_monthly
CREATE INDEX idx_usage_aggregates_monthly_user_id ON usage_aggregates_monthly(user_id);
CREATE INDEX idx_usage_aggregates_monthly_license_id ON usage_aggregates_monthly(license_id);
CREATE INDEX idx_usage_aggregates_monthly_team_id ON usage_aggregates_monthly(team_id);
CREATE INDEX idx_usage_aggregates_monthly_year_month ON usage_aggregates_monthly(year DESC, month DESC);
CREATE INDEX idx_usage_aggregates_monthly_event_type ON usage_aggregates_monthly(event_type);

-- Feature usage tracking (specific feature adoption metrics)
CREATE TABLE IF NOT EXISTS feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    feature_category VARCHAR(50),
    first_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    total_uses INTEGER NOT NULL DEFAULT 1 CHECK (total_uses >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, license_id, feature_name)
);

-- Create indexes for feature_usage
CREATE INDEX idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX idx_feature_usage_license_id ON feature_usage(license_id);
CREATE INDEX idx_feature_usage_feature_name ON feature_usage(feature_name);
CREATE INDEX idx_feature_usage_feature_category ON feature_usage(feature_category);
CREATE INDEX idx_feature_usage_last_used_at ON feature_usage(last_used_at DESC);

-- API usage tracking (rate limiting and quota management)
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
    api_key_id UUID,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
    status_code INTEGER NOT NULL CHECK (status_code >= 100 AND status_code < 600),
    response_time_ms INTEGER CHECK (response_time_ms >= 0),
    request_size_bytes INTEGER CHECK (request_size_bytes >= 0),
    response_size_bytes INTEGER CHECK (response_size_bytes >= 0),
    ip_address INET,
    user_agent TEXT,
    error_message TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for api_usage
CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_license_id ON api_usage(license_id);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX idx_api_usage_status_code ON api_usage(status_code);
CREATE INDEX idx_api_usage_occurred_at ON api_usage(occurred_at DESC);

-- Error logs table (application errors and exceptions)
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    source VARCHAR(100),
    endpoint VARCHAR(255),
    method VARCHAR(10),
    ip_address INET,
    user_agent TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for error_logs
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_license_id ON error_logs(license_id);
CREATE INDEX idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_occurred_at ON error_logs(occurred_at DESC);
CREATE INDEX idx_error_logs_source ON error_logs(source);

-- Audit logs table (security and compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    changes JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure', 'pending')),
    failure_reason TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for audit_logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_team_id ON audit_logs(team_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_occurred_at ON audit_logs(occurred_at DESC);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);

-- Create triggers for updated_at
CREATE TRIGGER update_usage_aggregates_daily_updated_at BEFORE UPDATE ON usage_aggregates_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_aggregates_monthly_updated_at BEFORE UPDATE ON usage_aggregates_monthly
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_usage_updated_at BEFORE UPDATE ON feature_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to aggregate daily usage from events
CREATE OR REPLACE FUNCTION aggregate_daily_usage(target_date DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO usage_aggregates_daily (
        user_id,
        license_id,
        team_id,
        date,
        event_type,
        event_count,
        unique_sessions
    )
    SELECT
        user_id,
        license_id,
        team_id,
        target_date,
        event_type,
        COUNT(*) as event_count,
        COUNT(DISTINCT session_id) as unique_sessions
    FROM usage_events
    WHERE DATE(occurred_at) = target_date
    GROUP BY user_id, license_id, team_id, event_type
    ON CONFLICT (date, user_id, license_id, team_id, event_type)
    DO UPDATE SET
        event_count = EXCLUDED.event_count,
        unique_sessions = EXCLUDED.unique_sessions,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate monthly usage from daily aggregates
CREATE OR REPLACE FUNCTION aggregate_monthly_usage(target_year INTEGER, target_month INTEGER)
RETURNS void AS $$
BEGIN
    INSERT INTO usage_aggregates_monthly (
        user_id,
        license_id,
        team_id,
        year,
        month,
        event_type,
        event_count,
        unique_sessions,
        unique_days_active
    )
    SELECT
        user_id,
        license_id,
        team_id,
        target_year,
        target_month,
        event_type,
        SUM(event_count) as event_count,
        SUM(unique_sessions) as unique_sessions,
        COUNT(DISTINCT date) as unique_days_active
    FROM usage_aggregates_daily
    WHERE EXTRACT(YEAR FROM date) = target_year
      AND EXTRACT(MONTH FROM date) = target_month
    GROUP BY user_id, license_id, team_id, event_type
    ON CONFLICT (year, month, user_id, license_id, team_id, event_type)
    DO UPDATE SET
        event_count = EXCLUDED.event_count,
        unique_sessions = EXCLUDED.unique_sessions,
        unique_days_active = EXCLUDED.unique_days_active,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE usage_events IS 'High-volume event tracking for all user actions';
COMMENT ON TABLE usage_aggregates_daily IS 'Daily aggregated usage metrics for reporting';
COMMENT ON TABLE usage_aggregates_monthly IS 'Monthly aggregated usage metrics for trends';
COMMENT ON TABLE feature_usage IS 'Feature adoption and usage tracking';
COMMENT ON TABLE api_usage IS 'API endpoint usage and performance tracking';
COMMENT ON TABLE error_logs IS 'Application errors and exceptions';
COMMENT ON TABLE audit_logs IS 'Security and compliance audit trail';
