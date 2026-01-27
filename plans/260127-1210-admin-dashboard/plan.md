# Admin Dashboard Implementation Plan (IPO-011)

**Status**: In Progress
**Start Date**: 2026-01-27
**Owner**: Antigravity (Fullstack Developer)

## Overview
Build a comprehensive Admin Dashboard for staff to manage users, view analytics, configure system settings, and audit actions. This aligns with Binh Pháp Ch.3 (Win-Without-Fighting) by providing control and observability without user disruption.

## Phases

### [ ] Phase 1: Database Schema & Backend Core
**Goal**: Establish data structures for admin operations and enhance RBAC.
- [ ] Create migration: `admin_roles`, `admin_permissions`, `feature_flags`.
- [ ] Update `backend/core/security/rbac.py` for granular permissions.
- [ ] Create SQLAlchemy models for new tables.

### [ ] Phase 2: Admin API Endpoints
**Goal**: Expose necessary data and actions via secure APIs.
- [ ] `GET /admin/users` & `POST /admin/users` (User Mgmt).
- [ ] `GET /admin/audit` (Audit Logs).
- [ ] `GET /admin/config` & `POST /admin/config` (System Config).
- [ ] `GET /admin/stats` (Aggregated Analytics).

### [ ] Phase 3: Frontend Implementation (Next.js)
**Goal**: Build the UI in `apps/admin` (or `apps/dashboard` with admin route).
*Note: We will implement this inside `apps/dashboard` under `/admin` route to reuse existing components/auth, unless `apps/admin` is a strict requirement for separation. Given existing structure, `/admin` in `apps/dashboard` is simpler (KISS).*
- [ ] Admin Layout & Sidebar.
- [ ] Dashboard Overview (Analytics Widgets).
- [ ] User Management Page (Data Table + Actions).
- [ ] System Config Page (Feature Flags Toggles).
- [ ] Audit Log Viewer.

### [ ] Phase 4: Testing & Documentation
**Goal**: Ensure reliability and usability.
- [ ] Unit tests for Admin Services.
- [ ] Integration tests for Admin APIs.
- [ ] Write `docs/admin-dashboard-guide.md`.

## Key Dependencies
- `backend/api/routers/revenue.py` (Existing Revenue API).
- `backend/core/security/rbac.py` (RBAC).
- `supabase/migrations/*` (DB Schema).

## Win-Win-Win Verification
- **Owner**: Control & Compliance.
- **Agency**: Reusable asset.
- **Client**: Better support & stability.
