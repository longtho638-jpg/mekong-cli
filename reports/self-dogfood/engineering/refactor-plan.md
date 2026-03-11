# Refactor Plan — Files >200 Lines
Generated: 2026-03-11

## Command Run
```bash
find src -name "*.py" -exec wc -l {} \; | sort -rn | head -20
```

## Top 10 Files Requiring Refactor

| Rank | File | Lines | Split Strategy |
|------|------|-------|----------------|
| 1 | `src/core/orchestrator.py` | 1022 | Split: planner, executor, verifier, rollback modules |
| 2 | `src/raas/sync_client.py` | 932 | Split: auth_sync, billing_sync, task_sync |
| 3 | `src/core/raas_auth.py` | 903 | Split: jwt_validator, api_key_validator, tenant_resolver |
| 4 | `src/lib/raas_gate.py` | 881 | Split: quota_gate, rate_gate, license_gate |
| 5 | `src/core/auto_recovery.py` | 807 | Split: health_checker, recovery_strategies, watchdog |
| 6 | `src/lib/usage_metering_service.py` | 754 | Split: metering_core, billing_calculator, event_emitter |
| 7 | `src/core/telegram_bot.py` | 752 | Split: bot_handlers, bot_commands, bot_notifications |
| 8 | `src/commands/raas_maintenance_commands.py` | 743 | Split by command group (billing, tenant, health) |
| 9 | `src/cli/billing_commands.py` | 725 | Split: billing_read_commands, billing_write_commands |
| 10 | `src/jobs/nightly_reconciliation.py` | 718 | Split: reconciler, report_generator, alert_handler |

**Total:** 8,237 lines in top 10 files alone
**Total src LOC:** 108,476 across 408 Python files

---

## Priority Order

### P0 — Core engine (most touched, most risk)
1. `orchestrator.py` (1022) — already has planner/executor/verifier as separate files, but orchestrator itself still monolithic
   - Extract `_run_dag()` → `src/core/dag_runner.py`
   - Extract `_rollback()` → `src/core/rollback_manager.py`
   - Target: orchestrator.py ≤ 200 lines (coordination only)

### P1 — Auth/gate layer (security-critical)
2. `raas_auth.py` (903) → `src/core/auth/`
   - `jwt_validator.py` — JWT decode/verify
   - `api_key_validator.py` — mk_ prefix keys
   - `tenant_resolver.py` — DB lookup + caching
3. `raas_gate.py` (881) → `src/lib/gates/`
   - `quota_gate.py`
   - `rate_gate.py`
   - `license_gate.py`

### P2 — RaaS sync (complex but isolated)
4. `sync_client.py` (932) → `src/raas/sync/`
   - `auth_sync.py`
   - `task_sync.py`
   - `billing_sync.py`

### P3 — Background jobs
5. `nightly_reconciliation.py` (718) → `src/jobs/`
   - `reconciler_core.py`
   - `reconciler_reporter.py`

---

## Already Refactored
- `src/main.py`: 1898 → 75 lines (complete)
- `src/core/planner.py`, `executor.py`, `verifier.py` extracted from original orchestrator

---

## Effort Estimate

| Phase | Files | Estimated Days |
|-------|-------|----------------|
| P0 orchestrator | 1 | 1 day |
| P1 auth/gate | 2 | 2 days |
| P2 raas sync | 1 | 1 day |
| P3 jobs | 1 | 0.5 day |
| Total | 5 | ~4.5 days |

## Success Criteria
- All src/ files ≤ 200 lines
- All existing tests still pass
- No new `any` types introduced
