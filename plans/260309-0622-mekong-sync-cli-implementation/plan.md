# Mekong Sync CLI Implementation - Phase 6 Completion

> **RaaS Gateway Integration**: License validation, rate limiting, usage metrics sync

---

## Overview

**Priority:** High (Phase 6 completion)
**Status:** Pending
**Complexity:** COMPLEX

Implement `mekong sync` command to synchronize local usage metrics with RaaS Gateway billing system.

---

## Key Insights

1. **Existing Infrastructure:**
   - `sync-raas` already in FREE_COMMANDS list (src/main.py:75)
   - GatewayClient already has circuit breaker + telemetry (src/core/gateway_client.py)
   - RaaS Gate Validator handles license validation (src/lib/raas_gate_validator.py)
   - KV-based rate limiting in gateway (apps/raas-gateway/src/kv-rate-limiter-per-api-key.js)
   - Usage metering with hourly buckets (apps/raas-gateway/src/kv-usage-meter.js)

2. **Architecture Pattern:**
   - CLI → GatewayClient → RaaS Gateway (raas.agencyos.network)
   - JWT/mk_ API key authentication
   - Circuit breaker failover (primary → secondary → tertiary)
   - Audit logging for compliance

---

## Requirements

### Functional

1. **CLI Command** `mekong sync`
   - Validate RAAS_LICENSE_KEY
   - Fetch local usage metrics from telemetry
   - Sync to RaaS Gateway /v1/usage endpoint
   - Display sync status and rate limit info

2. **Rate Limit Enforcement**
   - Check rate limit before sync
   - Handle 429 responses gracefully
   - Display remaining quota

3. **Usage Metrics**
   - Collect: request count, payload size, endpoint type
   - Hourly bucket aggregation
   - Match server-side metering format

### Non-Functional

- Python 3.9+ compatible
- Type hints for all functions
- Tests in tests/test_sync_command.py
- Error handling with retry logic

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  mekong sync    │────▶│  GatewayClient   │────▶│  RaaS Gateway   │
│    Command      │     │  (circuit breaker)│     │  /v1/usage     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                      │                        │
         │                      ▼                        │
         │             ┌──────────────────┐             │
         └────────────│  TelemetryReporter│◀────────────┘
                       │  (local metrics) │
                       └──────────────────┘
```

---

## Related Code Files

### To Create
- `src/commands/sync_commands.py` - CLI command handlers
- `src/raas/sync_client.py` - Sync-specific SDK client
- `tests/test_sync_command.py` - Test suite

### To Modify
- `src/main.py` - Register sync command (already in FREE_COMMANDS)
- `src/core/telemetry_reporter.py` - Add sync export method
- `docs/development-roadmap.md` - Mark Phase 6 complete

---

## Implementation Steps

### Step 1: Sync SDK Client
**File:** `src/raas/sync_client.py`
- Methods: `validate_license()`, `get_usage_summary()`, `sync_metrics()`
- Integrate with GatewayClient
- Handle rate limit responses

### Step 2: CLI Command
**File:** `src/commands/sync_commands.py`
- `sync()` - Main sync command
- `sync_status()` - Show sync status without uploading
- `sync_reset()` - Reset local metrics (admin only)
- Rich console output with tables

### Step 3: Telemetry Integration
**File:** `src/core/telemetry_reporter.py`
- `get_sync_summary()` - Aggregate metrics for sync
- `export_hourly_metrics()` - Export in gateway format
- Match KV hourly bucket format

### Step 4: Tests
**File:** `tests/test_sync_command.py`
- Mock GatewayClient responses
- Test rate limit handling
- Test offline mode

### Step 5: Documentation
**Files:** `docs/development-roadmap.md`, `docs/project-changelog.md`
- Mark Phase 6 complete
- Add sync command docs

---

## Todo List

- [ ] Step 1: Create sync_client.py
- [ ] Step 2: Create sync_commands.py
- [ ] Step 3: Update telemetry_reporter.py
- [ ] Step 4: Register command in main.py
- [ ] Step 5: Write tests
- [ ] Step 6: Update documentation
- [ ] Step 7: Run test suite
- [ ] Step 8: Code review

---

## Success Criteria

1. **CLI Command Works:**
   - `mekong sync` executes without errors
   - Shows sync status with rate limit info
   - Handles 429 responses gracefully

2. **License Validation:**
   - Invalid license shows error message
   - Valid license proceeds to sync

3. **Metrics Alignment:**
   - Local metrics match RaaS Gateway format
   - Hourly buckets align correctly

4. **Tests Pass:**
   - 100% test pass rate
   - No ignored failures

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gateway unreachable | High | Circuit breaker failover |
| Rate limit exceeded | Medium | Display remaining, wait |
| Metrics mismatch | High | Match KV bucket format |
| License invalid | Medium | Clear error messages |

---

## Security Considerations

- License key in env var (RAAS_LICENSE_KEY)
- JWT tokens truncated in logs (first 100 chars)
- No secrets in codebase
- Audit logging for all sync operations

---

## Next Steps

1. Start with Step 1: sync_client.py
2. Test each step before proceeding
3. Run full test suite at end
4. Code review with code-reviewer agent
