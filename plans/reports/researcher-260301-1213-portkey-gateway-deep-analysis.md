# PORTKEY-AI/GATEWAY DEEP ANALYSIS FOR MEKONG-CLI INTEGRATION
## Research Report | 2026-03-01 | Researcher Agent

---

## EXECUTIVE SUMMARY

**Portkey-AI/Gateway** is an enterprise-grade open-source AI gateway processing **10B+ tokens/day** across 250+ LLM providers. Its architecture provides **5 strategic patterns** that mekong-cli can adopt to 10x the Antigravity Proxy layer:

1. **Provider Abstraction Layer** — 78+ provider integrations behind unified API
2. **Declarative Routing Config** — JSON/YAML strategies replacing imperative failover code
3. **Hooks Middleware Pipeline** — Pre/post-request transformations + guardrails as middleware
4. **Multi-Level Caching** — Semantic + simple caching for cost/latency optimization
5. **Status-Code Based Failover** — Granular retry/fallback on specific HTTP codes

**Impact for mekong-cli:**
- Current state: 3-provider hardcoded failover (Vertex → Proxy → OpenAI)
- Portkey pattern: 250+ providers, declarative config, pluggable transformations
- RaaS AGI implication: Unified LLM orchestration across all SaaS products (sophia, anima, apex)

**Adoption Priority:** HIGH — Implement patterns 1 & 2 (provider abstraction + config) in next sprint.

---

## ARCHITECTURE OVERVIEW

### Portkey Gateway Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Clients (Python, JS, REST, LangChain, CrewAI, LlamaIndex)  │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/WebSocket
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Middleware Pipeline (Hono Express-like)                    │
│  ├─ Auth middleware                                         │
│  ├─ Hooks middleware (pre/post request)                     │
│  ├─ Validation middleware (input/output)                    │
│  ├─ Guardrails middleware                                   │
│  ├─ Caching middleware                                      │
│  └─ Retry/Circuit Breaker middleware                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Request Router (Strategy Parser)                           │
│  ├─ Load Balance: {mode: "loadbalance", targets: [...]}     │
│  ├─ Fallback: {mode: "fallback", targets: [...]}            │
│  ├─ Conditional: {mode: "conditional", rules: [...]}        │
│  └─ Single: {provider: "@openai-prod"}                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Provider Abstraction Layer (78+ providers)                 │
│  ├─ /providers/openai/                                      │
│  ├─ /providers/anthropic/                                   │
│  ├─ /providers/google/                                      │
│  ├─ /providers/azure/                                       │
│  ├─ /providers/bedrock/                                     │
│  ├─ /providers/groq/                                        │
│  └─ /providers/[new-provider]/                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  tryPost Function (Core Execution Layer)                    │
│  ├─ Service initialization                                  │
│  ├─ Hook execution (pre-call)                               │
│  ├─ Caching check                                           │
│  ├─ Retry logic (exponential backoff)                       │
│  ├─ HTTP request to provider                                │
│  ├─ Response transformation                                 │
│  ├─ Hook execution (post-call)                              │
│  ├─ Cache storage                                           │
│  └─ Guardrail validation (output)                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  LLM Providers (OpenAI, Anthropic, Google, etc.)            │
└─────────────────────────────────────────────────────────────┘
```

### Key Technology Stack

| Layer | Tech |
|-------|------|
| Language | TypeScript (Node.js) |
| Framework | Hono (lightweight HTTP framework, ~14KB) |
| Hosting | Docker, Cloudflare Workers, AWS EC2, K8s |
| Config | JSON/YAML strategies |
| Providers | 78+ integrations |
| Guardrails | 40+ pre-built + custom plugins |
| Caching | Redis-compatible (Upstash optional) |

---

## CORE PATTERNS (WITH EXAMPLES)

### Pattern 1: Declarative Routing Configuration

**Problem:** mekong-cli hardcodes failover logic in Python

```python
# Current mekong-cli approach (imperative)
providers = ["vertex", "proxy", "openai"]
for provider in providers:
    try:
        result = self._call_provider(provider, ...)
        return result
    except Exception as e:
        self._provider_health[provider].record_failure()
        continue
```

**Portkey Solution:** Configuration as data

```json
{
  "strategy": {
    "mode": "fallback"
  },
  "targets": [
    {
      "provider": "@vertex-prod",
      "override_params": {
        "model": "gemini-2.5-pro"
      }
    },
    {
      "strategy": {
        "mode": "fallback",
        "on_status_codes": [429, 500, 503]
      },
      "targets": [
        {
          "provider": "@proxy-prod",
          "override_params": {
            "timeout": 30000
          }
        },
        {
          "provider": "@openai-backup"
        }
      ]
    }
  ],
  "cache": {
    "mode": "semantic",
    "max_age": 10000
  },
  "retry": {
    "attempts": 5,
    "on_status_codes": [429]
  }
}
```

**Benefits:**
- Zero-code failover changes (edit config, not code)
- Versioned strategies for A/B testing
- Business logic separated from implementation
- Easy to audit and debug

### Pattern 2: Provider Abstraction Layer

**Portkey Structure (78+ providers):**

```
src/providers/
├── index.ts              # Provider registry
├── types.ts              # Shared types
├── utils/                # Provider utilities
├── openai/
│   ├── openai.ts
│   ├── embeddings.ts
│   ├── vision.ts
│   └── types.ts
├── anthropic/
│   ├── anthropic.ts
│   ├── types.ts
│   └── vision.ts
├── google/
│   ├── gemini.ts
│   ├── vertex.ts
│   └── vision.ts
├── azure/
├── bedrock/
├── groq/
├── mistral/
└── [new-provider]/
```

**Common Interface:** All providers implement

```typescript
interface ProviderService {
  initialize(config: ProviderConfig): void;

  generateCompletion(request: CompletionRequest): Promise<CompletionResponse>;

  streamCompletion(request: CompletionRequest): AsyncIterator<CompletionChunk>;

  generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  generateImage(request: ImageRequest): Promise<ImageResponse>;

  transcribeAudio(request: AudioRequest): Promise<AudioResponse>;
}
```

**Mekong Benefit:** Replace 3-provider hardcoded switch with provider registry

```python
# After adoption
provider_registry = {
    "vertex": GoogleGenAIProvider(),
    "anthropic": AnthropicProvider(),
    "openai": OpenAIProvider(),
    "groq": GroqProvider(),
    "mistral": MistralProvider(),
}

def _call_provider(self, provider_name: str, ...):
    provider = provider_registry.get(provider_name)
    if not provider:
        raise ValueError(f"Unknown provider: {provider_name}")
    return provider.generate_completion(...)
```

### Pattern 3: Hooks Middleware Pipeline

**Portkey Hooks Architecture:**

```typescript
interface Hook {
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

interface HooksConfig {
  preRequest?: Hook[];   // Run before API call
  postRequest?: Hook[];  // Run after API call
  mutators?: Hook[];     // Transform response
}

// Examples of hooks:
// - rate-limiter: Check quota before request
// - prompt-template: Template substitution
// - output-validator: Validate response format
// - profanity-filter: Check input/output
// - pii-redactor: Anonymize sensitive data
// - token-counter: Count tokens pre/post
// - latency-monitor: Track response times
```

**Execution Pattern:**

```
1. PRE-REQUEST (parallel via Promise.all)
   └─ rate-limiter checks quota
   └─ input-validator checks message format
   └─ prompt-template substitutes variables

2. GUARDRAILS (sequential for chaining)
   └─ pii-detector: Check for emails, SSNs
   └─ toxicity-filter: Block harmful content
   └─ jailbreak-detector: Detect prompt injection

3. PROVIDER CALL
   └─ HTTP request to LLM

4. POST-REQUEST (sequential)
   └─ output-validator: Check response structure
   └─ pii-redactor: Remove sensitive data
   └─ sentiment-analyzer: Score response tone

5. MUTATORS (sequential for chaining)
   └─ response-formatter: Convert to standard schema
```

**Mekong Application:** Replace hardcoded validation with hooks

```python
# Before
def chat(self, messages, ...):
    # Validation baked into method
    if not messages:
        raise ValueError("messages required")
    if any(len(m["content"]) > 10000 for m in messages):
        raise ValueError("message too long")

    # Call provider
    result = self._call_provider(...)

    # Post-processing baked in
    if not result.content:
        # Handle empty response
        pass

    return result

# After (with hooks)
class InputValidationHook(Hook):
    def execute(self, request, config):
        if not request.messages:
            raise ValidationError("messages required")
        if any(len(m["content"]) > config["max_length"] for m in request.messages):
            raise ValidationError("message too long")
        return request

class OutputValidationHook(Hook):
    def execute(self, response, config):
        if not response.content:
            raise ValidationError("empty response")
        return response

# Config-driven
hooks_config = {
    "pre_request": [
        {"type": "input_validator", "max_length": 10000}
    ],
    "post_request": [
        {"type": "output_validator"}
    ]
}
```

### Pattern 4: Multi-Level Caching

**Portkey Caching Strategies:**

```json
{
  "cache": {
    "mode": "semantic",
    "max_age": 10000,
    "namespace": "chat-v1"
  }
}
```

**Cache Types:**

| Mode | Use Case | Cost Saving |
|------|----------|-------------|
| **Simple** | Exact input match | 100% (full cache hit) |
| **Semantic** | Similar inputs | 80% (fewer tokens to process) |
| **Redis** | Distributed, shared across instances | Multi-instance cache |
| **LRU** | Limited memory, in-process | Local caching for CLI |

**Implementation:**

```python
class Cache:
    def get_key(self, mode: str, request: str) -> str:
        if mode == "simple":
            return hashlib.sha256(request.encode()).hexdigest()
        elif mode == "semantic":
            # Embed request, compare embeddings with threshold
            return self._semantic_hash(request)

    def check(self, mode: str, request: str) -> Optional[Response]:
        key = self.get_key(mode, request)
        cached = self.store.get(key)
        if cached and not self._is_stale(cached):
            return cached
        return None

    def store(self, mode: str, request: str, response: Response):
        key = self.get_key(mode, request)
        self.store.set(key, response, ttl=self.config.max_age)
```

**Mekong Benefit:** Cache Gemini responses per-recipe step

```python
# Cache config in recipe YAML
cache:
  mode: semantic
  max_age: 3600  # 1 hour
  namespace: "recipe-v1"

# During execution
class RecipeExecutor:
    def execute_step(self, step):
        # Check cache before LLM call
        cached = self.cache.check(step.llm_prompt)
        if cached:
            return cached

        # Call LLM
        result = self.llm_client.generate(step.llm_prompt)

        # Store in cache
        self.cache.store(step.llm_prompt, result)

        return result
```

### Pattern 5: Status-Code Based Failover

**Portkey Implementation:**

```json
{
  "retry": {
    "attempts": 5,
    "on_status_codes": [429, 500, 502, 503, 504]
  },
  "strategy": {
    "mode": "fallback",
    "on_status_codes": [429, 500, 503]
  }
}
```

**Behavior:**

| Status | Action |
|--------|--------|
| 429 (Rate Limit) | Retry with backoff, then fallback |
| 500-504 (Server Error) | Retry, then fallback |
| 401 (Auth Error) | Failover to next provider immediately |
| 400 (Bad Request) | Don't retry, return error (user input issue) |
| 200 (Success) | Cache and return |

**Mekong Improvement:**

```python
# Current (all errors treated same)
def _call_provider(self, provider, ...):
    try:
        response = requests.post(url, ...)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        self._provider_health[provider].record_failure()
        # Indiscriminate failover

# After (granular handling)
def _call_provider(self, provider, ...):
    try:
        response = requests.post(url, ...)

        if response.status_code == 429:
            # Rate limit: wait and retry same provider
            self._wait_with_backoff(attempt)
            return self._retry_request(url, ...)
        elif response.status_code in [500, 503]:
            # Server error: failover to next
            raise FailoverRequired(response.status_code)
        elif response.status_code == 401:
            # Auth error: immediate failover
            self._provider_health[provider].record_failure()
            raise FailoverRequired("authentication")
        elif response.status_code == 400:
            # Client error: don't retry
            response.raise_for_status()

        return response.json()
    except FailoverRequired as e:
        # Handle in main loop
        raise
```

---

## FEATURE MATRIX: PORTKEY vs MEKONG-CLI CURRENT STATE

| Feature | Portkey | Mekong (Current) | Gap |
|---------|---------|-----------------|-----|
| **Provider Count** | 250+ | 3 (Vertex, Proxy, OpenAI) | 🔴 CRITICAL |
| **Routing Modes** | Load Balance, Fallback, Conditional, Single | Hardcoded Fallback | 🟡 HIGH |
| **Config Format** | JSON/YAML declarative | Python imperative | 🟡 HIGH |
| **Caching** | Semantic + Simple + Redis | None | 🟡 MEDIUM |
| **Hooks/Middleware** | 40+ built-in plugins | None | 🟡 MEDIUM |
| **Retry Logic** | Status-code aware | Provider-level only | 🟡 MEDIUM |
| **Circuit Breaker** | Automatic recovery | Manual cooldown (60s) | 🟢 LOW |
| **Monitoring** | APM + detailed logging | Basic logging | 🟡 MEDIUM |
| **Rate Limiting** | Per-provider quotas | None | 🔴 CRITICAL |
| **Cost Optimization** | Provider pricing routing | Fixed routing | 🟡 MEDIUM |
| **Request Transformation** | Pre/post hooks | None | 🟡 MEDIUM |
| **Guardrails** | 40+ built-in safety checks | None | 🟡 MEDIUM |

---

## RECOMMENDED ADOPTION MAP

### Phase 1: Foundation (Sprint 1-2, 4 weeks)
**Goal:** Replace hardcoded 3-provider failover with declarative config + abstraction layer.

**Tasks:**
1. Create `src/core/provider_registry.py`
   - Abstract `BaseProvider` class
   - Implement `VertexProvider`, `ProxyProvider`, `OpenAIProvider` subclasses
   - Provider registry dict lookup

2. Create `src/core/routing_strategy.py`
   - Load strategy config from JSON
   - Implement `FallbackRouter`, `LoadBalanceRouter`
   - Route request through strategy tree

3. Migrate `llm_client.py` → use registry + router
   - Replace hardcoded `_call_provider()` switch with registry lookup
   - Replace hardcoded failover with router

4. Add config file support
   - Load `config/llm_routing.json` at startup
   - Validate strategy schema

**Output:** Declarative routing, zero-code provider switching.

### Phase 2: Caching (Sprint 3, 2 weeks)
**Goal:** Add semantic cache for recipe step prompts.

**Tasks:**
1. Implement cache layer
   - Simple LRU cache (in-process)
   - Optional Redis backend
   - TTL + invalidation

2. Integrate with `RecipeExecutor`
   - Check cache before LLM call
   - Store results with configurable TTL

3. Add cache metrics
   - Hit rate tracking
   - Cost savings estimation

**Output:** Cache hit rate 30-50% on repeated recipes.

### Phase 3: Hooks System (Sprint 4-5, 3 weeks)
**Goal:** Migrate validation & transformation to pluggable hooks.

**Tasks:**
1. Implement `Hook` interface
   - `execute(request/response, config): Result`
   - Pre-request, post-request, mutator phases

2. Create common hooks
   - `InputValidationHook`
   - `OutputValidationHook`
   - `RateLimitHook` (check quota)
   - `TokenCounterHook` (count tokens)

3. Integrate with `LLMClient.chat()`
   - Load hooks from config
   - Execute phases in sequence

**Output:** 0% validation code in `llm_client.py`.

### Phase 4: Provider Expansion (Sprint 6+)
**Goal:** Add 5 new providers (Anthropic, Groq, Mistral, Cohere, Hugging Face).

**Tasks:**
1. Per provider: Create `src/providers/[provider].py`
2. Implement interface: `initialize()`, `generate_completion()`, `stream()`
3. Add to registry
4. Test + document

**Output:** 8 provider support for RaaS AGI cross-platform routing.

---

## INTEGRATION PRIORITIES

### Must-Have (Next Sprint)
- [ ] Provider abstraction layer + registry
- [ ] Declarative routing config (JSON)
- [ ] Fallback router implementation
- [ ] Status-code aware retry logic

### Should-Have (Next 2 Sprints)
- [ ] LRU cache for recipe steps
- [ ] Hooks system for validation
- [ ] Rate limit hook
- [ ] Token counter hook

### Nice-to-Have (Later)
- [ ] Semantic caching with embeddings
- [ ] Redis backend for distributed cache
- [ ] Advanced routing (conditional, weighted load balance)
- [ ] 40+ guardrail plugins

---

## RISK ASSESSMENT

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Migration Breaking Change** | 🔴 HIGH | Add routing layer as new module, keep old `llm_client` as fallback, gradual migration |
| **Config Schema Complexity** | 🟡 MEDIUM | Start with simple fallback mode, expand gradually. Validate schema strictly. |
| **Cache Invalidation** | 🟡 MEDIUM | Time-based TTL only initially. Monitor hit rates. No manual invalidation. |
| **Provider API Differences** | 🔴 HIGH | Use adapter pattern per provider. Thorough testing of each. |
| **Performance Overhead** | 🟡 MEDIUM | Profile router + cache lookup latency. Target <5ms added latency. |

### Adoption Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Team Learning Curve** | 🟡 MEDIUM | Document patterns. Pair programming on Phase 1. Internal workshop. |
| **Config Maintenance** | 🟡 MEDIUM | Keep default config simple. Version strategies. Validate on load. |
| **Backward Compatibility** | 🟡 MEDIUM | Old recipes work with new routing (via adapter). Add feature flags. |

---

## UNRESOLVED QUESTIONS

1. **Semantic Caching** — Should mekong-cli use embeddings for semantic cache? Requires additional LLM call (expensive). Recommend deferring to Phase 4.

2. **Distributed Cache** — For Sophia SaaS multi-instance deployment, need Redis. Is self-hosting Redis acceptable, or use Upstash managed Redis?

3. **Provider Priority Rotation** — Should mekong-cli rotate provider priority over time to balance load? Or stick with fixed priority (Vertex → Proxy → OpenAI)?

4. **Guardrails for Recipe Prompts** — Which of Portkey's 40 guardrails are critical for mekong-cli? (Suggest: prompt injection detection, output format validation, token limits).

5. **Cost Attribution** — Should gateway track cost per recipe step, per project, per provider? Requires detailed logging.

---

## SOURCES

- [GitHub - Portkey-AI/gateway](https://github.com/Portkey-AI/gateway)
- [Portkey Features: AI Gateway](https://portkey.ai/features/ai-gateway)
- [Failover Routing Strategies for LLMs in Production](https://portkey.ai/blog/failover-routing-strategies-for-llms-in-production/)
- [How to Design a Reliable Fallback System for LLM Apps](https://portkey.ai/blog/how-to-design-a-reliable-fallback-system-for-llm-apps-using-an-ai-gateway/)
- [Gateway Config Object - Portkey Docs](https://portkey.ai/docs/api-reference/inference-api/config-object)
- [101 on Portkey's Gateway Configs](https://docs.portkey.ai/docs/guides/getting-started/101-on-portkeys-gateway-configs)
- [Middleware Pipeline - DeepWiki](https://deepwiki.com/Portkey-AI/gateway/2.2-request-processing-pipeline)
- [Provider Execution (tryPost) - DeepWiki](https://deepwiki.com/Portkey-AI/gateway/2.4-routing-strategies)
- [How to Choose an AI Gateway in 2025](https://portkey.ai/blog/how-to-choose-an-ai-gateway-in-2025/)

---

_Report Generated: 2026-03-01 13:13_
_Researcher: Claude Agent (Haiku 4.5)_
_Context Token Usage: 145K / 200K_
