# Phase 6: CLI Integration with RaaS Gateway — Implementation Plan

**Date:** 2026-03-08
**Scope:** CLI authentication, rate limiting, usage telemetry, gateway routing
**Work Context:** `/Users/macbookprom1/mekong-cli`

---

## 1. Tổng Quan Kiến Trúc Hiện Tại

### RaaS Gateway (Cloudflare Worker)

| Component | File | Purpose |
|-----------|------|---------|
| **Main Router** | `apps/raas-gateway/index.js` | Edge routing, auth, rate limiting, proxy to backend |
| **Auth Handler** | `apps/raas-gateway/src/edge-auth-handler.js` | JWT validation + mk_ API key verification |
| **Rate Limiter** | `apps/raas-gateway/src/kv-rate-limiter-per-api-key.js` | KV-based sliding window per tenant |
| **Usage Meter** | `apps/raas-gateway/src/kv-usage-meter.js` | Hourly bucket aggregation for billing |

### Backend (FastAPI + SQLite)

| Component | File | Purpose |
|-----------|------|---------|
| **Tenant Store** | `src/raas/tenant.py` | SQLite tenant management with SHA-256 API key hashing |
| **Credits** | `src/raas/credits.py` | Credit ledger with atomic transactions |
| **Auth Middleware** | `src/api/raas_auth_middleware.py` | FastAPI dependency for tenant context |
| **Orchestrator** | `src/core/orchestrator.py` | Plan-Execute-Verify engine |

---

## 2. Phase 6 Scope & API Endpoints

### Modules to Create

| Module | File | Purpose |
|--------|------|---------|
| **RaaS Auth Client** | `src/core/raas-auth.py` | JWT/API key management, session validation |
| **Rate Limit Client** | `src/core/raas-rate-limit.py` | Check rate limit status, handle 429 responses |
| **Telemetry Reporter** | `src/core/raas-telemetry.py` | Report usage metrics to gateway |
| **Gateway Router** | `src/core/gateway-client.py` | Unified client for all gateway calls |

### API Endpoints Specification

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/v1/auth/validate` | Bearer token | Validate API key/JWT, return tenant info |
| GET | `/v1/auth/session` | Bearer token | Get current session info |
| GET | `/v1/rate-limit/status` | Bearer token | Check remaining quota |
| POST | `/v1/usage/report` | Bearer token | Submit usage metrics |
| GET | `/v1/usage/current` | Bearer token | Get current hour usage |

---

## 3. Implementation Phases

### Phase 1: Setup & Auth Module (Priority: P0)

**Mục tiêu:** CLI authentication với RaaS Gateway

**Files cần tạo:**
- `src/core/raas-auth.py` — Auth client module
- `src/cli/auth-commands.py` — CLI commands (login, status, logout)

**Files cần sửa:**
- `src/main.py` — Add auth command group

**Implementation Steps:**

1. **Create `raas-auth.py`:**
   - `RaaSAuthClient` class với methods:
     - `validate_credentials(token: str) → TenantContext`
     - `get_session() → SessionInfo`
     - `refresh_token() → str`
     - `logout() → bool`
   - Support both JWT (Supabase) và mk_ API keys
   - Store tokens securely in `~/.mekong/raas/credentials.json`

2. **Create `auth-commands.py`:**
   - `mekong auth login` — Interactive login flow
   - `mekong auth status` — Show current auth status
   - `mekong auth logout` — Clear stored credentials
   - `mekong auth rotate-key` — Generate new API key

3. **Update `main.py`:**
   - Add `@app.command("auth")` group
   - Register subcommands

**Success Criteria:**
- [ ] `mekong auth login` successfully stores credentials
- [ ] `mekong auth status` shows tenant info
- [ ] Credentials persist across CLI sessions
- [ ] API key format validated (mk_ prefix)

**Dependencies:** None (foundation module)

---

### Phase 2: Rate Limiting Client (Priority: P1)

**Mục tiêu:** Rate limit checking và handling

**Files cần tạo:**
- `src/core/raas-rate-limit.py` — Rate limit client

**Implementation Steps:**

1. **Create `raas-rate-limit.py`:**
   - `RateLimitClient` class:
     - `check_status() → RateLimitStatus`
     - `wait_for_reset() → None` (async backoff)
     - `handle_429(response: Response) → RetryAfter`
   - Parse headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
   - Implement exponential backoff với jitter

2. **Integration points:**
   - Gateway client tự động check rate limit trước khi gọi API
   - Auto-retry với backoff khi gặp 429

**Success Criteria:**
- [ ] Rate limit headers được parse chính xác
- [ ] Auto-retry sau 429 với exponential backoff
- [ ] Clear error messages khi rate limited

**Dependencies:** Phase 1 (auth client)

---

### Phase 3: Usage Metering & Telemetry (Priority: P1)

**Mục tiêu:** Report usage metrics cho billing

**Files cần tạo:**
- `src/core/raas-telemetry.py` — Usage telemetry reporter
- `src/core/usage-tracker.py` — Local usage tracking

**Implementation Steps:**

1. **Create `usage-tracker.py`:**
   - Track local usage metrics:
     - API calls count
     - LLM tokens used
     - Agent executions
     - Payload sizes
   - Store in `~/.mekong/usage/local.db` (SQLite)

2. **Create `raas-telemetry.py`:**
   - `TelemetryReporter` class:
     - `record_call(endpoint: str, method: str, payload_size: int)`
     - `flush_to_gateway() → FlushResult`
     - `get_current_usage() → UsageSummary`
   - Batch reporting (every N calls or M seconds)
   - Retry queue for failed reports

3. **Integration:**
   - Hook into orchestrator steps
   - Track LLM calls, agent spawns, file operations

**Success Criteria:**
- [ ] Usage tracked locally với zero data loss
- [ ] Batch report thành công đến gateway
- [ ] Usage data khớp với gateway records

**Dependencies:** Phase 1 (auth for API access)

---

### Phase 4: Gateway Client Integration (Priority: P0)

**Mục tiêu:** Unified gateway client cho tất cả API calls

**Files cần tạo:**
- `src/core/gateway-client.py` — Main gateway client

**Implementation Steps:**

1. **Create `gateway-client.py`:**
   - `GatewayClient` class (unified interface):
     - `auth` — RaaSAuthClient instance
     - `rate_limit` — RateLimitClient instance
     - `telemetry` — TelemetryReporter instance
     - `request(method, path, **kwargs) → Response`
   - Base URL từ env: `RAAS_GATEWAY_URL` (default: `https://raas.agencyos.network`)
   - Auto-inject auth headers
   - Handle retry logic

2. **Environment config:**
   - `RAAS_GATEWAY_URL` — Gateway endpoint
   - `RAAS_LICENSE_KEY` — Optional license key
   - `RAAS_TENANT_ID` — Optional tenant override

**Success Criteria:**
- [ ] Single client interface cho tất cả operations
- [ ] Auto-auth, auto-retry, auto-telemetry
- [ ] Clean error handling với retry fallback

**Dependencies:** Phases 1-3

---

### Phase 5: Agent Integration (Priority: P2)

**Mục tiêu:** Route agent calls qua gateway

**Files cần sửa:**
- `src/agents/lead_hunter.py` — Add gateway routing
- `src/agents/content_writer.py` — Add gateway routing
- `src/agents/recipe_crawler.py` — Add gateway routing
- `src/core/executor.py` — Gateway execution mode

**Implementation Steps:**

1. **Add gateway mode to agents:**
   - Check `RAAS_GATEWAY_URL` env var
   - If set, route LLM calls qua gateway
   - Else, use direct provider calls (existing behavior)

2. **Update executor:**
   - Add `gateway` execution mode
   - Track agent spawns via telemetry
   - Handle gateway-specific errors

3. **Agent-specific integration:**
   - **LeadHunter:** Report leads generated qua telemetry
   - **ContentWriter:** Track content pieces created
   - **RecipeCrawler:** Report recipe scans

**Success Criteria:**
- [ ] Agents route qua gateway khi configured
- [ ] Usage telemetry chính xác cho mỗi agent
- [ ] Fallback sang direct mode khi gateway unavailable

**Dependencies:** Phase 4 (gateway client)

---

### Phase 6: Testing & E2E Validation (Priority: P1)

**Mục tiêu:** Comprehensive testing và validation

**Files cần tạo:**
- `tests/e2e/test_raas_gateway_integration.py` — E2E tests
- `tests/unit/test_raas_auth.py` — Unit tests for auth
- `tests/unit/test_raas_rate_limit.py` — Unit tests for rate limiting
- `tests/unit/test_raas_telemetry.py` — Unit tests for telemetry

**Implementation Steps:**

1. **Unit Tests:**
   - Test auth flow (valid/invalid tokens)
   - Test rate limit parsing
   - Test telemetry batching

2. **Integration Tests:**
   - Test gateway client with mock server
   - Test retry logic
   - Test credential storage

3. **E2E Tests:**
   - Full flow: login → cook → usage report → logout
   - Test rate limit handling
   - Test gateway failover

**Success Criteria:**
- [ ] 90%+ code coverage cho new modules
- [ ] E2E tests pass với real gateway
- [ ] All edge cases covered (network errors, invalid credentials, etc.)

**Dependencies:** Phases 1-5

---

## 4. File Structure Summary

### New Files to Create

```
src/core/
├── raas-auth.py              # Phase 1
├── raas-rate-limit.py        # Phase 2
├── raas-telemetry.py         # Phase 3
├── usage-tracker.py          # Phase 3
└── gateway-client.py         # Phase 4

src/cli/
└── auth-commands.py          # Phase 1

tests/
├── unit/
│   ├── test_raas_auth.py
│   ├── test_raas_rate_limit.py
│   └── test_raas_telemetry.py
└── e2e/
    └── test_raas_gateway_integration.py
```

### Files to Modify

```
src/main.py                   # Phase 1 — Add auth commands
src/agents/lead_hunter.py     # Phase 5 — Gateway routing
src/agents/content_writer.py  # Phase 5 — Gateway routing
src/core/executor.py          # Phase 5 — Gateway mode
```

---

## 5. Dependencies & Sequencing

```
Phase 1 (Auth) ──────┬────────────────────────────────────→ Phase 4 (Gateway Client)
                     │                                       │
Phase 2 (Rate Limit) ┤                                       │
                     ├───────────────────────────────────────┤
Phase 3 (Telemetry) ─┘                                       │
                                                             ↓
                                                    Phase 5 (Agent Integration)
                                                             │
                                                             ↓
                                                    Phase 6 (Testing & E2E)
```

---

## 6. Success Criteria (Definition of Done)

### Functional Requirements

- [ ] CLI có thể authenticate với RaaS Gateway
- [ ] Rate limiting được enforce và handle đúng
- [ ] Usage metrics được report chính xác
- [ ] Agents route qua gateway khi configured
- [ ] E2E tests pass 100%

### Quality Gates

- [ ] 0 `any` types trong new code
- [ ] 90%+ test coverage
- [ ] Type hints cho tất cả functions
- [ ] Docstrings cho public APIs
- [ ] Error handling comprehensive

### Documentation

- [ ] API docs cho new modules
- [ ] Usage guide trong README
- [ ] Migration guide cho existing users

---

## 7. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gateway unavailable | High | Fallback to direct provider calls |
| Credential leak | Critical | Encrypt stored credentials, use env vars |
| Rate limit too aggressive | Medium | Configurable limits, backoff tuning |
| Usage data loss | Medium | Local SQLite queue with retry |

---

## 8. Unresolved Questions

1. **Gateway URL default:** Should we use production URL or require explicit config?
2. **Credential encryption:** Use system keychain (macOS Keychain, Windows Credential Manager) or simple file encryption?
3. **Telemetry batching:** What's optimal batch size/interval for production?
4. **Backward compatibility:** Should existing CLI users need migration or is it seamless?
