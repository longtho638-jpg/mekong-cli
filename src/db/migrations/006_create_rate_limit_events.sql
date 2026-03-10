-- Migration 006: Create Rate Limit Events Table
-- Created: 2026-03-07
-- Description: Track rate limit events for observability and analytics

-- Rate limit events table - logs all rate limit decisions
CREATE TABLE IF NOT EXISTS rate_limit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Tenant context
    tenant_id VARCHAR(255) NOT NULL,
    tier VARCHAR(50) NOT NULL,

    -- Endpoint context
    endpoint VARCHAR(500) NOT NULL,
    preset VARCHAR(50) NOT NULL,

    -- Event type
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('override_applied', 'request_allowed', 'rate_limited')),

    -- Quota information
    quota_limit INT,
    quota_remaining INT,
    quota_utilization_pct DECIMAL(5,2),

    -- Request details
    client_ip VARCHAR(45),
    method VARCHAR(10),
    path TEXT,
    user_agent TEXT,

    -- Response details
    response_status INT,
    retry_after INT,

    -- Additional metadata (JSON for flexibility)
    metadata JSONB,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_tenant ON rate_limit_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_created ON rate_limit_events(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_type ON rate_limit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_tenant_created ON rate_limit_events(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_tenant_type ON rate_limit_events(tenant_id, event_type);

-- Comment for documentation
COMMENT ON TABLE rate_limit_events IS 'Logs all rate limit events for observability and analytics';
COMMENT ON COLUMN rate_limit_events.tenant_id IS 'Tenant identifier (license key ID)';
COMMENT ON COLUMN rate_limit_events.tier IS 'License tier: free, trial, pro, enterprise (with custom override suffix)';
COMMENT ON COLUMN rate_limit_events.endpoint IS 'Full endpoint path';
COMMENT ON COLUMN rate_limit_events.preset IS 'Rate limit preset: auth_login, auth_callback, auth_refresh, api_default';
COMMENT ON COLUMN rate_limit_events.event_type IS 'Event type: override_applied, request_allowed, rate_limited';
COMMENT ON COLUMN rate_limit_events.quota_limit IS 'Rate limit quota (requests per window)';
COMMENT ON COLUMN rate_limit_events.quota_remaining IS 'Remaining quota after request';
COMMENT ON COLUMN rate_limit_events.quota_utilization_pct IS 'Quota usage percentage (0-100)';
COMMENT ON COLUMN rate_limit_events.client_ip IS 'Client IP address (may be anonymized)';
COMMENT ON COLUMN rate_limit_events.method IS 'HTTP method: GET, POST, etc.';
COMMENT ON COLUMN rate_limit_events.path IS 'Request path';
COMMENT ON COLUMN rate_limit_events.user_agent IS 'Client user agent string';
COMMENT ON COLUMN rate_limit_events.response_status IS 'HTTP response status code';
COMMENT ON COLUMN rate_limit_events.retry_after IS 'Retry-After header value (seconds)';
COMMENT ON COLUMN rate_limit_events.metadata IS 'Additional metadata (JSON format)';
