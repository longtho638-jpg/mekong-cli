---
title: "Phase 6.4: Usage Billing Automation"
description: "Automated usage sync at period boundaries, real-time overage alerts, quota enforcement middleware"
status: pending
priority: P1
effort: 2h
parent_plan: 260308-2101-phase6-overage-billing-dunning
---

# Phase 6.4: Usage Billing Automation

**ROI:** Operational ROI - Real-time overage prevention + automated billing

---

## Context Links

- Parent Plan: [plan.md](./plan.md)
- Related Files:
  - `src/billing/usage_tracker.py` - Usage tracking
  - `src/lib/usage_meter.py` - Usage metering
  - `src/billing/overage_calculator.py` - Overage calculation
- External Docs:
  - [Stripe Real-Time Usage](https://docs.stripe.com/billing/metered-billing/real-time-usage)

---

## Overview

**Priority:** P1 | **Effort:** 2h | **Status:** pending

### Mục tiêu

1. Automated usage sync at period boundaries
2. Real-time overage threshold alerts (80%, 90%, 100%)
3. Usage quota enforcement middleware
4. Usage dashboard API

---

## Key Insights

Usage billing flow:
```
Event → Track → Buffer → Threshold Check → Alert → Sync → Invoice
```

Threshold alerts prevent bill shock:
- 80%: Warning email
- 90%: Critical email
- 100%: Enforcement (block or overage charge)

---

## Requirements

### Functional

1. Auto-sync usage at period start/end
2. Real-time threshold monitoring (80%, 90%, 100%)
3. Alert notifications at each threshold
4. Quota enforcement middleware (block/allow with overage)
5. Usage dashboard API (current usage, projections)

### Non-Functional

- Threshold check latency < 10ms
- Alert delivery < 1 minute
- Middleware overhead < 5ms/request

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│              Usage Billing Automation                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  API Request                                             │
│         │                                                 │
│         ▼                                                 │
│  ┌─────────────────┐                                     │
│  │ QuotaMiddleware │ ◄── Check remaining quota          │
│  └────────┬────────┘                                     │
│           │ allowed?                                      │
│           ├──Yes────────┐                                 │
│           │ No         │                                 │
│           │             ▼                                 │
│           │    ┌─────────────────┐                        │
│           │    │ ThresholdCheck  │                        │
│           │    └────────┬────────┘                        │
│           │             │                                 │
│           │             ├── 80% ──► Warning Alert        │
│           │             ├── 90% ──► Critical Alert       │
│           │             └── 100% ──► Block/Overage      │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────┐                                     │
│  │ UsageTracker    │                                     │
│  └────────┬────────┘                                     │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────┐                                     │
│  │ KV Buffer       │                                     │
│  └────────┬────────┘                                     │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────┐                                     │
│  │ PeriodicSync    │ ◄── Cron: period start/end         │
│  └────────┬────────┘                                     │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────┐                                     │
│  │ Stripe API      │                                     │
│  └─────────────────┘                                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Related Code Files

### Files to Create

- `src/billing/threshold_monitor.py` - Real-time threshold monitoring
- `src/billing/quota_middleware.py` - Quota enforcement middleware
- `src/billing/usage_projection.py` - Usage projection calculator
- `src/api/usage_dashboard.py` - Usage dashboard API

### Files to Modify

- `src/billing/usage_tracker.py` - Add threshold checks
- `src/lib/usage_meter.py` - Add threshold config
- `src/core/middleware.py` - Register quota middleware

---

## Implementation Steps

### Step 1: Threshold Monitor

**File:** `src/billing/threshold_monitor.py`

```python
class ThresholdMonitor:
    """Monitor usage thresholds and send alerts."""

    THRESHOLDS = [80, 90, 100]  # Percentage thresholds

    async def check_thresholds(
        self,
        tenant_id: str,
        current_usage: int,
        quota: int,
    ) -> List[ThresholdAlert]:
        """Check if any thresholds crossed."""
        percentage = (current_usage / quota) * 100
        alerts = []

        for threshold in self.THRESHOLDS:
            if percentage >= threshold:
                # Check if alert already sent for this threshold
                if not await self._alert_sent(tenant_id, threshold):
                    alerts.append(ThresholdAlert(
                        threshold=threshold,
                        percentage=percentage,
                        current_usage=current_usage,
                        quota=quota,
                    ))
                    await self._mark_alert_sent(tenant_id, threshold)

        return alerts

    async def send_alert(
        self,
        tenant_id: str,
        alert: ThresholdAlert,
    ) -> None:
        """Send threshold alert notification."""
        if alert.threshold == 80:
            await notification_service.send_usage_warning(...)
        elif alert.threshold == 90:
            await notification_service.send_usage_critical(...)
        elif alert.threshold == 100:
            await notification_service.send_quota_exceeded(...)
```

### Step 2: Quota Enforcement Middleware

**File:** `src/billing/quota_middleware.py`

```python
class QuotaEnforcementMiddleware:
    """Enforce usage quotas on API requests."""

    async def __call__(
        self,
        request: Request,
        call_next,
    ) -> Response:
        """Check quota before processing request."""
        # Extract tenant_id from auth
        tenant_id = extract_tenant_id(request)

        # Get current usage
        usage = await usage_meter.get_usage(tenant_id)
        quota = await usage_meter.get_quota(tenant_id)

        # Check if quota exceeded
        if usage["commands_count"] >= quota:
            # Check if overage allowed
            if not tenant_config.allow_overage(tenant_id):
                return JSONResponse(
                    status_code=429,
                    content={"error": "Quota exceeded"},
                    headers={"X-Quota-Remaining": "0"},
                )

        # Check thresholds
        alerts = await threshold_monitor.check_thresholds(
            tenant_id,
            usage["commands_count"],
            quota,
        )

        for alert in alerts:
            await threshold_monitor.send_alert(tenant_id, alert)

        # Process request
        response = await call_next(request)

        # Add quota headers
        remaining = quota - usage["commands_count"]
        response.headers["X-Quota-Remaining"] = str(remaining)
        response.headers["X-Quota-Limit"] = str(quota)

        return response
```

### Step 3: Usage Projection

**File:** `src/billing/usage_projection.py`

```python
class UsageProjection:
    """Project end-of-period usage based on current rate."""

    async def project_end_of_period(
        self,
        tenant_id: str,
        period_end: datetime,
    ) -> ProjectionResult:
        """
        Project usage at period end.

        Uses linear regression on recent usage data.
        """
        # Get usage history (hourly for last 7 days)
        history = await usage_repository.get_hourly_usage(
            tenant_id,
            days=7,
        )

        # Calculate average daily rate
        daily_rate = sum(h["count"] for h in history) / 7

        # Days remaining in period
        days_remaining = (period_end - datetime.now()).days

        # Project usage
        current_usage = await usage_meter.get_usage(tenant_id)
        projected_total = current_usage["commands_count"] + (daily_rate * days_remaining)

        # Get quota
        quota = await usage_meter.get_quota(tenant_id)

        # Will exceed?
        will_exceed = projected_total > quota
        overage_amount = max(0, projected_total - quota)

        return ProjectionResult(
            current_usage=current_usage["commands_count"],
            projected_usage=int(projected_total),
            quota=quota,
            will_exceed=will_exceed,
            overage_amount=overage_amount,
            daily_rate=daily_rate,
            days_remaining=days_remaining,
        )
```

### Step 4: Usage Dashboard API

**File:** `src/api/usage_dashboard.py`

```python
from fastapi import APIRouter

dashboard_router = APIRouter(prefix="/usage", tags=["Usage Dashboard"])

@dashboard_router.get("/summary")
async def get_usage_summary(
    tenant_id: str,
    meter: UsageMeter = Depends(get_meter),
) -> UsageSummaryResponse:
    """Get current usage summary."""
    return await meter.get_usage_summary(tenant_id)

@dashboard_router.get("/projection")
async def get_usage_projection(
    tenant_id: str,
    projection: UsageProjection = Depends(),
) -> ProjectionResponse:
    """Get end-of-period usage projection."""
    period_end = get_period_end()
    return await projection.project_end_of_period(tenant_id, period_end)

@dashboard_router.get("/history")
async def get_usage_history(
    tenant_id: str,
    days: int = Query(30, ge=1, le=90),
    repository: LicenseRepository = Depends(get_repository),
) -> UsageHistoryResponse:
    """Get usage history for specified days."""
    return await repository.get_daily_usage(tenant_id, days)

@dashboard_router.get("/thresholds")
async def get_threshold_status(
    tenant_id: str,
    monitor: ThresholdMonitor = Depends(),
) -> ThresholdStatusResponse:
    """Get threshold alert status."""
    usage = await meter.get_usage_summary(tenant_id)
    return await monitor.get_threshold_status(
        usage["commands_today"],
        usage["daily_limit"],
    )
```

### Step 5: Periodic Sync Automation

**File:** `src/billing/period_end_sync.py` (modify)

```python
async def period_start_sync_job():
    """Sync at period start (first day of month, 00:00 UTC)."""
    # Reset monthly counters
    # Archive previous period data
    # Generate monthly report

async def period_end_sync_job():
    """Sync at period end (last day of month, 23:59 UTC)."""
    # Flush all pending usage to Stripe
    # Calculate overage charges
    # Generate invoice preview

# Register in scheduler
scheduler.add_job(
    id="period_start_sync",
    func=period_start_sync_job,
    trigger="cron",
    day=1,
    hour=0,
    minute=0,
)

scheduler.add_job(
    id="period_end_sync",
    func=period_end_sync_job,
    trigger="cron",
    day="last",
    hour=23,
    minute=59,
)
```

---

## Todo List

- [ ] 6.4.1: Tạo `ThresholdMonitor` class
- [ ] 6.4.2: Implement `check_thresholds()` method
- [ ] 6.4.3: Implement `send_alert()` method
- [ ] 6.4.4: Tạo `QuotaEnforcementMiddleware` class
- [ ] 6.4.5: Register middleware in FastAPI
- [ ] 6.4.6: Tạo `UsageProjection` class
- [ ] 6.4.7: Implement `project_end_of_period()` method
- [ ] 6.4.8: Tạo usage dashboard API endpoints
- [ ] 6.4.9: Add period start cron job
- [ ] 6.4.10: Test threshold alerts
- [ ] 6.4.11: Test quota enforcement

---

## Success Criteria

1. ✅ Threshold alerts at 80%, 90%, 100%
2. ✅ Quota middleware blocks at 100% (if overage disabled)
3. ✅ Usage projection accurate within 10%
4. ✅ Dashboard API returns real-time data
5. ✅ Period sync runs automatically
6. ✅ Alert latency < 1 minute

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| False positive alerts | Medium | Dedup logic + manual reset |
| Middleware slows requests | Low | Cache quota check (5min) |
| Projection inaccurate | Low | Use 7-day average |
| Sync job fails | High | Retry + alert on failure |

---

## Security Considerations

- Tenant isolation in quota checks
- Rate limit on dashboard API
- Audit log threshold alerts

---

## Next Steps

1. Implement ThresholdMonitor
2. Add quota middleware to request pipeline
3. Test threshold alerts end-to-end
4. Deploy usage dashboard
