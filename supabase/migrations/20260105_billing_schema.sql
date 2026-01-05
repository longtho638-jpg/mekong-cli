-- ═══════════════════════════════════════════════════════════════════════════════
-- 🏦 BILLING SCHEMA - AgencyOS VC-Ready
-- Multi-tenant billing with SEA currency support
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────────
-- SUBSCRIPTIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Stripe Integration
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    
    -- Plan Details
    plan TEXT NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PRO', 'ENTERPRISE')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
        'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete'
    )),
    
    -- Billing Cycle
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 year',
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ─────────────────────────────────────────────────────────────────────────────────
-- INVOICES TABLE
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    
    -- Stripe Reference
    stripe_invoice_id TEXT UNIQUE,
    
    -- Invoice Details
    invoice_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'open', 'paid', 'void', 'uncollectible'
    )),
    
    -- Amounts
    subtotal DECIMAL(12, 2) NOT NULL,
    tax DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    
    -- Tax Details
    tax_rate DECIMAL(5, 4) DEFAULT 0,
    tax_name TEXT,
    
    -- Dates
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    -- PDF Storage
    pdf_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- ─────────────────────────────────────────────────────────────────────────────────
-- PAYMENTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id),
    
    -- Stripe Reference
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_charge_id TEXT,
    
    -- Payment Details
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'
    )),
    
    -- Payment Method
    payment_method TEXT, -- card, bank_transfer, etc.
    card_last4 TEXT,
    card_brand TEXT,
    
    -- Dates
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    refund_amount DECIMAL(12, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ─────────────────────────────────────────────────────────────────────────────────
-- MRR METRICS VIEW (for VC Dashboard)
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW mrr_metrics AS
SELECT 
    DATE_TRUNC('month', s.created_at) as month,
    COUNT(DISTINCT s.tenant_id) as total_subscribers,
    COUNT(DISTINCT CASE WHEN s.plan = 'PRO' THEN s.tenant_id END) as pro_subscribers,
    COUNT(DISTINCT CASE WHEN s.plan = 'ENTERPRISE' THEN s.tenant_id END) as enterprise_subscribers,
    SUM(CASE 
        WHEN s.plan = 'PRO' THEN 49 
        WHEN s.plan = 'ENTERPRISE' THEN 199 
        ELSE 0 
    END) as mrr_usd,
    SUM(CASE 
        WHEN s.plan = 'PRO' THEN 49 
        WHEN s.plan = 'ENTERPRISE' THEN 199 
        ELSE 0 
    END) * 12 as arr_usd
FROM subscriptions s
WHERE s.status = 'active'
GROUP BY DATE_TRUNC('month', s.created_at)
ORDER BY month DESC;

-- ─────────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────────

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Subscriptions: Tenant can only see their own
CREATE POLICY subscriptions_tenant_policy ON subscriptions
    FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Invoices: Tenant can only see their own
CREATE POLICY invoices_tenant_policy ON invoices
    FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Payments: Tenant can only see their own
CREATE POLICY payments_tenant_policy ON payments
    FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- ─────────────────────────────────────────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────────

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────────
-- SEED DATA (for demo)
-- ─────────────────────────────────────────────────────────────────────────────────

-- This would be populated by actual sign-ups
-- INSERT INTO subscriptions (tenant_id, plan, status) VALUES ...
