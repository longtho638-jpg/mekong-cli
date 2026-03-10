# Phase 1: Webhook Events Reconciliation

**Priority:** HIGH | **Estimate:** 2 hours

---

## TODO

### 1. Add `order.created` Handler

**Why:** Polar.sh sends `order.created` cho one-time purchases (không phải subscription)

**Implementation:**

```typescript
// src/billing/polar-webhook-event-handler.ts

private handleOrderCreated(data: any): WebhookResult {
  const tenantId = data.metadata?.tenantId;
  const productId = data.product_id;

  if (!tenantId || !productId) {
    return { handled: false, event: 'order.created', tenantId: null, tier: null, action: 'ignored' };
  }

  const tier = this.subscriptionService.getTierByProductId(productId);
  if (!tier) return { handled: false, event: 'order.created', tenantId, tier: null, action: 'ignored' };

  // One-time purchase = activate for lifetime (no period end)
  this.subscriptionService.activateSubscription(tenantId, tier, productId, null);

  // Sync với LicenseService
  const licenseTier = mapTenantTierToLicenseTier(tier);
  this.licenseService.activateLifetimeLicense(tenantId, licenseTier);

  return { handled: true, event: 'order.created', tenantId, tier, action: 'activated' };
}
```

### 2. Add `refund.created` Handler

**Why:** Xu lý refund — downgrade license + alert audit

**Implementation:**

```typescript
private handleRefundCreated(data: any): WebhookResult {
  const tenantId = data.metadata?.tenantId;
  const subscriptionId = data.subscription_id;

  if (!tenantId) return { handled: false, event: 'refund.created', tenantId: null, tier: null, action: 'ignored' };

  // Deactivate subscription
  this.subscriptionService.deactivateSubscription(tenantId);
  this.licenseService.deactivateSubscription(tenantId);

  // Log audit alert
  this.auditLogger.logRefund(tenantId, subscriptionId);

  return { handled: true, event: 'refund.created', tenantId, tier: 'free', action: 'deactivated' };
}
```

### 3. Create Audit Logger

**File:** `src/billing/polar-audit-logger.ts`

```typescript
export class PolarAuditLogger {
  logEvent(eventType: string, tenantId: string, result: WebhookResult): void {
    console.log(JSON.stringify({
      event: 'polar_webhook_audit',
      timestamp: new Date().toISOString(),
      eventType,
      tenantId,
      result,
    }));
  }

  logRefund(tenantId: string, subscriptionId: string): void {
    console.warn(JSON.stringify({
      event: 'polar_refund_alert',
      timestamp: new Date().toISOString(),
      tenantId,
      subscriptionId,
    }));
  }
}
```

---

## TESTS

```typescript
// src/billing/polar-webhook-event-handler.test.ts

describe('Order Created Event', () => {
  test('should activate lifetime license for one-time purchase', () => {
    const payload = {
      type: 'order.created',
      data: {
        id: 'order_123',
        product_id: 'prod_pro',
        metadata: { tenantId: 'tenant_abc' },
      },
    };

    const result = handler.handleEvent(payload);

    expect(result.handled).toBe(true);
    expect(result.action).toBe('activated');
  });
});

describe('Refund Created Event', () => {
  test('should downgrade to FREE and log audit alert', () => {
    const payload = {
      type: 'refund.created',
      data: {
        subscription_id: 'sub_xyz',
        metadata: { tenantId: 'tenant_abc' },
      },
    };

    const result = handler.handleEvent(payload);

    expect(result.handled).toBe(true);
    expect(result.action).toBe('deactivated');
    expect(result.tier).toBe('free');
  });
});
```

---

## VERIFICATION

- [ ] `order.created` event handled
- [ ] `refund.created` event handled
- [ ] Audit logger created
- [ ] Unit tests passing
- [ ] Integration test passing
