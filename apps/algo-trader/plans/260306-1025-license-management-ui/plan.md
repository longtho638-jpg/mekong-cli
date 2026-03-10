---
title: "ROIaaS PHASE 2 — LICENSE UI Implementation"
description: Admin dashboard for license management with CRUD operations, audit logs, and usage analytics
status: pending
priority: P1
effort: 8h
branch: master
tags: [raas, license, ui, admin, dashboard]
created: 2026-03-06
---

# ROIaaS PHASE 2 — LICENSE UI Implementation Plan

## Overview

Build admin dashboard for RaaS license management with CRUD operations, audit log viewer, and usage analytics.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Dashboard (Vite)                        │
├─────────────────────────────────────────────────────────────────┤
│  /licenses           LicensePage                                 │
│  ├─ LicenseList     → Table with all licenses                   │
│  ├─ CreateLicense   → Modal/form for key generation             │
│  ├─ AuditLogViewer  → Timeline of license events                │
│  └─ UsageAnalytics  → Quota charts & metrics                     │
└─────────────────────────────────────────────────────────────────┘
                          ↕ API calls
┌─────────────────────────────────────────────────────────────────┐
│                    Fastify API (Existing)                        │
├─────────────────────────────────────────────────────────────────┤
│  GET    /api/v1/licenses           → List all licenses          │
│  GET    /api/v1/licenses/:id       → Get single license         │
│  POST   /api/v1/licenses           → Create license key         │
│  PATCH  /api/v1/licenses/:id/revoke → Revoke license            │
│  DELETE /api/v1/licenses/:id       → Delete license             │
│  GET    /api/v1/licenses/:id/audit → Audit logs                │
│  GET    /api/v1/licenses/analytics → Usage analytics (NEW)      │
└─────────────────────────────────────────────────────────────────┘
                          ↕ DB queries
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL (Prisma)                           │
├─────────────────────────────────────────────────────────────────┤
│  License              → id, key, tier, status, tenantId, ...    │
│  LicenseAuditLog      → id, licenseId, event, metadata, ...     │
└─────────────────────────────────────────────────────────────────┘
```

## Phases

| Phase | Task | Complexity | Dependencies |
|-------|------|------------|--------------|
| 1 | API Enhancement: Usage Analytics Endpoint | SIMPLE | None |
| 2 | Dashboard Routing & Shell Integration | SIMPLE | Phase 1 |
| 3 | License List Component (Table View) | MODERATE | Phase 2 |
| 4 | Create License Modal (Key Generation) | SIMPLE | Phase 3 |
| 5 | Audit Log Viewer Component | MODERATE | Phase 3 |
| 6 | Usage Analytics Dashboard | COMPLEX | Phase 1, 3 |
| 7 | Integration Tests & E2E Validation | MODERATE | Phase 3-6 |

## File Organization

```
plans/260306-1025-license-management-ui/
├── plan.md                                    # This file
├── phase-01-api-analytics-endpoint.md         # GET /api/v1/licenses/analytics
├── phase-02-dashboard-routing.md              # Add /licenses route
├── phase-03-license-list-component.md         # License table with filters
├── phase-04-create-license-modal.md           # Key generation form
├── phase-05-audit-log-viewer.md               # Audit timeline component
├── phase-06-usage-analytics-dashboard.md      # Quota charts & metrics
└── phase-07-integration-tests.md              # E2E test coverage
```

## Dependencies

- Existing: `src/api/routes/license-management-routes.ts` (admin routes ready)
- Existing: `src/db/queries/license-queries.ts` (Prisma queries ready)
- Existing: `src/lib/license-usage-analytics.ts` (analytics singleton ready)
- Existing: `dashboard/src/components/*` (UI component patterns)
- Existing: `dashboard/src/hooks/use-api-client.ts` (API hook)

## Success Criteria

1. ✅ Admin can view all licenses in sortable/filterable table
2. ✅ Admin can create new license keys (UUID format, tier selection)
3. ✅ Admin can revoke/deactivate licenses with reason
4. ✅ Admin can view audit logs per license (timeline view)
5. ✅ Admin can view usage analytics (quota consumption charts)
6. ✅ All operations logged to audit trail
7. ✅ RBAC enforced (admin-only access)

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| API endpoint conflicts | Use `/api/v1/licenses/*` prefix consistently |
| UI component complexity | Reuse existing patterns from `PositionsTableSortable` |
| Auth/RBAC integration | Leverage existing `requireAdmin` middleware |
| Usage analytics performance | Cache analytics data, limit query range |

## Next Steps

1. Execute Phase 1-7 sequentially
2. Test with real license data
3. Verify RBAC enforcement
4. Document in `docs/` directory

## Unresolved Questions

- None at this time
