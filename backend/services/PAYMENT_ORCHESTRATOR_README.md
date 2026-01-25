# Payment Orchestrator - Defense in Depth

**Strategy:** PayPal = Main Force, Polar = Reserve Force

## Architecture

The Payment Orchestrator implements a **multi-provider failover system** using the Adapter Pattern with automatic provider switching.

### Components

```
┌─────────────────────────────────────┐
│   PaymentOrchestrator               │
│   - Smart routing logic             │
│   - Automatic failover              │
│   - Statistics tracking             │
└─────────────────────────────────────┘
           │
           ├──────────────┬──────────────┐
           │              │              │
    ┌──────▼─────┐ ┌─────▼──────┐ ┌────▼─────┐
    │  PayPal    │ │   Polar    │ │  Future  │
    │  Provider  │ │  Provider  │ │ Provider │
    └────────────┘ └────────────┘ └──────────┘
         │              │
    ┌────▼─────┐   ┌────▼─────┐
    │ PayPal   │   │  Polar   │
    │   SDK    │   │   SDK    │
    └──────────┘   └──────────┘
```

### Key Files

- **`backend/services/payment_orchestrator.py`** - Core orchestration logic
- **`backend/core/config/payment_config.py`** - Configuration management
- **`backend/tests/test_payment_orchestrator.py`** - Unit tests

## Failover Strategy

### 1. Error Classification

| Error Type | Behavior | Example |
|------------|----------|---------|
| **5xx errors** | Failover to next provider | PayPal 503, 500 |
| **Timeouts** | Failover to next provider | Connection timeout |
| **4xx errors** | No failover (permanent) | Invalid plan ID, auth failure |

### 2. Provider Order

Default: **PayPal → Polar**

```python
orchestrator = PaymentOrchestrator(
    provider_order=["paypal", "polar"]
)
```

Override per-request:
```python
result = orchestrator.create_checkout_session(
    amount=99.99,
    preferred_provider="polar"  # Use Polar first
)
```

### 3. Automatic Failover Flow

```
1. Try PayPal
   ├─ Success ✅ → Return result
   ├─ 5xx/Timeout ⚠️ → Log failover, try Polar
   └─ 4xx ❌ → Fail immediately (no retry)

2. Try Polar (if PayPal failed)
   ├─ Success ✅ → Return result
   └─ Failure ❌ → Raise PaymentError
```

## Usage

### Basic Checkout Session

```python
from backend.services.payment_orchestrator import PaymentOrchestrator

orchestrator = PaymentOrchestrator()

result = orchestrator.create_checkout_session(
    amount=99.99,
    currency="USD",
    mode="subscription",
    price_id="plan_123",
    success_url="https://example.com/success",
    cancel_url="https://example.com/cancel",
    customer_email="user@example.com",
    tenant_id="tenant_abc"
)

# Result includes provider used
print(result["provider"])  # "paypal" or "polar"
print(result["url"])       # Checkout URL
```

### Webhook Verification

```python
# Route webhook to specific provider
event = orchestrator.verify_webhook(
    provider="paypal",
    headers=request.headers,
    body=request.body,
    webhook_secret="whsec_..."
)
```

### Subscription Cancellation

```python
result = orchestrator.cancel_subscription(
    provider="paypal",
    subscription_id="I-ABC123",
    reason="Customer request"
)
```

### Statistics Tracking

```python
stats = orchestrator.get_stats()
print(stats)
# {
#     "total_requests": 100,
#     "failovers": 5,
#     "provider_usage": {"paypal": 95, "polar": 5},
#     "failover_rate": 0.05
# }
```

## Configuration

### Environment Variables

```bash
# Provider order (comma-separated)
PAYMENT_PROVIDER_ORDER=paypal,polar

# PayPal credentials
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox  # or "live"
PAYPAL_WEBHOOK_ID=your_webhook_id

# Polar credentials
POLAR_API_KEY=your_api_key
POLAR_WEBHOOK_SECRET=your_webhook_secret
POLAR_BASE_URL=https://api.polar.sh

# Failover settings
PAYMENT_MAX_RETRIES=2
PAYMENT_TIMEOUT=30
```

### Load Configuration

```python
from backend.core.config.payment_config import get_payment_config

config = get_payment_config()
print(config.provider_order)  # ["paypal", "polar"]
print(config.get_available_providers())  # ["paypal", "polar"]
```

## Testing

### Run Unit Tests

```bash
pytest backend/tests/test_payment_orchestrator.py -v
```

### Test Coverage

- ✅ PayPal success (no failover)
- ✅ PayPal 5xx → Polar failover
- ✅ PayPal timeout → Polar failover
- ✅ PayPal 4xx (no failover)
- ✅ All providers fail
- ✅ Statistics tracking
- ✅ Webhook routing
- ✅ Subscription cancellation

### Manual Testing

```python
# Test PayPal failover
from backend.services.payment_orchestrator import PaymentOrchestrator

orchestrator = PaymentOrchestrator()

# This will try PayPal first, fallback to Polar on error
result = orchestrator.create_checkout_session(
    amount=1.00,
    mode="payment"
)
```

## Extending the System

### Add New Provider

1. **Implement IPaymentProvider interface:**

```python
from backend.services.payment_orchestrator import IPaymentProvider

class StripeProvider(IPaymentProvider):
    def get_name(self) -> str:
        return "stripe"

    def is_available(self) -> bool:
        return bool(self.client)

    def create_checkout_session(self, **kwargs):
        # Implementation
        pass

    def verify_webhook(self, headers, body, webhook_secret):
        # Implementation
        pass

    def cancel_subscription(self, subscription_id, reason):
        # Implementation
        pass
```

2. **Register provider:**

```python
orchestrator = PaymentOrchestrator(
    provider_order=["paypal", "stripe", "polar"]
)
orchestrator.providers["stripe"] = StripeProvider()
```

## Monitoring & Alerts

### Log Monitoring

Failover events are logged with context:

```
WARNING PAYMENT FAILOVER: paypal -> polar | Reason: PayPal 503 Service Unavailable | Total failovers: 1
```

### Metrics to Track

- **Failover rate:** `stats["failover_rate"]`
- **Provider distribution:** `stats["provider_usage"]`
- **Total requests:** `stats["total_requests"]`

### Alert Thresholds

- Failover rate > 10% → Investigate PayPal reliability
- Failover rate > 50% → Critical PayPal issues

## Security Considerations

1. **Webhook Verification:** Always verify webhook signatures
2. **Credential Storage:** Use environment variables or secrets manager
3. **PCI Compliance:** No card data stored in application
4. **Audit Trail:** All failovers logged with timestamps

## Production Checklist

- [ ] Set `PAYPAL_MODE=live` for production
- [ ] Configure webhook secrets for both providers
- [ ] Set up monitoring alerts for failover rate
- [ ] Test failover behavior in staging
- [ ] Verify both provider credentials are valid
- [ ] Review provider order priority
- [ ] Set timeout values appropriately

## Future Enhancements

- [ ] Add Stripe as third provider
- [ ] Implement circuit breaker pattern
- [ ] Add provider health checks
- [ ] Implement retry with exponential backoff
- [ ] Add database logging for failover events
- [ ] Create admin dashboard for stats visualization

---

**Status:** ✅ PAYMENT SYSTEM READY

**Providers:** PayPal (Primary), Polar (Backup)

**Failover:** Automatic on 5xx/Timeout
