---
title: "Rate Limiting Observability Implementation"
description: "Database schema, structured logging, metrics emission, and diagnostic CLI for rate limiting visibility"
status: pending
priority: P2
effort: 8h
branch: master
tags: [observability, rate-limiting, telemetry, cli]
created: 2026-03-07
---

# Rate Limiting Observability Plan

## Overview

Add comprehensive observability to the tenant-specific rate limiting system to enable:
- Debugging rate limit issues in production
- Monitoring quota usage patterns per tenant/tier
- Analytics dashboard integration for usage visualization
- CLI diagnostics for operations team

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Request → TierRateLimitMiddleware                              │
│              │                                                  │
│              ├── Check tenant override                          │
│              ├── Check tier default                             │
│              ├── Acquire token (or reject 429)                  │
│              │                                                  │
│              └── Emit Event ──→ Rate Limit Logger ──→ JSON Logs │
│                              │                                  │
│                              ├──→ Telemetry Pipeline ──→ Dashboard
│                              │                                  │
│                              └──→ DB (rate_limit_events table)  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              └──→ CLI Commands (debug-rate-limits)
```

## Phases

| Phase | Name | Effort | Status |
|-------|------|--------|--------|
| 1 | Database Schema | 1h | **completed** |
| 2 | Structured Logging | 2h | **completed** |
| 3 | Metrics Emission | 2h | **completed** |
| 4 | Diagnostic CLI | 2h | **completed** |
| 5 | Testing | 1h | pending |

---

## Phase 1: Database Schema

### Goal
Create `rate_limit_events` table for persisting rate limit events.

### Files to Create
- `src/db/migrations/create_rate_limit_events_table.sql`

### Files to Modify
- None (new migration file)

### Schema Design

```sql
CREATE TABLE IF NOT EXISTS rate_limit_events (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       TEXT NOT NULL,
    tier            TEXT NOT NULL,
    endpoint        TEXT NOT NULL,
    preset          TEXT NOT NULL,

    -- Rate limit context
    requests_per_minute INTEGER NOT NULL,
    burst_size          INTEGER,
    window_seconds      INTEGER,

    -- Event type
    event_type      TEXT NOT NULL CHECK (event_type IN ('request_allowed', 'rate_limited', 'override_applied')),

    -- Response details
    tokens_remaining    INTEGER,
    retry_after         INTEGER,
    response_status     INTEGER NOT NULL,

    -- Request context
    request_path        TEXT NOT NULL,
    request_method      TEXT NOT NULL DEFAULT 'GET',
    user_agent          TEXT,
    ip_address          INET,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_rate_limit_events_tenant_id ON rate_limit_events(tenant_id);
CREATE INDEX idx_rate_limit_events_tier ON rate_limit_events(tier);
CREATE INDEX idx_rate_limit_events_event_type ON rate_limit_events(event_type);
CREATE INDEX idx_rate_limit_events_created_at ON rate_limit_events(created_at DESC);
CREATE INDEX idx_rate_limit_events_tenant_time ON rate_limit_events(tenant_id, created_at DESC);
```

### Migration Script

```bash
# Run migration
psql "$DATABASE_URL" -f src/db/migrations/create_rate_limit_events_table.sql
```

### Success Criteria
- [x] Migration file created: `006_create_rate_limit_events.sql`
- [ ] Table created in database (run migration)
- [ ] Indexes verified
- [ ] Migration documented in changelog

---

## Phase 2: Structured Logging

### Goal
Add JSON structured logging to `TierRateLimitMiddleware` with tenant context.

### Files to Modify
- `src/lib/tier_rate_limit_middleware.py` - Add logging calls
- `src/config/logging_config.py` - Add rate limit logger config (if needed)

### Log Format

```json
{
  "timestamp": "2026-03-07T09:16:00.000Z",
  "level": "INFO",
  "event": "rate_limit_event",
  "tenant_id": "tenant-123",
  "tier": "pro (custom)",
  "endpoint": "/api/v1/users",
  "preset": "api_default",
  "event_type": "request_allowed",
  "quota": {
    "requests_per_minute": 200,
    "burst_size": 200,
    "window_seconds": 60,
    "tokens_remaining": 195
  },
  "response": {
    "status": 200,
    "retry_after": null
  },
  "request": {
    "path": "/api/v1/users",
    "method": "GET",
    "user_agent": "Mozilla/5.0...",
    "ip": "192.168.1.1"
  }
}
```

### Implementation Steps

1. Add logger instance to middleware:
   ```python
   import logging
   logger = logging.getLogger("mekong.rate_limits")
   ```

2. Add logging at key points in `dispatch()` method:
   - After tenant override check (log if override applied)
   - After rate limit check (log allowed vs limited)
   - Include full context: tenant_id, tier, preset, endpoint, quota details

3. Ensure JSON formatting via existing logging config

### Log Events

| Event Type | Level | When |
|------------|-------|------|
| `rate_limit_override_applied` | INFO | Tenant has custom override |
| `rate_limit_request_allowed` | DEBUG | Request passes rate limit |
| `rate_limit_exceeded` | WARNING | Request rejected (429) |

### Success Criteria
- [x] Logger added to middleware
- [x] All three event types logged (override_applied, request_allowed, rate_limited)
- [ ] JSON format verified in logs
- [ ] Log sampling configured (avoid log flood in high-traffic)

---

## Phase 3: Metrics Emission

### Goal
Emit rate limit metrics to telemetry pipeline for dashboard integration.

### Files to Create
- `src/telemetry/rate_limit_metrics.py` - Metrics emitter

### Files to Modify
- `src/lib/tier_rate_limit_middleware.py` - Call metrics emitter
- `src/analytics/dashboard_service.py` - Add rate limit queries

### Metrics to Emit

```python
@dataclass
class RateLimitMetric:
    timestamp: str
    tenant_id: str
    tier: str
    preset: str
    endpoint: str
    event_type: str  # allowed, limited, override
    response_time_ms: float
    requests_per_minute: int
    tokens_remaining: int
```

### Implementation

1. Create metrics emitter class:
   ```python
   class RateLimitMetricsEmitter:
       def emit(self, metric: RateLimitMetric) -> None
       def emit_batch(self, metrics: List[RateLimitMetric]) -> None
   ```

2. Integrate with existing telemetry collector:
   - Reuse `TelemetryCollector` from `src/core/telemetry.py`
   - Add rate limit event type to `ExecutionTrace` model

3. Add dashboard queries:
   ```sql
   -- Rate limit violations by tenant (last 24h)
   SELECT tenant_id, COUNT(*) as violations
   FROM rate_limit_events
   WHERE event_type = 'rate_limited'
     AND created_at > NOW() - INTERVAL '24 hours'
   GROUP BY tenant_id
   ORDER BY violations DESC;

   -- Usage by tier
   SELECT tier, event_type, COUNT(*) as count
   FROM rate_limit_events
   WHERE created_at > NOW() - INTERVAL '7 days'
   GROUP BY tier, event_type;
   ```

### Dashboard Integration

Add to `DashboardMetrics` dataclass:
```python
@dataclass
class DashboardMetrics:
    # ... existing fields ...
    rate_limit_violations: List[Dict[str, Any]] = field(default_factory=list)
    quota_usage_by_tenant: List[Dict[str, Any]] = field(default_factory=list)
```

### Success Criteria
- [x] Metrics emitter class created
- [x] Middleware emits metrics on every request
- [x] Dashboard queries return rate limit data
- [ ] Metrics visible in analytics dashboard

---

## Phase 4: Diagnostic CLI

### Goal
Create CLI tool for debugging rate limit issues.

### Files to Create
- `src/commands/debug_rate_limits.py`

### Commands

#### `status` - Check current rate limit status for a tenant

```bash
# Check tenant's current rate limit status
mekong debug-rate-limits status --tenant tenant-123

# Output:
Tenant: tenant-123
Tier: pro (custom override)
Preset: api_default
Limit: 200 req/min (window: 60s)
Burst: 200
Override Expires: Never

Current Usage (last 60s):
  Requests: 45
  Remaining: 155
  Status: OK
```

#### `history` - View rate limit event history

```bash
# Last 50 events for a tenant
mekong debug-rate-limits history --tenant tenant-123 --limit 50

# Violations only (429s)
mekong debug-rate-limits history --tenant tenant-123 --type violations

# Output (table format):
┌──────────┬────────────┬───────────┬────────────┬─────────┐
│ Time     │ Tenant     │ Endpoint  │ Event Type │ Status  │
├──────────┼────────────┼───────────┼────────────┼─────────┤
│ 09:15:00 │ tenant-123 │ /api/users│ allowed    │ 200     │
│ 09:14:58 │ tenant-123 │ /api/data │ limited    │ 429     │
└──────────┴────────────┴───────────┴────────────┴─────────┘
```

#### `violations` - List rate limit violations with details

```bash
# All violations in last 24h
mekong debug-rate-limits violations --hours 24

# Violations by tenant
mekong debug-rate-limits violations --tenant tenant-123

# Output:
Violations (Last 24 hours)
─────────────────────────────────────
Total: 15 violations across 5 tenants

By Tenant:
  tenant-123: 8 violations
  tenant-456: 4 violations
  tenant-789: 3 violations

Top Violated Endpoints:
  /api/v1/data/import: 10 violations
  /api/v1/bulk/upload: 5 violations
```

### Implementation

```python
import typer
from rich.console import Console
from rich.table import Table
from datetime import timedelta

app = typer.Typer(name="debug-rate-limits")
console = Console()

@app.command("status")
def check_status(tenant_id: str):
    """Check rate limit status for a tenant."""
    # Query rate_limit_events for recent usage
    # Check for active overrides
    # Display current quota status

@app.command("history")
def view_history(
    tenant_id: Optional[str] = None,
    limit: int = 50,
    event_type: Optional[str] = None
):
    """View rate limit event history."""

@app.command("violations")
def list_violations(
    hours: int = 24,
    tenant_id: Optional[str] = None
):
    """List rate limit violations."""
```

### Database Queries

```python
async def get_tenant_status(tenant_id: str) -> Dict:
    """Get current rate limit status for tenant."""
    query = """
        SELECT
            tenant_id,
            tier,
            preset,
            event_type,
            COUNT(*) as request_count,
            MAX(created_at) as last_request
        FROM rate_limit_events
        WHERE tenant_id = $1
          AND created_at > NOW() - INTERVAL '1 minute'
        GROUP BY tenant_id, tier, preset, event_type
    """
    # ... execute and format

async def get_violations(hours: int = 24) -> List[Dict]:
    """Get rate limit violations (429s)."""
    query = """
        SELECT
            tenant_id,
            endpoint,
            preset,
            created_at,
            retry_after
        FROM rate_limit_events
        WHERE event_type = 'rate_limited'
          AND created_at > NOW() - INTERVAL '%s hours'
        ORDER BY created_at DESC
    """ % hours
```

### Success Criteria
- [ ] CLI command file created
- [ ] `status` command works
- [ ] `history` command works
- [ ] `violations` command works
- [ ] Commands integrated into main CLI

---

## Phase 5: Testing

### Goal
Verify all observability features work correctly.

### Test Files to Create
- `tests/test_rate_limit_observability.py`
- `tests/test_rate_limit_cli.py`

### Test Categories

#### 1. Database Schema Tests (~5 tests)
- [ ] Table exists with correct columns
- [ ] Indexes created
- [ ] Constraints enforced (event_type CHECK)
- [ ] Timestamps stored correctly
- [ ] INET type for IP addresses

#### 2. Logging Tests (~10 tests)
- [ ] Logger initialized correctly
- [ ] JSON format verified
- [ ] All event types logged
- [ ] Context data complete (tenant_id, tier, etc.)
- [ ] Log level filtering works
- [ ] No PII logged (mask sensitive data)
- [ ] Log sampling prevents flood

#### 3. Metrics Emission Tests (~10 tests)
- [ ] Metrics emitted on every request
- [ ] Metric data structure correct
- [ ] Integration with TelemetryCollector works
- [ ] Batch emission works
- [ ] Dashboard queries return data
- [ ] Real-time metrics visible

#### 4. CLI Tests (~15 tests)
- [ ] `status` command returns correct data
- [ ] `history` command filters by tenant
- [ ] `history` command limits results
- [ ] `violations` command aggregates correctly
- [ ] CLI handles missing data gracefully
- [ ] Table formatting correct
- [ ] Error handling for invalid tenant IDs

### Running Tests

```bash
# Full test suite
python3 -m pytest tests/test_rate_limit_observability.py -v

# CLI tests
python3 -m pytest tests/test_rate_limit_cli.py -v

# Integration test (requires database)
python3 -m pytest tests/test_rate_limit_*.py -v --integration
```

### Success Criteria
- [ ] All 40+ tests pass
- [ ] No flaky tests
- [ ] Integration tests documented
- [ ] Test coverage > 80%

---

## Dependencies

```
┌─────────────────────────────────────────────────────────┐
│ Phase 1: Database Schema                                │
│ (No dependencies)                                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Phase 2: Structured Logging                             │
│ Depends on: Phase 1 (table exists for logging)          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Phase 3: Metrics Emission                               │
│ Depends on: Phase 1 (DB schema), Phase 2 (log format)   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Phase 4: Diagnostic CLI                                 │
│ Depends on: Phase 1 (DB queries)                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Phase 5: Testing                                        │
│ Depends on: All previous phases                         │
└─────────────────────────────────────────────────────────┘
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| High log volume in production | Performance | Implement log sampling (1 in N requests) |
| Database write latency | Rate limit performance | Async logging, batch writes |
| Sensitive data in logs | Security | Redact IP addresses, user agents |
| CLI queries slow | Operations | Indexes on tenant_id, created_at |

---

## Success Criteria (Overall)

1. **Database**: `rate_limit_events` table exists with proper indexes
2. **Logging**: All rate limit events logged in JSON format with full context
3. **Metrics**: Dashboard shows rate limit violations and usage patterns
4. **CLI**: Operations team can debug rate limit issues via CLI
5. **Tests**: 40+ tests covering all features, all passing

---

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/tier_rate_limit_middleware.py` | Main middleware to modify |
| `src/db/tier_config_repository.py` | Existing repository pattern to follow |
| `src/lib/tier_config.py` | Rate limit config definitions |
| `src/analytics/dashboard_service.py` | Dashboard integration |
| `src/commands/tier_admin.py` | CLI pattern reference |
| `src/core/telemetry.py` | Telemetry integration |
| `src/db/database.py` | Database connection |

---

## Next Steps

1. Create migration file (Phase 1)
2. Run migration on database
3. Implement structured logging (Phase 2)
4. Create metrics emitter (Phase 3)
5. Build diagnostic CLI (Phase 4)
6. Write and run tests (Phase 5)

---

## Unresolved Questions

1. **Log sampling rate**: What percentage of requests should be logged in high-traffic scenarios? (Recommend: 10% sampling, 100% for 429s)
2. **Data retention**: How long to keep `rate_limit_events` in database? (Recommend: 30 days with partitioning)
3. **IP address storage**: Should we store full IPs or hashed for privacy? (Recommend: Store hashed/anonymized)
4. **Dashboard UI**: Which specific charts to add to analytics dashboard? (Recommend: Violations over time, Top limited tenants, Quota usage heatmap)
