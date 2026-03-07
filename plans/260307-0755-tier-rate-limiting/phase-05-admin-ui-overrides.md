---
phase: 5
title: "Admin UI for Overrides"
effort: 2h
---

# Phase 5: Admin UI for Overrides

## Context Links
- Depends on: Phase 3 (DB schema)
- Related: `src/commands/license_admin.py` (existing admin CLI)

## Overview
**Priority:** P1 | **Status:** ✅ Complete (2026-03-07)

CLI and Web UI for managing custom rate limits per tenant.

## Requirements

### Functional
- CLI: `mekong tier-admin list` - Show all tier configs
- CLI: `mekong tier-admin get <tier>` - Show tier details
- CLI: `mekong tier-admin set <tenant> <limits>` - Set custom override
- Web UI: Form to set custom limits per tenant
- Web UI: List of all tenant overrides

### Non-functional
- CLI commands <1s response time
- Web UI form validation
- Audit log for all changes

## Architecture

### CLI Commands
```bash
mekong tier-admin list                    # List all tier configs
mekong tier-admin get pro                 # Get PRO tier details
mekong tier-admin set tenant-123 --requests-per-hour=5000
mekong tier-admin remove tenant-123       # Remove custom override
```

### Web UI Endpoints
```python
GET  /admin/rate-limits/tiers             # List tier configs
GET  /admin/rate-limits/tenants           # List tenant overrides
POST /admin/rate-limits/tenants/{id}      # Set custom override
DELETE /admin/rate-limits/tenants/{id}    # Remove override
```

## Implementation Steps

### CLI (1h)
1. Create `src/commands/tier_admin.py`
2. Implement `list_tiers()` command
3. Implement `get_tier(tier_name)` command
4. Implement `set_tenant_override(tenant_id, limits)` command
5. Implement `remove_tenant_override(tenant_id)` command
6. Register commands in `src/main.py`

### Web UI (1h)
1. Add routes to `src/api/routes/admin_routes.py`
2. Create admin form component for rate limit overrides
3. Add tier config display table
4. Add tenant override list with edit/delete actions
5. Add form validation (positive integers only)

## Related Code Files
- **Create:** `src/commands/tier_admin.py`
- **Modify:** `src/main.py` (register CLI commands)
- **Create:** `src/api/routes/admin_rate_limits.py`
- **Modify:** Existing admin UI components (add rate limits section)

## Todo List
- [x] Create tier_admin.py CLI module
- [x] Implement list command
- [x] Implement get command
- [x] Implement set command
- [x] Implement override command
- [x] Implement overrides list command
- [x] Implement remove-override command
- [x] Add admin API routes (`src/api/tier_config_routes.py`)
- [ ] Create admin UI form component (Phase 5b - Web UI separate)
- [ ] Add form validation
- [x] Test CLI commands
- [ ] Test Web UI flows

## Success Criteria
- [x] `mekong tier-admin list` shows all 4 tiers
- [x] `mekong tier-admin get <tier>` shows tier config
- [x] `mekong tier-admin set <tier> <preset> <limit> <window>` updates config
- [x] `mekong tier-admin override <tenant> <preset> <limit> <window>` creates override
- [x] `mekong tier-admin overrides` lists all overrides
- [x] `mekong tier-admin remove-override <tenant> <preset>` removes override
- [x] API routes created in `src/api/tier_config_routes.py`
- [ ] Admin UI form saves overrides correctly (Phase 5b - Web UI pending)
- [ ] All changes logged to audit trail

## Implementation Summary

### CLI (`src/commands/tier_admin.py`)
Created `tier-admin` Typer app with commands:
- `list` - Shows all tier configs (falls back to defaults if DB unavailable)
- `get <tier>` - Shows config for specific tier
- `set <tier> <preset> <limit> [window]` - Updates tier config in DB
- `override <tenant> <preset> <limit> [window] [--tier]` - Creates tenant override
- `overrides [--tenant]` - Lists all tenant overrides
- `remove-override <tenant> <preset>` - Removes tenant override

### API (`src/api/tier_config_routes.py`)
Created FastAPI router with endpoints:
- `GET /api/tier-configs` - List all configs
- `GET /api/tier-configs/{tier}` - Get tier config
- `PUT /api/tier-configs/{tier}/{preset}` - Update config
- `GET /api/tenant-overrides` - List overrides
- `POST /api/tenant-overrides` - Create override
- `DELETE /api/tenant-overrides/{tenant_id}/{preset}` - Remove override

### Files Modified
- **Created:** `src/commands/tier_admin.py` (CLI commands)
- **Created:** `src/api/tier_config_routes.py` (API routes)
- **Modified:** `src/main.py` (register tier-admin command)
- **Modified:** `src/core/gateway/gateway_main.py` (mount API router)

## Risk Assessment
- **Risk:** Admin accidentally setting 0 limits (lockout)
- **Mitigation:** Form validation with minimum values

## Next Steps
→ Phase 6: Comprehensive testing
