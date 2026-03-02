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
import { buildPolarBillingRoutes } from './routes/polar-billing-subscription-routes';

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
  const webhookHandler = new PolarWebhookEventHandler(subscriptionService);
  void server.register(buildPolarBillingRoutes(subscriptionService, webhookHandler));

  // Dashboard static files (built by: cd dashboard && npm run build)
  const dashboardDir = path.join(__dirname, '..', '..', 'dist', 'dashboard');
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
