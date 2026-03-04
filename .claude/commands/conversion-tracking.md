---
description: 🎯 Conversion Tracking — Funnel Analysis, A/B Tests, CRO Metrics
argument-hint: [--funnel=signup|checkout] [--ab=test-id]
---

**Think harder** để conversion tracking: <funnel>$ARGUMENTS</funnel>

**IMPORTANT:** Conversion PHẢI track toàn bộ funnel — awareness → activation → revenue.

## Funnel Metrics

| Stage | Metric | Target |
|-------|--------|--------|
| Awareness | Pageviews | 10K/mo |
| Interest | Time on page | > 2 min |
| Consideration | Demo requests | 5% |
| Conversion | Paid users | 2% |
| Retention | 30-day retention | > 60% |

## Tracking Code

```typescript
// src/analytics/conversions.ts
export function trackConversion(
  event: 'signup' | 'checkout' | 'upgrade',
  data: {
    userId?: string;
    value?: number;
    currency?: string;
    source?: string;
  }
) {
  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', event, {
      event_category: 'conversion',
      event_label: data.source,
      value: data.value,
      currency: data.currency,
    });
  }

  // Facebook Pixel
  if (typeof fbq !== 'undefined') {
    fbq('track', event, {
      value: data.value,
      currency: data.currency,
    });
  }

  // Internal tracking
  fetch('/api/analytics/conversion', {
    method: 'POST',
    body: JSON.stringify({ event, data }),
  });
}
```

## Funnel Analysis

```typescript
// scripts/funnel-analysis.ts
interface FunnelStep {
  name: string;
  users: number;
  conversionRate: number;
}

function analyzeFunnel(steps: FunnelStep[]) {
  console.log('🎯 Funnel Analysis\n');

  steps.forEach((step, i) => {
    const prev = i > 0 ? steps[i - 1].users : steps[0].users * 2;
    const rate = ((step.users / prev) * 100).toFixed(2);
    console.log(`${step.name}: ${step.users} users (${rate}% conversion)`);
  });

  const overallRate = ((steps[steps.length - 1].users / steps[0].users) * 100).toFixed(2);
  console.log(`\nOverall conversion: ${overallRate}%`);
}
```

## A/B Test Tracking

```typescript
// src/ab-testing.ts
export function trackABTest(
  testId: string,
  variant: 'A' | 'B',
  conversion: boolean
) {
  localStorage.setItem(`ab_${testId}`, variant);

  fetch('/api/analytics/ab-test', {
    method: 'POST',
    body: JSON.stringify({
      testId,
      variant,
      converted: conversion,
      timestamp: Date.now(),
    }),
  });
}

// Usage
trackABTest('checkout-button', 'B', true);
```

## CRO Dashboard

```sql
-- Conversion metrics by source
SELECT
  traffic_source,
  COUNT(*) as visitors,
  SUM(CASE WHEN converted THEN 1 ELSE 0 END) as conversions,
  ROUND(SUM(CASE WHEN converted THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as conversion_rate
FROM user_sessions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY traffic_source
ORDER BY conversion_rate DESC;
```

## Related Commands

- `/analytics-report` — Analytics reporting
- `/test:e2e` — E2E testing
- `/monitor` — Monitoring
