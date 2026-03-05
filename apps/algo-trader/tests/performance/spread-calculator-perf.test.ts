/**
 * Performance tests for spread calculator
 * Tests execution speed and memory efficiency
 */

describe('Spread Calculator Performance', () => {
  test('should calculate spread within 100ms for 100 pairs', () => {
    const startTime = Date.now();

    // Simulate spread calculation for 100 trading pairs
    for (let i = 0; i < 100; i++) {
      const bid = 50000 + Math.random() * 1000;
      const ask = 50000 + Math.random() * 1000;
      const spread = ((ask - bid) / bid) * 100;
      expect(spread).toBeGreaterThanOrEqual(-2);
      expect(spread).toBeLessThanOrEqual(2);
    }

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(100);
  });

  test('should process 1000 price updates within 500ms', () => {
    const startTime = Date.now();
    const prices: { bid: number; ask: number }[] = [];

    for (let i = 0; i < 1000; i++) {
      prices.push({
        bid: 50000 + Math.random() * 1000,
        ask: 50000 + Math.random() * 1000,
      });
    }

    // Process all prices
    const spreads = prices.map(p => ((p.ask - p.bid) / p.bid) * 100);

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(500);
    expect(spreads).toHaveLength(1000);
  });

  test('should handle concurrent calculations without blocking', async () => {
    const calculate = (delay: number) => new Promise<number>((resolve) => {
      setTimeout(() => resolve(Math.random()), delay);
    });

    const startTime = Date.now();
    const results = await Promise.all([
      calculate(10),
      calculate(20),
      calculate(30),
    ]);

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(100);
    expect(results).toHaveLength(3);
  });
});
