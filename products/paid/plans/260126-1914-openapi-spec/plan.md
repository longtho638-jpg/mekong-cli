# Plan: OpenAPI Spec + E2E Type Tests

## Context
- **Goal**: Enable OpenAPI spec in FastAPI backend, generate TypeScript client, and add E2E type tests.
- **Backend**: FastAPI (likely `products/multi-tenant-saas-kit/backend` or similar).
- **Frontend**: TypeScript (likely `apps/dashboard` inside `saas-starter-kit-bundle` or root).

## Phases

### Phase 1: Exploration & Setup
- [ ] Identify the correct backend `main.py` file.
- [ ] Identify the correct frontend dashboard directory.
- [ ] Verify current state of OpenAPI in backend.

### Phase 2: Backend Implementation
- [ ] Modify `main.py` to enable OpenAPI with "AgencyOS API" title.
- [ ] Ensure `/docs` and `/redoc` are enabled.
- [ ] Verify OpenAPI JSON output.

### Phase 3: Client Generation
- [ ] Create `scripts/generate-api-client.sh`.
- [ ] Install `openapi-typescript-codegen` if needed (or use npx).
- [ ] Generate client code.

### Phase 4: E2E Testing
- [ ] Create `tests/integration/api-types.test.ts`.
- [ ] Implement type validation test.
- [ ] Run test to verify.

## Questions
- [ ] Where exactly are `backend` and `apps/dashboard` located?
