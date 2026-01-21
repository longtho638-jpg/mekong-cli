# 🚀 Database Production Checklist

> **AgencyOS Enterprise - Database Deployment Protocol**

## 1. Tables to Create (Core & Extensions)

### Core Multi-Tenancy (Priority 1)
- [ ] `tenants` (Core tenant identity)
- [ ] `tenant_members` (User-Tenant mapping)
- [ ] `tenant_branding` (White-label settings)
- [ ] `audit_logs` (Security & Compliance)

### Agency Business Logic (Priority 2)
- [ ] `agencies` (Legacy/Core agency profile)
- [ ] `clients` (Client management)
- [ ] `projects` (Work management)
- [ ] `tasks` (Operational tasks)

### specialized Modules (Enterprise)
- [ ] **Accounting**: `accounts`, `journal_entries`, `journal_lines`
- [ ] **Billing**: `subscriptions`, `invoices`, `payments` (with PayPal fields)
- [ ] **HR**: `employees`, `payroll_runs`, `leave_requests`
- [ ] **Inventory**: `assets`, `licenses`, `asset_movements`
- [ ] **Analytics**: `usage_events`, `sessions`, `daily_metrics`

## 2. Migrations to Run (Sequential Order)

1.  `20251219_init_schema.sql` - Base infrastructure
2.  `20260104_multi_tenancy_foundation.sql` - Enterprise tenant system
3.  `20260103_multi_tenancy.sql` - Team & Role enhancements
4.  `20260105_accounting_schema.sql` - Financial backbone
5.  `20260106_analytics_schema.sql` - Tracking & Metrics
6.  `20260107_billing_schema.sql` - Stripe billing integration
7.  `20260108_hr_schema.sql` - Human resources & Payroll
8.  `20260109_inventory_schema.sql` - Asset & License tracking
9.  `20260121_add_paypal_fields.sql` - PayPal payment support

## 3. Security & RLS Verification

- [ ] Run `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` on all tables.
- [ ] Verify `tenants_member_policy` for tenant isolation.
- [ ] Verify `check_tenant_role` function for role-based access.
- [ ] Audit `service_role` policies to ensure they are restricted to internal scripts.

## 4. Sample Data to Seed (Reference: supabase/seed.sql)

- [ ] **System Tenant**: Create a default admin tenant.
- [ ] **Demo Data**:
    - [ ] Insert demo employees (e.g., `emp-001`, `emp-002`).
    - [ ] Initialize Chart of Accounts (Codes: 1000, 2000, 3000, 4000, 5000).
    - [ ] Setup initial hardware/software assets.
    - [ ] Create test usage events for analytics dashboard.

## 5. Pre-Flight Checks

- [ ] Check for UUID vs Serial ID consistency.
- [ ] Validate `updated_at` triggers are active.
- [ ] Confirm all `FOREIGN KEY` constraints have appropriate `ON DELETE` actions.
- [ ] Verify indexes on `tenant_id` and `user_id` for performance.
