# Tech Debt Inventory — Mekong CLI v5.0
**Date:** 2026-03-11 | **Scope:** src/ directory

---

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| Oversized files (>200 lines) | 15 | High |
| Silent exception blocks | 16 | Medium |
| Debug comments | 1 | Low |
| Deprecated API usage | 0 | — |
| Type safety violations | 0 | — |
| TODO/FIXME in logic | 0 | — |

---

## 1. Oversized Files (>200 lines)

Files violating the 200-line rule (sorted by size):

| File | Lines | Priority | Action |
|------|-------|----------|--------|
| `src/main.py` | 1898 | **CRITICAL** | Split into src/cli/ submodules |
| `src/core/orchestrator.py` | 1022 | High | Extract DAG resolver + step runner |
| `src/raas/sync_client.py` | 932 | High | Split sync/async client logic |
| `src/core/raas_auth.py` | 903 | High | Extract token + tenant handlers |
| `src/lib/raas_gate.py` | 881 | High | Split validation + enforcement |
| `src/core/auto_recovery.py` | 807 | Medium | Extract strategies |
| `src/lib/usage_metering_service.py` | 754 | Medium | Extract metering vs reporting |
| `src/core/telegram_bot.py` | 752 | Medium | Extract handlers |
| `src/commands/raas_maintenance_commands.py` | 743 | Medium | Split by domain |
| `src/cli/billing_commands.py` | 725 | Medium | Split by billing operation |
| `src/jobs/nightly_reconciliation.py` | 718 | Medium | Extract reconciler steps |
| `src/raas/billing_sync.py` | 699 | Medium | Extract sync/diff logic |
| `src/raas/sdk.py` | 675 | Medium | Split client vs models |
| `src/core/planner.py` | 659 | Medium | Extract template library |
| `src/core/command_authorizer.py` | 648 | Medium | Extract rule evaluator |

**Total lines in oversized files:** ~12,016 lines

---

## 2. Silent Exception Blocks

16 `except Exception:` blocks in `src/main.py` (lines ~440–548, `_show_agi_dashboard()`):

```python
# Pattern repeated 9+ times:
try:
    from src.core.nlu import IntentClassifier
    ...
except Exception:
    panels.append("[bold]📡 NLU:[/bold] [dim]skipped[/dim]")
```

**Assessment:** Intentional — AGI dashboard uses graceful degradation for optional subsystems. Acceptable pattern here, but `except Exception: pass` (bare pass) should be replaced with at least a `log.debug()` call for observability.

**Action:** Add `log.debug("subsystem unavailable: %s", e)` in each block.

---

## 3. Debug Comments

```
src/main.py:186  # raise e # Uncomment for debugging
```

**Action:** Remove before next production release.

---

## 4. Low Test Coverage

| Module | Coverage |
|--------|----------|
| `src/lib/raas_task_client.py` | 0% |
| `src/lib/rate_limiter_factory.py` | 0% |
| `src/lib/tier_rate_limit_middleware.py` | 0% |
| `src/lib/usage_metering_service.py` | 0% |
| `src/middleware/auth_middleware.py` | 0% |
| `src/security/attestation_generator.py` | 0% |
| `src/services/license_enforcement.py` | 0% (in `__init__`), 32% overall |
| Overall `TOTAL` | 19–26% |

Critical paths with 0% coverage include rate limiting, auth middleware, and usage metering — all security-sensitive modules.

---

## 5. Deprecated API Usage

**None found.** No `DeprecationWarning` imports, no pinned-old-version patterns detected.

---

## 6. Prioritized Action Plan

### Immediate (Sprint 1)
1. Refactor `src/main.py` → split into `src/cli/` submodules (in progress)
2. Remove debug comment at line 186

### Short-term (Sprint 2)
3. Split `src/core/orchestrator.py` — extract DAG resolver
4. Add `log.debug` to 16 silent exception blocks
5. Write tests for `src/middleware/auth_middleware.py` (security-critical, 0% coverage)
6. Write tests for `src/lib/rate_limiter_factory.py` (security-critical, 0% coverage)

### Medium-term (Sprint 3+)
7. Split remaining 13 oversized files
8. Bring overall coverage from 19% → 60%
9. Enable ruff `B` (bugbear) and `C4` (comprehensions) ruleset
