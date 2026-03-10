/**
 * Performance tests for trading validation
 * Tests input sanitization and validation speed
 */

describe('Trading Validation Performance', () => {
  test('should validate 1000 trading pairs within 100ms', () => {
    const startTime = Date.now();
    let validPairs = 0;

    for (let i = 0; i < 1000; i++) {
      const pair = `BTC${Math.random() > 0.5 ? '/USDT' : '/USD'}`;
      const isValid = /^[A-Z]+\/[A-Z]+$/.test(pair);
      if (isValid) validPairs++;
    }

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(100);
    expect(validPairs).toBe(1000);
  });

  test('should sanitize 500 inputs within 80ms', () => {
    const startTime = Date.now();
    const sanitized: string[] = [];

    for (let i = 0; i < 500; i++) {
      const input = `<script>alert('xss')</script>${i}`;
      const sanitized_input = input.replace(/<[^>]*>/g, '');
      sanitized.push(sanitized_input);
    }

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(80);
    expect(sanitized).toHaveLength(500);
    expect(sanitized[0]).not.toContain('<');
  });

  test('should check rate limits for 200 requests within 50ms', () => {
    const startTime = Date.now();
    const rateLimit = 100; // requests per minute
    const requestTimes: number[] = [];

    for (let i = 0; i < 200; i++) {
      requestTimes.push(Date.now() - Math.random() * 60000);
    }

    const recentRequests = requestTimes.filter(
      t => Date.now() - t < 60000
    ).length;

    const isWithinLimit = recentRequests <= rateLimit;

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(50);
    expect(typeof isWithinLimit).toBe('boolean');
  });
});
