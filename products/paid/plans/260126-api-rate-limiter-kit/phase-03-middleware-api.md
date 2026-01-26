# Phase 3: Middleware & API

**Status**: In Progress
**Goal**: Implement global middleware for broad protection and APIs to manage dynamic rules and view statistics.

## Steps

1. **Dynamic Rule Engine**
   - Create a `RuleService` to store and retrieve rate limit rules in Redis (e.g., `rate_limit:rules`).
   - Structure: `path:method` -> `{limit, window, strategy}`.

2. **Global Middleware**
   - Create `GlobalRateLimitMiddleware` (ASGI middleware).
   - It intercepts every request.
   - Checks if a specific rule exists for `request.url.path` + `request.method`.
   - If yes, applies the limit.
   - If no, checks for a global default (optional).

3. **Management API (`/api/v1/admin/rules`)**
   - `GET /`: List all active rules.
   - `POST /`: Create/Update a rule.
   - `DELETE /{path}`: Remove a rule.

4. **Stats API (`/api/v1/admin/stats`)**
   - `GET /realtime`: Retrieve current counters for active rules.
   - Requires iterating over keys or keeping a separate "active keys" set.

## Deliverables
- Functioning Middleware that respects dynamic rules.
- API endpoints to change limits on the fly without restarting.
