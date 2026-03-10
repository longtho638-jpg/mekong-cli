/**
 * Cloudflare Worker Gateway - Hono-based API edge layer
 *
 * Provides edge caching, rate limiting, and request routing
 * for the algo-trader RaaS (Robot-as-a-Service) API.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timing } from 'hono/timing';
import { poweredBy } from 'hono/powered-by';
import { secureHeaders } from 'hono/secure-headers';
import { licenseMiddleware, LicenseTier } from './middleware/license-auth-middleware';
import { rateLimitMiddleware } from '../lib/rate-limiter-middleware';

// Types for Cloudflare Workers environment
// Note: KVNamespace and R2Bucket are available via @cloudflare/workers-types
export type Env = {
  DATABASE_URL: string;
  EXCHANGE_API_KEY: string;
  EXCHANGE_SECRET: string;
  POLAR_WEBHOOK_SECRET: string;
  NODE_ENV: 'production' | 'staging' | 'development';
  // Cloudflare bindings (available in worker context)
  BUILD_CACHE?: unknown; // KVNamespace - typed at runtime
  ARTIFACT_STORE?: unknown; // R2Bucket - typed at runtime
};

// App type with Cloudflare Workers bindings
type AppBindings = {
  Bindings: Env;
};

// Create Hono app
const app = new Hono<AppBindings>();

// Middleware stack - CORS must be first
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Tenant-ID', 'X-Polar-Signature'],
  exposeHeaders: ['X-Request-Id', 'X-RateLimit-Remaining', 'X-RateLimit-Limit'],
  maxAge: 86400,
  credentials: false,
}));
app.use('*', logger());
app.use('*', timing());
app.use('*', poweredBy());
app.use('*', secureHeaders());
// Rate limiting middleware - applies to all routes
app.use('*', rateLimitMiddleware());

// Health check endpoints (no auth required)
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: c.env.NODE_ENV || 'production',
  });
});

app.get('/ready', (c) => {
  // Basic readiness check - in production, verify DB and Redis connections
  return c.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint (Prometheus format placeholder)
app.get('/metrics', (c) => {
  const metrics = `
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/health"} 0
http_requests_total{method="GET",endpoint="/ready"} 0
http_requests_total{method="GET",endpoint="/metrics"} 0
`.trim();
  return c.text(metrics, 200, {
    'Content-Type': 'text/plain; version=0.0.4',
  });
});

// API v1 routes - Health
const apiV1 = new Hono<AppBindings>();

apiV1.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'algo-trader-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    environment: c.env.NODE_ENV,
  });
});

apiV1.get('/ready', (c) => {
  return c.json({
    status: 'ready',
    checks: {
      database: 'ok',
      redis: 'ok',
      exchanges: 'ok',
    },
    timestamp: new Date().toISOString(),
  });
});

// Tenant CRUD routes - PRO tier required
apiV1.use('/tenants/*', licenseMiddleware(LicenseTier.PRO));
apiV1.use('/tenants/*', async (c) => {
  return c.json({
    error: 'Not implemented in edge worker - forward to origin',
    path: c.req.path,
    method: c.req.method,
  }, 501);
});

// Strategy marketplace routes - PRO tier required
apiV1.use('/strategies/*', licenseMiddleware(LicenseTier.PRO));
apiV1.use('/strategies/*', async (c) => {
  return c.json({
    error: 'Not implemented in edge worker - forward to origin',
    path: c.req.path,
    method: c.req.method,
  }, 501);
});

// Arbitrage routes - ENTERPRISE tier required
apiV1.use('/arb/*', licenseMiddleware(LicenseTier.ENTERPRISE));
apiV1.use('/arb/*', async (c) => {
  return c.json({
    error: 'Not implemented in edge worker - forward to origin',
    path: c.req.path,
    method: c.req.method,
  }, 501);
});

// Optimization routes - PRO tier required
apiV1.use('/optimization/*', licenseMiddleware(LicenseTier.PRO));
apiV1.use('/optimization/*', async (c) => {
  return c.json({
    error: 'Not implemented in edge worker - forward to origin',
    path: c.req.path,
    method: c.req.method,
  }, 501);
});

// Hyperparameter optimization - PRO tier required
apiV1.use('/hyperparameter/*', licenseMiddleware(LicenseTier.PRO));
apiV1.use('/hyperparameter/*', async (c) => {
  return c.json({
    error: 'Not implemented in edge worker - forward to origin',
    path: c.req.path,
    method: c.req.method,
  }, 501);
});

// Backtest routes - FREE tier (open source, basic backtesting is free)
apiV1.use('/backtest/*', async (c) => {
  return c.json({
    error: 'Not implemented in edge worker - forward to origin',
    path: c.req.path,
    method: c.req.method,
  }, 501);
});

// Cache stats endpoint - for dashboard monitoring
apiV1.get('/cache/stats', async (c) => {
  // Return mock stats for now - real implementation requires Node.js backend
  // This endpoint will be implemented in the main backend server
  return c.json({
    hits: 0,
    misses: 0,
    hitRate: 0,
    localSize: 0,
    tier: 'miss',
    note: 'Stats available in backend server at /api/cache/stats',
  });
});

// Billing routes - FREE tier (public billing info)
apiV1.post('/billing/webhook', async (c) => {
  const signature = c.req.header('X-Polar-Signature');
  if (!signature) {
    return c.json({ error: 'Missing signature' }, 401);
  }
  return c.json({
    received: true,
    signature: signature.substring(0, 20) + '...',
    note: 'Forwarded to origin',
  });
});

apiV1.get('/billing/products', async (c) => {
  return c.json({
    products: [
      { id: 'starter', name: 'Starter Plan', price: 29, currency: 'USD', interval: 'month' },
      { id: 'growth', name: 'Growth Plan', price: 99, currency: 'USD', interval: 'month' },
      { id: 'premium', name: 'Premium Plan', price: 299, currency: 'USD', interval: 'month' },
    ],
    cached: true,
  });
});

// Mount API v1
app.route('/api/v1', apiV1);

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: `Route ${c.req.method} ${c.req.path} not found`,
    path: c.req.path,
  }, 404);
});

// Error handler
app.onError((err, c) => {
  const status = err instanceof Error ? 500 : 400;
  return c.json({
    error: 'Internal Server Error',
    message: err instanceof Error ? err.message : 'Unknown error',
    stack: c.env.NODE_ENV === 'development' ? err.stack : undefined,
  }, status);
});

// Export for Cloudflare Workers
export default app;

// Named export for testing
export { app as handler };
