-- HR & Payroll Schema DOWN

BEGIN;

DROP VIEW IF EXISTS leave_summary_view;
DROP VIEW IF EXISTS employee_directory_view;

DROP TRIGGER IF EXISTS employees_updated_at ON employees;

DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS payroll_items;
DROP TABLE IF EXISTS payroll_runs;
DROP TABLE IF EXISTS employees;

COMMIT;
