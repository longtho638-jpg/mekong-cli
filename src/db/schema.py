"""
PostgreSQL Schema for RaaS Licensing — ROIaaS Phase 3

Tables: licenses, usage_records, revocations
"""

SCHEMA_SQL = """
-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(255) UNIQUE NOT NULL,
    key_id VARCHAR(50) NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'free',
    email VARCHAR(255) NOT NULL,
    subscription_id VARCHAR(255),
    customer_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    daily_limit INTEGER DEFAULT 1000,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Usage records table
CREATE TABLE IF NOT EXISTS usage_records (
    id SERIAL PRIMARY KEY,
    license_id INTEGER REFERENCES licenses(id) ON DELETE CASCADE,
    key_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    commands_count INTEGER NOT NULL DEFAULT 0,
    total_commands INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(key_id, date)
);

-- Revocations table
CREATE TABLE IF NOT EXISTS revocations (
    id SERIAL PRIMARY KEY,
    key_id VARCHAR(50) UNIQUE NOT NULL,
    license_key VARCHAR(255) NOT NULL,
    reason VARCHAR(255),
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_by VARCHAR(255)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_licenses_key_id ON licenses(key_id);
CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(email);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_subscription_id ON licenses(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_key_id_date ON usage_records(key_id, date);
CREATE INDEX IF NOT EXISTS idx_revocations_key_id ON revocations(key_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
"""

MIGRATION_001 = SCHEMA_SQL

MIGRATION_002 = """
-- Add Polar webhook events tracking
CREATE TABLE IF NOT EXISTS webhook_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
"""

MIGRATION_003 = """
-- Phase 2: Add audit_logs table for admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,        -- CREATE, REVOKE, UPDATE, VIEW
    entity_type VARCHAR(50) NOT NULL,   -- LICENSE, KEY, USER
    entity_id VARCHAR(255) NOT NULL,    -- key_id or license id
    actor_email VARCHAR(255) NOT NULL,  -- Who performed action
    actor_ip VARCHAR(45),               -- IP address
    details JSONB DEFAULT '{}',         -- Action-specific details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add created_by to licenses table
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

-- Add revoked_reason to revocations
ALTER TABLE revocations ADD COLUMN IF NOT EXISTS revoked_reason TEXT;

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
"""

__all__ = ["SCHEMA_SQL", "MIGRATION_001", "MIGRATION_002", "MIGRATION_003"]
