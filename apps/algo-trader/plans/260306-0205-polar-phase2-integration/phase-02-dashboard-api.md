# Phase 2: Subscription Dashboard API

**Priority:** HIGH | **Estimate:** 3 hours

---

## API ENDPOINTS

### GET /api/v1/billing/subscription

**Response:**
```json
{
  "tenantId": "tenant_abc",
  "tier": "pro",
  "status": "active",
  "currentPeriodEnd": "2026-04-06T00:00:00Z",
  "cancelAtPeriodEnd": false
}
```

### POST /api/v1/billing/subscription

**Request:**
```json
{
  "action": "upgrade",
  "tier": "enterprise"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://polar.sh/checkout/..."
}
```

### GET /api/v1/billing/invoices

**Response:**
```json
{
  "invoices": [
    {
      "id": "inv_123",
      "amount": 4900,
      "currency": "usd",
      "status": "paid",
      "url": "https://polar.sh/invoices/inv_123"
    }
  ]
}
```

### GET /api/v1/billing/usage

**Response:**
```json
{
  "tenantId": "tenant_abc",
  "tier": "pro",
  "limits": {
    "maxStrategies": 5,
    "maxDailyLossUsd": 500,
    "maxPositionSizeUsd": 5000
  },
  "current": {
    "strategies": 2,
    "dailyLossUsd": 125,
    "positionSizeUsd": 1500
  },
  "resetAt": "2026-03-07T00:00:00Z"
}
```

---

## IMPLEMENTATION

### File: `src/api/routes/billing-dashboard-routes.ts`

```typescript
import { FastifyInstance } from 'fastify';
import { PolarSubscriptionService } from '../../billing/polar-subscription-service';
import { PolarService } from '../../payment/polar-service';
import { UsageTracker } from '../../billing/usage-tracker';

export function buildBillingDashboardRoutes(
  subscriptionService: PolarSubscriptionService,
  polarService: PolarService,
  usageTracker: UsageTracker,
) {
  return async function billingDashboardRoutes(fastify: FastifyInstance): Promise<void> {

    // GET /api/v1/billing/subscription
    fastify.get<{ Params: { tenantId: string } }>(
      '/api/v1/billing/subscription/:tenantId',
      async (req, reply) => {
        const { tenantId } = req.params;
        const sub = subscriptionService.getSubscription(tenantId);

        if (!sub) {
          return reply.send({
            tenantId,
            tier: 'free',
            status: 'inactive',
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          });
        }

        return reply.send({
          tenantId: sub.tenantId,
          tier: sub.tier,
          status: sub.active ? 'active' : 'inactive',
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtPeriodEnd: false,
        });
      }
    );

    // POST /api/v1/billing/subscription
    fastify.post<{
      Params: { tenantId: string };
      Body: { action: 'upgrade' | 'cancel'; tier?: 'pro' | 'enterprise' };
    }>(
      '/api/v1/billing/subscription/:tenantId',
      async (req, reply) => {
        const { tenantId } = req.params;
        const { action, tier } = req.body;

        if (action === 'upgrade' && tier) {
          const checkoutData = subscriptionService.generateCheckoutData({
            tenantId,
            tier: tier as 'pro' | 'enterprise',
          });

          // Call Polar API to create checkout
          const session = await polarService.createCheckoutSession(
            tier === 'pro' ? LicenseTier.PRO : LicenseTier.ENTERPRISE,
          );

          return reply.send({ checkoutUrl: session.url });
        }

        if (action === 'cancel') {
          const sub = subscriptionService.getSubscription(tenantId);
          if (sub && sub.productId) {
            await polarService.cancelSubscription(sub.productId);
          }
          return reply.send({ success: true });
        }

        return reply.status(400).send({ error: 'Invalid action' });
      }
    );

    // GET /api/v1/billing/invoices
    fastify.get<{ Params: { tenantId: string } }>(
      '/api/v1/billing/invoices/:tenantId',
      async (req, reply) => {
        // TODO: Call Polar API to fetch invoices
        return reply.send({ invoices: [] });
      }
    );

    // GET /api/v1/billing/usage
    fastify.get<{ Params: { tenantId: string } }>(
      '/api/v1/billing/usage/:tenantId',
      async (req, reply) => {
        const { tenantId } = req.params;
        const sub = subscriptionService.getSubscription(tenantId);
        const tier = sub?.tier ?? 'free';
        const limits = subscriptionService.getTierLimits(tier);
        const current = await usageTracker.getCurrentUsage(tenantId);

        return reply.send({
          tenantId,
          tier,
          limits,
          current,
          resetAt: new Date(Date.now() + 86400000).toISOString(), // Next 24h
        });
      }
    );
  };
}
```

### File: `src/billing/usage-tracker.ts`

```typescript
export interface TenantUsage {
  strategies: number;
  dailyLossUsd: number;
  positionSizeUsd: number;
}

export class UsageTracker {
  private static instance: UsageTracker;
  private usage = new Map<string, TenantUsage>();

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  async getCurrentUsage(tenantId: string): Promise<TenantUsage> {
    return this.usage.get(tenantId) ?? {
      strategies: 0,
      dailyLossUsd: 0,
      positionSizeUsd: 0,
    };
  }

  async trackStrategy(tenantId: string): Promise<void> {
    const current = await this.getCurrentUsage(tenantId);
    this.usage.set(tenantId, {
      ...current,
      strategies: current.strategies + 1,
    });
  }

  async trackLoss(tenantId: string, amountUsd: number): Promise<void> {
    const current = await this.getCurrentUsage(tenantId);
    this.usage.set(tenantId, {
      ...current,
      dailyLossUsd: current.dailyLossUsd + amountUsd,
    });
  }

  resetDailyUsage(): void {
    this.usage.clear();
  }
}
```

---

## TESTS

```typescript
// src/api/routes/billing-dashboard-routes.test.ts

describe('GET /api/v1/billing/subscription/:tenantId', () => {
  test('should return subscription status', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/billing/subscription/tenant_abc',
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.tenantId).toBe('tenant_abc');
  });
});

describe('GET /api/v1/billing/usage/:tenantId', () => {
  test('should return usage stats', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/billing/usage/tenant_abc',
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.limits).toBeDefined();
    expect(data.current).toBeDefined();
  });
});
```

---

## VERIFICATION

- [ ] 4 API endpoints implemented
- [ ] Usage tracker implemented
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] API docs updated
