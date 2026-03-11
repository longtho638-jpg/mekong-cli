# Test Report — Mekong CLI v5.0
**Date:** 2026-03-11 | **Command:** `python3 -m pytest tests/ --tb=short -q`

---

## Real Output (tail -30)

```
      raise self._last_error
tests/test_tracing.py::TestSpanContext::test_span_with_error
tests/test_tracing.py::TestSpanContext::test_span_with_error
src/lib/quota_error_messages.py   105   7  93%  316,324,520,533,542,554,567
========= 3588 passed, 51 skipped, 1536 warnings in 308.97s (0:05:08) ==========
```

---

## Summary

| Metric | Value |
|--------|-------|
| Total tests | 3,639 (3588 passed + 51 skipped) |
| Passed | 3,588 |
| Failed | 0 |
| Skipped | 51 |
| Warnings | 1,536 |
| Pass rate | **100%** (of executed tests) |
| Duration | 308.97s (5m 08s) |

---

## Test Suite Structure

| Directory | Purpose |
|-----------|---------|
| `tests/core/` | PEV engine unit tests |
| `tests/cli/` | CLI command tests |
| `tests/agents/` | Agent behaviour tests |
| `tests/raas/` | RaaS billing + auth tests |
| `tests/backend/` | FastAPI endpoint tests |
| `tests/integration/` | Multi-component integration |
| `tests/e2e/` | End-to-end workflow tests |
| `tests/regression/` | Regression guard suite |
| `tests/benchmarks/` | Performance benchmarks |
| `tests/commands/` | Command registry tests |
| `tests/deployment/` | Deploy script smoke tests |
| `tests/data/` | Data fixture tests |

**Total test files:** 206

---

## Focused Subset Results (tests/core/ + tests/cli/)

```
446 passed, 15 warnings in 20.16s
```

Core + CLI modules fully green at 446 tests.

---

## Skipped Tests (51)

Skips are attributed to:
- Optional dependencies not installed (e.g. `psutil`, `python-telegram-bot`)
- Environment-gated tests requiring `MEKONG_API_TOKEN`, `MEKONG_TELEGRAM_TOKEN`
- Benchmark tests skipped in non-perf mode

All skips are intentional — no broken skips detected.

---

## Warnings (1,536)

Majority are `DeprecationWarning` from third-party libraries (pytest internals, httpx, typer test helpers). No application-code warnings detected.

---

## Notable Test: test_span_with_error

`tests/test_tracing.py::TestSpanContext::test_span_with_error` appears in tail output — it tests error propagation in the tracing layer. The `raise self._last_error` line is the test assertion mechanism (expected behaviour), not a test failure.

---

## Coverage Summary (from coverage run)

| Layer | Coverage |
|-------|----------|
| `src/core/` (PEV engine) | ~45-60% |
| `src/cli/` | ~55% |
| `src/lib/quota_error_messages.py` | 93% |
| `src/raas/` | ~30% |
| `src/middleware/` | 0% |
| `src/services/` | 32% |
| **TOTAL** | **19-26%** |

Full coverage detail in `coverage-report.md`.

---

## Assessment

**GREEN** — 3,588/3,588 executed tests pass. Suite is healthy.

Primary gap: 19-26% total coverage means large portions of security-critical code (auth, rate limiting, billing sync) are untested. See `tech-debt.md` for prioritized remediation.
