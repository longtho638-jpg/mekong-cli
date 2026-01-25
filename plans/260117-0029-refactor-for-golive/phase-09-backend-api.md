# Phase 9: Backend API Layer Refactoring (UPDATED)

## Overview
This phase targets the refactoring of `backend/` and `antigravity/mcp_servers/` to address 26 critical issues identified in the 2026-01-25 Scout Report. The goal is to eliminate P0 security vulnerabilities, reduce technical debt (monolithic files, code duplication), and align with the AgencyOS architecture before Go-Live.

**Scope:** 154 Python files (~42k LOC).
**Strategy:** Security First → Critical Blockers → Architecture → Modularization → Quality.

## Phase 1: Security Fixes (IMMEDIATE - 4 hours)
*Goal: eliminate all P0 vulnerabilities.*

**Status:** ✅ COMPLETED (2026-01-25)
**Tests:** 10/10 passed
**Review:** 10/10 (0 critical, 0 warnings)

### [x] Task 1.1: Remove hardcoded credentials in Quota Server
- **File:** `antigravity/mcp_servers/quota_server/account_selector.py`
- **Lines:** 52-69
- **Changes:**
  ```python
  # BEFORE
  self.accounts = [
      QuotaAccount(email="minhlong.rice@gmail.com", ...)
  ]

  # AFTER
  config_path = os.path.expanduser("~/.mekong/quota_accounts.json")
  if os.path.exists(config_path):
      with open(config_path) as f:
          data = json.load(f)
          self.accounts = [QuotaAccount(**acc) for acc in data]
  else:
      self.accounts = [] # Or raise error
  ```
- **Testing:** Verify server starts without hardcoded values; test loading from JSON.
- **Risk:** Server fails to start if config is missing (handle gracefully).

### [x] Task 1.2: Fix SECRET_KEY fallback
- **File:** `backend/api/auth/utils.py`
- **Lines:** 9, 55
- **Changes:**
  ```python
  # BEFORE
  SECRET_KEY = os.getenv("SECRET_KEY", "fallback-insecure-key")

  # AFTER
  SECRET_KEY = os.getenv("SECRET_KEY")
  if not SECRET_KEY:
      raise RuntimeError("CRITICAL: SECRET_KEY env var is not set.")
  ```
- **Testing:** Run app with and without `SECRET_KEY` env var.
- **Risk:** App will crash on startup if env var is missing (intended behavior).

### [x] Task 1.3: Secure MCP Server Stdin
- **Files:** `antigravity/mcp_servers/*/server.py` (All 14 servers)
- **Goal:** Prevent unauthorized execution if process isolation fails.
- **Changes:** Implement a simple handshake or validate `MCP_AUTH_TOKEN` env var if applicable, or ensure strict stdio isolation by redirecting logs to stderr.
- **Action:** Ensure `logging.basicConfig(stream=sys.stderr)` is set in all servers to prevent JSON-RPC corruption.

## Phase 2: Critical Functionality (Day 1 - 8 hours)
*Goal: Fix broken logic and functional blockers.*

### Task 2.1: Fix Payment Fallback Logic
- **File:** `backend/services/payment_orchestrator.py`
- **Lines:** 234, 245, 263, 288, 309
- **Issue:** `PolarProvider` raises `NotImplementedError`, causing crashes.
- **Changes:**
  ```python
  # Implement stub or basic logic
  def create_payment(self, ...):
      logger.warning("Polar provider not fully implemented, falling back")
      raise PaymentProviderError("Polar provider unavailable")
      # OR implement actual API call if keys exist
  ```
- **Testing:** Simulate PayPal failure and verify graceful handling (not crash).

### Task 2.2: Fix Broad Exception Handling
- **File:** `backend/core/security/audit.py`
- **Lines:** 133, 153
- **Changes:**
  ```python
  # BEFORE
  except:
      pass

  # AFTER
  except (KeyError, ValueError) as e:
      logger.error(f"Audit formatting failed: {e}", exc_info=True)
      formatted = str(context)
  ```
- **Testing:** Trigger audit log with invalid template/context.

### Task 2.3: Robust File I/O in Servers
- **Files:** `workflow_server/handlers.py`, `solo_revenue_server/handlers.py`
- **Changes:** Wrap JSON loading with `try/except json.JSONDecodeError` and `OSError`.

## Phase 3: Architecture Refactoring (Day 2 - 8 hours)
*Goal: Eliminate code duplication and improve testability.*

### Task 3.1: Implement BaseMCPServer
- **New File:** `antigravity/mcp_servers/base.py`
- **Concept:** Encapsulate the standard JSON-RPC loop.
- **Code:**
  ```python
  class BaseMCPServer:
      def __init__(self, name: str):
          self.name = name
          self.tools = {}

      def register_tool(self, name, func):
          self.tools[name] = func

      def run(self):
          logging.basicConfig(stream=sys.stderr, level=logging.INFO)
          while True:
              try:
                  line = sys.stdin.readline()
                  if not line: break
                  req = json.loads(line)
                  # ... handle request ...
              except Exception as e:
                  logging.error(f"Loop error: {e}")
  ```

### Task 3.2: Refactor MCP Servers to use Base
- **Files:** All `antigravity/mcp_servers/*/server.py`
- **Action:** Replace ~50 lines of boilerplate loop with `BaseMCPServer` inheritance or usage.
- **Testing:** Verify each server still responds to `tools/list` and `tools/call`.

### Task 3.3: Decouple Orchestrator
- **File:** `orchestrator_server/handlers.py`
- **Issue:** Removes direct imports of other handlers.
- **Changes:** Refactor to use MCP Client to call other servers, or dynamic dispatch if they run in the same process (but prefer isolation).

### Task 3.4: Fix Global Singletons
- **Files:** `backup_service.py`, `email_service.py`
- **Changes:** Move `_service_instance` to `backend/di_container.py` and use `Depends()` in routers.

## Phase 4: Modularization (Day 3 - 8 hours)
*Goal: Split monolithic files >200 lines.*

### Task 4.1: Split Router Files
- **Targets:** `health.py`, `test_team.py`, `kanban.py`, `code.py`.
- **Strategy:**
  1.  Move Pydantic models to `backend/api/schemas/<domain>.py`.
  2.  Move logic to `backend/services/<domain>_service.py`.
  3.  Keep only routing and DI in `backend/api/routers/<domain>.py`.

### Task 4.2: Decompose Large Services
- **Target:** `backend/services/payment_orchestrator.py` (519 lines).
- **Action:** Extract providers into `backend/providers/payment/paypal.py`, `stripe.py`, `polar.py`.

## Phase 5: Quality Gates (Day 3 - 4 hours)
*Goal: Ensure long-term maintainability.*

### Task 5.1: Type Safety
- **Action:** Run `mypy --strict backend/` on key modules.
- **Fix:** Add missing return types to API endpoints (Pydantic models).

### Task 5.2: Test Coverage
- **Action:** Run `pytest backend/tests/` and `pytest antigravity/tests/`.
- **Target:** Ensure critical paths (Auth, Payment, Audit) have >80% coverage.

## Success Metrics
1.  **Security:** 0 Critical/High vulnerabilities (Bandit scan).
2.  **Clean Code:** No files >200 LOC in `backend/api/routers`.
3.  **DRY:** MCP server boilerplate reduced by >90%.
4.  **Stability:** 100% Pass rate on existing integration tests.

## Risk Assessment
-   **Risk:** Refactoring `BaseMCPServer` might break all agents if stdio handling differs slightly.
    *   *Mitigation:* Test `agency_server` first as pilot, then roll out.
-   **Risk:** Moving credentials to external config might break deployment if secrets aren't injected.
    *   *Mitigation:* Update `docker-compose.yml` and deployment docs simultaneously.
-   **Risk:** Splitting monolithic routers might break frontend imports if API signatures change.
    *   *Mitigation:* Ensure `operation_id` and URL paths remain identical.
