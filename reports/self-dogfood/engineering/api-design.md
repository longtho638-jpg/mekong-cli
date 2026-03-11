# OpenAPI Spec Design — RaaS Gateway
**Date:** 2026-03-11 | **Version:** v1.0 | **Base URL:** `http://localhost:8000`

---

## Authentication

All endpoints except `/health` require:
```
Authorization: Bearer $MEKONG_API_TOKEN
```

HTTP 402 returned when MCU balance = 0.

---

## 7 Core Endpoints

### 1. Health Check
```
GET /health
```
**Response 200:**
```json
{ "status": "ok", "version": "5.0.0" }
```

---

### 2. Execute Goal (Primary)
```
POST /cmd
```
**Request:**
```json
{
  "goal": "Deploy app to production",
  "strict": true,
  "enable_rollback": true,
  "dry_run": false
}
```
**Response 200:**
```json
{
  "status": "success",
  "goal": "Deploy app to production",
  "total_steps": 5,
  "completed_steps": 5,
  "failed_steps": 0,
  "success_rate": 1.0,
  "errors": [],
  "warnings": [],
  "steps": [
    {
      "order": 1,
      "title": "Run tests",
      "passed": true,
      "exit_code": 0,
      "summary": "All 42 tests passed"
    }
  ],
  "mcu_charged": 1
}
```
**Response 402:** MCU balance exhausted.
**Response 401:** Invalid or missing token.

---

### 3. List Preset Actions
```
GET /presets
```
**Response 200:**
```json
[
  {
    "id": "daily-deploy",
    "icon": "🚀",
    "label": "Daily Deploy",
    "goal": "Run tests, lint, deploy to production"
  }
]
```

---

### 4. Execute Preset
```
POST /cmd/preset
```
**Request:**
```json
{ "preset_id": "daily-deploy" }
```
**Response:** Same as `/cmd`.

---

### 5. System Status (AGI Health)
```
GET /status
```
**Response 200:**
```json
{
  "consciousness_score": 78,
  "subsystems": {
    "nlu": "healthy",
    "memory": "healthy",
    "reflection": "healthy",
    "world_model": "healthy",
    "tool_registry": "healthy",
    "browser_agent": "degraded",
    "collaboration": "healthy",
    "code_evolution": "healthy",
    "vector_memory": "healthy"
  },
  "halted": false,
  "version": "5.0.0"
}
```

---

### 6. Execution Memory
```
GET /memory?limit=20
```
**Response 200:**
```json
{
  "total": 142,
  "success_rate": 0.87,
  "entries": [
    {
      "goal": "Deploy app",
      "status": "success",
      "duration_ms": 3420,
      "recipe_used": "deploy-standard",
      "timestamp": "2026-03-11T14:22:00Z"
    }
  ]
}
```

---

### 7. Swarm Node Dispatch
```
POST /swarm/dispatch
```
**Request:**
```json
{
  "node_id": "node-abc123",
  "goal": "Run integration tests on staging"
}
```
**Response 200:**
```json
{
  "status": "success",
  "node": "staging-server",
  "goal": "Run integration tests",
  "completed_steps": 3,
  "total_steps": 3
}
```

---

## Error Responses

| Code | Meaning |
|------|---------|
| 400 | Invalid request body |
| 401 | Missing/invalid token |
| 402 | MCU balance = 0 |
| 500 | Orchestration failed |

---

## MCU Billing Model

- 1 MCU deducted per successful `/cmd` or `/cmd/preset` execution
- Preset actions: `/presets`, `/status`, `/memory`, `/health` — free (0 MCU)
- Swarm dispatch: 1 MCU per remote node execution

---

## Implementation Notes

- Gateway implemented in `src/gateway.py`
- Auth middleware: `src/middleware/auth_middleware.py`
- Rate limiting: `src/lib/tier_rate_limit_middleware.py`
- Framework: FastAPI + uvicorn
