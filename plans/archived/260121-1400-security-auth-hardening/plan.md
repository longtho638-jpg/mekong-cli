# Phase 16: Security & Auth Hardening

**Status**: Planned
**Priority**: P1
**Goal**: Secure the AgencyOS Engine with authentication, authorization, and audit logging to prepare for multi-user production usage.

## Context
While we have a robust engine and UI, the current implementation lacks strong authentication for the new WebSocket endpoints and granular control over Swarm actions. We need to lock down the system before exposing it further.

## Objectives

1.  **Authentication (JWT)**
    - [ ] Implement JWT token generation and verification logic in `backend/api/security/auth.py`.
    - [ ] Secure WebSocket endpoint `ws://.../swarm/ws` with token auth.
    - [ ] Add `Login` page to Dashboard and handle token storage.

2.  **Authorization (RBAC)**
    - [ ] Define roles: `ADMIN`, `OPERATOR`, `VIEWER`.
    - [ ] Protect sensitive endpoints (e.g., `dispatch_task`, `create_agent`) with role checks.
    - [ ] Update `SwarmOrchestrator` to enforce permissions on actions.

3.  **Audit Logging**
    - [ ] Implement `AuditLogger` to record:
        - User logins/logouts.
        - Task dispatches.
        - Agent state changes.
        - System configuration changes.
    - [ ] Store audit logs in a persistent store (File/DB).
    - [ ] Add "Audit Log" view to Dashboard.

4.  **Rate Limiting**
    - [ ] Implement rate limiting for API endpoints (e.g., 100 req/min for standard users).

## Execution Plan

### Step 1: Authentication Infrastructure
- [ ] Install `python-jose`, `passlib`, `python-multipart`.
- [ ] Create `backend/api/auth/` module.
- [ ] Implement login endpoint `/api/auth/token`.
- [ ] Create `get_current_user` dependency.

### Step 2: Secure WebSockets
- [ ] Update `ConnectionManager` to validate tokens on connect.
- [ ] Update Frontend `useSwarmSocket` to send token.

### Step 3: RBAC & Audit
- [ ] Create `AuditLogger` service.
- [ ] Add middleware/dependency for RBAC checks.
- [ ] Instrument `SwarmOrchestrator` with audit logging.

### Step 4: UI Updates
- [ ] Create Login screen.
- [ ] Add `AuthContext` to React app.
- [ ] Create Audit Log page.

## Deliverables
- Secured API & WebSockets.
- Login Interface.
- Audit Log System.
