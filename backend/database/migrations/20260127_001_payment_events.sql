-- Migration: Create payment_events table for idempotency and audit logs
-- Description: Stores raw webhook events and their processing status

CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL, -- 'stripe', 'paypal'
    event_id TEXT NOT NULL, -- Provider's event ID
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'failed', 'ignored'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,

    -- Ensure uniqueness for idempotency
    CONSTRAINT uq_provider_event_id UNIQUE (provider, event_id)
);

-- Index for faster lookups
CREATE INDEX idx_payment_events_status ON payment_events(status);
CREATE INDEX idx_payment_events_provider_event_id ON payment_events(provider, event_id);

-- Optional: Add table for invoices if not exists (simplified)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_invoice_id TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE
);
