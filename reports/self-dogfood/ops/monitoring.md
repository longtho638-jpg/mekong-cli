# Mekong CLI v5.0 — Monitoring Configuration Report

**Date:** 2026-03-11
**Auditor:** OpenClaw self-dogfood ops pass
**Scope:** All observable system surfaces — CLI, PEV engine, LLM routing, MCU billing, gateway

---

## Overview

Mekong CLI ships with a multi-layer observability stack built natively into the Python
codebase. As of v5.0.0, the following subsystems are implemented and importable:

| Subsystem | Module | Status |
|-----------|--------|--------|
| Health endpoint | `src/core/health_endpoint.py` | implemented, port 9192 |
| Telemetry collector | `src/core/telemetry_collector.py` | implemented, opt-in |
| Anomaly detector | `src/core/anomaly_detector.py` | implemented, Z-score |
| Usage metering | `src/core/usage_metering.py` | implemented |
| Alert router | `src/core/alert_router.py` | implemented, Telegram |
| Crash detector | `src/core/crash_detector.py` | implemented |
| Auto recovery | `src/core/auto_recovery.py` | implemented, exp. backoff |
| License monitor | `src/core/license_monitor.py` | implemented |

**External monitoring (Sentry):** NOT configured — no `sentry_sdk` import found in
`src/`. Sentry setup docs exist (`docs/MONITORING_SETUP.md`) but SDK is not wired
into the CLI codebase. This is a gap for production error tracking.

**Grafana/Prometheus:** Documented in `docs/GRAFANA_DASHBOARD.md` but backend
metrics endpoint (`/metrics`) is not confirmed implemented in `src/`. Out of scope
for CLI-mode operation; relevant only when running as an API server.

---

## 1. CLI Startup Time

**What to measure:** Wall-clock time from `mekong <cmd>` invocation to first output.

**Current state:** No explicit startup timer in `src/main.py`. The file imports 12+
submodules at the top level (`register_all_commands`, `register_legacy_commands`,
`register_core_commands`, etc.). Python module load time on cold start is estimated
at 1–3s on an M1 Mac based on the `health_endpoint` import test (1.2s for that
module alone).

**How to instrument:**

Add to `src/main.py` at the top of the file:
```python
import time
_CLI_START = time.perf_counter()
```

Add to first command callback before Rich output:
```python
import logging
logger = logging.getLogger("mekong.startup")
logger.debug("startup_time_ms=%.0f", (time.perf_counter() - _CLI_START) * 1000)
```

**Target:** < 500ms cold start. If over 1s, lazy-import the 12 command registration
modules (only load on first use, not at process start).

**Structured log field:** `startup_time_ms`

**Alert threshold:** > 2000ms startup = degrade warning (slow machine or disk issue)

---

## 2. Command Execution Latency

**What to measure:** Time from command invocation to PEV cycle completion.

**Current state:** `src/core/executor.py` imports `time` and tracks duration inside
`CrashEvent.duration_ms` when a crash occurs. No general-case latency tracking
exists for successful executions.

**How to instrument:**

In `src/core/orchestrator.py` `orchestrate()` method, wrap the PEV loop:
```python
import time
t0 = time.perf_counter()
result = await self._run_pev(recipe)
elapsed_ms = (time.perf_counter() - t0) * 1000
logger.info(
    "command_executed",
    extra={
        "command": recipe.name,
        "duration_ms": round(elapsed_ms),
        "status": result.status,
        "mcu_cost": result.mcu_cost,
    }
)
```

**Target SLOs:**
| Command complexity | p50 | p95 | p99 |
|-------------------|-----|-----|-----|
| simple (1 MCU) | < 2s | < 5s | < 10s |
| standard (3 MCU) | < 10s | < 30s | < 60s |
| complex (5 MCU) | < 30s | < 120s | < 300s |

**Structured log field:** `duration_ms`, `command`, `mcu_cost`, `status`

---

## 3. LLM API Response Times

**What to measure:** Per-provider latency for each LLM call, and failover frequency.

**Current state:** `src/core/llm_client.py` implements circuit breaker with
`ProviderHealth` tracking `failures` count and `last_failure` timestamp. The 15s
cooldown period is tracked but latency per call is not logged.

**How to instrument:**

In `LLMClient.complete()` (or equivalent), wrap provider call:
```python
t0 = time.perf_counter()
try:
    response = provider.complete(prompt, **kwargs)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info(
        "llm_call",
        extra={
            "provider": provider.__class__.__name__,
            "model": provider.model,
            "duration_ms": round(elapsed_ms),
            "tokens_in": response.usage.prompt_tokens,
            "tokens_out": response.usage.completion_tokens,
            "status": "ok",
        }
    )
except Exception as e:
    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.warning("llm_call_failed",
        extra={"provider": provider.__class__.__name__,
               "duration_ms": round(elapsed_ms), "error": str(e)})
    raise
```

**Anomaly detection integration:** `UsageMetering` already tracks `LLM_CALLS` and
`TOKEN_USAGE` via `AnomalyCategory.LLM_CALLS` / `AnomalyCategory.TOKEN_USAGE`.
The Z-score detector fires on > 3σ spikes vs 7-day rolling baseline. Wire latency
as an additional metric to `UsageMetering.record(AnomalyCategory.LLM_CALLS,
"latency_ms", elapsed_ms)`.

**Alert:** Circuit breaker fires after 3 consecutive failures → `EventType.HEALTH_CRITICAL`
→ `AlertRouter` → Telegram (`TELEGRAM_BOT_TOKEN` env var). This path is already wired.

**Target SLOs:**
| Provider | p50 | p95 | circuit-break threshold |
|----------|-----|-----|------------------------|
| Qwen/DashScope | < 3s | < 8s | 3 failures / 15s cooldown |
| DeepSeek | < 2s | < 6s | same |
| OpenRouter | < 4s | < 12s | same |
| Ollama (local) | < 1s | < 3s | same |

---

## 4. MCU Billing Accuracy

**What to measure:** Correctness of credit deduction per task complexity tier, and
ledger consistency across concurrent requests.

**Current state:** `src/core/mcu_gate.py` uses SQLite with atomic transactions
(check → lock → confirm → refund). `src/core/mcu_billing.py` defines:
- `simple` = 1 MCU
- `standard` = 3 MCU
- `complex` = 5 MCU

Low balance threshold = 10 MCU triggers warning event.

**What to monitor:**

1. **Deduction accuracy:** After each confirmed mission, assert
   `balance_before - mcu_cost == balance_after`. The MCU gate records this in
   `mcu_ledger` SQLite table. A periodic reconciliation job should scan for
   `amount + balance_after != previous_balance_after` rows.

2. **Lock leak detection:** `mcu_gate.py` creates lock rows in SQLite. If a mission
   crashes between `lock` and `confirm`, the lock row stays open. Monitor count of
   open locks older than 5 minutes:
   ```sql
   SELECT count(*) FROM mcu_ledger
   WHERE transaction_type = 'lock' AND created_at < datetime('now', '-5 minutes');
   ```
   Alert if count > 0.

3. **Zero-balance HTTP 402 rate:** Track `402` response rate from gateway. Sudden
   spike = MCU depletion issue or billing webhook failure.

4. **Polar.sh webhook receipt:** Each successful payment should add credits within
   30s of webhook delivery. Monitor time-delta between Polar webhook timestamp and
   credit ledger `created_at`. Alert if > 60s.

**Structured log fields:** `mcu_locked`, `mcu_charged`, `mcu_refunded`,
`tenant_id`, `balance_after`, `mission_id`

**Alert thresholds:**
| Metric | Warning | Critical |
|--------|---------|----------|
| Open locks > 5min | 1 | 5 |
| HTTP 402 rate | > 5% req/min | > 20% req/min |
| Webhook-to-credit latency | > 30s | > 120s |
| Reconciliation mismatch | 1 row | any |

---

## 5. Gateway Uptime

**What to measure:** Availability of `GET /health` endpoint on port 9192.

**Current state:** `health_endpoint.py` runs a FastAPI app on port 9192 in a
daemon thread. Returns:
```json
{
  "status": "healthy|degraded|unhealthy",
  "components": { "<name>": { "status": "ok|warn|error", "message": "" } },
  "timestamp": "<iso8601>",
  "uptime": <seconds>,
  "version": "<semver>"
}
```

Components are registered via `register_component_check(name, check_fn)`. Currently
wired in `src/core/orchestrator.py` via `start_health_server()`.

**Uptime monitoring setup (UptimeRobot, free tier):**
```
Monitor type:    HTTP(S)
URL:             http://127.0.0.1:9192/health  (local)
                 https://api.agencyos.network/health (production)
Method:          GET
Interval:        1 minute
Keyword check:   "healthy"
Alert contacts:  ops@agencyos.network, Telegram bot
```

For cloud deployments (Fly.io as per `fly.toml`), the health check config should be:
```toml
# fly.toml (already present)
[[services.ports]]
  port = 9192
  handlers = ["http"]

[services.concurrency]
  type = "connections"
  hard_limit = 25
  soft_limit = 20
```

**Critical events that trigger alert → Telegram:**
| Event | Severity | AlertRouter path |
|-------|----------|-----------------|
| `HEALTH_CRITICAL` | critical | EventBus → AlertRouter._send() → Telegram |
| `LICENSE_CRITICAL` | critical | same |
| `HALT_TRIGGERED` | critical | same |
| `GOVERNANCE_BLOCKED` | critical | same |

AlertRouter dedup window: 10 minutes (ignores duplicate alerts within window).
Throttle: max 10 alerts/hour per severity.

---

## 6. Logging Configuration

**Current state:** All `src/core/*.py` modules use `logging.getLogger(__name__)`.
No root logger configuration found in `src/main.py`. This means log level defaults
to `WARNING` unless the caller configures it.

**Recommended configuration for structured JSON logging:**

Add to `src/main.py` before command registration:
```python
import logging
import json
import sys

class JSONFormatter(logging.Formatter):
    def format(self, record):
        obj = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        # Merge extra fields (duration_ms, command, etc.)
        for k, v in record.__dict__.items():
            if k not in ("msg", "args", "levelname", "name", "created",
                         "filename", "funcName", "levelno", "lineno",
                         "module", "msecs", "pathname", "process",
                         "processName", "relativeCreated", "stack_info",
                         "thread", "threadName", "exc_info", "exc_text"):
                obj[k] = v
        return json.dumps(obj, default=str)

handler = logging.StreamHandler(sys.stderr)
handler.setFormatter(JSONFormatter())
logging.root.addHandler(handler)
logging.root.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())
```

**Log level env var:** `LOG_LEVEL=DEBUG|INFO|WARNING|ERROR`

**Key log fields to emit consistently:**
| Field | Type | Source |
|-------|------|--------|
| `command` | str | orchestrator |
| `duration_ms` | int | orchestrator, executor |
| `mcu_cost` | int | mcu_billing |
| `tenant_id` | str | mcu_gate |
| `provider` | str | llm_client |
| `model` | str | llm_client |
| `tokens_in` | int | llm_client |
| `tokens_out` | int | llm_client |
| `status` | str | all |
| `error` | str | all (on failure) |

---

## 7. Error Tracking — Sentry Gap

**Finding:** Sentry SDK is not installed or imported in `src/`. The
`docs/MONITORING_SETUP.md` recommends `sentry-sdk[fastapi]>=1.40.0` and provides
full setup instructions, but this is not reflected in `pyproject.toml` or any
import in the codebase.

**Impact:** Unhandled exceptions in CLI commands produce Rich tracebacks on stderr
but are not captured in an error aggregator. In production multi-tenant deployments,
silent errors will go undetected.

**Recommended fix:**

1. Add to `pyproject.toml`:
```toml
sentry-sdk = {version = ">=1.40.0", extras = ["fastapi"], optional = true}
```

2. Add to `src/main.py`:
```python
import sentry_sdk
dsn = os.getenv("SENTRY_DSN")
if dsn:
    sentry_sdk.init(
        dsn=dsn,
        traces_sample_rate=0.1,
        environment=os.getenv("ENV", "development"),
        release=f"mekong-cli@{__version__}",
    )
```

3. Set env var: `SENTRY_DSN=https://...@sentry.io/...`

This makes Sentry opt-in (no DSN = no tracking), preserving local dev ergonomics.

---

## 8. Anomaly Detector — Active Metrics

`UsageAnomalyDetector` monitors 5 categories with 7-day rolling Z-score baselines:

| Category | Metric key | Anomaly types |
|----------|-----------|--------------|
| `api_calls` | request count | SPIKE, DROP |
| `agent_spawns` | spawn count | SPIKE |
| `model_usage` | model switch rate | PATTERN_BREAK |
| `llm_calls` | call count | SPIKE, DROP |
| `token_usage` | tokens/session | SPIKE |

Threshold: > 3σ from rolling mean triggers `AnomalyType.SPIKE` or `DROP`.
Pattern break: detected when usage profile shifts across two consecutive 3.5-day
windows.

**Integration path:** `UsageMetering` → records `UsageEvent` → feeds
`UsageAnomalyDetector.record_value()` → if anomaly: publishes to `EventBus`
→ `AlertRouter` → Telegram.

**Currently missing:** latency metrics not fed into anomaly detector. Add
`llm_latency_ms` and `command_duration_ms` as custom metrics.

---

## 9. Action Items

| Priority | Item | File | Effort |
|----------|------|------|--------|
| HIGH | Add startup timer to `src/main.py` | `src/main.py` | 10 min |
| HIGH | Add JSON structured logging root config | `src/main.py` | 20 min |
| HIGH | Install and init Sentry SDK (opt-in) | `pyproject.toml`, `src/main.py` | 30 min |
| HIGH | Add command latency logging to orchestrator | `src/core/orchestrator.py` | 20 min |
| MEDIUM | Add LLM per-call latency logging | `src/core/llm_client.py` | 20 min |
| MEDIUM | Add MCU lock-leak detection query to health check | `src/core/mcu_gate.py` | 30 min |
| MEDIUM | Feed latency metrics into `UsageMetering` | `src/core/usage_metering.py` | 20 min |
| LOW | Set up UptimeRobot on production `/health` | external | 10 min |
| LOW | Add `make logs` target for structured log tail | `Makefile` | 5 min |

---

*Report generated: 2026-03-11 | Mekong CLI v5.0.0 self-dogfood*
