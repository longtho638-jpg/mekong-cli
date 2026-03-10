import { PhantomCloakingEngine } from '../../src/execution/phantom-order-cloaking-engine';

describe('PhantomCloakingEngine', () => {
  let phantom: PhantomCloakingEngine;

  beforeEach(() => {
    phantom = new PhantomCloakingEngine({
      targetOrdersPerMin: 4,
      minSessionMs: 20 * 60_000,
      maxSessionMs: 90 * 60_000,
      minBreakMs: 1_000,   // short break for tests
      maxBreakMs: 2_000,
      otrThreshold: 15,
      sizeSigma: 0.25,
      sizePrecision: 8,
    });
  });

  describe('cloak()', () => {
    test('returns proceed=true for first order in fresh session', () => {
      const decision = phantom.cloak('binance', 0.01, 'BTC/USDT');
      expect(decision.proceed).toBe(true);
      expect(decision.size).toBeGreaterThan(0);
      expect(decision.delayMs).toBeGreaterThanOrEqual(0);
      expect(decision.sessionActive).toBe(true);
    });

    test('size uses log-normal distribution (not exact base)', () => {
      const sizes = Array.from({ length: 30 }, () =>
        phantom.cloak('binance', 0.01, 'BTC/USDT').size
      );
      const unique = new Set(sizes.map(s => s.toFixed(8)));
      expect(unique.size).toBeGreaterThan(20); // all varied, no uniform ±5%
    });

    test('delay uses Poisson timing (varied, not uniform)', () => {
      const delays = Array.from({ length: 30 }, () =>
        phantom.cloak('binance', 0.01, 'BTC/USDT').delayMs
      );
      const unique = new Set(delays);
      expect(unique.size).toBeGreaterThan(20);
    });
  });

  describe('OTR tracking', () => {
    test('blocks when cancel ratio exceeds threshold', () => {
      // Place 100 orders, cancel 20 → 20% > 15% threshold
      for (let i = 0; i < 100; i++) phantom.recordOrderPlaced('binance');
      for (let i = 0; i < 20; i++) phantom.recordOrderCancelled('binance');

      const decision = phantom.cloak('binance', 0.01, 'BTC/USDT');
      expect(decision.proceed).toBe(false);
      expect(decision.reason).toContain('OTR');
    });

    test('allows when cancel ratio is under threshold', () => {
      for (let i = 0; i < 100; i++) phantom.recordOrderPlaced('binance');
      for (let i = 0; i < 10; i++) phantom.recordOrderCancelled('binance'); // 10% < 15%

      const decision = phantom.cloak('binance', 0.01, 'BTC/USDT');
      expect(decision.proceed).toBe(true);
    });

    test('resetDailyCounters clears OTR state', () => {
      for (let i = 0; i < 100; i++) phantom.recordOrderPlaced('binance');
      for (let i = 0; i < 20; i++) phantom.recordOrderCancelled('binance');

      phantom.resetDailyCounters();

      const decision = phantom.cloak('binance', 0.01, 'BTC/USDT');
      expect(decision.proceed).toBe(true);
    });
  });

  describe('Adaptive rate', () => {
    test('rate decreases on warnings', () => {
      const before = phantom.cloak('binance', 0.01, 'BTC/USDT').adaptiveRatePct;
      phantom.recordRateWarning('binance');
      const after = phantom.cloak('binance', 0.01, 'BTC/USDT').adaptiveRatePct;

      expect(after).toBeLessThan(before);
    });

    test('rate increases on clean responses', () => {
      // First lower the rate
      phantom.recordRateWarning('binance');
      phantom.recordRateWarning('binance');
      const lowRate = phantom.cloak('binance', 0.01, 'BTC/USDT').adaptiveRatePct;

      // Then 10 clean responses should nudge it up
      for (let i = 0; i < 10; i++) phantom.recordCleanResponse('binance');
      const higherRate = phantom.cloak('binance', 0.01, 'BTC/USDT').adaptiveRatePct;

      expect(higherRate).toBeGreaterThan(lowRate);
    });

    test('rate never drops below floor', () => {
      for (let i = 0; i < 20; i++) phantom.recordRateWarning('binance');
      const rate = phantom.cloak('binance', 0.01, 'BTC/USDT').adaptiveRatePct;
      expect(rate).toBeGreaterThanOrEqual(0.40);
    });
  });

  describe('Session lifecycle', () => {
    test('blocks during break period', async () => {
      // Create a phantom with 1ms session to force immediate expiry
      const shortSession = new PhantomCloakingEngine({
        minSessionMs: 1,    // 1ms session
        maxSessionMs: 2,
        minBreakMs: 60_000, // 1min break
        maxBreakMs: 60_001,
      });

      // First call starts session
      shortSession.cloak('binance', 0.01, 'BTC/USDT');
      // Wait 10ms for session to expire (1-2ms duration)
      await new Promise(r => setTimeout(r, 10));
      // Second call should detect expired session → start break → block
      const decision = shortSession.cloak('binance', 0.01, 'BTC/USDT');
      expect(decision.proceed).toBe(false);
      expect(decision.reason).toContain('Session break');
    });
  });

  describe('getStatus()', () => {
    test('returns complete status object', () => {
      phantom.cloak('binance', 0.01, 'BTC/USDT');
      phantom.recordOrderPlaced('binance');
      phantom.recordOrderFilled('binance');

      const status = phantom.getStatus();
      expect(status.sessionActive).toBe(true);
      expect(status.sessionElapsedMin).toBeGreaterThanOrEqual(0);
      expect(status.otrByExchange).toHaveProperty('binance');
      expect(status.otrByExchange.binance.placed).toBe(1);
    });
  });

  describe('Events', () => {
    test('emits rate:adjusted on warning', () => {
      const handler = jest.fn();
      phantom.on('rate:adjusted', handler);

      phantom.recordRateWarning('okx');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ exchange: 'okx' })
      );
    });
  });
});
