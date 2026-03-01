---
title: "Vercel AI SDK Patterns → Mekong-CLI 10x AGI"
description: "Map 6 Vercel AI SDK patterns (provider registry, structured output, middleware, telemetry, tools, streaming) to Python equivalents in src/core/"
status: pending
priority: P1
effort: 8h
branch: master
tags: [llm, provider, streaming, structured-output, middleware, telemetry, tools]
created: 2026-03-01
---

# Vercel AI SDK → Mekong-CLI 10x AGI

## Context

- **Codebase:** Python 3.9+, Typer/Rich CLI, FastAPI gateway, 66 source files, 130+ tests
- **Core engine:** `src/core/` — planner, executor, verifier, orchestrator, llm_client, telemetry, retry_policy
- **Existing LLMClient:** Gemini/Proxy/OpenAI failover chain, circuit breaker (`ProviderHealth`), retry-with-jitter
- **Existing telemetry:** `TelemetryCollector` with JSON file writes + optional Langfuse dual-write
- **Existing registry:** `RecipeRegistry` (recipe files only) + `registry.py` for agents

All 6 new modules are **additive** — they enhance, not replace, existing code.

---

## Phases Overview

| # | Phase | New File | Effort | Status |
|---|-------|----------|--------|--------|
| 1 | Provider Registry | `src/core/provider_registry.py` | 1.5h | pending |
| 2 | Structured Output | `src/core/structured_output.py` | 1h | pending |
| 3 | Middleware Chain | `src/core/middleware.py` | 1.5h | pending |
| 4 | Enhanced Telemetry | `src/core/telemetry.py` (update) | 1h | pending |
| 5 | Tool System | `src/core/tools.py` | 1.5h | pending |
| 6 | Streaming Support | `src/core/streaming.py` + gateway update | 1.5h | pending |

**Dependencies:** Phase 1 → Phase 2 → Phase 3 → Phase 5 (linear chain)
Phase 4 is independent. Phase 6 depends on Phase 1.

---

## Phase 1 — Provider Registry

**File:** `src/core/provider_registry.py`
**Maps:** Vercel `createProviderRegistry()` → Python `ProviderRegistry` class
**Enhances:** wraps `LLMClient` with a named-provider lookup layer

### Key Types & Signatures

```python
# Protocol: every provider must implement
class ProviderSpec(Protocol):
    name: str
    def create_client(self, model_id: str, **kwargs: Any) -> "LLMCallable": ...
    def list_models(self) -> list[str]: ...

# Registry (singleton-friendly)
class ProviderRegistry:
    def __init__(self) -> None: ...
    def register(self, provider: ProviderSpec) -> None: ...
    def resolve(self, model_ref: str) -> tuple[ProviderSpec, str]:
        """Parse 'gemini:gemini-2.5-pro' → (GeminiProvider, 'gemini-2.5-pro')"""
    def create_client(self, model_ref: str, **kwargs: Any) -> "LLMCallable": ...

# Built-in provider impls
class GeminiProvider:     # wraps google-genai SDK
class ProxyProvider:      # wraps Antigravity Proxy (port 9191)
class OpenAIProvider:     # wraps OpenAI-compatible endpoint
class OllamaProvider:     # wraps local Ollama REST API
class AnthropicProvider:  # wraps direct Anthropic API

# Module-level default registry (lazy-init on first use)
_default_registry: Optional[ProviderRegistry] = None

def get_registry() -> ProviderRegistry: ...
def register_provider(provider: ProviderSpec) -> None: ...
def resolve_model(model_ref: str) -> LLMCallable: ...
```

### Integration Points

- `LLMClient.__init__` calls `get_registry().register(...)` for each configured provider
- `orchestrator.py` optionally accepts `model_ref: str` instead of bare model name
- `gateway.py` `CommandRequest` gains optional `model_ref` field

### File Size Target: ~150 lines

---

## Phase 2 — Structured Output

**File:** `src/core/structured_output.py`
**Maps:** Vercel `generateObject()` → Python `generate_object()` function
**Depends on:** Phase 1 (`ProviderRegistry`)

### Key Types & Signatures

```python
T = TypeVar("T", bound=BaseModel)

@dataclass
class ObjectResult(Generic[T]):
    object: T
    usage: dict[str, int]          # prompt_tokens, completion_tokens
    model: str
    attempts: int                  # how many retries were needed

def generate_object(
    model_ref: str,
    prompt: str | list[dict],
    schema: type[T],
    *,
    system: str | None = None,
    max_retries: int = 3,
    temperature: float = 0.0,
    registry: ProviderRegistry | None = None,   # uses default if None
) -> ObjectResult[T]:
    """
    Call LLM with JSON mode, parse + validate against Pydantic schema.
    Retries up to max_retries on ValidationError.
    Raises StructuredOutputError after exhausting retries.
    """

class StructuredOutputError(Exception):
    last_raw: str        # raw LLM response that failed validation
    validation_errors: list[str]

# Async variant
async def agenerate_object(
    model_ref: str,
    prompt: str | list[dict],
    schema: type[T],
    **kwargs: Any,
) -> ObjectResult[T]: ...
```

### JSON Mode Strategy

1. Inject system prompt: `"Respond ONLY with valid JSON matching this schema: {schema.schema_json()}"`
2. Call provider; extract JSON via `re.search(r'\{.*\}', content, re.DOTALL)`
3. `schema.model_validate_json(raw_json)` — raises `ValidationError` on failure
4. On failure: append error to messages and retry (repair loop, max `max_retries`)

### Usage Example

```python
class PlanOutput(BaseModel):
    steps: list[str]
    estimated_minutes: int

result = generate_object("gemini:gemini-2.5-pro", "Plan a deploy", PlanOutput)
print(result.object.steps)  # typed list[str]
```

### File Size Target: ~120 lines

---

## Phase 3 — Middleware Chain

**File:** `src/core/middleware.py`
**Maps:** Vercel `wrapLanguageModel()` → Python `apply_middleware()` + `MiddlewareSpec`
**Depends on:** Phase 1 (uses `LLMCallable` type)

### Key Types & Signatures

```python
# Core callable type (what providers expose)
LLMCallable = Callable[[list[dict], str, dict], LLMResponse]

# Middleware protocol
class MiddlewareSpec(Protocol):
    def wrap_generate(
        self,
        generate: LLMCallable,
        messages: list[dict],
        model: str,
        kwargs: dict,
    ) -> LLMResponse: ...

    def wrap_stream(
        self,
        stream: AsyncGenerator,
        messages: list[dict],
        model: str,
        kwargs: dict,
    ) -> AsyncGenerator: ...

# Composition function
def apply_middleware(
    client: LLMCallable,
    middlewares: list[MiddlewareSpec],
) -> LLMCallable:
    """Wrap client with middlewares (outermost first, innermost last)."""

# Built-in middlewares
class TelemetryMiddleware:
    """Emits OTel-compatible spans before/after each call."""
    def __init__(self, collector: TelemetryCollector | None = None): ...

class RetryMiddleware:
    """Retries on transient errors using RetryPolicy."""
    def __init__(self, policy: RetryPolicy = LLM_RETRY): ...

class CacheMiddleware:
    """In-memory LRU cache keyed on (model, messages_hash)."""
    def __init__(self, max_size: int = 128, ttl_seconds: float = 300): ...

class LoggingMiddleware:
    """Logs request/response at DEBUG level; redacts API keys."""
    def __init__(self, logger: logging.Logger | None = None): ...
```

### Default Stack

```python
DEFAULT_MIDDLEWARE = [
    LoggingMiddleware(),
    TelemetryMiddleware(),
    RetryMiddleware(policy=LLM_RETRY),
]
```

`LLMClient.chat()` wraps its provider call through `DEFAULT_MIDDLEWARE` if
`use_middleware=True` (default `False` for backward compat, flip to `True` after tests pass).

### File Size Target: ~160 lines

---

## Phase 4 — Enhanced Telemetry

**File:** `src/core/telemetry.py` (in-place update, no new file)
**Maps:** Vercel AI SDK OTel attributes → Python `SpanContext` dataclass
**Independent** — no dependency on Phases 1-3

### Changes to Existing `telemetry.py`

#### Add `SpanContext` dataclass

```python
@dataclass
class SpanContext:
    """OTel-compatible span for a single LLM call."""
    operation_name: str           # "generateText" | "generateObject" | "streamText"
    model_id: str                 # "gemini-2.5-pro"
    model_provider: str           # "gemini" | "proxy" | "openai"
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    duration_ms: float = 0.0
    error: str | None = None
    span_id: str = field(default_factory=lambda: uuid.uuid4().hex[:16])
    parent_span_id: str | None = None
    start_time: float = field(default_factory=time.time)
    attributes: dict[str, Any] = field(default_factory=dict)
    # OTel attribute names (constants)
    # ai.model.id, ai.model.provider, ai.prompt.tokens, ai.completion.tokens
    # ai.operation.name
```

#### Update `TelemetryCollector`

```python
# New methods on existing TelemetryCollector class:
def start_span(self, operation: str, model_id: str, provider: str) -> SpanContext: ...
def end_span(self, span: SpanContext, response: LLMResponse | None = None, error: str | None = None) -> None: ...
def record_llm_call(self, span: SpanContext) -> None:  # persists to JSON + Langfuse
```

#### New helper for `ExecutionTrace`

```python
# Add to ExecutionTrace dataclass:
llm_spans: list[SpanContext] = field(default_factory=list)
```

#### Backward Compat

All existing `record_step()`, `save()`, `complete()` signatures unchanged.
`start_span`/`end_span` are additive methods only.

### File Size Impact: +50 lines (telemetry.py goes from ~120 → ~170 lines)

---

## Phase 5 — Tool System

**File:** `src/core/tools.py`
**Maps:** Vercel `tool()` helper → Python `@tool` decorator + `ToolRegistry`
**Depends on:** Phase 1 (provider model_ref), Phase 2 (structured output for tool params)

### Key Types & Signatures

```python
P = TypeVar("P", bound=BaseModel)
R = TypeVar("R")

@dataclass
class ToolDefinition:
    name: str
    description: str
    params_schema: type[BaseModel]
    func: Callable
    is_async: bool

class ToolRegistry:
    def __init__(self) -> None: ...
    def register(self, tool_def: ToolDefinition) -> None: ...
    def get(self, name: str) -> ToolDefinition: ...
    def list(self) -> list[str]: ...
    def to_llm_schema(self) -> list[dict]:
        """Format for LLM function-calling JSON."""

# Decorator factory
def tool(
    description: str,
    *,
    name: str | None = None,
) -> Callable[[Callable[..., R]], Callable[..., R]]:
    """
    @tool("Search the web for a query")
    def web_search(params: SearchParams) -> str: ...
    """

# Agentic loop runner
def run_agentic_loop(
    model_ref: str,
    prompt: str,
    tools: list[ToolDefinition],
    *,
    max_steps: int = 10,
    system: str | None = None,
    registry: ProviderRegistry | None = None,
) -> AgenticResult:
    """
    Multi-step loop:
    1. Call LLM with tool schemas
    2. If LLM requests tool call → execute tool → append result → loop
    3. If LLM returns text → done (or max_steps reached)
    """

@dataclass
class AgenticResult:
    final_text: str
    steps: list[AgenticStep]
    tool_calls: int

@dataclass
class AgenticStep:
    tool_name: str | None
    tool_input: dict
    tool_result: str
    model_response: str

# Global default registry
_tool_registry: ToolRegistry = ToolRegistry()

def get_tool_registry() -> ToolRegistry: ...
```

### Built-in Tools

```python
# src/core/tools.py ships 3 built-in tools:

@tool("Execute a shell command and return stdout/stderr")
def shell_tool(params: ShellParams) -> str: ...

@tool("Read a file from disk")
def read_file_tool(params: ReadFileParams) -> str: ...

@tool("Search recipe files by keyword")
def search_recipes_tool(params: SearchParams) -> str: ...
```

### File Size Target: ~180 lines (split shell/file builtins to separate file if over 200)

---

## Phase 6 — Streaming Support

**Files:**
- `src/core/streaming.py` (new)
- `src/core/gateway.py` (add SSE endpoint — ~20 line addition)

**Maps:** Vercel `streamText()` / `streamObject()` → Python async generators
**Depends on:** Phase 1 (provider model_ref)

### Key Types & Signatures

```python
# src/core/streaming.py

@dataclass
class TextChunk:
    delta: str           # incremental text
    finish_reason: str | None = None   # "stop" | "length" | "tool_call" | None
    model: str = ""

@dataclass
class ObjectChunk(Generic[T]):
    partial: dict        # partially-parsed JSON dict
    complete: T | None   # fully validated Pydantic object, set on last chunk

async def stream_text(
    model_ref: str,
    messages: list[dict],
    *,
    system: str | None = None,
    temperature: float = 0.7,
    registry: ProviderRegistry | None = None,
) -> AsyncGenerator[TextChunk, None]:
    """
    Yield TextChunk objects as provider streams tokens.
    Provider detection:
    - Gemini: use generate_content_stream() from google-genai SDK
    - Proxy/OpenAI: parse SSE 'data: {...}' lines from chunked HTTP response
    - Ollama: parse NDJSON lines
    - Fallback: single chunk from non-streaming call
    """

async def stream_object(
    model_ref: str,
    prompt: str,
    schema: type[T],
    *,
    registry: ProviderRegistry | None = None,
) -> AsyncGenerator[ObjectChunk[T], None]:
    """
    Stream partial JSON; validate on completion.
    Uses incremental JSON parser (json.JSONDecoder with partial error tolerance).
    """

# Convenience: collect full stream into string
async def collect_stream(stream: AsyncGenerator[TextChunk, None]) -> str: ...
```

### Gateway SSE Endpoint Addition (`gateway.py`)

```python
# Add to existing FastAPI app (~20 lines):

from fastapi.responses import StreamingResponse
from src.core.streaming import stream_text, TextChunk

@app.post("/v1/stream")
async def stream_endpoint(req: CommandRequest):
    """SSE endpoint: streams LLM response tokens as `data: <json>\n\n`."""
    async def event_generator():
        async for chunk in stream_text(
            model_ref=req.model_ref or f"proxy:{GATEWAY_CONFIG.default_model}",
            messages=[{"role": "user", "content": req.goal}],
        ):
            yield f"data: {json.dumps({'delta': chunk.delta, 'done': chunk.finish_reason is not None})}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

### Streaming Provider Matrix

| Provider | Strategy | SDK/Method |
|----------|----------|-----------|
| Gemini | Native | `client.models.generate_content_stream()` |
| Proxy (port 9191) | SSE parse | `httpx.AsyncClient` with `stream=True` |
| OpenAI-compat | SSE parse | same as Proxy |
| Ollama | NDJSON | line-by-line JSON decode |
| Fallback | Simulated | Single chunk from blocking `chat()` |

### File Size Target: `streaming.py` ~150 lines

---

## Test Requirements

Each phase needs a test file:

| Phase | Test File |
|-------|-----------|
| 1 | `tests/test_provider_registry.py` |
| 2 | `tests/test_structured_output.py` |
| 3 | `tests/test_middleware.py` |
| 4 | `tests/test_telemetry_spans.py` |
| 5 | `tests/test_tools.py` |
| 6 | `tests/test_streaming.py` |

All tests use `unittest.mock` to patch LLM calls — no real API calls in CI.

---

## Success Criteria

- [ ] `python3 -m pytest tests/ -x` — all existing 130+ tests still pass
- [ ] 6 new test files added, each with ≥ 5 test cases
- [ ] `grep -r ": any" src/` returns 0 (type-safe throughout)
- [ ] No file in `src/core/` exceeds 200 lines after changes
- [ ] `from src.core.provider_registry import ProviderRegistry` resolves without import error
- [ ] `from src.core.streaming import stream_text` resolves without import error
- [ ] Gateway `/v1/stream` endpoint returns `200 text/event-stream` for valid requests

---

## Unresolved Questions

1. **Async runtime for streaming**: existing `LLMClient.chat()` is synchronous. Gateway runs in asyncio (FastAPI). Need to verify `asyncio.run()` vs `nest_asyncio` for non-gateway callers of `stream_text`.
2. **Gemini SDK streaming API**: `google-genai` SDK streaming method name may differ across SDK versions — needs verification against installed version.
3. **Cache key for CacheMiddleware**: hashing `messages` list (dicts) needs a stable serialization strategy; order-sensitive vs order-insensitive.
4. **Tool calling support per provider**: Proxy (port 9191) may or may not forward function-calling schema — depends on backend model. Need to confirm Antigravity Proxy passes `tools` field through.
5. **`max_steps` safety**: agentic loop with `max_steps=10` could exhaust quota quickly. Should `run_agentic_loop` emit telemetry spans per step for cost tracking?
