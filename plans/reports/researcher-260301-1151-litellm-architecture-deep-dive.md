# Research Report: BerriAI/litellm Architecture Deep Dive

**Date:** 2026-03-01
**Scope:** Core architecture, proxy server, design patterns, caching, cost tracking, callbacks, error handling
**Sources:** GitHub repo, docs.litellm.ai, deepwiki.com/BerriAI/litellm, direct code analysis

---

## Executive Summary

litellm is a Python SDK + AI Gateway (proxy server) providing unified access to 100+ LLM providers via OpenAI-compatible interface. YC W23-backed, 8ms P95 latency at 1k RPS. Two primary layers: (1) SDK with unified `completion()` API, (2) FastAPI proxy server for multi-tenant deployments. Core design philosophy: OpenAI API as the lingua franca — everything in, everything out conforms to OpenAI's schema. The most battle-tested open-source LLM router available. Directly relevant to mekong-cli's Antigravity Proxy architecture.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                                │
│   Python SDK / HTTP Client / OpenAI-compatible client           │
└──────────────────────────┬──────────────────────────────────────┘
                           │  completion() / acompletion()
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LITELLM SDK LAYER                            │
│                    litellm/main.py                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  completion │  │acompletion() │  │  embedding()           │ │
│  │  ()         │  │(async)       │  │  image_generation()    │ │
│  └──────┬──────┘  └──────┬───────┘  └───────────────────────┘ │
│         │                │                                      │
│         ▼                ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │           PROVIDER ROUTER / DISPATCHER                      ││
│  │  get_llm_provider() → normalizes model name → picks adapter ││
│  └────────────────────┬────────────────────────────────────────┘│
│                       │                                         │
│          ┌────────────┼────────────┐                           │
│          ▼            ▼            ▼                           │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                    │
│  │litellm/llms│ │litellm/llms│ │litellm/llms│  (per-provider) │
│  │/openai.py │ │/anthropic │ │/vertex_ai │                    │
│  └───────────┘ └───────────┘ └───────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                           │ normalized response
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CALLBACK / LOGGING LAYER                       │
│  CustomLogger → success/failure events → Langfuse/Prometheus    │
└─────────────────────────────────────────────────────────────────┘

─────────────────────────── OR ────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                   PROXY SERVER LAYER                            │
│            litellm/proxy/proxy_server.py (FastAPI)              │
│                                                                 │
│  POST /chat/completions                                         │
│  POST /embeddings                                               │
│  POST /messages (Anthropic native)                              │
│  POST /responses (OpenAI Responses API)                         │
│  POST /a2a (Agent-to-Agent)                                     │
│                                                                 │
│  ┌──────────────┐   ┌─────────────────┐   ┌─────────────────┐  │
│  │ Auth Layer   │   │  Rate Limiter   │   │ Budget Manager  │  │
│  │ Virtual Keys │   │  RPM/TPM limits │   │ spend tracking  │  │
│  │ JWT/API keys │   │  per-key/user   │   │ Prisma DB       │  │
│  └──────────────┘   └─────────────────┘   └─────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  ROUTER (litellm.Router)                 │   │
│  │  model_list: [{model_name, litellm_params, rpm, tpm}]   │   │
│  │                                                          │   │
│  │  Strategies: simple-shuffle | latency-based |           │   │
│  │              usage-based | least-busy | cost-based       │   │
│  │                                                          │   │
│  │  Fallbacks: regular → content-policy → context-window   │   │
│  │  Cooldowns: auto-disable failing deployments            │   │
│  │  Retries:   exponential backoff + num_retries           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│                    SDK LAYER (above)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Core Architecture: Multi-Provider Routing

### Entry Point: `litellm/main.py`

`completion()` is the unified entry point. Call flow:

```python
completion(model="gpt-4", messages=[...])
  → get_llm_provider(model)           # parse "openai/gpt-4", "anthropic/claude-3"
  → validate inputs (Pydantic)
  → pre-call hooks (callbacks)
  → provider-specific adapter call
  → normalize response → ModelResponse
  → post-call hooks (cost calc, logging)
  → return ModelResponse
```

### Provider Dispatch Pattern

`get_llm_provider()` uses string prefix matching + registry lookup:
- `openai/...` → `litellm/llms/openai.py`
- `anthropic/...` → `litellm/llms/anthropic.py`
- `vertex_ai/...` → `litellm/llms/vertex_ai_and_google_ai_studio/`
- `azure/...` → `litellm/llms/azure.py`
- `bedrock/...` → `litellm/llms/bedrock/`
- `ollama/...` → `litellm/llms/ollama.py`
- etc.

Each provider module implements: `completion()`, `async_completion()`, `streaming()`.

### Provider Adapter Interface

Every provider adapter follows the same contract:
```python
def completion(
    model: str,
    messages: list,
    api_key: str,
    api_base: str,
    **kwargs
) -> ModelResponse:
    # 1. transform litellm params → provider-specific request
    # 2. call provider API
    # 3. transform provider response → ModelResponse
    pass
```

This is the **Adapter Pattern** — each provider wraps its native SDK into the litellm interface.

### ModelResponse (Unified Schema)

Always returns OpenAI-shaped object:
```python
ModelResponse(
    id="chatcmpl-...",
    choices=[Choice(message=Message(role="assistant", content="..."))],
    usage=Usage(prompt_tokens=X, completion_tokens=Y, total_tokens=Z),
    model="gpt-4",
    _hidden_params={"response_cost": 0.0023, "cache_hit": False}
)
```

### Streaming Unification

All providers normalize to async generator of `ModelResponseStream` chunks:
```python
async for chunk in acompletion(model=..., messages=..., stream=True):
    chunk.choices[0].delta.content  # same interface regardless of provider
```

Internally, litellm wraps provider-specific streaming (SSE, WebSocket, etc.) into a unified async generator. Key class: `CustomStreamWrapper` handles:
- OpenAI SSE format
- Anthropic streaming events
- Vertex AI streaming
- Aggregation of final usage stats at stream end

---

## 2. Proxy Server Architecture

**File:** `litellm/proxy/proxy_server.py` — FastAPI application

### Request Lifecycle in Proxy

```
HTTP Request → Auth Middleware → Budget Check → Rate Limit Check
→ Router.acompletion() → SDK → Provider
→ Cost Calculation → Spend Log (DB) → Callback Fire
→ HTTP Response
```

### Authentication Layer

`user_api_key_auth()` middleware:
- Validates `Authorization: Bearer sk-xxx` header
- Supports: master key, virtual keys (team/user scoped), JWT
- Each virtual key has: budget, rate limits, allowed models, metadata
- Key info loaded from Prisma DB (PostgreSQL or SQLite)

### Virtual Keys System

Multi-tenant key management via Prisma schema:
```
LiteLLM_VerificationToken (virtual keys table)
  - token (hashed)
  - key_alias
  - spend (current spend in USD)
  - max_budget
  - tpm_limit, rpm_limit
  - models (allowed model list)
  - team_id, user_id
  - expires
```

Keys are hashed, checked on every request, spend updated async after completion.

### Rate Limiting

Dual-layer rate limiting:
1. **Per-deployment RPM/TPM** — enforced at Router level, backed by Redis for multi-instance
2. **Per-key RPM/TPM** — enforced at proxy auth layer, uses `common_checks()`:
   - Check current RPM usage
   - Check current TPM usage
   - Check max parallel requests
   - Check budget exhaustion

### Budget Management

`ProxyLogging` class + Prisma DB:
- After every successful call: `update_request_status()` → writes to `LiteLLM_SpendLogs`
- `LiteLLM_SpendLogs` table: `request_id, api_key, spend, total_tokens, model, startTime`
- Budget enforcement: compare `key.spend + projected_cost > key.max_budget`
- `budget_duration`: rolling window (daily/monthly) for spend reset

### Load Balancing Strategies

| Strategy | Implementation | When to Use |
|----------|---------------|-------------|
| `simple-shuffle` | RPM/TPM-weighted random selection | Default, production |
| `latency-based` | EWMA of response times | Minimize P95 latency |
| `usage-based` | Real-time TPM via Redis | Even token distribution |
| `least-busy` | In-flight request count | GPU/quota fairness |
| `cost-based` | Price per token comparison | Cost minimize |
| `custom` | `CustomRoutingStrategyBase` subclass | Proprietary logic |

### Fallback Chain

Three-tier fallback system, executed in order:

```
Primary Model FAILS
  ├── retry N times (num_retries, exponential backoff)
  └── still failing?
       ├── content_policy_fallbacks  (if ContentPolicyViolationError)
       ├── context_window_fallbacks  (if ContextWindowExceededError)
       └── fallbacks                 (all other errors: 429, 500, timeout)
```

Config:
```yaml
litellm_settings:
  fallbacks: [{"gpt-3.5-turbo": ["gpt-4o"]}]
  context_window_fallbacks: [{"gpt-3.5-turbo": ["gpt-3.5-turbo-16k"]}]
  content_policy_fallbacks: [{"openai/gpt-4": ["anthropic/claude-3"]}]
```

### Cooldown Mechanism

Auto-disables failing deployments:
- Triggers on: 429s, >50% error rate in current minute, 401/404/408
- `allowed_fails=3` before cooldown, `cooldown_time=30` seconds
- Backed by Redis for multi-instance coordination
- Deployment re-enabled after cooldown window expires

---

## 3. Key Design Patterns

### A. Adapter Pattern (Provider Abstraction)
Each of 100+ providers is wrapped in an adapter that transforms:
- litellm params → provider request format
- provider response → `ModelResponse`

### B. Strategy Pattern (Load Balancing)
`routing_strategy` field selects the algorithm at runtime. `CustomRoutingStrategyBase` allows plugging in proprietary logic. Clean separation between routing decision and execution.

### C. Chain of Responsibility (Fallbacks)
Fallback chain: primary → content_policy_fallbacks → context_window_fallbacks → regular_fallbacks. Each handler either handles the error or passes to next.

### D. Observer Pattern (Callbacks)
`CustomLogger` is observer. Events fired: `log_pre_api_call`, `log_success_event`, `log_failure_event`, `async_log_success_event`. Multiple observers registered via `litellm.callbacks = [handler1, handler2]`.

### E. Proxy Pattern (Proxy Server)
The entire proxy server IS a proxy — it sits between client and LLM providers, adding auth/rate limiting/logging transparently.

### F. Template Method (Cost Calculation)
`completion_cost()` defines the algorithm skeleton:
1. extract_usage → get_model_info → calculate_components → sum
Provider-specific pricing overrides step 2 via the pricing JSON.

---

## 4. Caching System

### Cache Types

| Type | Backend | Use Case |
|------|---------|---------|
| In-Memory | Python dict | Single instance, dev |
| Redis | Redis | Multi-instance, production |
| S3 | AWS S3 | Long-term, cheap storage |
| GCS | Google Cloud Storage | GCP-native |
| Disk | Local filesystem | Single node, persistent |
| Semantic | Redis + Qdrant | Fuzzy/similarity caching |

### Cache Key Generation

Default key = hash of `(model + messages + temperature + top_p + ...)`. Custom key function:
```python
def custom_get_cache_key(model, messages, temperature, **kwargs):
    return f"{model}:{hash(str(messages))}"
```

### Cache Control Per-Request

```python
completion(
    model="gpt-4",
    messages=[...],
    caching=True,          # use cache
    cache={"no-cache": True},  # bypass cache read
    cache={"ttl": 3600},       # custom TTL
    cache={"s-maxage": 86400}, # max age
)
```

### Semantic Caching

Uses embedding similarity to return cached responses for semantically similar (not exact) queries. Backed by Qdrant or Redis Vector. Configurable similarity threshold.

---

## 5. Cost Tracking System

### `completion_cost()` in `litellm/cost_calculator.py`

5-step pipeline:
1. Extract `response.usage` (prompt_tokens, completion_tokens, etc.)
2. Normalize model name via `_select_model_name_for_cost_calc()`
3. Load pricing from `model_prices_and_context_window.json`
4. Calculate: `cost = (prompt_tokens × input_rate) + (completion_tokens × output_rate)`
5. Return `(total_cost_usd, "USD")`

### Pricing Database Schema (`model_prices_and_context_window.json`)

```json
{
  "gpt-4": {
    "input_cost_per_token": 0.00003,
    "output_cost_per_token": 0.00006,
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 4096
  },
  "claude-3-opus": {
    "input_cost_per_token": 0.000015,
    "output_cost_per_token": 0.000075,
    "cache_read_input_token_cost": 0.0000015
  }
}
```

Special pricing fields:
- `cache_read_input_token_cost` — cached prompt tokens (Anthropic/OpenAI prompt caching)
- `output_cost_per_reasoning_token` — o1/o3 thinking tokens
- `input_cost_per_audio_token` — realtime audio
- `output_cost_per_image` — DALL-E, Imagen
- `input_cost_per_second` — Whisper transcription

### Token Type Mapping

| Token Type | Field | Rate Field |
|-----------|-------|-----------|
| Standard input | `usage.prompt_tokens` | `input_cost_per_token` |
| Cached input | `usage.prompt_tokens_details.cached_tokens` | `cache_read_input_token_cost` |
| Standard output | `usage.completion_tokens` | `output_cost_per_token` |
| Reasoning | `usage.completion_tokens_details.reasoning_tokens` | `output_cost_per_reasoning_token` |
| Audio input | `usage.prompt_tokens_details.audio_tokens` | `input_cost_per_audio_token` |

### Auto-Sync

`LITELLM_MODEL_COST_MAP_URL` env var → auto-fetch latest pricing JSON from GitHub on startup. Zero-downtime model updates.

---

## 6. Callback / Observability System

### CustomLogger Interface

```python
from litellm.integrations.custom_logger import CustomLogger

class MyLogger(CustomLogger):
    def log_pre_api_call(self, model, messages, kwargs):
        # before LLM call — can modify request
        pass

    def log_post_api_call(self, kwargs, response_obj, start_time, end_time):
        # after call, before cost calc
        pass

    def log_success_event(self, kwargs, response_obj, start_time, end_time):
        # successful completion
        cost = kwargs.get("response_cost")
        cache_hit = kwargs.get("cache_hit")
        pass

    def log_failure_event(self, kwargs, response_obj, start_time, end_time):
        # failed completion
        pass

    # Async versions for acompletion:
    async def async_log_success_event(self, kwargs, response_obj, start_time, end_time):
        pass

    async def async_log_failure_event(self, kwargs, response_obj, start_time, end_time):
        pass

# Register
litellm.callbacks = [MyLogger()]
```

### Built-in Integrations

| Integration | Type | Data Sent |
|-------------|------|-----------|
| Langfuse | Trace/Span | Full request/response/cost |
| LangSmith | Trace | Request/response |
| Helicone | Proxy logging | Headers-based |
| Prometheus | Metrics | Latency, token count, cost |
| OpenTelemetry | Trace | Standard OTEL spans |
| Sentry | Error tracking | Failures only |
| Slack | Alerting | Error thresholds |
| MLflow | Experiment tracking | Input/output/params |

### Proxy-Level Logging (ProxyLogging class)

`ProxyLogging` fires additional events:
- `pre_call_hook` — before routing decision
- `post_call_failure_hook` — after provider failure
- `budget_alerts` — when spend approaches limit
- `update_request_status()` — async DB write after completion

---

## 7. Config Management

### Config Hierarchy

```
# Priority order (highest wins):
1. Per-request kwargs (model="...", api_key="...")
2. litellm.globals (litellm.api_key, litellm.model_cost)
3. Environment variables (OPENAI_API_KEY, ANTHROPIC_API_KEY)
4. config.yaml (proxy mode)
```

### config.yaml Structure

```yaml
model_list:
  - model_name: gpt-4o           # logical name
    litellm_params:
      model: azure/gpt-4o-eu     # actual model string
      api_base: https://...
      api_key: os.environ/AZURE_API_KEY  # env var syntax
      rpm: 900
      tpm: 100000
      weight: 9                  # routing weight
      order: 1                   # priority (lower = higher)
      region_name: eu            # for geo-routing

router_settings:
  routing_strategy: simple-shuffle
  num_retries: 3
  timeout: 30
  redis_host: localhost
  redis_port: 6379

litellm_settings:
  success_callback: ["langfuse", "prometheus"]
  fallbacks: [{"gpt-3.5-turbo": ["gpt-4o"]}]
  context_window_fallbacks: [{"gpt-3.5-turbo": ["gpt-3.5-turbo-16k"]}]
  cache: true
  cache_params:
    type: redis
    host: localhost

general_settings:
  master_key: sk-1234
  database_url: postgres://...
  alerting: ["slack"]
  database_connection_pool_limit: 10
```

### Credential Management

Define once, reference everywhere:
```yaml
credential_list:
  - credential_name: azure_prod
    credential_values:
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE

model_list:
  - model_name: gpt-4o
    litellm_params:
      model: azure/gpt-4o
      litellm_credential_name: azure_prod  # reference
```

---

## 8. Error Handling System

### Exception Hierarchy

All errors inherit from OpenAI exception types for compatibility:

```
litellm.exceptions.AuthenticationError     (HTTP 401)
litellm.exceptions.RateLimitError          (HTTP 429)
litellm.exceptions.BadRequestError         (HTTP 400)
litellm.exceptions.NotFoundError           (HTTP 404)
litellm.exceptions.Timeout                 (HTTP 408)
litellm.exceptions.ServiceUnavailableError (HTTP 503)
litellm.exceptions.APIConnectionError      (network errors)
litellm.exceptions.ContentPolicyViolationError  (content filters)
litellm.exceptions.ContextWindowExceededError   (too many tokens)
  └── inherits from BadRequestError (for finer-grained handling)
litellm.exceptions.InternalServerError     (HTTP 500)
litellm.exceptions.BudgetExceededError     (proxy budget)
```

### Provider Error Mapping

Each provider adapter catches native errors and re-raises as litellm exceptions:

```python
# Example: Anthropic adapter
try:
    response = anthropic_client.messages.create(...)
except anthropic.RateLimitError as e:
    raise litellm.RateLimitError(
        message=str(e),
        llm_provider="anthropic",
        model=model,
        status_code=429
    )
except anthropic.BadRequestError as e:
    if "context" in str(e).lower():
        raise litellm.ContextWindowExceededError(...)
    raise litellm.BadRequestError(...)
```

### Retry Logic

```python
router = Router(
    model_list=model_list,
    num_retries=3,           # retry count
    retry_after=5,           # min wait before retry
    allowed_fails=3,         # before cooldown
    cooldown_time=30,        # cooldown duration
)

# Custom retry policy per error type:
retry_policy = RetryPolicy(
    RateLimitErrorRetries=5,
    ContentPolicyViolationErrorRetries=0,  # don't retry content violations
    AuthenticationErrorRetries=0,          # don't retry auth errors
)
```

---

## 9. Repository Structure

```
litellm/
├── litellm/
│   ├── main.py                          # completion(), acompletion() entry
│   ├── router.py                        # Router class (load balancing)
│   ├── cost_calculator.py               # completion_cost()
│   ├── exceptions.py                    # unified exception hierarchy
│   ├── caching/                         # cache implementations
│   ├── integrations/                    # callback integrations
│   │   ├── custom_logger.py             # CustomLogger base class
│   │   ├── langfuse.py
│   │   ├── prometheus_services.py
│   │   └── ...
│   ├── llms/                            # provider adapters
│   │   ├── openai.py
│   │   ├── anthropic/
│   │   ├── azure.py
│   │   ├── vertex_ai_and_google_ai_studio/
│   │   ├── bedrock/
│   │   ├── cohere.py
│   │   ├── ollama.py
│   │   └── ... (100+ providers)
│   ├── proxy/
│   │   ├── proxy_server.py              # FastAPI app
│   │   ├── auth/                        # virtual key auth
│   │   ├── spend_tracking/              # budget + spend
│   │   └── utils.py
│   └── types/                           # Pydantic models
├── model_prices_and_context_window.json # pricing database
├── schema.prisma                        # DB schema (PostgreSQL/SQLite)
├── docker-compose.yml
└── ui/litellm-dashboard/               # Admin React UI
```

---

## 10. Mapping to mekong-cli RaaS AGI System

### Current mekong-cli vs litellm Patterns

| Concept | mekong-cli | litellm | Gap |
|---------|-----------|---------|-----|
| Unified API | `llm_client.py` (basic) | `completion()` (100+ providers) | mekong missing multi-provider |
| Load balancing | None | Router (6 strategies) | Add Router-style dispatch |
| Fallback | None | 3-tier fallback chain | Critical gap |
| Cost tracking | None | `completion_cost()` + DB | Add cost tracking |
| Budget enforcement | None | `max_budget` + Prisma | Add budget layer |
| Callbacks | `telemetry.py` (basic) | CustomLogger (6 hooks) | Extend to full observer |
| Error normalization | MekongError hierarchy | OpenAI-compatible errors | Close enough |
| Caching | None | 6 cache types | Add Redis caching |
| Config | `config.py` | `config.yaml` (structured) | Adopt structured config |
| Virtual keys | None | Prisma-backed keys | Add for RaaS multi-tenant |

### Recommended Adoption Strategy

**Phase 1 — Direct Integration (KISS)**
```python
# Replace current llm_client.py with litellm
import litellm
from litellm import Router

# Current Antigravity Proxy (port 9191) stays as-is
litellm.api_base = "http://localhost:9191"

# Add Router for model fallback
router = Router(model_list=[
    {"model_name": "default", "litellm_params": {"model": "gemini/gemini-3-pro-high", "api_base": "http://localhost:9191"}},
    {"model_name": "default", "litellm_params": {"model": "anthropic/claude-opus-4-6"}},
])
```

**Phase 2 — Adopt litellm as Proxy**

Replace Antigravity Proxy with litellm proxy:
```yaml
# config.yaml
model_list:
  - model_name: gemini-pro
    litellm_params:
      model: gemini/gemini-3-pro-high
      api_base: http://localhost:9191  # still route through Antigravity
  - model_name: claude-opus
    litellm_params:
      model: anthropic/claude-opus-4-6

litellm_settings:
  fallbacks: [{"gemini-pro": ["claude-opus"]}]
  success_callback: ["langfuse"]
```

**Phase 3 — Cost Tracking for RaaS**
```python
from litellm import completion_cost

response = router.completion(model="default", messages=[...])
cost = completion_cost(completion_response=response)
# Store cost per user/mission for billing
```

### What litellm Gets Right (Steal These Patterns)

1. **OpenAI schema as lingua franca** — all I/O speaks OpenAI format. Don't invent your own schema.
2. **Model string prefix routing** — `openai/gpt-4`, `anthropic/claude-3`. Simple, no registry needed.
3. **Pricing JSON file** — maintain a static JSON for all model prices. Trivial to update.
4. **CustomLogger observer** — 6 hooks cover every event. Register multiple observers.
5. **3-tier fallback chain** — separate generic/content/context fallbacks is the right abstraction.
6. **Config YAML with `os.environ/VAR`** — elegant env var injection without .env files.
7. **`_hidden_params` on response** — attach metadata (cost, cache_hit) to response without breaking schema.
8. **Cooldown auto-disable** — don't just retry, put bad deployments in cooldown.

### What litellm Overengineers (Avoid)

- Prisma + full DB for basic deployments (SQLite fine for mekong-cli)
- Admin dashboard (unnecessary for CLI-first system)
- The entire `litellm-proxy-extras` package (enterprise bloat)
- MCP/A2A protocol support (not needed yet)
- 100+ provider adapters (start with 3: Anthropic, OpenAI, Gemini)

---

## Sources

- [BerriAI/litellm GitHub](https://github.com/BerriAI/litellm)
- [litellm Router Docs](https://docs.litellm.ai/docs/routing)
- [litellm Proxy Config Docs](https://docs.litellm.ai/docs/proxy/configs)
- [litellm Custom Callbacks](https://docs.litellm.ai/docs/observability/custom_callback)
- [litellm Caching](https://docs.litellm.ai/docs/caching/all_caches)
- [litellm Cost Calculation — DeepWiki](https://deepwiki.com/BerriAI/litellm/2.6-cost-calculation-and-model-pricing)
- [litellm Fallback/Reliability](https://docs.litellm.ai/docs/proxy/reliability)
- [litellm Exception Mapping](https://docs.litellm.ai/docs/exception_mapping)
- [litellm Completion Token Usage](https://docs.litellm.ai/docs/completion/token_usage)

---

## Unresolved Questions

1. **litellm vs direct integration**: Should mekong-cli adopt litellm as a dependency or just copy patterns? litellm adds ~50MB to install. For CLI, copying patterns may be cleaner.
2. **Antigravity Proxy compatibility**: litellm's `api_base` override is per-model. Can Antigravity Proxy's date-suffix model alias system work cleanly as a litellm backend? Needs testing.
3. **litellm proxy vs Antigravity Proxy**: Running both (Antigravity on 9191, litellm proxy on 4000, routing through Antigravity) adds latency. Worth it for the features?
4. **Cost tracking in Tôm Hùm**: Which layer should own per-mission cost? `RecipeOrchestrator`, `ProxyLogging`, or mission-level post-processing?
5. **Semantic caching ROI**: For the types of missions mekong-cli runs (code generation, planning), semantic caching hit rate may be low (<5%). Probably YAGNI for now.
