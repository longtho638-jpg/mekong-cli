import { AdaptiveCircuitBreaker } from '../../src/execution/adaptive-circuit-breaker-per-exchange';

describe('AdaptiveCircuitBreaker', () => {
  let cb: AdaptiveCircuitBreaker;

  beforeEach(() => {
    jest.useFakeTimers();
    cb = new AdaptiveCircuitBreaker({
      failureThreshold: 3,
      failureWindowMs: 10_000,
      recoveryTimeoutMs: 5_000,
      successThreshold: 2,
      latencyThresholdMs: 1_000,
      backoffMultiplier: 2,
      maxRecoveryTimeoutMs: 30_000,
    });
  });

  afterEach(() => {
    cb.destroy();
    jest.useRealTimers();
  });

  const KEY = AdaptiveCircuitBreaker.key('binance', 'BTC/USDT');

  // --- Static key helper ---

  test('key builds exchange:pair format', () => {
    expect(AdaptiveCircuitBreaker.key('binance', 'BTC/USDT')).toBe('binance:BTC/USDT');
    expect(AdaptiveCircuitBreaker.key('binance')).toBe('binance');
  });

  // --- Closed state ---

  test('new breaker is allowed (closed)', () => {
    expect(cb.isAllowed(KEY)).toBe(true);
    expect(cb.getStatus(KEY).state).toBe('closed');
  });

  test('failures below threshold stay closed', () => {
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);
    expect(cb.isAllowed(KEY)).toBe(true);
    expect(cb.getStatus(KEY).failures).toBe(2);
  });

  // --- Trip to open ---

  test('failures at threshold trip to open', () => {
    const events: unknown[] = [];
    cb.on('state:change', (e) => events.push(e));

    cb.recordFailure(KEY);
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);

    expect(cb.isAllowed(KEY)).toBe(false);
    expect(cb.getStatus(KEY).state).toBe('open');
    expect(events).toHaveLength(1);
    expect((events[0] as { newState: string }).newState).toBe('open');
  });

  test('getTripped returns tripped keys', () => {
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);
    expect(cb.getTripped()).toContain(KEY);
  });

  // --- Recovery to half_open ---

  test('transitions to half_open after recovery timeout', () => {
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);
    expect(cb.getStatus(KEY).state).toBe('open');

    jest.advanceTimersByTime(5_000);
    expect(cb.getStatus(KEY).state).toBe('half_open');
    expect(cb.isAllowed(KEY)).toBe(true); // half_open allows requests
  });

  // --- Half_open → closed ---

  test('successes in half_open close the breaker', () => {
    // Trip it
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);

    // Wait for half_open
    jest.advanceTimersByTime(5_000);
    expect(cb.getStatus(KEY).state).toBe('half_open');

    // Probe successes
    cb.recordSuccess(KEY);
    cb.recordSuccess(KEY);
    expect(cb.getStatus(KEY).state).toBe('closed');
  });

  // --- Half_open → open (failure during probe) ---

  test('failure in half_open re-trips immediately', () => {
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);
    jest.advanceTimersByTime(5_000); // half_open

    cb.recordFailure(KEY);
    expect(cb.getStatus(KEY).state).toBe('open');
    expect(cb.getStatus(KEY).tripCount).toBe(2);
  });

  // --- Adaptive backoff ---

  test('recovery timeout increases with repeated trips', () => {
    // First trip: 5s recovery
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);
    expect(cb.getStatus(KEY).currentRecoveryMs).toBe(5_000);

    // Recover to half_open, then fail again
    jest.advanceTimersByTime(5_000);
    cb.recordFailure(KEY); // re-trip

    // Second trip: 5000 * 2 = 10000ms
    expect(cb.getStatus(KEY).currentRecoveryMs).toBe(10_000);

    // Recover again, fail again
    jest.advanceTimersByTime(10_000);
    cb.recordFailure(KEY); // re-trip

    // Third trip: 10000 * 2 = 20000ms
    expect(cb.getStatus(KEY).currentRecoveryMs).toBe(20_000);
  });

  test('recovery timeout caps at maxRecoveryTimeoutMs', () => {
    // Trip many times to exceed cap
    for (let i = 0; i < 10; i++) {
      cb.recordFailure(KEY);
      cb.recordFailure(KEY);
      cb.recordFailure(KEY);
      const status = cb.getStatus(KEY);
      jest.advanceTimersByTime(status.currentRecoveryMs);
    }
    expect(cb.getStatus(KEY).currentRecoveryMs).toBeLessThanOrEqual(30_000);
  });

  // --- Latency-based failures ---

  test('high latency counts as failure', () => {
    cb.recordLatency(KEY, 1500); // > 1000ms threshold
    cb.recordLatency(KEY, 2000);
    cb.recordLatency(KEY, 3000);
    expect(cb.getStatus(KEY).state).toBe('open');
  });

  test('low latency counts as success', () => {
    cb.recordLatency(KEY, 500);
    expect(cb.getStatus(KEY).state).toBe('closed');
  });

  // --- Failure window expiry ---

  test('old failures outside window are pruned', () => {
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);

    // Advance past failure window
    jest.advanceTimersByTime(11_000);

    // This should be the only failure in the new window
    cb.recordFailure(KEY);
    expect(cb.getStatus(KEY).failures).toBe(1);
    expect(cb.isAllowed(KEY)).toBe(true);
  });

  // --- Manual reset ---

  test('reset returns breaker to closed', () => {
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);
    expect(cb.getStatus(KEY).state).toBe('open');

    cb.reset(KEY);
    expect(cb.getStatus(KEY).state).toBe('closed');
    expect(cb.getStatus(KEY).tripCount).toBe(0);
    expect(cb.isAllowed(KEY)).toBe(true);
  });

  // --- Multiple breakers ---

  test('per-exchange breakers are independent', () => {
    const binance = AdaptiveCircuitBreaker.key('binance', 'BTC/USDT');
    const okx = AdaptiveCircuitBreaker.key('okx', 'BTC/USDT');

    cb.recordFailure(binance);
    cb.recordFailure(binance);
    cb.recordFailure(binance);

    expect(cb.isAllowed(binance)).toBe(false);
    expect(cb.isAllowed(okx)).toBe(true);
  });

  test('getAllStatus returns all breakers', () => {
    cb.recordFailure('binance:BTC/USDT');
    cb.recordSuccess('okx:ETH/USDT');
    const statuses = cb.getAllStatus();
    expect(statuses).toHaveLength(2);
  });

  // --- Destroy ---

  test('destroy clears all breakers and timers', () => {
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);
    cb.recordFailure(KEY);
    cb.destroy();
    expect(cb.getAllStatus()).toHaveLength(0);
  });
});
