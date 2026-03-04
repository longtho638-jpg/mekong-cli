---
description: ⚡ Performance Testing — Load, Stress, k6, Artillery, Lighthouse
argument-hint: [test-file] [--duration=30s] [--vus=10]
---

**Think harder** để perf test: <test-file>$ARGUMENTS</test-file>

**IMPORTANT:** Performance tests PHẢI xác định: LCP < 2.5s, FID < 100ms, CLS < 0.1, p95 < 500ms.

## Load Testing Tools

| Tool | Type | Protocol | Best For |
|------|------|----------|----------|
| **k6** | JS-based | HTTP/WS | Dev-friendly, CI/CD |
| **Artillery** | YAML/JS | HTTP/WS/SSE | Quick scenarios |
| **JMeter** | GUI | Multi-protocol | Enterprise, legacy |
| **Locust** | Python | HTTP | Python teams |
| **Gatling** | Scala | HTTP | High performance |

## k6 Load Testing

```bash
# === Install k6 ===
# macOS
brew install k6

# Ubuntu/Debian
sudo apt install k6

# npm (Node.js wrapper)
npm install -D k6

# === Run Test ===
k6 run tests/perf/load-test.js

# === Run with Duration ===
k6 run --duration 60s --vus 10 tests/perf/load-test.js

# === Stress Test ===
k6 run --duration 300s --vus 50 tests/perf/stress-test.js

# === Spike Test ===
k6 run tests/perf/spike-test.js

# === Soak Test ===
k6 run --duration 3600s --vus 20 tests/perf/soak-test.js

# === Cloud Run (k6 Cloud) ===
k6 cloud tests/perf/load-test.js

# === Generate Summary ===
k6 run --summary-export=results.json tests/perf/load-test.js
```

```javascript
// tests/perf/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const p95Latency = new Trend('p95_latency');

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 VUs
    { duration: '5m', target: 50 },   // Ramp up to 50 VUs
    { duration: '10m', target: 50 },  // Stay at 50 VUs
    { duration: '5m', target: 100 },  // Ramp up to 100 VUs
    { duration: '10m', target: 100 }, // Peak load
    { duration: '5m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // p95 < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
    errors: ['rate<0.1'],              // Custom error rate < 10%
    p95_latency: ['p(95)<500'],
  },
};

export default function () {
  // Homepage
  const res1 = http.get('https://app.agencyos.network');

  check(res1, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in < 1s': (r) => r.timings.duration < 1000,
  });

  errorRate.add(res1.status !== 200);
  p95Latency.add(res1.timings.duration);

  sleep(1);

  // API endpoint
  const res2 = http.get('https://app.agencyos.network/api/health');

  check(res2, {
    'api health status is 200': (r) => r.status === 200,
    'api responds in < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(2);

  // Checkout flow
  const res3 = http.post(
    'https://app.agencyos.network/api/checkout',
    JSON.stringify({ product_id: 'prod_123', quantity: 1 }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(res3, {
    'checkout status is 200': (r) => r.status === 200,
    'checkout in < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(3);
}
```

```javascript
// tests/perf/stress-test.js
import http from 'k6/http';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '10m', target: 200 },  // Ramp to 200 VUs
    { duration: '30m', target: 200 },  // Hold stress
    { duration: '10m', target: 500 },  // Break point test
    { duration: '10m', target: 0 },    // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.2'],
  },
};

export default function () {
  const res = http.get('https://app.agencyos.network/api/products');
  errorRate.add(res.status !== 200);
}
```

## Artillery Testing

```bash
# === Install Artillery ===
npm install -g artillery

# === Run Test ===
artillery run tests/perf/scenario.yml

# === Quick Test ===
artillery quick --count 10 --num 100 https://app.agencyos.network/

# === Run with Overrides ===
artillery run --overrides '{ "phases": [{"duration": 60, "arrivalRate": 50}] }' tests/perf/scenario.yml

# === Run in Cloud ===
artillery publish-to-cloudwatch run tests/perf/scenario.yml

# === Generate Report ===
artillery report tests/perf/report.json
```

```yaml
# tests/perf/scenario.yml
config:
  target: https://app.agencyos.network
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Ramp up
    - duration: 300
      arrivalRate: 100
      name: Sustained peak
  defaults:
    headers:
      Content-Type: application/json
  variables:
    productId: "prod_123"

scenarios:
  - name: "Browse products"
    weight: 60
    flow:
      - get:
          url: "/api/products"
          capture:
            - json: "$.products[0].id"
              as: "randomProductId"
      - think: 2
      - get:
          url: "/api/products/{{randomProductId}}"
      - think: 3

  - name: "Checkout flow"
    weight: 30
    flow:
      - post:
          url: "/api/cart/add"
          json:
            product_id: "{{productId}}"
            quantity: 1
      - think: 1
      - post:
          url: "/api/checkout"
          json:
            cart_id: "{{cartId}}"
      - think: 5

  - name: "Health check"
    weight: 10
    flow:
      - get:
          url: "/api/health"
      - think: 10

```

## Lighthouse Performance

```bash
# === Install ===
npm install -D lighthouse

# === Run Audit ===
npx lighthouse https://app.agencyos.network

# === Specific Categories ===
npx lighthouse https://app.agencyos.network --only-categories=performance
npx lighthouse https://app.agencyos.network --only-categories=accessibility
npx lighthouse https://app.agencyos.network --only-categories=seo

# === Output Formats ===
npx lighthouse https://app.agencyos.network --output=html --output=json
npx lighthouse https://app.agencyos.network --output-path=./reports/lighthouse

# === Mobile Emulation ===
npx lighthouse https://app.agencyos.network --preset=mobile

# === Desktop ===
npx lighthouse https://app.agencyos.network --preset=desktop

# === CI Mode ===
npx lighthouse https://app.agencyos.network --ci --output=json

# === Budget Assertion ===
npx lighthouse https://app.agencyos.network --config-path=lighthouse-budget.json
```

```json
// lighthouse-budget.json
{
  "extends": "lighthouse:default",
  "settings": {
    "onlyCategories": ["performance"]
  },
  "budgets": [
    {
      "path": "/*",
      "resourceCounts": [
        { "resourceType": "total", "budget": 100 },
        { "resourceType": "script", "budget": 500 },
        { "resourceType": "stylesheet", "budget": 100 },
        { "resourceType": "image", "budget": 1000 },
        { "resourceType": "font", "budget": 200 }
      ],
      "resourceSizes": [
        { "resourceType": "total", "budget": 2000 },
        { "resourceType": "script", "budget": 500 },
        { "resourceType": "image", "budget": 1000 }
      ],
      "timings": [
        { "metric": "first-contentful-paint", "budget": 1500 },
        { "metric": "largest-contentful-paint", "budget": 2500 },
        { "metric": "time-to-interactive", "budget": 3500 },
        { "metric": "total-blocking-time", "budget": 300 },
        { "metric": "cumulative-layout-shift", "budget": 0.1 }
      ]
    }
  ]
}
```

## Web Vitals Monitoring

```javascript
// tests/perf/web-vitals.js
import http from 'k6/http';
import { Trend } from 'k6/metrics';

const lcp = new Trend('LCP');
const fid = new Trend('FID');
const cls = new Trend('CLS');
const fcp = new Trend('FCP');

export const options = {
  thresholds: {
    LCP: ['p(75)<2500'],
    FID: ['p(75)<100'],
    CLS: ['p(75)<0.1'],
    FCP: ['p(75)<1500'],
  },
};

export default function () {
  const res = http.get('https://app.agencyos.network');

  // Simulate Web Vitals measurement
  const timing = res.timings;

  fcp.add(timing.firstByte + 100);  // Estimate FCP
  lcp.add(timing.fullPageLoad);      // Estimate LCP
  fid.add(timing.dnsLookup);         // Estimate FID

  cls.add(0.05); // Mock CLS (requires browser)
}
```

## CI/CD Integration

```yaml
# .github/workflows/perf-tests.yml
name: Performance Tests

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  performance:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Install k6
      run: |
        curl -L https://github.com/grafana/k6/releases/download/latest/k6-latest-linux-amd64.tar.gz | tar xz
        sudo mv k6-latest-linux-amd64 /usr/local/bin/k6

    - name: Run performance tests
      run: k6 run tests/perf/load-test.js

    - name: Upload results
      uses: actions/upload-artifact@v4
      with:
        name: k6-results
        path: results.json

    - name: Publish to k6 Cloud
      run: k6 run --out cloud tests/perf/load-test.js
      env:
        K6_CLOUD_TOKEN: ${{ secrets.K6_CLOUD_TOKEN }}
```

## Related Commands

- `/test` — Unit & integration tests
- `/test:e2e` — End-to-end tests
- `/test:coverage` — Test coverage analysis
- `/monitor` — Metrics & APM dashboard
- `/health-check` — System health monitoring
