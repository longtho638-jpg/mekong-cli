-- Init Core DOWN

BEGIN;

DROP POLICY IF EXISTS "Enable all access for anon" ON invoice_items;
DROP POLICY IF EXISTS "Enable all access for anon" ON invoices;
DROP POLICY IF EXISTS "Enable all access for anon" ON deals;
DROP POLICY IF EXISTS "Enable all access for anon" ON contacts;

DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS contacts;

COMMIT;
