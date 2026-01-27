-- Accounting Schema DOWN

BEGIN;

DROP VIEW IF EXISTS income_statement_view;
DROP VIEW IF EXISTS trial_balance_view;

DROP TRIGGER IF EXISTS journal_entries_updated_at ON journal_entries;
DROP TRIGGER IF EXISTS accounts_updated_at ON accounts;

DROP FUNCTION IF EXISTS adjust_account_balance;

DROP TABLE IF EXISTS journal_lines;
DROP TABLE IF EXISTS journal_entries;
DROP TABLE IF EXISTS accounts;

COMMIT;
