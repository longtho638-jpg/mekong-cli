# Multi-Tenancy Rules

> **"Chung cư cao cấp"** - High-end apartment complex.

## 1. Architecture
- **Database per Tenant**: Highest isolation.
- **Schema per Tenant**: Balanced.
- **Row-level Isolation**: Lowest cost, high complexity logic.

## 2. Isolation
- Data isolation (TenantID in every query).
- Performance isolation (Rate limiting per tenant).
- Configuration isolation (Feature flags per tenant).

## 3. Management
- Tenant provisioning/deprovisioning automation.
- Cross-tenant analytics (Superadmin).
