# Vercel AI SDK — Advanced Agent Patterns Research
Date: 2026-03-01 | Scope: Agent loops, middleware, telemetry, provider registry

---

## 1. Multi-Step Agent Loops

**Core mechanism:**
- `generateText({ maxSteps: N })` replaced by `stopWhen` condition (AI SDK 5+)
- Built-in: `stopWhen: stepCountIs(20)` or `hasToolCall('done')`
- Custom: `stopWhen: ({ steps }) => steps.some(s => s.text?.includes('ANSWER:'))`
- Tool results auto-injected into next message context (no manual re-packaging)
- Loop exits when: no tool call returned, tool has no `execute`, approval needed, or stop condition met

**`onStepFinish` / `prepareStep`:**
- `onStepFinish(step)` → observability hook after each iteration
- `prepareStep({ model, stepNumber, steps, messages })` → runs BEFORE each iteration
  - Swap model mid-loop (e.g., flash for early steps, pro for final)
  - Trim/summarize message history to manage context window
  - Restrict tool availability per phase

**Forced termination pattern:**
```ts
done: tool({ description: 'signal completion', inputSchema: z.object({ answer: z.string() }) })
// No execute fn → loop halts; result.staticToolCalls has final answer
```

**Python CLI analogy (RecipeOrchestrator):**
- `stopWhen` → replace `max_retries` int with predicate fn passed to orchestrator
- `prepareStep` → hook before each Plan-Execute-Verify cycle to rotate model, trim history
- Tool result auto-feed → `ExecutionResult` stdout automatically becomes next step's context

---

## 2. Middleware System (`wrapLanguageModel`)

**Core mechanism:**
```ts
const model = wrapLanguageModel({
  model: baseModel,
  middleware: [loggingMiddleware, cachingMiddleware, guardrailMiddleware]
})
```
- Chain executes: first middleware transforms input first; last middleware wraps closest to model
- Three hooks: `transformParams` (pre-call, both generate+stream), `wrapGenerate` (non-stream), `wrapStream` (streaming)

**Key patterns:**
- **Caching**: `Map<JSON.stringify(params), result>` → skip LLM on cache hit
- **RAG injection**: `transformParams` appends retrieved docs to last user message
- **Guardrails**: `wrapGenerate` post-processes result, redacts/blocks content
- **Logging**: `wrapStream` uses `TransformStream` to accumulate deltas, logs on stream end
- **Per-request metadata**: `params.providerMetadata.myMiddleware` passes request-scoped context

**Python CLI analogy (LLMClient):**
- Implement as decorator chain on `LLMClient.complete()`: `cache_middleware(rag_middleware(log_middleware(client)))`
- `transformParams` → mutate `RecipeContext` before LLM call (inject memory, RAG docs)
- `wrapGenerate` → retry logic, rate-limit backoff, model fallback (Sonnet→Gemini)
- More composable than current hardcoded retry in `orchestrator.py`

---

## 3. Prompt Engineering Patterns

**System message composition:**
- No built-in "prompt template" system — compose strings manually or use `system:` param
- Message history is plain array: `[{role, content}]` — developer manages truncation
- `prepareStep` is the designated hook for context window management (trim old messages, summarize tool outputs)

**Token/context management:**
- SDK has no built-in token counter or auto-truncation
- Pattern: in `prepareStep`, check `messages.length > threshold`, summarize middle turns via LLM call
- Tool output summarization: replace verbose JSON results with 1-line summary before next step

**Python CLI analogy:**
- `RecipePlanner` should accept a `prepare_step` hook for history trimming
- Current risk: long recipe runs accumulate unbounded context → add `max_context_tokens` + summarize step

---

## 4. Error Handling & Retries

**Mechanism:**
- No built-in retry — done via `wrapGenerate` middleware
- Pattern: wrap `doGenerate()` in try/catch, exponential backoff, model swap on persistent failure
- `wrapLanguageModel` with retry middleware = transparent to call sites

**Model fallback pattern:**
```ts
wrapGenerate: async ({ doGenerate, params }) => {
  try { return await doGenerate(); }
  catch (e) {
    if (e.code === 'RATE_LIMIT') return fallbackModel.doGenerate(params);
    throw e;
  }
}
```

**Python CLI analogy:**
- Replace `scripts/proxy-recovery.sh` (shell-level hack) with Python middleware decorator
- `LLMClient` should expose `wrap()` API so retry/fallback is composable, not hardcoded
- Antigravity Proxy already handles load balancing — middleware layer adds per-call fallback on top

---

## 5. Telemetry & Observability

**Built-in OTel integration:**
- Opt-in per call: `experimental_telemetry: { isEnabled: true, metadata: { userId } }`
- Span hierarchy: `ai.generateText` → `ai.generateText.doGenerate` → provider call span
- Attributes: `ai.model.id`, `ai.usage.inputTokens`, `ai.usage.outputTokens`, `ai.response.text`
- Custom metadata attached to spans via `metadata` object
- NOT using OTel Gen AI semantic conventions yet (uses `ai.*` namespace — may change)

**Backend integrations:** Langfuse, Braintrust, Arize, SigNoz — all via standard OTLP exporter

**Python CLI analogy:**
- `telemetry.py` already exists — extend with OpenTelemetry `trace.get_tracer()`
- Wrap each `RecipeExecutor.execute_step()` in a span: `with tracer.start_as_current_span("step") as span: span.set_attribute("step.name", step.name)`
- Export to Langfuse (has Python SDK) for plan-level trace visualization
- Current `execution_trace.json` is file-based — OTel spans give real-time streaming observability

---

## 6. Provider Registry & Model Selection

**Mechanism:**
- `@ai-sdk/openai`, `@ai-sdk/anthropic` etc. are provider packages — each exports factory
- `createProviderRegistry({ openai, anthropic })` builds unified registry
- Model resolution: `registry.languageModel('openai/gpt-4.1')` → parses `provider/modelId`
- Custom provider: implement `LanguageModelV3` interface → `doGenerate()` + `doStream()`

**Design decisions:**
- String-based model IDs (`'provider/model'`) enable runtime switching without code changes
- Custom provider wraps any HTTP API (e.g., Antigravity Proxy) as first-class provider
- `wrapLanguageModel` + custom modelId/providerId enables aliasing: `'fast'` → actual model

**Python CLI analogy:**
- `LLMClient` should support `model_id: str = 'gemini/gemini-3-pro-high'` routing pattern
- Build `ProviderRegistry` dict: `{'gemini': GeminiClient, 'anthropic': AnthropicClient}`
- Antigravity Proxy is already an OpenAI-compatible endpoint → wrap as single `AntigravityProvider`
- Model aliasing: `'fast'` → `gemini-3-flash`, `'smart'` → `gemini-3-pro-high` configured in registry

---

## Key Takeaways for mekong-cli RecipeOrchestrator

| AI SDK Pattern | mekong-cli Equivalent | Action |
|---|---|---
| `stopWhen` predicate | `max_retries` int | Replace with callable stop condition |
| `prepareStep` hook | None | Add `before_step(ctx)` hook to orchestrator |
| Middleware chain | Hardcoded retry in orchestrator | Decorator chain on `LLMClient.complete()` |
| OTel spans | `execution_trace.json` | Add `opentelemetry-sdk` spans, export to Langfuse |
| Provider registry | Single `LLMClient` | `ProviderRegistry` with string-based model routing |
| Tool result auto-feed | Manual `ExecutionResult` passing | Standardize result → context injection |

---

## Unresolved Questions
- AI SDK 5 vs 4.x: `stopWhen` API — confirm current stable release uses `maxSteps` or `stopWhen`
- Python OTel: which OTLP exporter works best with Langfuse (HTTP vs gRPC)?
- Antigravity Proxy: does it expose usage token counts in response? Needed for span attributes.
- `prepareStep` model-switching: cost of initializing new model client per step in Python?

---

Sources:
- [Agents: Loop Control — ai-sdk.dev](https://ai-sdk.dev/docs/agents/loop-control)
- [wrapLanguageModel — ai-sdk.dev](https://ai-sdk.dev/docs/reference/ai-sdk-core/wrap-language-model)
- [Language Model Middleware — ai-sdk.dev](https://ai-sdk.dev/docs/ai-sdk-core/middleware)
- [AI SDK Telemetry — ai-sdk.dev](https://ai-sdk.dev/docs/ai-sdk-core/telemetry)
- [Langfuse Vercel AI SDK integration](https://langfuse.com/integrations/frameworks/vercel-ai-sdk)
- [AI SDK 5 — Vercel Blog](https://vercel.com/blog/ai-sdk-5)
- [AI SDK 3.4 — Vercel Blog](https://vercel.com/blog/ai-sdk-3-4)
