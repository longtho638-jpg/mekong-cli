# Mekong CLI API Reference

Gateway server: `uvicorn src.core.gateway:app --host 0.0.0.0 --port 8000`

## Health & Status

### GET /health
Health check endpoint.

```bash
curl http://localhost:8000/health
```

Response:
```json
{"status": "ok", "version": "1.0.0", "engine": "Plan-Execute-Verify"}
```

### GET /consciousness
System consciousness score and health metrics.

```bash
curl http://localhost:8000/consciousness
```

## License Management

### GET /api/v1/license/validate

Validates a license key and returns tier information.

**Request:**
```
GET /api/v1/license/validate
Headers:
  Authorization: Bearer {license_key}
```

**Response:**
```json
{
  "valid": true,
  "tier": "pro",
  "key_id": "mk_abc123",
  "expires_at": "2024-12-31T23:59:59Z",
  "features": [
    "parallel_execution",
    "dag_scheduling",
    "self_healing"
  ],
  "limits": {
    "commands_per_day": 10000,
    "concurrent_steps": 4
  }
}
```

**Response Codes:**
- `200`: Valid license
- `401`: Invalid license
- `403`: Expired license

### GET /api/v1/license/status

Returns the current status and usage information for a license.

**Request:**
```
GET /api/v1/license/status
Headers:
  Authorization: Bearer {license_key}
```

**Response:**
```json
{
  "status": "valid",
  "tier": "pro",
  "key_id": "mk_abc123",
  "usage": {
    "commands_today": 1250,
    "total_commands": 15420,
    "daily_limit": 10000,
    "remaining": 8750
  },
  "features_enabled": {
    "parallel_execution": true,
    "dag_scheduling": true,
    "custom_agents": false,
    "priority_queue": false,
    "self_healing": true,
    "swarm_mode": false
  },
  "limits": {
    "max_concurrent_steps": 4,
    "allowed_profiles": ["simple", "standard", "complex", "parallel", "dag"]
  }
}
```

### GET /api/v1/license/tiers

Retrieves information about available license tiers and their features.

**Request:**
```
GET /api/v1/license/tiers
```

**Response:**
```json
{
  "tiers": [
    {
      "name": "free",
      "display_name": "FREE",
      "price": 0,
      "features": {
        "parallel_execution": false,
        "dag_scheduling": false,
        "custom_agents": false,
        "priority_queue": false,
        "self_healing": false,
        "swarm_mode": false
      },
      "limits": {
        "commands_per_day": 100,
        "max_concurrent_steps": 1,
        "allowed_profiles": ["simple"]
      }
    },
    {
      "name": "pro",
      "display_name": "PRO",
      "price": 49,
      "features": {
        "parallel_execution": true,
        "dag_scheduling": true,
        "custom_agents": false,
        "priority_queue": false,
        "self_healing": true,
        "swarm_mode": false
      },
      "limits": {
        "commands_per_day": 10000,
        "max_concurrent_steps": 4,
        "allowed_profiles": ["simple", "standard", "complex", "parallel", "dag"]
      }
    },
    {
      "name": "enterprise",
      "display_name": "ENTERPRISE",
      "price": 499,
      "features": {
        "parallel_execution": true,
        "dag_scheduling": true,
        "custom_agents": true,
        "priority_queue": true,
        "self_healing": true,
        "swarm_mode": true
      },
      "limits": {
        "commands_per_day": -1,
        "max_concurrent_steps": 16,
        "allowed_profiles": ["simple", "standard", "complex", "parallel", "dag", "custom_agent", "priority", "swarm"]
      }
    }
  ]
}
```

### GET /api/v1/license/usage

Retrieves detailed usage information for a license key.

**Request:**
```
GET /api/v1/license/usage
Headers:
  Authorization: Bearer {license_key}
Query Params:
  - days: Number of days to look back (default: 30)
```

**Response:**
```json
{
  "key_id": "mk_abc123",
  "tier": "pro",
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "days": 30
  },
  "usage": {
    "commands_today": 1250,
    "total_commands": 15420,
    "daily_limit": 10000,
    "remaining": 8750,
    "max_concurrent_steps_used": 3
  },
  "breakdown": [
    {
      "date": "2024-01-31",
      "commands": 1250,
      "payload_size_bytes": 1234567
    },
    {
      "date": "2024-01-30",
      "commands": 980,
      "payload_size_bytes": 987654
    }
  ]
}
```

### POST /api/v1/license/usage/reset

Resets usage counters for a license key (admin only).

**Request:**
```
POST /api/v1/license/usage/reset
Headers:
  Authorization: Bearer {license_key}
  Content-Type: application/json
Body:
  {
    "reason": "Monthly reset"
  }
```

**Response:**
```json
{
  "success": true,
  "message": "Usage counters reset successfully",
  "reset_date": "2024-02-01T10:30:00Z"
}
```

## Command Execution

### POST /cmd
Execute a Plan-Execute-Verify pipeline.

```bash
curl -X POST http://localhost:8000/cmd \
  -H "Content-Type: application/json" \
  -d '{"goal": "Create CRUD API", "token": "your-api-token"}'
```

Request body:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `goal` | string | yes | High-level goal to execute |
| `token` | string | yes | API authentication token (`MEKONG_API_TOKEN` env var) |

### WebSocket /ws
Real-time streaming execution via WebSocket.

```javascript
const ws = new WebSocket("ws://localhost:8000/ws");
ws.send(JSON.stringify({goal: "Run tests", token: "your-token"}));
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

## AGI Daemon

### GET /api/agi/health
Proxy to Tôm Hùm daemon health endpoint (port 9090).

```bash
curl http://localhost:8000/api/agi/health
```

### GET /api/agi/metrics
Proxy to Tôm Hùm daemon metrics.

```bash
curl http://localhost:8000/api/agi/metrics
```

## Projects

### GET /projects
List available projects in the monorepo.

```bash
curl http://localhost:8000/projects
```

### GET /presets
List preset action templates.

```bash
curl http://localhost:8000/presets
```

## Swarm (Multi-Node)

### POST /swarm/register
Register a new swarm node.

### GET /swarm/nodes
List registered nodes.

### POST /swarm/dispatch
Dispatch task to a swarm node.

### DELETE /swarm/nodes/{node_id}
Remove a node from swarm.

## Scheduler

### POST /schedule/add
Add a scheduled job.

### GET /schedule/jobs
List scheduled jobs.

### DELETE /schedule/jobs/{job_id}
Remove a scheduled job.

## Governance

### POST /governance/check
Check if a goal passes governance rules.

### GET /governance/audit
View governance audit log.

## Authentication

All `/cmd` and `/ws` endpoints require a `token` field matching the `MEKONG_API_TOKEN` environment variable. Health endpoints (`/health`, `/consciousness`, `/projects`, `/presets`) are public.

## Dashboard

### GET /
HTML dashboard with live WebSocket log, preset buttons, and project selector. Access at `http://localhost:8000/`.
