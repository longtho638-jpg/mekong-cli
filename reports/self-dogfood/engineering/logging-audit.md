# Engineering: Logging Audit — Mekong CLI v5.0

## Command: /audit
## Date: 2026-03-11

---

## Analysis Scope
- `logging.getLogger` usage in src/core/ — 113 occurrences across 95+ files
- `print()` (non-console) usage in src/core/ — 25 occurrences
- structlog declared in pyproject.toml but standard logging used everywhere

---

## Logger Setup Pattern

Standard pattern across all reviewed files:
```python
import logging
logger = logging.getLogger(__name__)
```

This is Python best practice. `__name__` ensures hierarchical logger naming:
- `src.core.orchestrator`
- `src.core.executor`
- `src.gateway`

No custom handlers or formatters configured at module level — logging config
expected from application entry point (src/main.py or uvicorn startup).

---

## structlog Declared But Not Used

pyproject.toml includes:
```
structlog = "^24.1.0"
```

But all 113 logging calls use standard `logging.getLogger()`.
structlog provides structured JSON logging (machine-parseable) vs standard logging
(human-readable text).

**Issue:** structlog is an unused production dependency. Either:
1. Implement structlog throughout (recommended for production API)
2. Remove from pyproject.toml to reduce dependency footprint

---

## Log Level Usage Analysis

From reviewed files (orchestrator.py, executor.py, planner.py, gateway.py):

| Level | Count | Usage |
|-------|-------|-------|
| logger.info() | ~15 | Mission created, hybrid router queued, step completion |
| logger.warning() | ~12 | Self-healing failed, retries, partial failures |
| logger.error() | ~8 | Hybrid router failure, critical errors |
| logger.exception() | ~2 | Planner LLM decomposition failure |
| logger.debug() | ~1 | Minimal debug logging |

Observations:
- Good distribution across levels
- `logger.exception()` is used correctly (captures stack trace)
- Very few `debug` level logs — makes troubleshooting harder

---

## print() Usage in Core (25 occurrences)

The 25 `print()` calls in src/core/ are concerning:
- `print()` bypasses the logging framework entirely
- Not filterable by log level
- Goes to stdout, mixing with structured output
- Not captured by log aggregation systems

Most of these are likely in test helpers or debug code that wasn't cleaned up.

**Examples of problematic patterns:**
```python
# any print() in production code path is a violation
print(f"Debug: {some_var}")  # should be logger.debug()
print("Step complete")        # should be logger.info()
```

Note: `console.print()` (Rich) is different from `print()` and is intentional for CLI output.
The 25 `print()` calls appear to be bare Python `print()` — not Rich console calls.

---

## Gateway Logging

gateway.py uses logger correctly:
```python
logger.info(
    "Mission %s created for tenant %s (hybrid router queued)",
    mission_id,
    request.tenant_id,
)
logger.error("Hybrid router failed for mission %s: %s", mission_id, e)
```

Uses `%s` format string (deferred interpolation) — correct for performance.
Format strings are safe from injection (no f-strings in logger calls).

---

## Missing: Request ID Correlation

HTTP gateway does not add request ID to log context.
All log lines for the same mission use `mission_id` but there's no request-scoped
correlation ID that flows across all log statements in a single HTTP request.

Without correlation IDs, tracing a single mission's full execution across log lines
requires grepping for mission_id — feasible but not structured.

**Recommendation:** Add `X-Request-ID` header injection and include in all log calls
via contextvars or structlog's context binding.

---

## Missing: Log Configuration in main.py

No explicit logging configuration found in reviewed startup paths.
Default Python logging sends WARNING+ to stderr with no timestamps or structure.
Production deployments need:
```python
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
```

---

## Recommendations

1. **Remove or activate structlog:** Either remove from pyproject.toml (save 1 dep) OR
   implement structured JSON logging throughout (better for production)
2. **Eliminate 25 `print()` calls:** Replace with `logger.debug()`/`logger.info()`
3. **Add request correlation ID:** X-Request-ID header → contextvars → all log statements
4. **Configure logging in main.py:** Add basicConfig with timestamps and level
5. **Add more debug logging:** Orchestrator step transitions, planner step generation,
   executor command execution — currently sparse at DEBUG level
6. **Log aggregation setup:** Document log shipping to Loki/CloudWatch/Logtail in deployment guide

---

## Summary
Logging foundation is solid (getLogger(__name__) everywhere) but structlog declared and unused,
25 raw print() calls in core/, no request correlation IDs, and no configured log format at startup.
Production-grade logging requires resolving the structlog question and adding request tracing.
