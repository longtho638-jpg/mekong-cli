-- Telemetry Events Table
CREATE TABLE IF NOT EXISTS telemetry_events (
    id SERIAL PRIMARY KEY,
    anonymous_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    cli_version VARCHAR(20),
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_anonymous_id ON telemetry_events(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_event_type ON telemetry_events(event_type);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_session_id ON telemetry_events(session_id);

CREATE OR REPLACE VIEW telemetry_daily_stats AS
SELECT
    DATE(timestamp) AS date,
    event_type,
    COUNT(*) AS event_count,
    COUNT(DISTINCT anonymous_id) AS unique_users,
    COUNT(DISTINCT session_id) AS unique_sessions
FROM telemetry_events
GROUP BY DATE(timestamp), event_type
ORDER BY date DESC;
