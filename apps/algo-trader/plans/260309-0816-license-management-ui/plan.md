---
title: "License Management UI"
description: "Activate/revoke licenses, display usage quotas, RaaS Gateway integration"
status: in_progress
priority: P2
effort: 6h
branch: master
tags: [license, ui, raas-gateway, dashboard]
created: 2026-03-09
updated: 2026-03-09T08:45:00+07:00
---

# License Management UI Implementation Plan

## Overview

Phase 2: License Management UI với RaaS Gateway integration.
Phase 6: License Activation Flow - Activate licenses via RaaS Gateway Cloudflare Worker.

## Phases

| Phase | Status | File |
|-------|--------|------|
| 1. Backend Schema Updates | ✅ Complete | [phase-01-implement.md](./phase-01-implement.md#step-1-backend-schema-updates) |
| 2. Frontend Hook Updates | ✅ Complete | [phase-01-implement.md](./phase-01-implement.md#step-2-frontend-hook-updates) |
| 3. API Client JWT Support | ✅ Complete | [phase-01-implement.md](./phase-01-implement.md#step-3-api-client-jwt-support) |
| 4. Activate License Modal | ✅ Complete | [phase-01-implement.md](./phase-01-implement.md#step-4-create-activate-license-modal) |
| 5. License List Table Updates | ✅ Complete | [phase-01-implement.md](./phase-01-implement.md#step-5-update-license-list-table) |
| 6. License Page Integration | ✅ Complete | [phase-01-implement.md](./phase-01-implement.md#step-6-update-license-page) |
| 7. RaaS Gateway Cloudflare Worker | ⏳ Pending | phase-06-raas-gateway-worker.md |
| 8. Activate Button UI Flow | ⏳ Pending | phase-06-raas-gateway-worker.md |

## Dependencies

- **RaaS Gateway KV Client** - Đã tồn tại (`src/lib/raas-gateway-kv-client.ts`)
- **License Management Routes** - Đã tồn tại (`src/api/routes/license-management-routes.ts`)
- **Existing UI Components** - `license-page.tsx`, `license-list-table.tsx`, `use-licenses.ts`
- **RaaS Gateway Cloudflare Worker** - Cần implement endpoint `/v2/license/activate`

## Success Criteria

- [x] License list shows domain column
- [x] Activate modal validates license key via RaaS Gateway
- [x] JWT stored and used for API calls
- [x] Revoke updates UI immediately
- [x] Overage status visible when configured
- [ ] Activate button appears when license key detected but not activated
- [ ] POST to /v2/license/activate on Cloudflare Worker with mk_ API key
- [ ] Stripe/Polar webhook-synced data validation in KV
- [ ] All TypeScript compile (0 errors)
- [ ] No console.log/errors in production code

## Reports

| Report | Path |
|--------|------|
| Implementation Report | `reports/planner-260309-0816-license-mgmt.md` |

## Unresolved Questions

1. **Domain validation:** Có cần validate domain format (regex) không?
2. **JWT expiration:** Nên set bao lâu? (đang đề xuất 24h)
3. **Multiple activations:** 1 license key có thể activate nhiều domains không?
4. **RaaS Gateway URL:** Cần confirm `raas.agencyos.network` hay local endpoint?
