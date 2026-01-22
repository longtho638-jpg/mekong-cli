---
title: "Phase 3: Security & Infrastructure Refactoring"
description: "Refactor security-critical and infrastructure code with extra care"
status: pending
priority: P0
effort: 8h
phase: 3
---

# Phase 3: Security & Infrastructure Refactoring

> High-stakes refactoring of security and infrastructure modules.

## Context Links

- Phase 2: `./phase-02-core-engine-refactoring.md`
- Security directory: `/core/security/`
- Infrastructure directory: `/antigravity/infrastructure/`

## Overview

**Priority:** P0 - Security-critical code
**Current Status:** pending
**Description:** Careful modularization of security and infrastructure with zero tolerance for regression.

## Key Insights

1. **Security code requires extra scrutiny** - No regressions allowed
2. **env_manager.py is critical** - Handles all environment secrets
3. **Infrastructure affects performance** - Benchmark before/after
4. **OpenTelemetry integration sensitive** - Observability must not break

## Requirements

### Functional
- Split security modules without exposing vulnerabilities
- Maintain all infrastructure capabilities
- Preserve telemetry and tracing

### Non-Functional
- Security audit after each split
- Performance benchmarks required
- Zero secret exposure in logs/diffs

## Target Files

### Security (core/security/)

| File | LOC | Risk Level | Action |
|------|-----|------------|--------|
| `env_manager.py` | 584 | CRITICAL | Split with review |
| `validate_phase2_fixes.py` | 524 | HIGH | Split or archive |
| `auth_middleware.py` | 312 | HIGH | Evaluate |
| `api_keys.py` | ~200 | MEDIUM | Review only |

### Infrastructure (antigravity/infrastructure/)

| File | LOC | Risk Level | Action |
|------|-----|------------|--------|
| `opentelemetry.py` | 590 | HIGH | Split by layer |
| `distributed_queue.py` | 585 | HIGH | Extract workers |
| `viral_defense.py` | 340 | MEDIUM | Evaluate |
| `scale.py` | 317 | MEDIUM | Evaluate |

## Architecture

### 3.1 Security Module Split

```
core/security/
  __init__.py
  env_manager/
    __init__.py
    loader.py           # Environment loading
    validator.py        # Secret validation
    rotator.py          # Secret rotation
    cache.py            # Secure caching
  auth/
    __init__.py
    middleware.py       # Auth middleware (slim)
    tokens.py           # Token management
    permissions.py      # Permission checks
  api_keys/
    __init__.py
    manager.py          # Key management
    validator.py        # Key validation
```

**Critical Consideration:**
- `env_manager.py` handles `.env` files - any bug = security incident
- Split by concern: loading vs validation vs rotation
- Each module must be independently testable

### 3.2 Infrastructure Module Split

```
antigravity/infrastructure/
  telemetry/
    __init__.py
    opentelemetry.py    # OTel integration (slim)
    tracing.py          # Trace management
    metrics.py          # Metrics export
    logging.py          # Structured logging
  queue/
    __init__.py
    manager.py          # Queue management
    workers.py          # Worker processes
    tasks.py            # Task definitions
    retry.py            # Retry logic
  defense/
    __init__.py
    viral.py            # Viral defense
    rate_limiting.py    # Rate limiting
  scaling/
    __init__.py
    horizontal.py       # Horizontal scaling
    vertical.py         # Vertical scaling
```

## Implementation Steps

### Security Refactoring (Careful!)

1. [ ] **Audit `env_manager.py`** - Document all secrets handling
2. [ ] Create `env_manager/` directory
3. [ ] Extract loader logic -> `loader.py`
4. [ ] Extract validation -> `validator.py`
5. [ ] **Security review checkpoint** - Verify no regressions
6. [ ] Update imports
7. [ ] Run security test suite

8. [ ] **Audit `auth_middleware.py`**
9. [ ] Create `auth/` directory if needed
10. [ ] Split by concern
11. [ ] **Security review checkpoint**

### Infrastructure Refactoring

12. [ ] Create `telemetry/` directory
13. [ ] Split `opentelemetry.py` into 4 modules
14. [ ] Verify all traces/metrics still work
15. [ ] **Performance benchmark checkpoint**

16. [ ] Create `queue/` directory
17. [ ] Split `distributed_queue.py` into 4 modules
18. [ ] Test worker processes
19. [ ] **Performance benchmark checkpoint**

## Todo List

- [ ] `env_manager.py` security audit
- [ ] `env_manager.py` split (584 LOC)
- [ ] Security test verification
- [ ] `opentelemetry.py` split (590 LOC)
- [ ] `distributed_queue.py` split (585 LOC)
- [ ] Performance benchmarks
- [ ] Infrastructure tests

## Success Criteria

- [ ] All security modules < 200 LOC
- [ ] All infrastructure modules < 200 LOC
- [ ] Zero security regressions
- [ ] No performance degradation (< 5% variance)
- [ ] All observability features working
- [ ] Security test suite passes

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Secret exposure | CRITICAL | Review all diffs, no secrets in logs |
| Auth bypass | CRITICAL | Comprehensive auth testing |
| Telemetry loss | HIGH | Verify traces after each change |
| Queue failures | HIGH | Test worker failover |

## Security Considerations

### env_manager.py Split Checklist
- [ ] No secrets in error messages
- [ ] No secrets in debug logs
- [ ] Secure memory handling
- [ ] Proper file permissions
- [ ] Environment isolation

### auth_middleware.py Split Checklist
- [ ] Token validation intact
- [ ] Permission checks preserved
- [ ] Session handling secure
- [ ] Rate limiting functional

## Testing Protocol

1. **Before any change:** Run full security test suite
2. **After each split:** Re-run security tests
3. **Before merge:** Full regression test
4. **Post-merge:** Monitor for anomalies (24h)

## Next Steps

After Phase 3:
- Phase 4: Legacy Scripts Cleanup
- Focus on `scripts/legacy/` deprecation decisions
