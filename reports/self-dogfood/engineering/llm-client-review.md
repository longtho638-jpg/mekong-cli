# Engineering: LLM Client Review — Mekong CLI v5.0

## Command: /review
## Date: 2026-03-11

---

## Source File: src/core/llm_client.py (565 lines)

Universal LLM endpoint — "3 vars, any provider" architecture.
Circuit breaker, fallback chain, LRU cache, hooks pipeline.

---

## Provider Support

Priority order (from docstring and code lines 195-300):

| Priority | Env Var | Provider | Notes |
|----------|---------|---------|-------|
| 0 | LLM_BASE_URL + LLM_API_KEY + LLM_MODEL | Universal | OpenAI-compatible |
| 1 | OPENROUTER_API_KEY | OpenRouter | 300+ models |
| 2 | AGENTROUTER_API_KEY | AgentRouter | $200 free credits |
| 3 | DASHSCOPE_API_KEY | Qwen/DashScope | $10/mo unlimited |
| 4 | DEEPSEEK_API_KEY | DeepSeek | $0.27/100K tokens |
| 5 | ANTHROPIC_API_KEY | Anthropic Direct | Claude models |
| 6 | OPENAI_API_KEY | OpenAI Direct | GPT models |
| 7 | GOOGLE_API_KEY | Google Gemini | Gemini models |
| 8 | OLLAMA_BASE_URL | Ollama | Local, free |
| 9 | (none) | OfflineProvider | Fallback |

9 providers + offline fallback. Well-designed multi-provider support.

---

## Circuit Breaker Implementation

```python
@dataclass
class ProviderHealth:
    failures: int = 0
    last_failure: float = 0.0
    cooldown_secs: float = 15.0  # Reduced from 60 → 15s
    
    @property
    def is_healthy(self) -> bool:
        if self.failures < 3:
            return True
        return (time.time() - self.last_failure) > self.cooldown_secs
```

- Threshold: 3 consecutive failures
- Cooldown: 15 seconds (reduced from 60s for faster recovery)
- Per-provider health tracking
- `record_success()` resets failure count to 0

This is a solid circuit breaker implementation. Issues:
- No exponential backoff — 15s flat cooldown for all failure types
- No half-open state (test 1 request before fully opening) — standard circuit breaker pattern
- Failures reset to 0 on ANY success — one success resets 3 failures

---

## Hooks Pipeline

```python
from .hooks import HookContext, HookPhase, HookPipeline, create_default_pipeline
```

Hooks allow middleware-style processing of LLM requests:
- Pre-request hooks: add telemetry, validate, rate limit
- Post-response hooks: log, cache, audit

`create_default_pipeline()` creates the default hook chain.
Portkey-inspired pattern mentioned in docstring — adds observability.

---

## LLM Cache

```python
from .llm_cache import LLMCache
```

LRU cache for LLM responses. Hash-based cache key (SHA of prompt + model).
Cache hit avoids API call entirely — significant cost savings for repeated prompts.

```python
import hashlib  # used for cache key generation
```

---

## LLM_MODE Switching

```python
llm_mode = os.getenv("LLM_MODE", "byok").lower()
```

- `byok` (default): user's own API key hits provider directly
- `legacy`: proxy-first behavior through ANTIGRAVITY_PROXY_URL

Legacy mode maintained for backward compatibility. Users can opt into proxy routing.

---

## Provider Classes

```python
from .providers import (
    GeminiProvider,
    LLMProvider,
    LLMResponse,
    OfflineProvider,
    OpenAICompatibleProvider,
)
```

Base class: `LLMProvider`
Concrete implementations: `OpenAICompatibleProvider`, `GeminiProvider`, `OfflineProvider`

`GeminiProvider` is separate (not OpenAI-compatible) — requires custom HTTP format.
All other providers (Anthropic, OpenAI, OpenRouter, DashScope, DeepSeek) use
`OpenAICompatibleProvider` — they all support the `/v1/chat/completions` interface.

---

## Streaming Support

Not explicitly reviewed in the 80 lines shown. `generate()` method is synchronous.
For SSE streaming, the gateway would need an `async generate_stream()` method.

**Gap to verify:** Does LLMClient support streaming responses? If not, SSE mission
events cannot include real-time LLM output.

---

## AGENTROUTER_API_KEY — Undocumented in CLAUDE.md

Priority 2 provider `AGENTROUTER_API_KEY` with "$200 free credits" is not mentioned
in CLAUDE.md NAMESPACE section. This appears to be an internal/partner route.
Documentation gap.

---

## Issues Found

### Issue 1: Synchronous HTTP via requests library
```python
import requests  # type: ignore[import-untyped]
```
All LLM calls use synchronous `requests`. In async FastAPI context, this blocks the event loop.
Fix: use `httpx.AsyncClient` for async LLM calls.

### Issue 2: self.proxy_url Naming Confusion
```python
self.proxy_url = proxy_url or os.getenv("ANTIGRAVITY_PROXY_URL", "") or os.getenv("LLM_BASE_URL", "")
```
Variable named `proxy_url` is also used as `base_url` for universal endpoint.
The naming implies it's always a proxy when it may be a direct API base URL.
Fix: rename to `self.base_url` with comment explaining dual-use.

### Issue 3: gemini_key Stored Separately
```python
self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")  # OpenAI compat
self.gemini_key = gemini_key or os.getenv("GEMINI_API_KEY", "")  # Gemini direct
```
Two key fields for different provider types. If universal LLM_API_KEY is set, Gemini
may still be inaccessible if GEMINI_API_KEY is not separately set.

---

## Recommendations

1. **Async HTTP:** Replace `requests` with `httpx.AsyncClient` for non-blocking LLM calls
2. **Half-open circuit breaker:** Add test-request before fully recovering from open state
3. **Exponential backoff:** Increase cooldown on repeated failures (15s → 30s → 60s)
4. **Rename proxy_url:** Rename to `base_url` to reduce confusion
5. **Add streaming support:** Implement `async generate_stream()` for SSE-compatible output
6. **Document AGENTROUTER_API_KEY:** Add to CLAUDE.md and .env.example
7. **Type ignore on requests:** Indicates missing stubs; add `types-requests` to dev deps

---

## Summary
Excellent multi-provider architecture with circuit breaker, hooks pipeline, and LRU cache.
Primary technical debt: synchronous `requests` library blocks async event loop.
Provider chain of 9 options + offline fallback is production-grade design.
Streaming support status unconfirmed — gap to verify.
