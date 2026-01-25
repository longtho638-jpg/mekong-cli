-- ═══════════════════════════════════════════════════════════════════════════════
-- 🏦 PayPal Support Migration
-- Add PayPal fields to existing billing schema
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add PayPal fields to subscriptions table
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT,
    ADD COLUMN IF NOT EXISTS paypal_plan_id TEXT,
    ADD COLUMN IF NOT EXISTS paypal_payer_id TEXT,
    ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe' CHECK (
        payment_provider IN ('stripe', 'paypal', 'polar')
    );

-- Add PayPal fields to payments table
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS paypal_order_id TEXT,
    ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT,
    ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe' CHECK (
        payment_provider IN ('stripe', 'paypal', 'polar')
    );

-- Create indexes for PayPal lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_subscription
    ON subscriptions(paypal_subscription_id) WHERE paypal_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_provider
    ON subscriptions(payment_provider);

CREATE INDEX IF NOT EXISTS idx_payments_paypal_order
    ON payments(paypal_order_id) WHERE paypal_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_payment_provider
    ON payments(payment_provider);

-- Update MRR view to be provider-agnostic
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
    END) * 12 as arr_usd,
    -- Provider breakdown
    COUNT(DISTINCT CASE WHEN s.payment_provider = 'stripe' THEN s.tenant_id END) as stripe_subscribers,
    COUNT(DISTINCT CASE WHEN s.payment_provider = 'paypal' THEN s.tenant_id END) as paypal_subscribers,
    COUNT(DISTINCT CASE WHEN s.payment_provider = 'polar' THEN s.tenant_id END) as polar_subscribers
FROM subscriptions s
WHERE s.status = 'active'
GROUP BY DATE_TRUNC('month', s.created_at)
ORDER BY month DESC;

-- COMMENT ON MIGRATION
COMMENT ON COLUMN subscriptions.payment_provider IS 'Payment provider: stripe, paypal, or polar';
COMMENT ON COLUMN subscriptions.paypal_subscription_id IS 'PayPal subscription ID for recurring billing';
COMMENT ON COLUMN subscriptions.paypal_plan_id IS 'PayPal plan/product ID';
COMMENT ON COLUMN payments.payment_provider IS 'Payment provider used for this transaction';
COMMENT ON COLUMN payments.paypal_order_id IS 'PayPal order ID for one-time payments';
