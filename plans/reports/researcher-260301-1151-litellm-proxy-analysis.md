# Research Report: LiteLLM Proxy — Patterns for Antigravity Proxy Enhancement

**Date:** 2026-03-01
**Scope:** BerriAI/litellm proxy server implementation mapped to mekong-cli's Antigravity Proxy (port 9191)
**Sources:** docs.litellm.ai, github.com/BerriAI/litellm, litellm/router.py source analysis, existing `src/core/llm_client.py`

---

## Executive Summary

LiteLLM Proxy is a production-grade OpenAI-compatible gateway exposing 100+ LLM providers behind a single REST API on port 4000. Its architecture is split: the **SDK** handles core completion/embedding calls, and the **Proxy Server** (FastAPI) adds auth, budgets, routing, caching, guardrails, and observability.

Mekong-CLI's Antigravity Proxy already does the hard part (load balancing across Gemini/Anthropic accounts, quota rotation, model fallover). What it likely lacks vs. LiteLLM: structured budget tracking, semantic caching, per-key rate limits, health check endpoints, and guardrails. The biggest quick wins for mekong-cli are adopting LiteLLM's **config.yaml-driven router**, **Redis-backed usage tracking**, and **typed fallback chains**.

---

## 1. Proxy Router Architecture

### LiteLLM Pattern

Core class: `litellm.router.Router` in `litellm/router.py`.

```
config.yaml (model_list + router_settings)
        ↓
Router.__init__() → builds deployment registry
        ↓
Router.ahash_completion(model, messages)
  1. filter_deployments(model_name)  → healthy candidates
  2. strategy_impl.get_available_deployment()  → pick one
  3. litellm.acompletion(litellm_params)  → execute
  4. on failure → retry / fallback loop
```

Key files:
- `litellm/router.py` — Router class, deployment registry, retry/fallback loop
- `litellm/proxy/proxy_server.py` — FastAPI server wrapping Router
- `litellm/router_strategy/` — one file per routing strategy

**OpenAI-compatible endpoints exposed:**
- `POST /chat/completions`
- `POST /completions`
- `POST /embeddings`
- `GET /models`
- `POST /key/generate`
- `GET /health`, `GET /health/liveliness`, `GET /health/readiness`

### Antigravity Proxy (current mekong-cli state)

From `src/core/llm_client.py`:
- Provider priority: `vertex (Gemini) → proxy (Antigravity) → openai`
- Circuit breaker: `ProviderHealth` dataclass — 3 consecutive failures → 60s cooldown
- Failover: `_get_ordered_providers()` skips unhealthy providers
- No structured config file — all wired via env vars and constructor args
- No Redis — state is in-process only (dies on restart)

**Gap:** No config-driven multi-deployment routing. Only 3 static providers, not N deployments of the same model across accounts.

---

## 2. Load Balancing Strategies

### LiteLLM Strategies

Implemented in `litellm/router_strategy/`, selected via `routing_strategy` in config:

| Strategy | File | Use Case |
|---|---|---|
| `simple-shuffle` | `simple_shuffle.py` | Default, random, even distribution |
| `least-busy` | `lowest_cost.py` | Lowest active request count (Redis-tracked) |
| `latency-based-routing` | `lowest_latency.py` | EMA of TTFT + total latency (Redis) |
| `usage-based-routing-v2` | `usage_based_routing_v2.py` | Lowest current TPM/RPM vs limit |
| `cost-based-routing` | `lowest_cost.py` | Cheapest deployment first |

Priority ordering (fallback within a group):
```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: azure/gpt-4-primary
      order: 1   # try first
  - model_name: gpt-4
    litellm_params:
      model: azure/gpt-4-fallback
      order: 2   # try second
```

Full config:
```yaml
router_settings:
  routing_strategy: latency-based-routing
  num_retries: 3
  timeout: 30
  cooldown_time: 60       # seconds before re-enabling failed deployment
  allowed_fails: 3        # failures before cooldown triggers
  redis_host: localhost
  redis_port: 6379
```

### Antigravity Proxy Gap

Current `_get_ordered_providers()` is static priority list. No latency tracking, no usage-based routing, no weighted distribution across N accounts of the same provider.

**Recommendation for mekong-cli:** Adopt `order`-based priority + `allowed_fails`/`cooldown_time` pattern — map to multiple Gemini accounts in `model_list`.

---

## 3. Rate Limiting & Budget Tracking

### LiteLLM Pattern

Three layers of enforcement:

**Layer 1: Per-deployment hard limits (Router level)**
```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: azure/gpt-4
      rpm: 10      # requests/minute hard cap
      tpm: 10000   # tokens/minute hard cap
```

**Layer 2: Per-key/user/team budgets (Proxy level)**
```python
# BudgetManager in litellm/proxy/budget_manager.py
# Stored in PostgreSQL: LiteLLM_VerificationTokenTable
{
  "max_budget": 100.0,          # USD total spend cap
  "budget_duration": "30d",     # window for reset
  "tpm_limit": 50000,
  "rpm_limit": 100,
  "max_parallel_requests": 10
}
```

**Layer 3: Redis INCR for real-time RPM/TPM tracking**
```python
# Increments Redis key "rpm:{key_hash}:{minute_window}"
# Returns 429 if over limit
```

Cost calculation: `litellm/model_prices_and_context_window.json` has per-token pricing for every model — cost computed post-completion from usage metadata.

**Enable strict enforcement:**
```yaml
router_settings:
  optional_pre_call_checks:
    - enforce_model_rate_limits
```

### Antigravity Proxy Gap

From `llm_client.py` — no budget tracking, no spend calculation, no per-account RPM enforcement. Circuit breaker only triggers on actual API errors (429/500), not proactive usage limits.

**Recommendation:** Add Redis-backed RPM counters per Gemini account. Rotate accounts before hitting quota (proactive), not after hitting error (reactive). Add `completion_cost()` tracking using token counts from `response.usage_metadata`.

---

## 4. Model Fallback Chains

### LiteLLM Pattern

Three fallback types with different triggers:
```yaml
litellm_settings:
  num_retries: 3                  # retries on same model before fallback
  allowed_fails: 3                # deployment failures → cooldown
  cooldown_time: 30               # seconds in cooldown

  # General fallback (rate limit, 500s, timeouts)
  fallbacks: [{"fast-model": ["reliable-model"]}]

  # Context window exceeded
  context_window_fallbacks: [{"gpt-4": ["gpt-4-32k"]}]

  # Content policy violation
  content_policy_fallbacks: [{"claude-2": ["openai/gpt-4o"]}]

  # Global fallback when all primary models fail
  default_fallbacks: ["backup-model"]
```

Execution flow in `router.py`:
```
Request → try primary model
  → 429/500 → num_retries exhausted → check fallbacks list
  → try fallback[0] → fail → try fallback[1] → ...
  → all fallbacks fail → raise LiteLLMError
```

Disable per-request: `"disable_fallbacks": true` in request body.

### Antigravity Proxy Current State

`llm_client.py` has a good circuit breaker pattern. Missing:
- Context-window-specific fallback (e.g., gemini-2.5-pro → gemini-2.5-pro-long)
- Content policy fallback path
- Configurable fallback chains (currently hard-coded provider list)

**Recommendation:** Add `FALLBACK_CHAIN` env var or config dict mapping model names to ordered fallback lists. Detect `ContextWindowExceededError` specifically to route to a larger context model.

---

## 5. Caching Layer

### LiteLLM Pattern

7 backends: local (in-memory), disk, Redis, Redis Semantic, Qdrant Semantic, S3, GCS.

**Redis cache config:**
```yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis
    ttl: 600                      # global TTL seconds
    default_in_memory_ttl: 300
    mode: default_on              # or default_off (opt-in)
    supported_call_types:
      - acompletion
      - aembedding
```

**Semantic caching (Qdrant):**
```yaml
cache_params:
  type: qdrant-semantic
  qdrant_semantic_cache_embedding_model: text-embedding-3-small
  qdrant_collection_name: llm_cache
  similarity_threshold: 0.8
  qdrant_semantic_cache_vector_size: 1536
```

**Per-request cache control:**
```json
{
  "model": "gpt-4",
  "messages": [...],
  "cache": {
    "ttl": 300,
    "no-cache": false,
    "namespace": "my-feature"
  }
}
```

Cache key: deterministic hash of `(model, messages, temperature, params)`. Returned in response header `x-litellm-cache-key`.

Cache management endpoints:
- `GET /cache/ping` — health check
- `POST /cache/delete` — invalidate by keys

### Antigravity Proxy Gap

No caching layer. Every request hits the LLM API. For Tôm Hùm's Auto-CTO tasks that repeat similar prompts (code quality audits, i18n checks), a cache hit rate of 30-50% is plausible, saving quota and reducing latency.

**Recommendation (KISS):** Start with in-memory dict cache in `llm_client.py` keyed on `hash(messages + model)`. Add TTL of 300s. No Redis dependency needed for single-process M1 setup.

```python
# Simple cache addition to LLMClient
import hashlib
self._cache: Dict[str, tuple[LLMResponse, float]] = {}

def _cache_key(self, messages, model) -> str:
    content = json.dumps({"m": model, "msgs": messages}, sort_keys=True)
    return hashlib.sha256(content.encode()).hexdigest()[:16]
```

---

## 6. Authentication — Virtual Keys

### LiteLLM Pattern

Master key → team keys → user keys → virtual keys hierarchy.

**Setup:**
```yaml
general_settings:
  master_key: sk-1234       # admin key (must start sk-)
  database_url: postgresql://...
```

**Key generation:**
```bash
curl http://localhost:4000/key/generate \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "models": ["gpt-4"],
    "max_budget": 10.0,
    "budget_duration": "30d",
    "rpm_limit": 100,
    "tpm_limit": 50000,
    "metadata": {"user": "agent-team-1"}
  }'
```

Key stored in `LiteLLM_VerificationTokenTable` (PostgreSQL). In-memory TTL cache (`user_api_key_cache_ttl: 60`) reduces DB hits.

Key features:
- Block/unblock: `POST /key/block`, `/key/unblock`
- Auto-rotate: `auto_rotate: true, rotation_interval: "30d"`
- Temp budget increase: `temp_budget_increase`, `temp_budget_expiry`
- Custom validation: `custom_generate_key_fn` hook

### Antigravity Proxy Relevance

Antigravity Proxy manages multiple Gemini/Anthropic accounts — each account is effectively a "virtual key" with its own quota. LiteLLM's virtual key pattern maps cleanly to this: each account = one entry in `model_list` with `rpm`/`tpm` limits.

**Recommendation:** If Antigravity Proxy exposes an admin API, add account registry as structured config (not env vars) with per-account RPM limits and spend tracking.

---

## 7. Streaming (SSE)

### LiteLLM Pattern

LiteLLM normalizes SSE streaming from all providers into OpenAI-compatible `data: {"choices": [{"delta": ...}]}` chunks.

```python
# Client side — identical for all providers
stream = client.chat.completions.create(
    model="gpt-4",
    messages=[...],
    stream=True
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")
```

Under the hood, LiteLLM's `proxy_server.py` uses FastAPI's `StreamingResponse` with `async_generator` that translates provider-specific stream formats (Gemini `generateContentStream`, Anthropic `stream=True`, OpenAI native SSE) into unified OpenAI SSE chunks.

Key consideration: the proxy must buffer enough to detect errors before streaming starts. LiteLLM handles this via `complete_streaming_response` aggregation in callbacks.

### Antigravity Proxy Gap

`llm_client.py` does not implement streaming — all calls are synchronous `requests.post()`. For long-form content generation in CC CLI sessions, streaming would reduce perceived latency.

**Recommendation (YAGNI):** Skip for now. CC CLI uses claude -p (non-interactive), so streaming output isn't consumed incrementally. Only add if mekong-cli exposes an HTTP gateway that humans or UIs consume.

---

## 8. Health Checks

### LiteLLM Pattern

Four endpoints:

| Endpoint | Protection | Purpose |
|---|---|---|
| `GET /health` | Admin-only | Makes real API calls to all models, returns healthy/unhealthy list |
| `GET /health/liveliness` | Public | Returns "I'm alive!" — for container restart decisions |
| `GET /health/readiness` | Public | Returns DB connection status + active callbacks |
| `GET /health/services` | Admin-only | Checks Datadog, Langfuse, Slack integrations |

Background health checks:
```yaml
general_settings:
  background_health_checks: true
  health_check_interval: 300      # every 5 minutes
  health_check_details: false     # hide sensitive info in response

# Per-model override
model_info:
  health_check_timeout: 10
  health_check_max_tokens: 5
  disable_background_health_check: true
```

Health check response format:
```json
{
  "healthy_endpoints": [{"model": "gpt-4", "api_base": "..."}],
  "unhealthy_endpoints": [{"model": "claude-3", "error": "..."}],
  "healthy_count": 2,
  "unhealthy_count": 1
}
```

### Antigravity Proxy Gap

`ProviderHealth.is_healthy` in `llm_client.py` only tracks failures reactively. No proactive health polling, no HTTP endpoint for external monitoring.

**Recommendation:** Add `GET /health` endpoint to Antigravity Proxy (if it's an HTTP server). Return per-account status. For mekong-cli's Python LLMClient, add a `probe()` method that sends a minimal test request to each configured provider and updates `ProviderHealth`.

---

## 9. Guardrails

### LiteLLM Pattern

Configurable via `guardrails:` in `config.yaml`. Four execution modes:
- `pre_call` — block before LLM call
- `post_call` — filter after response
- `during_call` — parallel (blocks stream until done)
- `logging_only` — log but don't block

**Supported providers:** Bedrock, LlamaGuard, Presidio (PII), Azure Content Safety, Aporia, Lakera, Guardrails AI.

**PII masking (Presidio):**
```yaml
guardrails:
  - guardrail_name: "pii-mask"
    litellm_params:
      guardrail: presidio
      mode: pre_call
      pii_entities_config:
        CREDIT_CARD: "MASK"
        EMAIL_ADDRESS: "MASK"
        US_SSN: "BLOCK"
      presidio_score_thresholds:
        EMAIL_ADDRESS: 0.6
```

**Per-request activation:**
```json
{"guardrails": ["pii-mask"], "messages": [...]}
```

Response header: `x-litellm-applied-guardrails: pii-mask`.

Admin lock: `metadata.guardrails.modify_guardrails: false` on team → users can't disable guardrails.

### Antigravity Proxy Relevance

Mekong-CLI sends code, plans, and business data through LLM. PII in customer data (from Lead Hunter, email content) could be inadvertently sent. Presidio PII masking as `pre_call` guardrail would prevent leaking emails/names/SSNs to cloud LLMs.

**Recommendation (low priority for now):** Not needed until mekong-cli processes external customer PII. If/when Sophia AI Factory processes user data through LLM, add Presidio pre_call masking.

---

## 10. Deployment

### LiteLLM Production Stack

**Minimum viable (single container):**
```bash
docker run -p 4000:4000 \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -e LITELLM_MASTER_KEY=sk-1234 \
  docker.litellm.ai/berriai/litellm:main-stable \
  --config /app/config.yaml
```

**Full production (docker-compose):**
```yaml
version: "3.9"
services:
  litellm:
    image: docker.litellm.ai/berriai/litellm:main-stable
    ports: ["4000:4000"]
    environment:
      DATABASE_URL: postgresql://user:pass@postgres:5432/litellm
      LITELLM_MASTER_KEY: sk-1234
      LITELLM_SALT_KEY: sk-salt-key
    command: ["--config", "/app/config.yaml"]
    depends_on: [postgres, redis]
  postgres:
    image: postgres:15
    environment: {POSTGRES_DB: litellm, POSTGRES_USER: user, POSTGRES_PASSWORD: pass}
  redis:
    image: redis:alpine
```

**Kubernetes:**
- Helm chart: `oci://docker.litellm.ai/berriai/litellm-helm`
- Liveness: `GET /health/liveliness` (120s initial delay, 15s period)
- Readiness: `GET /health/readiness`
- Resources: min 4 CPU cores, 8 GB RAM for production

**Scaling tiers:**
1. Single container (no DB) — dev/test
2. Container + PostgreSQL — key management, spend tracking
3. Container + PostgreSQL + Redis — multi-instance, distributed rate limits
4. Multiple containers + DB + Redis — high availability, K8s

### Antigravity Proxy Current Setup

Running on M1 MacBook as local daemon (`PORT=9191`). Not containerized. Single-process. No Redis. Config via env vars + `settings.json`.

**For mekong-cli, containerization is YAGNI.** The relevant deployment insight is the **scaling tier model** — Redis is the critical unlock for multi-instance or stateful routing.

---

## Comparison: LiteLLM vs Antigravity Proxy

| Capability | LiteLLM | Antigravity Proxy (current) | Gap |
|---|---|---|---|
| Multi-provider routing | 100+ providers, config-driven | 3 static providers (Gemini/Proxy/OpenAI) | HIGH |
| Load balancing | 5 strategies, Redis-backed | Round-robin implicit via provider order | MEDIUM |
| Rate limits | Per-deployment RPM/TPM hard caps | Reactive only (on 429) | HIGH |
| Budget tracking | Per-key/user/team USD spend | None | MEDIUM |
| Fallback chains | 3 types (general/context/policy) | Simple priority list | MEDIUM |
| Caching | 7 backends, semantic cache | None | MEDIUM |
| Authentication | Virtual keys, teams, budgets | Master key via env var | LOW (internal use) |
| Streaming | Full SSE normalization | Not implemented | LOW (not consumed) |
| Health checks | 4 endpoints + background polling | ProviderHealth circuit breaker | MEDIUM |
| Guardrails | PII, content policy, custom | None | LOW |
| Observability | OpenTelemetry, Prometheus, 10+ integrations | Basic logging | LOW |
| Deployment | Docker, K8s, Helm, cloud-native | Single process, local only | LOW (M1 local) |

---

## Actionable Recommendations for mekong-cli

Ordered by impact/effort ratio:

### Priority 1: Config-Driven Multi-Account Router (HIGH IMPACT, MEDIUM EFFORT)

Replace static 3-provider `_get_ordered_providers()` with a config-driven account registry. Model each Gemini/Anthropic account as a separate "deployment" with RPM limits and priority order.

```python
# Proposed config structure (e.g., .mekong/proxy-config.yaml)
accounts:
  - name: gemini-account-1
    provider: vertex
    api_key: ${GEMINI_KEY_1}
    rpm: 60
    tpm: 100000
    order: 1
  - name: gemini-account-2
    provider: vertex
    api_key: ${GEMINI_KEY_2}
    rpm: 60
    tpm: 100000
    order: 2
  - name: claude-fallback
    provider: anthropic
    api_key: ${ANTHROPIC_KEY}
    rpm: 50
    order: 3
```

Map LiteLLM's `Router` pattern: filter by health → select by strategy → execute → record metrics.

### Priority 2: Proactive RPM Tracking (HIGH IMPACT, LOW EFFORT)

Add in-process RPM counter per account. Rotate to next account before hitting quota (proactive), not after 429 (reactive). LiteLLM pattern: `Redis INCR rpm:{account}:{minute_window}`.

For single-process M1: use `collections.deque` with timestamps instead of Redis:
```python
from collections import deque
import time

class RPMTracker:
    def __init__(self, limit: int):
        self.limit = limit
        self._requests = deque()  # timestamps

    def can_request(self) -> bool:
        now = time.time()
        # Remove requests older than 60s
        while self._requests and now - self._requests[0] > 60:
            self._requests.popleft()
        return len(self._requests) < self.limit

    def record(self):
        self._requests.append(time.time())
```

### Priority 3: Simple In-Memory Cache (MEDIUM IMPACT, LOW EFFORT)

Add SHA256-keyed response cache to `LLMClient.chat()` for identical prompts. TTL 300s. Saves quota on Tôm Hùm's repetitive auto-CTO tasks.

```python
def chat(self, messages, model=None, **kwargs) -> LLMResponse:
    if not kwargs.get('no_cache'):
        key = self._cache_key(messages, model or self.model)
        if key in self._cache:
            cached, ts = self._cache[key]
            if time.time() - ts < 300:
                return cached
    result = self._do_chat(messages, model, **kwargs)
    self._cache[key] = (result, time.time())
    return result
```

### Priority 4: Typed Fallback Chains (MEDIUM IMPACT, LOW EFFORT)

Add `ContextWindowExceededError` detection in `_vertex_chat()` to trigger fallback to a 1M-context model:
```python
except Exception as e:
    if "context window" in str(e).lower() or "400" in str(e):
        # Try fallback model with larger context
        return self._vertex_chat(messages, model="gemini-2.0-flash", ...)
```

### Priority 5: Health Probe Method (LOW IMPACT, LOW EFFORT)

Add `LLMClient.probe() -> dict` that sends a 1-token request to each configured provider and returns health status. Used by Tôm Hùm's `m1-cooling-daemon.js` or startup checks.

---

## Full LiteLLM Config Reference (for future adoption)

```yaml
# litellm_config.yaml — Full reference if mekong-cli adopts LiteLLM

model_list:
  - model_name: gemini-pro           # logical name CC CLI uses
    litellm_params:
      model: gemini/gemini-2.0-pro
      api_key: os.environ/GEMINI_KEY_1
      rpm: 60
      tpm: 100000
      order: 1
  - model_name: gemini-pro           # same logical name = load balanced
    litellm_params:
      model: gemini/gemini-2.0-pro
      api_key: os.environ/GEMINI_KEY_2
      rpm: 60
      tpm: 100000
      order: 2
  - model_name: gemini-pro-fallback
    litellm_params:
      model: anthropic/claude-opus-4-6
      api_key: os.environ/ANTHROPIC_KEY
      rpm: 50

router_settings:
  routing_strategy: latency-based-routing
  num_retries: 3
  cooldown_time: 60
  allowed_fails: 3
  timeout: 120

litellm_settings:
  fallbacks: [{"gemini-pro": ["gemini-pro-fallback"]}]
  context_window_fallbacks: [{"gemini-pro": ["gemini/gemini-2.0-pro-1m"]}]
  cache: true
  cache_params:
    type: local     # in-memory for M1
    ttl: 300

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

---

## Unresolved Questions

1. Does Antigravity Proxy expose its own HTTP API? If yes, what endpoints? (Would determine if adding `/health` is feasible without source changes)
2. How many Gemini/Anthropic accounts does Antigravity Proxy currently manage? (Determines whether multi-account RPM tracking is worth implementing in-process vs. adopting LiteLLM as the proxy)
3. Is there a plan to run multiple mekong-cli instances (e.g., for parallel worktrees)? If yes, Redis-backed state becomes necessary and LiteLLM adoption makes more sense than custom implementation.
4. Does Tôm Hùm's auto-CTO repeat identical or near-identical prompts? If yes, cache hit rate estimate would validate Priority 3 effort.
5. Does mekong-cli need to expose LLM access to external agents (not just local CC CLI)? If yes, LiteLLM virtual keys + `/key/generate` become directly relevant.
