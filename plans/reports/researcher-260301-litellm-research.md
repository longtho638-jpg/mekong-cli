# LiteLLM Research Report

**Date:** 2026-03-01 | **Researcher:** researcher-af424e7c

---

## 1. Core Purpose

LiteLLM is a Python SDK + Proxy Server (AI Gateway) providing unified interface to call 100+ LLM APIs (OpenAI, Azure, Anthropic, Gemini, Bedrock, VertexAI, Cohere, HuggingFace, VLLM, NVIDIA NIM) in OpenAI-compatible format. Returns consistent OpenAI-compatible response objects regardless of underlying provider.

---

## 2. Key Features

### Model Fallback
- **Error-based fallbacks**: Route to alternate model on any failure
- **Content policy fallbacks**: Specific fallback for policy violations
- **Context window fallbacks**: Escalate to larger model on token limit errors
- **Provider-level fallback**: Seamless failover across different LLM providers (e.g., Azure OpenAI → Anthropic)

### Proxy & Load Balancing
- **Proxy server**: Runs as standalone AI Gateway (exposes OpenAI-compatible `/v1/chat/completions` endpoint)
- **Router object**: Application-level load balancing with strategies: simple-shuffle, least-busy, usage-based-routing, latency-based-routing
- **Redis integration**: Production-grade cooldown tracking + TPM/RPM limits across distributed systems

### Budget Management
- **Global budgets**: `max_budget` (USD) + `budget_duration` (30s, 30m, 30h, 30d)
- **Per-model budgets**: Different spend limits per deployment
- **Cost tracking**: Integrated cost calculation across all providers

### Reliability
- **Retry policies**: Configurable retry counts per error type (Auth, Timeout, RateLimit, ContentPolicy, InternalServer)
- **Cooldowns**: Automatic deployment cooldown after threshold failures
- **Allowed fails policy**: Define failure thresholds before blocking a deployment

---

## 3. Python API Usage Patterns

### Basic Sync Completion
```python
import litellm
response = litellm.completion(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello"}]
)
```

### OpenAI-Compatible Endpoint
```python
response = litellm.completion(
    model="openai/custom-model",
    api_base="https://api.custom.com",
    api_key="sk-...",
    messages=[...]
)
```

### Router with Load Balancing (Sync)
```python
from litellm import Router
router = Router(model_list=[
    {"model_name": "gpt-4", "litellm_params": {"model": "gpt-4"}},
    {"model_name": "claude", "litellm_params": {"model": "claude-opus"}}
])
response = router.completion(model="gpt-4", messages=[...])
```

### Async Pattern
```python
response = await litellm.acompletion(model="gpt-4", messages=[...])
response = await router.acompletion(model="gpt-4", messages=[...])
```

---

## 4. OpenAI-Compatible API Handling

- **Unified interface**: All provider calls standardized through `litellm.completion()`
- **Prefix system**: Use `openai/model-name` to route to custom OpenAI-compatible endpoints
- **Parameters**: Accepts same parameters as OpenAI (messages, temperature, max_tokens, etc.)
- **Responses**: Always returns OpenAI-compatible response object with `usage`, `choices`, `model` fields
- **Error handling**: Converts provider-specific errors to OpenAI exception hierarchy (RateLimitError, AuthenticationError, etc.)

---

## 5. Configuration Patterns (YAML)

```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: sk-...
  - model_name: claude
    litellm_params:
      model: claude-opus-20250219
      api_key: sk-ant-...

fallbacks:
  - claude: [gpt-4-turbo]

content_policy_fallbacks:
  - gpt-4: [claude-opus]

context_window_fallbacks:
  - gpt-4: [gpt-4-32k]

litellm_settings:
  max_budget: 100.0
  budget_duration: "30d"
  redis_host: localhost
  redis_port: 6379

router_settings:
  routing_strategy: "least-busy"

retry_policy:
  TimeoutErrorRetries: 3
  RateLimitErrorRetries: 5
  AuthenticationErrorRetries: 1
```

---

## 6. Integration: Replace/Enhance Custom LLM Client

### Current Situation (Mekong CLI)
Your `src/core/llm_client.py` uses Anthropic-compatible proxy → OpenAI format. Manual model fallback + retry logic.

### LiteLLM Enhancement Path

**Option A: Drop-in Replacement (Low Risk)**
```python
# Before: custom OpenAI client via proxy
response = self.client.chat.completions.create(...)

# After: litellm with same interface
response = litellm.completion(
    model=self.model,
    messages=messages,
    **kwargs
)
```

**Benefits:**
- ✅ Eliminates custom fallback/retry code
- ✅ Automatic provider diversification (Azure, Gemini, Claude backup)
- ✅ Built-in cost tracking
- ✅ Production-grade budget enforcement
- ✅ Latency-based routing across deployments

**Option B: Router + Proxy (Medium Complexity)**
- Deploy LiteLLM proxy server as central gateway
- All projects call `http://localhost:8000/v1/chat/completions`
- Single point for load balancing + fallback management
- Replaces current Antigravity Proxy (port 9191)

**Considerations:**
- ⚠️ Removes dependency on custom proxy (Antigravity)
- ⚠️ Requires YAML config management instead of Python
- ✅ Better suited for Tôm Hùm autonomous dispatch (multi-project)

---

## Unresolved Questions

1. How to integrate LiteLLM budget tracking with existing telemetry system?
2. Should Router replace current Antigravity Proxy for mekong-cli ecosystem?
3. Does LiteLLM support Anthropic's thinking models (claude-opus-4-6-thinking)?
4. How does Redis cooldown tracking work with distributed Tôm Hùm daemon?

---

## Recommendation

**For mekong-cli v0.3.0+:** Adopt LiteLLM Router in `src/core/llm_client.py` as drop-in replacement. Benefits immediate:
- Automatic fallback across Anthropic + OpenAI + Gemini
- Built-in budget enforcement (prevent runaway costs)
- Eliminates 200+ lines of custom retry/fallback code
- Platform-agnostic: enables easy model swaps

Consider LiteLLM Proxy server as Option B for future Tôm Hùm multi-project coordination (separate epic).

---

Sources:
- [GitHub - BerriAI/litellm](https://github.com/BerriAI/litellm)
- [LiteLLM Documentation](https://docs.litellm.ai/docs/)
- [Load Balancing](https://docs.litellm.ai/docs/proxy/load_balancing)
- [Fallbacks & Reliability](https://docs.litellm.ai/docs/proxy/reliability)
- [Router - Load Balancing](https://docs.litellm.ai/docs/routing)
- [Budget & Rate Limits](https://docs.litellm.ai/docs/proxy/users)
- [OpenAI-Compatible Endpoints](https://docs.litellm.ai/docs/providers/openai_compatible)
