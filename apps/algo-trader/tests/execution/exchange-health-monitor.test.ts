import { ExchangeHealthMonitor, HealthChangeEvent, HealthStaleEvent } from '../../src/execution/exchange-health-monitor';

describe('ExchangeHealthMonitor', () => {
  let monitor: ExchangeHealthMonitor;

  beforeEach(() => {
    jest.useFakeTimers();
    monitor = new ExchangeHealthMonitor(5_000); // 5s stale threshold for fast tests
  });

  afterEach(() => {
    monitor.stopChecks();
    monitor.removeAllListeners();
    jest.useRealTimers();
  });

  test('initExchange sets disconnected status', () => {
    monitor.initExchange('binance');
    const h = monitor.getHealth('binance');
    expect(h).toBeDefined();
    expect(h!.status).toBe('disconnected');
    expect(h!.lastSeen).toBe(0);
    expect(h!.errorCount).toBe(0);
  });

  test('recordSuccess transitions to connected', () => {
    monitor.initExchange('binance');
    const events: HealthChangeEvent[] = [];
    monitor.on('health:change', (e: HealthChangeEvent) => events.push(e));

    monitor.recordSuccess('binance', 15);
    const h = monitor.getHealth('binance')!;
    expect(h.status).toBe('connected');
    expect(h.latencyMs).toBe(15);
    expect(h.errorCount).toBe(0);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ exchangeId: 'binance', oldStatus: 'disconnected', newStatus: 'connected' });
  });

  test('recordError transitions to degraded', () => {
    monitor.initExchange('binance');
    monitor.recordSuccess('binance', 10); // connected first

    const events: HealthChangeEvent[] = [];
    monitor.on('health:change', (e: HealthChangeEvent) => events.push(e));

    monitor.recordError('binance');
    expect(monitor.getHealth('binance')!.status).toBe('degraded');
    expect(events).toHaveLength(1);
    expect(events[0].newStatus).toBe('degraded');
  });

  test('stale check emits health:stale after threshold', () => {
    monitor.initExchange('binance');
    monitor.recordSuccess('binance', 10); // set lastSeen

    const staleEvents: HealthStaleEvent[] = [];
    monitor.on('health:stale', (e: HealthStaleEvent) => staleEvents.push(e));

    monitor.startChecks(1_000); // check every 1s

    // Advance past stale threshold
    jest.advanceTimersByTime(6_000);

    expect(staleEvents.length).toBeGreaterThanOrEqual(1);
    expect(staleEvents[0].exchangeId).toBe('binance');
    expect(monitor.getHealth('binance')!.status).toBe('disconnected');
  });

  test('getStaleExchanges returns stale IDs', () => {
    monitor.initExchange('binance');
    monitor.initExchange('okx');
    monitor.recordSuccess('binance', 5);
    monitor.recordSuccess('okx', 5);

    // Advance past threshold
    jest.advanceTimersByTime(6_000);

    const stale = monitor.getStaleExchanges();
    expect(stale).toContain('binance');
    expect(stale).toContain('okx');
  });

  test('setWsStatus updates wsConnected flag', () => {
    monitor.initExchange('binance');
    monitor.setWsStatus('binance', true);
    expect(monitor.getHealth('binance')!.wsConnected).toBe(true);
    expect(monitor.getHealth('binance')!.status).toBe('connected');

    monitor.setWsStatus('binance', false);
    expect(monitor.getHealth('binance')!.wsConnected).toBe(false);
  });

  test('getAllHealth returns all monitored exchanges', () => {
    monitor.initExchange('binance');
    monitor.initExchange('okx');
    expect(monitor.getAllHealth()).toHaveLength(2);
  });

  test('rolling latency averages over samples', () => {
    monitor.initExchange('binance');
    monitor.recordSuccess('binance', 10);
    monitor.recordSuccess('binance', 20);
    monitor.recordSuccess('binance', 30);
    expect(monitor.getHealth('binance')!.latencyMs).toBe(20); // avg(10,20,30)
  });

  test('recordSuccess on unknown exchange is no-op', () => {
    expect(() => monitor.recordSuccess('unknown', 10)).not.toThrow();
  });

  test('stopChecks clears timer', () => {
    monitor.startChecks(1_000);
    monitor.stopChecks();
    // Should not throw on double stop
    monitor.stopChecks();
  });
});
