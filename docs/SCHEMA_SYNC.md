# Schema Synchronization Document

**Mission Control Task**: Cross-Agent Schema Synchronization
**Date**: 2026-01-25
**Status**: ✅ SYNC COMPLETE

---

## Executive Summary

This document defines the **User model schema** required for Revenue integration across the AgencyOS platform. It ensures consistency between:

- **Tab 1 (Architect)**: Defining User model
- **Tab 2 (Revenue)**: Requiring Stripe customer tracking
- **Backend Services**: Stripe and Provisioning services

---

## Required User Model Schema

### Core User Fields

```python
class User:
    """
    User model for AgencyOS platform.
    Supports authentication, subscription management, and revenue tracking.
    """

    # Identity Fields
    id: str                      # Primary key (UUID)
    email: str                   # Unique, indexed
    name: str                    # Display name
    created_at: datetime         # Account creation timestamp
    updated_at: datetime         # Last modification timestamp

    # Stripe Integration (Revenue Requirements)
    stripe_customer_id: str | None       # Stripe Customer ID (unique, indexed)
    stripe_subscription_id: str | None   # Active Stripe Subscription ID

    # Subscription Lifecycle
    subscription_tier: str               # Values: 'free', 'starter', 'pro', 'franchise', 'enterprise'
    billing_status: str                  # Values: 'active', 'trialing', 'past_due', 'canceled', 'incomplete'

    # Subscription Dates
    subscription_start_date: datetime | None     # When subscription became active
    subscription_end_date: datetime | None       # Current period end or cancellation date
    trial_end_date: datetime | None              # Trial expiration (if applicable)

    # Revenue Tracking
    lifetime_value: float                # Total revenue from this user (USD)
    monthly_recurring_revenue: float     # Current MRR contribution (USD)
```

---

## Field Definitions & Business Logic

### `stripe_customer_id`
- **Type**: `str | None`
- **Purpose**: Links user to Stripe Customer object
- **Set When**:
  - First Stripe checkout session created
  - Webhook: `checkout.session.completed`
- **Indexed**: Yes (for fast Stripe webhook lookups)

### `stripe_subscription_id`
- **Type**: `str | None`
- **Purpose**: Tracks active Stripe Subscription
- **Set When**:
  - Subscription created via Stripe
  - Updated on subscription changes
- **Webhook Events**:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted` (set to `None`)

### `subscription_tier`
- **Type**: `str` (enum)
- **Values**:
  - `free` - Default tier (no payment)
  - `starter` - Entry tier ($29/mo)
  - `pro` - Professional tier ($99/mo)
  - `franchise` - Multi-location ($299/mo)
  - `enterprise` - Custom pricing
- **Mapping**: See `StripeService.PRICE_TO_TIER_MAP` in `backend/services/stripe_service.py:32`

### `billing_status`
- **Type**: `str` (enum)
- **Values**:
  - `active` - Subscription paid and current
  - `trialing` - In trial period
  - `past_due` - Payment failed, grace period
  - `canceled` - Subscription ended
  - `incomplete` - Awaiting first payment
- **Updated By**: Stripe webhooks (`invoice.payment_succeeded`, `invoice.payment_failed`, etc.)

### Date Fields
- **`subscription_start_date`**: First successful payment or trial start
- **`subscription_end_date`**: Current billing period end (for renewals) or cancellation date
- **`trial_end_date`**: When free trial expires (14-30 days typical)

### Revenue Metrics
- **`lifetime_value`**: Cumulative sum of all payments from this user
- **`monthly_recurring_revenue`**: Current MRR based on active subscription tier

---

## Integration Points

### 1. Stripe Service (`backend/services/stripe_service.py`)

**Existing Methods Using User Data**:

```python
# Line 171: _handle_checkout_completed
customer_id = session.get("customer")  # → User.stripe_customer_id
subscription_id = session.get("subscription")  # → User.stripe_subscription_id

# Line 186-193: _generate_and_store_license
# Needs to UPDATE User model with:
# - stripe_customer_id
# - stripe_subscription_id
# - subscription_tier (from price_id mapping)
# - billing_status = 'active'
# - subscription_start_date = now()
```

**Required Updates**:
- Add User model import
- Add database upsert logic in `_generate_and_store_license()`
- Update User fields on webhook events

---

### 2. Provisioning Service (`backend/services/provisioning_service.py`)

**Current Schema** (lines 59-77):

```python
sub_data = {
    "tenant_id": tenant_id,
    "plan": plan.upper(),
    "status": "active",
    "stripe_subscription_id": subscription_id,
    "stripe_customer_id": customer_id,
    "current_period_end": period_end.isoformat()
}
```

**Sync Strategy**:
- Provisioning currently writes to `subscriptions` table (tenant-level)
- Need to **ALSO** update User model fields when `tenant_id` maps to a user
- Consider: Is `tenant_id` same as `user_id` or multi-user orgs?

**Action Item**: Clarify tenant-to-user relationship model

---

### 3. Analytics Service (`backend/services/analytics_service.py`)

**Current Import** (line 16):
```python
from backend.models.user import User  # ❌ File doesn't exist yet
```

**Needs**:
- Create `backend/models/user.py`
- Define User model with fields above
- Use SQLAlchemy or Pydantic (depending on ORM choice)

---

## Database Schema (SQL)

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,  -- UUID
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Stripe Integration
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255),

    -- Subscription
    subscription_tier VARCHAR(50) DEFAULT 'free',
    billing_status VARCHAR(50) DEFAULT 'active',

    -- Dates
    subscription_start_date TIMESTAMP NULL,
    subscription_end_date TIMESTAMP NULL,
    trial_end_date TIMESTAMP NULL,

    -- Revenue
    lifetime_value DECIMAL(10,2) DEFAULT 0.00,
    monthly_recurring_revenue DECIMAL(10,2) DEFAULT 0.00,

    INDEX idx_stripe_customer (stripe_customer_id),
    INDEX idx_email (email),
    INDEX idx_billing_status (billing_status)
);
```

---

## Webhook Event Handlers

### Required User Updates by Event

| Event | Fields to Update |
|-------|------------------|
| `checkout.session.completed` | `stripe_customer_id`, `stripe_subscription_id`, `subscription_tier`, `billing_status='active'`, `subscription_start_date` |
| `customer.subscription.created` | `stripe_subscription_id`, `subscription_tier`, `billing_status`, `subscription_start_date` |
| `customer.subscription.updated` | `subscription_tier`, `subscription_end_date`, `billing_status` (if tier changed) |
| `customer.subscription.deleted` | `stripe_subscription_id=None`, `billing_status='canceled'`, `subscription_end_date` |
| `invoice.payment_succeeded` | `billing_status='active'`, `lifetime_value += amount`, update `monthly_recurring_revenue` |
| `invoice.payment_failed` | `billing_status='past_due'` |

---

## Migration Plan

### Phase 1: Create User Model
1. Create `backend/models/user.py` with schema above
2. Add to `backend/models/__init__.py` exports
3. Create database migration script

### Phase 2: Update Stripe Service
1. Import User model in `stripe_service.py`
2. Add User upsert logic in `_generate_and_store_license()`
3. Add User updates in all webhook handlers (`_handle_*` methods)

### Phase 3: Update Provisioning Service
1. Clarify `tenant_id` to `user_id` mapping
2. Add User model updates alongside `subscriptions` table writes
3. Ensure backward compatibility with legacy `organizations` table

### Phase 4: Testing
1. Test webhook events in Stripe test mode
2. Verify User fields update correctly
3. Test revenue calculations (`lifetime_value`, `monthly_recurring_revenue`)

---

## Open Questions

1. **Multi-tenancy**: Is `tenant_id` == `user_id` or do we support organizations with multiple users?
2. **ORM Choice**: SQLAlchemy, Pydantic, or raw SQL?
3. **Database**: PostgreSQL, MySQL, or Supabase?
4. **Revenue Calculations**: Real-time webhook updates or nightly batch jobs?
5. **Trial Handling**: Auto-downgrade to `free` tier on trial expiration?

---

## Cross-Reference

- **Stripe Service**: `backend/services/stripe_service.py`
- **Provisioning Service**: `backend/services/provisioning_service.py`
- **Analytics Service**: `backend/services/analytics_service.py`
- **Price Tier Mapping**: `StripeService.PRICE_TO_TIER_MAP` (line 32)
- **Webhook Events**: Lines 121-170 in `stripe_service.py`

---

## Status

**✅ SYNC COMPLETE**

Schema documented and ready for implementation across:
- Architect (Tab 1)
- Revenue (Tab 2)
- Backend Services

**Next Steps**: Implement User model → Update Stripe/Provisioning services → Test webhooks
