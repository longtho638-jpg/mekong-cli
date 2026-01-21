# 💳 Billing Migration Guide: Legacy to Unified Schema

This guide outlines the process of migrating billing data from the legacy `organizations` table to the new unified `subscriptions` table, and how to handle PayPal integration in the new system.

## 📋 Overview

AgencyOS 2026 uses a unified multi-tenant billing system. Previously, billing data was scattered across `agencies` and `organizations` tables. The new system centralizes all subscription state in the `subscriptions` table.

### Key Changes
- **Unified Table**: `subscriptions` is now the source of truth.
- **Provider Support**: Both Stripe and PayPal are supported in the same table.
- **Tenant Isolation**: Fully integrated with the multi-tenancy foundation.

## 🚀 Migration Steps

### 1. Apply Database Migration
Run the following SQL migration to add PayPal-specific fields to the `subscriptions` and `payments` tables:

```bash
# Apply migration via Supabase CLI or Dashboard
supabase migration up
# Or manually run:
# supabase/migrations/20260121_add_paypal_fields.sql
```

This adds `paypal_subscription_id`, `paypal_order_id`, and `paypal_payer_email` to `subscriptions`, and `paypal_capture_id`, `paypal_order_id` to `payments`.

### 2. Run Python Migration Script
Execute the migration script to move data from `organizations` to `subscriptions`. This script is idempotent and can be run multiple times safely.

```bash
# Ensure your environment variables are set (SUPABASE_URL, SUPABASE_KEY)
python3 scripts/migrate_billing.py
```

Check `migration_billing.log` for details on migrated records.

## 🛠️ Developer Integration

### Provisioning Service
The `ProvisioningService` (located in `backend/services/provisioning_service.py`) has been updated to:
1.  **Dual-Write**: Updates both `subscriptions` (Source of Truth) and `organizations` (Legacy Compatibility).
2.  **Smart Lookup**: When cancelling a subscription, it checks the new table first, then falls back to legacy if needed.

### Webhooks
When implementing or updating PayPal webhooks, ensure you update the `subscriptions` table.

**Legacy Pattern (Don't use for new features):**
```typescript
await supabase.from("organizations").update({ ... }).eq("id", tenantId);
```

**New Pattern (Recommended):**
```typescript
await supabase.from("subscriptions").upsert({
  tenant_id: tenantId,
  paypal_subscription_id: subId,
  plan: 'PRO',
  status: 'active'
});
```

## 🛡️ WIN-WIN-WIN Alignment
- **Owner WIN**: Unified billing oversight, reduced technical debt.
- **Agency WIN**: Reusable billing infrastructure for all projects.
- **Client WIN**: Consistent billing experience across the ecosystem.

---
🏯 **"Tốc chiến tốc thắng"** - Speed and precision in execution.
