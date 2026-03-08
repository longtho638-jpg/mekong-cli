# Phase 6: CLI Command Scaffolding với RaaS Gateway Integration

**Date:** 2026-03-08
**Status:** Planning
**ROI:** Engineering ROI (Dev Key gate) + Operational ROI (Usage metering)

---

## Tổng quan

Mở rộng mekong-cli để support các subcommands `/cook`, `/plan`, `/debug` với:
- Authentication qua RaaS Gateway (raas.agencyos.network)
- JWT-signed requests với mk_ API key
- Rate limiting qua Cloudflare KV
- Subagent routing (license, billing, analytics)
- Usage metrics logging cho Phase 4 metering

---

## Architecture

```
User → mekong cook "task" → GatewayClient → RaaS Gateway → Subagent
         │                       │
         │                       ├── Auth (mk_ key + JWT)
         │                       ├── Rate Limit (KV)
         │                       └── Usage Metering
         └── Result ←────────────┘
```

---

## Implementation Phases

### Phase 6.1: Gateway Client Core
**Files:** `src/core/gateway_client.py` (mới)
- Unified HTTP client cho RaaS Gateway calls
- JWT signing từ mk_ API key
- Headers: `Authorization`, `X-Tenant-Id`, `X-RaaS-Source`
- Retry logic + timeout handling

### Phase 6.2: Subcommand Scaffolding
**Files:**
- `src/commands/cook.py` (mới)
- `src/commands/plan.py` (mới)
- `src/commands/debug.py` (mới)
- `src/cli/commands_registry.py` (update)

Mỗi subcommand:
- Parse arguments từ user
- Validate license qua Gateway
- Route đến subagent_type phù hợp
- Log usage metrics

### Phase 6.3: Subagent Routing
**Files:** `src/core/subagent_router.py` (mới)
- Route tasks theo subagent_type:
  - `license` → License validation
  - `billing` → Usage/billing operations
  - `analytics` → Analytics queries
  - `cook` → Implementation tasks
  - `plan` → Planning tasks
  - `debug` → Debugging tasks

### Phase 6.4: Usage Metering Integration
**Files:**
- `src/core/usage_logger.py` (mới)
- `src/core/telemetry_reporter.py` (update)

Logging fields:
- endpoint, method, status_code
- payload_size, timestamp
- tenant_id, subagent_type
- hour_bucket (YYYY-MM-DD-HH)

### Phase 6.5: CLI Registration
**Files:** `src/main.py` (update)
- Thêm subcommands vào FREE_COMMANDS
- Register qua `register_all_commands()`
- Help text + examples

---

## Task List

- [ ] 6.1.1: Tạo `GatewayClient` class với JWT signing
- [ ] 6.1.2: Implement `validate_api_key()` method
- [ ] 6.1.3: Implement `get_tenant_context()` method
- [ ] 6.1.4: Test GatewayClient với mock server
- [ ] 6.2.1: Tạo `cook.py` command với `@app.command()`
- [ ] 6.2.2: Tạo `plan.py` command
- [ ] 6.2.3: Tạo `debug.py` command
- [ ] 6.2.4: Register commands trong `commands_registry.py`
- [ ] 6.3.1: Tạo `SubagentRouter` class
- [ ] 6.3.2: Define subagent_type mappings
- [ ] 6.3.3: Implement `route_to_subagent()` method
- [ ] 6.4.1: Tạo `UsageLogger` class
- [ ] 6.4.2: Implement `log_request()` method
- [ ] 6.4.3: Batch flush telemetry (10 records)
- [ ] 6.4.4: Update `telemetry_reporter.py` với mới fields
- [ ] 6.5.1: Update `main.py` với subcommands
- [ ] 6.5.2: Add help text + examples
- [ ] 6.5.3: Test CLI commands end-to-end

---

## Success Criteria

1. ✅ `mekong cook "task"` hoạt động với license valid
2. ✅ `mekong plan "task"` hoạt động với license valid
3. ✅ `mekong debug "issue"` hoạt động với license valid
4. ✅ All commands validate license qua RaaS Gateway
5. ✅ Usage metrics được log vào telemetry
6. ✅ Rate limits enforced via gateway headers
7. ✅ JWT-signed requests compatible với Gateway v2.0.0

---

## Dependencies

- RaaS Gateway v2.0.0 (apps/raas-gateway/)
- Tenant Store SQLite (~/.mekong/raas/tenants.db)
- Cloudflare KV rate limiting
- JWT secret: RAAS_JWT_SECRET

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gateway downtime | High | Retry + fallback error message |
| Rate limit exceeded | Medium | Clear error + upgrade prompt |
| JWT signing errors | High | Unit tests + validation |
| Usage log data loss | Medium | SQLite buffer + batch flush |

---

## Next Steps

1. Implement Phase 6.1: Gateway Client Core
2. Test JWT signing + auth flow
3. Implement Phase 6.2: Subcommand scaffolding
4. Integration test với RaaS Gateway
5. Update docs với usage examples
