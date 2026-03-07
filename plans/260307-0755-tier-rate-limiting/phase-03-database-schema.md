---
phase: 3
title: "Database Schema"
effort: 1h
---

# Phase 3: Database Schema

## Context Links
- Depends on: Phase 1 (TierConfig structure)
- Related: `src/db/` (database module location)

## Overview
**Priority:** P0 | **Status:** ✅ Complete

**Files Created:** `src/db/migrations/005_create_tier_configs.sql`, `src/db/tier_config_repository.py`

Database-backed tier configs and tenant overrides for runtime flexibility.

## Requirements

### Functional
- `tier_configs` table: Store preset limits per tier
- `tenant_rate_limits` table: Custom overrides per tenant
- Migration scripts for schema changes
- Seed data for 4 default tiers

### Non-functional
- <5ms query time for tier lookup
- Atomic updates for rate limit changes
- Audit trail for config changes

## Architecture

```sql
-- tier_configs table
CREATE TABLE tier_configs (
    id SERIAL PRIMARY KEY,
    tier VARCHAR(50) UNIQUE NOT NULL,  -- free, trial, pro, enterprise
    requests_per_hour INTEGER NOT NULL DEFAULT 100,
    requests_per_day INTEGER NOT NULL DEFAULT 1000,
    burst_limit INTEGER NOT NULL DEFAULT 10,
    multiplier DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- tenant_rate_limits table (overrides)
CREATE TABLE tenant_rate_limits (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255) UNIQUE NOT NULL,
    tier VARCHAR(50) REFERENCES tier_configs(tier),
    custom_requests_per_hour INTEGER,  -- NULL = use tier default
    custom_requests_per_day INTEGER,
    custom_burst_limit INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tenant_rate_limits_tenant ON tenant_rate_limits(tenant_id);
CREATE INDEX idx_tenant_rate_limits_active ON tenant_rate_limits(is_active);
```

## Implementation Steps

1. Create migration file `migrations/00X_add_rate_limit_tables.sql`
2. Add seed data for 4 tiers (free: 100/h, trial: 500/h, pro: 2000/h, enterprise: 10000/h)
3. Create `src/db/tier_config_repository.py` for DB access
4. Add `get_tier_config(tier)` method
5. Add `get_tenant_override(tenant_id)` method
6. Add `set_tenant_override(tenant_id, tier, limits)` method

## Related Code Files
- **Create:** `migrations/00X_add_rate_limit_tables.sql`
- **Create:** `src/db/tier_config_repository.py`
- **Create:** `src/db/tenant_rate_limit_repository.py`
- **Modify:** `src/lib/tier_config.py` (use DB repo instead of hardcoded)

## Todo List
- [ ] Create migration SQL file
- [ ] Add seed data for 4 tiers
- [ ] Create tier_config_repository.py
- [ ] Create tenant_rate_limit_repository.py
- [ ] Update TierConfig to use database
- [ ] Run migration on dev database

## Success Criteria
- `SELECT * FROM tier_configs` returns 4 rows
- Tenant overrides correctly cascade over tier defaults
- Repository methods have 100% test coverage

## Risk Assessment
- **Risk:** Database downtime affects rate limiting
- **Mitigation:** Fallback to hardcoded defaults on DB error

## Next Steps
→ Phase 4: Runtime tier detection from requests
