---
title: "Phase 3: License Validation Middleware"
description: "Implement CLI license validation middleware with gateway integration and execution blocking"
status: pending
priority: P1
effort: 3h
---

# Phase 3: License Validation Middleware

## Context Links

- Related: `src/lib/raas_gate_validator.py` — Current validator
- Related: `src/main.py` — CLI entry point
- Related: `src/auth/secure_storage.py` — Secure storage (Phase 1)

## Overview

**Priority:** P1 (Critical Path)
**Status:** pending
**Description:** Implement CLI middleware that validates license on every command execution and blocks with clear error messages.

## Key Insights

- Current validation in `main.py` only checks at startup
- Need middleware that runs before every premium command
- Gateway validation requires network timeout handling
- Fallback to cached validation for offline mode

## Requirements

### Functional

1. Pre-command validation middleware
2. Gateway API client with timeout (5s)
3. Cached validation (1 hour TTL)
4. Offline mode (use cached if gateway unreachable)
5. Clear error messages with upgrade path
6. User-Agent header on all requests

### Non-Functional

- Validation adds < 500ms to command startup
- Graceful degradation (offline mode)
- Clear, actionable error messages
- No blocking on network timeout

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              CLI Validation Middleware                       │
│                                                              │
│  Before Command Execution:                                   │
│  │                                                           │
│  ├─→ Is command free? ──yes──▶ Allow                        │
│  │                        no                                 │
│  ├─→ Load key from secure storage                           │
│  ├─→ Is key present? ──no──▶ Block: "Not logged in"         │
│  │                        yes                                │
│  ├─→ Check cache (TTL 1h) ──valid──▶ Allow                  │
│  │                        expired                            │
│  ├─→ Call Gateway POST /v1/auth/verify                      │
│  │    (timeout 5s, User-Agent header)                        │
│  │                                                           │
│  ├─→ Gateway timeout? ──yes──▶ Use cache (offline mode)     │
│  │                        no                                 │
│  ├─→ Gateway error? ──yes──▶ Block with message             │
│  │                        no                                 │
│  └─→ Cache response + Allow                                 │
│                                                              │
│  Error Messages:                                             │
│  - Missing: "Not logged in. Run: mekong login"              │
│  - Invalid: "Invalid license key. Visit: raas.mekong.dev"   │
│  - Expired: "License expired. Renew: mekong renewal"        │
│  - Offline: "Gateway unreachable. Using cached license."    │
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files

### Files to Create

- `src/auth/gateway_client.py` — HTTP client for gateway API
- `src/auth/validation_cache.py` — Cached validation (TTL 1h)
- `src/auth/user_agent.py` — User-Agent string builder
- `src/middleware/license_middleware.py` — Pre-command middleware

### Files to Modify

- `src/lib/raas_gate_validator.py` — Integrate gateway client
- `src/main.py` — Add middleware to command flow
- `src/commands/auth_commands.py` — Add cache clear on logout

## Implementation Steps

### Step 1: Gateway HTTP Client (45min)

1. Create `src/auth/gateway_client.py`:
   ```python
   import httpx
   from datetime import datetime

   class GatewayClient:
       BASE_URL = "https://raas.mekong.dev"

       def __init__(self, timeout: float = 5.0):
           self.client = httpx.AsyncClient(timeout=timeout)

       async def verify_license(
           self,
           key: str,
           email: str | None = None
       ) -> LicenseValidationResponse:
           headers = {"User-Agent": build_user_agent()}
           response = await self.client.post(
               f"{self.BASE_URL}/v1/auth/verify",
               json={"license_key": key, "email": email},
               headers=headers
           )
           return LicenseValidationResponse(**response.json())
   ```

### Step 2: User-Agent Builder (15min)

1. Create `src/auth/user_agent.py`:
   ```python
   import platform
   from importlib.metadata import version

   def build_user_agent() -> str:
       """Build User-Agent string: mekong-cli/0.2.0 (darwin; arm64)"""
       ver = version("mekong-cli")
       system = platform.system().lower()
       machine = platform.machine().lower()
       return f"mekong-cli/{ver} ({system}; {machine})"
   ```

### Step 3: Validation Cache (30min)

1. Create `src/auth/validation_cache.py`:
   ```python
   import json
   from pathlib import Path
   from datetime import datetime, timedelta
   from src.auth.gateway_client import LicenseValidationResponse

   CACHE_FILE = Path.home() / ".mekong" / "validation_cache.json"
   CACHE_TTL = timedelta(hours=1)

   class ValidationCache:
       @staticmethod
       def load() -> LicenseValidationResponse | None:
           if not CACHE_FILE.exists():
               return None
           data = json.loads(CACHE_FILE.read_text())
           cached_at = datetime.fromisoformat(data["cached_at"])
           if datetime.utcnow() - cached_at > CACHE_TTL:
               return None
           return LicenseValidationResponse(**data["response"])

       @staticmethod
       def save(response: LicenseValidationResponse) -> None:
           CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
           CACHE_FILE.write_text(json.dumps({
               "cached_at": datetime.utcnow().isoformat(),
               "response": response.model_dump()
           }))

       @staticmethod
       def clear() -> None:
           if CACHE_FILE.exists():
               CACHE_FILE.unlink()
   ```

### Step 4: License Middleware (45min)

1. Create `src/middleware/license_middleware.py`:
   ```python
   from src.auth.secure_storage import get_license_key
   from src.auth.gateway_client import GatewayClient
   from src.auth.validation_cache import ValidationCache
   from src.lib.raas_gate_utils import get_upgrade_message

   async def validate_and_check_license(
       command: str,
       is_free_command: bool
   ) -> tuple[bool, str | None]:
       """
       Validate license before command execution.

       Returns:
           (allow_execution, error_message)
       """
       # Free commands skip validation
       if is_free_command:
           return True, None

       # Load key from secure storage
       key = get_license_key()
       if not key:
           return False, (
               "Not logged in. Run 'mekong login' to authenticate."
           )

       # Check cache first
       cached = ValidationCache.load()
       if cached and cached.valid:
           return True, None

       # Call gateway
       client = GatewayClient()
       try:
           response = await client.verify_license(key)
       except httpx.TimeoutException:
           # Offline mode - use stale cache
           if cached:
               return True, None
           return False, "Gateway unreachable. Check network connection."

       if response.valid:
           ValidationCache.save(response)
           return True, None

       # Invalid/expired
       return False, get_upgrade_message(command)
   ```

### Step 5: Integrate with Main (30min)

1. Modify `src/main.py`:
   ```python
   import asyncio
   from src.middleware.license_middleware import validate_and_check_license

   def _validate_startup_license(ctx: typer.Context) -> None:
       command = _get_invoked_command(ctx)
       is_free = command in FREE_COMMANDS

       # Run async validation
       is_valid, error = asyncio.run(
           validate_and_check_license(command, is_free)
       )

       if not is_valid:
           console.print(f"[bold red]License Error:[/bold red] {error}")
           raise SystemExit(1)
   ```

### Step 6: Error Message Improvements (15min)

1. Update `src/lib/raas_gate_utils.py`:
   ```python
   def get_upgrade_message(command: str) -> str:
       """Generate upgrade message with specific action."""
       return f"""
   ╔══════════════════════════════════════════════════════════╗
   ║  🔒 RaaS License Required                                ║
   ╠══════════════════════════════════════════════════════════╣
   ║  Command '{command}' requires valid license.            ║
   ║                                                          ║
   ║  Options:                                                ║
   ║  1. Login: mekong login                                  ║
   ║  2. Get license: https://raas.mekong.dev/pricing         ║
   ║  3. Free tier: mekong license generate --tier free       ║
   ╚══════════════════════════════════════════════════════════╝
   """
   ```

## Success Criteria

- [ ] Middleware runs before every premium command
- [ ] Gateway call with 5s timeout
- [ ] Cached validation used when available
- [ ] Offline mode works (uses stale cache)
- [ ] Clear error messages for all failure modes
- [ ] User-Agent header sent with requests
- [ ] Cache cleared on logout
- [ ] No console.log statements
- [ ] Type hints on all functions
- [ ] Docstrings on public methods

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gateway downtime | High | Offline mode with cached validation |
| Network timeout | Medium | 5s timeout, graceful fallback |
| Cache corruption | Low | Silent fallback to re-validation |
| User-Agent parsing fails | Low | Default string if parsing fails |

## Security Considerations

- License key sent over HTTPS only
- No keys stored in cache (only validation result)
- Cache file permissions: 600 (owner read/write only)
- Timeout prevents hanging on malicious gateway

## Next Steps

→ Phase 4: Testing + Documentation

## Todo List

- [ ] Create gateway HTTP client
- [ ] Create user-agent builder
- [ ] Create validation cache with TTL
- [ ] Create license middleware
- [ ] Integrate middleware into main.py
- [ ] Update error messages
- [ ] Add cache clear on logout
- [ ] Remove all console.log statements
- [ ] Add type hints and docstrings
- [ ] Test offline mode
- [ ] Test timeout handling
