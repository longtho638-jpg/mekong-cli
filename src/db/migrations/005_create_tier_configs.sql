-- Migration 005: Create Tier Rate Limiting Tables
-- Created: 2026-03-07
-- Description: Tier-based rate limiting configuration and tenant overrides

-- Tier configs table - stores default rate limits per tier
CREATE TABLE IF NOT EXISTS tier_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier VARCHAR(50) NOT NULL,
    preset VARCHAR(50) NOT NULL,
    rate_limit INTEGER NOT NULL,
    window_seconds INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_tier_preset UNIQUE(tier, preset),
    CONSTRAINT check_rate_limit_positive CHECK (rate_limit > 0),
    CONSTRAINT check_window_positive CHECK (window_seconds > 0)
);

-- Tenant rate limits table - custom overrides per tenant
CREATE TABLE IF NOT EXISTS tenant_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    tier VARCHAR(50),
    preset VARCHAR(50) NOT NULL,
    custom_limit INTEGER,
    custom_window INTEGER DEFAULT 60,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_tenant_preset UNIQUE(tenant_id, preset),
    CONSTRAINT check_custom_limit_positive CHECK (custom_limit IS NULL OR custom_limit > 0),
    CONSTRAINT check_custom_window_positive CHECK (custom_window > 0)
);

-- Indexes for tier_configs
CREATE INDEX IF NOT EXISTS idx_tier_configs_tier ON tier_configs(tier);
CREATE INDEX IF NOT EXISTS idx_tier_configs_preset ON tier_configs(preset);

-- Indexes for tenant_rate_limits
CREATE INDEX IF NOT EXISTS idx_tenant_rate_limits_tenant ON tenant_rate_limits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_rate_limits_tier ON tenant_rate_limits(tier);
CREATE INDEX IF NOT EXISTS idx_tenant_rate_limits_expires ON tenant_rate_limits(expires_at);

-- Updated_at trigger for tier_configs
CREATE TRIGGER update_tier_configs_updated_at
    BEFORE UPDATE ON tier_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed default tier configurations
-- FREE tier
INSERT INTO tier_configs (tier, preset, rate_limit, window_seconds) VALUES
    ('free', 'auth_login', 5, 60),
    ('free', 'auth_callback', 10, 60),
    ('free', 'auth_refresh', 10, 60),
    ('free', 'api_default', 20, 60)
ON CONFLICT (tier, preset) DO NOTHING;

-- TRIAL tier
INSERT INTO tier_configs (tier, preset, rate_limit, window_seconds) VALUES
    ('trial', 'auth_login', 10, 60),
    ('trial', 'auth_callback', 20, 60),
    ('trial', 'auth_refresh', 20, 60),
    ('trial', 'api_default', 40, 60)
ON CONFLICT (tier, preset) DO NOTHING;

-- PRO tier
INSERT INTO tier_configs (tier, preset, rate_limit, window_seconds) VALUES
    ('pro', 'auth_login', 30, 60),
    ('pro', 'auth_callback', 60, 60),
    ('pro', 'auth_refresh', 60, 60),
    ('pro', 'api_default', 100, 60)
ON CONFLICT (tier, preset) DO NOTHING;

-- ENTERPRISE tier
INSERT INTO tier_configs (tier, preset, rate_limit, window_seconds) VALUES
    ('enterprise', 'auth_login', 100, 60),
    ('enterprise', 'auth_callback', 200, 60),
    ('enterprise', 'auth_refresh', 200, 60),
    ('enterprise', 'api_default', 500, 60)
ON CONFLICT (tier, preset) DO NOTHING;

-- Comment for documentation
COMMENT ON TABLE tier_configs IS 'Default rate limits per tier and endpoint preset';
COMMENT ON TABLE tenant_rate_limits IS 'Custom rate limit overrides per tenant';
COMMENT ON COLUMN tier_configs.tier IS 'License tier: free, trial, pro, enterprise';
COMMENT ON COLUMN tier_configs.preset IS 'Endpoint preset: auth_login, auth_callback, auth_refresh, api_default';
COMMENT ON COLUMN tenant_rate_limits.tenant_id IS 'Tenant identifier (key_id or license_key)';
COMMENT ON COLUMN tenant_rate_limits.tier IS 'Override tier (if different from license tier)';
COMMENT ON COLUMN tenant_rate_limits.custom_limit IS 'Custom rate limit override (null = use tier default)';
COMMENT ON COLUMN tenant_rate_limits.expires_at IS 'When the override expires (null = permanent)';
