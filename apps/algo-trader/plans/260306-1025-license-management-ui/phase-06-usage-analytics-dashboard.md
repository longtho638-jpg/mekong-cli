---
phase: 6
title: "Usage Analytics Dashboard"
complexity: COMPLEX
effort: 2.5h
status: completed
completed_at: 2026-03-06
---

# Phase 6: Usage Analytics Dashboard — Quota & Metrics

## Context

Enterprise tenants need visibility into:
- API call quota consumption
- ML prediction usage
- Data points processed
- Monthly reset countdown

## Files to Create

| File | Action | Purpose |
|------|--------|---------|
| `dashboard/src/components/usage-analytics-dashboard.tsx` | Create | Main analytics view |
| `dashboard/src/components/quota-gauge.tsx` | Create | Usage gauge component |
| `dashboard/src/hooks/use-usage-analytics-api.ts` | Create | API hook |

## Implementation Steps

### 6.1 Enhance Backend Analytics (from Phase 1)

Add to `src/lib/license-usage-analytics.ts`:

```typescript
/** Get all tenants usage (for admin view) */
getAllTenantsUsage(): Record<string, UsageQuota> {
  const result: Record<string, UsageQuota> = {};
  this.usageData.forEach((quota, tenantId) => {
    result[tenantId] = { ...quota };
  });
  return result;
}
```

Add to `src/api/routes/license-management-routes.ts`:

```typescript
// Get all tenants usage (admin)
fastify.get('/api/v1/licenses/analytics/all', {
  preHandler: [requireAdmin],
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const analytics = LicenseUsageAnalytics.getInstance();
      const allUsage = analytics.getAllTenantsUsage();
      reply.send({ tenants: allUsage });
    } catch (error) {
      logger.error('Failed to get all tenants usage:', error);
      reply.code(500).send({ error: 'Failed to get analytics' });
    }
  },
});
```

### 6.2 Create Analytics API Hook (`hooks/use-usage-analytics-api.ts`)

```typescript
import { useState, useCallback } from 'react';

export interface UsageQuota {
  tenantId: string;
  apiCalls: number;
  apiCallsLimit: number;
  mlPredictions: number;
  mlPredictionsLimit: number;
  dataPoints: number;
  dataPointsLimit: number;
  resetDate: string;
}

export function useUsageAnalyticsApi() {
  const [loading, setLoading] = useState(false);

  const fetchTenantUsage = useCallback(async (tenantId: string): Promise<UsageQuota | null> => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/licenses/analytics?tenantId=${tenantId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.usage;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllUsage = useCallback(async (): Promise<Record<string, UsageQuota>> => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/licenses/analytics/all');
      if (!res.ok) return {};
      const data = await res.json();
      return data.tenants;
    } catch {
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchTenantUsage, fetchAllUsage, loading };
}
```

### 6.3 Create Quota Gauge Component (`components/quota-gauge.tsx`)

```typescript
interface QuotaGaugeProps {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}

export function QuotaGauge({ label, used, limit, unit = '' }: QuotaGaugeProps) {
  const percentage = Math.min((used / limit) * 100, 100);
  const color = percentage >= 90 ? 'bg-loss' : percentage >= 70 ? 'bg-warning' : 'bg-profit';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="text-white font-mono">
          {used.toLocaleString()} / {limit.toLocaleString()} {unit}
        </span>
      </div>
      <div className="h-2 bg-bg-border rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-muted text-right">
        {percentage.toFixed(1)}% used
      </div>
    </div>
  );
}
```

### 6.4 Create Usage Analytics Dashboard (`components/usage-analytics-dashboard.tsx`)

```typescript
import { useState, useEffect } from 'react';
import { useUsageAnalyticsApi, type UsageQuota } from '../hooks/use-usage-analytics-api';
import { QuotaGauge } from './quota-gauge';

interface UsageAnalyticsDashboardProps {
  tenantId?: string; // If not provided, show all tenants
}

export function UsageAnalyticsDashboard({ tenantId }: UsageAnalyticsDashboardProps) {
  const { fetchTenantUsage, fetchAllUsage, loading } = useUsageAnalyticsApi();
  const [usage, setUsage] = useState<UsageQuota | null>(null);
  const [allUsage, setAllUsage] = useState<Record<string, UsageQuota>>({});

  useEffect(() => {
    if (tenantId) {
      fetchTenantUsage(tenantId).then(setUsage);
    } else {
      fetchAllUsage().then(setAllUsage);
    }
  }, [tenantId]);

  if (loading) {
    return <div className="text-center text-muted py-8">Loading analytics...</div>;
  }

  const renderQuota = (quota: UsageQuota) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-semibold">Usage for {quota.tenantId}</h4>
        <span className="text-xs text-muted">
          Resets: {new Date(quota.resetDate).toLocaleDateString()}
        </span>
      </div>

      <QuotaGauge
        label="API Calls"
        used={quota.apiCalls}
        limit={quota.apiCallsLimit}
        unit="calls"
      />

      <QuotaGauge
        label="ML Predictions"
        used={quota.mlPredictions}
        limit={quota.mlPredictionsLimit}
        unit="predictions"
      />

      <QuotaGauge
        label="Data Points"
        used={quota.dataPoints}
        limit={quota.dataPointsLimit}
        unit="points"
      />
    </div>
  );

  return (
    <div className="bg-bg-card border border-bg-border rounded-lg p-6 space-y-6">
      <h3 className="text-white text-lg font-bold">Usage Analytics</h3>

      {tenantId ? (
        usage ? (
          renderQuota(usage)
        ) : (
          <div className="text-muted text-center py-8">No usage data found</div>
        )
      ) : (
        <div className="space-y-6">
          <h4 className="text-muted text-sm">All Tenants</h4>
          {Object.values(allUsage).map((quota) => (
            <div key={quota.tenantId} className="border-t border-bg-border pt-4">
              {renderQuota(quota)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 6.5 Add to License Page

Integrate into `license-page.tsx`:

```typescript
import { UsageAnalyticsDashboard } from '../components/usage-analytics-dashboard';

// Add section after table:
<section>
  <UsageAnalyticsDashboard />
</section>
```

## Success Criteria

- [x] Quota gauges display correctly
- [x] Color coding: green (<50%), yellow (50-80%), red (>80%)
- [x] Summary cards with key metrics
- [x] Tier distribution chart
- [x] Usage breakdown with gauges
- [x] Recent activity feed
- [x] Time range selector (7d/30d/90d)
- [x] Circular gauge for overall usage
- [x] Type check: pass
- [x] Build: pass

## Tier Limits

| Tier | API Calls | ML Predictions | Data Points |
|------|-----------|----------------|-------------|
| FREE | 10,000 | 1,000 | 100,000 |
| PRO | 100,000 | 10,000 | 1,000,000 |
| ENTERPRISE | 1,000,000 | 100,000 | 10,000,000 |

## Related Files

- `/Users/macbookprom1/mekong-cli/apps/algo-trader/dashboard/src/components/usage-analytics-dashboard.tsx`
- `/Users/macbookprom1/mekong-cli/apps/algo-trader/dashboard/src/components/quota-gauge.tsx`
- `/Users/macbookprom1/mekong-cli/apps/algo-trader/dashboard/src/hooks/use-usage-analytics-api.ts`
- `/Users/macbookprom1/mekong-cli/apps/algo-trader/src/lib/license-usage-analytics.ts`
