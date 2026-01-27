-- ═══════════════════════════════════════════════════════════════════════════════
-- 📊 REVENUE DASHBOARD SCHEMA - Real-time MRR, ARR, Churn, LTV
-- Date: 2026-01-27
-- Purpose: Enable real-time revenue tracking and advanced metrics calculation
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────────
-- REVENUE SNAPSHOTS TABLE (Historical Trends)
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS revenue_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Date tracking (daily snapshots)
    snapshot_date DATE NOT NULL,

    -- Revenue metrics
    total_revenue DECIMAL(15, 2) DEFAULT 0,
    mrr DECIMAL(15, 2) DEFAULT 0,
    arr DECIMAL(15, 2) DEFAULT 0,

    -- Subscriber metrics
    active_subscribers INTEGER DEFAULT 0,
    new_subscribers INTEGER DEFAULT 0,
    churned_subscribers INTEGER DEFAULT 0,

    -- Churn metrics
    revenue_churn_rate DECIMAL(5, 4) DEFAULT 0, -- Percentage
    customer_churn_rate DECIMAL(5, 4) DEFAULT 0, -- Percentage

    -- Lifetime value
    avg_ltv DECIMAL(15, 2) DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, snapshot_date)
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_revenue_snapshots_tenant ON revenue_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_snapshots_date ON revenue_snapshots(tenant_id, snapshot_date DESC);

-- RLS
ALTER TABLE revenue_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY revenue_snapshots_tenant_policy ON revenue_snapshots
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

-- ─────────────────────────────────────────────────────────────────────────────────
-- ENHANCED INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────────────────────────────────────────────

-- Payments: Speed up trend queries
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_succeeded ON payments(tenant_id, status) WHERE status = 'succeeded';

-- Subscriptions: Speed up churn calculation
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(tenant_id, current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(tenant_id) WHERE status = 'active';

-- ─────────────────────────────────────────────────────────────────────────────────
-- ENHANCED MRR CALCULATION FUNCTION
-- ─────────────────────────────────────────────────────────────────────────────────

-- Add MRR amount column to subscriptions (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'mrr_amount'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN mrr_amount DECIMAL(12, 2) DEFAULT 0;
    END IF;
END $$;

-- Function to calculate current MRR
CREATE OR REPLACE FUNCTION calculate_current_mrr(p_tenant_id UUID DEFAULT NULL)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
    v_mrr DECIMAL(15, 2);
BEGIN
    SELECT COALESCE(SUM(
        CASE
            WHEN plan = 'FREE' THEN 0
            WHEN plan = 'PRO' THEN 49
            WHEN plan = 'ENTERPRISE' THEN 199
            ELSE mrr_amount
        END
    ), 0)
    INTO v_mrr
    FROM subscriptions
    WHERE status = 'active'
    AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id);

    RETURN v_mrr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate ARR
CREATE OR REPLACE FUNCTION calculate_current_arr(p_tenant_id UUID DEFAULT NULL)
RETURNS DECIMAL(15, 2) AS $$
BEGIN
    RETURN calculate_current_mrr(p_tenant_id) * 12;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────────
-- CHURN CALCULATION FUNCTION
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION calculate_churn_rate(
    p_tenant_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    customer_churn_rate DECIMAL(5, 4),
    revenue_churn_rate DECIMAL(5, 4)
) AS $$
DECLARE
    v_start_count INTEGER;
    v_churned_count INTEGER;
    v_start_mrr DECIMAL(15, 2);
    v_churned_mrr DECIMAL(15, 2);
BEGIN
    -- Count active subscriptions at start
    SELECT COUNT(*)
    INTO v_start_count
    FROM subscriptions
    WHERE tenant_id = p_tenant_id
    AND current_period_start <= p_start_date
    AND (current_period_end >= p_start_date OR status = 'active');

    -- Count churned subscriptions in period
    SELECT COUNT(*)
    INTO v_churned_count
    FROM subscriptions
    WHERE tenant_id = p_tenant_id
    AND status IN ('canceled', 'unpaid')
    AND current_period_end BETWEEN p_start_date AND p_end_date;

    -- Calculate revenue churn (simplified - using plan prices)
    SELECT
        COALESCE(SUM(CASE
            WHEN plan = 'PRO' THEN 49
            WHEN plan = 'ENTERPRISE' THEN 199
            ELSE mrr_amount
        END), 0)
    INTO v_start_mrr
    FROM subscriptions
    WHERE tenant_id = p_tenant_id
    AND current_period_start <= p_start_date
    AND status = 'active';

    SELECT
        COALESCE(SUM(CASE
            WHEN plan = 'PRO' THEN 49
            WHEN plan = 'ENTERPRISE' THEN 199
            ELSE mrr_amount
        END), 0)
    INTO v_churned_mrr
    FROM subscriptions
    WHERE tenant_id = p_tenant_id
    AND status IN ('canceled', 'unpaid')
    AND current_period_end BETWEEN p_start_date AND p_end_date;

    -- Return rates
    RETURN QUERY SELECT
        CASE WHEN v_start_count > 0
            THEN (v_churned_count::DECIMAL / v_start_count::DECIMAL)
            ELSE 0::DECIMAL
        END AS customer_churn_rate,
        CASE WHEN v_start_mrr > 0
            THEN (v_churned_mrr / v_start_mrr)
            ELSE 0::DECIMAL
        END AS revenue_churn_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────────
-- LTV CALCULATION FUNCTION
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION calculate_avg_ltv(p_tenant_id UUID)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
    v_avg_revenue_per_customer DECIMAL(15, 2);
    v_avg_customer_lifespan_months INTEGER;
    v_ltv DECIMAL(15, 2);
BEGIN
    -- Calculate average revenue per active customer (monthly)
    SELECT
        COALESCE(AVG(CASE
            WHEN plan = 'PRO' THEN 49
            WHEN plan = 'ENTERPRISE' THEN 199
            ELSE mrr_amount
        END), 0)
    INTO v_avg_revenue_per_customer
    FROM subscriptions
    WHERE tenant_id = p_tenant_id
    AND status = 'active';

    -- Calculate average customer lifespan (in months)
    -- For active customers, use (now - created_at)
    -- For churned customers, use (canceled_at - created_at)
    SELECT
        COALESCE(AVG(
            EXTRACT(EPOCH FROM (
                CASE
                    WHEN status = 'active' THEN NOW()
                    ELSE current_period_end
                END - created_at
            )) / (60 * 60 * 24 * 30)  -- Convert to months
        ), 12)  -- Default to 12 months if no data
    INTO v_avg_customer_lifespan_months
    FROM subscriptions
    WHERE tenant_id = p_tenant_id;

    -- LTV = Average Revenue Per Customer × Average Customer Lifespan
    v_ltv := v_avg_revenue_per_customer * v_avg_customer_lifespan_months;

    RETURN v_ltv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────────
-- REVENUE STATS AGGREGATE VIEW
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW revenue_stats_view AS
SELECT
    s.tenant_id,
    -- Current metrics
    calculate_current_mrr(s.tenant_id) as current_mrr,
    calculate_current_arr(s.tenant_id) as current_arr,
    calculate_avg_ltv(s.tenant_id) as avg_ltv,

    -- Subscriber counts
    COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_subscribers,
    COUNT(CASE WHEN s.status = 'trialing' THEN 1 END) as trial_subscribers,
    COUNT(CASE WHEN s.status IN ('canceled', 'unpaid') THEN 1 END) as churned_subscribers,

    -- Plan breakdown
    COUNT(CASE WHEN s.plan = 'FREE' AND s.status = 'active' THEN 1 END) as free_users,
    COUNT(CASE WHEN s.plan = 'PRO' AND s.status = 'active' THEN 1 END) as pro_users,
    COUNT(CASE WHEN s.plan = 'ENTERPRISE' AND s.status = 'active' THEN 1 END) as enterprise_users
FROM subscriptions s
GROUP BY s.tenant_id;

-- ─────────────────────────────────────────────────────────────────────────────────
-- ENABLE SUPABASE REALTIME
-- ─────────────────────────────────────────────────────────────────────────────────

-- Enable realtime for payments table
ALTER PUBLICATION supabase_realtime ADD TABLE payments;

-- Enable realtime for subscriptions table
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;

-- Enable realtime for invoices table
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;

-- ─────────────────────────────────────────────────────────────────────────────────
-- COMMENTS
-- ─────────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE revenue_snapshots IS 'Historical daily snapshots of revenue metrics for trend analysis';
COMMENT ON FUNCTION calculate_current_mrr IS 'Calculate current Monthly Recurring Revenue for a tenant';
COMMENT ON FUNCTION calculate_current_arr IS 'Calculate current Annual Recurring Revenue (MRR × 12)';
COMMENT ON FUNCTION calculate_churn_rate IS 'Calculate customer and revenue churn rates for a period';
COMMENT ON FUNCTION calculate_avg_ltv IS 'Calculate average customer Lifetime Value';
COMMENT ON VIEW revenue_stats_view IS 'Aggregated revenue statistics per tenant';
COMMIT;
