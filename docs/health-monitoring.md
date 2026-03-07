# Health Monitoring System

> **Emergency Operations Guide** — Phase 1-5 Health Monitoring + Alerting + Recovery

---

## Overview

The Mekong CLI Health Monitoring System provides comprehensive real-time monitoring, alerting, and automated recovery capabilities across five相 (phases):

| Phase | Component | Purpose |
|-------|-----------|---------|
| 1 | Health Endpoint + Crash Detection | HTTP health check + crash event tracking |
| 2 | License Failure Monitoring | License validation failure tracking with threshold alerting |
| 3 | Usage Anomaly Detection | Statistical anomaly detection using Z-score analysis |
| 4 | Alert Routing + Telegram | Centralized alert routing with deduplication and throttling |
| 5 | Auto-Recovery Actions | Automated recovery with exponential backoff |

---

## Quick Start

### Check System Health

```bash
# Check health endpoint (default: http://127.0.0.1:9192/health)
curl -s http://127.0.0.1:9192/health | jq .
```

### View Recent Crashes

```bash
# Check crash history
cat .mekong/crashes/crash-*.json | jq .
```

### View License Failures

```bash
# Check license failure history
cat .mekong/license_failures.json | jq .
```

---

## Phase 1: Health Endpoint + Crash Detection

### Health Endpoint Server

The health endpoint provides a REST API for system status checks.

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Full health status with component checks |
| `/ready` | GET | Kubernetes-style readiness probe |
| `/live` | GET | Kubernetes-style liveness probe |

#### Health Response Schema

```json
{
  "status": "healthy|degraded|unhealthy",
  "components": {
    "license": {
      "status": "healthy|degraded|unhealthy",
      "message": "Optional status message",
      "latency_ms": 5.2
    }
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "3.0.0",
  "uptime_seconds": 3600.5
}
```

#### Component Status Values

| Status | Meaning |
|--------|---------|
| `healthy` | Component is functioning normally |
| `degraded` | Component has partial issues but operational |
| `unhealthy` | Component is not functioning |
| `unknown` | No health check registered |

### Crash Detection

The crash detector monitors CLI execution exit codes and triggers auto-recovery.

#### Features

- Real-time crash event emission
- Crash frequency tracking (crashes per hour)
- Crash history persistence to disk
- Auto-recovery triggering on crash detection

#### Crash Event Schema

```json
{
  "crash_id": "crash-1704067200000-12345",
  "timestamp": "2024-01-01T00:00:00Z",
  "exit_code": 1,
  "command": "python3 -m mekong cook",
  "stderr": "Error details...",
  "cwd": "/path/to/workdir",
  "duration_ms": 1523.5,
  "metadata": {}
}
```

### Usage

```python
from src.core.crash_detector import (
    get_crash_detector,
    reset_crash_detector,
)

# Get crash detector instance
detector = get_crash_detector(crashes_dir=".mekong/crashes")

# Record a crash
event = detector.record_crash(
    exit_code=1,
    command="python3 myapp.py",
    stderr="Traceback (most recent call last)...",
    cwd="/path/to/workdir",
    duration_ms=1523.5,
    metadata={"user_id": "123"},
)

# Get frequency stats
freq = detector.get_frequency()
print(f"Crashes per hour: {freq.crashes_per_hour}")
print(f"Crashes last hour: {freq.crashes_last_hour}")

# Get recent crashes
recent = detector.get_recent_crashes(limit=5)
for crash in recent:
    print(f"Crash: {crash.exit_code} - {crash.command}")

# Get summary
summary = detector.get_crash_summary()
print(summary)
```

---

## Phase 2: License Failure Monitoring

### License Failure Tracking

Tracks license validation failures with threshold alerting and grace period support.

#### Features

- Failure recording with metadata
- Threshold-based critical alerting (>3 failures in 5min)
- Grace period for new installations (24h)
- Failure history persistence

#### Threshold Configuration

Default threshold: **3 failures in 5 minutes** triggers critical alert.

```python
from src.core.license_monitor import FailureThreshold

threshold = FailureThreshold(
    max_failures=5,       # Alert after 5 failures
    window_seconds=600,   # 10 minutes
)
```

### Usage

```python
from src.core.license_monitor import (
    get_monitor,
    record_failure,
    FailureThreshold,
)

# Method 1: Using convenience function
record_failure(
    error_code="invalid_signature",
    key_id="key_123",
    command="mekong run",
    error_message="Invalid license signature",
    retry_count=1,
)

# Method 2: Using monitor instance
monitor = get_monitor(
    storage_path=".mekong/license_failures.json",
    threshold=FailureThreshold(max_failures=5),
)

monitor.record_failure(
    error_code="expired",
    key_id="key_456",
    command="mekong cook",
    error_message="License key expired",
    retry_count=2,
)

# Check critical status
if monitor.is_critical():
    # Handle critical license state
    print("License critical! Trigger recovery...")

# Get failure statistics
stats = monitor.get_statistics()
print(f"Total failures: {stats['total_failures']}")
print(f"Recent failures: {stats['recent_failures']}")
print(f"Is critical: {stats['is_critical']}")

# Grace period handling
if monitor.is_grace_period_active():
    remaining = monitor.get_grace_period_remaining()
    print(f"Grace period active: {remaining:.1f}s remaining")

# Clear failures after successful validation
monitor.clear_failures()
```

---

## Phase 3: Usage Anomaly Detection

### Statistical Anomaly Detection

Uses Z-score analysis to detect anomalies in usage metrics.

#### Anomaly Types

| Type | Description | Z-Score |
|------|-------------|---------|
| `spike` | Sudden increase | > 3.0 |
| `drop` | Sudden decrease | < -3.0 |
| `pattern_break` | Behavioral pattern change | | 3.0 |

#### Severity Levels

| Severity | Z-Score Range |
|----------|---------------|
| `low` | 3.0 - 3.5 |
| `medium` | 3.5 - 4.0 |
| `high` | 4.0 - 5.0 |
| `critical` | >= 5.0 |

### Usage

```python
from src.core.anomaly_detector import (
    get_detector,
    reset_detector,
    AnomalyCategory,
    AnomalyType,
)

# Get detector instance
detector = get_detector()

# Record metric values
detector.record_metric("api_calls", "requests", 100.0)
detector.record_metric("api_calls", "requests", 105.0)
detector.record_metric("api_calls", "requests", 98.0)

# Detect anomaly
anomaly = detector.detect_anomaly("api_calls", "requests", 5000.0)
if anomaly:
    print(f"Anomaly detected: {anomaly.anomaly_type.value}")
    print(f"Current: {anomaly.current_value}")
    print(f"Baseline: {anomaly.baseline_mean} ± {anomaly.baseline_std_dev}")
    print(f"Z-score: {anomaly.z_score}")
    print(f"Severity: {anomaly.severity}")

# Get baseline stats
baseline = detector.get_baseline("api_calls", "requests")
if baseline:
    print(f"Mean: {baseline.mean}")
    print(f"Std Dev: {baseline.std_dev}")
    print(f"Samples: {baseline.sample_count}")

# Get all baselines
all_baselines = detector.get_all_baselines()
for metric, stats in all_baselines.items():
    print(f"{metric}: {stats.mean} ± {stats.std_dev}")

# Reset specific baseline
detector.reset_baseline("api_calls", "requests")

# Reset all baselines
detector.reset_all_baselines()
```

### Metric Categories

| Category | Metric Examples |
|----------|-----------------|
| `api_calls` | requests, responses |
| `agent_spawns` | spawns, failures |
| `model_usage` | queries, tokens |
| `llm_calls` | calls, duration |
| `token_usage` | input_tokens, output_tokens |

---

## Phase 4: Alert Routing + Telegram Integration

### Alert Router Features

- **Deduplication**: 10-minute window prevents duplicate alerts
- **Throttling**: Max 10 alerts/hour (except critical)
- **Severity Routing**: Routes critical/warning/info differently
- **Telegram Integration**: Automatic Telegram message formatting

### Alert Configuration

```python
from src.core.alert_router import AlertConfig, AlertSeverity

config = AlertConfig(
    dedup_window=600,          # 10 minutes
    throttle_limit=10,         # Max 10 alerts/hour
    throttle_window=3600,      # 1 hour
    enabled_severities=[
        AlertSeverity.CRITICAL,
        AlertSeverity.WARNING,
        AlertSeverity.INFO,
    ],
)
```

### Usage

```python
from src.core.alert_router import (
    Alert,
    AlertConfig,
    AlertRouter,
    AlertSeverity,
    get_alert_router,
)

# Get router instance
router = get_alert_router()

# Create and route an alert
alert = Alert(
    severity=AlertSeverity.CRITICAL,
    title="Server Down",
    message="API server is not responding",
    source="health_endpoint",
    metadata={"host": "api.example.com", "port": 8080},
)

alert_id = router.route(alert)
if alert_id:
    print(f"Alert sent: {alert_id}")
else:
    print("Alert suppressed (dedup or throttle)")

# Get router statistics
stats = router.get_stats()
print(f"Dedup cache size: {stats['dedup_cache_size']}")
print(f"Alerts last hour: {stats['alerts_last_hour']}")
print(f"Throttle remaining: {stats['throttle_remaining']}")
```

### Telegram Message Format

```markdown
🚨 CRITICAL: Server Down

API server is not responding

_Source: health_endpoint_
_Time: 2024-01-01 00:00:00_
```

### Enabling Telegram Alerts

Set environment variables:

```bash
export TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN"
export TELEGRAM_OPS_CHANNEL_ID="@ops_channel"
```

---

## Phase 5: Auto-Recovery Actions

### Recovery Types

| Type | Description |
|------|-------------|
| `license:recovery` | License validation failure recovery |
| `crash:recovery` | Process crash recovery |
| `health:endpoint_recovery` | Health endpoint restart |
| `proxy:recovery` | Proxy service restart |

### Recovery Configuration

```python
from src.core.auto_recovery import RecoveryConfig

config = RecoveryConfig(
    max_attempts=3,              # Try up to 3 times
    base_delay_seconds=1.0,      # Start with 1s delay
    max_delay_seconds=10.0,      # Cap at 10s
    backoff_multiplier=2.0,      # Exponential: 1s → 2s → 4s → 8s → 10s
)
```

### Exponential Backoff

Delay formula: `min(base * (multiplier ^ (attempt - 1)), max_delay)`

| Attempt | Delay |
|---------|-------|
| 1 | 1s |
| 2 | 2s |
| 3 | 4s |
| 4 | 8s |
| 5+ | 10s (capped) |

### Usage

```python
from src.core.auto_recovery import (
    AutoRecovery,
    RecoveryType,
    get_auto_recovery,
    reset_auto_recovery,
)

# Get recovery instance
recovery = get_auto_recovery()

# Attempt recovery
result = recovery.attempt_recovery(
    recovery_type=RecoveryType.PROXY_RECOVERY,
    metadata={"reason": "license_failure", "key_id": "key_123"},
)

print(f"Status: {result.status.value}")
print(f"Attempts: {result.attempt_number}")
print(f"Duration: {result.duration_ms}ms")
if result.error_message:
    print(f"Error: {result.error_message}")

# Get recovery statistics
stats = recovery.get_recovery_statistics()
print(f"Total incidents: {stats['total_incidents']}")
print(f"Success rate: {stats['success_rate']}%")
print(f"By type: {stats['by_type']}")

# Get recent recoveries
recent = recovery.get_recent_recoveries(limit=10, status_filter=None)
for r in recent:
    print(f"{r.recovery_type.value}: {r.status.value}")
```

### Recovery Statistics

```json
{
  "total_incidents": 5,
  "total_attempts": 12,
  "successful_recoveries": 8,
  "failed_recoveries": 4,
  "success_rate": 66.67,
  "average_attempts_per_incident": 2.4,
  "average_duration_ms": 3250.5,
  "by_type": {
    "license:recovery": {
      "total": 5,
      "successful": 3,
      "failed": 2
    },
    "crash:recovery": {
      "total": 7,
      "successful": 5,
      "failed": 2
    }
  }
}
```

---

## Event Types Reference

### Health Events (Phase 1)

| Event Type | Description |
|------------|-------------|
| `health_warning` | System health degraded |
| `health_critical` | Critical health issue |
| `recovery_started` | Recovery action started |
| `recovery_success` | Recovery succeeded |
| `recovery_failed` | Recovery failed |

### License Events (Phase 2)

| Event Type | Description |
|------------|-------------|
| `license:validation_failed` | License validation failed |
| `license:critical` | License threshold exceeded |
| `license:grace_period_active` | Grace period active |
| `license:threshold_warning` | Warning before threshold |

### Usage Events (Phase 3)

| Event Type | Description |
|------------|-------------|
| `usage:anomaly_detected` | Anomaly detected |
| `usage:api_call` | API call recorded |
| `usage:agent_spawn` | Agent spawn recorded |
| `usage:model_usage` | Model usage recorded |
| `usage:llm_call` | LLM call recorded |
| `usage:token_usage` | Token usage recorded |

### Alert Events (Phase 4)

| Event Type | Description |
|------------|-------------|
| `alert:deduplicated` | Alert suppressed (duplicate) |
| `alert:throttled` | Alert suppressed (throttle) |
| `alert:sent` | Alert sent successfully |

---

## Troubleshooting

### Health Endpoint Not Responding

**Symptoms**: HTTP 500 or timeout on `/health`

**Check**:
```bash
# Check server process
ps aux | grep health_endpoint

# Check port
lsof -i :9192

# View logs
tail -f .mekong/health_endpoint.log
```

**Fix**:
```python
from src.core.health_endpoint import start_health_server
server = start_health_server(host="127.0.0.1", port=9192)
```

### Crash Detector Not Recording

**Symptoms**: No crash files in `.mekong/crashes/`

**Check**:
```bash
# Verify crash directory exists
ls -la .mekong/crashes/

# Check permissions
chmod 755 .mekong/crashes/
```

**Fix**:
```python
detector = get_crash_detector(crashes_dir=".mekong/crashes")
detector.record_crash(exit_code=1, command="test")
```

### License Threshold Not Alerting

**Symptoms**: Missing `license:critical` events

**Check**:
```python
monitor = get_monitor()
print(f"Failures: {monitor.get_failure_count_recent()}")
print(f"Threshold: 3 in 5 minutes")
print(f"Is critical: {monitor.is_critical()}")
```

**Fix**: Ensure failures are being recorded properly and within the time window.

### Alert Not Going to Telegram

**Symptoms**: Alerts appear suppressed or not delivered

**Check**:
```bash
# Verify environment variables
echo $TELEGRAM_BOT_TOKEN
echo $TELEGRAM_OPS_CHANNEL_ID

# Check rate limiting
router = get_alert_router()
print(router.get_stats())
```

**Fix**:
```bash
# Wait for throttle window to reset
sleep 3600  # Wait 1 hour

# Or lower throttle limit
config = AlertConfig(throttle_limit=100)
router = get_alert_router(config=config)
```

### Anomaly Detection Not Working

**Symptoms**: No anomalies detected even with extreme values

**Check**:
```python
detector = get_detector()
baseline = detector.get_baseline("api_calls", "requests")
print(f"Samples: {baseline.sample_count}")  # Need >= 3

# Check Z-score threshold
print(f"Z-score for 1000 vs baseline 100±10: {(1000-100)/10}")  # 90σ
```

**Fix**: Record more baseline samples (minimum 3, recommended 20+).

---

## Runbook

### Query: "Server is unhealthy, what do I do?"

```python
# 1. Check health status
from src.core.health_endpoint import get_health_url
print(f"Health URL: {get_health_url()}")

# 2. Check crash history
detector = get_crash_detector()
crashes = detector.get_recent_crashes(limit=5)
for c in crashes:
    print(f"Crash: {c.exit_code} - {c.timestamp}")

# 3. Check license status
monitor = get_monitor()
if monitor.is_critical():
    print("LICENSE CRITICAL!")
    # Trigger manual recovery

# 4. Check recovery stats
recovery = get_auto_recovery()
stats = recovery.get_recovery_statistics()
print(f"Success rate: {stats['success_rate']}%")
```

### Query: "How many recoveries succeeded vs failed?"

```python
recovery = get_auto_recovery()
stats = recovery.get_recovery_statistics()

print("Recovery Summary:")
print(f"  Total Incidents: {stats['total_incidents']}")
print(f"  Successful: {stats['successful_recoveries']}")
print(f"  Failed: {stats['failed_recoveries']}")
print(f"  Success Rate: {stats['success_rate']}%")

print("\nBy Type:")
for rtype, data in stats['by_type'].items():
    print(f"  {rtype}: {data['successful']}/{data['total']}")
```

### Query: "Why did this license failure not trigger an alert?"

```python
monitor = get_monitor()
stats = monitor.get_statistics()

print(f"Total failures: {stats['total_failures']}")
print(f"Recent failures: {stats['recent_failures']}")
print(f"Is critical: {stats['is_critical']}")
print(f"Threshold: {stats['threshold_max_failures']} in {stats['threshold_window_seconds']}s")

# Check grace period
if stats['grace_period_active']:
    print(f"Grace period: {stats['grace_period_remaining_seconds']/3600:.1f}h remaining")
```

### Query: "Show me all anomalies detected today"

```python
import json
from pathlib import Path

baseline_file = Path(".mekong/usage_baseline.json")
if baseline_file.exists():
    data = json.loads(baseline_file.read_text())
    for metric, stats in data.get("baselines", {}).items():
        print(f"{metric}:")
        print(f"  Mean: {stats['mean']:.2f}")
        print(f"  Std Dev: {stats['std_dev']:.2f}")
        print(f"  Samples: {stats['sample_count']}")
        print(f"  Last updated: {stats['last_updated']}")
```

### Query: "What alerts were throttled today?"

```python
# Check alert router stats
router = get_alert_router()
stats = router.get_stats()

print(f"Current alerts in last hour: {stats['alerts_last_hour']}")
print(f"Throttle limit: {stats['throttle_limit']}")
print(f"Remaining quota: {stats['throttle_remaining']}")
```

---

## Configuration Reference

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for alerts | - |
| `TELEGRAM_OPS_CHANNEL_ID` | Telegram ops channel ID | - |
| `HEALTH_ENDPOINT_HOST` | Health endpoint host | `127.0.0.1` |
| `HEALTH_ENDPOINT_PORT` | Health endpoint port | `9192` |

### File Locations

| File | Purpose |
|------|---------|
| `.mekong/license_failures.json` | License failure history |
| `.mekong/usage_baseline.json` | Anomaly detection baselines |
| `.mekong/recovery_history.json` | Recovery attempt history |
| `.mekong/crashes/*.json` | Crash event history |

---

## API Reference

### Core Functions

| Function | Module | Description |
|----------|--------|-------------|
| `get_crash_detector()` | `crash_detector` | Get crash detector instance |
| `get_monitor()` | `license_monitor` | Get license monitor instance |
| `get_detector()` | `anomaly_detector` | Get anomaly detector instance |
| `get_alert_router()` | `alert_router` | Get alert router instance |
| `get_auto_recovery()` | `auto_recovery` | Get auto-recovery instance |
| `reset_crash_detector()` | `crash_detector` | Reset crash detector singleton |
| `reset_monitor()` | `license_monitor` | Reset monitor singleton |
| `reset_detector()` | `anomaly_detector` | Reset detector singleton |
| `reset_auto_recovery()` | `auto_recovery` | Reset recovery singleton |

---

## Testing

```bash
# Run health monitoring tests
python3 -m pytest tests/test_health_monitoring.py -v

# Run specific test class
python3 -m pytest tests/test_health_monitoring.py::TestCrashDetector -v

# Run with coverage
python3 -m pytest tests/test_health_monitoring.py --cov=src/core/health_monitoring --cov-report=term-missing
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial release |
| 2.0.0 | 2024-02-01 | Phase 4-5 alerts + recovery |

---

## Support

For issues or questions:
1. Check this documentation first
2. Review event types for operational signals
3. Check recovery statistics for failure patterns
4. View crash/license/anomaly history for patterns

---

*Last Updated: 2024-01-01 | Version: 2.0.0*
