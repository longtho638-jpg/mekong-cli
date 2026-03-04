---
description: 📈 Analytics Report — Google Analytics, Plausible, User Metrics
argument-hint: [--from=7d] [--to=today] [--export=csv]
---

**Think harder** để analytics report: <$ARGUMENTS>

**IMPORTANT:** Analytics PHẢI track: pageviews, conversions, retention — export weekly.

## Google Analytics 4

```bash
# === Install GA4 CLI ===
npm install -g @google-analytics/data

# === Get Access Token ===
gcloud auth print-access-token

# === Realtime Users ===
curl "https://analyticsdata.googleapis.com/v1beta/properties/PROPERTY_ID:runRealtimeReport" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{
    "dimensions": [{"name": "pageTitle"}],
    "metrics": [{"name": "activeUsers"}]
  }'

# === Page Views (7 days) ===
curl "https://analyticsdata.googleapis.com/v1beta/properties/PROPERTY_ID:runReport" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{
    "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
    "dimensions": [{"name": "pagePath"}],
    "metrics": [{"name": "screenPageViews"}]
  }'
```

## Plausible Analytics

```bash
# === API Stats ===
curl "https://plausible.io/api/v1/stats/breakdown?site_id=app.agencyos.network&period=30d&metrics=pageviews,visitors,bounce_rate,visit_duration" \
  -H "Authorization: Bearer YOUR_TOKEN"

# === Top Pages ===
curl "https://plausible.io/api/v1/stats/breakdown?site_id=app.agencyos.network&period=30d&property=visit:entry_page&metrics=visitors" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Metrics Dashboard

```typescript
// scripts/analytics-report.ts
interface AnalyticsMetrics {
  pageviews: number;
  visitors: number;
  bounceRate: number;
  sessionDuration: number;
  conversions: number;
}

async function getAnalytics(period = '7d'): Promise<AnalyticsMetrics> {
  // Fetch from GA4/Plausible API
  return {
    pageviews: 10000,
    visitors: 5000,
    bounceRate: 0.35,
    sessionDuration: 180,
    conversions: 150,
  };
}

async function generateReport() {
  const metrics = await getAnalytics();

  console.log('📈 Analytics Report');
  console.log(`Pageviews: ${metrics.pageviews.toLocaleString()}`);
  console.log(`Visitors: ${metrics.visitors.toLocaleString()}`);
  console.log(`Bounce Rate: ${(metrics.bounceRate * 100).toFixed(2)}%`);
  console.log(`Avg Session: ${Math.round(metrics.sessionDuration)}s`);
  console.log(`Conversions: ${metrics.conversions}`);
}
```

## Weekly Report

```bash
# === Schedule Weekly ===
# crontab -e
0 9 * * 1 cd /path/to/project && npm run analytics:report

# === package.json ===
{
  "scripts": {
    "analytics:report": "ts-node scripts/analytics-report.ts > reports/analytics-$(date +%Y%m%d).md"
  }
}
```

## Related Commands

- `/monitor` — System monitoring
- `/health-check` — Health checks
- `/revenue` — Revenue tracking
