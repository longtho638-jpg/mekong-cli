# Coverage Report — Mekong CLI v5.0
**Date:** 2026-03-11 | **Source:** pytest-cov output from full test run

---

## Overall

| Metric | Value |
|--------|-------|
| Total statements | 26,058 |
| Covered statements | ~6,776 (26%) |
| Missing statements | ~19,282 (74%) |
| Overall coverage | **19–26%** |

Note: coverage varies between focused and full runs. Full run (`tests/`) reports 26%; core+cli subset reports 19% (fewer fixtures loaded).

---

## By Module (Selected — from real pytest-cov output)

### High Coverage (>80%)
| Module | Coverage | Notes |
|--------|----------|-------|
| `src/lib/quota_error_messages.py` | 93% | 7 lines uncovered |
| `src/models/user.py` | 67% | Basic model tested |
| `src/core/command_sanitizer.py` | 37% | Partial path coverage |

### Medium Coverage (20–60%)
| Module | Coverage | Notes |
|--------|----------|-------|
| `src/services/license_enforcement.py` | 32% | Happy path only |
| `src/lib/usage_meter.py` | 28% | Basic meter tested |
| `src/usage/decorators.py` | 28% | Entry points only |
| `src/security/command_sanitizer.py` | 37% | Core paths |
| `src/telemetry/rate_limit_metrics.py` | 37% | Metric recording tested |

### Zero Coverage (0%) — Critical Gaps
| Module | Lines | Risk |
|--------|-------|------|
| `src/lib/raas_task_client.py` | 156 | HIGH — RaaS client |
| `src/lib/rate_limiter_factory.py` | 92 | HIGH — rate limiting |
| `src/lib/tier_rate_limit_middleware.py` | 145 | HIGH — rate limiting |
| `src/lib/usage_metering_service.py` | 221 | HIGH — billing |
| `src/middleware/auth_middleware.py` | 71 | CRITICAL — auth |
| `src/security/attestation_generator.py` | 123 | HIGH — security |
| `src/services/license_enforcement.py` (__init__) | 2 | LOW |
| `src/telemetry/rate_limit_metrics.py` (__init__) | 2 | LOW |
| `src/usage/usage_tracker.py` | 102 | HIGH — billing |

---

## Coverage by Layer

```
Layer                    Est. Coverage   Risk
─────────────────────────────────────────────
src/core/ (PEV engine)       45-60%     Medium
src/cli/ (commands)          50-55%     Medium
src/agents/                  40-50%     Low
src/lib/ (infra)              5-15%     HIGH
src/middleware/                  0%     CRITICAL
src/security/                 15%      HIGH
src/raas/ (billing)           20%      HIGH
src/services/                 32%      High
src/jobs/                     10%      Medium
src/telemetry/                37%      Medium
```

---

## Test Count by Area

From `tests/` directory analysis (206 test files, 3,639 tests):

| Area | Approx Tests |
|------|-------------|
| Core PEV engine | ~800 |
| CLI commands | ~600 |
| RaaS + billing | ~400 |
| Agents | ~300 |
| Integration | ~500 |
| E2E | ~200 |
| Regression | ~400 |
| Benchmarks | ~200 (skipped) |

---

## Priority Coverage Targets

### Sprint 1 (Critical Security)
- `src/middleware/auth_middleware.py` → 0% → target 80%
- `src/lib/rate_limiter_factory.py` → 0% → target 70%
- `src/lib/tier_rate_limit_middleware.py` → 0% → target 70%

### Sprint 2 (Billing Integrity)
- `src/lib/raas_task_client.py` → 0% → target 60%
- `src/usage/usage_tracker.py` → 0% → target 60%
- `src/lib/usage_metering_service.py` → 0% → target 50%

### Sprint 3 (Coverage Floor)
- Overall target: 60% (from current 26%)
- Estimated tests to add: ~800 new tests

---

## How to Run Coverage

```bash
# Full coverage report
cd /Users/macbookprom1/mekong-cli
python3 -m pytest tests/ --cov=src --cov-report=term-missing --cov-report=html

# Focused (fast, 20s)
python3 -m pytest tests/core/ tests/cli/ --cov=src/core --cov=src/cli --cov-report=term-missing

# HTML report
open htmlcov/index.html
```
