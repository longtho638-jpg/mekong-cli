-- Migration 008: API Usage Billing System
-- Created: 2026-03-07
-- Description: Comprehensive billing system with usage tracking, proration, and reconciliation

-- ============================================================================
-- 1. BILLING PERIODS - Track billing cycles per license
-- ============================================================================
CREATE TABLE IF NOT EXISTS billing_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key VARCHAR(255) NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
    key_id VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open', 'closed', 'invoiced', 'paid'
    total_amount DECIMAL(12,4) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    plan_tier VARCHAR(50) NOT NULL,
    base_fee DECIMAL(12,4) DEFAULT 0,
    overage_fee DECIMAL(12,4) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(license_key, start_date, end_date)
);

-- ============================================================================
-- 2. BILLING RECORDS - Individual charge records (invoices line items)
-- ============================================================================
CREATE TABLE IF NOT EXISTS billing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_period_id UUID REFERENCES billing_periods(id) ON DELETE CASCADE,
    license_key VARCHAR(255) NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
    key_id VARCHAR(50) NOT NULL,
    record_type VARCHAR(50) NOT NULL, -- 'usage', 'overage', 'adjustment', 'credit', 'refund'
    amount DECIMAL(12,4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'charged', 'refunded', 'void'
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. BILLING LINE ITEMS - Detailed breakdown per usage event type
-- ============================================================================
CREATE TABLE IF NOT EXISTS billing_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_record_id UUID REFERENCES billing_records(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'api_call', 'token_input', 'token_output', 'agent_spawn', 'model_usage'
    model_name VARCHAR(100), -- 'qwen3.5-plus', 'qwen3-coder-plus', etc.
    quantity DECIMAL(14,2) NOT NULL,
    unit VARCHAR(50) NOT NULL, -- 'calls', '1K tokens', 'spawns', 'requests'
    unit_price DECIMAL(10,8) NOT NULL,
    subtotal DECIMAL(12,4) NOT NULL,
    discount DECIMAL(12,4) DEFAULT 0,
    final_amount DECIMAL(12,4) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    usage_batch_id VARCHAR(255), -- For batch processing correlation
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. BATCH IDEMPOTENCY - Prevent double-billing on batch processing
-- ============================================================================
CREATE TABLE IF NOT EXISTS batch_idempotency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id VARCHAR(255) UNIQUE NOT NULL,
    license_key VARCHAR(255) NOT NULL,
    key_id VARCHAR(50) NOT NULL,
    events_count INTEGER NOT NULL,
    processed_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    billing_record_id UUID REFERENCES billing_records(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- ============================================================================
-- 5. RATE CARDS - Pricing configuration per plan tier
-- ============================================================================
CREATE TABLE IF NOT EXISTS rate_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_tier VARCHAR(50) NOT NULL, -- 'free', 'starter', 'growth', 'premium', 'enterprise'
    event_type VARCHAR(100) NOT NULL,
    model_name VARCHAR(100), -- NULL for plan-wide rates
    unit VARCHAR(50) NOT NULL, -- 'calls', '1K tokens', 'spawns'
    unit_price DECIMAL(10,8) NOT NULL,
    included_quantity DECIMAL(14,2) DEFAULT 0, -- Monthly allowance included in plan
    overage_rate DECIMAL(10,8), -- Price after exceeding allowance (NULL = same as unit_price)
    overage_threshold DECIMAL(14,2), -- Threshold before overage kicks in
    valid_from DATE NOT NULL,
    valid_to DATE, -- NULL = currently active
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plan_tier, event_type, model_name, valid_from)
);

-- ============================================================================
-- 6. RECONCILIATION AUDITS - Nightly audit trail for double-billing prevention
-- ============================================================================
CREATE TABLE IF NOT EXISTS reconciliation_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_date DATE NOT NULL,
    license_key VARCHAR(255) NOT NULL,
    key_id VARCHAR(50) NOT NULL,
    expected_amount DECIMAL(12,4) NOT NULL,
    actual_amount DECIMAL(12,4) NOT NULL,
    variance DECIMAL(12,4) NOT NULL,
    variance_percent DECIMAL(6,4) DEFAULT 0,
    discrepancies JSONB DEFAULT '[]',
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'matched', 'variance', 'investigating', 'resolved'
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(255),
    notes TEXT,
    audit_details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(audit_date, license_key)
);

-- ============================================================================
-- 7. USAGE EVENTS STAGING - Temporary staging for batch usage processing
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_events_staging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id VARCHAR(255) NOT NULL,
    license_key VARCHAR(255) NOT NULL,
    key_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    model_name VARCHAR(100),
    quantity DECIMAL(14,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Billing periods
CREATE INDEX IF NOT EXISTS idx_billing_periods_license ON billing_periods(license_key, end_date);
CREATE INDEX IF NOT EXISTS idx_billing_periods_status ON billing_periods(status, end_date);
CREATE INDEX IF NOT EXISTS idx_billing_periods_key_id ON billing_periods(key_id, start_date);

-- Billing records
CREATE INDEX IF NOT EXISTS idx_billing_records_period ON billing_records(billing_period_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_license ON billing_records(license_key, created_at);
CREATE INDEX IF NOT EXISTS idx_billing_records_type ON billing_records(record_type, status);
CREATE INDEX IF NOT EXISTS idx_billing_records_key_id ON billing_records(key_id, created_at);

-- Billing line items
CREATE INDEX IF NOT EXISTS idx_billing_line_items_record ON billing_line_items(billing_record_id);
CREATE INDEX IF NOT EXISTS idx_billing_line_items_event ON billing_line_items(event_type, model_name);
CREATE INDEX IF NOT EXISTS idx_billing_line_items_timestamp ON billing_line_items(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_billing_line_items_batch ON billing_line_items(usage_batch_id);

-- Batch idempotency
CREATE INDEX IF NOT EXISTS idx_batch_idempotency_batch ON batch_idempotency(batch_id, license_key);
CREATE INDEX IF NOT EXISTS idx_batch_idempotency_status ON batch_idempotency(status, created_at);
CREATE INDEX IF NOT EXISTS idx_batch_idempotency_expires ON batch_idempotency(expires_at);

-- Rate cards
CREATE INDEX IF NOT EXISTS idx_rate_cards_tier ON rate_cards(plan_tier, is_active, valid_from);
CREATE INDEX IF NOT EXISTS idx_rate_cards_event ON rate_cards(event_type, model_name);

-- Reconciliation audits
CREATE INDEX IF NOT EXISTS idx_reconciliation_audits_date ON reconciliation_audits(audit_date DESC);
CREATE INDEX IF NOT EXISTS idx_reconciliation_audits_status ON reconciliation_audits(status, audit_date);
CREATE INDEX IF NOT EXISTS idx_reconciliation_audits_license ON reconciliation_audits(license_key, audit_date);

-- Usage events staging
CREATE INDEX IF NOT EXISTS idx_usage_events_staging_batch ON usage_events_staging(batch_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_staging_processed ON usage_events_staging(processed, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_staging_license ON usage_events_staging(license_key, batch_id);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE billing_periods IS 'Billing cycles per license key (monthly, quarterly, annual)';
COMMENT ON TABLE billing_records IS 'Individual charge records within a billing period';
COMMENT ON TABLE billing_line_items IS 'Detailed breakdown of charges per usage event type';
COMMENT ON TABLE batch_idempotency IS 'Prevent double-billing on batch processing with batch ID tracking';
COMMENT ON TABLE rate_cards IS 'Pricing configuration per plan tier and event type';
COMMENT ON TABLE reconciliation_audits IS 'Nightly audit trail for variance detection and double-billing prevention';
COMMENT ON TABLE usage_events_staging IS 'Temporary staging table for batch usage event processing';

COMMENT ON COLUMN billing_periods.status IS 'open=active period, closed=finalized, invoiced=bill generated, paid=payment complete';
COMMENT ON COLUMN billing_records.record_type IS 'usage=consumption charges, overage=excess usage, adjustment=manual corrections, credit/refund=reversals';
COMMENT ON COLUMN billing_line_items.event_type IS 'Type of usage: api_call, token_input, token_output, agent_spawn, model_usage';
COMMENT ON COLUMN batch_idempotency.status IS 'pending=awaiting processing, processing=in progress, completed=success, failed=error';
COMMENT ON COLUMN rate_cards.overage_rate IS 'Price per unit after exceeding included_quantity (NULL means no overage, hard limit)';
COMMENT ON COLUMN reconciliation_audits.status IS 'matched=OK, variance=detected difference, investigating=research needed, resolved=fixed';

-- ============================================================================
-- SEED DEFAULT RATE CARDS
-- ============================================================================

-- Free tier - Very limited usage
INSERT INTO rate_cards (plan_tier, event_type, model_name, unit, unit_price, included_quantity, overage_rate, valid_from, is_active) VALUES
('free', 'api_call', NULL, 'calls', 0.001, 100, NULL, '2026-01-01', TRUE),
('free', 'token_input', NULL, '1K tokens', 0.0005, 50, NULL, '2026-01-01', TRUE),
('free', 'token_output', NULL, '1K tokens', 0.0015, 25, NULL, '2026-01-01', TRUE),
('free', 'agent_spawn', NULL, 'spawns', 0.01, 10, NULL, '2026-01-01', TRUE),
('free', 'model_usage', 'qwen3.5-plus', 'calls', 0.002, 20, NULL, '2026-01-01', TRUE)
ON CONFLICT (plan_tier, event_type, model_name, valid_from) DO NOTHING;

-- Starter tier - Basic usage with overage
INSERT INTO rate_cards (plan_tier, event_type, model_name, unit, unit_price, included_quantity, overage_rate, valid_from, is_active) VALUES
('starter', 'api_call', NULL, 'calls', 0.0008, 1000, 0.001, '2026-01-01', TRUE),
('starter', 'token_input', NULL, '1K tokens', 0.0004, 500, 0.0005, '2026-01-01', TRUE),
('starter', 'token_output', NULL, '1K tokens', 0.0012, 250, 0.0015, '2026-01-01', TRUE),
('starter', 'agent_spawn', NULL, 'spawns', 0.008, 100, 0.01, '2026-01-01', TRUE),
('starter', 'model_usage', 'qwen3.5-plus', 'calls', 0.0015, 100, 0.002, '2026-01-01', TRUE),
('starter', 'model_usage', 'qwen3-coder-plus', 'calls', 0.001, 150, 0.0015, '2026-01-01', TRUE)
ON CONFLICT (plan_tier, event_type, model_name, valid_from) DO NOTHING;

-- Growth tier - Higher limits
INSERT INTO rate_cards (plan_tier, event_type, model_name, unit, unit_price, included_quantity, overage_rate, valid_from, is_active) VALUES
('growth', 'api_call', NULL, 'calls', 0.0006, 5000, 0.0008, '2026-01-01', TRUE),
('growth', 'token_input', NULL, '1K tokens', 0.0003, 2500, 0.0004, '2026-01-01', TRUE),
('growth', 'token_output', NULL, '1K tokens', 0.001, 1250, 0.0012, '2026-01-01', TRUE),
('growth', 'agent_spawn', NULL, 'spawns', 0.006, 500, 0.008, '2026-01-01', TRUE),
('growth', 'model_usage', 'qwen3.5-plus', 'calls', 0.0012, 500, 0.0015, '2026-01-01', TRUE),
('growth', 'model_usage', 'qwen3-coder-plus', 'calls', 0.0008, 750, 0.001, '2026-01-01', TRUE),
('growth', 'model_usage', 'qwen3-max', 'calls', 0.002, 200, 0.003, '2026-01-01', TRUE)
ON CONFLICT (plan_tier, event_type, model_name, valid_from) DO NOTHING;

-- Premium tier - Professional usage
INSERT INTO rate_cards (plan_tier, event_type, model_name, unit, unit_price, included_quantity, overage_rate, valid_from, is_active) VALUES
('premium', 'api_call', NULL, 'calls', 0.0005, 20000, 0.0006, '2026-01-01', TRUE),
('premium', 'token_input', NULL, '1K tokens', 0.00025, 10000, 0.0003, '2026-01-01', TRUE),
('premium', 'token_output', NULL, '1K tokens', 0.0008, 5000, 0.001, '2026-01-01', TRUE),
('premium', 'agent_spawn', NULL, 'spawns', 0.005, 2000, 0.006, '2026-01-01', TRUE),
('premium', 'model_usage', 'qwen3.5-plus', 'calls', 0.001, 2000, 0.0012, '2026-01-01', TRUE),
('premium', 'model_usage', 'qwen3-coder-plus', 'calls', 0.0006, 3000, 0.0008, '2026-01-01', TRUE),
('premium', 'model_usage', 'qwen3-max', 'calls', 0.0015, 1000, 0.002, '2026-01-01', TRUE),
('premium', 'model_usage', 'qwen-vl-max', 'calls', 0.0025, 500, 0.0035, '2026-01-01', TRUE)
ON CONFLICT (plan_tier, event_type, model_name, valid_from) DO NOTHING;

-- Enterprise tier - Highest limits with best rates
INSERT INTO rate_cards (plan_tier, event_type, model_name, unit, unit_price, included_quantity, overage_rate, valid_from, is_active) VALUES
('enterprise', 'api_call', NULL, 'calls', 0.0003, 100000, 0.0005, '2026-01-01', TRUE),
('enterprise', 'token_input', NULL, '1K tokens', 0.00015, 50000, 0.00025, '2026-01-01', TRUE),
('enterprise', 'token_output', NULL, '1K tokens', 0.0005, 25000, 0.0008, '2026-01-01', TRUE),
('enterprise', 'agent_spawn', NULL, 'spawns', 0.003, 10000, 0.005, '2026-01-01', TRUE),
('enterprise', 'model_usage', 'qwen3.5-plus', 'calls', 0.0008, 10000, 0.001, '2026-01-01', TRUE),
('enterprise', 'model_usage', 'qwen3-coder-plus', 'calls', 0.0005, 15000, 0.0006, '2026-01-01', TRUE),
('enterprise', 'model_usage', 'qwen3-max', 'calls', 0.001, 5000, 0.0015, '2026-01-01', TRUE),
('enterprise', 'model_usage', 'qwen-vl-max', 'calls', 0.002, 2500, 0.0025, '2026-01-01', TRUE)
ON CONFLICT (plan_tier, event_type, model_name, valid_from) DO NOTHING;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATED_AT
-- ============================================================================

-- Auto-update updated_at on billing_periods
CREATE TRIGGER update_billing_periods_updated_at
    BEFORE UPDATE ON billing_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on billing_records
CREATE TRIGGER update_billing_records_updated_at
    BEFORE UPDATE ON billing_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- LOG MIGRATION COMPLETION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 008: Billing system tables created successfully';
    RAISE NOTICE '  - billing_periods: Billing cycle tracking';
    RAISE NOTICE '  - billing_records: Charge records';
    RAISE NOTICE '  - billing_line_items: Detailed line items';
    RAISE NOTICE '  - batch_idempotency: Double-billing prevention';
    RAISE NOTICE '  - rate_cards: Pricing configuration';
    RAISE NOTICE '  - reconciliation_audits: Audit trail';
    RAISE NOTICE '  - usage_events_staging: Batch processing staging';
    RAISE NOTICE '  - Rate cards seeded for: free, starter, growth, premium, enterprise';
END $$;
