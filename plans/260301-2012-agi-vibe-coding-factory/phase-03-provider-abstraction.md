---
phase: 3
title: "LLM Provider Abstraction"
priority: P1
status: pending
effort: 4h
depends_on: []
---

# Phase 3: LLM Provider Abstraction

## Overview
Extract hardcoded Antigravity Proxy / Gemini / OpenAI logic into pluggable provider interface. Users configure providers via YAML config. Existing `LLMClient` becomes a thin router over provider backends.

## Key Insights (from research)
- `LLMClient` (llm_client.py:78-504) has provider logic inlined — vertex, proxy, openai all in one class
- Circuit breaker per provider already works well (ProviderHealth dataclass)
- `_call_provider()` dispatches via string match (llm_client.py:262-321)
- Hooks pipeline (HookPipeline) and LLMCache already decoupled — keep as-is
- OpenClaw hardcodes model names and proxy URLs in config.js

## Requirements

### Functional
- F1: `LLMProvider` abstract base class with `chat()`, `is_available()`, `name` property
- F2: Built-in providers: `GeminiProvider`, `OpenAIProvider`, `OfflineProvider`
- F3: Provider config via YAML: `providers` section with type, model, api_key env var, base_url
- F4: `LLMClient` accepts `List[LLMProvider]` instead of raw keys
- F5: Backward compat — env-var detection still works when no config provided

### Non-Functional
- NF1: Adding a new provider = subclass `LLMProvider` + register (no core changes)
- NF2: Zero breaking changes to `generate()` and `chat()` public API

## Architecture

```python
# src/core/providers.py (NEW — ~120 lines)
from abc import ABC, abstractmethod

class LLMProvider(ABC):
    """Abstract LLM provider. Subclass to add new providers."""
    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    def chat(self, messages, model, temperature, max_tokens, json_mode) -> LLMResponse: ...

    @abstractmethod
    def is_available(self) -> bool: ...

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-2.5-pro"): ...
    # Extracts _vertex_chat() logic from LLMClient

class OpenAICompatibleProvider(LLMProvider):
    """Works for OpenAI, Anthropic proxies, Ollama, vLLM, etc."""
    def __init__(self, base_url: str, api_key: str = "", model: str = ""): ...
    # Extracts REST-based chat logic from LLMClient._call_provider("proxy"/"openai")

class OfflineProvider(LLMProvider):
    """Placeholder responses when no LLM available."""
    ...
```

```yaml
# configs/default.yaml
providers:
  - type: gemini
    model: gemini-2.5-pro
    api_key_env: GEMINI_API_KEY
  - type: openai_compatible
    base_url: https://api.openai.com/v1
    api_key_env: OPENAI_API_KEY
    model: gpt-4o
  - type: openai_compatible
    name: ollama
    base_url: http://localhost:11434/v1
    model: llama3
```

## Related Code Files

### Modify
- `src/core/llm_client.py` — refactor to use `List[LLMProvider]`, keep public API unchanged
- `src/core/orchestrator.py` — no changes needed (uses LLMClient interface)
- `src/core/planner.py` — no changes needed (uses LLMClient.generate)

### Create
- `src/core/providers.py` — LLMProvider ABC + GeminiProvider + OpenAICompatibleProvider + OfflineProvider
- `configs/default.yaml` — default provider configuration

### Delete
- None

## Implementation Steps

1. Create `src/core/providers.py` with `LLMProvider` ABC
2. Extract `GeminiProvider` from `LLMClient._vertex_chat()` — move retry/jitter logic into provider
3. Extract `OpenAICompatibleProvider` from `LLMClient._call_provider("proxy"/"openai")` — single class handles both, differentiated by base_url
4. Create `OfflineProvider` from `LLMClient._offline_response()`
5. Add `_build_providers_from_env()` to LLMClient — auto-detect from env vars (backward compat)
6. Add `_build_providers_from_config(config_path)` — load from YAML
7. Refactor `LLMClient.chat()` — iterate `self.providers` instead of `_get_ordered_providers()` string list
8. Keep `ProviderHealth` circuit breaker — now keyed by `provider.name` instead of string
9. Create `configs/default.yaml` with example provider config
10. Run full test suite — `python3 -m pytest tests/`

## Success Criteria
- [ ] `LLMClient()` with no args works identically to current (env var detection)
- [ ] `LLMClient(providers=[GeminiProvider(key)])` works with explicit providers
- [ ] Adding custom provider = subclass `LLMProvider`, pass to client
- [ ] YAML config loads providers correctly
- [ ] Circuit breaker still works per-provider
- [ ] All 62 tests pass

## Risk Assessment
- **Low**: Public API (`generate()`, `chat()`, `generate_json()`) unchanged
- **Medium**: Google GenAI SDK import is lazy — provider must handle ImportError gracefully
- **Mitigation**: `GeminiProvider.__init__` catches ImportError, sets `_available = False`
- **Note**: Remove all Antigravity Proxy references from default config — users can add their own proxy as `openai_compatible` type

## Todo
- [ ] Create providers.py with LLMProvider ABC
- [ ] Extract GeminiProvider
- [ ] Extract OpenAICompatibleProvider
- [ ] Create OfflineProvider
- [ ] Refactor LLMClient to use provider list
- [ ] Create configs/default.yaml
- [ ] Run test suite
