---
title: "Phase 6.3: Webhook Handler Expansion"
description: "Add invoice.created, customer.subscription.trial_will_end handlers, idempotency enforcement"
status: pending
priority: P1
effort: 2h
parent_plan: 260308-2101-phase6-overage-billing-dunning
---

# Phase 6.3: Webhook Handler Expansion

**ROI:** Engineering ROI - Complete webhook coverage for all billing events

---

## Context Links

- Parent Plan: [plan.md](./plan.md)
- Related Files:
  - `src/api/polar_webhook.py` - Polar webhook handler
  - `src/api/billing_endpoints.py` - Stripe webhook handler
  - `src/billing/idempotency.py` - Idempotency manager
- External Docs:
  - [Stripe Webhooks](https://docs.stripe.com/webhooks)
  - [Stripe Billing Events](https://docs.stripe.com/api/events#billing_events)

---

## Overview

**Priority:** P1 | **Effort:** 2h | **Status:** pending

### Mục tiêu

1. Add `invoice.created` handler
2. Add `customer.subscription.trial_will_end` handler
3. Idempotency enforcement via WebhookAuditLogger
4. Add `invoice.upcoming` handler for preview

---

## Key Insights

Current webhook coverage (Phase 4-5):
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `customer.subscription.updated`
- ❌ `invoice.created` (NEW)
- ❌ `customer.subscription.trial_will_end` (NEW)
- ❌ `invoice.upcoming` (NEW)
- ❌ `customer.subscription.deleted` (missing)

---

## Requirements

### Functional

1. Handle 4 new webhook events
2. Idempotency: không process cùng event 2 lần
3. Audit log tất cả webhook events
4. Webhook signature verification

### Non-Functional

- Webhook response time < 500ms
- 99.9% uptime
- Audit log retention: 90 days

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│               Webhook Handler Architecture                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Stripe/Billing Gateway                                  │
│         │                                                 │
│         ▼                                                 │
│  ┌─────────────────┐                                     │
│  │ SignatureVerify │                                     │
│  └────────┬────────┘                                     │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────┐                                     │
│  │ IdempotencyCheck│ ◄── WebhookAuditLogger             │
│  └────────┬────────┘                                     │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────┐                                     │
│  │ EventRouter     │                                     │
│  ├─────────────────┤                                     │
│  │ invoice.created │                                     │
│  │ trial_will_end  │                                     │
│  │ invoice.upcoming│                                     │
│  │ sub.deleted     │                                     │
│  └────────┬────────┘                                     │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────┐                                     │
│  │ EventHandler    │                                     │
│  └─────────────────┘                                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Related Code Files

### Files to Create

- `src/billing/webhook_audit_logger.py` - Webhook audit log
- `src/billing/handlers/invoice_created.py` - invoice.created handler
- `src/billing/handlers/trial_will_end.py` - trial_will_end handler
- `src/billing/handlers/invoice_upcoming.py` - invoice.upcoming handler
- `src/billing/handlers/subscription_deleted.py` - sub.deleted handler

### Files to Modify

- `src/api/billing_endpoints.py` - Add new webhook routes
- `src/billing/idempotency.py` - Add webhook-specific idempotency

---

## Implementation Steps

### Step 1: Webhook Audit Logger

**File:** `src/billing/webhook_audit_logger.py`

```python
class WebhookAuditLogger:
    """Log all webhook events for audit trail."""

    async def log_event(
        self,
        event_id: str,
        event_type: str,
        customer_id: str,
        payload: dict,
        processed: bool,
        error: Optional[str] = None,
    ) -> None:
        """Log webhook event."""

    async def get_event(self, event_id: str) -> Optional[dict]:
        """Get event by ID (for idempotency check)."""

    async def is_duplicate(self, event_id: str) -> bool:
        """Check if event already processed."""
```

### Step 2: invoice.created Handler

**File:** `src/billing/handlers/invoice_created.py`

```python
async def handle_invoice_created(event_data: dict) -> HandlerResult:
    """
    Handle invoice.created event.

    Actions:
    - Log invoice creation
    - Send upcoming payment notification
    - Update local invoice cache
    """
    invoice = event_data.get("object", {})
    customer_id = invoice.get("customer")
    amount = invoice.get("amount_due")
    due_date = invoice.get("due_date")

    # Log event
    await webhook_audit_logger.log_event(...)

    # Send notification
    await notification_service.send_invoice_created(...)

    return HandlerResult(success=True)
```

### Step 3: trial_will_end Handler

**File:** `src/billing/handlers/trial_will_end.py`

```python
async def handle_trial_will_end(event_data: dict) -> HandlerResult:
    """
    Handle customer.subscription.trial_will_end event.

    Actions:
    - Send trial ending notification (3 days before)
    - Offer upgrade discount
    - Prepare for automatic conversion
    """
    subscription = event_data.get("object", {})
    customer_id = subscription.get("customer")
    trial_end = subscription.get("trial_end")

    # Calculate days remaining
    days_remaining = (trial_end - datetime.now()).days

    # Send notification
    await notification_service.send_trial_ending(
        customer_id=customer_id,
        days_remaining=days_remaining,
    )

    return HandlerResult(success=True)
```

### Step 4: invoice.upcoming Handler

**File:** `src/billing/handlers/invoice_upcoming.py`

```python
async def handle_invoice_upcoming(event_data: dict) -> HandlerResult:
    """
    Handle invoice.upcoming event.

    Actions:
    - Preview upcoming charges
    - Alert if overage detected
    - Offer payment method update
    """
    invoice = event_data.get("object", {})
    customer_id = invoice.get("customer")
    total = invoice.get("total")
    lines = invoice.get("lines", [])

    # Check for overage
    overage_lines = [l for l in lines if "overage" in l.get("description", "").lower()]

    if overage_lines:
        await notification_service.send_overage_alert(
            customer_id=customer_id,
            overage_amount=sum(l["amount"] for l in overage_lines),
        )

    return HandlerResult(success=True)
```

### Step 5: subscription.deleted Handler

**File:** `src/billing/handlers/subscription_deleted.py`

```python
async def handle_subscription_deleted(event_data: dict) -> HandlerResult:
    """
    Handle customer.subscription.deleted event.

    Actions:
    - Revoke license key
    - Downgrade user role
    - Send cancellation confirmation
    - Log churn
    """
    subscription = event_data.get("object", {})
    customer_id = subscription.get("customer")
    cancel_reason = subscription.get("cancellation_details", {}).get("reason")

    # Revoke license
    await license_service.revoke_by_customer(customer_id)

    # Downgrade role
    await user_service.downgrade_role(customer_id)

    # Send confirmation
    await notification_service.send_cancellation_confirmation(
        customer_id=customer_id,
        reason=cancel_reason,
    )

    return HandlerResult(success=True)
```

### Step 6: Webhook Router Update

**File:** `src/api/billing_endpoints.py` (modify)

```python
@billing_router.post("/webhook/stripe")
async def stripe_webhook(request: Request) -> Dict[str, str]:
    """
    Stripe webhook endpoint for billing events.

    Supported events:
    - invoice.payment_succeeded
    - invoice.payment_failed
    - invoice.created (NEW)
    - invoice.upcoming (NEW)
    - customer.subscription.updated
    - customer.subscription.trial_will_end (NEW)
    - customer.subscription.deleted (NEW)
    """
    payload = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    event = await request.json()

    # Verify signature
    if not verify_webhook_signature(payload, signature, WEBHOOK_SECRET):
        raise HTTPException(401, "Invalid signature")

    # Check idempotency
    event_id = event.get("id")
    if await webhook_audit_logger.is_duplicate(event_id):
        return {"status": "duplicate", "event_id": event_id}

    # Route to handler
    handlers = {
        "invoice.created": handle_invoice_created,
        "invoice.upcoming": handle_invoice_upcoming,
        "invoice.payment_succeeded": handle_payment_succeeded,
        "invoice.payment_failed": handle_payment_failed,
        "customer.subscription.updated": handle_subscription_updated,
        "customer.subscription.trial_will_end": handle_trial_will_end,
        "customer.subscription.deleted": handle_subscription_deleted,
    }

    event_type = event.get("type")
    handler = handlers.get(event_type)

    if handler:
        result = await handler(event.get("data", {}))
        await webhook_audit_logger.log_event(
            event_id=event_id,
            event_type=event_type,
            processed=result.success,
            error=result.error,
        )
        return {"status": "received", "event_type": event_type}

    return {"status": "ignored", "event_type": event_type}
```

---

## Todo List

- [ ] 6.3.1: Tạo `WebhookAuditLogger` class
- [ ] 6.3.2: Implement `log_event()` method
- [ ] 6.3.3: Implement `is_duplicate()` method
- [ ] 6.3.4: Tạo `handlers/invoice_created.py`
- [ ] 6.3.5: Tạo `handlers/trial_will_end.py`
- [ ] 6.3.6: Tạo `handlers/invoice_upcoming.py`
- [ ] 6.3.7: Tạo `handlers/subscription_deleted.py`
- [ ] 6.3.8: Update `stripe_webhook()` router
- [ ] 6.3.9: Add idempotency check to webhook flow
- [ ] 6.3.10: Test với Stripe CLI webhook forwarding

---

## Success Criteria

1. ✅ 4 new webhook handlers implemented
2. ✅ Idempotency: không duplicate processing
3. ✅ Audit log tất cả events
4. ✅ Signature verification working
5. ✅ Webhook response time < 500ms
6. ✅ Test với Stripe CLI

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Webhook signature bypass | Critical | Unit tests + integration tests |
| Duplicate event processing | High | Idempotency check |
| Handler errors crash server | Medium | Try/catch + error logging |
| Audit log data loss | Medium | SQLite + daily backup |

---

## Security Considerations

- Webhook secret in env vars (STRIPE_WEBHOOK_SECRET)
- Event ID validation
- Signature verification before processing
- Audit log retention: 90 days

---

## Next Steps

1. Implement WebhookAuditLogger
2. Create handler modules
3. Test với Stripe CLI
4. Deploy + monitor webhook delivery
