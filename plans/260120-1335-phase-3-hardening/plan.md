---
title: "Phase 3: Production Hardening"
description: "Eliminate technical debt and security vulnerabilities before go-live"
status: pending
priority: P0
effort: 4h
branch: phase-3-hardening
tags: [security, hardening, tech-debt, go-live]
created: 2026-01-20
---

# Phase 3: Production Hardening

> "Triet tieu no ky thuat" - Eliminate technical debt completely before go-live.

## Executive Summary

| Category | Status | Count | Risk Level |
|----------|--------|-------|------------|
| TODO/FIXME/XXX | Clean | 0 active | None |
| Pickle Usage | Needs Fix | 5 instances | HIGH |
| Default Fallbacks | Needs Fix | 1 instance | MEDIUM |
| Subprocess Calls | Review | 13 instances | LOW |
| Config Management | Mostly OK | 1 gap | LOW |
| Hardcoded Secrets | Clean | 0 found | None |

## Execution Tasks

- [ ] Phase 3.1: Fix Pickle Serialization (HIGH priority)
- [ ] Phase 3.2: Remove Insecure Default Fallbacks
- [ ] Phase 3.3: Audit Subprocess Usage
- [ ] Phase 3.4: Verify Gitignore Coverage
- [ ] Phase 3.5: Add Missing Production Configs

## Detailed Findings

### 1. TODO/FIXME/XXX Comments

**Status: CLEAN** - No active technical debt markers found.

Scanned patterns: `TODO`, `FIXME`, `XXX`, `HACK`, `BUG`

| File | Line | Content | Analysis |
|------|------|---------|----------|
| `span.py` | 77,79,96,108,120,207 | `BUG FIX:` comments | Documentation only (already fixed) |
| `workflow_steps.py` | 128-129 | Detection logic | Not a TODO, code that detects TODOs |

**Verdict:** No unfinished work requiring cleanup.

---

### 2. Security Issues

#### 2.1 Pickle Deserialization (HIGH RISK)

**Location:** `antigravity/infrastructure/distributed_queue/backends/redis_backend.py`

| Line | Code | Risk |
|------|------|------|
| 55 | `pickle.dumps(job)` | Serialization OK |
| 94 | `pickle.loads(job_data)` | **DANGEROUS** |
| 134 | `pickle.dumps(job)` | Serialization OK |
| 175 | `pickle.dumps(job)` | Serialization OK |
| 201 | `pickle.dumps(job)` | Serialization OK |

**Risk:** `pickle.loads()` can execute arbitrary code if attacker controls queue data.

**Remediation:**
```python
# Option A: Use JSON serialization
import json
job_data = json.dumps(job.model_dump())  # Pydantic v2
job = Job.model_validate_json(job_data)

# Option B: Use msgpack (faster, still safe)
import msgpack
job_data = msgpack.packb(job.model_dump())
job = Job.model_validate(msgpack.unpackb(job_data))
```

#### 2.2 Insecure Default Token (MEDIUM RISK)

**Location:** `antigravity/vibe_kanban_bridge.py:27`

```python
VIBE_KANBAN_TOKEN = os.getenv("VIBE_KANBAN_TOKEN", "default_token")
```

**Risk:** Fallback token may be used in production, providing weak authentication.

**Remediation:**
```python
VIBE_KANBAN_TOKEN = os.getenv("VIBE_KANBAN_TOKEN")
if not VIBE_KANBAN_TOKEN:
    logger.warning("VIBE_KANBAN_TOKEN not set - Kanban integration disabled")
```

#### 2.3 Subprocess Usage (LOW RISK - Review Only)

**Status:** 13 subprocess calls found, all using safe patterns.

| File | Usage | Security |
|------|-------|----------|
| `vibe_workflow.py` | Git commands | Array-style (safe) |
| `pr_manager.py` | Git/gh commands | Array-style (safe) |
| `jules_runner.py` | External runner | Array-style (safe) |
| `mcp_manager.py` | npm/git/pip | Array-style (safe) |

**Good:** No `shell=True` usage found.

---

### 3. Configuration Management

#### 3.1 Environment File Handling

| File | Gitignored? | Status |
|------|-------------|--------|
| `.env` | Yes | OK |
| `.env.local` | Yes | OK |
| `.env.production` | **No** | NEEDS FIX |

**Remediation:** Add `.env.production` to `.gitignore`

#### 3.2 Config.py Assessment

| Config File | Pattern | Status |
|-------------|---------|--------|
| `core/config.py` | Pydantic Settings | GOOD |
| `antigravity/core/config.py` | Static constants | OK (no secrets) |
| `cli/config.py` | Shim only | OK |

**core/config.py** properly uses:
- `BaseSettings` with env_file loading
- `Optional[str]` for API keys with `default=None`
- Validators for URL format

---

### 4. Security Patterns Already In Place (Strengths)

| Component | Purpose |
|-----------|---------|
| `hook_executor.py:24-25` | Regex patterns for GitHub tokens and passwords |
| `code_guardian/scanner.py:24` | Sensitive data pattern detection |
| `telemetry.py:63` | Key/secret/token/password sanitization |
| Privacy hook (`privacy-block.cjs`) | Blocks .env access without approval |

---

## Task Breakdown

### Task 3.1: Replace Pickle with Safe Serialization

**File:** `antigravity/infrastructure/distributed_queue/backends/redis_backend.py`

**Steps:**
1. Add `msgpack` or use JSON serialization
2. Update `submit_job()` to use safe serializer
3. Update `get_next_job()` to use safe deserializer
4. Update all other pickle.dumps/loads calls
5. Add unit test for serialization roundtrip

**Acceptance:** No `import pickle` in production code.

---

### Task 3.2: Fix Default Token Pattern

**File:** `antigravity/vibe_kanban_bridge.py`

**Steps:**
1. Remove `"default_token"` fallback
2. Add graceful degradation when token missing
3. Log warning if integration disabled

---

### Task 3.3: Add .env.production to Gitignore

**File:** `.gitignore`

**Steps:**
1. Add `.env.production` pattern
2. Verify no .env* files tracked in git

---

### Task 3.4: Verify All Production Configs

**Steps:**
1. Audit all `os.getenv()` calls for unsafe defaults
2. Document required environment variables
3. Create `.env.example` template

---

## Success Criteria

- [ ] Zero pickle usage in production code paths
- [ ] No hardcoded default secrets/tokens
- [ ] All .env variants in .gitignore
- [ ] pytest passes with 100% on affected modules
- [ ] Security scan passes (no HIGH/CRITICAL findings)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing queue jobs | Drain queue before migration |
| Kanban integration breaks | Graceful degradation pattern |
| Missing env vars in prod | Startup validation with clear errors |

---

## Next Steps

1. Implementer takes Task 3.1 (Pickle fix) - HIGHEST priority
2. Tester validates serialization compatibility
3. Docs-manager updates deployment guide with required env vars
