# Task 08: Security Audit

**Status:** Ready to Execute
**Priority:** Critical
**Estimated Time:** 15-20 minutes
**Dependencies:** None
**Terminal:** #9

---

## 🎯 Objective

Perform security audit on critical components: webhook signature verification, environment variable handling, SQL injection prevention, XSS protection, and secrets management.

---

## 📋 WIN-WIN-WIN Validation

### 👑 ANH (Owner) WINS:
- No security breaches = business continuity
- PCI compliance foundation
- Legal liability protection

### 🏢 AGENCY WINS:
- Client trust (security reputation)
- Reduced support burden (no compromised accounts)
- Professional credibility

### 🚀 CLIENT/STARTUP WINS:
- Data safety
- Payment security
- GDPR/CCPA compliance

✅ **All 3 parties WIN** → Proceed

---

## ⚡ Execution Commands

```bash
cd /Users/macbookprom1/mekong-cli

echo "=== AgencyOS Security Audit ==="
echo "Testing 5 critical security areas"

# Security Test 1: Environment Variables (Secrets Exposure)
echo ""
echo "=== Test 1: Secrets Exposure Check ==="
echo "Checking for hardcoded secrets in codebase..."

# Search for common secret patterns
FINDINGS=$(grep -r -n -E "(api_key|secret_key|password|token).*=.*['\"][a-zA-Z0-9]{20,}" \
  --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir="node_modules" --exclude-dir=".venv" \
  backend/ apps/ antigravity/ 2>/dev/null || echo "")

if [ -z "$FINDINGS" ]; then
  echo "✅ PASS: No hardcoded secrets found"
else
  echo "❌ FAIL: Potential hardcoded secrets detected:"
  echo "$FINDINGS" | head -n 5
  echo "(Review all findings manually)"
fi

# Security Test 2: Webhook Signature Verification
echo ""
echo "=== Test 2: Webhook Signature Verification ==="
echo "Checking PayPal/Stripe webhook handlers..."

# Check for signature verification in webhook handlers
PAYPAL_CHECK=$(grep -n "verify.*signature\|PAYPAL.*TRANSMISSION" backend/api/payments/*.py 2>/dev/null || echo "")
STRIPE_CHECK=$(grep -n "verify.*signature\|Stripe-Signature" backend/api/payments/*.py 2>/dev/null || echo "")

if [ -n "$PAYPAL_CHECK" ]; then
  echo "✅ PASS: PayPal signature verification found"
else
  echo "❌ CRITICAL: PayPal signature verification MISSING!"
fi

if [ -n "$STRIPE_CHECK" ]; then
  echo "✅ PASS: Stripe signature verification found"
else
  echo "❌ CRITICAL: Stripe signature verification MISSING!"
fi

# Security Test 3: SQL Injection Prevention
echo ""
echo "=== Test 3: SQL Injection Prevention ==="
echo "Checking for raw SQL queries (potential SQLi)..."

# Look for potential SQL injection vectors (raw queries)
SQL_CHECK=$(grep -r -n "execute.*SELECT\|execute.*INSERT\|execute.*UPDATE" \
  --include="*.py" \
  --exclude-dir=".venv" \
  backend/ 2>/dev/null || echo "")

if [ -z "$SQL_CHECK" ]; then
  echo "✅ PASS: No raw SQL queries found (using ORM)"
else
  echo "⚠️ WARNING: Raw SQL queries detected (verify parameterization):"
  echo "$SQL_CHECK" | head -n 3
fi

# Security Test 4: XSS Protection (Frontend)
echo ""
echo "=== Test 4: XSS Protection Check ==="
echo "Checking for dangerouslySetInnerHTML usage..."

XSS_CHECK=$(grep -r -n "dangerouslySetInnerHTML" \
  --include="*.tsx" --include="*.jsx" \
  apps/ 2>/dev/null || echo "")

if [ -z "$XSS_CHECK" ]; then
  echo "✅ PASS: No dangerouslySetInnerHTML usage"
else
  echo "⚠️ WARNING: dangerouslySetInnerHTML found (verify sanitization):"
  echo "$XSS_CHECK" | head -n 3
fi

# Security Test 5: CORS Configuration
echo ""
echo "=== Test 5: CORS Configuration ==="
echo "Checking backend CORS settings..."

CORS_CHECK=$(grep -n "CORSMiddleware\|allow_origins" backend/main.py 2>/dev/null || echo "")

if [ -n "$CORS_CHECK" ]; then
  echo "✅ PASS: CORS middleware configured"

  # Check if allow_origins is wildcard (INSECURE!)
  if grep -q 'allow_origins.*\["\\*"\]' backend/main.py 2>/dev/null; then
    echo "❌ CRITICAL: CORS allows ALL origins (wildcard *) - INSECURE!"
  else
    echo "✅ PASS: CORS origins restricted"
  fi
else
  echo "⚠️ WARNING: No CORS configuration found"
fi

# Security Test 6: Environment File Permissions
echo ""
echo "=== Test 6: Environment File Permissions ==="
ENV_FILES=(".env" "backend/.env")

for file in "${ENV_FILES[@]}"; do
  if [ -f "$file" ]; then
    PERMS=$(stat -f "%Lp" "$file" 2>/dev/null || stat -c "%a" "$file" 2>/dev/null)
    if [ "$PERMS" = "600" ] || [ "$PERMS" = "400" ]; then
      echo "✅ $file permissions: $PERMS (secure)"
    else
      echo "⚠️ $file permissions: $PERMS (should be 600 or 400)"
    fi
  else
    echo "⚠️ $file not found"
  fi
done

# Generate Security Audit Report
echo ""
echo "=== Generating Security Audit Report ==="
cat > /tmp/security-audit-report.md << 'EOF'
# AgencyOS Security Audit Report

**Date:** $(date)
**Auditor:** Automated Security Scan
**Scope:** Backend API, Frontend Apps, Environment Configuration

## Critical Findings

### HIGH PRIORITY
1. Webhook Signature Verification
   - Status: [Review output above]
   - Action: Ensure PayPal/Stripe webhooks reject unsigned requests

2. CORS Configuration
   - Status: [Review output above]
   - Action: Restrict allow_origins to specific domains

### MEDIUM PRIORITY
3. SQL Injection Prevention
   - Status: [Review output above]
   - Action: Use ORM (SQLAlchemy) for all queries

4. XSS Protection
   - Status: [Review output above]
   - Action: Avoid dangerouslySetInnerHTML or use DOMPurify

### LOW PRIORITY
5. Environment File Permissions
   - Status: [Review output above]
   - Action: chmod 600 .env backend/.env

## Recommendations

1. **Immediate Actions:**
   - Fix critical webhook signature issues (if found)
   - Restrict CORS origins to production domains only

2. **Short-term Actions (1-2 weeks):**
   - Implement rate limiting (100 req/min per IP)
   - Add API authentication (JWT tokens)
   - Enable HTTPS-only in production

3. **Long-term Actions (1-3 months):**
   - Penetration testing (hire external auditor)
   - PCI DSS compliance audit (for payment processing)
   - GDPR/CCPA compliance review

## Security Checklist

- [ ] Webhook signatures verified
- [ ] CORS restricted to known domains
- [ ] No hardcoded secrets in code
- [ ] Environment files are chmod 600
- [ ] SQL queries use parameterization (ORM)
- [ ] XSS protection enabled (Content Security Policy)
- [ ] HTTPS enforced in production
- [ ] API rate limiting enabled

EOF

cat /tmp/security-audit-report.md

echo ""
echo "=== Security Audit Complete ==="
echo "Report saved to: /tmp/security-audit-report.md"
echo ""
echo "⚠️ IMPORTANT: Review all findings manually before deployment!"
```

---

## ✅ Success Criteria

- [ ] No hardcoded secrets in codebase
- [ ] Webhook signature verification implemented
- [ ] No wildcard CORS origins (`allow_origins: ["*"]`)
- [ ] Environment files have secure permissions (600)
- [ ] No raw SQL queries (using ORM)
- [ ] No `dangerouslySetInnerHTML` or sanitized properly
- [ ] Security audit report generated

---

## 🔧 Failure Recovery

### Webhook Signature Verification Missing
```bash
# Add to backend/api/payments/paypal.py
from paypalrestsdk import WebhookEvent

@router.post("/paypal/webhook")
async def paypal_webhook(request: Request):
    # Verify signature
    headers = dict(request.headers)
    body = await request.body()

    if not WebhookEvent.verify(headers, body, PAYPAL_WEBHOOK_ID):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Process event
    ...
```

### CORS Wildcard Fix
```bash
# Edit backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://agencyos.network", "https://dashboard.agencyos.network"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Fix Environment File Permissions
```bash
chmod 600 .env
chmod 600 backend/.env
```

---

## 📊 Post-Task Validation

```bash
# Verify webhook signature code exists
grep -r "verify.*signature" backend/api/payments/

# Check CORS config
grep "allow_origins" backend/main.py

# Verify env permissions
ls -la .env backend/.env
```

---

## 🚀 Next Steps After Success

1. **If Critical Issues Found:**
   - STOP deployment
   - Fix critical issues immediately
   - Re-run security audit

2. **If No Critical Issues:**
   - Document security practices in `docs/security-practices.md`
   - Schedule penetration test (external auditor)
   - Proceed to Task 09: Test Suite Execution

3. **Production Hardening:**
   - Enable rate limiting (nginx or Cloud Armor)
   - Set up WAF (Web Application Firewall)
   - Configure security headers (CSP, HSTS)

---

**Report:** `echo "TASK 08 COMPLETE - SECURITY AUDIT DONE" >> /tmp/binh-phap-execution.log`
