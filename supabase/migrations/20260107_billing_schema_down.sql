-- Billing Schema DOWN

BEGIN;

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;

DROP FUNCTION IF EXISTS update_updated_at;

DROP VIEW IF EXISTS mrr_metrics;

DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS subscriptions;

COMMIT;
