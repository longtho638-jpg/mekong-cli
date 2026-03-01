# Research Report: Vercel AI SDK Architecture Patterns

**Date:** 2026-03-01 | **Sources:** ai-sdk.dev docs, Gemini CLI research, GitHub vercel/ai
**Focus:** Patterns mappable to CLI-based Plan-Execute-Verify engines

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Package Structure](#package-structure)
3. [Core Architecture: ai/core](#core-architecture)
4. [Provider Abstraction Pattern](#provider-abstraction)
5. [Streaming Architecture](#streaming-architecture)
6. [Tool/Function Calling](#tool-calling)
7. [Middleware System](#middleware-system)
8. [Structured Output (generateObject/streamObject)](#structured-output)
9. [Multi-Step Agent Patterns](#agent-patterns)
10. [Embeddings & RAG](#embeddings-rag)
11. [Telemetry & Observability](#telemetry)
12. [Error Handling](#error-handling)
13. [Design Patterns Summary](#design-patterns)
14. [CLI Engine Mapping](#cli-engine-mapping)
15. [Unresolved Questions](#unresolved-questions)

---

## 1. Executive Summary

The Vercel AI SDK (npm: `ai`, GitHub: `vercel/ai`) is a TypeScript-first framework providing a unified abstraction layer over LLM providers. As of 2025-2026 it has matured into a modular multi-package system under `@ai-sdk/*`.

Three core tenets drive the design:
- **Provider interchangeability** via `LanguageModelV1/V3` interface — swap OpenAI for Anthropic in one line
- **Streaming-first** — every function optimized for partial data delivery over HTTP
- **Declarative agentic loops** — `maxSteps`/`stopWhen` + `tool()` pattern removes the need for manual tool-call management

**Key insight for mekong-cli:** The SDK's Plan-Execute-Verify DNA directly mirrors Mekong's own architecture. The `maxSteps` loop IS the Plan-Execute loop. The `verifier` pattern maps to `onStepFinish` + result validation. Tool calling IS the executor dispatch mechanism.

---

## 2. Package Structure

```
npm: ai                          # Main entry point (re-exports @ai-sdk/core)
@ai-sdk/core                     # Framework-agnostic engine
@ai-sdk/ui                       # Shared chat state logic
@ai-sdk/react                    # React hooks (useChat, useCompletion, useObject)
@ai-sdk/vue                      # Vue adapter
@ai-sdk/svelte                   # Svelte adapter
@ai-sdk/angular                  # Angular adapter
@ai-sdk/provider                 # LanguageModelV1/V3 interface specs
@ai-sdk/openai                   # OpenAI provider implementation
@ai-sdk/anthropic                # Anthropic provider implementation
@ai-sdk/google                   # Google Generative AI provider
@ai-sdk/mistral                  # Mistral provider
@ai-sdk/cohere                   # Cohere provider
@ai-sdk/amazon-bedrock           # AWS Bedrock provider
```

**Monorepo pattern:** All packages in `packages/` directory. Provider packages each implement `LanguageModelV1` — no shared runtime coupling between providers.

**Tree-shaking:** Provider code never bleeds into the core bundle. Only the provider you import is included.

---

## 3. Core Architecture (ai/core)

### 3.1 Complete Function Catalog

**Text Generation:**
```typescript
generateText(options)   // Full response, blocking
streamText(options)     // Streaming, returns AsyncIterable
```

**Structured Output:**
```typescript
// generateText/streamText with output property — schema-validated
generateText({ output: Output.object({ schema: z.object({...}) }) })
streamText({ output: Output.array({ schema: z.object({...}) }) })
```

**Embeddings:**
```typescript
embed(options)          // Single value → vector
embedMany(options)      // Batch → vectors[]
rerank(options)         // Rerank results
cosineSimilarity(a, b)  // Vector distance
```

**Media:**
```typescript
generateImage(options)
generateSpeech(options)
transcribe(options)
experimental_generateVideo(options)
```

**Agent UI:**
```typescript
ToolLoopAgent
createAgentUIStream()
createAgentUIStreamResponse()
pipeAgentUIStreamToResponse()
```

**Tooling:**
```typescript
tool(options)           // Type-safe tool definition
dynamicTool(options)    // Runtime-schema tool
```

**Provider:**
```typescript
createProviderRegistry(providers)
customProvider(options)
createMCPClient(options)            // MCP protocol client
```

**Middleware:**
```typescript
wrapLanguageModel({ model, middleware })
wrapImageModel({ model, middleware })
extractReasoningMiddleware()
extractJsonMiddleware()
simulateStreamingMiddleware()
defaultSettingsMiddleware()
addToolInputExamplesMiddleware()
```

**Utilities:**
```typescript
generateId()
createIdGenerator()
stepCountIs(n)          // Stop condition helper
hasToolCall()           // Stop condition helper
simulateReadableStream()
smoothStream()
cosineSimilarity()
```

### 3.2 Core Function Signatures

**generateText:**
```typescript
const result = await generateText({
  model,                           // LanguageModelV1/V3
  prompt?,                         // string
  system?,                         // string
  messages?,                       // ModelMessage[]
  tools?,                          // ToolSet
  toolChoice?,                     // 'auto' | 'required' | 'none' | {type:'tool',toolName}
  maxRetries?,                     // number (default 2)
  abortSignal?,
  headers?,
  stopWhen?,                       // StopCondition | StopCondition[]
  output?,                         // Output.object() | Output.array() | Output.json() | Output.text()
  experimental_telemetry?,
  // Lifecycle callbacks:
  onStepFinish?,                   // (StepResult) => void | Promise<void>
  experimental_onStart?,
  experimental_onStepStart?,
  experimental_onToolCallStart?,
  experimental_onToolCallFinish?,
  onFinish?,
});

// Returns:
result.text                        // string
result.content                     // ContentPart[]
result.reasoning / result.reasoningText
result.toolCalls                   // ToolCall[]
result.toolResults                 // ToolResult[]
result.finishReason                // 'stop' | 'length' | 'tool-calls' | 'error' | ...
result.usage                       // { promptTokens, completionTokens, totalTokens }
result.totalUsage                  // Accumulated across all steps
result.steps                       // StepResult[] — all multi-step data
result.response                    // Raw provider response
result.warnings
result.providerMetadata
```

**streamText:**
```typescript
const stream = streamText({
  // Same params as generateText, plus:
  onError?,                        // (error) => void
  onChunk?,                        // (chunk) => void — text, reasoning, tool-calls
  experimental_transform?,         // Stream transformation function
});

// Returns:
stream.textStream                  // AsyncIterable<string> | ReadableStream<string>
stream.fullStream                  // All events
stream.text                        // Promise<string>
stream.toUIMessageStreamResponse() // Response for useChat
stream.toTextStreamResponse()      // Plain text Response
```

---

## 4. Provider Abstraction Pattern

### 4.1 LanguageModelV1/V3 Interface

The core interface every provider must implement:

```typescript
interface LanguageModelV1 {
  // Identity
  readonly specificationVersion: 'v1';
  readonly provider: string;        // e.g., 'openai.chat'
  readonly modelId: string;         // e.g., 'gpt-4o'
  readonly defaultObjectGenerationMode: 'json' | 'tool' | undefined;

  // Capabilities
  supportsStructuredOutputs?: boolean;
  supportsImageUrls?: boolean;

  // Execution
  doGenerate(options: LanguageModelV1CallOptions): Promise<LanguageModelV1GenerateResult>;
  doStream(options: LanguageModelV1CallOptions): Promise<LanguageModelV1StreamResult>;
}
```

**All SDK functions accept `LanguageModelV1`** — providers are interchangeable at the call site.

### 4.2 Provider Implementation Pattern

```typescript
// @ai-sdk/openai creates a factory function:
import { openai } from '@ai-sdk/openai';

const model = openai('gpt-4o');        // Returns LanguageModelV1 impl
const model = openai('gpt-4o', {       // With per-model config
  temperature: 0.7,
  structuredOutputs: true,
});
```

### 4.3 Provider Registry

```typescript
import { createProviderRegistry } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

const registry = createProviderRegistry({
  openai,
  anthropic,
  // Custom separator support (default: ':')
});

// Access via string IDs — enables runtime model switching
const model = registry.languageModel('openai:gpt-4o');
const embed = registry.embeddingModel('openai:text-embedding-3-large');
const img   = registry.imageModel('openai:dall-e-3');
```

**AI SDK 5 addition:** `globalThis.AI_SDK_DEFAULT_PROVIDER` — set global default provider, skip prefix in all calls.

### 4.4 Custom Provider (Mekong-relevant)

```typescript
import { customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';

// Pre-configure with Antigravity Proxy settings
const mekongProvider = customProvider({
  languageModels: {
    'fast':    openai('gpt-4o-mini', { baseURL: 'http://localhost:9191' }),
    'precise': openai('gpt-4o',      { baseURL: 'http://localhost:9191' }),
    'heavy':   openai('o1-preview',  { baseURL: 'http://localhost:9191' }),
  },
});

// Use by alias
const result = await generateText({ model: mekongProvider.languageModel('fast') });
```

---

## 5. Streaming Architecture

### 5.1 Data Stream Protocol (2025)

Replaced raw text streams. A **multi-channel protocol** sends text, tool calls, sources, and control signals over one HTTP connection:

```
# Wire format (newline-delimited, type-prefixed):
0:"Hello"          # text delta
9:[{toolCall}]     # tool call
a:[{toolResult}]   # tool result
d:{usage,finish}   # finish event with metadata
```

### 5.2 RSC Streaming (React Server Components)

```typescript
// SERVER: createStreamableUI — stream React components
import { createStreamableUI } from 'ai/rsc';

async function action() {
  const ui = createStreamableUI(<Spinner />);

  (async () => {
    const result = await fetchData();
    ui.update(<ResultCard data={result} />);
    ui.done();
  })();

  return ui.value; // StreamableValue<ReactNode>
}

// CLIENT: consume with useUIState
```

### 5.3 StreamableValue

```typescript
// SERVER: stream arbitrary values
import { createStreamableValue } from 'ai/rsc';

const stream = createStreamableValue(0);
stream.update(50);
stream.update(100);
stream.done();

// CLIENT:
import { useStreamableValue } from 'ai/rsc';
const [progress] = useStreamableValue(streamFromServer);
```

### 5.4 smoothStream Transformer

```typescript
// Prevents word/character jitter in UI
const result = streamText({
  model,
  experimental_transform: smoothStream({ delayInMs: 10 }),
});
```

---

## 6. Tool/Function Calling

### 6.1 tool() Helper

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const searchTool = tool({
  description: 'Search the web for information',
  inputSchema: z.object({
    query:      z.string().describe('Search query'),
    maxResults: z.number().optional().default(5),
  }),
  execute: async ({ query, maxResults }) => {
    const results = await webSearch(query, maxResults);
    return { results, count: results.length };
  },
  // Advanced:
  needsApproval: async ({ args }) => args.query.includes('delete'),
  strict: true,  // Strict schema enforcement (where supported)
});
```

### 6.2 Type System

```typescript
type ToolCall<NAME extends string, ARGS> = {
  type: 'tool-call';
  toolCallId: string;
  toolName: NAME;
  args: ARGS;
};

type ToolResult<NAME extends string, ARGS, RESULT> = {
  type: 'tool-result';
  toolCallId: string;
  toolName: NAME;
  args: ARGS;
  result: RESULT;
};

// From a ToolSet (record of tools), extract all possible types:
type TypedToolCall<TOOLS extends ToolSet>   // union of all tool call types
type TypedToolResult<TOOLS extends ToolSet> // union of all tool result types
```

### 6.3 Stop Conditions

```typescript
// Built-in stop conditions
stopWhen: stepCountIs(5)      // Stop after 5 steps
stopWhen: hasToolCall('done') // Stop when specific tool called

// Custom stop condition
stopWhen: (result) => result.toolResults.some(r => r.toolName === 'finalize')

// Multiple conditions (OR logic)
stopWhen: [stepCountIs(10), hasToolCall('error')]
```

### 6.4 dynamicTool (runtime schemas)

```typescript
import { dynamicTool } from 'ai';

const dynamicSearch = dynamicTool({
  description: 'Execute dynamic query',
  inputSchema: jsonSchema<{ query: string }>({
    type: 'object',
    properties: { query: { type: 'string' } },
    required: ['query'],
  }),
  execute: async ({ query }) => runQuery(query),
});
```

### 6.5 Tool Repair

```typescript
// Experimental: fix malformed tool calls
const result = await generateText({
  model,
  tools: { search: searchTool },
  experimental_repairToolCall: async ({ toolCall, error, messages, system }) => {
    // AI-assisted repair of invalid tool input
    const repaired = await generateObject({
      model,
      schema: searchTool.inputSchema,
      prompt: `Fix this tool call: ${JSON.stringify(toolCall)}. Error: ${error.message}`,
    });
    return { ...toolCall, args: repaired.object };
  },
});
```

### 6.6 activeTools (limit available tools per step)

```typescript
const result = await generateText({
  model,
  tools: allTools,
  activeTools: ['search', 'calculate'],  // Only expose these two this step
});
```

---

## 7. Middleware System

### 7.1 LanguageModelV3Middleware Interface

```typescript
interface LanguageModelV3Middleware {
  // Transform params BEFORE any call (both doGenerate and doStream)
  transformParams?: (options: {
    params: LanguageModelV1CallOptions;
    type: 'generate' | 'stream';
  }) => Promise<LanguageModelV1CallOptions>;

  // Wrap the blocking doGenerate call
  wrapGenerate?: (options: {
    params: LanguageModelV1CallOptions;
    model: LanguageModelV1;
    next: () => Promise<LanguageModelV1GenerateResult>;
  }) => Promise<LanguageModelV1GenerateResult>;

  // Wrap the streaming doStream call
  wrapStream?: (options: {
    params: LanguageModelV1CallOptions;
    model: LanguageModelV1;
    next: () => Promise<LanguageModelV1StreamResult>;
  }) => Promise<LanguageModelV1StreamResult>;
}
```

### 7.2 Applying Middleware

```typescript
import { wrapLanguageModel } from 'ai';

// Single middleware
const model = wrapLanguageModel({
  model: openai('gpt-4o'),
  middleware: loggingMiddleware,
});

// Multiple middleware (applied left-to-right)
const model = wrapLanguageModel({
  model: openai('gpt-4o'),
  middleware: [cacheMiddleware, loggingMiddleware, rateLimitMiddleware],
});
```

### 7.3 Built-in Middleware

```typescript
extractReasoningMiddleware({ tagName: 'think' })
// → Parses <think>...</think> tags into result.reasoning

extractJsonMiddleware()
// → Strips ```json ... ``` fences before parsing

simulateStreamingMiddleware()
// → Converts non-streaming model to streaming interface (for testing)

defaultSettingsMiddleware({ settings: { temperature: 0.7 } })
// → Applies default params to every call

addToolInputExamplesMiddleware()
// → Injects few-shot examples into tool descriptions
```

### 7.4 Custom Middleware Example (Cache + Log)

```typescript
const cachingMiddleware: LanguageModelV3Middleware = {
  transformParams: async ({ params }) => ({
    ...params,
    // Inject cache-control headers for Anthropic prompt caching
    providerOptions: {
      anthropic: {
        cacheControl: { type: 'ephemeral' },
      },
    },
  }),
  wrapGenerate: async ({ params, next }) => {
    const cacheKey = hash(params);
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    const result = await next();
    await cache.set(cacheKey, result);
    return result;
  },
};
```

---

## 8. Structured Output

### 8.1 Output Types

```typescript
import { Output } from 'ai';

// In generateText / streamText:
const result = await generateText({
  model,
  output: Output.object({ schema: z.object({ name: z.string() }) }),
  // OR:
  output: Output.array({ schema: z.object({ item: z.string() }) }),
  // OR:
  output: Output.json(),      // No schema validation
  output: Output.text(),      // Default
  output: Output.choice(['option-a', 'option-b']),  // Enum selection
});
```

### 8.2 Schema Validation Libraries

All three validation libraries supported:

```typescript
import { z } from 'zod';
import * as v from 'valibot';
import { jsonSchema } from 'ai';

// Zod (most common)
schema: z.object({ score: z.number().min(0).max(10) })

// Valibot
schema: v.object({ score: v.number() })

// Raw JSON Schema
schema: jsonSchema<{ score: number }>({
  type: 'object',
  properties: { score: { type: 'number' } },
})
```

### 8.3 Streaming Partial Objects

```typescript
const stream = streamText({
  model,
  output: Output.object({ schema: RecipeSchema }),
});

// partialOutputStream: stream partial (potentially invalid) objects
for await (const partial of stream.partialOutputStream) {
  // partial may have missing fields — handle gracefully
  renderPartialUI(partial);
}

// elementStream: stream array elements, each complete and validated
const stream2 = streamText({
  output: Output.array({ schema: IngredientSchema }),
});
for await (const ingredient of stream2.elementStream) {
  addToList(ingredient); // each ingredient fully validated
}
```

### 8.4 Error: NoObjectGeneratedError

```typescript
try {
  const result = await generateText({ output: Output.object({...}) });
} catch (e) {
  if (NoObjectGeneratedError.isInstance(e)) {
    console.log(e.text);      // Raw generated text that failed parsing
    console.log(e.cause);     // Root cause (parse error)
    console.log(e.usage);     // Token usage still available
    console.log(e.response);  // Raw provider response
  }
}
```

---

## 9. Multi-Step Agent Patterns

### 9.1 The Agentic Loop

```
LOOP (up to stopWhen):
  1. Send messages + tools to model
  2. Model returns text OR tool_calls
  3. If tool_calls: execute tools, append results to messages
  4. Call onStepFinish with step data
  5. If stopWhen satisfied: break
  6. Else: goto 1 with updated messages
```

### 9.2 Implementation

```typescript
const { text, steps, totalUsage } = await generateText({
  model: openai('gpt-4o'),
  tools: {
    search:    searchTool,
    calculate: calcTool,
    finalize:  finalizeTool,
  },
  stopWhen: [
    stepCountIs(10),
    hasToolCall('finalize'),
  ],
  onStepFinish: async ({ stepType, toolCalls, toolResults, text, usage }) => {
    // Called after EACH step — enables:
    // - Step-by-step logging
    // - Intermediate persistence
    // - Progress reporting
    // - Circuit breaking on anomalies
    await logStep({ stepType, toolCalls, toolResults, usage });
  },
  messages: initialMessages,
});

// Access all steps post-execution:
for (const step of steps) {
  console.log(step.stepType);    // 'initial' | 'tool-result' | ...
  console.log(step.toolCalls);   // Tools called in this step
  console.log(step.toolResults); // Results from tools
  console.log(step.usage);       // Token usage for this step
}
```

### 9.3 MCP Integration (Model Context Protocol)

```typescript
import { createMCPClient, Experimental_StdioMCPTransport } from 'ai';

// Connect to MCP server via stdio
const mcp = await createMCPClient({
  transport: new Experimental_StdioMCPTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
  }),
});

// Get tools from MCP server — returns ToolSet
const mcpTools = await mcp.tools();

// Use MCP tools in agentic loop
const result = await generateText({
  model,
  tools: { ...localTools, ...mcpTools },
  stopWhen: stepCountIs(5),
});

await mcp.close();
```

### 9.4 ToolLoopAgent

```typescript
// Higher-level agent abstraction (SDK v5+)
import { ToolLoopAgent } from 'ai';

const agent = new ToolLoopAgent({
  model,
  tools: myTools,
  maxSteps: 10,
});

const result = await agent.run(messages);
```

### 9.5 Approval Flow (Human-in-the-Loop)

```typescript
const humanApprovalTool = tool({
  description: 'Execute database mutation',
  inputSchema: z.object({ sql: z.string() }),
  needsApproval: async ({ args }) => {
    // Returns true if approval needed — pauses loop for human input
    return args.sql.toLowerCase().includes('delete') ||
           args.sql.toLowerCase().includes('drop');
  },
  execute: async ({ sql }) => runSQL(sql),
});
```

---

## 10. Embeddings & RAG

### 10.1 Core API

```typescript
// Single embedding
const { embedding, usage } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'The quick brown fox',
});
// embedding: number[] (1536 dimensions for this model)

// Batch embeddings (RAG preparation)
const { embeddings, usage } = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: documents,
  maxParallelCalls: 5,  // Rate limit control
});

// Semantic similarity
const score = cosineSimilarity(queryEmbedding, docEmbedding);
// Returns: -1 to 1 (1 = identical)
```

### 10.2 RAG Pattern

```typescript
// 1. PREPARE: Index documents
const docEmbeddings = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: documents.map(d => d.content),
});
const vectorStore = documents.map((doc, i) => ({
  ...doc,
  embedding: docEmbeddings.embeddings[i],
}));

// 2. RETRIEVE: Find relevant docs
async function retrieve(query: string, topK = 3) {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: query,
  });
  return vectorStore
    .map(doc => ({ ...doc, score: cosineSimilarity(embedding, doc.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// 3. GENERATE: Augmented generation
async function ragQuery(question: string) {
  const context = await retrieve(question);
  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: `Answer using this context:\n${context.map(c => c.content).join('\n')}`,
    prompt: question,
  });
  return text;
}
```

### 10.3 Reranking

```typescript
const results = await rerank({
  model: cohere.rerank('rerank-english-v3.0'),
  query: userQuery,
  documents: retrievedDocs,
  topK: 3,
});
// Returns re-ordered results with relevance scores
```

---

## 11. Telemetry & Observability

### 11.1 OpenTelemetry Integration

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// Setup (once at app boot)
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: 'http://localhost:4318/v1/traces' }),
});
sdk.start();

// Enable per-call:
const result = await generateText({
  model,
  prompt: 'Hello',
  experimental_telemetry: {
    isEnabled: true,
    functionId: 'my-feature-name',     // Identifies which feature
    metadata: { userId: '123', flow: 'checkout' },  // Custom tags
    recordInputs: true,                // Record prompts (default: true)
    recordOutputs: true,               // Record responses (default: true)
    tracer: customTracer,              // Custom TracerProvider
  },
});
```

### 11.2 Span Structure

```
generateText (root span)
├── ai.generateText.doGenerate (provider call)
│   ├── ai.generateText.doStream (if streaming)
│   └── attributes:
│       ├── ai.model.id
│       ├── ai.model.provider
│       ├── ai.usage.promptTokens
│       ├── ai.usage.completionTokens
│       └── gen_ai.* (OpenTelemetry GenAI semantic conventions)
├── ai.toolCall (per tool invocation)
│   ├── ai.toolCall.name
│   ├── ai.toolCall.id
│   ├── ai.toolCall.args (JSON)
│   └── ai.toolCall.result (JSON)
└── ai.generateText.doGenerate (step 2, if multi-step)
```

### 11.3 Key Span Attributes (AISDKSpanAttributes)

```typescript
// Model info
'ai.model.id'                    // 'gpt-4o'
'ai.model.provider'              // 'openai.chat'

// Usage
'ai.usage.promptTokens'
'ai.usage.completionTokens'
'ai.usage.totalTokens'

// Tool calls
'ai.toolCall.name'
'ai.toolCall.id'
'ai.toolCall.args'              // JSON string
'ai.toolCall.result'            // JSON string

// Performance
'ai.stream.firstChunkLatency'   // ms to first token
'ai.response.finishReason'

// Custom
'ai.telemetry.functionId'       // User-provided
'ai.telemetry.metadata.*'       // User key-values
```

---

## 12. Error Handling

### 12.1 Error Hierarchy

```typescript
// Base: all SDK errors extend AISDKError
class AISDKError extends Error {
  readonly name: string;
  static isInstance(error: unknown): boolean;
}

// API communication errors
class APICallError extends AISDKError {
  readonly url: string;
  readonly statusCode?: number;
  readonly responseBody?: string;
  readonly data?: unknown;
  readonly cause?: Error;
  readonly isRetryable: boolean;
}

// Schema validation failures
class TypeValidationError extends AISDKError {
  readonly value: unknown;    // Value that failed validation
  readonly cause: unknown;    // Zod/Valibot parse error
}

// Retry exhaustion
class RetryError extends AISDKError {
  readonly reason: 'maxRetriesExceeded' | ...;
  readonly errors: Error[];   // All errors from all attempts
  readonly lastError: Error;
}

// Structured output failure
class NoObjectGeneratedError extends AISDKError {
  readonly text: string;      // Raw LLM output
  readonly response: Response;
  readonly usage: TokenUsage;
  readonly cause: unknown;
}

// Tool call issues
class InvalidToolArgumentsError extends AISDKError {
  readonly toolName: string;
  readonly toolArgs: string;  // Raw args string that failed parsing
  readonly cause: unknown;
}

class NoSuchToolError extends AISDKError {
  readonly toolName: string;
  readonly availableTools: string[];
}

// Context window
class TokenLimitReachedError extends AISDKError {
  readonly prompt: string;
  readonly tokenLimit: number;
}

// Download failures
class DownloadError extends AISDKError {
  readonly url: string;
  readonly statusCode: number;
}
```

### 12.2 Error Handling Patterns

```typescript
import {
  APICallError,
  TypeValidationError,
  RetryError,
  NoObjectGeneratedError,
} from 'ai';

try {
  const result = await generateText({ model, prompt });
} catch (error) {
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 429) handleRateLimit(error);
    else if (!error.isRetryable) throw error; // Don't retry 4xx (except 429)
  } else if (RetryError.isInstance(error)) {
    console.log('All retries failed:', error.errors);
  } else if (TypeValidationError.isInstance(error)) {
    console.log('Invalid response structure:', error.value);
  }
}

// streamText: errors in onError callback (stream doesn't throw)
const stream = streamText({
  model,
  onError: (error) => {
    if (APICallError.isInstance(error)) reportToSentry(error);
  },
});
```

---

## 13. Design Patterns Summary

### 13.1 Provider Interchangeability Pattern

```
LanguageModelV1 interface → all providers identical at call site
Factory functions: openai('model-id') → LanguageModelV1
No inheritance — pure composition
```

### 13.2 Declarative Tool Loop Pattern

```
Describe tools → SDK manages roundtrips → get final result
No manual: "did model call a tool? feed result back"
stopWhen conditions = exit criteria (like verifier)
onStepFinish = observability hook per step
```

### 13.3 Middleware Composition Pattern

```
wrapLanguageModel([m1, m2, m3]) = left-to-right pipeline
transformParams → modifies input before call
wrapGenerate/wrapStream → wraps execution (AOP style)
Each middleware is stateless, pure transformation
```

### 13.4 Unified Result Type Pattern

```
Every function returns structured result with:
- Primary output (text, object, embedding)
- Usage metrics (promptTokens, completionTokens)
- Provenance (steps[], toolCalls[], toolResults[])
- Raw response (for debugging)
- Warnings (non-fatal issues)
```

### 13.5 Schema-First Structured Output Pattern

```
Define Zod schema → SDK handles:
  - Prompt injection (tells model to output JSON)
  - Retry on parse failure
  - TypeScript type inference from schema
  - Runtime validation
```

---

## 14. CLI Engine Mapping (Mekong-cli Relevance)

### 14.1 Pattern Correspondence

| AI SDK Pattern | Mekong CLI Equivalent | How to Adopt |
|---|---|---|
| `generateText({ tools, stopWhen })` | `RecipeOrchestrator.run()` | Replace manual tool-call loop |
| `tool({ execute })` | `RecipeStep` with executor | Wrap each step as `tool()` |
| `stopWhen: stepCountIs(n)` | `max_steps` in Recipe | Direct mapping |
| `onStepFinish` | Verifier per step | Hook for RecipeVerifier |
| `wrapLanguageModel(middleware)` | LLMClient wrappers | Replace custom retry/log logic |
| `experimental_telemetry` | `src/core/telemetry.py` | Add OTel spans |
| `generateObject({ schema })` | Planner's structured output | Replace JSON prompt hacking |
| `embedMany + cosineSimilarity` | Memory/recipe matching | Semantic recipe discovery |
| `createProviderRegistry` | LLMClient model routing | Antigravity Proxy integration |
| `RetryError` / `APICallError` | MekongError hierarchy | Map to existing exceptions |

### 14.2 Key Adoption Recommendations

**1. Replace manual tool-call loop with `generateText({ stopWhen })`**

Current mekong-cli pattern:
```python
# executor.py — manual multi-step loop
while not done and steps < max_steps:
    result = llm.call(messages)
    if result.tool_calls:
        tool_results = execute_tools(result.tool_calls)
        messages.append(tool_results)
    else:
        done = True
```

AI SDK equivalent (TypeScript):
```typescript
const { text, steps } = await generateText({
  model,
  tools: mekongTools,  // All recipe steps as tools
  stopWhen: [stepCountIs(maxSteps), hasToolCall('verify_complete')],
  onStepFinish: async (step) => await verifier.checkStep(step),
});
```

**2. Structured planner output via `generateObject`**

```typescript
const RecipeSchema = z.object({
  steps: z.array(z.object({
    id: z.string(),
    type: z.enum(['shell', 'llm', 'api']),
    command: z.string(),
    verification: z.string().optional(),
  })),
  goal: z.string(),
  dependencies: z.array(z.string()),
});

const { object: recipe } = await generateText({
  model,
  output: Output.object({ schema: RecipeSchema }),
  prompt: `Plan steps to achieve: ${goal}`,
});
// recipe is fully typed, validated Recipe
```

**3. Provider registry for Antigravity Proxy routing**

```typescript
const registry = createProviderRegistry({
  antigravity: customProvider({
    languageModels: {
      'flash':     openai('gemini-3-flash-preview', { baseURL: 'http://localhost:9191' }),
      'pro-high':  openai('gemini-3-pro-high',     { baseURL: 'http://localhost:9191' }),
      'opus':      openai('claude-opus-4-6',        { baseURL: 'http://localhost:9191' }),
    },
  }),
});
```

**4. Middleware for Antigravity-specific concerns**

```typescript
const antigravityMiddleware: LanguageModelV3Middleware = {
  wrapGenerate: async ({ next }) => {
    try {
      return await next();
    } catch (e) {
      if (APICallError.isInstance(e) && e.statusCode === 429) {
        await runScript('scripts/proxy-recovery.sh');
        return await next(); // Retry after recovery
      }
      throw e;
    }
  },
};
```

**5. Recipe memory via embeddings**

```typescript
// Index all recipes at startup
const recipeEmbeddings = await embedMany({
  model: openai.embedding('text-embedding-3-small', { baseURL: 'http://localhost:9191' }),
  values: recipes.map(r => `${r.name}: ${r.description}`),
});

// NLU pre-routing: find recipe by semantic similarity
const { embedding } = await embed({ model, value: userGoal });
const bestRecipe = recipeEmbeddings
  .map((emb, i) => ({ recipe: recipes[i], score: cosineSimilarity(embedding, emb) }))
  .sort((a, b) => b.score - a.score)[0].recipe;
```

**6. OTel telemetry for execution tracing**

```typescript
// Replace src/core/telemetry.py manual tracing with AI SDK OTel
const result = await generateText({
  model,
  experimental_telemetry: {
    isEnabled: true,
    functionId: `recipe.${recipe.name}`,
    metadata: { recipeId: recipe.id, goal },
  },
});
// Spans automatically capture: model, tokens, tool calls, timing
```

---

## 15. Unresolved Questions

1. **AI SDK v5 vs v6 stability** — v5 introduces `LanguageModelV3` and `ToolLoopAgent`. Migration path from v4 `maxSteps` param (now `stopWhen`) not fully documented. Need to verify current stable vs beta.

2. **Python equivalent** — AI SDK is TypeScript only. Mekong uses Python for core engine. Closest Python equivalent is LangChain/LangGraph or direct OpenAI function-calling. No 1:1 Python port of AI SDK exists.

3. **Antigravity Proxy compatibility** — Proxy exposes Anthropic-compatible API. AI SDK's `@ai-sdk/anthropic` can route through it, but `ANTHROPIC_BASE_URL=http://localhost:9191` env var support needs verification for each provider package.

4. **MCP server authoring** — SDK provides `createMCPClient` (consumer side). If mekong-cli needs to EXPOSE tools as an MCP server, need separate MCP server SDK (`@modelcontextprotocol/sdk`).

5. **`ToolLoopAgent` vs `generateText({ stopWhen })` trade-offs** — Higher-level `ToolLoopAgent` abstraction (v5) may hide step-level observability hooks. Unclear if it exposes `onStepFinish`.

6. **Streaming in CLI context** — AI SDK streaming optimized for HTTP/React. For CLI terminal output, need to consume `textStream` AsyncIterable directly — no issues expected but no official CLI guidance.

7. **Token budget / context window management** — No built-in context compression. SDK throws `TokenLimitReachedError`. Mekong would need to implement manual message truncation/summarization between steps.

---

## Resources

- Official docs: https://ai-sdk.dev/docs
- GitHub: https://github.com/vercel/ai
- Provider list: https://ai-sdk.dev/providers
- Middleware guide: https://ai-sdk.dev/docs/ai-sdk-core/middleware
- Agent patterns: https://ai-sdk.dev/docs/ai-sdk-core/agents
- Telemetry: https://ai-sdk.dev/docs/ai-sdk-core/telemetry
- MCP integration: https://ai-sdk.dev/docs/ai-sdk-core/mcp
- Error reference: https://ai-sdk.dev/docs/reference/ai-sdk-errors
