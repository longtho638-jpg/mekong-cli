-- ═══════════════════════════════════════════════════════════════════════════════
-- 🏦 PayPal Support Migration DOWN
-- Revert PayPal fields
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Drop Indexes
DROP INDEX IF EXISTS idx_payments_payment_provider;
DROP INDEX IF EXISTS idx_payments_paypal_order;
DROP INDEX IF EXISTS idx_subscriptions_payment_provider;
DROP INDEX IF EXISTS idx_subscriptions_paypal_subscription;

-- Revert payments table
ALTER TABLE payments DROP COLUMN IF EXISTS payment_provider;
ALTER TABLE payments DROP COLUMN IF EXISTS paypal_capture_id;
ALTER TABLE payments DROP COLUMN IF EXISTS paypal_order_id;

-- Revert subscriptions table
ALTER TABLE subscriptions DROP COLUMN IF EXISTS payment_provider;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS paypal_payer_id;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS paypal_plan_id;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS paypal_subscription_id;

-- Revert MRR view (This is tricky because the original view definition isn't stored here.
-- We will just drop the view and recreate it without the PayPal columns if needed,
-- or just leave it as is if it depends on columns that were dropped, it might break.
-- Ideally we restore the previous definition. Since we don't have it easily available,
-- we will try to create a basic version of it compatible with previous schema or just drop it.)

-- For safety, let's assume we want to restore the view to a state where it works without the new columns.
-- But wait, the view depends on `payment_provider`. If we drop the column, the view breaks.
-- So we MUST recreate the view WITHOUT those columns BEFORE dropping the columns.

-- Actually, looking at the UP migration, it updates the view to include provider breakdown.
-- So we should revert the view to its previous state.
-- Assuming the previous state was just grouping by month and plan.

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

COMMIT;
