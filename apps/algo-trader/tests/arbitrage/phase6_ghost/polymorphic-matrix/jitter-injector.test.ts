import { JitterInjector } from '../../../../src/arbitrage/phase6_ghost/polymorphic-matrix/jitter-injector';

describe('JitterInjector', () => {
  const config = { meanMs: 8, stdMs: 3, orderSizeJitterPct: 0.5 };

  it('should generate non-negative delay', () => {
    const jitter = new JitterInjector(config);
    for (let i = 0; i < 100; i++) {
      expect(jitter.generateDelay()).toBeGreaterThanOrEqual(0);
    }
  });

  it('should generate delays with expected distribution', () => {
    const jitter = new JitterInjector(config);
    const delays: number[] = [];
    for (let i = 0; i < 1000; i++) {
      delays.push(jitter.generateDelay());
    }
    const avg = delays.reduce((a, b) => a + b, 0) / delays.length;
    // Average should be roughly around the mean (within 3ms tolerance)
    expect(avg).toBeGreaterThan(config.meanMs - 3);
    expect(avg).toBeLessThan(config.meanMs + 3);
  });

  it('should apply delay asynchronously', async () => {
    const jitter = new JitterInjector({ meanMs: 1, stdMs: 0.5, orderSizeJitterPct: 0.5 });
    const start = Date.now();
    const appliedMs = await jitter.applyDelay();
    const elapsed = Date.now() - start;
    expect(appliedMs).toBeGreaterThanOrEqual(0);
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });

  it('should jitter order size within configured percentage', () => {
    const jitter = new JitterInjector(config);
    const originalSize = 1.0;
    const maxDelta = originalSize * (config.orderSizeJitterPct / 100);

    for (let i = 0; i < 100; i++) {
      const jittered = jitter.jitterOrderSize(originalSize);
      expect(jittered).toBeGreaterThanOrEqual(originalSize - maxDelta - 0.0001);
      expect(jittered).toBeLessThanOrEqual(originalSize + maxDelta + 0.0001);
    }
  });

  it('should preserve precision for crypto amounts', () => {
    const jitter = new JitterInjector(config);
    const result = jitter.jitterOrderSize(0.12345678);
    // Should have at most 8 decimal places
    const decimals = result.toString().split('.')[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(8);
  });

  it('should return config copy', () => {
    const jitter = new JitterInjector(config);
    const returned = jitter.getConfig();
    expect(returned).toEqual(config);
    expect(returned).not.toBe(config); // Should be a copy
  });
});
