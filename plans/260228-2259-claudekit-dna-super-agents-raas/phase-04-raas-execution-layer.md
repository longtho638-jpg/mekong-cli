---
phase: 4
title: "RaaS Execution Layer"
status: pending
priority: P2
effort: 5h
depends_on: [phase-01, phase-02]
---

# Phase 4: RaaS Execution Layer

## Context Links

- Phase 1 DNA Standard: [phase-01-agent-dna-standard.md](./phase-01-agent-dna-standard.md)
- Phase 2 Registry: [phase-02-agent-registry-cli.md](./phase-02-agent-registry-cli.md)
- Existing Gateway: `src/core/gateway.py` (FastAPI)
- RaaS Gateway: `apps/raas-gateway/` (Cloudflare Worker)
- PDR: `docs/project-overview-pdr.md` (credits + billing model)
- System Architecture: `docs/system-architecture.md`

## Overview

Wrap Agent Registry trong API layer de cho phep remote execution. v0.1 chi can: REST API list/run agents + execution tracking + credit deduction placeholder. KHONG build full billing — chi interface.

**Tai sao v0.1 don gian:** Billing/auth la domain rieng, khong nen couple voi agent system. Phase nay chi tao API contract + execution wrapper. Billing tich hop sau.

## Key Insights

- `src/core/gateway.py` da co FastAPI server voi auth (MEKONG_API_TOKEN) -> mo rong, khong tao moi
- `apps/raas-gateway/` (Cloudflare Worker) da co API Gateway -> them agent routes
- PDR da dinh nghia credit model (AgencyCoin) -> chi can interface, khong implement full
- Tom Hum da co task dispatch pattern -> agent execution = 1 loai task

## Requirements

### Functional
- FR-RAAS-01: REST API `GET /agents` — list agents tu registry
- FR-RAAS-02: REST API `GET /agents/{name}` — agent detail
- FR-RAAS-03: REST API `POST /agents/{name}/run` — execute agent voi goal
- FR-RAAS-04: REST API `GET /agents/{name}/runs` — execution history
- FR-RAAS-05: Execution tracking: log moi run voi status, duration, result
- FR-RAAS-06: Credit check interface (placeholder): reject neu credits = 0
- FR-RAAS-07: Pricing tier enforcement: free agents luon chay, agency/enterprise check credits

### Non-Functional
- NFR-RAAS-01: API response < 200ms cho list/detail
- NFR-RAAS-02: Execution timeout configurable (default 5 min)
- NFR-RAAS-03: CORS configured cho web clients

## Architecture

### API Endpoints

```
GET  /api/v1/agents                      # List all agents
GET  /api/v1/agents?department=marketing  # Filter by department
GET  /api/v1/agents/{name}               # Agent detail
POST /api/v1/agents/{name}/run           # Execute agent
GET  /api/v1/agents/{name}/runs          # Execution history
GET  /api/v1/agents/{name}/runs/{run_id} # Single run detail
```

### Request/Response Models

```python
# POST /api/v1/agents/{name}/run
class AgentRunRequest(BaseModel):
    goal: str                    # What the agent should do
    params: dict = {}            # Optional extra params
    dry_run: bool = False        # Plan only, no execute

class AgentRunResponse(BaseModel):
    run_id: str                  # UUID
    agent_name: str
    status: str                  # queued | running | success | failed
    goal: str
    created_at: datetime

class AgentRunResult(BaseModel):
    run_id: str
    agent_name: str
    status: str
    goal: str
    output: str | dict | None
    duration_ms: int
    credits_used: int            # 0 for free tier
    created_at: datetime
    completed_at: datetime | None
```

### Execution Wrapper

```python
# src/core/agent_execution.py

class AgentExecutionService:
    """Wraps AgentRegistry.run_agent() with tracking + credits."""

    def __init__(self, registry: AgentRegistry, store: ExecutionStore):
        ...

    async def submit(self, agent_name: str, goal: str) -> AgentRunResponse:
        """Create run record, check credits, start execution."""

    async def get_run(self, run_id: str) -> AgentRunResult | None:
        """Get run status/result."""

    async def list_runs(self, agent_name: str, limit: int = 20) -> list:
        """List recent runs for an agent."""


class ExecutionStore:
    """Persists agent run records. v0.1 = JSON file, v1.0 = PostgreSQL."""

    def __init__(self, store_path: Path = Path(".mekong/agent-runs.json")):
        ...

    def save_run(self, run: AgentRunResult) -> None:
    def get_run(self, run_id: str) -> AgentRunResult | None:
    def list_runs(self, agent_name: str, limit: int) -> list:


class CreditGate:
    """Placeholder credit check. v0.1 = always pass for free tier."""

    def check(self, agent_name: str, manifest: AgentManifest) -> bool:
        """Return True if user has credits (or agent is free tier)."""
        return manifest.pricing_tier == "free"  # v0.1: free = always pass
```

### Integration voi Gateway

```python
# Them vao src/core/gateway.py

from src.core.agent_registry import AgentRegistry
from src.core.agent_execution import AgentExecutionService

# Mount agent routes
@app.get("/api/v1/agents")
async def list_agents(department: str = None):
    ...

@app.get("/api/v1/agents/{name}")
async def get_agent(name: str):
    ...

@app.post("/api/v1/agents/{name}/run")
async def run_agent(name: str, request: AgentRunRequest):
    ...
```

### Tier Model (v0.1 Placeholder)

```
FREE TIER:
  - All agents with pricing_tier="free"
  - Local execution only
  - No credit check
  - Unlimited runs

AGENCY TIER (v1.0 — chua implement):
  - Agency/enterprise agents
  - Managed proxy execution
  - Credit-based billing
  - Execution analytics

ENTERPRISE TIER (v2.0 — chua implement):
  - Custom private agents
  - Dedicated execution environment
  - SLA guarantees
```

## Related Code Files

### Files Can Tao Moi
- `src/core/agent_execution.py` — AgentExecutionService + ExecutionStore + CreditGate
- `tests/test_agent_execution.py` — Unit tests

### Files Can Sua
- `src/core/gateway.py` — Them agent API routes
- `src/core/gateway_config.py` — Them agent-related config

### Directories Can Tao
- `.mekong/` — Execution store directory (neu chua co)

## Implementation Steps

1. **Tao `src/core/agent_execution.py`**
   - ExecutionStore: JSON file-based persistence
   - CreditGate: placeholder (free = always pass)
   - AgentExecutionService: submit(), get_run(), list_runs()
   - Run tracking: run_id (UUID), status, duration, output

2. **Them agent routes vao `src/core/gateway.py`**
   - GET /api/v1/agents — delegate to AgentRegistry.scan()
   - GET /api/v1/agents/{name} — delegate to AgentRegistry.get()
   - POST /api/v1/agents/{name}/run — delegate to AgentExecutionService
   - GET /api/v1/agents/{name}/runs — delegate to ExecutionStore

3. **Them execution tracking vao CLI**
   - `mekong agent run` gio cung luu run record
   - `mekong agent runs <name>` — hien thi execution history

4. **Viet tests**
   - Test execution store CRUD
   - Test credit gate (free = pass, agency = fail without credits)
   - Test API endpoints (TestClient)
   - Test run lifecycle: queued -> running -> success/failed

## Todo List

- [ ] Tao `src/core/agent_execution.py`
- [ ] Them agent API routes vao `src/core/gateway.py`
- [ ] Them `mekong agent runs` CLI command
- [ ] Viet `tests/test_agent_execution.py`
- [ ] Manual test: `curl localhost:8000/api/v1/agents`
- [ ] Manual test: `curl -X POST localhost:8000/api/v1/agents/content-marketer/run`
- [ ] Verify: `python3 -m pytest` — all PASS

## Success Criteria

- [ ] `GET /api/v1/agents` tra ve danh sach agents tu registry
- [ ] `POST /api/v1/agents/content-marketer/run` execute + tra ve run_id
- [ ] `GET /api/v1/agents/content-marketer/runs` tra ve execution history
- [ ] Free tier agents chay khong can credits
- [ ] Agency tier agents bi reject voi "insufficient credits" placeholder
- [ ] Execution records persist qua restart (JSON file)
- [ ] All tests PASS

## Risk Assessment

| Risk | Xac Suat | Anh Huong | Giam Thieu |
|------|---------|-----------|------------|
| Long-running agent execution timeout | Trung binh | Cao | Configurable timeout, async execution |
| Concurrent runs conflict | Thap | Trung binh | File lock cho JSON store, migrate sang DB sau |
| API auth bypass | Thap | Cao | Reuse MEKONG_API_TOKEN tu gateway hien co |

## Security Considerations

- API auth: reuse MEKONG_API_TOKEN (da co trong gateway.py)
- Rate limiting: khong implement v0.1, them v1.0 khi co real users
- Agent execution sandboxed: tools restrict theo manifest
- Run output KHONG chua sensitive data (filter truoc khi store)

## Next Steps

-> Phase 5: Open Source Distribution (package API + CLI cho community)
-> v1.0: PostgreSQL execution store + real credit billing + Polar.sh integration
