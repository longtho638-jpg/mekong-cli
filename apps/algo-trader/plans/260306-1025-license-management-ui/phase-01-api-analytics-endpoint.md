---
phase: 1
title: "API Enhancement: Usage Analytics Endpoint"
complexity: SIMPLE
effort: 1h
status: pending
---

# Phase 1: API Enhancement — Usage Analytics Endpoint

## Context

Existing `license-usage-analytics.ts` has `LicenseUsageAnalytics` singleton but no API endpoint to expose usage data to the dashboard.

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/api/routes/license-management-routes.ts` | Modify | Add analytics endpoint |
| `src/lib/license-usage-analytics.ts` | Read | Use existing analytics methods |

## Implementation Steps

### 1.1 Add Analytics Endpoint (lines 183-210)

Add to `license-management-routes.ts`:

```typescript
// Get usage analytics (admin only)
fastify.get('/api/v1/licenses/analytics', {
  preHandler: [requireAdmin],
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { tenantId } = request.query as { tenantId?: string };
      const analytics = LicenseUsageAnalytics.getInstance();

      if (tenantId) {
        // Single tenant usage
        const usage = analytics.getUsage(tenantId);
        const percentages = analytics.getUsagePercentages(tenantId);
        reply.send({
          tenantId,
          usage,
          percentages,
          recentEvents: analytics.getEvents(tenantId, 100),
        });
      } else {
        // All tenants summary
        reply.send({
          summary: 'Aggregate analytics across all tenants',
          // TODO: Add aggregate methods to LicenseUsageAnalytics
        });
      }
    } catch (error) {
      logger.error('Failed to get usage analytics:', error);
      reply.code(500).send({ error: 'Failed to get usage analytics' });
    }
  },
});
```

### 1.2 Import LicenseUsageAnalytics

At top of `license-management-routes.ts`:

```typescript
import { LicenseUsageAnalytics } from '../../lib/license-usage-analytics';
```

## Success Criteria

- [ ] `GET /api/v1/licenses/analytics?tenantId=xxx` returns usage data
- [ ] Response includes: `usage`, `percentages`, `recentEvents`
- [ ] Admin-only access enforced
- [ ] Error handling for missing tenant

## Testing

```bash
# Test analytics endpoint
curl -X GET "http://localhost:3000/api/v1/licenses/analytics?tenantId=test-123" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Related Files

- `/Users/macbookprom1/mekong-cli/apps/algo-trader/src/api/routes/license-management-routes.ts`
- `/Users/macbookprom1/mekong-cli/apps/algo-trader/src/lib/license-usage-analytics.ts`
