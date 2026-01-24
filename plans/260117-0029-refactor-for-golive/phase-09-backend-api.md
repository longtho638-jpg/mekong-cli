# Phase 9: Backend API Layer Refactoring

## Context
- **Plan**: Refactor for Go-Live
- **Goal**: Refactor `backend/api/*` to follow modern FastAPI best practices, ensure type safety, and align with `antigravity/core` logic.
- **Reference**: `docs/architecture-alignment-map.md`

## Objectives
1.  **Router Standardization**: Ensure all routers use `APIRouter` with consistent prefixes and tags.
2.  **Dependency Injection**: Use `Depends()` for service injection instead of global singletons where appropriate.
3.  **Type Safety**: Ensure all endpoints have Pydantic response models.
4.  **Error Handling**: Standardize error responses (HTTPException vs JSONResponse).
5.  **Security**: Verify RBAC decorators (`require_operator`, `require_viewer`) are correctly applied.

## Tasks

### 9.1 Analysis & Discovery
- [ ] Scan `backend/api/` for all router files.
- [ ] Identify endpoints missing response models.
- [ ] Identify endpoints using direct global imports instead of dependency injection.

### 9.2 Router Refactoring
- [ ] **Swarm Router**: Review `backend/api/routers/swarm.py` (already touched in Phase 8, ensure it's fully standardized).
- [ ] **Revenue Router**: Refactor/Create `backend/api/routers/revenue.py` to use `RevenueEngine`.
- [ ] **Ops Router**: Refactor/Create `backend/api/routers/ops.py` to use `OpsEngine`.
- [ ] **Health Router**: Ensure standard health checks in `backend/api/routers/health.py`.

### 9.3 Main App Standardization
- [ ] Review `backend/main.py` (or `backend/api/main.py`) for middleware configuration and router inclusion.
- [ ] Ensure CORS and Security headers are best-practice.

### 9.4 Testing
- [ ] Run integration tests for API endpoints.
- [ ] Verify OpenAPI schema generation (`/docs`).

## Deliverables
- Standardized `backend/api/` structure.
- Fully typed API endpoints.
- 100% passing API integration tests.
