/**
 * k6 Load Test for RaaS Gateway
 *
 * Tests:
 * - JWT authentication under load
 * - mk_ API key rate limiting
 * - Idempotency key handling
 * - Usage event tracking
 * - Webhook processing
 *
 * Requirements:
 * - k6 installed: brew install k6 (macOS) or apt-get install k6 (Linux)
 * - Gateway running: http://localhost:8787
 *
 * Usage:
 *   k6 run tests/load/raas-gateway-load-test.js
 *   k6 run --vus 50 --duration 2m tests/load/raas-gateway-load-test.js
 *
 * @see https://k6.io/docs
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for detailed analysis
const errorRate = new Rate('errors');
const p95Latency = new Trend('p95_latency');
const p99Latency = new Trend('p99_latency');
const rateLimitedRate = new Rate('rate_limited');

// Test configuration from environment
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8787';
const TENANT_ID = __ENV.TENANT_ID || 'load-test-tenant';
const API_KEY = __ENV.API_KEY || `mk_load_test:${TENANT_ID}:pro`;
const JWT_TOKEN = __ENV.JWT_TOKEN || '';

// k6 load test options
export const options = {
  // Load stages: ramp up, steady state, ramp down
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 concurrent users
    { duration: '1m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users (peak load)
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],

  // Performance thresholds (must pass for CI/CD)
  thresholds: {
    http_req_duration: [
      'p(50)<500',   // p50 < 500ms
      'p(95)<2000',  // p95 < 2s (requirement)
      'p(99)<5000',  // p99 < 5s
    ],
    'errors': ['rate<0.1'],           // < 10% error rate
    'rate_limited': ['rate<0.05'],    // < 5% rate limited (expected for free tier)
    'http_req_failed': ['rate<0.05'], // < 5% failed requests
  },

  // Browser/websocket options (disabled for API tests)
  noConnectionReuse: false,
  userAgent: 'k6-load-test/1.0',
};

/**
 * Generate unique idempotency key per VU and iteration
 */
function generateIdempotencyKey() {
  return `req_${__VU}_${__ITER}_${Date.now()}`;
}

/**
 * Generate test license data
 */
function generateTestLicense() {
  const id = Math.random().toString(36).substring(2, 10);
  return {
    apiKey: `mk_test_${id}:${TENANT_ID}:pro`,
    tenantId: `${TENANT_ID}-${id}`,
    licenseKey: `lic_test_${id}`,
    email: `test-${id}@example.com`,
  };
}

/**
 * Common headers for API requests
 */
function getHeaders(options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': options.tenantId || TENANT_ID,
  };

  if (options.apiKey) {
    headers['Authorization'] = `Bearer ${options.apiKey}`;
  } else {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  if (options.jwt) {
    headers['Authorization'] = `Bearer ${options.jwt}`;
  }

  return headers;
}

/**
 * Main load test scenario
 */
export default function () {
  group('Health Check', function () {
    testHealthEndpoint();
  });

  group('License Activation', function () {
    testLicenseActivation();
  });

  group('Usage Event Tracking', function () {
    testUsageTracking();
  });

  group('Idempotency', function () {
    testIdempotency();
  });

  group('Rate Limiting', function () {
    testRateLimiting();
  });

  group('Webhook Processing', function () {
    testWebhookProcessing();
  });

  // Think time between iterations
  sleep(0.5 + Math.random() * 0.5); // 0.5-1s random think time
}

/**
 * Test: Health endpoint
 */
function testHealthEndpoint() {
  const res = http.get(`${BASE_URL}/health`, {
    headers: { 'Accept': 'application/json' },
  });

  const checkResult = check(res, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });

  errorRate.add(!checkResult);
  p95Latency.add(res.timings.duration);
  p99Latency.add(res.timings.duration);
}

/**
 * Test: License activation flow
 */
function testLicenseActivation() {
  const license = generateTestLicense();
  const idempotencyKey = generateIdempotencyKey();

  // Activate license
  const activatePayload = JSON.stringify({
    licenseKey: license.licenseKey,
    tenantId: license.tenantId,
    tier: 'pro',
  });

  const activateRes = http.post(
    `${BASE_URL}/v1/license/activate`,
    activatePayload,
    { headers: getHeaders({ apiKey: license.apiKey, idempotencyKey }) }
  );

  const activateCheck = check(activateRes, {
    'activate status is 200/201': (r) => [200, 201, 202].includes(r.status),
    'activate response has license': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.license || body.status === 'active';
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!activateCheck);

  sleep(0.1);

  // Check license status
  const statusRes = http.get(`${BASE_URL}/v1/license/status`, {
    headers: getHeaders({ apiKey: license.apiKey }),
  });

  const statusCheck = check(statusRes, {
    'status check is 200': (r) => r.status === 200,
  });

  errorRate.add(!statusCheck);
}

/**
 * Test: Usage event tracking
 */
function testUsageTracking() {
  const license = generateTestLicense();
  const idempotencyKey = generateIdempotencyKey();

  const usagePayload = JSON.stringify({
    eventType: 'api_call',
    units: 1,
    metadata: {
      endpoint: '/v1/scan',
      method: 'POST',
      timestamp: new Date().toISOString(),
      jobId: `job_${__VU}_${__ITER}`,
    },
  });

  const res = http.post(
    `${BASE_URL}/v1/usage/track`,
    usagePayload,
    { headers: getHeaders({ apiKey: license.apiKey, idempotencyKey }) }
  );

  const checkResult = check(res, {
    'usage track status is 200/201': (r) => [200, 201, 202].includes(r.status),
    'usage track response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!checkResult);
  p95Latency.add(res.timings.duration);

  // Track compute minutes (different event type)
  sleep(0.1);

  const computePayload = JSON.stringify({
    eventType: 'compute_minute',
    units: 5,
    metadata: {
      jobId: `compute_${__VU}_${__ITER}`,
      jobType: 'backtest',
    },
  });

  const computeRes = http.post(
    `${BASE_URL}/v1/usage/track`,
    computePayload,
    { headers: getHeaders({ apiKey: license.apiKey }) }
  );

  errorRate.add(!check(computeRes, {
    'compute usage track status is 200/201': (r) => [200, 201, 202].includes(r.status),
  }));
}

/**
 * Test: Idempotency - duplicate request handling
 */
function testIdempotency() {
  const license = generateTestLicense();
  const idempotencyKey = generateIdempotencyKey();

  const payload = JSON.stringify({
    eventType: 'api_call',
    units: 1,
    metadata: { test: 'idempotency' },
  });

  // First request
  const res1 = http.post(
    `${BASE_URL}/v1/usage/track`,
    payload,
    { headers: getHeaders({ apiKey: license.apiKey, idempotencyKey }) }
  );

  const check1 = check(res1, {
    'first request succeeds': (r) => [200, 201, 202].includes(r.status),
  });
  errorRate.add(!check1);

  // Small delay to ensure response is cached
  sleep(0.05);

  // Duplicate request with same idempotency key
  const res2 = http.post(
    `${BASE_URL}/v1/usage/track`,
    payload,
    { headers: getHeaders({ apiKey: license.apiKey, idempotencyKey }) }
  );

  const check2 = check(res2, {
    'duplicate request succeeds': (r) => [200, 201, 202].includes(r.status),
    'duplicate returns cached response': (r) => {
      // Should return same response as first request
      return r.body === res1.body;
    },
  });

  errorRate.add(!check2);
}

/**
 * Test: Rate limiting (free tier)
 */
function testRateLimiting() {
  // Use free tier API key for rate limit testing
  const freeTierKey = `mk_free_rate:${TENANT_ID}:free`;

  // Send burst of requests to trigger rate limit
  const rateLimitKey = generateIdempotencyKey();

  const res = http.get(`${BASE_URL}/v1/status`, {
    headers: getHeaders({ apiKey: freeTierKey }),
  });

  // Check for rate limit headers
  check(res, {
    'rate limit headers present': (r) => {
      return r.headers['X-RateLimit-Limit'] !== undefined &&
             r.headers['X-RateLimit-Remaining'] !== undefined &&
             r.headers['X-RateLimit-Reset'] !== undefined;
    },
  });

  // Track if rate limited (expected for some requests)
  if (res.status === 429) {
    rateLimitedRate.add(1);
    check(res, {
      '429 has Retry-After header': (r) => r.headers['Retry-After'] !== undefined,
    });
  } else {
    rateLimitedRate.add(0);
  }
}

/**
 * Test: Webhook processing (Stripe/Polar simulation)
 */
function testWebhookProcessing() {
  // Simulate Stripe webhook
  const stripeWebhookPayload = JSON.stringify({
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_load_test',
        customer: 'cus_load_test',
        status: 'active',
        items: {
          data: [{
            id: 'si_load_test',
            price: {
              id: 'price_load_test',
              type: 'recurring',
            },
          }],
        },
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
      },
    },
  });

  const stripeRes = http.post(
    `${BASE_URL}/api/v1/billing/webhook`,
    stripeWebhookPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=mock_signature_' + Date.now(),
      },
    }
  );

  check(stripeRes, {
    'stripe webhook status is 200': (r) => r.status === 200,
  });

  sleep(0.1);

  // Simulate Polar webhook
  const polarWebhookPayload = JSON.stringify({
    type: 'subscription.active',
    data: {
      id: 'pol_sub_load_test',
      product_id: 'prod_load_test',
      status: 'active',
      ends_at: null,
    },
  });

  const polarRes = http.post(
    `${BASE_URL}/api/v1/billing/webhook`,
    polarWebhookPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Polar-Signature': 'mock_polar_signature_' + Date.now(),
      },
    }
  );

  check(polarRes, {
    'polar webhook status is 200': (r) => r.status === 200,
  });
}

/**
 * HandleSummary: Custom summary output
 */
export function handleSummary(data) {
  const summary = {
    tests: {
      passed: data.metrics.http_req_duration?.values?.rate !== undefined,
      total_requests: data.metrics.http_reqs?.values?.count || 0,
      failed_requests: data.metrics.http_req_failed?.values?.rate || 0,
    },
    performance: {
      p50_latency_ms: Math.round(data.metrics.http_req_duration?.values?.['p(50)'] || 0),
      p95_latency_ms: Math.round(data.metrics.http_req_duration?.values?.['p(95)'] || 0),
      p99_latency_ms: Math.round(data.metrics.http_req_duration?.values?.['p(99)'] || 0),
    },
    thresholds: {
      p95_target_ms: 2000,
      p95_actual_ms: Math.round(data.metrics.http_req_duration?.values?.['p(95)'] || 0),
      p95_passed: (data.metrics.http_req_duration?.values?.['p(95)'] || 0) < 2000,
      error_rate: data.metrics.http_req_failed?.values?.rate || 0,
      error_rate_passed: (data.metrics.http_req_failed?.values?.rate || 0) < 0.05,
    },
  };

  return {
    stdout: `\n
========================================
  K6 LOAD TEST SUMMARY
========================================

Performance Metrics:
  - Total Requests: ${summary.tests.total_requests}
  - p50 Latency: ${summary.performance.p50_latency_ms}ms
  - p95 Latency: ${summary.performance.p95_latency_ms}ms (target: <${summary.thresholds.p95_target_ms}ms)
  - p99 Latency: ${summary.performance.p99_latency_ms}ms

Thresholds:
  - p95 < 2s: ${summary.thresholds.p95_passed ? '✅ PASSED' : '❌ FAILED'}
  - Error Rate < 5%: ${summary.thresholds.error_rate_passed ? '✅ PASSED' : '❌ FAILED'}

========================================
`,
    // JSON summary for CI/CD
    'load-test-summary.json': JSON.stringify(summary, null, 2),
  };
}
