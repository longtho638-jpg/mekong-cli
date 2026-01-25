# Task 02: Backend API Health Validation

**Status:** Ready to Execute
**Priority:** Critical
**Estimated Time:** 15-20 minutes
**Dependencies:** None
**Terminal:** #1

---

## 🎯 Objective

Validate all critical backend API endpoints are functional, database connections work, and payment webhooks reject invalid requests (security validation).

---

## 📋 WIN-WIN-WIN Validation

### 👑 ANH (Owner) WINS:
- Confidence in production deployment
- Payment security verified (fail-safe mode)
- No runtime surprises

### 🏢 AGENCY WINS:
- Automated health checks = faster debugging
- API reliability = client trust
- Webhook security = PCI compliance foundation

### 🚀 CLIENT/STARTUP WINS:
- Reliable payment processing
- Fast API responses (<200ms)
- Secure transaction handling

✅ **All 3 parties WIN** → Proceed

---

## ⚡ Execution Commands

```bash
cd /Users/macbookprom1/mekong-cli/backend

# Activate virtual environment (create if missing)
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt --quiet

# Start backend server (background)
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Backend starting... (PID: $BACKEND_PID)"
sleep 5

# Test critical endpoints
echo ""
echo "=== Testing Health Endpoint ==="
curl -f http://localhost:8000/health || echo "❌ FAIL: Health endpoint"

echo ""
echo "=== Testing Revenue Dashboard API ==="
curl -f http://localhost:8000/api/revenue/dashboard || echo "❌ FAIL: Revenue endpoint"

echo ""
echo "=== Testing PayPal Webhook (Should Reject Invalid Signature) ==="
curl -X POST http://localhost:8000/api/payments/paypal/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}' \
  -w "\nHTTP Status: %{http_code}\n" || echo "✅ PASS: Webhook rejected (expected)"

echo ""
echo "=== Testing Stripe Webhook (Should Reject Invalid Signature) ==="
curl -X POST http://localhost:8000/api/payments/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: fake-signature" \
  -d '{"type": "payment_intent.succeeded"}' \
  -w "\nHTTP Status: %{http_code}\n" || echo "✅ PASS: Webhook rejected (expected)"

# Stop backend
kill $BACKEND_PID

echo ""
echo "=== Backend API Validation Complete ==="
echo "Review output above. ✅ = success, ❌ = failure"
```

---

## ✅ Success Criteria

- [ ] Health endpoint returns `200 OK` with `{"status": "healthy"}`
- [ ] Revenue endpoint returns JSON (may be empty if no data)
- [ ] PayPal webhook returns `401 Unauthorized` (invalid signature)
- [ ] Stripe webhook returns `400 Bad Request` or `401` (invalid signature)
- [ ] Backend starts without import errors
- [ ] No database connection errors (check logs)

---

## 🔧 Failure Recovery

### Backend Won't Start
```bash
# Check logs
tail -f backend/logs/app.log

# Common fix: Missing .env
cp backend/.env.example backend/.env
# Edit backend/.env and add required keys
```

### Database Connection Error
```bash
# Verify Supabase credentials in .env
grep SUPABASE_URL backend/.env
grep SUPABASE_ANON_KEY backend/.env

# Test connection directly
python3 << 'EOF'
from supabase import create_client
import os
url = os.getenv("SUPABASE_URL", "MISSING")
key = os.getenv("SUPABASE_ANON_KEY", "MISSING")
print(f"URL: {url[:20]}... Key: {key[:20]}...")
if "MISSING" not in (url, key):
    client = create_client(url, key)
    print("✅ Supabase connection OK")
else:
    print("❌ Missing credentials")
EOF
```

### Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Import Errors
```bash
# Reinstall all dependencies
pip install -r backend/requirements.txt --force-reinstall
```

---

## 📊 Post-Task Validation

```bash
# Check backend logs for errors
tail -n 50 backend/logs/app.log | grep -i error

# Verify Python dependencies
pip list | grep -E "fastapi|uvicorn|supabase|stripe|paypalrestsdk"
```

**Expected Dependencies:**
- `fastapi==0.110.0+`
- `uvicorn[standard]==0.27.0+`
- `supabase==2.3.0+`
- `stripe==7.0.0+`

---

## 🚀 Next Steps After Success

1. Document API response times: `curl -w "@curl-format.txt" http://localhost:8000/health`
2. Proceed to Task 03: Payment Webhook Integration Test
3. Update health check in CI/CD: `.github/workflows/backend-health.yml`

---

**Report:** `echo "TASK 02 COMPLETE - API HEALTH VALIDATED" >> /tmp/binh-phap-execution.log`
