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
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│           Health Monitoring System (Phase 1-5)           │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐  │
│  │HealthEndpoint│ │CrashDetector │ │LicenseMonitor   │  │
│  │ (port 9192)  │ │ (exit codes) │ │ (threshold)     │  │
│  └──────────────┘ └──────────────┘ └─────────────────┘  │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐  │
│  │AnomalyDetector││AlertRouter   │ │AutoRecovery     │  │
│  │ (Z-score)    │ │ (Telegram)   │ │ (recovery)      │  │
│  └──────────────┘ └──────────────┘ └─────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ EventBus: Real-time event pub/sub                 │  │
│  │ - Health:HEALTH_CRITICAL → AlertRouter            │  │
│  │ - License:LICENSE_CRITICAL → AutoRecovery         │  │
│  │ - Crash:detected → AutoRecovery                   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

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

## 8. Memory Architecture

- **Context Management**: `src/core/context_manager.py` maintains conversation context across interactions
- **Prompt Caching**: `src/core/prompt_cache.py` provides intelligent prompt caching with similarity matching
- **Learning Tracking**: `src/core/learning_tracker.py` tracks AI learning patterns and identifies knowledge gaps
- **Cross-Session Intelligence**: `src/core/cross_session_intelligence.py` maintains intelligence across different sessions
- **Decision Making**: `src/core/decision_maker.py` enhances decision-making with historical context and precedents
- **Fallback Mechanisms**: All modules implement dual storage (vector + local file backup) for robustness
- **User Isolation**: Each module properly scopes data by user_id for tenant isolation
- **Integration**: Seamlessly integrates with existing MemoryFacade system

## 9. Security Considerations

- **Secrets**: No API keys in source code (via env vars)
- **Input Validation**: All inputs validated with Pydantic
- **Type Safety**: 100% type hints, zero `any` types
- **Audit Trail**: All missions logged with tenant isolation
- **Isolation**: Multi-tenant credit system prevents cross-tenant access

## 10. Authentication Layer

### 10.1 Overview

The authentication layer implements OAuth2-based user authentication with JWT session management, RBAC for authorization, and Stripe integration for subscription-based role provisioning.

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Layer                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐    ┌───────────────────────────┐   │
│  │   OAuth2 Providers  │    │   JWT Session Manager     │   │
│  │  - GoogleOAuth2     │    │   - Token generation      │   │
│  │  - GitHubOAuth2     │    │   - Token validation      │   │
│  │  - PKCE Support     │    │   - Cookie management     │   │
│  └─────────┬───────────┘    └───────────────────────────┘   │
│            │                                                  │
│            │            ┌───────────────────────────┐       │
│            └────────────►   User Repository        ────────┘
│                         │   - User CRUD             │
│                         │   - Session tracking      │
│                         └───────────────────────────┘
│
│  ┌───────────────────────────────────────────────────────┐
│  │              RBAC Middleware                          │
│  │  - Role hierarchy enforcement                         │
│  │  - Permission decorators                              │
│  │  - Request context injection                          │
│  └───────────────────────────────────────────────────────┘
│
│  ┌───────────────────────────────────────────────────────┐
│  │         Stripe Webhook Integration                    │
│  │  - Subscription event handling                        │
│  │  - Role auto-provisioning                             │
│  │  - Webhook signature verification                     │
│  └───────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────┘
```

### 10.2 OAuth2 Providers

#### Google OAuth2
- Uses OAuth2 authorization code flow with PKCE
- Scopes: `openid`, `email`, `profile`
- Offline access for refresh tokens

#### GitHub OAuth2
- OAuth2 authorization code flow
- Requests `user:email` scope
- Primary email fallback if available

### 10.3 Session Management

```
┌─────────────────────────────────────────────────────────────┐
│                   Session Flow                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User Authentication → 2. Generate JWT Tokens            │
│     Users id, email, role →    - Access token (30min)       │
│     → 3. Create UserSession                       →          │
│     - Access token hash                           →          │
│     - Expires at (7 days)                         →          │
│     → 4. Store in DB + Set HTTPOnly Cookie                  │
│                                                               │
│  Token Format (JWT):                                         │
│  {                                                            │
│    "sub": "user-uuid",                                       │
│    "email": "user@example.com",                              │
│    "role": "member",                                         │
│    "type": "access",                                         │
│    "iat": timestamp,                                         │
│    "exp": timestamp,                                         │
│    "jti": "unique-token-id"                                  │
│  }                                                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### Session Features
- **HTTPOnly Cookie**: Prevents XSS token theft
- **JWT Signature**: Tamper-proof token validation
- **Database Backed**: Revocable sessions
- **Refresh Token**: Extend sessions without re-authentication

### 10.4 RBAC Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RBAC Layer                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  RoleHierarchy:                                              │
│    owner ──► admin ──► member ──► viewer                    │
│    (inherited permissions)                                   │
│                                                               │
│  PermissionMatrix:                                           │
│    - VIEW_DASHBOARD (all roles)                              │
│    - EXPORT_DATA (owner, admin, member)                     │
│    - CREATE_RESOURCES (owner, admin, member)                │
│    - UPDATE_RESOURCES (owner, admin, member)                │
│    - DELETE_RESOURCES (owner, admin)                         │
│    - MANAGE_USERS (owner, admin)                             │
│    - MANAGE_BILLING (owner)                                  │
│    - SYSTEM_CONFIG (owner)                                   │
│                                                               │
│  Decorators:                                                 │
│    - @require_role(Role.ADMIN, Role.OWNER)                  │
│    - @require_permission(Permission.MANAGE_USERS)           │
│    - get_current_user(request) → user info                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### Role Hierarchy
| Role | Inherits | Max Permissions |
|------|----------|-----------------|
| owner | admin, member, viewer | All |
| admin | member, viewer | Delete, Manage Users, Settings |
| member | viewer | Create, Update, Export |
| viewer | none | View only |

### 10.5 Stripe Integration

```
┌─────────────────────────────────────────────────────────────┐
│              Stripe Webhook Flow                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Stripe (Subscription Event)                                │
│     ↓ (POST /webhooks/stripe + signature)                  │
│  ┌────────────────────────────────┐                         │
│  │  Verify Webhook Signature      │                         │
│  └──────────────┬─────────────────┘                         │
│                 ↓                                            │
│  ┌────────────────────────────────┐                         │
│  │  Parse Event Data              │                         │
│  │  - event_type                  │                         │
│  │  - price_id                    │                         │
│  │  - customer_info               │                         │
│  └──────────────┬─────────────────┘                         │
│                 ↓                                            │
│  ┌────────────────────────────────┐                         │
│  │  Map Price ID → Role           │                         │
│  │  price_pro → admin             │                         │
│  │  price_trial → member          │                         │
│  │  price_free → viewer           │                         │
│  └──────────────┬─────────────────┘                         │
│                 ↓                                            │
│  ┌────────────────────────────────┐                         │
│  │  Update User Role in DB        │                         │
│  └──────────────┬─────────────────┘                         │
│                 ↓                                            │
│  ┌────────────────────────────────┐                         │
│  │  Return 200 OK                 │                         │
│  └────────────────────────────────┘                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### Supported Events
| Event | Action |
|-------|--------|
| `customer.subscription.created` | Provision role from price tier |
| `customer.subscription.updated` | Update role if price tier changed |
| `customer.subscription.deleted` | Downgrade to `viewer` |
| `customer.deleted` | Revoke access |

#### Webhook Verification
- HMAC SHA-256 signature verification
- Timestamp validation
- Idempotency handling (prevent duplicate processing)

### 10.6 Security Measures

1. **OAuth2 Security**
   - PKCE code challenge/verifier for public clients
   - State parameter CSRF protection
   - Redirect URI validation

2. **JWT Security**
   - HS256 signature with server-side secret
   - Token blacklist via UserSession table
   - Expiration enforcement

3. **Cookie Security**
   - `HttpOnly`: Prevents JavaScript access
   - `Secure`: HTTPS-only in production
   - `SameSite`: mitigates CSRF attacks

4. **Stripe Security**
   - Webhook signature verification
   - Event type validation
   - Idempotent webhook processing

### 10.7 API Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/auth/login` | Render login page | No |
| POST | `/auth/dev-login` | Dev mode quick login | Dev only |
| GET | `/auth/google/login` | Initiate Google OAuth | No |
| GET | `/auth/google/callback` | Google OAuth callback | No |
| GET | `/auth/github/login` | Initiate GitHub OAuth | No |
| GET | `/auth/github/callback` | GitHub OAuth callback | No |
| POST | `/auth/logout` | Logout user | Yes |
| GET | `/auth/me` | Get current user info | Yes |
| GET | `/auth/refresh` | Refresh access token | Yes |
| GET | `/auth/admin` | Admin dashboard (admin+) | Yes |
| POST | `/auth/webhook/stripe` | Stripe webhook | Webhook secret |

### 10.8 Configuration Reference

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `AUTH_ENVIRONMENT` | `dev` | `dev`, `staging`, `production` |
| `JWT_SECRET` | (auto-generated) | JWT signing secret |
| `JWT_ACCESS_EXPIRY_MINUTES` | `30` | Access token lifetime |
| `JWT_REFRESH_EXPIRY_DAYS` | `7` | Refresh token lifetime |
| `SESSION_MAX_AGE_SECONDS` | `604800` | Session cookie age |
| `GOOGLE_CLIENT_ID` | (required) | Google OAuth client ID |
| `GITHUB_CLIENT_ID` | (required) | GitHub OAuth client ID |
| `STRIPE_SECRET_KEY` | (optional) | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | (optional) | Stripe webhook secret |

## 11. Health Monitoring System

> **Phase 1-5 Monitoring Architecture** — Real-time detection, alerting, and automated recovery

### 11.1 Overview

The Health Monitoring System provides comprehensive system health visibility with five integrated phases:

| Phase | Component | Purpose |
|-------|-----------|---------|
| 1 | Health Endpoint + Crash Detection | HTTP health check + crash event tracking |
| 2 | License Failure Monitoring | License validation failure tracking with threshold alerting |
| 3 | Usage Anomaly Detection | Statistical anomaly detection using Z-score analysis |
| 4 | Alert Routing + Telegram | Centralized alert routing with deduplication and throttling |
| 5 | Auto-Recovery Actions | Automated recovery with exponential backoff |

### 11.2 Monitoring Components

#### Health Endpoint (`src/core/health_endpoint.py`)

FastAPI-based HTTP health endpoint providing real-time system status.

| Feature | Description |
|---------|-------------|
| Port | 9192 (default) |
| Endpoints | `/health`, `/ready`, `/live` |
| Format | JSON with component statuses |

**API Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Full health status with component checks |
| `/ready` | GET | Kubernetes-style readiness probe |
| `/live` | GET | Kubernetes-style liveness probe |

**Component Status Values:**

| Status | Meaning |
|--------|---------|
| `healthy` | Component is functioning normally |
| `degraded` | Component has partial issues but operational |
| `unhealthy` | Component is not functioning |
| `unknown` | No health check registered |

#### Crash Detector (`src/core/crash_detector.py`)

Real-time crash detection monitoring CLI execution exit codes.

**Features:**
- Exit code monitoring and crash event emission
- Crash frequency tracking (crashes per hour)
- Crash history persistence to `.mekong/crashes/`
- Auto-recovery triggering on crash detection

**Event:** `health:critical` with metadata

#### License Monitor (`src/core/license_monitor.py`)

Tracks license validation failures with threshold alerting and grace period support.

**Features:**
- Failure recording with metadata (error_code, timestamp, retry_count)
- Threshold alerting (>3 failures in 5min → emit `license:critical`)
- Grace period for new installations (24h)
- Failure history persistence to `.mekong/license_failures.json`

**Event:** `license:critical` on threshold exceeded

#### Anomaly Detector (`src/core/anomaly_detector.py`)

Statistical anomaly detection for usage metrics using Z-score analysis.

**Features:**
- 7-day rolling baseline calculation
- Z-score detection (|z| > 3.0 = anomaly)
- Anomaly types: spike, drop, pattern_break
- Severity levels: low, medium, high, critical

**Event:** `usage:anomaly_detected` with category and metric

#### Alert Router (`src/core/alert_router.py`)

Centralized alert routing with deduplication, throttling, and severity-based routing.

**Features:**
- Deduplication window: 10 minutes
- Throttling limit: 10 alerts/hour (except critical)
- Telegram integration with markdown formatting
- Severity routing: critical/warning/info

**Subscribed Events:**
- `health:critical`
- `license:critical`
- `halt_triggered`
- `governance_blocked`

**Event:** `alert:sent`/`alert:deduplicated`/`alert:throttled`

#### Auto Recovery (`src/core/auto_recovery.py`)

Automated recovery actions with exponential backoff.

**Recovery Types:**

| Type | Description |
|------|-------------|
| `license:recovery` | License validation failure recovery |
| `crash:recovery` | Process crash recovery |
| `health:endpoint_recovery` | Health endpoint restart |
| `proxy:recovery` | Proxy service restart |

**Backoff Strategy:** min(base × 2^(attempt-1), max)
- Attempt 1: 1s delay
- Attempt 2: 2s delay
- Attempt 3: 4s delay
- Attempt 4+: 10s (capped)

**Events:** `recovery:started`/`recovery:success`/`recovery:failed`

### 11.3 Event Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                        EventBus Pub/Sub                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │   Health Events  │    │  License Events  │    │  Usage Events │  │
│  │  health:critical │    │ license:critical │    │  usage:anomaly│  │
│  │  recovery:*      │    │  license:*       │    │  usage:anomaly│  │
│  └────────┬─────────┘    └────────┬─────────┘    └───────┬───────┘  │
│           │                       │                        │         │
│           │                       │                        │         │
│           ▼                       ▼                        ▼         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      AlertRouter                               │ │
│  │  - Deduplication (10min)                                       │ │
│  │  - Throttling (10/hr non-critical)                             │ │
│  │  - Telegram Delivery                                           │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                     │                                │
│                                     ▼                                │
│                            ┌──────────────────┐                      │
│                            │  Telegram Alert  │                      │
│                            │  - Markdown      │                      │
│                            │  - Emoji prefix  │                      │
│                            │  - Timestamp     │                      │
│                            └──────────────────┘                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 11.4 Event Types Reference

| Event Type | Phase | Description |
|------------|-------|-------------|
| `health:critical` | 1 | Critical health issue detected |
| `health:warning` | 1 | System health degraded |
| `recovery:started` | 5 | Recovery action started |
| `recovery:attempted` | 5 | Recovery attempt in progress |
| `recovery:success` | 5 | Recovery succeeded |
| `recovery:failed` | 5 | Recovery failed |
| `license:validation_failed` | 2 | License validation failed |
| `license:critical` | 2 | License threshold exceeded |
| `license:grace_period_active` | 2 | Grace period active |
| `usage:anomaly_detected` | 3 | Anomaly detected |
| `usage:api_call` | 3 | API call recorded |
| `usage:agent_spawn` | 3 | Agent spawn recorded |
| `alert:deduplicated` | 4 | Alert suppressed (duplicate) |
| `alert:throttled` | 4 | Alert suppressed (throttle) |
| `alert:sent` | 4 | Alert sent successfully |

### 11.5 Health Endpoint API

```python
from src.core.health_endpoint import (
    start_health_server,
    stop_health_server,
    register_component_check,
    get_health_url,
)

# Register a health check for a component
def license_check():
    from src.core.license_monitor import get_monitor
    monitor = get_monitor()
    if monitor.is_critical():
        return ComponentStatus(status="unhealthy", message="License critical")
    return ComponentStatus(status="healthy")

register_component_check("license", license_check)

# Start health server
server = start_health_server(host="127.0.0.1", port=9192)

# Check health
curl "http://127.0.0.1:9192/health"
```

### 11.6 File Locations

| File | Purpose |
|------|---------|
| `.mekong/license_failures.json` | License failure history |
| `.mekong/usage_baseline.json` | Anomaly detection baselines |
| `.mekong/recovery_history.json` | Recovery attempt history |
| `.mekong/crashes/*.json` | Crash event history |
| `.mekong/health_endpoint.log` | Health endpoint logs |

### 11.7 Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `HEALTH_ENDPOINT_HOST` | `127.0.0.1` | Health endpoint hostname |
| `HEALTH_ENDPOINT_PORT` | `9192` | Health endpoint port |
| `TELEGRAM_BOT_TOKEN` | - | Telegram bot token for alerts |
| `TELEGRAM_OPS_CHANNEL_ID` | - | Telegram ops channel ID |

### 11.8 Monitoring Integration Points

**In Orchestrator:**
```python
# After execution fails
from src.core.crash_detector import get_crash_detector
detector = get_crash_detector()
detector.record_crash(exit_code=result.exit_code, command=step.cmd)
```

**In License Validation:**
```python
# On validation failure
from src.core.license_monitor import record_failure
record_failure(
    error_code="invalid_signature",
    key_id=key_id,
    command="mekong run",
)
```

**In Usage Tracking:**
```python
# Record usage metrics
from src.core.anomaly_detector import get_detector, AnomalyCategory
detector = get_detector()
detector.record_metric(AnomalyCategory.API_CALLS, "requests", 100.0)
```

**In Alert Triggers:**
```python
# Emit_CRITICAL event
from src.core.event_bus import get_event_bus, EventType
event_bus = get_event_bus()
event_bus.emit(EventType.LICENSE_CRITICAL, {"data": ...})
```
