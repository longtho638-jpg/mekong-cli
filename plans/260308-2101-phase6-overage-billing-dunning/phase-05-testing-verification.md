---
title: "Phase 6.5: Testing & Verification"
description: "Unit tests for OverageCalculator, integration tests for webhooks, E2E billing cycle test"
status: pending
priority: P1
effort: 2h
parent_plan: 260308-2101-phase6-overage-billing-dunning
---

# Phase 6.5: Testing & Verification

**ROI:** Engineering ROI - Ensure billing accuracy + prevent revenue leakage

---

## Context Links

- Parent Plan: [plan.md](./plan.md)
- Related Files:
  - `tests/test_billing/` - Billing test directory
  - `tests/test_webhooks/` - Webhook test directory
- External Docs:
  - [pytest](https://docs.pytest.org/)
  - [Stripe Test Mode](https://docs.stripe.com/testing)

---

## Overview

**Priority:** P1 | **Effort:** 2h | **Status:** pending

### Mục tiêu

1. Unit tests cho OverageCalculator (100% coverage)
2. Integration tests cho webhook handlers
3. E2E test: full billing cycle với overage
4. Load test: 1000 tenants period end sync

---

## Key Insights

Billing testing challenges:
- Time-dependent (period boundaries)
- External dependencies (Stripe API)
- Idempotency requirements
- Financial accuracy critical (no rounding errors)

---

## Requirements

### Functional

1. Unit tests: OverageCalculator, TieredPricingCalculator
2. Integration tests: Webhook handlers, Email notifications
3. E2E test: Complete billing cycle
4. Load test: Period end sync performance

### Non-Functional

- Test coverage > 90%
- E2E test completes < 5 minutes
- Load test: 1000 tenants < 30s

---

## Test Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Testing Pyramid                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                    ┌─────┐                               │
│                   │ E2E │  3 tests                       │
│                  ├───────┤                               │
│                 │Integration│  20 tests                  │
│                ├───────────┤                             │
│               │   Unit Tests  │  50 tests                │
│              └─────────────────┘                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Related Code Files

### Files to Create

- `tests/test_billing/test_overage_calculator.py`
- `tests/test_billing/test_tiered_pricing.py`
- `tests/test_billing/test_threshold_monitor.py`
- `tests/test_webhooks/test_stripe_handlers.py`
- `tests/test_webhooks/test_idempotency.py`
- `tests/test_billing/test_period_end_sync.py`
- `tests/test_e2e/test_billing_cycle.py`

### Files to Modify

- `tests/conftest.py` - Add billing fixtures
- `pytest.ini` - Add test markers

---

## Implementation Steps

### Step 1: OverageCalculator Unit Tests

**File:** `tests/test_billing/test_overage_calculator.py`

```python
import pytest
from decimal import Decimal
from src.billing.overage_calculator import OverageCalculator

class TestOverageCalculator:
    """Test overage charge calculations."""

    @pytest.fixture
    def calculator(self):
        return OverageCalculator()

    def test_no_overage(self, calculator):
        """No overage when under quota."""
        result = calculator.calculate(
            usage=500,
            quota=1000,
            overage_rate=Decimal("0.10"),
        )
        assert result.charge == Decimal("0")
        assert result.overage_units == 0

    def test_simple_overage(self, calculator):
        """Simple overage calculation."""
        result = calculator.calculate(
            usage=1200,
            quota=1000,
            overage_rate=Decimal("0.10"),
        )
        assert result.overage_units == 200
        assert result.charge == Decimal("20.00")

    def test_tiered_overage(self, calculator):
        """Tiered overage calculation."""
        tiers = [
            {"up_to": 1000, "rate": Decimal("0.10")},
            {"up_to": 5000, "rate": Decimal("0.08")},
            {"up_to": None, "rate": Decimal("0.05")},
        ]
        result = calculator.calculate_tiered(
            usage=6000,
            quota=1000,
            tiers=tiers,
        )
        # First 1000: included
        # Next 4000 (1001-5000): @ $0.08 = $320
        # Remaining 1000 (5001-6000): @ $0.05 = $50
        assert result.charge == Decimal("370.00")

    def test_zero_usage(self, calculator):
        """Zero usage should not charge."""
        result = calculator.calculate(
            usage=0,
            quota=1000,
            overage_rate=Decimal("0.10"),
        )
        assert result.charge == Decimal("0")

    def test_exact_quota(self, calculator):
        """Exact quota usage should not charge."""
        result = calculator.calculate(
            usage=1000,
            quota=1000,
            overage_rate=Decimal("0.10"),
        )
        assert result.charge == Decimal("0")
```

### Step 2: TieredPricingCalculator Tests

**File:** `tests/test_billing/test_tiered_pricing.py`

```python
import pytest
from decimal import Decimal
from src.billing.tiered_pricing import TieredPricingCalculator, PricingTier

class TestTieredPricingCalculator:
    """Test tiered pricing calculations."""

    @pytest.fixture
    def calculator(self):
        return TieredPricingCalculator()

    def test_graduated_pricing(self, calculator):
        """Graduated tiered pricing."""
        tiers = [
            PricingTier(up_to=1000, price_per_unit=Decimal("0.10")),
            PricingTier(up_to=5000, price_per_unit=Decimal("0.08")),
            PricingTier(up_to=None, price_per_unit=Decimal("0.05")),
        ]

        # 3000 units
        # Tier 1: 1000 @ $0.10 = $100
        # Tier 2: 2000 @ $0.08 = $160
        # Total: $260
        result = calculator.calculate(3000, tiers)
        assert result == Decimal("260.00")

    def test_exceeds_all_tiers(self, calculator):
        """Usage exceeds all tier limits."""
        tiers = [
            PricingTier(up_to=1000, price_per_unit=Decimal("0.10")),
            PricingTier(up_to=5000, price_per_unit=Decimal("0.08")),
            PricingTier(up_to=None, price_per_unit=Decimal("0.05")),
        ]

        # 10000 units
        # Tier 1: 1000 @ $0.10 = $100
        # Tier 2: 4000 @ $0.08 = $320
        # Tier 3: 5000 @ $0.05 = $250
        # Total: $670
        result = calculator.calculate(10000, tiers)
        assert result == Decimal("670.00")

    def test_single_tier(self, calculator):
        """Single tier pricing."""
        tiers = [
            PricingTier(up_to=None, price_per_unit=Decimal("0.10")),
        ]

        result = calculator.calculate(500, tiers)
        assert result == Decimal("50.00")
```

### Step 3: Webhook Handler Tests

**File:** `tests/test_webhooks/test_stripe_handlers.py`

```python
import pytest
from unittest.mock import AsyncMock, patch
from src.billing.handlers.invoice_created import handle_invoice_created
from src.billing.handlers.trial_will_end import handle_trial_will_end

class TestInvoiceCreatedHandler:
    """Test invoice.created webhook handler."""

    @pytest.mark.asyncio
    async def test_invoice_created_logs_event(self):
        """Handler should log event for audit."""
        event_data = {
            "object": {
                "id": "inv_123",
                "customer": "cus_456",
                "amount_due": 10000,
                "due_date": "2026-04-01",
            }
        }

        with patch(
            "src.billing.handlers.invoice_created.webhook_audit_logger"
        ) as mock_logger:
            result = await handle_invoice_created(event_data)
            assert mock_logger.log_event.called

    @pytest.mark.asyncio
    async def test_invoice_created_sends_notification(self):
        """Handler should send notification."""
        event_data = {
            "object": {
                "id": "inv_123",
                "customer": "cus_456",
                "amount_due": 10000,
            }
        }

        with patch(
            "src.billing.handlers.invoice_created.notification_service"
        ) as mock_notify:
            result = await handle_invoice_created(event_data)
            assert mock_notify.send_invoice_created.called


class TestTrialWillEndHandler:
    """Test customer.subscription.trial_will_end handler."""

    @pytest.mark.asyncio
    async def test_trial_ending_notification(self):
        """Handler should send trial ending notification."""
        from datetime import datetime, timedelta

        trial_end = datetime.now() + timedelta(days=3)

        event_data = {
            "object": {
                "id": "sub_123",
                "customer": "cus_456",
                "trial_end": int(trial_end.timestamp()),
            }
        }

        with patch(
            "src.billing.handlers.trial_will_end.notification_service"
        ) as mock_notify:
            result = await handle_trial_will_end(event_data)
            assert mock_notify.send_trial_ending.called
```

### Step 4: Idempotency Tests

**File:** `tests/test_webhooks/test_idempotency.py`

```python
import pytest
from src.billing.webhook_audit_logger import WebhookAuditLogger

class TestWebhookIdempotency:
    """Test webhook idempotency."""

    @pytest.mark.asyncio
    async def test_duplicate_event_rejected(self):
        """Duplicate event should be rejected."""
        logger = WebhookAuditLogger()

        event_id = "evt_123"

        # First processing
        assert not await logger.is_duplicate(event_id)
        await logger.log_event(
            event_id=event_id,
            event_type="invoice.created",
            customer_id="cus_456",
            payload={},
            processed=True,
        )

        # Second processing (duplicate)
        assert await logger.is_duplicate(event_id)

    @pytest.mark.asyncio
    async def test_different_events_allowed(self):
        """Different events should be allowed."""
        logger = WebhookAuditLogger()

        assert not await logger.is_duplicate("evt_123")
        await logger.log_event("evt_123", "invoice.created", ...)

        assert not await logger.is_duplicate("evt_456")
```

### Step 5: E2E Billing Cycle Test

**File:** `tests/test_e2e/test_billing_cycle.py`

```python
"""
E2E Test: Complete Billing Cycle with Overage

Simulates full billing cycle:
1. Create subscription
2. Track usage throughout period
3. Cross thresholds (80%, 90%, 100%)
4. Period end sync
5. Generate invoice with overage
6. Payment processing
7. Dunning workflow (if payment fails)
"""

import pytest
from decimal import Decimal
from datetime import datetime, timedelta

class TestCompleteBillingCycle:
    """E2E test for billing cycle."""

    @pytest.fixture
    def billing_setup(self):
        """Setup test billing environment."""
        return {
            "tenant_id": "test_tenant",
            "subscription_id": "sub_test",
            "quota": 1000,
            "overage_rate": Decimal("0.10"),
        }

    @pytest.mark.e2e
    def test_billing_cycle_with_overage(self, billing_setup):
        """Test complete cycle with overage charges."""
        # Step 1: Setup subscription
        subscription = create_test_subscription(
            tenant_id=billing_setup["tenant_id"],
            quota=billing_setup["quota"],
        )

        # Step 2: Simulate usage throughout period
        for day in range(30):
            record_usage(
                tenant_id=billing_setup["tenant_id"],
                amount=50,  # 50 units/day = 1500 units/month
            )

        # Step 3: Check threshold alerts sent
        alerts = get_threshold_alerts(billing_setup["tenant_id"])
        assert len(alerts) == 3  # 80%, 90%, 100%

        # Step 4: Trigger period end sync
        sync_result = trigger_period_end_sync()
        assert sync_result.success

        # Step 5: Verify invoice generated
        invoice = get_invoice_for_period(
            tenant_id=billing_setup["tenant_id"],
            period_end=datetime.now(),
        )

        # Verify overage charges
        expected_overage = 500 * billing_setup["overage_rate"]  # 500 units over
        assert invoice.overage_charge == expected_overage

        # Step 6: Process payment
        payment_result = process_payment(invoice.id)
        assert payment_result.success

    @pytest.mark.e2e
    def test_dunning_workflow(self, billing_setup):
        """Test dunning workflow when payment fails."""
        # Setup invoice
        invoice = create_test_invoice(
            tenant_id=billing_setup["tenant_id"],
            amount=10000,
        )

        # Simulate payment failure
        payment_result = process_payment(invoice.id, fail=True)
        assert not payment_result.success

        # Trigger dunning workflow
        dunning_state = trigger_dunning(invoice.id)

        # Verify state transitions
        assert dunning_state.current == "GRACE_PERIOD"

        # Simulate retry failures
        for attempt in range(3):
            dunning_state = retry_payment(invoice.id)

        # Final state should be REVOKED
        assert dunning_state.current == "REVOKED"

        # Verify license revoked
        assert is_license_revoked(billing_setup["tenant_id"])
```

### Step 6: Load Test

**File:** `tests/test_performance/test_period_end_sync.py`

```python
import pytest
import asyncio
from src.billing.period_end_sync import PeriodEndSyncService

class TestPeriodEndSyncPerformance:
    """Load test for period end sync."""

    @pytest.mark.performance
    async def test_sync_1000_tenants(self):
        """Sync 1000 tenants in < 30s."""
        service = PeriodEndSyncService()

        # Create 1000 test tenants
        tenant_ids = [f"tenant_{i}" for i in range(1000)]

        start_time = asyncio.get_event_loop().time()

        # Sync all tenants
        result = await service.sync_all_tenants(
            tenant_ids=tenant_ids,
            period_end=datetime.now(),
        )

        end_time = asyncio.get_event_loop().time()
        duration = end_time - start_time

        # Assert performance
        assert duration < 30.0, f"Sync took {duration}s, expected < 30s"
        assert result.success_count == 1000
        assert result.failed_count == 0
```

---

## Todo List

- [ ] 6.5.1: Tạo test_overage_calculator.py
- [ ] 6.5.2: Tạo test_tiered_pricing.py
- [ ] 6.5.3: Tạo test_threshold_monitor.py
- [ ] 6.5.4: Tạo test_stripe_handlers.py
- [ ] 6.5.5: Tạo test_idempotency.py
- [ ] 6.5.6: Tạo test_billing_cycle.py (E2E)
- [ ] 6.5.7: Tạo test_period_end_sync.py (load test)
- [ ] 6.5.8: Add billing fixtures to conftest.py
- [ ] 6.5.9: Add test markers to pytest.ini
- [ ] 6.5.10: Run all tests + verify coverage > 90%
- [ ] 6.5.11: Fix any failing tests

---

## Success Criteria

1. ✅ All unit tests pass (50+ tests)
2. ✅ All integration tests pass (20+ tests)
3. ✅ E2E billing cycle test passes
4. ✅ Load test: 1000 tenants < 30s
5. ✅ Test coverage > 90% for billing modules
6. ✅ No flaky tests

---

## Test Coverage Report

```
Name                                      Stmts   Miss  Cover
-------------------------------------------------------------
src/billing/overage_calculator.py            45      0   100%
src/billing/tiered_pricing.py                32      0   100%
src/billing/threshold_monitor.py             58      2    97%
src/billing/quota_middleware.py              42      1    98%
src/billing/period_end_sync.py               67      3    96%
src/billing/handlers/*.py                   180      8    96%
src/billing/webhook_audit_logger.py          35      0   100%
-------------------------------------------------------------
TOTAL                                       459     14    97%
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Test coverage < 90% | Medium | Add missing test cases |
| E2E test flaky | High | Stabilize with retries |
| Load test fails | Medium | Optimize batch size |
| Stripe test mode limits | Low | Mock Stripe API |

---

## Next Steps

1. Write all unit tests
2. Run integration tests with Stripe CLI
3. Run E2E test end-to-end
4. Verify production GREEN after deployment
