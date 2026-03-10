# Security Audit: Polar Webhook Signature Verification

**Date:** 2026-03-06
**Scope:** `polar-webhook-event-handler.ts` + `polar-billing-subscription-routes.ts`

---

## Security Score: 7.5/10

| Category | Score | Status |
|----------|-------|--------|
| Cryptographic Algorithm | ✅ 10/10 | HMAC-SHA256 |
| Timing-Safe Comparison | ✅ 10/10 | `timingSafeEqual()` |
| Secret Management | ⚠️ 5/10 | env var, no validation |
| Input Validation | ✅ 10/10 | Zod schema |
| Error Handling | ✅ 10/10 | Generic 401 |
| Dev Mode Bypass | ⚠️ 5/10 | Skips verification |
| Rate Limiting | ❌ 0/10 | Not implemented |
| Audit Logging | ❌ 0/10 | Not implemented |

---

## Current Implementation Review

### ✅ Strengths

**1. HMAC-SHA256 Signature (Line 63-65)**
```typescript
const expected = createHmac('sha256', WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');
```
- Industry standard for webhook signing
- Collision-resistant

**2. Timing-Safe Comparison (Line 70)**
```typescript
return timingSafeEqual(Buffer.from(expected), Buffer.from(sigHex));
```
- Prevents timing attacks
- Correct length check first (Line 69)

**3. Input Validation (Line 59)**
```typescript
const parsed = PolarWebhookPayloadSchema.safeParse(req.body);
if (!parsed.success) {
  return reply.status(400).send({ error: 'Invalid webhook payload' });
}
```
- Zod schema validation
- Rejects malformed payloads

**4. Generic Error Messages (Line 56)**
```typescript
return reply.status(401).send({ error: 'Invalid webhook signature' });
```
- No info disclosure
- Consistent response

---

## ⚠️ Critical Vulnerabilities

### 1. Dev Mode Bypass (HIGH RISK)

**Line 61:**
```typescript
if (!WEBHOOK_SECRET) return true; // Dev mode — no verification
```

**Risk:** If `POLAR_WEBHOOK_SECRET` not set in production, ALL webhooks accepted.

**Exploit:**
```bash
# Attacker sends fake webhook
curl -X POST https://api.algo-trader.com/api/v1/billing/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"subscription.active","data":{"metadata":{"tenantId":"attacker"}}}'
# Accepted! No signature check.
```

**Fix:**
```typescript
verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    // CRITICAL: Fail closed in production
    console.error('[Polar] WEBHOOK_SECRET NOT CONFIGURED');
    return false;
  }
  // ... rest of verification
}
```

---

### 2. No Rate Limiting (HIGH RISK)

**Missing:** Rate limiting on `/api/v1/billing/webhook`

**Risk:** Attacker can spam fake webhooks to:
- Trigger unlimited license activations
- Cause denial of service
- Flood audit logs

**Fix:**
```typescript
// Add to routes
fastify.post('/api/v1/billing/webhook', {
  config: {
    rateLimit: {
      max: 100,
      timeWindow: '1 minute'
    }
  }
}, async (req, reply) => {
  // ... existing handler
});
```

---

### 3. No Audit Logging (MEDIUM RISK)

**Missing:** Logging of webhook events

**Risk:** No forensic trail if attacked. Cannot debug production issues.

**Fix:**
```typescript
fastify.post('/api/v1/billing/webhook', async (req, reply) => {
  const timestamp = new Date().toISOString();
  const sourceIp = req.ip;

  if (!webhookHandler.verifySignature(rawBody, signature)) {
    fastify.log.error({
      event: 'webhook_signature_invalid',
      timestamp,
      sourceIp,
      eventType: req.body?.type
    });
    return reply.status(401).send({ error: 'Invalid webhook signature' });
  }

  fastify.log.info({
    event: 'webhook_received',
    timestamp,
    sourceIp,
    eventType: req.body.type,
    tenantId: result.tenantId
  });
  // ...
});
```

---

### 4. Raw Body Stringification Bug (MEDIUM RISK)

**Line 52:**
```typescript
const rawBody = JSON.stringify(req.body);
```

**Risk:** `req.body` already parsed by Fastify. Re-stringifying may change whitespace/ordering, causing signature mismatch.

**Fix:**
```typescript
// Access raw body before parsing
fastify.post('/api/v1/billing/webhook', {
  onRequest: (req, reply, done) => {
    let rawBody = '';
    req.raw.on('data', chunk => { rawBody += chunk; });
    req.raw.on('end', () => {
      (req as any).rawBody = rawBody;
      done();
    });
  }
}, async (req, reply) => {
  const rawBody = (req as any).rawBody;
  // Use rawBody for signature verification
});
```

---

## Phase 3: Billing Tier Enforcement Plan

### Goal: Enforce tier limits at runtime

```
User Action → Check License Tier → Allow/Deny
                                   ↓
                            Audit log event
```

### Implementation Phases

**Phase 3A: License Tier Middleware**
```typescript
// New file: src/middleware/billing-tier-middleware.ts
export function requireTier(requiredTier: LicenseTier) {
  return (req: FastifyRequest, reply: FastifyReply, done: () => void) => {
    const licenseService = LicenseService.getInstance();
    const tenantId = extractTenantId(req);

    if (!licenseService.hasTier(requiredTier)) {
      reply.status(403).send({
        error: 'Tier required',
        required: requiredTier,
        current: licenseService.getTier()
      });
      return;
    }
    done();
  };
}
```

**Phase 3B: Feature Gate Helpers**
```typescript
// Usage in routes
fastify.get('/api/v1/backtest/optimize', {
  preHandler: [requireTier(LicenseTier.PRO)]
}, async (req, reply) => {
  // Only PRO/ENTERPRISE can access
});
```

**Phase 3C: Runtime Tier Checks**
```typescript
// In trading engine
import { checkTierLimit } from './billing/tier-limits';

async function executeTrade(trade: Trade) {
  const limits = getTierLimits(currentTier);

  if (trade.amount > limits.maxPositionSizeUsd) {
    throw new Error(`Position size exceeds ${currentTier} limit`);
  }

  if (dailyLoss > limits.maxDailyLossUsd) {
    throw new Error('Daily loss limit reached');
  }
}
```

### Tier Limits Matrix

| Feature | FREE | PRO | ENTERPRISE |
|---------|------|-----|------------|
| Max Strategies | 1 | 5 | ∞ |
| Max Daily Loss | $50 | $500 | $5000 |
| Max Position Size | $500 | $5000 | $50000 |
| ML Models | ❌ | ✅ | ✅ |
| Premium Data | ❌ | ✅ | ✅ |
| Backtest History | 30 days | 1 year | Unlimited |
| API Rate Limit | 10/min | 100/min | 1000/min |

---

## Remediation Priority

| Issue | Priority | Effort | Timeline |
|-------|----------|--------|----------|
| Dev Mode Bypass | P0 | 1 line | Immediate |
| Rate Limiting | P0 | 5 lines | Immediate |
| Raw Body Bug | P1 | 20 lines | 1 hour |
| Audit Logging | P1 | 30 lines | 2 hours |
| Phase 3 Enforcement | P2 | 200 lines | 4 hours |

---

## Test Coverage Needed

```typescript
describe('Webhook Security', () => {
  test('should reject webhooks when SECRET not configured', async () => {
    delete process.env.POLAR_WEBHOOK_SECRET;
    const result = handler.verifySignature('payload', 'sig');
    expect(result).toBe(false); // FAIL-CLOSED
  });

  test('should rate limit after 100 requests/min', async () => {
    // Send 101 webhooks
    // 101st should return 429
  });

  test('should log all signature failures', async () => {
    // Verify audit log entry created
  });

  test('should use raw body for verification', async () => {
    // Send webhook with specific formatting
    // Signature should match
  });
});
```

---

**Auditor:** Automated Security Review
**Date:** 2026-03-06
**Next Steps:** Fix P0 issues before production deployment
