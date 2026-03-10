---
phase: 1
status: pending
effort: 3h
---

# Phase 1 — Live Exchange Manager Implementation

## Context

- [exchange-connection-pool.ts](../../src/execution/exchange-connection-pool.ts) — Generic pool, `acquire()`, `release()`, `destroy()`
- [websocket-multi-exchange-price-feed-manager.ts](../../src/execution/websocket-multi-exchange-price-feed-manager.ts) — WS feeds, `start()`, `stop()`, EventEmitter `tick` events
- [exchange-router-with-fallback.ts](../../src/execution/exchange-router-with-fallback.ts) — `addEndpoint()`, `route()`, `getHealth()`, `markHealthy()`
- [exchange-factory.ts](../../src/cli/exchange-factory.ts) — `createExchangeAdapter()`, `buildExchangeConfigs()`

## File 1: `src/execution/exchange-registry.ts` (~80 lines)

Central config store for active exchanges.

```typescript
export interface ExchangeConfig {
  id: string;                    // 'binance' | 'okx' | 'bybit'
  enabled: boolean;
  apiKey?: string;
  secret?: string;
  tradingPairs: string[];        // ['BTC/USDT', 'ETH/USDT']
  weight?: number;               // Router weight, default 50
  maxRpm?: number;               // Rate limit, default 60
}

export class ExchangeRegistry {
  private exchanges = new Map<string, ExchangeConfig>();

  register(config: ExchangeConfig): void;
  unregister(id: string): void;
  get(id: string): ExchangeConfig | undefined;
  getEnabled(): ExchangeConfig[];
  getAllPairs(): string[];           // Deduplicated union of all pairs
  loadFromEnv(exchangeIds: string[]): void;  // Read API keys from env vars
}
```

Key behavior:
- `loadFromEnv()` reads `{ID}_API_KEY` and `{ID}_SECRET` from `process.env`
- `getAllPairs()` returns deduplicated union across all enabled exchanges
- No validation on register (caller responsibility) — YAGNI

## File 2: `src/execution/exchange-health-monitor.ts` (~120 lines)

Unified health tracking with event bus.

```typescript
export type ExchangeStatus = 'connected' | 'degraded' | 'disconnected';

export interface ExchangeHealth {
  exchangeId: string;
  status: ExchangeStatus;
  lastSeen: number;              // timestamp of last successful data
  latencyMs: number;             // rolling average (last 10 samples)
  errorCount: number;            // errors since last connected
  wsConnected: boolean;
  restHealthy: boolean;
}

export class ExchangeHealthMonitor extends EventEmitter {
  private health = new Map<string, ExchangeHealth>();
  private checkTimer: NodeJS.Timeout | null = null;

  constructor(private staleThresholdMs: number = 30_000);

  // State management
  initExchange(exchangeId: string): void;
  recordSuccess(exchangeId: string, latencyMs: number): void;
  recordError(exchangeId: string): void;
  setWsStatus(exchangeId: string, connected: boolean): void;

  // Queries
  getHealth(exchangeId: string): ExchangeHealth | undefined;
  getAllHealth(): ExchangeHealth[];
  getStaleExchanges(): string[];    // lastSeen > staleThresholdMs

  // Lifecycle
  startChecks(intervalMs?: number): void;  // Periodic stale detection, default 10s
  stopChecks(): void;

  // Events emitted:
  //   'health:change' → { exchangeId, oldStatus, newStatus }
  //   'health:stale'  → { exchangeId, lastSeen }
}
```

Status transition logic:
- `connected`: lastSeen < staleThresholdMs AND errorCount === 0
- `degraded`: lastSeen < staleThresholdMs AND errorCount > 0
- `disconnected`: lastSeen >= staleThresholdMs

## File 3: `src/execution/live-exchange-manager.ts` (~150 lines)

Orchestrator that composes all components.

```typescript
export interface LiveExchangeManagerConfig {
  registry: ExchangeRegistry;
  staleThresholdMs?: number;       // default 30s
  healthCheckIntervalMs?: number;  // default 10s
  shutdownTimeoutMs?: number;      // default 5s
}

export class LiveExchangeManager extends EventEmitter {
  private registry: ExchangeRegistry;
  private pool: ExchangeConnectionPool<ExchangeClientBase>;
  private wsFeed: WebSocketPriceFeedManager;
  private router: ExchangeRouter;
  private healthMonitor: ExchangeHealthMonitor;
  private running = false;

  constructor(config: LiveExchangeManagerConfig);

  // Lifecycle
  async start(): Promise<void>;    // Boot all: pool, WS, router, health monitor
  async stop(): Promise<void>;     // Graceful shutdown with drain timeout

  // Accessors (delegate to composed components)
  getHealthDashboard(): ExchangeHealth[];
  getRouter(): ExchangeRouter;
  getPool(): ExchangeConnectionPool<ExchangeClientBase>;
  getWsFeed(): WebSocketPriceFeedManager;

  // Internal
  private wireEvents(): void;       // Connect WS ticks → health monitor
  private setupAutoRecovery(): void; // Listen health:stale → restart WS for that exchange
}
```

### `start()` sequence:
1. Get enabled exchanges from registry
2. Create pool with `createExchangeAdapter` factory
3. Create WS feed manager with exchange IDs + pairs from registry
4. Register each exchange in router with weight/maxRpm from config
5. Init health monitor for each exchange
6. Wire events (WS tick → `healthMonitor.recordSuccess()`)
7. Start WS feed + health checks
8. Set `running = true`, emit `'started'`

### `stop()` sequence:
1. Set `running = false`
2. Stop health monitor checks
3. Stop WS feeds
4. Destroy connection pool
5. Emit `'stopped'`
6. If any step hangs > shutdownTimeoutMs, force-resolve

### `wireEvents()`:
- WS `tick` event → `healthMonitor.recordSuccess(exchange, 0)` (WS latency N/A)
- WS `error` event → `healthMonitor.recordError(exchange)`
- Health `health:stale` → if running, restart WS for that exchange

## Tests

### `tests/execution/exchange-registry.test.ts` (~60 lines)
- register/unregister/get
- getEnabled filters disabled
- getAllPairs deduplicates
- loadFromEnv reads env vars

### `tests/execution/exchange-health-monitor.test.ts` (~80 lines)
- status transitions: connected → degraded → disconnected
- emits `health:change` on transition
- emits `health:stale` when lastSeen exceeds threshold
- getStaleExchanges returns correct IDs
- Use jest fake timers for periodic checks

### `tests/execution/live-exchange-manager.test.ts` (~100 lines)
- Mock all composed components (pool, WS, router, health)
- start() initializes all components in order
- stop() calls destroy/stop on all components
- WS tick events propagate to health monitor
- Auto-recovery: simulate stale → verify WS restart triggered
- Graceful shutdown timeout works

## Implementation Steps

1. Create `exchange-registry.ts` — pure data store, no dependencies
2. Create `exchange-health-monitor.ts` — EventEmitter + Map + timer
3. Create `live-exchange-manager.ts` — compose all, wire events
4. Write tests for registry (simplest)
5. Write tests for health monitor (medium)
6. Write tests for manager (mock heavy)
7. Run `pnpm tsc --noEmit` — 0 errors
8. Run `pnpm test` — all pass

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| WS manager not exposing per-exchange reconnect | Manager calls `stop()` then `start()` on full WS feed; acceptable for v1 |
| Timer leaks in health monitor | `stopChecks()` clears interval + `unref()` on timer |
| Circular event loops | Health events only trigger recovery, recovery does not emit health events |
