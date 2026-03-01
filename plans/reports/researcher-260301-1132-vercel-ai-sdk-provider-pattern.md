# Vercel AI SDK Provider Pattern — Research Report
**Date:** 2026-03-01 | **Author:** researcher agent

---

## 1. Core Contract — LanguageModelV2 Interface

Every provider model implements one interface with exactly **4 members**:

```typescript
interface LanguageModelV2 {
  specificationVersion: 'v2'    // or 'v3' — frozen per class
  provider: string              // e.g. "openai", "anthropic"
  modelId: string               // e.g. "gpt-4o", "claude-opus-4-6"
  supportedUrls: {              // media-type → URL regex whitelist
    [mediaType: string]: RegExp[]
  } | Promise<...>

  doGenerate(options: LanguageModelV2CallOptions): Promise<GenerateResult>
  doStream(options: LanguageModelV2CallOptions): Promise<StreamResult>
}
```

The `do*` prefix is intentional — prevents users accidentally calling the raw method instead of the SDK wrapper (`generateText`, `streamText`).

---

## 2. What Core Sends: LanguageModelV2CallOptions

Everything `generateText()` normalizes before calling `doGenerate()`:

```
prompt              → LanguageModelV2Message[]  (normalized, role-split)
maxOutputTokens     → number | undefined
temperature         → number | undefined
topP, topK          → number | undefined
presencePenalty     → number | undefined
frequencyPenalty    → number | undefined
stopSequences       → string[] | undefined
seed                → number | undefined
responseFormat      → { type: 'text' } | { type: 'json', schema? }
tools               → LanguageModelV2FunctionTool[] | ProviderDefinedTool[]
toolChoice          → 'auto' | 'none' | 'required' | { type: 'tool', toolName }
includeRawChunks    → boolean (streaming only)
abortSignal         → AbortSignal
headers             → Record<string, string>  (per-request HTTP headers)
providerOptions     → Record<string, Record<string, unknown>>  (passthrough)
```

**Key insight:** Core handles all normalization. Provider only gets clean, typed data. No raw string parsing.

---

## 3. Prompt Structure — LanguageModelV2Message[]

```
system   → { role: 'system', content: string }

user     → { role: 'user', content: Array<
              { type: 'text', text: string }
            | { type: 'file', data: string|URL, mediaType: string }
           >}

assistant → { role: 'assistant', content: Array<
               { type: 'text', text: string }
             | { type: 'reasoning', text: string }
             | { type: 'tool-call', toolCallId, toolName, input }
             | { type: 'tool-result', toolCallId, toolName, output }
             | { type: 'file', data, mediaType }
            >}

tool     → { role: 'tool', content: ToolResult[] }
```

---

## 4. What Provider Returns from doGenerate()

```
content         → LanguageModelV2Content[]    (text, reasoning, tool-calls, files, sources)
finishReason    → 'stop'|'length'|'content-filter'|'tool-calls'|'error'|'other'|'unknown'
usage           → { inputTokens, outputTokens, totalTokens, reasoningTokens?, cachedInputTokens? }
warnings        → LanguageModelV2CallWarning[]
providerMetadata → Record<string, unknown>   (provider-specific extras)
request         → { body?: string }          (for telemetry)
response        → { id?, timestamp?, modelId?, headers?, body? }
```

Content types returned:
```
{ type: 'text', text: string }
{ type: 'reasoning', text: string }
{ type: 'tool-call', toolCallId, toolName, input: unknown }
{ type: 'tool-result', toolCallId, toolName, output }
{ type: 'file', data, mediaType }
{ type: 'source', ... }
```

---

## 5. doStream() Return

```typescript
{
  stream: ReadableStream<LanguageModelV2StreamPart>
  request?: { body?: string }
}
```

Stream parts (discriminated union):
```
{ type: 'stream-start', warnings }
{ type: 'text-start' }
{ type: 'text-delta', delta: string }
{ type: 'text-end' }
{ type: 'reasoning-start' }
{ type: 'reasoning-delta', delta }
{ type: 'reasoning-end' }
{ type: 'tool-input-start', toolCallId, toolName }
{ type: 'tool-input-delta', delta }
{ type: 'tool-input-end' }
{ type: 'response-metadata', id?, timestamp?, modelId?, headers? }
{ type: 'finish', finishReason, usage }
{ type: 'raw', rawValue }   ← optional passthrough for debugging
{ type: 'error', error }
```

---

## 6. Provider Factory Pattern

```typescript
// Factory function — creates provider instance
function createOpenAI(settings?: OpenAIProviderSettings): OpenAIProvider {
  // 1. Resolve config: baseURL, apiKey, orgId, headers
  const baseURL = settings?.baseURL ?? process.env.OPENAI_BASE_URL ?? DEFAULT_URL
  const apiKey  = settings?.apiKey  ?? process.env.OPENAI_API_KEY

  // 2. Build header resolver (called per-request, not per-factory)
  const getHeaders = () => ({
    Authorization: `Bearer ${apiKey}`,
    'User-Agent': SDK_VERSION,
    ...settings?.headers
  })

  // 3. Build URL factory per model type
  const createChatModel = (modelId, modelSettings) =>
    new OpenAIChatLanguageModel(modelId, {
      provider: 'openai.chat',
      baseURL,
      headers: getHeaders,
      ...modelSettings
    })

  // 4. Provider is a callable + object (dual interface)
  const provider = (modelId, settings) => createChatModel(modelId, settings)
  provider.languageModel = createChatModel
  provider.chat = createChatModel
  provider.embedding = (modelId) => new OpenAIEmbeddingModel(modelId, ...)
  return provider
}

// Default export: pre-built instance
export const openai = createOpenAI()

// Usage
const model = openai('gpt-4o')          // callable
const model = openai.chat('gpt-4o')     // explicit
```

**Key insight:** Provider is callable AND has named methods. Same config object flows into every model class.

---

## 7. Model Class Pattern (Inside createOpenAI)

```typescript
class OpenAIChatLanguageModel implements LanguageModelV2 {
  readonly specificationVersion = 'v2'
  readonly modelId: string
  readonly supportedUrls = { 'image/*': [/^https?:\/\/.*/] }

  constructor(modelId: string, private config: OpenAIChatConfig) {
    this.modelId = modelId
  }

  get provider() { return this.config.provider }  // 'openai.chat'

  async doGenerate(options: LanguageModelV2CallOptions) {
    // 1. Get capabilities (allowlist for THIS modelId)
    const caps = getCapabilities(this.modelId)

    // 2. Build provider-native request (OpenAI JSON payload)
    const payload = this.buildPayload(options, caps)

    // 3. HTTP call via config.fetch or global fetch
    const response = await (this.config.fetch ?? fetch)(
      `${this.config.baseURL}/chat/completions`,
      { method: 'POST', headers: this.config.headers(), body: JSON.stringify(payload) }
    )

    // 4. Parse → normalize to LanguageModelV2 return shape
    const data = await response.json()
    return this.parseResponse(data)
  }

  async doStream(options: LanguageModelV2CallOptions) {
    // Same as doGenerate but with stream: true + SSE parsing
    const response = await fetch(url, { ...headers, body: {..., stream: true} })
    return { stream: this.parseSSEStream(response.body) }
  }

  // Capabilities per model: gating what params to forward
  private buildPayload(options, caps) {
    return {
      model: this.modelId,
      messages: convertPrompt(options.prompt),
      ...(!caps.isReasoningModel && { temperature: options.temperature }),
      ...(!caps.isReasoningModel && { top_p: options.topP }),
      max_tokens: options.maxOutputTokens,
      // tools only if options.tools is non-empty
      ...(options.tools?.length && { tools: convertTools(options.tools) }),
    }
  }
}
```

---

## 8. Capabilities Pattern (Per Model Allowlist)

Rather than a feature matrix, the SDK uses a **function** keyed on model ID:

```typescript
function getOpenAICapabilities(modelId: string) {
  const isReasoning = /^o[134]|gpt-5|codex-mini/.test(modelId)
  return {
    isReasoningModel: isReasoning,
    systemMessageMode: isReasoning ? 'developer' : 'system',
    supportsFlexProcessing: /^o3|o4-mini|gpt-5/.test(modelId),
    supportsPriorityProcessing: /^gpt-4|gpt-5|o3|o4-mini/.test(modelId),
    supportsNonReasoningParameters: /^gpt-5\.[12]/.test(modelId),
  }
}
```

Unsupported params generate **warnings** (not errors) in the return value.

---

## 9. Middleware / Transform Layer

`wrapLanguageModel()` wraps any model with `LanguageModelMiddleware`:

```typescript
const wrappedModel = wrapLanguageModel({
  model: openai('gpt-4o'),
  middleware: [loggingMiddleware, cachingMiddleware]
})

// LanguageModelMiddleware interface:
interface LanguageModelMiddleware {
  transformParams?: (params, next) => Promise<Params>  // mutate before both generate+stream
  wrapGenerate?: ({ doGenerate, params }) => Promise<Result>
  wrapStream?:  ({ doStream, params }) => Promise<StreamResult>
}

// Caching middleware example:
const cache = new Map()
const cachingMiddleware: LanguageModelMiddleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    const key = JSON.stringify(params)
    if (cache.has(key)) return cache.get(key)
    const result = await doGenerate()
    cache.set(key, result)
    return result
  }
}
```

Middleware is **composable** — arrays apply left-to-right. Each layer sees the next layer's `doGenerate`/`doStream`.

---

## 10. Error Types (from @ai-sdk/provider)

```
AISDKError              → base class
APICallError            → HTTP-level failures (statusCode, responseBody, url, requestBodyValues)
InvalidArgumentError    → bad params
InvalidPromptError      → malformed prompt
InvalidResponseDataError → provider returned unexpected shape
NoContentGeneratedError → response had no content
NoSuchModelError        → provider doesn't have the requested model
UnsupportedFunctionalityError → feature not supported by model
LoadAPIKeyError         → missing/invalid credentials
TypeValidationError     → schema validation failed
```

Providers throw these typed errors. Core catches and surfaces them.

---

## 11. Python Adaptation Patterns

### Pattern A: Provider as Factory (maps to createOpenAI)

```python
from dataclasses import dataclass
from typing import Optional, Callable
import os

@dataclass
class ProviderConfig:
    base_url: str
    api_key: str
    provider_name: str
    headers: Callable[[], dict]  # called per-request, not at init

def create_openai_compatible(
    base_url: str = None,
    api_key: str = None,
    provider_name: str = "openai",
    **kwargs
) -> "Provider":
    resolved_url = base_url or os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    resolved_key = api_key or os.getenv("OPENAI_API_KEY", "")

    config = ProviderConfig(
        base_url=resolved_url,
        api_key=resolved_key,
        provider_name=provider_name,
        headers=lambda: {"Authorization": f"Bearer {resolved_key}", **kwargs.get("headers", {})}
    )
    return Provider(config)

class Provider:
    def __init__(self, config: ProviderConfig):
        self._config = config

    def __call__(self, model_id: str, **settings) -> "LanguageModel":
        return self.language_model(model_id, **settings)

    def language_model(self, model_id: str, **settings) -> "LanguageModel":
        return OpenAICompatibleLanguageModel(model_id, self._config, **settings)

# Antigravity Proxy: just point base_url at localhost:9191
antigravity = create_openai_compatible(
    base_url="http://localhost:9191",
    provider_name="antigravity"
)
model = antigravity("gemini-3-pro-high")
```

### Pattern B: Model Class (maps to OpenAIChatLanguageModel)

```python
from dataclasses import dataclass, field
from typing import Any, Iterator

@dataclass
class LLMCallOptions:
    prompt: list[dict]          # normalized messages
    max_output_tokens: int = 2048
    temperature: float = 0.7
    top_p: float | None = None
    stop_sequences: list[str] = field(default_factory=list)
    tools: list[dict] = field(default_factory=list)
    tool_choice: str | dict = "auto"  # 'auto'|'none'|'required'|{'type':'tool','toolName':...}
    response_format: dict | None = None
    provider_options: dict = field(default_factory=dict)

@dataclass
class GenerateResult:
    content: list[dict]         # [{'type':'text','text':'...'}, ...]
    finish_reason: str          # 'stop'|'length'|'tool-calls'|'error'|'other'
    usage: dict                 # inputTokens, outputTokens, totalTokens
    warnings: list[str] = field(default_factory=list)
    provider_metadata: dict = field(default_factory=dict)
    model: str = ""

class OpenAICompatibleLanguageModel:
    specification_version = "v2"
    supported_media_types = {"image/*": [r"^https?://.*"]}

    def __init__(self, model_id: str, config: ProviderConfig, **settings):
        self.model_id = model_id
        self.provider = config.provider_name
        self._config = config
        self._settings = settings

    def get_capabilities(self) -> dict:
        """Per-model feature gates — override in subclass per provider."""
        return {
            "supports_tools": True,
            "supports_json_mode": True,
            "supports_streaming": True,
            "system_message_role": "system",
        }

    def do_generate(self, options: LLMCallOptions) -> GenerateResult:
        caps = self.get_capabilities()
        payload = self._build_payload(options, caps)
        response = self._http_post("/chat/completions", payload)
        return self._parse_response(response)

    def do_stream(self, options: LLMCallOptions) -> Iterator[dict]:
        caps = self.get_capabilities()
        payload = self._build_payload(options, caps)
        payload["stream"] = True
        yield from self._http_stream("/chat/completions", payload)

    def _build_payload(self, options: LLMCallOptions, caps: dict) -> dict:
        payload = {
            "model": self.model_id,
            "messages": options.prompt,
            "max_tokens": options.max_output_tokens,
        }
        if caps["supports_json_mode"] and options.response_format:
            payload["response_format"] = options.response_format
        if options.temperature is not None:
            payload["temperature"] = options.temperature
        if options.tools and caps["supports_tools"]:
            payload["tools"] = options.tools
            payload["tool_choice"] = options.tool_choice
        return payload

    def _http_post(self, path: str, payload: dict) -> dict:
        import requests
        url = f"{self._config.base_url}{path}"
        resp = requests.post(url, json=payload, headers=self._config.headers(), timeout=60)
        resp.raise_for_status()
        return resp.json()
```

### Pattern C: Middleware (maps to wrapLanguageModel)

```python
from typing import Protocol, Callable

class LLMMiddleware(Protocol):
    def wrap_generate(
        self,
        do_generate: Callable[[LLMCallOptions], GenerateResult],
        params: LLMCallOptions
    ) -> GenerateResult: ...

class CachingMiddleware:
    def __init__(self):
        self._cache: dict = {}

    def wrap_generate(self, do_generate, params):
        import json
        key = json.dumps(params.__dict__, sort_keys=True, default=str)
        if key in self._cache:
            return self._cache[key]
        result = do_generate(params)
        self._cache[key] = result
        return result

class LoggingMiddleware:
    def wrap_generate(self, do_generate, params):
        import logging
        logging.info(f"[LLM] doGenerate model={params.get('model')}")
        result = do_generate(params)
        logging.info(f"[LLM] finish_reason={result.finish_reason} tokens={result.usage}")
        return result

def wrap_language_model(model, middleware: list) -> "WrappedModel":
    """Compose middleware stack around a model."""
    class WrappedModel:
        def __init__(self):
            self.model_id = model.model_id
            self.provider = model.provider
            self.specification_version = model.specification_version

        def do_generate(self, options: LLMCallOptions) -> GenerateResult:
            # Build chain: each middleware wraps the next
            def base(opts): return model.do_generate(opts)
            chain = base
            for mw in reversed(middleware):
                if hasattr(mw, 'wrap_generate'):
                    prev = chain
                    chain = lambda opts, m=mw, p=prev: m.wrap_generate(p, opts)
            return chain(options)
    return WrappedModel()
```

### Pattern D: Normalize Messages (maps to convertToLanguageModelPrompt)

```python
def normalize_prompt(
    prompt: str | None = None,
    system: str | None = None,
    messages: list[dict] | None = None,
) -> list[dict]:
    """Convert user-facing inputs to normalized LanguageModelV2 messages."""
    result = []
    if system:
        result.append({"role": "system", "content": system})
    if messages:
        result.extend(messages)
    elif prompt:
        result.append({"role": "user", "content": [{"type": "text", "text": prompt}]})
    return result
```

### Pattern E: generate_text() / generate_object() facade

```python
async def generate_text(
    model,
    prompt: str = None,
    system: str = None,
    messages: list = None,
    max_output_tokens: int = 2048,
    temperature: float = 0.7,
    tools: list = None,
    tool_choice="auto",
    max_retries: int = 2,
    **kwargs,
) -> GenerateResult:
    """Core facade — mirrors Vercel AI SDK generateText()."""
    normalized = normalize_prompt(prompt=prompt, system=system, messages=messages)
    options = LLMCallOptions(
        prompt=normalized,
        max_output_tokens=max_output_tokens,
        temperature=temperature,
        tools=tools or [],
        tool_choice=tool_choice,
    )
    for attempt in range(max_retries + 1):
        try:
            return model.do_generate(options)
        except Exception as e:
            if attempt == max_retries:
                raise
            # exponential backoff
            import time; time.sleep(2 ** attempt)
```

---

## 12. Key Design Decisions for Python Adaptation

| Decision | Vercel SDK | Python Adaptation |
|----------|------------|-------------------|
| Interface | TypeScript interface | Python Protocol + dataclass |
| Factory | `createOpenAI()` returns callable+object | `create_openai_compatible()` returns `Provider` with `__call__` |
| Capabilities | Function per model ID (allowlist) | `get_capabilities()` method, override per provider subclass |
| Streaming | `ReadableStream` with typed parts | `Iterator[dict]` or `AsyncGenerator[dict]` |
| Middleware | `wrapLanguageModel()` + interface | `wrap_language_model()` + list of middleware objects |
| Errors | Typed error classes | Typed exception hierarchy extending `LLMError` |
| Headers | Lazy resolver: `() => headers` | `Callable[[], dict]` in config |
| Provider options | `providerOptions` passthrough dict | `provider_options: dict` in `LLMCallOptions` |

---

## 13. Mapping to Antigravity Proxy

The proxy is OpenAI-compatible (port 9191). The Python adapter needs zero custom logic:

```python
# .env / environment
ANTHROPIC_BASE_URL=http://localhost:9191

# Python usage
antigravity = create_openai_compatible(
    base_url="http://localhost:9191",
    api_key=os.getenv("OPENAI_API_KEY", ""),   # proxy may not need real key
    provider_name="antigravity",
)

# Models routed through proxy — model ID is passed through as-is
model = antigravity("gemini-3-pro-high")         # proxy resolves the alias
model = antigravity("claude-opus-4-6")           # proxy routes to Anthropic
model = antigravity("gpt-4o")                    # proxy routes to OpenAI

result = generate_text(model, prompt="Hello world")
```

---

## Summary of Patterns Worth Implementing

1. **Provider-as-factory** — `create_X(base_url, api_key, **headers)` returns callable provider
2. **Model class with `do_generate` / `do_stream`** — clean protocol boundary
3. **`LLMCallOptions` dataclass** — normalized, typed call options (not raw dicts)
4. **`GenerateResult` dataclass** — typed return with content[], finish_reason, usage, warnings
5. **Per-model `get_capabilities()`** — allowlist gates (suppress unsupported params, emit warnings)
6. **Middleware protocol** — `wrap_generate(do_generate, params)` composable chain
7. **`generate_text()` facade** — handles normalization + retry, calls `model.do_generate()`
8. **Lazy header resolver** — `Callable[[], dict]` so headers can change per-request
9. **Typed stream parts** — discriminated dicts with `type` field for stream events
10. **Typed error hierarchy** — `APICallError`, `NoContentGeneratedError`, `UnsupportedFunctionalityError`

---

## Unresolved Questions

1. Does mekong-cli need async (asyncio) support or is sync `requests` sufficient for the CLI use case?
2. Should `do_stream()` return `Iterator[dict]` or `AsyncGenerator` — depends on Q1.
3. The existing `LLMClient` already handles 3-provider failover — does the new pattern replace or wrap it?
4. Middleware priority: should `LoggingMiddleware` → `CachingMiddleware` → model, or reverse order?
5. What's the right capability set for `gemini-3-pro-high` via proxy — does it support tools / structured output?
