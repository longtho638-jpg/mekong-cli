# ROIaaS Phase 2 Plan

**Date:** 2026-03-05
**Status:** Planning Complete

---

## Phase 1 Summary (✅ COMPLETE)

| Feature | Status | Tests |
|---------|--------|-------|
| License gating (raas-gate.ts) | ✅ Done | 30 tests |
| Rate limiting | ✅ Done | 51 tests |
| API middleware | ✅ Done | Integrated |
| Documentation | ✅ Done | 2 docs |

---

## Phase 2 Features

### 1. Usage Quota Tracking

**File:** `src/lib/usage-quota.ts`

**Features:**
- Track API calls per license key
- Monthly quotas by tier:
  - FREE: 1,000 calls/month
  - PRO: 10,000 calls/month
  - ENTERPRISE: 100,000 calls/month
- Reset on billing cycle
- Alert thresholds: 80%, 90%, 100%

**Implementation:**
```typescript
interface UsageQuota {
  licenseKey: string;
  periodStart: Date;
  periodEnd: Date;
  used: number;
  limit: number;
  alertThresholds: number[];
}

class UsageQuotaService {
  increment(key: string): Promise<number>;
  getUsage(key: string): Promise<UsageQuota>;
  reset(key: string): Promise<void>;
}
```

---

### 2. Billing Webhooks (Polar.sh)

**File:** `src/api/webhooks/polar-webhook.ts`

**Events:**
- `subscription.created` - Activate license
- `subscription.activated` - Enable features
- `subscription.deactivated` - Disable features
- `subscription.updated` - Tier change
- `payment.paid` - Extend subscription
- `payment.failed` - Send warning

**Implementation:**
```typescript
app.post('/api/webhooks/polar', async (c) => {
  const signature = c.req.header('X-Polar-Signature');
  const event = await verifyWebhook(signature, body);

  switch (event.type) {
    case 'subscription.created':
      await activateLicense(event.data);
      break;
    case 'subscription.deactivated':
      await deactivateLicense(event.data);
      break;
  }
});
```

---

### 3. Analytics Dashboard

**File:** `src/api/analytics/usage-analytics.ts`

**Metrics:**
- API calls per tenant/license
- Rate limit hits
- Quota burn rate
- Revenue by tier
- Active users

**Endpoints:**
- `GET /api/analytics/usage` - Usage metrics
- `GET /api/analytics/revenue` - Revenue tracking
- `GET /api/analytics/limits` - Rate limit analytics

**Response:**
```json
{
  "tenant": "tenant-123",
  "period": {
    "start": "2026-03-01",
    "end": "2026-03-31"
  },
  "usage": {
    "total": 5432,
    "limit": 10000,
    "remaining": 4567,
    "percentUsed": 54.32
  },
  "rateLimits": {
    "hits": 12,
    "byEndpoint": {
      "/api/optimization": 8,
      "/api/strategies": 4
    }
  }
}
```

---

## Implementation Phases

### Phase 2A: Usage Quota (Week 1)
- [ ] Create `src/lib/usage-quota.ts`
- [ ] Add Redis storage backend
- [ ] Create unit tests
- [ ] Integrate with rate limiter
- [ ] Add quota headers to responses

### Phase 2B: Billing Webhooks (Week 2)
- [ ] Create `src/api/webhooks/polar-webhook.ts`
- [ ] Implement webhook verification
- [ ] Handle subscription events
- [ ] Add webhook test endpoint
- [ ] Create integration tests

### Phase 2C: Analytics Dashboard (Week 3)
- [ ] Create `src/api/analytics/usage-analytics.ts`
- [ ] Add metrics collection
- [ ] Create dashboard API endpoints
- [ ] Build frontend dashboard (optional)
- [ ] Add alerting system

---

## Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| Redis | Quota storage | Need to install |
| Polar.sh SDK | Webhook verification | Need to install |
| TimescaleDB | Analytics storage | Optional |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Quota accuracy | 99.9% |
| Webhook delivery | < 100ms latency |
| Analytics freshness | < 5 min delay |
| Alert delivery | 100% at thresholds |

---

## Files to Create

```
src/
├── lib/
│   ├── usage-quota.ts
│   └── usage-quota.test.ts
├── api/
│   ├── webhooks/
│   │   └── polar-webhook.ts
│   └── analytics/
│       └── usage-analytics.ts
docs/
├── USAGE_QUOTA.md
├── BILLING_WEBHOOKS.md
└── ANALYTICS_GUIDE.md
```

---

## Next Steps

1. Review and approve plan
2. Install Redis dependency
3. Implement Phase 2A (Usage Quota)
4. Test quota tracking
5. Implement Phase 2B (Webhooks)
6. Implement Phase 2C (Analytics)
7. Full integration testing
8. Deploy to production

---

## Open Questions

1. Should quota reset be automatic or manual?
2. What happens when quota is exceeded? (block vs overage charges)
3. Should we offer quota top-ups?
4. Frontend dashboard priority?

---

**Recommendation:** Start with Phase 2A (Usage Quota) as it builds on existing rate limiting infrastructure.
