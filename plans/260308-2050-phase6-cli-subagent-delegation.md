# Phase 6: CLI Subagent Delegation via RaaS Gateway

**Date**: 2026-03-08
**Status**: In Progress
**Priority**: High (ROIaaS Constitutional Requirement)

---

## Overview

Implement CLI command scaffolding để extend CLI với subcommands `/cook`, `/plan`, `/debug` delegate lên RaaS Gateway thay vì chạy local orchestrator.

**Reference**: `docs/HIEN_PHAP_ROIAAS.md` - Engineering ROI stream

---

## Key Insights

1. **Current State**: Commands chạy local `RecipeOrchestrator` - không có RaaS integration
2. **Target State**: Commands delegate lên RaaS Gateway → subagents → JWT-signed requests
3. **Business Model**: Premium commands gated by `RAAS_LICENSE_KEY` → usage metering → billing

---

## Requirements

### Functional
- [ ] `/cook` command delegates to RaaS Gateway cook subagent
- [ ] `/plan` command delegates to RaaS Gateway planner subagent
- [ ] `/debug` command delegates to RaaS Gateway debugger subagent
- [ ] JWT-signed requests to gateway (X-Cert-ID, X-Cert-Sig headers)
- [ ] Rate limit enforcement via Cloudflare KV through gateway
- [ ] Usage metrics logging for Phase 4 metering

### Non-Functional
- [ ] All network calls use `src/core/raas_auth.py` client
- [ ] Subagent type routing (license, billing, analytics, etc.)
- [ ] Error handling với graceful fallback
- [ ] Token efficiency (context < 200K per subagent)

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  CLI User   │────▶│  RaaS Gateway    │────▶│  Subagent Pool  │
│  (mekong)   │     │  (port 9191)     │     │  (cook/plan/    │
└─────────────┘     └──────────────────┘     │   debug/etc)    │
      │                     │                └─────────────────┘
      │ JWT-signed          │ Rate limit
      ▼                     ▼
┌─────────────┐     ┌──────────────────┐
│ Usage Meter │     │ Cloudflare KV    │
│ (Phase 4)   │     │ (rate limits)    │
└─────────────┘     └──────────────────┘
```

---

## Implementation Steps

### Step 1: Create RaaS Task Client
**File**: `src/lib/raas_task_client.py`
- HTTP client để giao tiếp với RaaS Gateway
- JWT request signing với certificate headers
- Response parsing và error handling
- Usage metric extraction

### Step 2: Create Subagent Router
**File**: `src/lib/subagent_router.py`
- Subagent type mapping (cook→cook, plan→planner, debug→debugger)
- Complex routing (license, billing, analytics → specialized agents)
- Request payload building
- Response aggregation

### Step 3: Update CLI Commands
**Files**: `src/commands/core_commands.py`, `src/cli/cook_commands.py`
- Modify `/cook`, `/plan`, `/debug` để delegate lên gateway
- Keep local orchestrator làm fallback
- Add `--remote` flag để toggle delegation mode

### Step 4: Add Usage Metering Hooks
**Files**: `src/lib/usage_meter.py`, `src/lib/raas_audit_logger.py`
- Log command execution events
- Track credits consumed per command
- Sync với RaaS Gateway billing

### Step 5: Testing & Validation
- Test commands với RaaS Gateway
- Test fallback mode khi gateway unavailable
- Verify usage metrics logged correctly

---

## Success Criteria

1. ✅ Commands delegate thành công lên RaaS Gateway
2. ✅ JWT-signed requests hoạt động
3. ✅ Usage metrics được log vào audit trail
4. ✅ Rate limits enforced via gateway
5. ✅ Fallback mode hoạt động khi gateway down

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gateway unreachable | Commands fail | Fallback to local orchestrator |
| JWT signing fails | Auth errors | Certificate auto-rotation |
| Rate limit hit | Commands blocked | Grace period + upgrade prompts |
| Usage metrics lost | Billing gaps | Local cache + retry queue |

---

## Todo List

- [ ] Step 1: Create `raas_task_client.py`
- [ ] Step 2: Create `subagent_router.py`
- [ ] Step 3: Update CLI commands
- [ ] Step 4: Add usage metering hooks
- [ ] Step 5: Test & validate
- [ ] Step 6: Update docs

---

## Unresolved Questions

1. RaaS Gateway endpoint cụ thể cho subagent delegation?
2. Subagent type list đầy đủ (ngoài cook/plan/debug)?
3. Usage metric schema cho Phase 4 metering?
