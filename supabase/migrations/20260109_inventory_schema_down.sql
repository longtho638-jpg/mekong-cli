-- Inventory & Asset Schema DOWN

BEGIN;

DROP VIEW IF EXISTS expiring_licenses_view;
DROP VIEW IF EXISTS asset_summary_view;

DROP TRIGGER IF EXISTS licenses_updated_at ON licenses;
DROP TRIGGER IF EXISTS assets_updated_at ON assets;

DROP TABLE IF EXISTS licenses;
DROP TABLE IF EXISTS asset_movements;
DROP TABLE IF EXISTS assets;

COMMIT;
