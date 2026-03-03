# System Architecture: Mekong CLI v3.0.0

## 1. High-Level Overview

Mekong CLI is an autonomous agent framework implementing Plan-Execute-Verify (PEV) with pluggable LLM providers, parallel task execution via DAG scheduling, and built-in multi-tenant credit billing.

### Architecture Layers

```
┌──────────────────────────────────────────────────────────┐
│              CLI / REST API / Edge Gateway               │
│   (Typer CLI + FastAPI + Cloudflare Workers)            │
│           + RaaS Auth Middleware + Billing              │
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│            Orchestration Layer + RaaS Router             │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐  │
│  │   Planner    │ │  Executor    │ │ Verifier + Gate │  │
│  │  (LLM)       │ │ (DAG Sched)  │ │ (Quality Check) │  │
│  └──────────────┘ └──────────────┘ └─────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  RaaS Router (/api/v1/missions, /api/v1/tasks)  │   │
│  │  - Mission lifecycle (submit, status, cancel)    │   │
│  │  - Task store (persistent queue)                 │   │
│  │  - Rate limiter (per-tenant fair-use)           │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│        Agent & Provider System + RaaS Auth              │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐  │
│  │ GitAgent     │ │ FileAgent    │ │ Custom Agents   │  │
│  │ ShellAgent   │ │ RecipeCrawler│ │ (via plugins)   │  │
│  └──────────────┘ └──────────────┘ └─────────────────┘  │
│                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐  │
│  │OpenAIProvider│ │GeminiProvider│ │OfflineProvider │  │
│  │ (circuit-br) │ │ (circuit-br) │ │ (local models) │  │
│  └──────────────┘ └──────────────┘ └─────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ RaaS Auth: JWT validation, Tenant isolation      │  │
│  │ RaaS Billing: Credit ledger, Quota enforcement   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│         Persistence & Billing + Edge Cache              │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐  │
│  │SQLite Store  │ │ Credit Ledger│ │ Mission Journal │  │
│  │(Tenants,     │ │ (per-tenant) │ │ (audit trail)   │  │
│  │Missions)     │ │              │ │                 │  │
│  └──────────────┘ └──────────────┘ └─────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ RaaS Gateway: Cloudflare KV (rate limiting cache) │  │
│  │ Polar.sh Webhooks: payment → credit allocation    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## 2. Core Modules

### 2.1 Orchestrator (`src/core/orchestrator.py`)

Coordinates Plan → Execute → Verify pipeline:

1. **Plan** — LLM decomposes goal into ordered steps with dependencies
2. **Execute** — DAG scheduler runs steps in parallel (respecting dependencies)
3. **Verify** — Quality gate validates results (type checks, tests, assertions)
4. **Rollback** — Failed verification reverses completed steps atomically

**Key Methods:**
- `cook(goal: str) → ExecutionResult` — Full PEV pipeline
- `plan(goal: str) → Recipe` — Planning only (dry-run)
- `execute_recipe(recipe: Recipe) → ExecutionResult` — Run pre-planned recipe

### 2.2 Planner (`src/core/planner.py`)

LLM-powered task decomposition:

- Input: High-level goal (string)
- Output: Recipe (structured steps with dependencies)
- Process: Sends goal to LLM provider, parses response into Task objects
- Fallback: Generates fallback recipe if LLM fails

**Recipe Structure:**
```python
@dataclass
class Recipe:
    goal: str
    steps: List[RecipeStep]
    total_credits: int

@dataclass
class RecipeStep:
    order: int  # Execution order
    dependencies: List[int]  # Task IDs this depends on
    description: str
    cmd: str  # Shell, LLM, or API mode
    verify: Dict[str, str]  # Verification checks
```

### 2.3 Executor (`src/core/executor.py`)

Multi-mode task runner:

- **Shell Mode** — Runs `bash` or `sh` commands
- **LLM Mode** — Sends prompts to LLM provider
- **API Mode** — Calls HTTP endpoints (future)
- **Agent Mode** — Dispatches to registered agents

**Execution Result:**
```python
@dataclass
class ExecutionResult:
    success: bool
    exit_code: int
    stdout: str
    stderr: str
    duration_ms: int
    metadata: Dict
```

### 2.4 DAG Scheduler (`src/core/dag_scheduler.py`)

Parallel task execution with dependency management:

- **Topological Sort** — Identifies ready steps (all deps completed)
- **Thread Pool** — Runs independent steps concurrently (default 4 workers)
- **Failure Handling** — Marks failed steps, cancels downstream dependents
- **Timeout** — Per-step timeout (default 30s)

**Execution Timeline:**
```
Step 1 (order=1):       ↓  (no deps)
Step 2 (deps=[1]):  ─────↓  (waits for 1)
Step 3 (deps=[1]):  ─────↓  (parallel with 2)
```

### 2.5 Verifier (`src/core/verifier.py`)

Quality gate validation:

- **Exit Code Checks** — Verify exit code matches expected
- **File Checks** — Assert files exist/don't exist
- **Content Checks** — Pattern matching in output
- **LLM Assessment** — Re-run verification via LLM (expensive, optional)

**Failed verification triggers rollback:**
```python
if not verified:
    orchestrator.rollback(completed_steps)
    return ExecutionResult(success=False, ...)
```

### 2.6 LLM Provider System (`src/core/providers.py`)

Abstract LLM interface with pluggable backends:

**Provider Interface:**
```python
class LLMProvider(ABC):
    @property
    def name(self) -> str: ...

    def chat(
        self,
        messages: List[Message],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        json_mode: bool = False
    ) -> LLMResponse: ...
```

**Built-in Providers:**
1. **OpenAICompatibleProvider** — Works with OpenAI API and compatible services
2. **GeminiProvider** — Google Gemini API
3. **OfflineProvider** — Local models (via Ollama/LlamaCPP)

**Failover Strategy:**
- Primary provider unavailable → Try next in chain
- Circuit breaker (quota errors) → Backoff + retry other providers
- All providers down → Return error to user

### 2.7 Agent Protocol (`src/core/protocols.py`)

Runtime-checkable interface for pluggable agents:

```python
class AgentProtocol(Protocol):
    @property
    def name(self) -> str: ...

    def plan(self, input: str) -> List[Task]:
        """Decompose goal into tasks"""

    def execute(self, task: Task) -> Result:
        """Execute single task"""

    def verify(self, result: Result) -> bool:
        """Validate result"""

    def execute_stream(self, task: Task) -> Iterator[str]:
        """Optional: streaming output"""
```

**Built-in Agents:**
- `GitAgent` — Git operations (status, diff, commit, branch)
- `FileAgent` — File operations (find, read, tree, grep)
- `ShellAgent` — Shell command execution
- `RecipeCrawler` — Recipe file discovery

### 2.8 Plugin System (`src/core/plugin_loader.py`)

Discover and load custom agents/providers:

**Discovery Methods:**
1. **Entry Points** — PyPI packages with `[project.entry-points."mekong.agents"]`
2. **Local Plugins** — `.py` files in `~/.mekong/plugins/`

**Plugin Registration:**
```python
# ~/.mekong/plugins/my_agent.py
class MyAgent:
    name = "my-agent"
    def plan(self, input: str) -> List[Task]: ...
    def execute(self, task: Task) -> Result: ...
    def verify(self, result: Result) -> bool: ...

def register(registry):
    registry.register("my-agent", MyAgent)
```

**Safety:** Plugin failures logged as warnings (never crash CLI)

### 2.9 Credit System (`src/raas/`)

Multi-tenant billing with SQLite backend:

**Components:**
- `tenant.py` — Tenant management (create, list, rotate API keys)
- `credits.py` — Credit ledger (add, deduct, check balance)
- `missions.py` — Mission lifecycle (create, execute, complete, cancel)
- `billing.py` — Polar.sh webhook receiver
- `sdk.py` — Python client SDK
- `rate_limiter.py` — Fair-use rate limiting per tenant

**Credit Model:**
| Complexity | Cost | Example |
|-----------|------|---------|
| Simple | 1 | Single file edit |
| Standard | 3 | Multi-step feature |
| Complex | 5 | Full-stack with tests |

**Workflow:**
1. User creates tenant → gets API key
2. Admin adds credits via Polar.sh purchase
3. User submits mission via API
4. Mission plan estimates credits → reserved
5. Execution completes → credits deducted
6. Failed execution → credits refunded

### 2.10 RaaS API Layer (`src/api/`)

Production-grade REST API with authentication & billing enforcement:

**Components:**
- `raas_router.py` — Mission endpoints (POST /api/v1/missions, GET /api/v1/missions/:id)
- `raas_task_models.py` — Pydantic schemas (MissionRequest, TaskResponse, etc.)
- `raas_task_store.py` — Persistent task queue (FIFO, transactional)
- `raas_auth_middleware.py` — JWT validation + tenant extraction
- `raas_billing_middleware.py` — Credit reservation & quota enforcement
- `raas_billing_service.py` — MCU metering + plan management

**API Endpoints:**
```
POST   /api/v1/missions         # Submit goal, estimate credits
GET    /api/v1/missions/:id     # Get mission status + result
DELETE /api/v1/missions/:id     # Cancel mission (refund credits)
GET    /api/v1/tasks            # List pending tasks (rate-limited)
POST   /api/v1/tasks/:id/result # Worker submits completion
GET    /api/v1/billing/usage    # Get tenant usage metrics
```

**MCU (Mission Complexity Unit) Pricing:**
| MCU Range | Cost (credits) | Complexity |
|-----------|---|---|
| 1-10 MCU | 1 | Simple (single step) |
| 11-30 MCU | 3 | Standard (multi-step) |
| 31-60 MCU | 5 | Complex (parallel tasks) |
| 61+ MCU | 8 | Enterprise (advanced) |

**Billing Tiers:**
- Free: 10 MCU/month included
- Pro: Unlimited MCU, $9.99/month (via Polar.sh)
- Enterprise: Custom limits, custom support

### 2.11 RaaS Gateway (`apps/raas-gateway/`)

Cloudflare Workers edge gateway with distributed rate limiting:

**Features:**
- **Edge Auth** — JWT validation at Cloudflare edge (before reaching origin)
- **KV Rate Limiter** — Distributed rate limiting cache (Cloudflare KV)
- **Webhook Handler** — Polar.sh payment events → credit allocation
- **Edge Computing** — Process requests globally without database latency

**Architecture:**
```
Client
  ↓ (request + JWT)
Cloudflare Edge (auth + rate limit)
  ├─ Valid JWT + within quota → route to origin
  └─ Invalid/rate-limited → reject immediately (no origin hit)
```

**Webhook Flow:**
```
Polar.sh payment completed
  → POST /webhooks/polar
  → Verify signature + idempotency key
  → Allocate credits to tenant
  → Return 200 (idempotent)
```

### 2.12 Mekong Engine (`packages/mekong-engine/`)

Serverless PEV engine running on Cloudflare Workers, exposing core Mekong functionality as a production-grade API.

**Stack:**
- **Runtime:** Cloudflare Workers (TypeScript)
- **Framework:** Hono.js (lightweight HTTP router)
- **Database:** Cloudflare D1 (SQLite)
- **Cache:** Cloudflare KV (distributed rate limiting)
- **LLM:** Workers AI (Llama 3.1 8B) + OpenAI-compatible fallback

**Production URL:** `https://mekong-engine.agencyos-openclaw.workers.dev`

**Core Features:**
1. **PEV Pipeline** — `/cmd` endpoint for direct PEV execution (no auth)
2. **RaaS API** — `/v1/tasks/*` for multi-tenant missions with streaming
3. **Agent Operations** — `/v1/agents/:name/run` for direct agent dispatch
4. **Billing Integration** — `/billing/webhook/polar` for payment events
5. **Rate Limiting** — Per-tenant quotas via Cloudflare KV

**Key Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| POST | `/cmd` | PEV pipeline (public) |
| POST | `/v1/tasks` | Create mission |
| GET | `/v1/tasks/:id` | Get mission status |
| GET | `/v1/tasks/:id/stream` | Stream updates (SSE) |
| POST | `/v1/tasks/:id/cancel` | Cancel mission |
| POST | `/v1/agents/:name/run` | Run agent |
| GET | `/v1/agents` | List agents |
| POST | `/billing/webhook/polar` | Polar payment webhook |
| GET | `/billing/plans` | List subscription plans |

**Database:** 3 tables (tenants, credits, missions) — same schema as RaaS backend, optimized for Cloudflare D1.

**Authentication:** Bearer token (API key) → SHA-256 hash lookup in tenants table.

**Rate Limiting:** Cloudflare KV stores per-tenant quota state. Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

**Deployment:** `wrangler deploy` from `packages/mekong-engine/`. Bindings (D1, KV, AI) configured in `wrangler.toml`.

## 3. Data Flow

### Full PEV Pipeline

```
User Input ("Create a FastAPI app")
    ↓
Orchestrator.cook()
    ↓
├─ PLAN: Planner → LLM → Recipe
│  (5 steps identified)
│
├─ EXECUTE: DAG Scheduler
│  ├─ Step 1: mkdir src/      (order=1)
│  ├─ Step 2: create main.py  (order=2, deps=[1])
│  ├─ Step 3: add routes      (order=3, deps=[2])
│  ├─ Step 4: write tests     (order=3, deps=[2], parallel)
│  └─ Step 5: verify build    (order=4, deps=[3,4])
│
├─ VERIFY: Verifier
│  ├─ Check: pytest passes
│  ├─ Check: mypy clean
│  └─ Check: type-coverage > 90%
│
└─ RESULT: ExecutionResult
   success=True, credits_used=3
```

### API Mission Workflow

```
POST /missions {"goal": "Build landing page"}
    ↓
Tenant → Credit check → Plan (estimate cost)
    ↓
Reserve credits → Execute pipeline
    ↓
ON SUCCESS: Deduct credits → Return result
ON FAILURE: Refund credits → Return error
```

## 4. Configuration

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `LLM_BASE_URL` | `http://localhost:9191` | LLM provider endpoint |
| `LLM_PROVIDER` | `openai` | Active provider (openai/gemini/offline) |
| `LLM_API_KEY` | (required) | API key for provider |
| `MEKONG_PLUGIN_DIR` | `~/.mekong/plugins/` | Local plugin directory |
| `RAAS_DB_PATH` | `~/.mekong/raas/tenants.db` | SQLite database path |
| `LOG_LEVEL` | `info` | Logging level (debug/info/warning/error) |
| `VERCEL_TOKEN` | (optional) | For Vercel deployments |

### Database Schema

**tenants table:**
```
id, name, api_key, created_at, credits_balance
```

**missions table:**
```
id, tenant_id, goal, status, credits_cost,
result, created_at, completed_at
```

**credit_ledger table:**
```
id, tenant_id, amount, transaction_type,
description, created_at
```

## 5. Deployment

### Local Development
```bash
pip install -e .
mekong cook "Create a Python calculator"
```

### API Server
```bash
uvicorn src.core.gateway:app --host 0.0.0.0 --port 8000
```

### Docker (Optional)
```bash
docker build -t mekong-cli .
docker run -e LLM_API_KEY=sk-... mekong-cli mekong cook "goal"
```

## 6. Extension Points

### Adding a Custom Agent
```python
# ~/.mekong/plugins/my_research_agent.py
class ResearchAgent:
    name = "research"

    def plan(self, input: str) -> List[Task]:
        return [Task(description=f"Research: {input}")]

    def execute(self, task: Task) -> Result:
        # Call search API, return results
        return Result(success=True, output="...")

    def verify(self, result: Result) -> bool:
        return len(result.output) > 100

def register(registry):
    registry.register("research", ResearchAgent)
```

### Adding a Custom Provider
```python
# src/core/custom_provider.py
from src.core.providers import LLMProvider, LLMResponse

class CustomProvider(LLMProvider):
    @property
    def name(self) -> str:
        return "custom"

    def chat(self, messages, model, **kwargs) -> LLMResponse:
        # Your implementation
        return LLMResponse(content="...", model=model)
```

## 7. Performance Characteristics

| Operation | Target | Actual |
|-----------|--------|--------|
| CLI startup | < 1s | ~0.8s |
| Plan generation | < 2s | ~1.5s |
| Execute simple step | < 5s | ~2s |
| Execute complex step | < 30s | ~15s |
| Verify + rollback | < 5s | ~2s |
| Database query | < 100ms | ~50ms |

## 8. Security Considerations

- **Secrets**: No API keys in source code (via env vars)
- **Input Validation**: All inputs validated with Pydantic
- **Type Safety**: 100% type hints, zero `any` types
- **Audit Trail**: All missions logged with tenant isolation
- **Isolation**: Multi-tenant credit system prevents cross-tenant access
