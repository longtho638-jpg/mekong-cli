/**
 * Live Exchange Manager — Unified orchestrator composing connection pool,
 * WebSocket price feeds, exchange router, and health monitor into a
 * single lifecycle manager with auto-recovery.
 */

import { EventEmitter } from 'events';
import { ExchangeConnectionPool } from './exchange-connection-pool';
import { WebSocketPriceFeedManager, PriceTick } from './websocket-multi-exchange-price-feed-manager';
import { ExchangeRouter } from './exchange-router-with-fallback';
import { ExchangeHealthMonitor, ExchangeHealth } from './exchange-health-monitor';
import { ExchangeRegistry } from './exchange-registry';
import { createExchangeAdapter } from '../cli/exchange-factory';
import { logger } from '../utils/logger';

export interface LiveExchangeManagerConfig {
  registry: ExchangeRegistry;
  staleThresholdMs?: number;       // default 30s
  healthCheckIntervalMs?: number;  // default 10s
  shutdownTimeoutMs?: number;      // default 5s
}

export class LiveExchangeManager extends EventEmitter {
  private readonly registry: ExchangeRegistry;
  private pool: ExchangeConnectionPool<unknown> | null = null;
  private wsFeed: WebSocketPriceFeedManager | null = null;
  private router: ExchangeRouter;
  private healthMonitor: ExchangeHealthMonitor;
  private running = false;

  private readonly staleThresholdMs: number;
  private readonly healthCheckIntervalMs: number;
  private readonly shutdownTimeoutMs: number;

  constructor(config: LiveExchangeManagerConfig) {
    super();
    this.registry = config.registry;
    this.staleThresholdMs = config.staleThresholdMs ?? 30_000;
    this.healthCheckIntervalMs = config.healthCheckIntervalMs ?? 10_000;
    this.shutdownTimeoutMs = config.shutdownTimeoutMs ?? 5_000;
    this.router = new ExchangeRouter();
    this.healthMonitor = new ExchangeHealthMonitor(this.staleThresholdMs);
  }

  async start(): Promise<void> {
    if (this.running) return;

    const enabled = this.registry.getEnabled();
    if (enabled.length === 0) {
      throw new Error('No enabled exchanges in registry');
    }

    const pairs = this.registry.getAllPairs();
    const exchangeIds = enabled.map(e => e.id);

    // 1. Connection pool
    this.pool = new ExchangeConnectionPool(
      (id: string) => {
        const cfg = this.registry.get(id);
        return createExchangeAdapter(id, cfg?.apiKey, cfg?.secret);
      },
    );

    // 2. WebSocket price feed
    this.wsFeed = new WebSocketPriceFeedManager({
      exchanges: exchangeIds,
      symbols: pairs,
    });

    // 3. Router endpoints
    for (const ex of enabled) {
      this.router.addEndpoint(ex.id, ex.weight ?? 50, ex.maxRpm ?? 60);
    }

    // 4. Health monitor
    for (const ex of enabled) {
      this.healthMonitor.initExchange(ex.id);
    }

    // 5. Wire events
    this.wireEvents();

    // 6. Start feeds + health checks
    this.wsFeed.start();
    this.healthMonitor.startChecks(this.healthCheckIntervalMs);

    this.running = true;
    logger.info(`[LiveManager] Started: ${exchangeIds.join(', ')} | Pairs: ${pairs.join(', ')}`);
    this.emit('started', { exchanges: exchangeIds, pairs });
  }

  async stop(): Promise<void> {
    if (!this.running) return;
    this.running = false;

    const shutdown = async (): Promise<void> => {
      this.healthMonitor.stopChecks();
      this.wsFeed?.stop();
      this.pool?.destroy();
      this.healthMonitor.removeAllListeners();
      this.wsFeed?.removeAllListeners();
    };

    // Graceful shutdown with timeout
    await Promise.race([
      shutdown(),
      new Promise<void>(resolve => setTimeout(resolve, this.shutdownTimeoutMs)),
    ]);

    this.pool = null;
    this.wsFeed = null;
    logger.info('[LiveManager] Stopped');
    this.emit('stopped');
  }

  isRunning(): boolean {
    return this.running;
  }

  getHealthDashboard(): ExchangeHealth[] {
    return this.healthMonitor.getAllHealth();
  }

  getRouter(): ExchangeRouter {
    return this.router;
  }

  getPool(): ExchangeConnectionPool<unknown> | null {
    return this.pool;
  }

  getWsFeed(): WebSocketPriceFeedManager | null {
    return this.wsFeed;
  }

  getHealthMonitor(): ExchangeHealthMonitor {
    return this.healthMonitor;
  }

  private wireEvents(): void {
    // WS tick → health monitor success
    this.wsFeed?.on('tick', (tick: PriceTick) => {
      this.healthMonitor.recordSuccess(tick.exchange, 0);
      this.healthMonitor.setWsStatus(tick.exchange, true);
    });

    // WS error → health monitor error
    this.wsFeed?.on('error', (err: Error) => {
      // Extract exchange from error message if available
      const match = err.message.match(/for (\w+)/);
      if (match) {
        this.healthMonitor.recordError(match[1]);
        this.healthMonitor.setWsStatus(match[1], false);
      }
    });

    // Auto-recovery: stale → restart WS feed for that exchange
    this.healthMonitor.on('health:stale', ({ exchangeId }: { exchangeId: string }) => {
      if (!this.running) return;
      logger.warn(`[LiveManager] Stale detected: ${exchangeId} — triggering recovery`);
      this.emit('recovery', { exchangeId });
      // V1: full WS feed restart (per-exchange restart deferred to v2)
      this.wsFeed?.stop();
      this.wsFeed?.start();
    });

    // Forward health changes
    this.healthMonitor.on('health:change', (event) => {
      this.emit('health:change', event);
    });
  }
}
