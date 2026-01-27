-- Feature Flags System
-- Supporting: LaunchDarkly, Unleash, and Local management

-- Main feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    key VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    provider VARCHAR(50) DEFAULT 'local', -- 'local', 'launchdarkly', 'unleash'
    config JSONB DEFAULT '{}', -- Provider specific config
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Feature flag rollouts history/tracking
CREATE TABLE IF NOT EXISTS feature_flag_rollouts (
    id SERIAL PRIMARY KEY,
    flag_key VARCHAR(255) REFERENCES feature_flags(key) ON DELETE CASCADE,
    environment VARCHAR(50) NOT NULL, -- 'dev', 'staging', 'prod'
    percentage INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255)
);

-- Targeting rules for local evaluation
CREATE TABLE IF NOT EXISTS feature_flag_targeting (
    id SERIAL PRIMARY KEY,
    flag_key VARCHAR(255) REFERENCES feature_flags(key) ON DELETE CASCADE,
    attribute_key VARCHAR(255) NOT NULL, -- 'email', 'role', 'subscription_tier'
    operator VARCHAR(50) NOT NULL, -- 'in', 'not_in', 'contains', 'equals'
    values JSONB NOT NULL, -- Array of values
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail
CREATE TABLE IF NOT EXISTS feature_flag_audit (
    id SERIAL PRIMARY KEY,
    flag_key VARCHAR(255) REFERENCES feature_flags(key) ON DELETE SET NULL,
    user_id VARCHAR(255),
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'toggle', 'delete'
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_feature_flags_provider ON feature_flags(provider);
CREATE INDEX idx_feature_flag_rollouts_flag_key ON feature_flag_rollouts(flag_key);
CREATE INDEX idx_feature_flag_targeting_flag_key ON feature_flag_targeting(flag_key);
CREATE INDEX idx_feature_flag_audit_flag_key ON feature_flag_audit(flag_key);
CREATE INDEX idx_feature_flag_audit_timestamp ON feature_flag_audit(timestamp);
