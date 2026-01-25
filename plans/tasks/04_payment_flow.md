# Task 04: Payment Flow Verification

**Status:** Ready to Execute
**Priority:** Critical
**Estimated Time:** 20-25 minutes
**Dependencies:** Task 02 (Backend API running)
**Terminal:** #4

---

## 🎯 Objective

Simulate PayPal and Stripe webhook events to verify signature validation, payment processing logic, and fail-safe error handling. Ensure no payments are processed without valid signatures.

---

## 📋 WIN-WIN-WIN Validation

### 👑 ANH (Owner) WINS:
- Payment security proven (no unauthorized transactions)
- Revenue automation confidence
- PCI compliance foundation

### 🏢 AGENCY WINS:
- Webhook integration tested
- Security-first design validated
- Client trust in payment handling

### 🚀 CLIENT/STARTUP WINS:
- Secure payment processing
- No fraudulent transactions
- Reliable subscription billing

✅ **All 3 parties WIN** → Proceed

---

## ⚡ Execution Commands

```bash
cd /Users/macbookprom1/mekong-cli/backend

# Start backend if not running
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "Backend starting... (PID: $BACKEND_PID)"
sleep 5

echo "=== Payment Webhook Integration Tests ==="

# Test 1: PayPal Webhook - Invalid Signature (Should Reject)
echo ""
echo "=== Test 1: PayPal Invalid Signature ==="
RESPONSE=$(curl -s -X POST http://localhost:8000/api/payments/paypal/webhook \
  -H "Content-Type: application/json" \
  -H "PAYPAL-TRANSMISSION-ID: fake-id-12345" \
  -H "PAYPAL-TRANSMISSION-TIME: 2026-01-25T10:00:00Z" \
  -H "PAYPAL-TRANSMISSION-SIG: invalid-signature" \
  -d '{
    "event_type": "PAYMENT.CAPTURE.COMPLETED",
    "resource": {
      "id": "test-payment-001",
      "amount": {
        "value": "100.00",
        "currency_code": "USD"
      }
    }
  }' \
  -w "\nHTTP: %{http_code}\n")

echo "$RESPONSE"
if echo "$RESPONSE" | grep -q "401\|400"; then
  echo "✅ PASS: PayPal webhook correctly rejected invalid signature"
else
  echo "❌ FAIL: PayPal webhook should reject invalid signatures!"
fi

# Test 2: Stripe Webhook - Invalid Signature (Should Reject)
echo ""
echo "=== Test 2: Stripe Invalid Signature ==="
RESPONSE=$(curl -s -X POST http://localhost:8000/api/payments/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=fake-signature-abc123" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_test_123",
        "amount": 10000,
        "currency": "usd"
      }
    }
  }' \
  -w "\nHTTP: %{http_code}\n")

echo "$RESPONSE"
if echo "$RESPONSE" | grep -q "401\|400"; then
  echo "✅ PASS: Stripe webhook correctly rejected invalid signature"
else
  echo "❌ FAIL: Stripe webhook should reject invalid signatures!"
fi

# Test 3: License Generation (Business Logic)
echo ""
echo "=== Test 3: License Generation ==="
python3 << 'EOF'
import sys
sys.path.insert(0, '/Users/macbookprom1/mekong-cli')

try:
    from core.licensing.logic.engine import LicenseGenerator

    generator = LicenseGenerator()
    license_key = generator.generate(
        tenant_id="test_tenant_001",
        plan="pro",
        duration_days=365
    )

    print(f"✅ License generated: {license_key}")

    # Verify format: AGY-{tenant}-{timestamp}-{checksum}
    parts = license_key.split('-')
    if len(parts) == 4 and parts[0] == "AGY":
        print(f"✅ PASS: License format valid")
    else:
        print(f"❌ FAIL: Invalid license format")

except Exception as e:
    print(f"❌ FAIL: License generation error: {e}")
EOF

# Test 4: Vietnam Tax Calculation
echo ""
echo "=== Test 4: Vietnam Tax Calculation ==="
python3 << 'EOF'
import sys
sys.path.insert(0, '/Users/macbookprom1/mekong-cli')

try:
    from core.finance.tax_calculator import calculate_vn_tax

    # Test below threshold (500M VND)
    tax_below = calculate_vn_tax(
        amount_vnd=100_000_000,
        quarter_total=200_000_000
    )

    # Test above threshold
    tax_above = calculate_vn_tax(
        amount_vnd=300_000_000,
        quarter_total=400_000_000
    )

    print(f"Below threshold (100M VND):")
    print(f"  Rate: {tax_below['rate']*100}% ({tax_below['method']})")
    print(f"  Expected: 0.5% (simplified)")

    print(f"\nAbove threshold (300M VND, total 700M):")
    print(f"  Rate: {tax_above['rate']*100}% ({tax_above['method']})")
    print(f"  Expected: 20% (standard + VAT)")

    if tax_below['rate'] == 0.005 and tax_above['rate'] == 0.20:
        print(f"\n✅ PASS: Tax calculation correct")
    else:
        print(f"\n❌ FAIL: Tax calculation incorrect")

except Exception as e:
    print(f"❌ FAIL: Tax calculation error: {e}")
EOF

# Stop backend
kill $BACKEND_PID

echo ""
echo "=== Payment Flow Verification Complete ==="
```

---

## ✅ Success Criteria

- [ ] PayPal webhook rejects invalid signatures (401/400 status)
- [ ] Stripe webhook rejects invalid signatures (401/400 status)
- [ ] License generation produces valid format (`AGY-*-*-*`)
- [ ] Vietnam tax calculation correct (<500M VND = 0.5%, >500M VND = 20%)
- [ ] No payments processed without valid signatures
- [ ] Webhook logs show signature verification attempts

---

## 🔧 Failure Recovery

### Webhook Accepts Invalid Signatures (CRITICAL!)
```bash
# This is a SECURITY BUG - must fix immediately!
# Check signature verification logic
grep -n "verify_signature" backend/services/payment_service.py

# Common fix: Signature verification disabled in dev mode
# Ensure PAYPAL_WEBHOOK_ID and STRIPE_WEBHOOK_SECRET are set in .env
```

### License Generation Fails
```bash
# Check license module exists
ls -la core/licensing/logic/

# If missing, create basic implementation:
mkdir -p core/licensing/logic
cat > core/licensing/logic/engine.py << 'EOF'
import hashlib
import time

class LicenseGenerator:
    def generate(self, tenant_id: str, plan: str, duration_days: int) -> str:
        timestamp = int(time.time())
        checksum = hashlib.md5(f"{tenant_id}{timestamp}".encode()).hexdigest()[:8]
        return f"AGY-{tenant_id}-{timestamp}-{checksum}"
EOF
```

### Tax Calculation Wrong
```bash
# Review tax logic
cat core/finance/tax_calculator.py

# Verify threshold constant (500,000,000 VND)
grep -n "THRESHOLD" core/finance/tax_calculator.py
```

---

## 📊 Post-Task Validation

```bash
# Check webhook logs for verification attempts
tail -n 50 backend/logs/app.log | grep -i "signature\|webhook"

# Verify environment variables are set
grep -E "PAYPAL_WEBHOOK_ID|STRIPE_WEBHOOK_SECRET" backend/.env
```

**Expected Log Entries:**
```
[INFO] PayPal webhook received: PAYMENT.CAPTURE.COMPLETED
[WARN] Invalid PayPal signature - request rejected
[INFO] Stripe webhook received: payment_intent.succeeded
[WARN] Invalid Stripe signature - request rejected
```

---

## 🚀 Next Steps After Success

1. Document webhook URLs for production:
   - PayPal: `https://api.agencyos.network/api/payments/paypal/webhook`
   - Stripe: `https://api.agencyos.network/api/payments/stripe/webhook`
2. Configure webhooks in PayPal/Stripe dashboards
3. Test with real sandbox events (use PayPal/Stripe webhook testing tools)
4. Proceed to Task 05: MCP Server Health Check

---

**Report:** `echo "TASK 04 COMPLETE - PAYMENT SECURITY VALIDATED" >> /tmp/binh-phap-execution.log`
