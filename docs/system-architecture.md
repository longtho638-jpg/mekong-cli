# System Architecture: Mekong CLI v3.0.0

## 1. High-Level Overview

Mekong CLI is an autonomous agent framework implementing Plan-Execute-Verify (PEV) with pluggable LLM providers, parallel task execution via DAG scheduling, and built-in multi-tenant credit billing.

### Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    CLI / REST API                        │
│              (Typer CLI + FastAPI Gateway)              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                Orchestration Layer                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │   Planner    │ │  Executor    │ │ Verifier + Gate  │ │
│  │  (LLM)       │ │ (DAG Sched)  │ │ (Quality Check)  │ │
│  └──────────────┘ └──────────────┘ └──────────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│               Agent & Provider System                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ GitAgent     │ │ FileAgent    │ │ Custom Agents    │ │
│  │ ShellAgent   │ │ RecipeCrawler│ │ (via plugins)    │ │
│  └──────────────┘ └──────────────┘ └──────────────────┘ │
│                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │OpenAIProvider│ │GeminiProvider│ │OfflineProvider  │ │
│  │ (circuit-br) │ │ (circuit-br) │ │ (local models)  │ │
│  └──────────────┘ └──────────────┘ └──────────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│               Persistence & Billing                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │SQLite Store  │ │ Credit Ledger│ │ Mission Journal  │ │
│  │(Tenants,     │ │ (per-tenant) │ │ (audit trail)    │ │
│  │Missions)     │ │              │ │                  │ │
│  └──────────────┘ └──────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────────┘
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
