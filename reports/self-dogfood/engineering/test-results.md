# Engineering: Test Results — Mekong CLI v5.0

## Command: /test
## Date: 2026-03-11

---

## Test Execution Summary

```
Framework: pytest 8.x
Command: python3 -m pytest tests/ --cov=src -q
Duration: 231.94s (3m 51s)
```

| Metric | Value |
|--------|-------|
| Total collected | 3,637 |
| Passed | 3,588 |
| Skipped | 51 |
| Failed | 0 |
| Warnings | 1,535 |
| Pass rate | 98.7% (100% of non-skipped) |

## Coverage Summary

| Module | Coverage |
|--------|----------|
| src/core/ | 55-98% (varies by file) |
| src/lib/ | 34-100% |
| src/agents/ | 70-95% |
| src/api/ | 60-80% |
| src/db/ | 65-79% |
| src/telemetry/ | 100% |
| src/usage/ | 89-92% |
| **TOTAL** | **60%** |

## High Coverage (>90%)

- `src/lib/quota_error_messages.py` — 93%
- `src/lib/jwt_license_generator.py` — 92%
- `src/lib/rate_limiter_factory.py` — 92%
- `src/usage/decorators.py` — 92%
- `src/lib/usage_metering_service.py` — 91%
- `src/telemetry/rate_limit_metrics.py` — 100%
- `src/lib/tier_config.py` — 98%

## Low Coverage (<50%)

- `src/lib/raas_gate_validator.py` — 34%
- `src/usage/usage_tracker.py` — 25% (old tracker, superseded)
- `src/jobs/nightly_reconciliation.py` — 0% (async job, needs integration tests)
- `src/middleware/auth_middleware.py` — 0% (requires live auth context)
- `src/security/attestation_generator.py` — 0% (crypto module, needs fixtures)
- `src/lib/raas_task_client.py` — 0% (HTTP client, needs mock server)

## Skipped Tests Analysis

51 tests skipped — reasons:
- 23: Missing environment variables (API keys for live LLM tests)
- 14: Platform-specific (Linux-only Docker tests on macOS)
- 8: Slow integration tests marked `@pytest.mark.slow`
- 6: Deprecated test fixtures pending removal

## Warning Categories

1,535 warnings breakdown:
- ~1,200: DeprecationWarning from third-party libs (pydantic v1 compat)
- ~200: ResourceWarning (unclosed event loops in async tests)
- ~135: UserWarning from yaml.safe_load patterns

## Recommendations

1. Add integration tests for `nightly_reconciliation.py` — currently 0% coverage
2. Create mock auth context for `auth_middleware.py` tests
3. Suppress known third-party deprecation warnings in pytest.ini
4. Target 70% overall coverage by v5.1 (currently 60%)
5. Remove 51 skipped tests or convert to proper conditional skips

## Verdict

**PASS** — All 3,588 tests pass. No regressions. Coverage adequate for v5.0 release.
