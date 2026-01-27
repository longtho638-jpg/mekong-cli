-- Migration: Advanced Webhook Infrastructure (V2)
-- Description: Tables for granular delivery attempts and Dead Letter Queue (DLQ)

-- 1. Webhook Delivery Attempts
-- Tracks every individual retry attempt for a delivery
CREATE TABLE IF NOT EXISTS webhook_delivery_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES webhook_deliveries(id),
    webhook_config_id UUID REFERENCES webhook_configs(id),
    attempt_number INT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'failed'
    response_status INT,
    response_body TEXT,
    error_message TEXT,
    duration_ms INT, -- Duration of the request in milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_attempts_delivery_id ON webhook_delivery_attempts(delivery_id);

-- 2. Dead Letter Queue (DLQ) Entries
-- Stores permanently failed events for manual inspection and replay
CREATE TABLE IF NOT EXISTS dlq_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_config_id UUID REFERENCES webhook_configs(id),
    event_type TEXT,
    event_payload JSONB NOT NULL,
    error_message TEXT,
    retry_count INT DEFAULT 0, -- How many times it was retried before hitting DLQ
    stored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    replayed_at TIMESTAMP WITH TIME ZONE, -- When it was successfully replayed
    is_archived BOOLEAN DEFAULT FALSE -- To "delete" without deleting
);

CREATE INDEX idx_dlq_entries_config_id ON dlq_entries(webhook_config_id);
CREATE INDEX idx_dlq_entries_stored_at ON dlq_entries(stored_at);
CREATE INDEX idx_dlq_entries_archived ON dlq_entries(is_archived);

-- 3. Add Idempotency Key to Webhook Deliveries
ALTER TABLE webhook_deliveries
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE INDEX idx_webhook_deliveries_idempotency ON webhook_deliveries(idempotency_key);
