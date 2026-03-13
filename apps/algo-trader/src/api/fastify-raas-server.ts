/**
 * Fastify RaaS API server bootstrap — plugin registration, route mounting, start/stop.
 * Replaces both raas-api-router.ts and http-health-check-server.ts on port 3000.
 * Supports graceful shutdown on SIGTERM/SIGINT.
 */

import Fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import * as path from 'path';
import { TenantStrategyManager } from '../core/tenant-strategy-manager';
import { StrategyMarketplace } from '../core/strategy-marketplace';
import { TenantArbPositionTracker } from '../core/tenant-arbitrage-position-tracker';
import errorHandlerPlugin from './plugins/error-handler-plugin';
import corsPlugin from './plugins/cors-plugin';
import { createAuthMiddleware } from '../auth/tenant-auth-middleware';
import { SlidingWindowRateLimiter } from '../auth/sliding-window-rate-limiter';
import { ApiKeyRecord } from '../auth/types';
import { healthRoutes, setReady, getReady } from './routes/health-routes';
import { buildTenantRoutes } from './routes/tenant-crud-routes';
import { buildStrategyRoutes } from './routes/strategy-marketplace-routes';
import { alertRulesRoutes } from './routes/alert-rules-routes';
import { backtestJobRoutes } from './routes/backtest-job-submission-routes';
import { buildArbScanExecuteRoutes } from './routes/arbitrage-scan-execute-routes';
import { buildArbPositionsHistoryRoutes } from './routes/arbitrage-positions-history-routes';
import { prometheusMetricsRoutes } from './routes/prometheus-metrics-routes';
import { buildPnlRoutes } from './routes/pnl-realtime-snapshot-history-routes';
import { PnlSnapshotService, InMemoryPnlStore } from '../core/pnl-realtime-snapshot-service';
import { PolarSubscriptionService } from '../billing/polar-subscription-service';
import { PolarWebhookEventHandler } from '../billing/polar-webhook-event-handler';
import { StripeWebhookHandler } from '../billing/stripe-webhook-handler';
import { buildPolarBillingRoutes } from './routes/polar-billing-subscription-routes';
import { buildStripeWebhookRoute } from './routes/webhooks/stripe-webhook';
import { subscriptionRoutes } from './routes/subscription';
import { licenseManagementRoutes } from './routes/license-management-routes';
import { registerOverageRoutes } from './routes/overage-routes';
import { analyticsRoutes } from './routes/analytics-routes';
import { registerUsageEventsRoutes } from './routes/usage-events-routes';
import { cacheStatsRoutes } from './routes/cache-stats-routes';
import { registerUsageRoutes } from './routes/internal/usage-routes';
import { registerUsageRoutes as registerTradeMeteringRoutes } from '../metering/usage-api-routes';
import { buildPhase6Routes } from './routes/phase6-ghost-routes';
import { registerBacktestRoutes } from './routes/backtest-routes';
import { registerNotificationsRoutes } from './routes/notifications-routes';
import { registerApiDocsRoute } from './routes/api-docs-route';
import { usageTrackingPlugin } from './middleware/usage-tracking-middleware';
import { IdempotencyStore, idempotencyMiddleware, createIdempotencyResponseHandler } from '../middleware/idempotency-middleware';
import { hardLimitsPlugin } from './middleware/hard-limits-middleware';

export interface RaasServerOptions {
  port?: number;
  host?: string;
  /** Inject pre-configured manager (useful for tests) */
  manager?: TenantStrategyManager;
  /** Inject pre-configured marketplace (useful for tests) */
  marketplace?: StrategyMarketplace;
  /** Inject pre-configured position tracker (useful for tests) */
  positionTracker?: TenantArbPositionTracker;
  /** Inject pre-configured API key store (useful for tests) */
  keyStore?: Map<string, ApiKeyRecord>;
  /** Inject pre-configured rate limiter (useful for tests) */
  rateLimiter?: SlidingWindowRateLimiter;
  /** Skip global auth middleware — for unit tests only */
  skipAuth?: boolean;
}

let fastify: FastifyInstance | null = null;
let activePort = 0;

export function buildServer(opts: RaasServerOptions = {}): FastifyInstance {
  const manager = opts.manager ?? new TenantStrategyManager();
  const marketplace = opts.marketplace ?? new StrategyMarketplace();
  const positionTracker = opts.positionTracker ?? new TenantArbPositionTracker();
  const keyStore = opts.keyStore ?? new Map<string, ApiKeyRecord>();
  const rateLimiter = opts.rateLimiter ?? new SlidingWindowRateLimiter();

  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  });

  // Plugins
  void server.register(errorHandlerPlugin);
  void server.register(corsPlugin);

  // Idempotency middleware for webhooks
  const idempotencyStore = new IdempotencyStore();
  const idempotencyHook = idempotencyMiddleware(idempotencyStore);
  const responseHandler = createIdempotencyResponseHandler(idempotencyStore);
  
  server.addHook('preHandler', idempotencyHook);
  server.addHook('onSend', responseHandler);

  // Global Auth Middleware
  // Note: health routes should probably be excluded from auth if they are for external probes
  if (!opts.skipAuth) {
    const authMiddleware = createAuthMiddleware(keyStore, rateLimiter);
    server.addHook('preHandler', async (request, reply) => {
      // Skip auth for health routes
      if (request.url === '/health' || request.url === '/ready' || request.url === '/metrics'
        || request.url === '/api/v1/billing/webhook' || request.url === '/api/v1/billing/products') {
        return;
      }
      return authMiddleware(request as any, reply as any);
    });
  }

  // Routes
  void server.register(healthRoutes);
  void server.register(prometheusMetricsRoutes);
  void server.register(buildTenantRoutes(manager));
  void server.register(buildStrategyRoutes(marketplace));
  void server.register(alertRulesRoutes);
  void server.register(backtestJobRoutes);
  void server.register(buildArbScanExecuteRoutes(manager, positionTracker));
  void server.register(buildArbPositionsHistoryRoutes(positionTracker));

  // P&L snapshot routes
  const pnlStore = new InMemoryPnlStore();
  const pnlService = new PnlSnapshotService(positionTracker, pnlStore);
  void server.register(buildPnlRoutes(pnlService));

  // Polar billing routes
  const subscriptionService = new PolarSubscriptionService();
  const polarWebhookHandler = new PolarWebhookEventHandler(subscriptionService);
  void server.register(buildPolarBillingRoutes(subscriptionService, polarWebhookHandler));
  void server.register(subscriptionRoutes);

  // Stripe billing routes
  const stripeWebhookHandler = new StripeWebhookHandler(subscriptionService);
  void server.register(buildStripeWebhookRoute(stripeWebhookHandler));

  // License management routes (admin only)
  void server.register(licenseManagementRoutes);

  // Overage billing routes
  void server.register(registerOverageRoutes);

  // Analytics routes (usage metrics)
  void server.register(analyticsRoutes);

  // Usage events routes (new - Phase 4)
  void server.register(registerUsageEventsRoutes);

  // Trade metering routes (ROIaaS Phase 4)
  void server.register(registerTradeMeteringRoutes);

  // Internal usage routes for billing sync
  void server.register(registerUsageRoutes);

  // Usage tracking middleware (auto-tracks API calls)
  void server.register(usageTrackingPlugin);

  // Cache stats routes (for dashboard monitoring)
  void server.register(cacheStatsRoutes);

  // Phase 6 Ghost Protocol routes (ENTERPRISE-only)
  void server.register(buildPhase6Routes());

  // ROIaaS Phase 6 - Backtest routes
  void server.register(registerBacktestRoutes);

  // ROIaaS Phase 7 - Notifications routes
  void server.register(registerNotificationsRoutes);

  // API Docs - Swagger UI
  void server.register(registerApiDocsRoute);

  // Hard limits middleware (quota enforcement)
  void server.register(hardLimitsPlugin);

  // Dashboard static files (built by: cd dashboard && npm run build)
  const dashboardDir = path.join(__dirname, '..', '..', 'dist', 'dashboard');
  const fs = require('fs');
  if (fs.existsSync(dashboardDir)) {
    void server.register(fastifyStatic, {
      root: dashboardDir,
      prefix: '/dashboard/',
      decorateReply: false,
    });

    // SPA fallback: redirect /dashboard/* to dashboard index.html
    server.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/dashboard')) {
        return reply.sendFile('index.html', dashboardDir);
      }
      return reply.code(404).send({ error: 'Not found' });
    });
  } else {
    // If dashboard not built, return 404 for dashboard routes
    server.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/dashboard')) {
        return reply.code(404).send({
          error: 'Dashboard not found',
          message: 'Please build the dashboard first: cd dashboard && npm run build'
        });
      }
      return reply.code(404).send({ error: 'Not found' });
    });
  }

  return server;
}

export async function startRaasServer(opts: RaasServerOptions = {}): Promise<number> {
  const port = opts.port ?? parseInt(process.env.API_PORT ?? '3000', 10);
  const host = opts.host ?? '0.0.0.0';

  fastify = buildServer(opts);

  await fastify.listen({ port, host });

  const addr = fastify.server.address();
  activePort = (addr && typeof addr === 'object') ? addr.port : port;
  process.stdout.write(`RaaS Fastify API listening on :${activePort}\n`);
  return activePort;
}

export async function stopRaasServer(): Promise<void> {
  if (!fastify) return;
  await fastify.close();
  fastify = null;
  activePort = 0;
}

export function getRaasPort(): number {
  return activePort;
}

// Re-export readiness control so callers can use the Fastify server's probe
export { setReady, getReady };
