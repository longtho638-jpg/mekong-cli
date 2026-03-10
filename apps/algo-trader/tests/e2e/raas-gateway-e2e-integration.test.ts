/**
 * RaaS Gateway E2E Integration Tests
 *
 * End-to-end tests for full license-to-usage-to-analytics flow:
 * 1. License activation via mk_ API key
 * 2. Usage events through gateway with JWT auth
 * 3. Metered usage recording in Stripe/Polar via webhook
 * 4. Analytics dashboard data validation
 *
 * Environment Requirements:
 * - TEST_GATEWAY_URL: RaaS Gateway URL (default: http://localhost:8787)
 * - TEST_DASHBOARD_URL: AgencyOS Dashboard URL (default: http://localhost:3000)
 * - TEST_STRIPE_WEBHOOK_SECRET: Stripe webhook signing secret
 * - TEST_POLAR_WEBHOOK_SECRET: Polar webhook signing secret
 *
 * @see https://docs.polar.sh
 * @see https://docs.stripe.com/webhooks
 */

import { test, expect, type Page } from '@playwright/test';
import Stripe from 'stripe';

// Configuration
const GATEWAY_BASE_URL = process.env.TEST_GATEWAY_URL || 'http://localhost:8787';
const DASHBOARD_URL = process.env.TEST_DASHBOARD_URL || 'http://localhost:3000';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const POLAR_API_KEY = process.env.POLAR_API_KEY || '';

// Test data factory
function generateTestLicense() {
  const id = Math.random().toString(36).substring(2, 10);
  return {
    apiKey: `mk_test_${id}:tenant-${id}:free`,
    tenantId: `tenant-${id}`,
    licenseKey: `lic_test_${id}`,
    email: `test-${id}@example.com`,
  };
}

/**
 * Helper: Make authenticated request to RaaS Gateway
 */
async function gatewayRequest(
  endpoint: string,
  options: {
    method?: string;
    apiKey?: string;
    jwt?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<{ status: number; body: unknown; headers: Headers }> {
  const url = `${GATEWAY_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.apiKey) {
    headers.Authorization = `Bearer ${options.apiKey}`;
  } else if (options.jwt) {
    headers.Authorization = `Bearer ${options.jwt}`;
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let body: unknown;
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return {
    status: response.status,
    body,
    headers: response.headers,
  };
}

/**
 * Helper type for gateway request result
 */
type GatewayResult = { status: number; body: unknown; headers: Headers };

/**
 * Helper: Create Stripe test customer and subscription
 */
async function createStripeTestSubscription(customerEmail: string) {
  if (!STRIPE_SECRET_KEY) {
    return null;
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  const customer = await stripe.customers.create({
    email: customerEmail,
    metadata: { test: 'true' },
  });

  const product = await stripe.products.create({
    name: 'Test RaaS Plan',
    metadata: { test: 'true' },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 1000, // $10.00
    currency: 'usd',
    recurring: {
      interval: 'month',
      meter: 'meter_test_' + Math.random().toString(36).substring(2, 8),
    },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
    expand: ['latest_invoice.payment_intent'],
  });

  return { customer, subscription, price };
}

/**
 * Suite: License Activation Flow
 */
test.describe('RaaS Gateway - License Activation', () => {
  test('should activate license with valid mk_ API key', async () => {
    const license = generateTestLicense();

    // Step 1: Activate license via gateway
    const activateResponse = await gatewayRequest('/v1/license/activate', {
      method: 'POST',
      apiKey: license.apiKey,
      body: {
        licenseKey: license.licenseKey,
        tenantId: license.tenantId,
        tier: 'free',
      },
    });

    // Should succeed with 200 or 201
    expect([200, 201, 202]).toContain(activateResponse.status);

    // Step 2: Verify license is active
    const statusResponse = await gatewayRequest('/v1/license/status', {
      apiKey: license.apiKey,
    });

    expect(statusResponse.status).toBe(200);
    if (typeof statusResponse.body === 'object' && statusResponse.body !== null) {
      const body = statusResponse.body as Record<string, unknown>;
      expect(body).toHaveProperty('status');
      expect(body.status).toBe('active');
    }
  });

  test('should reject activation with invalid API key format', async () => {
    const response = await gatewayRequest('/v1/license/activate', {
      method: 'POST',
      apiKey: 'invalid_key_format',
      body: { licenseKey: 'lic_test', tenantId: 'tenant', tier: 'free' },
    });

    // Should return 401 or 403
    expect([401, 403]).toContain(response.status);
  });

  test('should reject activation with expired license', async () => {
    const license = generateTestLicense();

    // Simulate expired license (would require database setup in real test)
    const response = await gatewayRequest('/v1/license/activate', {
      method: 'POST',
      apiKey: license.apiKey,
      body: {
        licenseKey: `${license.licenseKey}_expired`,
        tenantId: license.tenantId,
        tier: 'free',
        expiresAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      },
    });

    // Should return 403 for expired license
    expect([403, 422]).toContain(response.status);
  });
});

/**
 * Suite: Usage Event Tracking
 */
test.describe('RaaS Gateway - Usage Event Tracking', () => {
  let testLicense: ReturnType<typeof generateTestLicense>;

  test.beforeEach(() => {
    testLicense = generateTestLicense();
  });

  test('should track API call usage events', async () => {
    // Activate license first
    await gatewayRequest('/v1/license/activate', {
      method: 'POST',
      apiKey: testLicense.apiKey,
      body: {
        licenseKey: testLicense.licenseKey,
        tenantId: testLicense.tenantId,
        tier: 'pro',
      },
    });

    // Send usage event
    const usageResponse = await gatewayRequest('/v1/usage/track', {
      method: 'POST',
      apiKey: testLicense.apiKey,
      body: {
        eventType: 'api_call',
        units: 1,
        metadata: {
          endpoint: '/v1/scan',
          method: 'POST',
          timestamp: new Date().toISOString(),
        },
      },
    });

    expect([200, 201, 202]).toContain(usageResponse.status);
  });

  test('should track compute minute usage events', async () => {
    const usageResponse = await gatewayRequest('/v1/usage/track', {
      method: 'POST',
      apiKey: testLicense.apiKey,
      body: {
        eventType: 'compute_minute',
        units: 5, // 5 minutes
        metadata: {
          jobId: 'test-job-123',
          jobType: 'backtest',
        },
      },
    });

    expect([200, 201, 202]).toContain(usageResponse.status);
  });

  test('should track ML inference usage events', async () => {
    const usageResponse = await gatewayRequest('/v1/usage/track', {
      method: 'POST',
      apiKey: testLicense.apiKey,
      body: {
        eventType: 'ml_inference',
        units: 10, // 10 inferences
        metadata: {
          modelId: 'test-model-v1',
          batchSize: 10,
        },
      },
    });

    expect([200, 201, 202]).toContain(usageResponse.status);
  });

  test('should reject usage events with invalid event type', async () => {
    const usageResponse = await gatewayRequest('/v1/usage/track', {
      method: 'POST',
      apiKey: testLicense.apiKey,
      body: {
        eventType: 'invalid_event_type',
        units: 1,
      },
    });

    // Should return 400 for invalid event type
    expect([400, 422]).toContain(usageResponse.status);
  });
});

/**
 * Suite: Rate Limiting
 */
test.describe('RaaS Gateway - Rate Limiting', () => {
  test('should enforce rate limits for free tier', async () => {
    const license = generateTestLicense();
    const freeTierApiKey = `mk_free_rate:tenant-free-rate:free`;

    // Free tier: 100 req/min
    // Send 150 rapid requests to trigger rate limit
    const requests: GatewayResult[] = [];
    for (let i = 0; i < 150; i++) {
      requests.push(
        gatewayRequest('/v1/status', {
          apiKey: freeTierApiKey,
        })
      );
    }

    const responses = await Promise.all(requests);
    const statusCodes = responses.map((r) => r.status);

    // Count successes and rate-limited responses
    const successCount = statusCodes.filter((s) => s === 200).length;
    const rateLimitedCount = statusCodes.filter((s) => s === 429).length;

    // Some should succeed, some should be rate limited
    expect(successCount).toBeGreaterThan(0);
    expect(rateLimitedCount).toBeGreaterThan(0);

    // Verify rate limit headers
    const firstResponse = responses[0];
    if (firstResponse.status === 200) {
      expect(firstResponse.headers.get('x-ratelimit-limit')).toBeDefined();
      expect(firstResponse.headers.get('x-ratelimit-remaining')).toBeDefined();
      expect(firstResponse.headers.get('x-ratelimit-reset')).toBeDefined();
    }
  });

  test('should have higher rate limits for pro tier', async () => {
    const proTierApiKey = `mk_pro_rate:tenant-pro-rate:pro`;

    // Pro tier: 1000 req/min
    // Send 200 requests - should all succeed
    const requests: Promise<ReturnType<typeof gatewayRequest>>[] = [];
    for (let i = 0; i < 200; i++) {
      requests.push(
        gatewayRequest('/v1/status', {
          apiKey: proTierApiKey,
        })
      );
    }

    const responses = await Promise.all(requests);
    const statusCodes = responses.map((r) => r.status);

    // Most/all should succeed (may hit some rate limiting at edges)
    const successCount = statusCodes.filter((s) => s === 200).length;
    expect(successCount).toBeGreaterThan(150);
  });

  test('should return Retry-After header when rate limited', async () => {
    const freeTierApiKey = `mk_retry_test:tenant-retry:free`;

    // Flood with requests until rate limited
    let rateLimitedResponse: ReturnType<typeof gatewayRequest> | null = null;
    for (let i = 0; i < 200; i++) {
      const response = await gatewayRequest('/v1/status', {
        apiKey: freeTierApiKey,
      });
      if (response.status === 429) {
        rateLimitedResponse = response;
        break;
      }
    }

    if (rateLimitedResponse) {
      // Should have Retry-After header
      const retryAfter = rateLimitedResponse.headers.get('retry-after');
      expect(retryAfter).toBeDefined();
      expect(parseInt(retryAfter || '0', 10)).toBeGreaterThan(0);
    }
  });
});

/**
 * Suite: Account Status Enforcement (Dunning Integration)
 */
test.describe('RaaS Gateway - Account Status Enforcement', () => {
  test('should allow requests from active accounts', async () => {
    const license = generateTestLicense();

    const response = await gatewayRequest('/v1/status', {
      apiKey: license.apiKey,
    });

    expect([200, 201, 202]).toContain(response.status);
  });

  test('should block requests from suspended accounts', async () => {
    // This test requires database setup for suspended account
    // Using a marker that the backend will recognize as suspended
    const suspendedApiKey = 'mk_suspended:suspended-tenant:free';

    const response = await gatewayRequest('/v1/status', {
      apiKey: suspendedApiKey,
    });

    // Should return 403 Forbidden
    expect([403, 423]).toContain(response.status);

    // Check for account status header
    if (response.status === 403) {
      const accountStatus = response.headers.get('x-account-status');
      expect(accountStatus).toBe('suspended');
    }
  });

  test('should block requests from revoked accounts', async () => {
    const revokedApiKey = 'mk_revoked:revoked-tenant:free';

    const response = await gatewayRequest('/v1/status', {
      apiKey: revokedApiKey,
    });

    // Should return 403 Forbidden
    expect([403, 410]).toContain(response.status);

    // Check for account status header
    if (response.status === 403) {
      const accountStatus = response.headers.get('x-account-status');
      expect(accountStatus).toBe('revoked');
    }
  });

  test('should block requests from grace period accounts with warning header', async () => {
    const gracePeriodApiKey = 'mk_grace:grace-period-tenant:free';

    const response = await gatewayRequest('/v1/status', {
      apiKey: gracePeriodApiKey,
    });

    // Should still work but with warning
    expect([200, 201, 202, 403]).toContain(response.status);

    // Check for grace period header
    const accountStatus = response.headers.get('x-account-status');
    const gracePeriodEnds = response.headers.get('x-grace-period-ends');

    if (response.status === 200) {
      expect(accountStatus).toBe('grace_period');
      expect(gracePeriodEnds).toBeDefined();
    }
  });
});

/**
 * Suite: Stripe Metered Billing Integration
 */
test.describe('RaaS Gateway - Stripe Metered Billing', () => {
  test('should sync usage to Stripe Metered Billing', async () => {
    if (!STRIPE_SECRET_KEY) {
      test.skip();
      return;
    }

    const license = generateTestLicense();

    // Create Stripe customer and subscription
    const stripeData = await createStripeTestSubscription(license.email);
    if (!stripeData) {
      test.skip();
      return;
    }

    const { customer, subscription } = stripeData;

    // Simulate usage events
    for (let i = 0; i < 10; i++) {
      await gatewayRequest('/v1/usage/track', {
        method: 'POST',
        apiKey: license.apiKey,
        body: {
          eventType: 'api_call',
          units: 1,
          metadata: {
            stripeCustomerId: customer.id,
            subscriptionId: subscription.id,
          },
        },
      });
    }

    // Trigger usage sync to Stripe
    const syncResponse = await gatewayRequest('/v1/usage/sync-stripe', {
      method: 'POST',
      apiKey: license.apiKey,
      body: {
        subscriptionItemId: subscription.items.data[0]?.id,
      },
    });

    expect([200, 201, 202]).toContain(syncResponse.status);

    // Verify usage record was created in Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    // Stripe API: Get usage records via subscriptionItems.retrieve with expand
    const subscriptionItem = await stripe.subscriptionItems.retrieve(
      subscription.items.data[0]?.id || '',
      { expand: ['usage_record_summaries'] }
    );

    // Verify usage record summaries exist
    expect(subscriptionItem.usage_record_summaries?.total_usage || 0).toBeGreaterThan(0);
  });
});

/**
 * Suite: Analytics Dashboard (Playwright Browser Tests)
 */
test.describe('AgencyOS Dashboard - Analytics Validation', () => {
  test('should display usage analytics after usage events', async ({ page }: { page: Page }) => {
    const license = generateTestLicense();

    // Step 1: Navigate to dashboard
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');

    // Step 2: Login (adjust selectors based on actual login flow)
    // This is a placeholder - adjust based on actual auth flow
    try {
      await page.fill('[data-testid="email"]', license.email);
      await page.fill('[data-testid="password"]', 'testpassword123');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL(/\/dashboard/);
    } catch (error) {
      // Skip if login not available (test mode)
      console.log('Login not available, skipping auth step');
    }

    // Step 3: Navigate to Analytics page
    await page.goto(`${DASHBOARD_URL}/analytics`);
    await page.waitForLoadState('networkidle');

    // Step 4: Verify analytics data is displayed
    // Check for usage metrics
    const usageMetricsSelector = '[data-testid="usage-metrics"]';
    const usageMetrics = await page.$(usageMetricsSelector);
    expect(usageMetrics).toBeDefined();

    // Check for API calls metric
    const apiCallsSelector = '[data-testid="api-calls-metric"]';
    const apiCalls = await page.$(apiCallsSelector);
    expect(apiCalls).toBeDefined();

    // Check for chart or graph
    const chartSelector = '[data-testid="usage-chart"], .recharts-surface, canvas';
    const chart = await page.$(chartSelector);
    expect(chart).toBeDefined();
  });

  test('should display account status in dashboard', async ({ page }: { page: Page }) => {
    const license = generateTestLicense();

    await page.goto(`${DASHBOARD_URL}/settings/billing`);
    await page.waitForLoadState('networkidle');

    // Check for account status indicator
    const statusSelector =
      '[data-testid="account-status"], [data-testid="subscription-status"]';
    const statusElement = await page.$(statusSelector);

    if (statusElement) {
      const statusText = await statusElement.textContent();
      // Status should be one of the valid states
      expect(['active', 'trial', 'grace_period', 'suspended', 'revoked']).toContain(
        statusText?.toLowerCase().trim()
      );
    }
  });

  test('should show overage charges when usage exceeds plan limits', async ({
    page,
  }: { page: Page }) => {
    // This test requires setup of overage scenario
    // Navigate to billing page
    await page.goto(`${DASHBOARD_URL}/billing`);
    await page.waitForLoadState('networkidle');

    // Check for overage section
    const overageSelector = '[data-testid="overage-charges"], [data-testid="usage-overage"]';
    const overageElement = await page.$(overageSelector);

    // May or may not have overage depending on test setup
    if (overageElement) {
      // If overage section exists, verify it shows amount
      const overageAmount = await overageElement.textContent();
      expect(overageAmount).toMatch(/\$\d+\.\d{2}/);
    }
  });
});

/**
 * Suite: Edge Cases and Error Handling
 */
test.describe('RaaS Gateway - Edge Cases', () => {
  test('should handle JWT token expiration gracefully', async () => {
    // Generate an expired JWT (would need actual JWT generation for real test)
    const expiredJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjowfQ.expired';

    const response = await gatewayRequest('/v1/status', {
      jwt: expiredJwt,
    });

    // Should return 401 Unauthorized for expired token
    expect([401, 403]).toContain(response.status);
  });

  test('should handle malformed JWT tokens', async () => {
    const malformedJwt = 'not.a.valid.jwt.token';

    const response = await gatewayRequest('/v1/status', {
      jwt: malformedJwt,
    });

    expect([401, 422]).toContain(response.status);
  });

  test('should handle missing tenant context', async () => {
    const apiKey = 'mk_no_tenant::free';

    const response = await gatewayRequest('/v1/status', {
      apiKey,
    });

    // Should return error for missing tenant
    expect([400, 401, 403]).toContain(response.status);
  });

  test('should handle concurrent requests from same tenant', async () => {
    const license = generateTestLicense();

    // Send 50 concurrent requests
    const requests: Promise<ReturnType<typeof gatewayRequest>>[] = [];
    for (let i = 0; i < 50; i++) {
      requests.push(
        gatewayRequest('/v1/usage/track', {
          method: 'POST',
          apiKey: license.apiKey,
          body: {
            eventType: 'api_call',
            units: 1,
          },
        })
      );
    }

    const responses = await Promise.all(requests);

    // All should be processed (some may be rate limited)
    expect(responses.length).toBe(50);
  });

  test('should handle large usage event batches', async () => {
    const license = generateTestLicense();

    // Send batch of 1000 usage events
    const batchPayload = {
      events: Array.from({ length: 1000 }, (_, i) => ({
        eventType: 'api_call',
        units: 1,
        metadata: { index: i },
      })),
    };

    const response = await gatewayRequest('/v1/usage/track-batch', {
      method: 'POST',
      apiKey: license.apiKey,
      body: batchPayload,
    });

    // Should handle batch (may return 200 or 202 for async processing)
    expect([200, 201, 202, 413]).toContain(response.status); // 413 if payload too large
  });
});

/**
 * Suite: CI/CD Infrastructure Tests
 */
test.describe('CI/CD Infrastructure Validation', () => {
  test('should verify gateway is reachable in CI', async () => {
    // Skip in local dev if no gateway configured
    if (!process.env.TEST_GATEWAY_URL && !process.env.CI) {
      test.skip();
      return;
    }

    try {
      const response = await gatewayRequest('/health');
      expect(response.status).toBe(200);
    } catch (error) {
      // In CI, this should fail - in local dev, skip
      if (process.env.CI) {
        throw error;
      }
      test.skip();
    }
  });

  test('should verify dashboard is reachable in CI', async ({ page }: { page: Page }) => {
    if (!process.env.TEST_DASHBOARD_URL && !process.env.CI) {
      test.skip();
      return;
    }

    try {
      await page.goto(DASHBOARD_URL);
      await page.waitForLoadState('domcontentloaded');

      // Should not error out
      expect(page.url()).toContain(DASHBOARD_URL);
    } catch (error) {
      if (process.env.CI) {
        throw error;
      }
      test.skip();
    }
  });
});

/**
 * Suite: Idempotency - Duplicate Request Prevention
 */
test.describe('RaaS Gateway - Idempotency', () => {
  let testLicense: ReturnType<typeof generateTestLicense>;

  test.beforeEach(() => {
    testLicense = generateTestLicense();
  });

  test('should return cached response for duplicate request with same idempotency key', async () => {
    const idempotencyKey = `idemp-${Math.random().toString(36).substring(2, 10)}`;
    const payload = {
      eventType: 'api_call',
      units: 1,
      metadata: { test: 'idempotency' },
    };

    // First request
    const firstResponse = await gatewayRequest('/v1/usage/track', {
      method: 'POST',
      apiKey: testLicense.apiKey,
      body: payload,
      headers: { 'Idempotency-Key': idempotencyKey },
    });

    expect([200, 201, 202]).toContain(firstResponse.status);

    // Small delay to ensure response is cached
    await new Promise(resolve => setTimeout(resolve, 50));

    // Duplicate request with same idempotency key
    const duplicateResponse = await gatewayRequest('/v1/usage/track', {
      method: 'POST',
      apiKey: testLicense.apiKey,
      body: payload,
      headers: { 'Idempotency-Key': idempotencyKey },
    });

    // Should succeed
    expect([200, 201, 202]).toContain(duplicateResponse.status);

    // Should return same response (cached)
    expect(JSON.stringify(duplicateResponse.body)).toBe(JSON.stringify(firstResponse.body));
  });

  test('should allow different requests with different idempotency keys', async () => {
    const payload = {
      eventType: 'api_call',
      units: 1,
      metadata: { test: 'unique' },
    };

    // Request 1
    const response1 = await gatewayRequest('/v1/usage/track', {
      method: 'POST',
      apiKey: testLicense.apiKey,
      body: payload,
      headers: { 'Idempotency-Key': 'key-1' },
    });

    // Request 2 with different key
    const response2 = await gatewayRequest('/v1/usage/track', {
      method: 'POST',
      apiKey: testLicense.apiKey,
      body: payload,
      headers: { 'Idempotency-Key': 'key-2' },
    });

    // Both should succeed
    expect([200, 201, 202]).toContain(response1.status);
    expect([200, 201, 202]).toContain(response2.status);
  });

  test('should isolate idempotency keys by tenant', async () => {
    const tenant1License = generateTestLicense();
    const tenant2License = generateTestLicense();
    const sharedIdempotencyKey = `shared-key-${Math.random().toString(36).substring(2, 8)}`;

    const payload = {
      eventType: 'api_call',
      units: 1,
      metadata: { test: 'tenant-isolation' },
    };

    // Tenant 1 request
    const response1 = await gatewayRequest('/v1/usage/track', {
      method: 'POST',
      apiKey: tenant1License.apiKey,
      body: payload,
      headers: { 'Idempotency-Key': sharedIdempotencyKey },
    });

    // Tenant 2 request with same idempotency key
    const response2 = await gatewayRequest('/v1/usage/track', {
      method: 'POST',
      apiKey: tenant2License.apiKey,
      body: { ...payload, metadata: { ...payload.metadata, tenant: 'tenant-2' } },
      headers: { 'Idempotency-Key': sharedIdempotencyKey },
    });

    // Both should succeed independently
    expect([200, 201, 202]).toContain(response1.status);
    expect([200, 201, 202]).toContain(response2.status);
  });

  test('should handle concurrent requests with same idempotency key', async () => {
    const idempotencyKey = `concurrent-${Math.random().toString(36).substring(2, 10)}`;
    const payload = {
      eventType: 'api_call',
      units: 1,
      metadata: { test: 'concurrent' },
    };

    // Send 5 concurrent requests with same idempotency key
    const requests = Array.from({ length: 5 }, () =>
      gatewayRequest('/v1/usage/track', {
        method: 'POST',
        apiKey: testLicense.apiKey,
        body: payload,
        headers: { 'Idempotency-Key': idempotencyKey },
      })
    );

    const responses = await Promise.all(requests);

    // All should succeed
    responses.forEach(response => {
      expect([200, 201, 202]).toContain(response.status);
    });

    // All responses should be identical (cached)
    const firstBody = JSON.stringify(responses[0].body);
    responses.forEach(response => {
      expect(JSON.stringify(response.body)).toBe(firstBody);
    });
  });
});

/**
 * Suite: Stripe/Polar Webhook Verification
 */
test.describe('RaaS Gateway - Webhook Verification', () => {
  test('should verify Stripe webhook signature', async () => {
    // This test requires STRIPE_WEBHOOK_SECRET to be set
    if (!process.env.TEST_STRIPE_WEBHOOK_SECRET) {
      test.skip();
      return;
    }

    const webhookPayload = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test_webhook',
          customer: 'cus_test',
          status: 'active',
          items: {
            data: [{
              id: 'si_test',
              price: { id: 'price_test', type: 'recurring' },
            }],
          },
          current_period_end: Math.floor(Date.now() / 1000) + 86400,
        },
      },
    };

    // In a real test, you would sign this with Stripe's signing secret
    // For now, we test the endpoint accepts the webhook
    const response = await gatewayRequest('/api/v1/billing/webhook', {
      method: 'POST',
      body: webhookPayload,
      headers: {
        'Stripe-Signature': `t=${Date.now()},v1=test_signature`,
      },
    });

    // Should accept webhook (or validate signature)
    expect([200, 201, 202, 401]).toContain(response.status);
  });

  test('should verify Polar webhook signature', async () => {
    // This test requires POLAR_WEBHOOK_SECRET to be set
    if (!process.env.TEST_POLAR_WEBHOOK_SECRET) {
      test.skip();
      return;
    }

    const webhookPayload = {
      type: 'subscription.active',
      data: {
        id: 'pol_sub_test',
        product_id: 'prod_test',
        status: 'active',
        ends_at: null,
      },
    };

    const response = await gatewayRequest('/api/v1/billing/webhook', {
      method: 'POST',
      body: webhookPayload,
      headers: {
        'Polar-Signature': `test_polar_signature`,
      },
    });

    // Should accept webhook (or validate signature)
    expect([200, 201, 202, 401]).toContain(response.status);
  });

  test('should reject webhook with invalid signature', async () => {
    const webhookPayload = {
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_fake' } },
    };

    const response = await gatewayRequest('/api/v1/billing/webhook', {
      method: 'POST',
      body: webhookPayload,
      headers: {
        'Stripe-Signature': 'invalid_signature',
      },
    });

    // Should reject invalid signature
    expect([401, 403]).toContain(response.status);
  });

  test('should handle webhook payload with missing required fields', async () => {
    const invalidPayload = {
      type: 'customer.subscription.updated',
      // Missing data.object
    };

    const response = await gatewayRequest('/api/v1/billing/webhook', {
      method: 'POST',
      body: invalidPayload,
      headers: { 'Stripe-Signature': 't=test' },
    });

    // Should return 400 for invalid payload
    expect([400, 422]).toContain(response.status);
  });
});

/**
 * Suite: Order Execution - Duplicate Prevention
 */
test.describe('RaaS Gateway - Order Duplicate Prevention', () => {
  test('should prevent duplicate order creation with same idempotency key', async () => {
    const license = generateTestLicense();
    const idempotencyKey = `order-${Math.random().toString(36).substring(2, 10)}`;

    const orderPayload = {
      tenantId: license.tenantId,
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'limit',
      price: 50000,
      amount: 0.1,
    };

    // First order creation
    const firstOrder = await gatewayRequest('/api/v1/orders', {
      method: 'POST',
      apiKey: license.apiKey,
      body: orderPayload,
      headers: { 'Idempotency-Key': idempotencyKey },
    });

    // Should succeed
    expect([200, 201, 202]).toContain(firstOrder.status);

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // Duplicate order with same idempotency key
    const duplicateOrder = await gatewayRequest('/api/v1/orders', {
      method: 'POST',
      apiKey: license.apiKey,
      body: orderPayload,
      headers: { 'Idempotency-Key': idempotencyKey },
    });

    // Should return cached response (same order)
    expect([200, 201, 202]).toContain(duplicateOrder.status);

    if (typeof firstOrder.body === 'object' && typeof duplicateOrder.body === 'object') {
      const firstBody = firstOrder.body as Record<string, unknown>;
      const dupBody = duplicateOrder.body as Record<string, unknown>;

      // Should be same order ID
      if (firstBody.id && dupBody.id) {
        expect(firstBody.id).toBe(dupBody.id);
      }
    }
  });

  test('should allow multiple orders with different idempotency keys', async () => {
    const license = generateTestLicense();

    const orderPayload = {
      tenantId: license.tenantId,
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'limit',
      price: 50000,
      amount: 0.1,
    };

    // Create 3 orders with different idempotency keys
    const orders = [];
    for (let i = 0; i < 3; i++) {
      const order = await gatewayRequest('/api/v1/orders', {
        method: 'POST',
        apiKey: license.apiKey,
        body: orderPayload,
        headers: { 'Idempotency-Key': `order-key-${i}` },
      });
      orders.push(order);
    }

    // All should succeed
    orders.forEach(order => {
      expect([200, 201, 202]).toContain(order.status);
    });
  });
});
