---
title: "Phase 6.1: Stripe Billing Cycle Integration"
description: "Auto-sync usage at period end, generate invoices with overage charges, configure tiered pricing"
status: pending
priority: P1
effort: 3h
parent_plan: 260308-2101-phase6-overage-billing-dunning
---

# Phase 6.1: Stripe Billing Cycle Integration

**ROI:** Operational ROI - Auto-charge overage at billing period end

---

## Context Links

- Parent Plan: [plan.md](./plan.md)
- Related Files:
  - `src/billing/engine.py` - Billing engine
  - `src/api/billing_endpoints.py` - Billing API
  - `src/auth/stripe_integration.py` - Stripe integration
- External Docs:
  - [Stripe Usage Records API](https://docs.stripe.com/api/usage_records)
  - [Stripe Metered Billing](https://docs.stripe.com/billing/metered-billing)

---

## Overview

**Priority:** P1 | **Effort:** 3h | **Status:** pending

### Mục tiêu

1. Auto-sync usage từ KV buffer → Stripe tại period end
2. Generate invoices với overage charges tự động
3. Configure tiered pricing với graduated volumes trong Stripe

---

## Key Insights

Từ research Phase 4-5:
- UsageTrackerService đã track events → buffer → KV storage
- StripeUsageSyncService đã sync KV → Stripe nhưng chưa trigger tự động
- OverageCalculator chưa integrate với Stripe Billing API

---

## Requirements

### Functional

1. Cron job trigger usage sync tại period end (last day of month, 23:59 UTC)
2. OverageCalculator tính toán overage charges theo tiered pricing
3. Stripe Usage Records API POST /v1/subscription_items/{id}/usage_records
4. Invoice generation với line items: base fee + overage

### Non-Functional

- Sync phải hoàn thành < 30s cho 1000 tenants
- Idempotency: không sync trùng lap 2 lần
- Error handling: retry 3x với exponential backoff

---

## Architecture

```
Billing Period End (Cron)
         │
         ▼
┌────────────────────────┐
│  PeriodEndSyncService  │
├────────────────────────┤
│ 1. Get all active subs │
│ 2. Flush KV buffer     │
│ 3. Calculate overage   │
│ 4. Sync to Stripe      │
│ 5. Generate invoice    │
└────────────────────────┘
         │
         ├──► Stripe Usage Records API
         │
         ▼
┌────────────────────────┐
│  OverageCalculator     │
├────────────────────────┤
│ Tier 1: $0.10/unit     │
│ Tier 2: $0.08/unit     │
│ Tier 3: $0.05/unit     │
└────────────────────────┘
```

---

## Related Code Files

### Files to Create

- `src/billing/period_end_sync.py` - Cron job cho period end sync
- `src/billing/stripe_usage_records.py` - Stripe Usage Records API client
- `src/billing/tiered_pricing.py` - Tiered pricing calculator

### Files to Modify

- `src/billing/engine.py` - Add period end trigger logic
- `src/api/billing_endpoints.py` - Add manual sync endpoint
- `src/config/settings.py` - Add cron schedule config

---

## Implementation Steps

### Step 1: Stripe Usage Records Client

**File:** `src/billing/stripe_usage_records.py`

```python
class StripeUsageRecordsClient:
    """Client for Stripe Usage Records API."""

    async def create_usage_record(
        self,
        subscription_item_id: str,
        quantity: int,
        action: str = "set",  # or "increment"
        idempotency_key: Optional[str] = None,
    ) -> UsageRecord:
        """Create usage record for subscription item."""

    async def list_usage_records(
        self,
        subscription_item_id: str,
        period_start: datetime,
        period_end: datetime,
    ) -> List[UsageRecord]:
        """List usage records for period."""
```

### Step 2: Tiered Pricing Calculator

**File:** `src/billing/tiered_pricing.py`

```python
@dataclass
class PricingTier:
    up_to: Optional[int]  # None = unlimited
    price_per_unit: Decimal
    flat_amount: Decimal = Decimal("0")

class TieredPricingCalculator:
    """Calculate charges with graduated tiered pricing."""

    def calculate(self, quantity: int, tiers: List[PricingTier]) -> Decimal:
        """Calculate total charge using graduated tiers."""
        # Tier 1: 0-1000 units @ $0.10
        # Tier 2: 1001-5000 units @ $0.08
        # Tier 3: 5001+ units @ $0.05
```

### Step 3: Period End Sync Service

**File:** `src/billing/period_end_sync.py`

```python
class PeriodEndSyncService:
    """Sync usage at billing period end."""

    async def sync_all_tenants(self, period_end: datetime) -> SyncResult:
        """Sync usage for all active tenants."""

    async def sync_tenant(
        self,
        tenant_id: str,
        subscription_item_id: str,
        period_end: datetime,
    ) -> TenantSyncResult:
        """Sync usage for single tenant."""
```

### Step 4: Cron Job Integration

**File:** `src/core/scheduler.py` (modify)

```python
# Add scheduled job for period end sync
scheduler.add_job(
    id="period_end_usage_sync",
    func=period_end_sync_job,
    trigger="cron",
    day="last",  # Last day of month
    hour=23,
    minute=59,
)
```

### Step 5: Manual Sync Endpoint

**File:** `src/api/billing_endpoints.py` (modify)

```python
@billing_router.post("/usage/sync")
async def manual_usage_sync(
    tenant_id: Optional[str] = None,
    period_end: Optional[date] = None,
) -> SyncResponse:
    """Manually trigger usage sync (for testing/admin)."""
```

---

## Todo List

- [ ] 6.1.1: Tạo `StripeUsageRecordsClient` class
- [ ] 6.1.2: Implement `create_usage_record()` method
- [ ] 6.1.3: Implement `list_usage_records()` method
- [ ] 6.1.4: Tạo `TieredPricingCalculator` class
- [ ] 6.1.5: Implement graduated tier calculation
- [ ] 6.1.6: Tạo `PeriodEndSyncService` class
- [ ] 6.1.7: Implement `sync_all_tenants()` method
- [ ] 6.1.8: Implement `sync_tenant()` method
- [ ] 6.1.9: Add cron job to scheduler
- [ ] 6.1.10: Add manual sync endpoint
- [ ] 6.1.11: Test với Stripe test mode

---

## Success Criteria

1. ✅ Cron job chạy lúc 23:59 UTC ngày cuối tháng
2. ✅ Usage records được sync lên Stripe thành công
3. ✅ Overage charges tính đúng theo tiered pricing
4. ✅ Invoice generated với correct line items
5. ✅ Manual sync endpoint hoạt động
6. ✅ Idempotency: không tạo duplicate records

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Stripe API rate limit (100 req/s) | High | Batch requests + backoff |
| Subscription item not found | Medium | Log error + skip tenant |
| Usage buffer empty | Low | Sync zero usage |
| Timezone mismatch | Medium | Use UTC everywhere |

---

## Security Considerations

- Stripe API key stored in env vars (STRIPE_SECRET_KEY)
- Idempotency keys for all usage record creates
- Audit log tất cả sync operations

---

## Next Steps

1. Implement Stripe Usage Records Client
2. Test tiered pricing calculator
3. Deploy period end sync job
4. Verify invoices generated correctly
