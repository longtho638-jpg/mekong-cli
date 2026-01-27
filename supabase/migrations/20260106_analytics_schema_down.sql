-- Analytics Schema DOWN

BEGIN;

DROP FUNCTION IF EXISTS aggregate_daily_metrics;
DROP FUNCTION IF EXISTS get_mau;
DROP FUNCTION IF EXISTS get_dau;

DROP TABLE IF EXISTS feature_flags;
DROP TABLE IF EXISTS mrr_history;
DROP TABLE IF EXISTS cohort_snapshots;
DROP TABLE IF EXISTS daily_metrics;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS usage_events;

COMMIT;
