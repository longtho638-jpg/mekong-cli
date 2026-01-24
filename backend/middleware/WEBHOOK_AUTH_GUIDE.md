# Webhook Signature Verification - Quick Reference

## Overview
Security-critical middleware for verifying webhook authenticity from Gumroad and Stripe payment providers.

## Environment Variables (Required)

```bash
# Stripe
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Gumroad
GUMROAD_WEBHOOK_SECRET=your_secret_from_gumroad
```

## Usage in Routes

### Option 1: Dependency Injection (Recommended)

```python
from fastapi import Depends
from backend.middleware.webhook_auth import verify_stripe_webhook

@router.post("/webhooks/stripe")
async def handle_stripe(event: dict = Depends(verify_stripe_webhook)):
    # Signature already verified, event is safe to use
    process_event(event)
    return {"status": "processed", "verified": True}
```

### Option 2: Manual Verification

```python
from backend.middleware.webhook_auth import verify_gumroad_signature

@router.post("/webhooks/gumroad")
async def handle_gumroad(request: Request):
    body = await request.body()
    signature = request.headers.get("X-Gumroad-Signature")
    secret = os.getenv("GUMROAD_WEBHOOK_SECRET")

    verify_gumroad_signature(body, signature, secret)
    # If no exception raised, signature is valid
```

## Security Features

### 1. Signature Verification
- **Gumroad**: HMAC-SHA256 with constant-time comparison
- **Stripe**: Stripe SDK with built-in security

### 2. Replay Attack Prevention
- Validates webhook timestamps
- Rejects webhooks older than 5 minutes
- Allows 1-minute clock skew tolerance

### 3. Comprehensive Logging
```python
# Success
✅ Webhook verified [gumroad]: {"provider": "gumroad", "success": true, ...}

# Failure
⚠️ Webhook verification failed [stripe]: {"provider": "stripe", "success": false, "error": "Invalid signature"}
```

### 4. Error Handling
- Returns 401 Unauthorized for invalid signatures
- Logs all verification attempts
- Provides detailed error messages

## Testing

Run tests:
```bash
python3 -m pytest backend/tests/test_webhook_auth.py -v
```

Expected: 23 passed in ~0.3s

## Common Issues

### 1. Missing Signature Header
**Error**: `Missing X-Gumroad-Signature header`
**Fix**: Ensure webhook provider is configured to send signature

### 2. Secret Not Configured
**Error**: `Webhook secret not configured`
**Fix**: Set environment variable (STRIPE_WEBHOOK_SECRET or GUMROAD_WEBHOOK_SECRET)

### 3. Signature Mismatch
**Error**: `Invalid webhook signature`
**Fix**:
- Verify correct secret is configured
- Check webhook payload hasn't been modified
- Ensure raw body is used (not parsed JSON)

### 4. Old Timestamp
**Warning**: `Webhook timestamp too old: 350s (max 300s)`
**Fix**:
- Check system clock synchronization
- Ensure webhooks are processed quickly
- Adjust tolerance if needed (see Customization)

## Customization

### Adjust Timestamp Tolerance
```python
from backend.middleware.webhook_auth import verify_stripe_signature

# Allow 10-minute tolerance
event = verify_stripe_signature(
    payload,
    signature,
    secret,
    tolerance=600
)
```

### Custom Logging
```python
from backend.middleware.webhook_auth import log_webhook_verification

log_webhook_verification(
    provider="gumroad",
    success=True,
    request_id="req_123",
    error=None
)
```

## Security Best Practices

1. ✅ **Never log webhook secrets**
2. ✅ **Use environment variables for secrets**
3. ✅ **Verify signatures before processing**
4. ✅ **Monitor verification logs for suspicious activity**
5. ✅ **Keep webhook secrets rotated regularly**
6. ✅ **Use HTTPS for webhook endpoints**
7. ✅ **Implement rate limiting on webhook routes**

## Webhook Headers

### Gumroad
```
X-Gumroad-Signature: <hmac-sha256-hex-digest>
```

### Stripe
```
Stripe-Signature: t=<timestamp>,v1=<signature>
```

## Architecture

```
┌─────────────────┐
│  Webhook POST   │
│  /webhooks/xxx  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  Signature Check    │
│  verify_xxx_webhook │
│  (Dependency)       │
└────────┬────────────┘
         │ ✅ Valid
         ▼
┌─────────────────┐
│  Route Handler  │
│  Process Event  │
└─────────────────┘

         │ ❌ Invalid
         ▼
┌─────────────────┐
│  401 Response   │
│  Log Error      │
└─────────────────┘
```

## Files Reference

- **Core**: `backend/middleware/webhook_auth.py`
- **Tests**: `backend/tests/test_webhook_auth.py`
- **Gumroad Route**: `backend/api/routers/gumroad_webhooks.py`
- **Stripe Route**: `backend/api/routers/stripe_webhooks.py`
- **Config Example**: `backend/.env.example`
