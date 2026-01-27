-- ═══════════════════════════════════════════════════════════════════════════════
-- 📊 ROLLBACK: REVENUE DASHBOARD SCHEMA
-- Date: 2026-01-27
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Drop Publication tables (Reverse order)
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS invoices;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS subscriptions;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS payments;

-- Drop Views
DROP VIEW IF EXISTS revenue_stats_view;

-- Drop Functions
DROP FUNCTION IF EXISTS calculate_avg_ltv(UUID);
DROP FUNCTION IF EXISTS calculate_churn_rate(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS calculate_current_arr(UUID);
DROP FUNCTION IF EXISTS calculate_current_mrr(UUID);

-- Drop Tables
DROP TABLE IF EXISTS revenue_snapshots;

-- Drop Column (if added)
ALTER TABLE subscriptions DROP COLUMN IF EXISTS mrr_amount;

COMMIT;
