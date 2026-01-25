# Phase 9: Backend & MCP Servers - Comprehensive Scout Report

**Date:** 2026-01-25
**Scope:** backend/ and antigravity/mcp_servers/
**Analysis Tools:** 3x Gemini Flash agents (parallel execution)

---

## Executive Summary

Analyzed **154 Python files** (~42k LOC) across backend API, services, and 14 MCP servers. Identified **26 critical issues** requiring immediate attention before go-live.

### Critical Metrics
- **Files >200 lines:** 16 (modularization candidates)
- **TODO/FIXME items:** 47 active
- **Security vulnerabilities:** 3 critical (P0)
- **Architecture violations:** 8 major (P1)
- **Code duplication:** ~1,900 lines (MCP server pattern)

### Priority Breakdown
- **P0 (Critical):** 3 security issues
- **P1 (High):** 11 architecture/functionality issues
- **P2 (Medium):** 8 complexity/maintainability issues
- **P3 (Low):** 4 cleanup tasks

---

## Part 1: backend/api/ Analysis

### 🚨 P0/P1: Critical Issues

#### 1. Monolithic Router Files (P1)
**Files:**
- `backend/api/routers/health.py` (343 lines)
- `backend/api/routers/test_team.py` (342 lines)
- `backend/api/routers/kanban.py` (291 lines)
- `backend/api/routers/code.py` (256 lines)
- `backend/api/routers/paypal_checkout.py` (226 lines)

**Issues:**
- Mixed concerns: models, business logic, routing in single files
- Helper functions should be in service layer
- Test files too large (need splitting)

**Refactoring:**
```
health.py →
  - backend/api/schemas/health.py (models)
  - backend/services/health_service.py (logic)
  - backend/api/routers/health.py (endpoints only)

kanban.py →
  - backend/services/kanban_service.py (extract business logic)
  - Address TODOs at lines 49, 206
```

#### 2. Security: Missing Auth Dependencies (P1)
**Files:** `payments.py`, `health.py`
**Issue:** APIRouter defined without default dependencies (potentially open access)
**Fix:** Add `dependencies=[Depends(get_current_user)]` or explicitly mark as public

#### 3. Security: Weak Auth Utils (P0)
**File:** `backend/api/auth/utils.py`
**Lines:** 9, 55
**Issues:**
- Hardcoded fallback `SECRET_KEY` in code
- Missing type annotations on `verify_password()`, `create_access_token()`
- Bare exception handling swallows JWT errors

**Fix:**
```python
# Before
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-insecure-key")

# After
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable required")
```

#### 4. Error Handling Anti-Pattern (P1)
**File:** `backend/api/routers/payments.py`
**Lines:** 78, 88, 107, 116, 125, 148
**Issue:** Generic `except Exception as e` in every endpoint
**Fix:** Replace with specific exceptions:
```python
# Before
try:
    result = paypal_service.create_order()
except Exception as e:
    raise HTTPException(500, str(e))

# After
try:
    result = paypal_service.create_order()
except PayPalSDKError as e:
    raise HTTPException(502, f"PayPal error: {e}")
except ValidationError as e:
    raise HTTPException(400, f"Invalid request: {e}")
```

---

## Part 2: backend/ Services Analysis

### 🚨 P0: Critical Functionality Gap

#### 1. Unfinished Payment Fallback (P0)
**File:** `backend/services/payment_orchestrator.py`
**Lines:** 234, 245, 263, 288, 309
**Issue:** `PolarProvider` raises `NotImplementedError` for all methods
**Impact:** If PayPal fails, system crashes instead of falling back
**Fix:** Complete Polar integration OR gracefully degrade with proper error messaging

### 🟠 P1/P2: Architecture Issues

#### 2. Large Service Files (P2)
**Files needing decomposition:**
- `audit_service.py` (549 lines) → Split to `AuditWriter` + `AuditReader`
- `backup_service.py` (525 lines) → Extract restoration logic
- `payment_orchestrator.py` (519 lines) → Extract providers to `backend/providers/payment/`
- `stripe_service.py` (486 lines) → Split webhook handling

#### 3. Global Singleton Anti-Pattern (P2)
**Files:** `backup_service.py`, `email_service.py`, `audit_service.py`
**Issue:** `global _service_instance` pattern
**Fix:** Use existing `backend/di_container.py` for proper DI

#### 4. Broad Exception Handling (P1)
**File:** `backend/core/security/audit.py`
**Lines:** 133, 153
**Issue:** Bare `except:` swallows errors during audit logging
**Fix:**
```python
# Before
try:
    formatted = template.format(**context)
except:
    pass

# After
try:
    formatted = template.format(**context)
except (KeyError, ValueError) as e:
    logger.error(f"Audit formatting failed: {e}")
    formatted = str(context)  # Fallback
```

---

## Part 3: antigravity/mcp_servers/ Analysis

### 🚨 P0: Critical Security

#### 1. Hardcoded Credentials (P0 - IMMEDIATE)
**File:** `antigravity/mcp_servers/quota_server/account_selector.py`
**Lines:** 52-69
**Issue:** Production credentials hardcoded in source
```python
self.accounts = [
    QuotaAccount(email="minhlong.rice@gmail.com", ...)  # EXPOSED
]
```
**Fix:** Move to `~/.mekong/config.json` or environment variables

#### 2. Missing MCP Authentication (P0)
**Files:** All 14 `server.py` files
**Issue:** No auth/token validation on JSON-RPC stdin
**Risk:** Any process can execute MCP tools
**Fix:** Implement connection handshake or token validation

#### 3. Unhandled File I/O Exceptions (P1)
**Files:** `workflow_server/handlers.py`, `solo_revenue_server/handlers.py`
**Lines:** 105-111
**Issue:** Broad `except Exception` on JSON parsing can cause silent data corruption
**Fix:**
```python
try:
    data = json.loads(wf_file.read_text())
except json.JSONDecodeError as e:
    logger.error(f"Corrupted workflow: {wf_file}, {e}")
    # Quarantine file instead of crashing
except OSError as e:
    logger.error(f"File I/O error: {e}")
    raise
```

### 🟠 P1: Architecture Issues

#### 4. Massive Code Duplication (P1)
**Impact:** ~1,900 lines of duplicate server loop code
**Files:** All 14 `server.py` files
**Issue:** Every server reimplements:
```python
while True:
    line = sys.stdin.readline()
    if not line: break
    request = json.loads(line)
    # ... identical in every file
```
**Fix:** Create `BaseMCPServer` class in shared module

#### 5. Tight Coupling in Orchestrator (P1)
**File:** `orchestrator_server/handlers.py`
**Lines:** 8-18, 38-40
**Issue:** Direct imports of `AgencyHandler`, `CodingHandler`, `MarketingHandler`
**Fix:** Decouple - orchestrator should communicate via MCP protocol, not Python imports

#### 6. Global Singleton Cache (P2)
**File:** `quota_server/cache.py`
**Lines:** 174-183
**Issue:** Module-level `global _cache` limits testability
**Fix:** Use dependency injection

### 🟡 P2: Large Files (Modularization Needed)

- `workflow_server/handlers.py` (408 lines) → Split to `models.py`, `engine.py`, `storage.py`
- `commander_server/handlers.py` (397 lines) → Extract health check classes
- `solo_revenue_server/handlers.py` (386 lines) → Extract `TaskExecutor` classes
- `quota_server/account_selector.py` (219 lines) → Fix TODO first, then split
- `network_server/handlers.py` (201 lines) → Move hardcoded endpoints to config

---

## Refactoring Roadmap

### Phase 1: Security (IMMEDIATE - 4 hours)
**Priority:** P0 issues only
- [ ] Remove hardcoded credentials in `quota_server/account_selector.py`
- [ ] Implement config loader for MCP accounts
- [ ] Fix hardcoded `SECRET_KEY` fallback in `auth/utils.py`
- [ ] Add auth validation to MCP server stdin handlers

### Phase 2: Critical Functionality (Day 1 - 8 hours)
**Priority:** P0/P1 blockers
- [ ] Complete or stub Polar provider in `payment_orchestrator.py`
- [ ] Fix broad exception handling in `audit.py`
- [ ] Add specific exception handling to `payments.py`
- [ ] Implement file I/O error guards in workflow/revenue servers

### Phase 3: Architecture Refactoring (Day 2 - 8 hours)
**Priority:** P1 major issues
- [ ] Create `BaseMCPServer` abstract class
- [ ] Refactor all 14 `server.py` files to inherit from base
- [ ] Decouple orchestrator imports (use MCP protocol)
- [ ] Migrate global singletons to DI container

### Phase 4: Modularization (Day 3 - 8 hours)
**Priority:** P2 complexity reduction
- [ ] Split monolithic routers (health, kanban, code, paypal_checkout)
- [ ] Decompose large services (audit, backup, payment_orchestrator)
- [ ] Extract MCP handler logic to focused modules
- [ ] Replace `print()` with proper logging in demo services

### Phase 5: Quality Gates (Day 3 - 4 hours)
**Priority:** P2/P3 cleanup + testing
- [ ] Run `mypy --strict backend/` and fix type hints
- [ ] Add return type annotations to all test functions
- [ ] Split `test_team.py` into focused test files
- [ ] Move Pydantic models to `schemas/` directory
- [ ] Run full test suite and ensure >80% coverage

---

## Success Metrics

**Before Refactoring:**
- Files >200 lines: 16
- TODO/FIXME: 47
- Security vulnerabilities: 3 critical
- Code duplication: ~1,900 lines
- Test coverage: Unknown

**After Refactoring (Target):**
- Files >200 lines: 0
- TODO/FIXME: 0
- Security vulnerabilities: 0
- Code duplication: <100 lines
- Test coverage: >80%
- All tests passing: ✅

---

## Unresolved Questions

1. **Payment Strategy:** Should we complete Polar integration or remove fallback claims?
2. **MCP Auth:** Token-based or certificate-based authentication for MCP protocol?
3. **Backward Compatibility:** Are there external clients depending on current API signatures?
4. **Test Infrastructure:** Do we have staging environment for integration testing?
5. **Deployment Timeline:** When is the hard go-live deadline?
