---
title: "KV Suspension Flag Integration"
description: "Tích hợp KV suspension flag vào RaaS middleware để block API access khi accounts bị suspended do payment failure"
status: completed
priority: P1
effort: 2h
branch: master
tags: [billing, middleware, suspension, kv-storage]
created: 2026-03-09
completed: 2026-03-09
---

# KV Suspension Flag Integration Plan

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         API Request Flow                                │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  1. Request arrives at RaaS Middleware                                  │
│     - Extract license key from X-API-Key / Authorization header         │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  2. License Validation (existing)                                       │
│     - LicenseService.validate(key, ip)                                  │
│     - Check tier requirements                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  3. NEW: Check KV Suspension Flag                                       │
│     - raasKVClient.getSuspension(licenseKey)                            │
│     - If suspended === true → Return 403 Suspension Error               │
│     - If suspended === false/null → Allow request                       │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
         ┌─────────────────────┐      ┌─────────────────────┐
         │  SUSPENDED          │      │  ALLOWED            │
         │  - Return 403       │      │  - Continue to      │
         │  - Error message    │      │    handler          │
         │  - Retry-After hdr  │      │                     │
         └─────────────────────┘      └─────────────────────┘
```

## State Machine Flow

```
┌──────────────┐    payment_failed    ┌──────────────┐
│    ACTIVE    │ ────────────────────>│ GRACE_PERIOD │
│  (allowed)   │                      │  (allowed)   │
└──────────────┘                      └──────────────┘
     ▲                                      │
     │ payment_recovered                    │ timeout (7 days)
     │                                      ▼
     │                               ┌──────────────┐
     │                               │  SUSPENDED   │
     │ payment_recovered             │  (BLOCKED)   │
     └───────────────────────────────┤              │
                                     └──────────────┘
                                            │
                                            │ timeout (14 days)
                                            ▼
                                     ┌──────────────┐
                                     │   REVOKED    │
                                     │  (BLOCKED)   │
                                     └──────────────┘
```

## Files To Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `src/lib/raas-middleware.ts` | MODIFY | Add suspension check after license validation |
| `src/lib/raas-gateway-kv-client.ts` | MODIFY | Add `isSuspended()` helper method |
| `src/billing/dunning-state-machine.ts` | MODIFY | Ensure `suspendAccount()` writes to KV |
| `tests/lib/raas-suspension-middleware.test.ts` | CREATE | Test suspension blocking |

## Implementation Steps

### Phase 1: KV Client Enhancement (15 min)

**File:** `src/lib/raas-gateway-kv-client.ts`

Thêm method helper:

```typescript
async isSuspended(licenseKey: string): Promise<{
  suspended: boolean;
  reason?: string;
  suspendedAt?: string;
}> {
  const state = await this.getSuspension(licenseKey);
  if (!state || !state.suspended) {
    return { suspended: false };
  }
  return {
    suspended: true,
    reason: state.reason,
    suspendedAt: state.suspendedAt,
  };
}
```

### Phase 2: Middleware Integration (30 min)

**File:** `src/lib/raas-middleware.ts`

Sửa `validateLicenseCore()`:

```typescript
async function validateLicenseCore(...) {
  // 1. Existing license validation
  const validation = await licenseService.validate(key, ip);
  if (!validation.valid) {
    return { valid: false, error: { type: 'unlicensed', validation } };
  }

  // 2. Tier check (existing)
  const tierOrder = { [LicenseTier.FREE]: 0, [LicenseTier.PRO]: 1, [LicenseTier.ENTERPRISE]: 2 };
  if (tierOrder[validation.tier] < tierOrder[requiredTier]) {
    return { valid: false, error: { type: 'insufficient_tier', validation, requiredTier } };
  }

  // 3. NEW: Check suspension flag from KV
  const suspensionCheck = await raasKVClient.isSuspended(key);
  if (suspensionCheck.suspended) {
    return {
      valid: false,
      error: {
        type: 'suspended',
        reason: suspensionCheck.reason,
        suspendedAt: suspensionCheck.suspendedAt,
      },
    };
  }

  return { valid: true, validation };
}
```

Cập nhật error handling trong `createLicenseMiddleware()`:

```typescript
if (error.type === 'suspended') {
  body = {
    error: 'Account Suspended',
    message: 'Access suspended due to payment failure',
    reason: error.reason,
    suspendedAt: error.suspendedAt,
    retryUrl: 'https://agencyos.network/billing/restore',
  };
  ctx.deny(403, body);
  return false;
}
```

### Phase 3: Dunning State Machine Sync (30 min)

**File:** `src/billing/dunning-state-machine.ts`

Thêm KV client và sync suspension state:

```typescript
import { raasKVClient } from '../lib/raas-gateway-kv-client';

// In suspendAccount():
async suspendAccount(tenantId: string): Promise<DunningStateResult> {
  const state = await prisma.dunningState.update({...});

  // NEW: Write suspension flag to KV
  await raasKVClient.setSuspension(tenantId, {
    suspended: true,
    reason: 'payment_failed',
    suspendedAt: new Date().toISOString(),
    failedPayments: state.failedPayments,
  });

  // Rest of existing code...
}

// In onPaymentRecovered():
async onPaymentRecovered(tenantId: string): Promise<DunningStateResult> {
  const state = await prisma.dunningState.update({...});

  // NEW: Clear suspension flag from KV
  await raasKVClient.setSuspension(tenantId, {
    suspended: false,
    reason: 'payment_failed',
  });

  // Rest of existing code...
}
```

### Phase 4: Tests (45 min)

**File:** `tests/lib/raas-suspension-middleware.test.ts`

```typescript
describe('RaaS Suspension Middleware', () => {
  it('should block request when account is suspended', async () => {
    // Mock KV to return suspended state
    mockKVClient.isSuspended.mockResolvedValue({
      suspended: true,
      reason: 'payment_failed',
      suspendedAt: '2026-03-09T00:00:00Z',
    });

    const ctx = createMockContext({ 'x-api-key': 'lic_suspended' });
    const result = await createLicenseMiddleware(LicenseTier.PRO)(ctx);

    expect(result).toBe(false);
    expect(ctx.deny).toHaveBeenCalledWith(403, expect.objectContaining({
      error: 'Account Suspended',
    }));
  });

  it('should allow request when account is not suspended', async () => {
    mockKVClient.isSuspended.mockResolvedValue({ suspended: false });

    const ctx = createMockContext({ 'x-api-key': 'lic_active' });
    const result = await createLicenseMiddleware(LicenseTier.PRO)(ctx);

    expect(result).toBe(true);
  });
});
```

## Success Criteria

- [ ] Middleware block requests khi `isSuspended() === true`
- [ ] Error response 403 với clear message + retry URL
- [ ] Dunning state machine sync suspension flag lên KV khi suspend
- [ ] Dunning state machine clear suspension flag khi recover payment
- [ ] Tests pass cho suspension blocking scenarios
- [ ] Public endpoints (health, ready, webhook) không bị block

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| KV unavailable → false positive block | `isSuspended()` returns `{suspended: false}` khi KV error |
| Performance impact | KV get latency ~50ms, acceptable cho middleware |
| Cache staleness | KV real-time, không cache issue |

## Unresolved Questions

1. Có cần thêm `Retry-After` header trong 403 response không?
2. Có cần log suspension check events không?
3. Có cần metric/counter cho số lượng blocked requests không?
