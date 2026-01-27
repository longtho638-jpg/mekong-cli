-- Migration: Webhook Management System Tables
-- Description: Tables for incoming events, outgoing deliveries, and failures (DLQ)

-- 1. Incoming Webhook Events (Generic, beyond just payments)
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL, -- 'stripe', 'paypal', 'github', 'custom'
    event_id TEXT NOT NULL, -- Provider's event ID
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    headers JSONB, -- Store headers for debugging/verification
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'failed', 'ignored'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,

    -- Ensure uniqueness for idempotency per provider
    CONSTRAINT uq_webhook_provider_event_id UNIQUE (provider, event_id)
);

CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);

-- 2. Outgoing Webhook Endpoints (Destinations)
-- Named 'webhook_configs' to align with existing code/public API usage
CREATE TABLE IF NOT EXISTS webhook_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    description TEXT,
    secret TEXT NOT NULL, -- Signing secret for outgoing webhooks
    event_types JSONB NOT NULL DEFAULT '["*"]', -- List of event types to subscribe to
    is_active BOOLEAN DEFAULT true,
    api_key_id UUID, -- Optional link to API Key if created via Public API
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Outgoing Webhook Deliveries (Attempts)
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_config_id UUID REFERENCES webhook_configs(id), -- Renamed from endpoint_id
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
    response_status INT,
    response_body TEXT,
    attempt_count INT DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at) WHERE status = 'pending';

-- 4. Webhook Failures (Dead Letter Queue)
-- Stores webhooks that have exhausted all retry attempts
CREATE TABLE IF NOT EXISTS webhook_failures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES webhook_deliveries(id),
    webhook_config_id UUID REFERENCES webhook_configs(id), -- Renamed from endpoint_id
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    error_message TEXT,
    failed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_resolved BOOLEAN DEFAULT false,
    resolution_note TEXT
);

CREATE INDEX idx_webhook_failures_resolved ON webhook_failures(is_resolved);
