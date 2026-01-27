-- Migration: Create tables for Public API infrastructure
-- Description: API Keys, Usage Tracking, and Webhooks

-- 1. API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Owner of the key (linked to users/tenants)
    name TEXT NOT NULL, -- User-friendly name (e.g., "Production Key")
    key_hash TEXT NOT NULL, -- Bcrypt hash of the actual key
    prefix TEXT NOT NULL, -- First few chars for identification (e.g., "aky_live_1234")
    scopes TEXT[] NOT NULL DEFAULT '{}', -- Array of permission strings
    tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'revoked', 'expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash); -- Might not be strictly needed for lookup if we use ID, but useful if looking up by hash (unlikely)
-- Actually we usually lookup by prefix or just scan? No, typically we send the key, extract prefix/ID if encoded, or just match against all active keys for a user?
-- Standard practice: Client sends `aky_live_SECRET`. We probably don't store the secret.
-- Wait, if we hash it, we can't lookup by the secret directly without iterating or having an ID in the key.
-- Stripe style: keys usually allow identifying the record.
-- Let's assume the key format is `aky_live_<random>`.
-- If we hash the whole key, we need to know WHICH record to verify against.
-- Usually, we either:
-- 1. Embed the ID in the key: `aky_live_<id>_<random>`
-- 2. Store a "lookup hash" (fast) and a "verification hash" (slow/bcrypt).
-- 3. Or just rely on the user providing the ID? No, they just provide the key.
-- Let's go with: Key = `aky_live_` + `random_string`.
-- We can store the first few characters as `prefix` to help filtering, or just assume the DB isn't massive yet.
-- BETTER APPROACH: Store `key_prefix` (e.g. first 8 chars) to fast-filter candidates, then bcrypt verify.
-- I added `prefix` column above.

-- 2. API Usage Table
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_usage_api_key_id ON api_usage(api_key_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at);

-- 3. Webhook Configs Table
CREATE TABLE IF NOT EXISTS webhook_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id), -- Scoped to an API key/User
    url TEXT NOT NULL,
    events TEXT[] NOT NULL, -- List of events to subscribe to (e.g., ["invoice.paid", "subscription.*"])
    secret TEXT NOT NULL, -- Signing secret for HMAC (generated and shown once or stored encrypted? Usually stored plaintext or encrypted is fine as it's a shared secret)
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'disabled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_configs_api_key_id ON webhook_configs(api_key_id);

-- 4. Webhook Deliveries Table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_config_id UUID NOT NULL REFERENCES webhook_configs(id),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL, -- 'success', 'failed', 'pending'
    response_status INTEGER,
    response_body TEXT,
    attempts INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_config_id ON webhook_deliveries(webhook_config_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
