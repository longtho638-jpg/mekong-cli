import { LiveExchangeManager } from '../../src/execution/live-exchange-manager';
import { ExchangeRegistry } from '../../src/execution/exchange-registry';

// Mock WebSocket to prevent real connections
jest.mock('ws', () => {
  return class MockWebSocket {
    static OPEN = 1;
    readyState = 1;
    on = jest.fn();
    send = jest.fn();
    close = jest.fn();
    ping = jest.fn();
  };
});

// Mock exchange-factory to avoid importing trading-core
jest.mock('../../src/cli/exchange-factory', () => ({
  createExchangeAdapter: jest.fn((id: string) => ({ exchangeId: id })),
}));

describe('LiveExchangeManager', () => {
  let registry: ExchangeRegistry;
  let manager: LiveExchangeManager;

  beforeEach(() => {
    registry = new ExchangeRegistry();
    registry.register({
      id: 'binance', enabled: true, tradingPairs: ['BTC/USDT'], weight: 80, maxRpm: 120,
    });
    registry.register({
      id: 'okx', enabled: true, tradingPairs: ['BTC/USDT', 'ETH/USDT'], weight: 50,
    });

    manager = new LiveExchangeManager({
      registry,
      staleThresholdMs: 5_000,
      healthCheckIntervalMs: 1_000,
      shutdownTimeoutMs: 2_000,
    });
  });

  afterEach(async () => {
    if (manager.isRunning()) await manager.stop();
    manager.removeAllListeners();
  });

  test('start() initializes all components', async () => {
    await manager.start();

    expect(manager.isRunning()).toBe(true);
    expect(manager.getPool()).not.toBeNull();
    expect(manager.getWsFeed()).not.toBeNull();
    expect(manager.getRouter().size).toBe(2);
    expect(manager.getHealthDashboard()).toHaveLength(2);
  });

  test('start() emits started event with exchanges and pairs', async () => {
    const events: unknown[] = [];
    manager.on('started', (e) => events.push(e));
    await manager.start();

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      exchanges: ['binance', 'okx'],
      pairs: ['BTC/USDT', 'ETH/USDT'],
    });
  });

  test('start() throws if no enabled exchanges', async () => {
    const emptyRegistry = new ExchangeRegistry();
    const emptyManager = new LiveExchangeManager({ registry: emptyRegistry });
    await expect(emptyManager.start()).rejects.toThrow('No enabled exchanges');
  });

  test('start() is idempotent', async () => {
    await manager.start();
    await manager.start(); // no-op
    expect(manager.isRunning()).toBe(true);
  });

  test('stop() gracefully shuts down all components', async () => {
    await manager.start();
    const events: string[] = [];
    manager.on('stopped', () => events.push('stopped'));

    await manager.stop();

    expect(manager.isRunning()).toBe(false);
    expect(manager.getPool()).toBeNull();
    expect(manager.getWsFeed()).toBeNull();
    expect(events).toContain('stopped');
  });

  test('stop() is idempotent', async () => {
    await manager.start();
    await manager.stop();
    await manager.stop(); // no-op
    expect(manager.isRunning()).toBe(false);
  });

  test('health dashboard returns per-exchange health', async () => {
    await manager.start();
    const dashboard = manager.getHealthDashboard();
    expect(dashboard).toHaveLength(2);
    const ids = dashboard.map(h => h.exchangeId);
    expect(ids).toContain('binance');
    expect(ids).toContain('okx');
  });

  test('router receives exchange endpoints with custom weights', async () => {
    await manager.start();
    const health = manager.getRouter().getHealth();
    expect(health).toHaveLength(2);
    expect(health.find(h => h.id === 'binance')).toBeDefined();
    expect(health.find(h => h.id === 'okx')).toBeDefined();
  });

  test('health monitor tracks initial disconnected state', async () => {
    await manager.start();
    const binanceHealth = manager.getHealthMonitor().getHealth('binance');
    expect(binanceHealth).toBeDefined();
    expect(binanceHealth!.status).toBe('disconnected');
    expect(binanceHealth!.lastSeen).toBe(0);
  });

  test('simulated tick updates health to connected', async () => {
    await manager.start();
    const healthMonitor = manager.getHealthMonitor();

    // Simulate WS tick by directly recording success
    healthMonitor.recordSuccess('binance', 5);
    healthMonitor.setWsStatus('binance', true);

    const h = healthMonitor.getHealth('binance')!;
    expect(h.status).toBe('connected');
    expect(h.wsConnected).toBe(true);
  });

  test('recovery event emitted on stale detection', async () => {
    jest.useFakeTimers();
    await manager.start();

    const recoveryEvents: unknown[] = [];
    manager.on('recovery', (e) => recoveryEvents.push(e));

    // Mark binance as seen, then let it go stale
    manager.getHealthMonitor().recordSuccess('binance', 5);
    jest.advanceTimersByTime(6_000); // past 5s stale threshold

    expect(recoveryEvents.length).toBeGreaterThanOrEqual(1);

    jest.useRealTimers();
    await manager.stop();
  });
});
