# Engineering: API Documentation — Mekong CLI v5.0

## Command: /docs
## Date: 2026-03-11

---

## Source File: src/gateway.py (430 lines)

FastAPI server v3.3.0 — "Mekong CLI Gateway API". Exposes 7 endpoints documented below.

---

## Endpoint Inventory

### 1. POST /v1/missions
- **Auth:** none (tenant_id in body)
- **Request:** `CreateMissionRequest` — goal, tenant_id, webhook_url?, priority, metadata
- **Response:** `CreateMissionResponse` — mission_id, status, created_at, estimated_steps, stream_url
- **Behavior:** Stores mission in `MISSION_STORE` dict, launches `_run_hybrid_router` as FastAPI BackgroundTask
- **Webhook:** Sends `mission.created` if webhook_url provided
- **Issue:** No auth on this endpoint — any caller can create missions with arbitrary tenant_id

### 2. GET /v1/missions/{mission_id}
- **Auth:** none
- **Response:** `MissionStatusResponse` — full mission state including steps_completed, steps_total
- **Behavior:** Reads from in-memory MISSION_STORE
- **Issue:** steps_completed is computed at read time from step list, not persisted counter

### 3. GET /v1/missions/{mission_id}/stream
- **Auth:** none
- **Response:** SSE stream, `text/event-stream`
- **Behavior:** Polls MISSION_STORE every 500ms via `asyncio.sleep(0.5)` loop
- **Events emitted:** mission.state (initial), mission.step.* (from events list), mission.completed/failed
- **Headers:** Cache-Control: no-cache, Connection: keep-alive, X-Accel-Buffering: no
- **Issue:** Polling loop at 500ms is inefficient — should use asyncio.Queue or event-driven pub/sub

### 4. POST /v1/webhook/test
- **Auth:** none
- **Request:** `TestWebhookRequest` — webhook_url, tenant_id?
- **Response:** `TestWebhookResponse` — success, message, status_code, response_time_ms
- **Behavior:** Calls `validate_webhook_url()` from gateway_api module, measures elapsed ms
- **Status code parsing:** Brittle — splits message string to extract int

### 5. GET /v1/webhook/schema
- **Auth:** none
- **Response:** JSON dict with version, events (name→model_class), descriptions
- **Behavior:** Reads `WEBHOOK_EVENT_PAYLOADS` dict + `get_webhook_schema()` call
- **Version:** Hardcoded "3.3.0" — should come from app version constant

### 6. POST /v1/mcu/deduct
- **Auth:** none
- **Request:** `MCUDeductRequest` — tenant_id, complexity (simple|standard|complex), mission_id
- **Response:** `MCUDeductResponse` — success, balance_before, balance_after, amount_deducted, low_balance
- **Costs:** simple=1 MCU, standard=3 MCU, complex=5 MCU
- **Error:** HTTP 402 on zero balance (correct per billing spec)
- **Issue:** No X-API-Key auth — billing endpoint fully open

### 7. GET /health
- **Auth:** none
- **Response:** `{"status": "healthy", "timestamp": ..., "version": "3.3.0"}`
- **Behavior:** Simple dict return, no dependency checks (DB, LLM, etc.)
- **Issue:** Not a true health check — doesn't verify subsystem status

---

## RaaS Router
- `raas_router` is mounted via `app.include_router(raas_router)` at line 59
- Additional endpoints from `src/raas/missions_api_router.py` are included but not documented here

---

## CORS Configuration
- `allow_origins=["*"]` — open CORS for all origins
- `allow_credentials=True` with wildcard origins is a security misconfiguration (browsers block this)
- Should be restricted to agencyos.network in production

---

## In-Memory State Problem
- `MISSION_STORE: dict[str, dict] = {}` is process-local
- Restarts lose all mission state
- Multiple replicas cannot share state
- Fix: Redis or PostgreSQL-backed store

---

## Missing Endpoints vs Spec
- CLAUDE.md lists 6 endpoints; gateway.py implements 7 (MCU deduct is extra)
- POST /v1/mcu/deduct not in module docstring (lines 8-15) — docs drift

---

## Recommendations
1. Add X-API-Key auth to all endpoints (pattern exists via `_validate_api_key` but unused)
2. Fix CORS: restrict allow_origins to known domains
3. Replace MISSION_STORE with Redis-backed store for horizontal scaling
4. Replace 500ms polling loop with asyncio.Queue for SSE events
5. Add real subsystem checks to /health endpoint
6. Harden status_code parsing in webhook test endpoint
7. Sync module docstring to include /v1/mcu/deduct

---

## Summary
- 7 endpoints total (6 documented + 1 undocumented MCU)
- All endpoints lack authentication except the unused `_validate_api_key` helper
- In-memory MISSION_STORE is the single biggest scalability bottleneck
- SSE polling loop at 500ms creates N×0.5s overhead per concurrent stream
