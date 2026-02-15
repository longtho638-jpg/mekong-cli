# Antigravity Proxy: Commercial API Design

> **Status**: Draft v1.0
> **Target**: RaaS Agency & Enterprise Tiers

## 1. Overview

The Antigravity Proxy Commercial API provides the administrative and financial layer on top of the raw LLM routing. It allows agencies to manage quotas, monitor performance across providers, and optimize intelligence spend.

## 2. Authentication

All commercial endpoints require an `X-Agency-Key` header.
- **Free Tier**: No access to `/v1/commercial/*`
- **Agency Tier**: Read-only access to usage and status.
- **Enterprise Tier**: Full CRUD access to keys and optimization rules.

## 3. Endpoint Specifications

### 3.1 Usage & Billing
- **`GET /v1/usage/summary`**
  - Returns token usage aggregated by model, provider, and day.
  - Data: `{ "total_tokens": 150000, "cost_usd": 4.52, "breakdown": [...] }`
- **`GET /v1/usage/billing-period`**
  - Returns current billing cycle progress and projected costs.

### 3.2 Key Management
- **`GET /v1/keys`**
  - List all active agency sub-keys.
- **`POST /v1/keys/provision`**
  - Create a new sub-key with specific model restrictions and token caps.
- **`DELETE /v1/keys/{key_id}`**
  - Revoke access immediately.

### 3.3 Intelligence Optimization
- **`GET /v1/models/health`**
  - Returns real-time latency and error rates for all configured providers (Anthropic, Google, OpenAI, Ollama).
  - Used by the engine to select the most reliable path.
- **`POST /v1/optimize/routing`**
  - Updates the routing logic (e.g., "Route all 8k context tasks to Gemini Flash to save cost").

### 3.4 System Status
- **`GET /v1/status/swarms`**
  - For Enterprise users: View status of all distributed edge nodes (Tôm Hùm instances).

## 4. Implementation Strategy

1. **Layered Middleware**: Implement in `src/api/endpoints.py` using FastAPI dependencies.
2. **Persistence**: Store usage logs in a lightweight SQLite/PostgreSQL database (configured via `external-proxy/src/core/config.py`).
3. **Caching**: Use Redis or in-memory cache for real-time latency tracking.

---
© 2026 Binh Phap Venture Studio.
