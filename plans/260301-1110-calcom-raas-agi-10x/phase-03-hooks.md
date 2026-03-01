---
title: "Phase 3 — Event Hook System"
status: pending
priority: P1
effort: 2h
---

# Phase 3: Event Hook System

## Overview
Cal.com webhook system has 19+ triggers with HMAC-SHA256 signing and retry logic.
Map to **HookRegistry** — register HTTP webhooks for mission lifecycle events.

## Related Code Files
- **Create:** `src/core/hooks.py`
- **Create:** `tests/test_hooks.py`
- **Modify:** `src/core/event_bus.py` — extend `EventType` with mission hook events
- **Modify:** `src/main.py` — add `hook` CLI group

## Architecture

```
HookEvent (str, Enum)                      # extends/mirrors EventType
  MISSION_CREATED, MISSION_STARTED
  MISSION_COMPLETED, MISSION_FAILED
  MISSION_CANCELLED, AGENT_ASSIGNED
  STEP_STARTED, STEP_COMPLETED
  HOOK_DELIVERY_FAILED, TENANT_CREATED

WebhookConfig (dataclass)
  id: str
  url: str
  secret: str                              # HMAC-SHA256 signing key
  events: List[HookEvent]
  active: bool = True
  retry_count: int = 3

HookRegistry
  _hooks: Dict[str, WebhookConfig]
  register(config) → WebhookConfig
  remove(hook_id) → bool
  list() → List[WebhookConfig]
  trigger(event, payload) → List[DeliveryResult]
  _sign_payload(payload, secret) → str    # HMAC-SHA256
  _deliver(hook, payload, signature) → DeliveryResult  # httpx POST
  _retry(hook, payload, n) → DeliveryResult
  _persist() / _load()                   # .mekong/hooks.yaml
```

## Implementation Steps

1. Create `src/core/hooks.py`:
   - `HookEvent` enum with 10 event types
   - `WebhookConfig` dataclass + `DeliveryResult` dataclass (success, status_code, error)
   - `HookRegistry._sign_payload()` → `hmac.new(secret, payload_bytes, sha256).hexdigest()`
   - `_deliver()` using `httpx.post()` (sync, timeout=10s) with `X-Mekong-Signature` header
   - Retry: exponential backoff (1s, 2s, 4s) up to `retry_count`
   - YAML persistence to `.mekong/hooks.yaml`
   - `get_hook_registry()` singleton

2. Wire into `EventBus` (optional, non-breaking):
   - `EventBus.subscribe()` can call `HookRegistry.trigger()` on relevant events
   - Keep loose coupling — hooks are opt-in overlay

3. Add CLI group to `src/main.py`:
   ```python
   @app.command("hook")
   # sub-commands: list, add, remove, test
   # test <hook_id> → sends sample payload, shows delivery result
   ```

4. Create `tests/test_hooks.py`:
   - test HMAC-SHA256 signature generation
   - test register/remove/list
   - test `_deliver()` with httpx mock (respx or unittest.mock)
   - test retry on failure (mock 500 → 200)
   - test YAML persistence round-trip

## CLI Interface
```bash
mekong hook list
mekong hook add --url https://example.com/webhook --secret mykey --events MISSION_COMPLETED,MISSION_FAILED
mekong hook remove <hook_id>
mekong hook test <hook_id>
```

## Success Criteria
- [ ] HMAC-SHA256 signature matches reference implementation
- [ ] Retry logic delivers on 2nd attempt after mocked 500
- [ ] `hook test` shows delivery status + response code in rich panel
- [ ] YAML persistence round-trip verified

## Notes
- Use `httpx` (already likely in deps) for HTTP delivery — sync mode only (KISS)
- If `httpx` not installed, fallback to `urllib.request` (stdlib)
- Secrets stored plaintext in YAML for now — Phase 5 tenant layer adds encryption
