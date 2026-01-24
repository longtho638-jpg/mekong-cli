# Stripe Payment Service

Comprehensive Stripe payment integration for AgencyOS subscription management.

## Features

1. ✅ **Create checkout session** for subscription purchases
2. ✅ **Handle webhook events** (payment.succeeded, subscription.updated, etc.)
3. ✅ **Map Stripe product IDs** to license tiers (starter, pro, franchise, enterprise)
4. ✅ **Cancel subscriptions** programmatically
5. ✅ **Get subscription status** and details
6. ✅ **Auto-generate license keys** on successful payment
7. ✅ **Database integration** with Supabase for subscriptions and licenses

## Installation

The service uses the `stripe` Python SDK. If not available, it gracefully falls back to mock mode.

```bash
pip install stripe
```

## Configuration

Set your Stripe API keys in `.env`:

```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Usage

### 1. Initialize the Service

```python
from backend.services import StripeService

stripe_service = StripeService()

# Check if configured
if stripe_service.is_configured():
    print("Stripe is ready!")
```

### 2. Create Checkout Session

```python
# Create checkout for Pro tier subscription
session = stripe_service.create_checkout_session(
    tier="pro",
    customer_email="user@example.com",
    tenant_id="org_abc123",
    success_url="https://app.agencyos.network/success",
    cancel_url="https://app.agencyos.network/cancel"
)

# Redirect user to Stripe checkout
print(f"Redirect to: {session['url']}")
```

**With custom price ID:**

```python
session = stripe_service.create_checkout_session(
    tier="enterprise",
    customer_email="enterprise@example.com",
    tenant_id="org_xyz789",
    success_url="https://app.agencyos.network/success",
    cancel_url="https://app.agencyos.network/cancel",
    price_id="price_enterprise_yearly"  # Override default monthly price
)
```

### 3. Handle Webhook Events

```python
from flask import request

@app.post("/webhooks/stripe")
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        # Verify webhook signature
        event = stripe_service.client.construct_event(
            payload, sig_header, webhook_secret
        )

        # Process event
        result = stripe_service.handle_webhook_event(event)

        return {"status": "success", "result": result}, 200

    except ValueError as e:
        # Invalid payload
        return {"error": "Invalid payload"}, 400
    except Exception as e:
        # Invalid signature
        return {"error": str(e)}, 400
```

### 4. Cancel Subscription

```python
# Cancel subscription immediately
result = stripe_service.cancel_subscription("sub_abc123xyz")

print(f"Subscription cancelled: {result['status']}")
```

### 5. Get Subscription Status

```python
status = stripe_service.get_subscription_status("sub_abc123xyz")

print(f"Status: {status['status']}")
print(f"Current period ends: {status['current_period_end']}")
print(f"Cancel at period end: {status['cancel_at_period_end']}")
```

### 6. Tier ↔ Price ID Mapping

```python
# Map tier to price ID
price_id = stripe_service.map_tier_to_price("pro", "monthly")
# Returns: "price_pro_monthly"

price_id_yearly = stripe_service.map_tier_to_price("enterprise", "yearly")
# Returns: "price_enterprise_yearly"

# Map price ID to tier
tier = stripe_service.map_price_to_tier("price_franchise_monthly")
# Returns: "franchise"
```

## Supported Webhook Events

The service automatically handles these Stripe webhook events:

| Event Type | Description | Action |
|------------|-------------|--------|
| `checkout.session.completed` | Successful checkout | Generate license, store subscription |
| `customer.subscription.created` | New subscription created | Record in database |
| `customer.subscription.updated` | Subscription modified | Update status in database |
| `customer.subscription.deleted` | Subscription cancelled | Deactivate license, update status |
| `invoice.payment_succeeded` | Recurring payment success | Record payment in database |
| `invoice.payment_failed` | Payment failed | Log failure (trigger notifications) |

## License Tier Mapping

Default mapping between Stripe Price IDs and AgencyOS license tiers:

```python
PRICE_TO_TIER_MAP = {
    "price_starter_monthly": "starter",
    "price_starter_yearly": "starter",
    "price_pro_monthly": "pro",
    "price_pro_yearly": "pro",
    "price_franchise_monthly": "franchise",
    "price_franchise_yearly": "franchise",
    "price_enterprise_monthly": "enterprise",
    "price_enterprise_yearly": "enterprise",
}
```

**Customize:** Update `StripeService.PRICE_TO_TIER_MAP` with your actual Stripe Price IDs.

## Database Schema

The service expects these Supabase tables:

### `subscriptions` table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'stripe'
  subscription_id TEXT UNIQUE NOT NULL,
  customer_id TEXT,
  status TEXT NOT NULL, -- 'active', 'cancelled', 'past_due', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);
```

### `licenses` table

```sql
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_key TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  plan TEXT NOT NULL, -- 'starter', 'pro', 'franchise', 'enterprise'
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'expired'
  metadata JSONB, -- { tenant_id, stripe_subscription_id, stripe_customer_id }
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `payments` table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id TEXT REFERENCES subscriptions(subscription_id),
  provider TEXT NOT NULL, -- 'stripe'
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL, -- 'succeeded', 'failed'
  paid_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Error Handling

All methods raise appropriate exceptions:

```python
try:
    session = stripe_service.create_checkout_session(...)
except ValueError as e:
    # Configuration or validation error
    print(f"Config error: {e}")
except RuntimeError as e:
    # Stripe API error
    print(f"Stripe error: {e}")
```

## Mock Mode (Testing)

If Stripe SDK is not installed or `STRIPE_SECRET_KEY` is missing, the service enters mock mode:

```python
if not stripe_service.is_configured():
    print("Running in MOCK mode - no actual Stripe calls")
```

In mock mode, methods return dummy data for testing without real API calls.

## Integration with Payment Service

The `StripeService` integrates with the unified `PaymentService`:

```python
from backend.services import PaymentService

payment_service = PaymentService()

# PaymentService delegates to StripeService for Stripe operations
session = payment_service.create_checkout_session(
    provider="stripe",
    amount=99.00,
    price_id="price_pro_monthly",
    tenant_id="org_abc123",
    customer_email="user@example.com",
    success_url="https://app.agencyos.network/success",
    cancel_url="https://app.agencyos.network/cancel"
)
```

## Security Best Practices

1. **Always verify webhook signatures** using `construct_event()`
2. **Store webhook secret** securely in environment variables
3. **Use HTTPS** for all webhook endpoints
4. **Validate tenant_id** in metadata before provisioning
5. **Implement idempotency** - webhooks may be retried
6. **Log all payment events** for audit trail

## Testing Webhooks Locally

Use Stripe CLI to forward webhooks to localhost:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:5000/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
```

## Production Checklist

- [ ] Replace `sk_test_*` with `sk_live_*` in production
- [ ] Update webhook endpoint in Stripe Dashboard
- [ ] Configure webhook secret for production
- [ ] Update `PRICE_TO_TIER_MAP` with production Price IDs
- [ ] Test all webhook events in production mode
- [ ] Set up monitoring and alerting for failed payments
- [ ] Implement customer notification emails

## API Reference

### StripeService Methods

#### `create_checkout_session(tier, customer_email, tenant_id, success_url, cancel_url, price_id=None, mode="subscription")`

Create Stripe Checkout Session.

**Returns:** `{"id": "cs_xxx", "url": "https://checkout.stripe.com/...", "status": "created"}`

#### `handle_webhook_event(event)`

Process verified webhook event.

**Returns:** `{"status": "success|error", "message": "..."}`

#### `cancel_subscription(subscription_id)`

Cancel active subscription.

**Returns:** Stripe subscription object

#### `get_subscription_status(subscription_id)`

Get current subscription details.

**Returns:** `{"id": "sub_xxx", "status": "active", "current_period_end": 1234567890, ...}`

#### `map_price_to_tier(price_id)`

Map Stripe Price ID to license tier.

**Returns:** `"starter"|"pro"|"franchise"|"enterprise"`

#### `map_tier_to_price(tier, billing_cycle="monthly")`

Map license tier to Stripe Price ID.

**Returns:** `"price_<tier>_<cycle>"`

---

**Built with ❤️ for AgencyOS by the Binh Pháp Venture Studio**
