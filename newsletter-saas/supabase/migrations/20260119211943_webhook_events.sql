-- Migration: Create webhook_events table for idempotency protection
-- Purpose: Prevent duplicate webhook processing via database-level UNIQUE constraint
-- Security: Protects against TOCTOU race conditions (CWE-362)

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL,  -- CRITICAL: UNIQUE constraint prevents duplicate processing
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed_at ON webhook_events(processed_at);

-- Add comment for documentation
COMMENT ON TABLE webhook_events IS 'Audit log for PayPal webhook events with idempotency enforcement';
COMMENT ON COLUMN webhook_events.event_id IS 'PayPal event ID from webhook payload - UNIQUE constraint prevents duplicate processing';
