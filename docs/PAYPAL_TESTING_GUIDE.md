# PayPal Testing Guide (Sandbox Mode)

## 🎯 Overview

This guide covers testing PayPal integration in **SANDBOX** mode before going live.

## 📋 Table of Contents

- [Configuration](#configuration)
- [Sandbox Accounts](#sandbox-accounts)
- [Testing Workflows](#testing-workflows)
- [Webhook Testing](#webhook-testing)
- [Common Issues](#common-issues)
- [Go-Live Checklist](#go-live-checklist)

---

## Configuration

### Current Mode: SANDBOX ✅

The application is configured for **SANDBOX** testing:

```env
# .env
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=AapMFRkMZSPJzKxkOlNE56KXPdl5udiHDFQ46WhotoT8Yu9h-_2si4Iu2mR0piHei_R3rMOJl_LeIxtp
PAYPAL_CLIENT_SECRET=EJ6Pps2kZyUXBVRQLAn_gkvmLFNQ6zYInOMuGGumZ3em_RX_B1Sw8FpkStn0sEC4frqeCI7WT9wglHsz
```

### API Endpoints

The SDK automatically uses the correct endpoint based on mode:

- **Sandbox**: `https://api-m.sandbox.paypal.com`
- **Live**: `https://api-m.paypal.com`

Implementation in `core/finance/paypal_sdk/__init__.py`:

```python
self.base_url = (
    "https://api-m.paypal.com"
    if self.mode == "live"
    else "https://api-m.sandbox.paypal.com"
)
```

---

## Sandbox Accounts

### Access Sandbox

1. **Dashboard**: https://developer.paypal.com/dashboard/
2. **Sandbox Accounts**: Navigate to "Testing Tools" → "Sandbox Accounts"

### Test Accounts

PayPal sandbox provides two types of test accounts:

#### Business Account (Merchant)
- **Email**: Your sandbox business account email
- **Use for**: Receiving payments, webhook testing

#### Personal Account (Buyer)
- **Email**: Your sandbox personal account email
- **Password**: Available in sandbox dashboard
- **Use for**: Making test purchases

### Creating Test Accounts

1. Go to https://developer.paypal.com/dashboard/accounts
2. Click "Create Account"
3. Choose account type:
   - **Business**: For merchant testing
   - **Personal**: For buyer testing
4. Set balance (e.g., $5000 USD)
5. Save credentials

---

## Testing Workflows

### 1. Orders API Testing

#### Create Order

```python
from core.finance.paypal_sdk import PayPalSDK

sdk = PayPalSDK()  # Automatically uses sandbox mode from .env

# Create order
order = sdk.orders.create({
    "intent": "CAPTURE",
    "purchase_units": [{
        "amount": {
            "currency_code": "USD",
            "value": "100.00"
        }
    }]
})

print(f"Order ID: {order['id']}")
print(f"Approve URL: {order['links'][1]['href']}")
```

#### Capture Order

1. Visit the approve URL with sandbox buyer account
2. Log in with sandbox personal account
3. Approve payment
4. Capture the order:

```python
result = sdk.orders.capture(order_id)
print(f"Status: {result['status']}")  # Should be "COMPLETED"
```

### 2. Subscriptions Testing

#### Create Product

```python
product = sdk.catalog.create_product({
    "name": "Premium Plan",
    "description": "Monthly subscription",
    "type": "SERVICE",
    "category": "SOFTWARE"
})
```

#### Create Billing Plan

```python
plan = sdk.subscriptions.create_plan({
    "product_id": product["id"],
    "name": "Premium Monthly",
    "billing_cycles": [{
        "frequency": {
            "interval_unit": "MONTH",
            "interval_count": 1
        },
        "tenure_type": "REGULAR",
        "sequence": 1,
        "total_cycles": 0,
        "pricing_scheme": {
            "fixed_price": {
                "value": "29.99",
                "currency_code": "USD"
            }
        }
    }],
    "payment_preferences": {
        "auto_bill_outstanding": True,
        "payment_failure_threshold": 3
    }
})
```

#### Create Subscription

```python
subscription = sdk.subscriptions.create({
    "plan_id": plan["id"],
    "subscriber": {
        "email_address": "buyer@example.com"
    },
    "application_context": {
        "return_url": "https://example.com/success",
        "cancel_url": "https://example.com/cancel"
    }
})

# Get approval URL
approve_url = next(link["href"] for link in subscription["links"] if link["rel"] == "approve")
```

### 3. Frontend Checkout Testing

```bash
# Start development server
pnpm dev

# Navigate to checkout page
http://localhost:3000/checkout/demo
```

**Test Steps**:
1. Click PayPal button
2. Log in with **sandbox personal account**
3. Approve payment
4. Verify order capture in backend

### 4. Payment Orchestrator Testing

```python
from backend.services.payment_orchestrator import PaymentOrchestrator

orchestrator = PaymentOrchestrator()

# Create order with fallback chain
result = orchestrator.create_order(
    amount=100.0,
    currency="USD",
    customer_email="test@example.com"
)

print(f"Provider: {result['provider']}")  # Should be "paypal" (primary)
print(f"Order ID: {result['order_id']}")
```

---

## Webhook Testing

### Local Webhook Setup

#### 1. Install ngrok (if not already installed)

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

#### 2. Start ngrok tunnel

```bash
ngrok http 3000
```

**Output**:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

#### 3. Register Webhook in PayPal Dashboard

1. Go to https://developer.paypal.com/dashboard/
2. Navigate to your app
3. Click "Add Webhook"
4. **Webhook URL**: `https://abc123.ngrok.io/api/billing/webhook/paypal`
5. **Event types**: Select:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`

#### 4. Test Webhook

```bash
# Make a test purchase in sandbox
# Check ngrok dashboard: http://127.0.0.1:4040

# Verify webhook received
curl http://localhost:3000/api/billing/webhook/paypal/test
```

### Webhook Verification

The app uses `paypal-webhook-verifier.ts` to validate webhook signatures:

```typescript
// newsletter-saas/src/app/api/billing/webhook/paypal-webhook-verifier.ts

export async function verifyPayPalWebhook(
  webhookId: string,
  event: any,
  headers: Record<string, string>
): Promise<boolean> {
  // Automatically uses sandbox.paypal.com for sandbox mode
  // Uses api.paypal.com for live mode
}
```

---

## Common Issues

### Issue 1: "Invalid Client Credentials"

**Cause**: Wrong credentials or mode mismatch

**Fix**:
```bash
# Verify .env
cat .env | grep PAYPAL

# Should show:
# PAYPAL_MODE=sandbox
# PAYPAL_CLIENT_ID=Aap... (sandbox credentials)
```

### Issue 2: Order Approval Link Not Working

**Cause**: Not logged into sandbox account

**Fix**:
1. Log out of all PayPal accounts
2. Visit approval link
3. Log in with **sandbox personal account**

### Issue 3: Webhook Not Received

**Causes**:
- ngrok tunnel expired
- Webhook URL not registered
- Firewall blocking

**Fix**:
```bash
# Restart ngrok
ngrok http 3000

# Update webhook URL in PayPal dashboard

# Test with PayPal simulator
# https://developer.paypal.com/dashboard/webhooks/simulate
```

### Issue 4: Subscription Creation Fails

**Cause**: Product or plan not active

**Fix**:
```python
# Check product status
product = sdk.catalog.get_product(product_id)
print(product["status"])  # Should be "CREATED"

# Check plan status
plan = sdk.subscriptions.get_plan(plan_id)
print(plan["status"])  # Should be "ACTIVE"
```

---

## Go-Live Checklist

### ⚠️ Before Switching to Live Mode

- [ ] Test all payment flows in sandbox
- [ ] Test webhook handling
- [ ] Test subscription lifecycle (create, cancel, refund)
- [ ] Test payment orchestrator fallback chain
- [ ] Verify error handling
- [ ] Load test (simulate 100+ concurrent orders)
- [ ] Security audit (webhook signature verification)

### 🚀 Switching to Live Mode

1. **Update .env**:

```env
# Switch to live credentials
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=BAA_307If7bTlPitFQUXAjnTnYjGjWoB3aO3CSpgxadE_TaTPj-mQu_auaufRk4UMn_CspzGziLr15W19w
PAYPAL_CLIENT_SECRET=EJlaGiw395JUFYq5ZU8npQg_7lLyk5078Bh90ZPFuTNy1szZhBhsU-fFQC2xeQ1BNIihzanPVWO4YHra

# Archive sandbox credentials
# PAYPAL_SANDBOX_CLIENT_ID=Aap...
# PAYPAL_SANDBOX_CLIENT_SECRET=EJ6...
```

2. **Update Webhook URL**:
   - Remove ngrok URL
   - Add production URL: `https://yourdomain.com/api/billing/webhook/paypal`

3. **Restart Application**:

```bash
# Restart backend
pnpm restart

# Verify mode
python3 -c "
from core.finance.paypal_sdk import PayPalSDK
sdk = PayPalSDK()
print(f'Mode: {sdk.mode}')
print(f'Base URL: {sdk.base_url}')
"
# Should output:
# Mode: live
# Base URL: https://api-m.paypal.com
```

4. **Monitor First Live Transaction**:

```bash
# Watch logs
tail -f logs/payment.log

# Test with small amount ($1)
# Verify order capture
# Verify webhook delivery
```

---

## Testing Scripts

### Quick Test Script

Save as `scripts/test_paypal_sandbox.py`:

```python
#!/usr/bin/env python3
"""PayPal Sandbox Quick Test"""

from core.finance.paypal_sdk import PayPalSDK

def test_connection():
    """Test PayPal API connection"""
    sdk = PayPalSDK()

    print(f"Mode: {sdk.mode}")
    print(f"Base URL: {sdk.base_url}")

    # Test token
    token = sdk._get_token()
    if token:
        print("✅ Authentication successful")
    else:
        print("❌ Authentication failed")
        return False

    # Test order creation
    order = sdk.orders.create({
        "intent": "CAPTURE",
        "purchase_units": [{
            "amount": {
                "currency_code": "USD",
                "value": "1.00"
            }
        }]
    })

    if order and "id" in order:
        print(f"✅ Order created: {order['id']}")
        approve_url = next((link["href"] for link in order["links"] if link["rel"] == "approve"), None)
        print(f"   Approve: {approve_url}")
        return True
    else:
        print("❌ Order creation failed")
        return False

if __name__ == "__main__":
    test_connection()
```

**Run**:
```bash
python3 scripts/test_paypal_sandbox.py
```

---

## Resources

- **PayPal Developer**: https://developer.paypal.com
- **Sandbox Dashboard**: https://developer.paypal.com/dashboard/
- **API Reference**: https://developer.paypal.com/api/rest/
- **Webhook Simulator**: https://developer.paypal.com/dashboard/webhooks/simulate
- **ngrok**: https://ngrok.com

---

## Support

For issues:
1. Check PayPal sandbox logs: https://developer.paypal.com/dashboard/
2. Review webhook events
3. Check application logs: `logs/payment.log`
4. Test with PayPal simulator

---

**Last Updated**: 2026-01-25
**Mode**: SANDBOX ✅
**Status**: Ready for Testing
