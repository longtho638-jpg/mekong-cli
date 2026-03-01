## Portkey-AI/gateway GitHub Repository Research Report

### 1. Budget and Rate Limiting Per-User/Per-Key Implementation

*   **Per-Key/Provider Instance Rate Limiting:** The `conf.example.json` file demonstrates rate limiting configured at the integration level. Each `integration` entry can specify `rate_limits` with a `type` (e.g., `requests`, `tokens`), `unit` (e.g., `rph` - requests per hour), and `value`. This allows for granular control over the usage of specific API keys or provider instances.
    ```json
    "integrations": [
        {
          "provider": "anthropic",
          "slug": "dev_team_anthropic",
          "credentials": { "apiKey": "sk-ant-" },
          "rate_limits": [
            { "type": "requests", "unit": "rph", "value": 3 },
            { "type": "tokens", "unit": "rph", "value": 3000 }
          ],
          "models": [...]
        }
      ]
    ```
*   **Per-User Rate Limiting:** While the Gateway passes a `user` parameter to upstream LLMs (e.g., in OpenAI configs `user: { param: 'user' }`), explicit per-user rate limiting *within the Gateway* itself was not directly identified in the explored configuration or core middleware. This functionality might be achieved through external integrations, a dedicated plugin, or an enterprise-tier feature not evident in the open-source codebase. However, the presence of `stabilityClientUserId` and `oracleUser` in request headers suggests that user identification is available and could be leveraged by custom logic or plugins for such purposes.

### 2. Request Transformation Between Provider Formats

*   **Config-Driven Mapping:** Request transformation is a core feature, managed through configuration objects like `OpenAIChatCompleteConfig` (TypeScript representation of a JSON config) found in `gateway/src/providers/openai/chatComplete.ts`. These configurations define how generic incoming parameters are mapped to provider-specific API parameters, including validation (`required`, `default`, `min`, `max`).
    ```typescript
    // Example from OpenAIChatCompleteConfig
    export const OpenAIChatCompleteConfig: ProviderConfig = {
      model: { param: 'model', required: true, default: 'gpt-3.5-turbo' },
      messages: { param: 'messages', default: '' },
      max_tokens: { param: 'max_tokens', default: 100, min: 0 },
      // ... other parameters
    };
    ```
*   **Response Normalization:** Dedicated `ResponseTransform` functions (e.g., `OpenAIChatCompleteResponseTransform`, `OpenAIChatCompleteJSONToStreamResponseTransform` in `gateway/src/providers/openai/chatComplete.ts`) are responsible for normalizing provider-specific responses into a consistent internal and client-facing format. This includes error transformation and converting JSON responses into Server-Sent Events (SSE) compatible stream chunks for streaming APIs.

### 3. Config-Driven Routing Rules (Portkey Configs)

*   **Centralized Configuration:** Routing rules are entirely config-driven, primarily defined within the `integrations` array in `conf.example.json`.
*   **Provider Configuration (`ProviderConfigs`):** The `ProviderConfigs` interface (found in `gateway/src/providers/types.ts`) serves as the TypeScript definition for these configurations, allowing the Gateway to dynamically understand and apply routing logic based on the `provider`, `slug`, `credentials`, `rate_limits`, and `models` specified for each integration.
*   **Dynamic Endpoint Resolution:** Each provider implementation includes functions (`getBaseURL`, `getEndpoint`) that dynamically determine the target URL based on the incoming request, provider options, and configured parameters.

### 4. Observability - Logging, Metrics, Tracing

*   **Logging:** The Gateway utilizes a configurable `Logger` utility (`gateway/src/shared/utils/logger.ts`), allowing hierarchical logging and external configuration via `APM_LOGGER` environment variable. Logs are used across various components, including cache backends.
*   **Tracing:** A `TRACE_ID` (`x-portkey-trace-id`) is generated, propagated through requests (`handlers/services/requestContext.ts`), and included in logs and responses (`handlers/services/logsService.ts`, `handlers/services/responseService.ts`). This enables request traceability across the Gateway's internal components.
*   **Metrics:** `METRICS_KEYS` (in `globals.ts`) define metrics. Specifically, `providers/bedrock/` files demonstrate the extraction of `amazon-bedrock-invocationMetrics` (e.g., `inputTokenCount`, `outputTokenCount`). This indicates that token usage and potentially other performance metrics are collected, contributing to the "Usage analytics" mentioned in the README.

### 5. Plugin/Middleware Architecture Extensibility

*   **Modular Plugin System:** The Gateway features a robust, modular plugin system, evident from the `plugins/` directory. Each subdirectory within `plugins/` represents a distinct plugin (e.g., `default`, `portkey`, `aporia`, `f5-guardrails`, `promptsecurity`).
*   **Plugin Registration:** `gateway/plugins/index.ts` acts as a central registry, importing `handler` functions from various plugins and aggregating them into a `plugins` object. This allows the Gateway to discover and manage available functionalities.
*   **Config-Driven Activation:** The `plugins_enabled` array in `conf.example.json` allows administrators to selectively activate or deactivate specific plugins at runtime, making the architecture highly extensible and adaptable for various use cases like guardrails, content moderation, and validation.
*   **TypeScript Patterns:** Plugins are typically implemented with `handler` functions, accepting context and request parameters, enabling custom logic injection into the request/response lifecycle.
