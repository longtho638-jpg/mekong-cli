# Phase 4: Admin Dashboard

**Status**: In Progress
**Goal**: Build the React UI to view status and manage rate limit rules.

## Steps

1. **API Client**
   - Setup Axios instance in `dashboard/src/lib/api.ts`.
   - Define types matching the backend models.

2. **Rule Management UI**
   - List of Rules Table (Path, Method, Limit, Window, Strategy, Actions).
   - "Add Rule" Modal/Form.
   - Delete Rule button.

3. **Status Integration**
   - Connect the status card in `App.tsx` to the real backend health check.
   - (Optional) Poll for real-time stats if Stats API is ready.

## Deliverables
- Fully functional dashboard to Create/Read/Delete rate limit rules.
- Changes in dashboard immediately reflect in API behavior.
