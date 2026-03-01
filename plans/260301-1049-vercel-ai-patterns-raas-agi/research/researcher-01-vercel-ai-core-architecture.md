# Vercel AI SDK — Core Architecture Research
Date: 2026-03-01 | Scope: Provider interface, streaming, structured output, tools, core vs UI

---

## 1. Unified Provider Interface

**Core mechanism:**
- Each provider (OpenAI, Anthropic, Google) is a separate npm package implementing `LanguageModelV2`/`V3` interface
- Standard interface: `doGenerate(params)` and `doStream(params)` — all providers implement both
- `createProviderRegistry()` maps string IDs to provider instances: `'openai/gpt-4.1'` → OpenAI provider
- Provider packages handle auth, API format differences, retry internally

**Key design decisions:**
- Dependency injection over inheritance — providers are pluggable, not hard-coded
- String-based model selection enables runtime switching: env var or per-request override
- Custom providers can wrap any OpenAI-compatible API (exactly like Antigravity Proxy)

**CLI applicability:**
- `LLMClient` should adopt provider registry pattern instead of if/elif chain
- Model aliasing: `'fast'` → flash, `'smart'` → pro — configured per environment
- New providers added without modifying core client code

---

## 2. Streaming Architecture

**Core mechanism:**
- `streamText()` returns `StreamTextResult` — async iterable of text deltas + metadata
- Uses Web Streams API (ReadableStream) for backpressure handling
- Data Stream Protocol: binary-encoded SSE format for client-server communication
  - Text parts: `0:string\n`, Tool calls: `9:json\n`, Finish: `e:json\n`
- `toDataStreamResponse()` wraps stream for HTTP endpoints (Express, Next.js API routes)

**Key design decisions:**
- Async iterable (`for await...of`) — consumer controls pace, no buffer overflow
- Protocol-level separation: data stream vs text stream (structured events vs raw text)
- Tool call streaming: partial tool args arrive as deltas, client can show progressive UI

**CLI applicability:**
- `RecipeExecutor` LLM steps should stream responses for long generation (Rich live display)
- Mekong Gateway (`gateway.py` FastAPI) already has WebSocket — adopt data stream protocol
- Implement `async for chunk in llm_client.stream(messages):` pattern via `requests` streaming or `httpx`

---

## 3. Structured Output / Object Generation

**Core mechanism:**
- `generateObject({ schema: z.object({...}), mode: 'auto' })` — LLM generates typed JSON
- Three modes: `json` (response_format), `tool` (tool-call extraction), `auto` (SDK picks best)
- Schema passed as Zod definition → SDK converts to JSON Schema for provider
- Output validated against schema; parse errors → retry or throw

**Key design decisions:**
- Schema-first: developer defines output shape, LLM fills it
- Mode abstraction: same API works across providers that support different structured output methods
- Streaming objects: `streamObject()` emits partial objects as they're generated

**CLI applicability:**
- `generate_json()` in `llm_client.py` should accept Pydantic model (Python's Zod equivalent)
- Auto-validate LLM response against Pydantic schema, retry on validation failure
- Planner decomposition: define `TaskDecomposition` Pydantic model, LLM fills structured plan

---

## 4. Tool System

**Core mechanism:**
- Tool = `{ description, parameters: zodSchema, execute: async (args) => result }`
- Multi-step: tool result injected into messages → LLM decides next action or final answer
- `maxSteps` / `stopWhen` controls iteration limit
- Tool choice modes: `auto` (LLM decides), `required` (must call), `none` (no tools)

**Key design decisions:**
- Tools are declarative: schema + function — SDK handles serialization, validation, injection
- Execute is optional: tool without execute = "signal" (e.g., `done` tool halts loop)
- Tool result automatically becomes next message — zero boilerplate for agentic loops

**CLI applicability:**
- `RecipeStep` params could define tools available to that step
- Agent registry → tools: `GitAgent.tools = [git_status, git_commit, git_diff]`
- Orchestrator runs multi-step: LLM picks tools → execute → feed result back → repeat
- This replaces `_rule_based_decompose()` with LLM-driven tool selection

---

## 5. AI SDK Core vs AI SDK UI

**Core mechanism:**
- **Core** (`ai` package): Server-side — `generateText()`, `streamText()`, `generateObject()`, tools, middleware
- **UI** (`@ai-sdk/react`): Client-side — `useChat()`, `useCompletion()` React hooks
- Communication: Core streams data → UI consumes via Data Stream Protocol
- Clean separation: Core works standalone (no React dependency); UI is optional layer

**Key design decisions:**
- Server/client split: LLM calls never happen client-side (security, cost control)
- Data Stream Protocol bridges the gap — works with any HTTP framework
- `useChat` maintains message state, handles streaming, provides input helpers

**CLI applicability:**
- mekong-cli already has Core (Python engine) / UI split (Rich CLI + gateway WebSocket)
- Formalize the protocol: gateway WebSocket messages should follow structured event format
- Gateway dashboard (`gateway_dashboard.py`) = "UI layer" consuming orchestrator events
- EventBus events should map to data stream protocol events for real-time UI

---

## Key Architectural Insights

| AI SDK Concept | Current mekong-cli | Gap |
|---|---|---|
| Provider registry | `LLMClient` if/elif chain | Need ProviderRegistry class |
| Streaming text | Blocking `requests.post()` | Need `httpx` async stream |
| Structured output | `generate_json()` basic | Need Pydantic schema validation |
| Tool system | `RecipeStep` flat params | Need declarative tool definitions |
| Middleware | Hardcoded retry/fallback | Need composable decorator chain |
| Data stream protocol | WebSocket raw JSON | Need structured event format |

---

## Unresolved Questions
- Python streaming: `httpx` vs `requests` streaming — which works with Antigravity Proxy?
- Pydantic schema → JSON Schema conversion: does LLM provider need explicit JSON mode?
- Tool system overhead: adding tool definitions to every LLM call increases token usage
- Data stream protocol in CLI: Rich library has Live display — how to integrate with stream?

---

Sources:
- [AI SDK Overview — ai-sdk.dev](https://ai-sdk.dev/docs/introduction)
- [Generating Text — ai-sdk.dev](https://ai-sdk.dev/docs/ai-sdk-core/generating-text)
- [Generating Structured Data — ai-sdk.dev](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- [Tools and Tool Calling — ai-sdk.dev](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- [Provider Management — ai-sdk.dev](https://ai-sdk.dev/docs/ai-sdk-core/provider-management)
- [Data Stream Protocol — ai-sdk.dev](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol)
