# E2E Tests - RaaS Gateway & AgencyOS Dashboard

End-to-end integration tests for the full license-to-usage-to-analytics flow.

## Overview

This test suite validates:
1. **License Activation** - mk_ API key authentication
2. **Usage Events** - JWT-authenticated usage tracking through RaaS Gateway
3. **Stripe/Polar Metered Billing** - Webhook integration for usage recording
4. **Analytics Dashboard** - Playwright browser tests for data visualization
5. **Rate Limiting** - Tier-based rate limit enforcement
6. **Account Status** - Dunning state enforcement (active, grace_period, suspended, revoked)

## Prerequisites

### Environment Variables

```bash
# RaaS Gateway
TEST_GATEWAY_URL=http://localhost:8787

# AgencyOS Dashboard
TEST_DASHBOARD_URL=http://localhost:3000

# Stripe (for metered billing tests)
STRIPE_SECRET_KEY=sk_test_...
TEST_STRIPE_WEBHOOK_SECRET=whsec_...

# Polar (for Polar billing tests)
POLAR_API_KEY=pk_test_...
TEST_POLAR_WEBHOOK_SECRET=whsec_...
```

### Running Services

Before running E2E tests, ensure these services are running:

```bash
# Terminal 1: RaaS Gateway (Cloudflare Worker)
cd apps/raas-gateway
npm run dev

# Terminal 2: AgencyOS Dashboard
cd apps/well
npm run dev

# Terminal 3: FastAPI Backend
cd apps/algo-trader
npm run api:serve
```

## Running Tests

### All Tests

```bash
npm run test:e2e
```

### With UI

```bash
npm run test:e2e:ui
```

### Debug Mode

```bash
npm run test:e2e:debug
```

### Specific Test File

```bash
npx playwright test tests/e2e/raas-gateway-e2e-integration.test.ts
```

### Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### View Report

```bash
npm run test:e2e:report
```

## Test Structure

```
tests/e2e/
├── raas-gateway-e2e-integration.test.ts  # Main E2E test suite
├── global-setup.ts                        # One-time setup
├── global-teardown.ts                     # One-time cleanup
└── fixtures/                              # Test data fixtures (optional)
```

### Test Suites

#### 1. License Activation Flow
- Valid mk_ API key activation
- Invalid API key format rejection
- Expired license rejection

#### 2. Usage Event Tracking
- API call usage events
- Compute minute usage events
- ML inference usage events
- Invalid event type rejection

#### 3. Rate Limiting
- Free tier rate limits (100 req/min)
- Pro tier rate limits (1000 req/min)
- Retry-After header validation

#### 4. Account Status Enforcement
- Active account requests
- Suspended account blocking
- Revoked account blocking
- Grace period warnings

#### 5. Stripe Metered Billing
- Usage sync to Stripe
- Usage record creation
- Invoice generation

#### 6. Analytics Dashboard (Playwright)
- Usage metrics display
- Account status visualization
- Overage charges display

#### 7. Edge Cases
- JWT token expiration
- Malformed JWT tokens
- Missing tenant context
- Concurrent requests
- Large batch processing

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start RaaS Gateway
        run: npm run dev:worker &
        env:
          RATE_LIMIT_KV: e2e-test
          RAAS_USAGE_KV: e2e-test

      - name: Start Dashboard
        run: npm run dashboard:dev &

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          TEST_GATEWAY_URL: http://localhost:8787
          TEST_DASHBOARD_URL: http://localhost:3000
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Test Data Management

### Fixtures

Test fixtures are created in `global-setup.ts`:
- Stripe test customers
- Polar test customers
- Test tenant accounts

### Cleanup

`global-teardown.ts` handles cleanup:
- Delete test Stripe customers
- Delete test Polar customers
- Clean test database records

## Troubleshooting

### Gateway Not Reachable

```bash
# Check gateway health
curl http://localhost:8787/health

# Check gateway logs
tail -f apps/raas-gateway/wrangler-logs/*.log
```

### Dashboard Not Loading

```bash
# Check dashboard health
curl http://localhost:3000/health

# Check for build errors
cd apps/well && npm run build
```

### Stripe Tests Failing

```bash
# Verify Stripe API key
curl -u sk_test_...: https://api.stripe.com/v1/customers

# Check webhook endpoint
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Playwright Browser Issues

```bash
# Reinstall browsers
npx playwright install

# Install system dependencies
npx playwright install-deps
```

## Artifacts

After test run, artifacts are stored in:
- `playwright-report/` - HTML test report
- `playwright-results.json` - JSON test results
- `playwright-junit.xml` - JUnit XML for CI/CD
- `playwright-artifacts/` - Screenshots and videos

## Best Practices

1. **Use unique test data** - Generate random IDs for each test run
2. **Cleanup after tests** - Always delete test customers/records
3. **Handle flaky tests** - Use retries in CI only
4. **Parallel execution** - Tests should be isolated
5. **Wait for network** - Use `waitForLoadState('networkidle')`
6. **Screenshot on failure** - Already configured in playwright.config.ts
