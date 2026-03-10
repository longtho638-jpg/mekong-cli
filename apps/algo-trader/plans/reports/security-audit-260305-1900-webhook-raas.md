# Security Audit: Webhook Handler + RaaS Gate

**Date:** 2026-03-05 19:00
**Scope:** `webhook-handler.ts`, `raas-gate.ts`
**Severity Scale:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## ✅ Security Strengths

| Component | Implementation | Status |
|-----------|---------------|--------|
| HMAC Signature | SHA-256 with `whsec_` prefix | ✅ Correct |
| Timestamp Validation | 5-minute expiry window | ✅ Correct |
| Rate Limiting | 5 attempts/min, 5-min block | ✅ Correct |
| Audit Logging | JSON format for SIEM | ✅ Correct |
| License Expiration | Checked in `hasTier()` | ✅ Correct |
| Error Handling | Try-catch, no leak | ✅ Correct |

---

## 🔴 CRITICAL (P0) - Must Fix Before Deploy

### 1. Timing Attack on Signature Comparison

**File:** `webhook-handler.ts:33`

```typescript
return signature === `whsec_${computedSignature}`;
```

**Vulnerability:** String comparison `===` is NOT constant-time. Attacker can use timing analysis to brute-force signature byte-by-byte.

**Impact:** Forge webhook signatures → bypass authentication → activate/revoke licenses.

**Fix:**
```typescript
import { timingSafeEqual } from 'crypto';

const expected = Buffer.from(`whsec_${computedSignature}`, 'utf8');
const actual = Buffer.from(signature, 'utf8');

if (expected.length !== actual.length) return false;
return timingSafeEqual(expected, actual);
```

---

### 2. In-Memory Rate Limiting (Distributed Bypass)

**File:** `raas-gate.ts:85-88`

```typescript
private validationAttempts: Map<string, ValidationRateLimit> = new Map();
// Stored in process memory
```

**Vulnerability:** Rate limits lost on restart. Multi-instance deployment = each instance has separate limits. Attacker rotates IPs or hits different instances.

**Impact:** Brute-force license keys without rate limit consequences.

**Fix:** Use Redis for distributed rate limiting:
```typescript
// Production: Redis-based
const key = `rate_limit:${ip}`;
const attempts = await redis.incr(key);
await redis.expire(key, 60); // 1 minute TTL
```

---

### 3. License Key Prefix Validation (Trivial Bypass)

**File:** `raas-gate.ts:137-153`

```typescript
if (licenseKey.startsWith('raas-pro-') || licenseKey.startsWith('RPP-')) {
  // Grant PRO tier
}
```

**Vulnerability:** Anyone can create `raas-pro-fakekey123` or `RPP-anything` → instant PRO access. No cryptographic validation.

**Impact:** Complete bypass of RaaS monetization.

**Fix Options:**
1. **JWT-based keys:** Sign license keys with private key, verify with public key
2. **Database validation:** Check key existence + status in database
3. **Polar.sh API verification:** Call Polar.sh API to validate key

```typescript
// Option 1: JWT verification
import { jwtVerify } from 'jose';

const { payload } = await jwtVerify(licenseKey, publicKey);
// payload contains: { tier, expiresAt, features }
```

---

## 🟠 HIGH (P1) - Should Fix

### 4. No Input Validation on license_key

**File:** `webhook-handler.ts:72-75`

```typescript
const { license_key, tier } = event.data as {
  license_key: string;
  tier?: string
};
// No length check, no format validation
```

**Vulnerability:** Massive license_key could cause DoS. No sanitization.

**Fix:**
```typescript
if (!license_key || typeof license_key !== 'string' || license_key.length > 256) {
  throw new Error('Invalid license_key format');
}
```

---

### 5. Webhook Secret in Environment Variable Only

**File:** `webhook-handler.ts:142`

```typescript
webhookSecret: string // Passed from caller, no default fallback
```

**Vulnerability:** If caller passes wrong secret, webhook validates against wrong secret. No validation that secret matches Polar.sh config.

**Fix:** Add environment variable fallback with validation:
```typescript
const secret = webhookSecret || process.env.POLAR_WEBHOOK_SECRET;
if (!secret) {
  throw new Error('Webhook secret not configured');
}
```

---

### 6. Audit Logs to Console (Production Data Leak)

**File:** `raas-gate.ts:345`

```typescript
console.log('[RAAS-AUDIT]', JSON.stringify(log));
```

**Vulnerability:** Console logs may expose IP addresses, license tiers, feature access patterns. No log redaction.

**Fix:** Use structured logging service with PII redaction:
```typescript
import { logger } from './logger';

logger.audit({
  event: log.event,
  tier: log.tier,
  // Never log IP directly
  ipHash: createHash('sha256').update(log.ip || '').digest('hex'),
});
```

---

## 🟡 MEDIUM (P2) - Nice to Have

### 7. No Replay Attack Prevention

**Vulnerability:** Same webhook payload can be replayed within 5-minute window. No nonce/jti tracking.

**Fix:** Add `event.id` to Redis cache with 5-min TTL, reject duplicates.

---

### 8. Tier Validation Missing in Webhook

**File:** `webhook-handler.ts:77, 93`

```typescript
await licenseService.activateLicense(license_key, tier as LicenseTier || LicenseTier.PRO);
// No validation that tier is valid enum value
```

**Fix:**
```typescript
const validTiers = Object.values(LicenseTier);
if (tier && !validTiers.includes(tier as LicenseTier)) {
  throw new Error(`Invalid tier: ${tier}`);
}
```

---

### 9. No Rate Limiting on Webhook Endpoint

**Vulnerability:** Webhook endpoint can be spammed. Each call triggers LicenseService methods.

**Fix:** Add Express middleware rate limiter:
```typescript
import rateLimit from 'express-rate-limit';

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // 10 requests per minute
  keyGenerator: (req) => req.ip,
});
```

---

## 🟢 LOW (P3) - Informational

| Issue | Description |
|-------|-------------|
| `any` types | `webhook-handler.ts:140` uses `any` in error handling |
| Hardcoded expiry | `raas-gate.ts:157` has `expiresAt: '2027-12-31'` hardcoded |
| No metrics | Rate limit hits not tracked for alerting |

---

## 📋 Remediation Priority

| Priority | Issue | Effort | Risk |
|----------|-------|--------|------|
| **P0** | Timing attack on signature | 15min | 🔴 Critical |
| **P0** | License key prefix bypass | 2h | 🔴 Critical |
| **P0** | In-memory rate limiting | 4h (Redis) | 🔴 High |
| **P1** | Input validation on license_key | 15min | 🟠 High |
| **P1** | Webhook secret validation | 15min | 🟠 Medium |
| **P2** | Replay attack prevention | 1h | 🟡 Medium |
| **P2** | Tier enum validation | 15min | 🟡 Low |

---

## ✅ Pre-Deploy Checklist

```bash
# Before deploy, verify:
[ ] P0 issues fixed and tested
[ ] Timing-safe comparison implemented
[ ] License key crypto validation working
[ ] Rate limiting tested with redis-cli
[ ] Input validation rejects malformed keys
[ ] Webhook secret validated on startup
[ ] All tests pass: python3 -m pytest
```

---

**Auditor:** Security Researcher Agent
**Next Review:** After P0 fixes, re-audit required
