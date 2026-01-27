-- Multi-Tenancy Foundation DOWN

BEGIN;

DROP FUNCTION IF EXISTS log_audit_event;
DROP FUNCTION IF EXISTS check_tenant_role;
DROP FUNCTION IF EXISTS get_user_tenant_ids;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS custom_domains;
DROP TABLE IF EXISTS tenant_branding;
DROP TABLE IF EXISTS invitations;
DROP TABLE IF EXISTS tenant_members;
DROP TABLE IF EXISTS tenants;

COMMIT;
