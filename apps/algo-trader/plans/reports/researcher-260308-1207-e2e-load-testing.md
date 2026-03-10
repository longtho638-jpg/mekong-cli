# E2E & Load Testing Strategy Report

**Date:** 2026-03-08
**Project:** algo-trader (RaaS AgencyOS)
**Researchers:** researcher agent

---

## 1. Playwright E2E Test Structure

### Current Implementation (`tests/e2e/raas-gateway-e2e-integration.test.ts`)

**Test Suites (7 total):**
| Suite | Tests | Coverage |
|-------|-------|----------|
| License Activation | 3 | mk_ API key, format validation, expiry |
| Usage Event Tracking | 4 | api_call, compute_minute, ml_inference |
| Rate Limiting | 3 | Free tier (100/min), Pro tier (1000/min), Retry-After |
| Account Status | 4 | active, suspended, revoked, grace_period |
| Stripe Metered Billing | 1 | Usage sync to Stripe |
| Analytics Dashboard | 3 | Usage metrics, account status, overage |
| Edge Cases | 7 | JWT expiry, malformed tokens, batches |

### Test Data Factory
```typescript
function generateTestLicense() {
  const id = Math.random().toString(36).substring(2, 10);
  return {
    apiKey: `mk_test_${id}:tenant-${id}:free`,
    tenantId: `tenant-${id}`,
    licenseKey: `lic_test_${id}`,
    email: `test-${id}@example.com`,
  };
}
```

### Playwright Config Highlights
- **Timeout:** 30s per test
- **Retries (CI):** 2
- **Workers (CI):** 1 (sequential)
- **Reporters:** HTML, List, JSON, JUnit
- **Artifacts:** Screenshots, videos, traces on failure

---

## 2. k6 Load Testing Structure

### Current Load Test (`tests/load/raas-api-load-stress-benchmark.test.ts`)

**Configuration:**
- Concurrency: 50
- Iterations: 200
- Metrics: p50, p95, p99, RPS

**Endpoints Tested:**
| Endpoint | Method | Success Rate | p95 Target |
|----------|--------|--------------|------------|
| /health | GET | 100% | <500ms |
| /metrics | GET | 100% | <500ms |
| /ready | GET | 100% | <500ms |
| /api/v1/billing/products | GET | 100% | <500ms |
| /api/v1/billing/checkout | POST | 100% | <500ms |
| /api/v1/billing/webhook | POST | 100% | <500ms |

### k6 Script Structure (Recommended)

```javascript
// load-tests/webhook-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TENANT_ID = __ENV.TENANT_ID || 'load-test';
const API_KEY = __ENV.API_KEY || 'mk_load_test';

export let options = {
  vus: 100,                // Target: 100 concurrent users
  duration: '5m',          // Run for 5 minutes
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // <2s p95
    http_req_failed: ['rate<0.01'],     // <1% failure
  },
};

export default function() {
  const payload = JSON.stringify({
    tenantId: `${TENANT_ID}_${__VU}`,
    eventType: 'api_call',
    units: 1,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': `req_${__VU}_${__ITER}`,
      'X-Tenant-ID': TENANT_ID,
    },
  };

  const res = http.post(`${BASE_URL}/api/v1/usage/track`, payload, params);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(0.5);  // Think time
}
```

---

## 3. Test Scenarios Matrix

### E2E Test Scenarios
| Scenario | Tool | Auth Type | Key Headers | Expected Outcome |
|----------|------|-----------|-------------|------------------|
| License activation | Playwright | mk_ API key | Authorization | 200 + license active |
| Usage tracking | Playwright | JWT | Idempotency-Key | 200 + event recorded |
| Rate limit (free) | Playwright | mk_ API key | X-RateLimit headers | 429 after 100 req/min |
| Rate limit (pro) | Playwright | mk_ API key | X-RateLimit headers | 429 after 1000 req/min |
| Stripe webhook | Jest | HMAC-SHA256 | Stripe-Signature | 200 + subscription activated |
| Polar webhook | Jest | HMAC-SHA256 | Polar-Signature | 200 + subscription activated |
| Duplicate request | Playwright | mk_ API key | Idempotency-Key | 200 + cached response |
| Account suspended | Playwright | mk_ API key | X-Account-Status | 403 + status header |

### Load Test Scenarios
| Scenario | vus | Duration | Target <2s p95 |
|----------|-----|----------|---------------|
| Authenticated API | 100 | 5m | /api/v1/scan |
| Webhook storm | 50 | 3m | /api/v1/billing/webhook |
| Checkout spike | 30 | 2m | /api/v1/billing/checkout |
| Idempotency hotkey | 100 | 5m | Duplicate Idempotency-Key |
| Rate limit floor | 150 | 2m | Free tier hitting 429 |

---

## 4. Environment Requirements

### Required Services
| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| Redis | 6379 | Idempotency, Rate limiting | Required |
| PostgreSQL | 5432 | Subscription data | Required |
| RaaS Gateway | 8787 | Cloudflare Worker | Required for E2E |
| Dashboard | 3000 | AgencyOS UI | Required for browser tests |

### Environment Variables (E2E)
```bash
# Core
TEST_GATEWAY_URL=http://localhost:8787
TEST_DASHBOARD_URL=http://localhost:3000

# Stripe (optional - for billing tests)
STRIPE_SECRET_KEY=sk_test_...
TEST_STRIPE_WEBHOOK_SECRET=whsec_...

# Polar (optional - for billing tests)
POLAR_API_KEY=pk_test_...
TEST_POLAR_WEBHOOK_SECRET=whsec_...

# Test-specific
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

### Environment Variables (Load)
```bash
BASE_URL=http://localhost:3000
TENANT_ID=load-test
API_KEY=mk_load_test
```

---

## 5. CI/CD Integration Approach

### GitHub Actions Workflow Pattern

```yaml
name: E2E + Load Tests

on:
  push:
    branches: [main, feature/*]
  pull_request:
    branches: [main]

env:
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
  REDIS_URL: redis://localhost:6379

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_PASSWORD: postgres }
        ports: [5432:5432]
      redis:
        image: redis:7-alpine
        ports: [6379:6379]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: pnpm install
      - run: npx playwright install --with-deps
      - run: npx playwright test --reporter=list,junit
        env: { CI: 'true' }
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report/ }

  load-tests:
    runs-on: ubuntu-latest
    needs: e2e-tests

    steps:
      - uses: actions/checkout@v4
      - run: pnpm add -D k6
      - run: npx k6 run load-tests/webhook-load-test.js
        env: { BASE_URL: 'https://prod-url.com' }
```

### Test Execution Strategy
```
1.CI (push to PR):
   ├─ unit tests (jest)     <- fast, 5min
   ├─ integration tests     <- medium, 10min
   └─ e2e tests (CI mode)   <- slow, 15min

2.Main branch (after merge):
   ├─ all above + load tests
   └─ production smoke test
```

---

## 6. Key Findings & Recommendations

### Current State
| Aspect | Status | Notes |
|--------|--------|-------|
| Playwright tests | ✅ Implemented | 1400+ lines, 7 suites |
| Jest E2E webhooks | ✅ Implemented | Stripe/Polar flows |
| Load testing | ⚠️ Partial | Benchmark test exists, no k6 |
| Idempotency | ✅ Implemented | Redis + in-memory fallback |
| Rate limiting | ✅ Implemented | Redis Lua scripting |

### Recommendations

1. **Add k6 Load Testing** - Install k6 and create dedicated load tests for:
   - Webhook handling under concurrent load
   - Rate limiter validation (ensure 429 at threshold)
   - Redis idempotency under high concurrency

2. **Environment Validation** - Add health checks before tests:
   ```typescript
   // global-setup.ts enhancement
   async function validateEnvs() {
     const services = ['Redis', 'PostgreSQL'];
     // Check each service connectivity
   }
   ```

3. **Test Data Cleanup** - Implement proper teardown:
   - Delete test Stripe customers after run
   - Clean up Polar test subscriptions
   - Reset tenant state in database

4. **Flaky Test Handling** - Currently only in CI (retries: 2)
   - Consider adding bespoke retry logic for known flaky tests
   - Separate "flaky" tag for tests requiring retry

5. **Parallel Execution** - Current CI mode: workers=1
   - E2E tests isolated? If yes, increase workers to 4 in CI
   - Financial tests need isolation ( cuanto cost)

---

## Unresolved Questions

1. **k6 Deployment** - Should k6 run in CI or via scheduled cron (e.g., nightly)?
2. **Test Database** - Is there a dedicated test database or shared with dev?
3. **Webhook Secrets** - Are STRIPE_WEBHOOK_SECRET and POLAR_WEBHOOK_SECRET set in CI?
4. **Browser Tests** - Does AgencyOS dashboard have stable selectors for Playwright?
5. **Cost Control** - How to prevent Stripe/Polar test charges during E2E runs?

---

*Report generated: 2026-03-08 12:07*
*Next steps: Implement k6 load tests, add production smoke checks*
