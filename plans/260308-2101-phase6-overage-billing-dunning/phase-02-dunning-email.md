---
title: "Phase 6.2: Dunning Email Enhancement"
description: "Custom email templates for RaaS, retry logic configuration, customer portal integration"
status: pending
priority: P1
effort: 3h
parent_plan: 260308-2101-phase6-overage-billing-dunning
---

# Phase 6.2: Dunning Email Enhancement

**ROI:** Operational ROI - Reduce churn with automated dunning workflows

---

## Context Links

- Parent Plan: [plan.md](./plan.md)
- Related Files:
  - `src/billing/dunning_state_machine.py` - Dunning state machine
  - `src/billing/notification_service.py` - Email notifications
- External Docs:
  - [Resend API](https://resend.com/docs/api-reference)
  - [Stripe Dunning Best Practices](https://docs.stripe.com/billing/dunning)

---

## Overview

**Priority:** P1 | **Effort:** 3h | **Status:** pending

### Mục tiêu

1. Custom email templates cho RaaS (4 templates)
2. Retry logic configuration: 1d → 3d → 5d
3. Customer portal integration cho payment method updates

---

## Key Insights

Dunning workflow tiêu chuẩn:
```
Day 0: Payment Failed → GRACE_PERIOD → Email 1
Day 1: Retry Failed → GRACE_PERIOD → Email 2
Day 3: Retry Failed → SUSPENDED → Email 3
Day 5: Retry Failed → REVOKED → Email 4
```

---

## Requirements

### Functional

1. 4 email templates:
   - `payment_failed.html` - Grace period started
   - `grace_period_reminder.html` - 24h reminder
   - `account_suspended.html` - Suspension notice
   - `account_revoked.html` - Revocation notice
2. Retry logic: 3 attempts (1d, 3d, 5d)
3. Customer portal link trong mọi email
4. Unsubscribe link (compliance)

### Non-Functional

- Email delivery rate > 95%
- Template rendering < 100ms
- Mobile-responsive design

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Dunning Workflow                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  invoice.payment_failed                                  │
│         │                                                 │
│         ▼                                                 │
│  ┌─────────────────┐                                     │
│  │ GRACE_PERIOD    │ ◄── Email 1: Payment Failed        │
│  │ (Day 0-1)       │                                     │
│  └────────┬────────┘                                     │
│           │ retry_failed                                 │
│           ▼                                               │
│  ┌─────────────────┐                                     │
│  │ GRACE_PERIOD    │ ◄── Email 2: 24h Reminder          │
│  │ (Day 1-3)       │                                     │
│  └────────┬────────┘                                     │
│           │ retry_failed                                 │
│           ▼                                               │
│  ┌─────────────────┐                                     │
│  │ SUSPENDED       │ ◄── Email 3: Account Suspended     │
│  │ (Day 3-5)       │     (Read-only access)              │
│  └────────┬────────┘                                     │
│           │ retry_failed                                 │
│           ▼                                               │
│  ┌─────────────────┐                                     │
│  │ REVOKED         │ ◄── Email 4: Account Revoked       │
│  │ (Day 5+)        │     (License key revoked)           │
│  └─────────────────┘                                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Related Code Files

### Files to Create

- `src/billing/email_templates/payment_failed.html` - Template 1
- `src/billing/email_templates/grace_period_reminder.html` - Template 2
- `src/billing/email_templates/account_suspended.html` - Template 3
- `src/billing/email_templates/account_revoked.html` - Template 4
- `src/billing/dunning_config.py` - Dunning retry config

### Files to Modify

- `src/billing/dunning_state_machine.py` - Add retry logic
- `src/billing/notification_service.py` - Add email sending
- `src/api/billing_endpoints.py` - Add customer portal endpoint

---

## Implementation Steps

### Step 1: Email Templates

**Directory:** `src/billing/email_templates/`

```html
<!-- payment_failed.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Payment Failed - RaaS AgencyOS</title>
</head>
<body>
  <h1>Payment Issue</h1>
  <p>Your recent invoice failed to process.</p>
  <p>Amount: {{amount}}</p>
  <p>Due date: {{due_date}}</p>
  <a href="{{customer_portal_url}}">Update Payment Method</a>
  <p>Grace period: {{grace_period_days}} days</p>
</body>
</html>
```

### Step 2: Dunning Config

**File:** `src/billing/dunning_config.py`

```python
@dataclass
class DunningConfig:
    retry_attempts: int = 3
    retry_schedule: List[int] = None  # Days between attempts
    grace_period_days: int = 1
    suspension_days: int = 2
    customer_portal_url: str = "https://raas.agencyos.network/portal"

DUNNING_CONFIG = DunningConfig(
    retry_schedule=[1, 3, 5],  # 1d, 3d, 5d
)
```

### Step 3: Email Service Integration

**File:** `src/billing/notification_service.py` (modify)

```python
class BillingNotificationService:
    """Send billing notifications via Resend."""

    async def send_payment_failed(
        self,
        tenant_id: str,
        email: str,
        amount: Decimal,
        invoice_url: str,
    ) -> bool:
        """Send payment failed email."""

    async def send_grace_period_reminder(
        self,
        tenant_id: str,
        email: str,
        hours_remaining: int,
    ) -> bool:
        """Send grace period reminder."""

    async def send_account_suspended(
        self,
        tenant_id: str,
        email: str,
        reactivation_url: str,
    ) -> bool:
        """Send account suspended email."""

    async def send_account_revoked(
        self,
        tenant_id: str,
        email: str,
    ) -> bool:
        """Send account revoked email."""
```

### Step 4: Dunning State Machine Update

**File:** `src/billing/dunning_state_machine.py` (modify)

```python
class DunningStateMachine:
    """Manage dunning state transitions."""

    async def handle_payment_failed(
        self,
        tenant_id: str,
        invoice_id: str,
        amount: Decimal,
    ) -> DunningState:
        """Transition to GRACE_PERIOD."""

    async def handle_retry_failed(
        self,
        tenant_id: str,
        attempt: int,
    ) -> DunningState:
        """Transition to next state based on attempt number."""

    async def handle_payment_succeeded(
        self,
        tenant_id: str,
    ) -> DunningState:
        """Transition to ACTIVE."""
```

### Step 5: Customer Portal Endpoint

**File:** `src/api/billing_endpoints.py` (modify)

```python
@billing_router.get("/portal/session")
async def create_customer_portal_session(
    tenant_id: str,
    repository: LicenseRepository = Depends(get_repository),
) -> PortalSessionResponse:
    """Create Stripe Customer Portal session."""
    # Returns URL for tenant to update payment method
```

---

## Todo List

- [ ] 6.2.1: Tạo `email_templates/payment_failed.html`
- [ ] 6.2.2: Tạo `email_templates/grace_period_reminder.html`
- [ ] 6.2.3: Tạo `email_templates/account_suspended.html`
- [ ] 6.2.4: Tạo `email_templates/account_revoked.html`
- [ ] 6.2.5: Tạo `DunningConfig` class
- [ ] 6.2.6: Implement `send_payment_failed()` method
- [ ] 6.2.7: Implement `send_grace_period_reminder()` method
- [ ] 6.2.8: Implement `send_account_suspended()` method
- [ ] 6.2.9: Implement `send_account_revoked()` method
- [ ] 6.2.10: Update `DunningStateMachine` với retry logic
- [ ] 6.2.11: Add customer portal session endpoint
- [ ] 6.2.12: Test email delivery với Resend test mode

---

## Success Criteria

1. ✅ 4 email templates rendered correctly
2. ✅ Mobile-responsive design
3. ✅ Retry logic: 1d → 3d → 5d
4. ✅ Customer portal URL valid
5. ✅ Email delivery rate > 95% (test mode)
6. ✅ Unsubscribe link working

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Email delivery failures | High | Retry + fallback provider |
| Template rendering errors | Medium | Unit tests + validation |
| Customer portal 404 | Medium | Validate URL before send |
| Spam folder | Low | SPF/DKIM configured |

---

## Security Considerations

- Resend API key in env vars (RESEND_API_KEY)
- Tenant ID validation before sending
- No sensitive data in email (no API keys, passwords)

---

## Next Steps

1. Design email templates (Figma/HTML)
2. Integrate Resend API
3. Test dunning workflow end-to-end
4. Verify customer portal integration
