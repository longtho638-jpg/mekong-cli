# RaaS API Documentation
Generated: 2026-03-11

## Base URL
```
https://agencyos-gateway.fly.dev
```

## Authentication
All endpoints require `Authorization: Bearer <token>` header.

Accepted token formats:
- `mk_<base64>` — API key (looked up in DB)
- `eyJ...` — JWT signed by gateway

---

## Endpoints

### 1. POST /v1/tasks
Submit a goal for execution.

**Request**
```json
{
  "goal": "Create a FastAPI endpoint with auth",
  "agent": "git",           // optional: preferred agent
  "recipe": "recipes/api.yaml", // optional: direct recipe path
  "options": {}             // optional: orchestrator flags
}
```

**Response** `202 Accepted`
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "tenant_id": "tenant_abc123"
}
```

**Errors**
- `401` — missing/invalid Bearer token
- `402` — insufficient credits (MCU balance = 0)
- `422` — invalid request body (goal empty)

---

### 2. GET /v1/tasks/{task_id}
Poll full status and results for a submitted task.

**Path param:** `task_id` — UUID from POST /v1/tasks response

**Response** `200 OK`
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "success",
  "goal": "Create a FastAPI endpoint with auth",
  "tenant_id": "tenant_abc123",
  "total_steps": 4,
  "completed_steps": 4,
  "failed_steps": 0,
  "success_rate": 1.0,
  "errors": [],
  "warnings": [],
  "steps": [
    {
      "order": 1,
      "title": "Scaffold FastAPI app",
      "passed": true,
      "exit_code": 0,
      "summary": "Created src/app.py with FastAPI instance"
    }
  ]
}
```

**Status values:** `pending` | `running` | `success` | `failed` | `partial` | `rolled_back`

**Errors**
- `404` — task not found or belongs to different tenant

---

### 3. GET /v1/tasks/{task_id}/stream
Stream task execution progress as Server-Sent Events.

**Headers required**
```
Accept: text/event-stream
Authorization: Bearer <token>
```

**SSE Event: step**
```
data: {"type":"step","order":1,"title":"Scaffold FastAPI app",
       "passed":true,"exit_code":0,"summary":"Created src/app.py",
       "completed":1,"total":4}
```

**SSE Event: complete**
```
data: {"type":"complete","status":"success","success_rate":1.0,"errors":[]}
```

**SSE Event: error**
```
data: {"type":"error","message":"LLM provider unavailable"}
```

**Response headers**
```
Content-Type: text/event-stream
Cache-Control: no-cache
X-Accel-Buffering: no
```

**Errors**
- `404` — task not found

---

### 4. GET /v1/agents
List all registered agents.

**Response** `200 OK`
```json
[
  {"name": "git", "description": "Git operations agent"},
  {"name": "file", "description": "File read/write agent"},
  {"name": "shell", "description": "Shell command executor"},
  {"name": "recipe_crawler", "description": "Recipe discovery agent"}
]
```

---

### 5. POST /v1/agents/{name}/run
Run a named agent directly (bypasses full orchestrator).

**Path param:** `name` — agent name from GET /v1/agents

**Request**
```json
{
  "goal": "Commit all staged changes with message 'feat: add auth'",
  "options": {}
}
```

**Response** `200 OK`
```json
{
  "agent": "git",
  "status": "success",
  "output": "Committed: abc1234"
}
```

**Errors**
- `404` — agent name not registered. Body includes `"available": [...]`
- `500` — agent execution error with detail message

---

### 6. POST /api/v1/billing/batch (billing_endpoints.py)
Submit batch billing events.

**Request**
```json
{
  "license_key": "mk_...",
  "events": [
    {"mission_id": "uuid", "mcu_used": 3, "tier": "growth"}
  ]
}
```

**Response** `200 OK`
```json
{"processed": 1, "errors": []}
```

---

### 7. POST /webhooks/polar
Polar.sh webhook receiver. HMAC-verified.

**Headers required**
```
webhook-id: <event-id>
webhook-timestamp: <unix-ts>
webhook-signature: <hmac-sha256>
```

**Supported event types**
- `order.paid` — credit top-up, tier upgrade
- `subscription.created`
- `subscription.cancelled`

**Response** `200 OK` on success, `400` on signature failure.
