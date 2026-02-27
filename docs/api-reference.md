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
