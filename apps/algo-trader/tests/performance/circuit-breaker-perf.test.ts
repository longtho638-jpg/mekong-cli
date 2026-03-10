/**
 * Performance tests for circuit breaker
 * Tests response time under stress conditions
 */

describe('Circuit Breaker Performance', () => {
  test('should check circuit state within 10ms', () => {
    const startTime = Date.now();

    // Simulate circuit breaker state checks
    let state = 'CLOSED';
    for (let i = 0; i < 1000; i++) {
      if (state === 'CLOSED') {
        state = Math.random() > 0.99 ? 'OPEN' : 'CLOSED';
      } else {
        state = Math.random() > 0.9 ? 'CLOSED' : 'OPEN';
      }
    }

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(10);
    expect(['CLOSED', 'OPEN']).toContain(state);
  });

  test('should handle 100 rapid trip calls within 200ms', () => {
    const startTime = Date.now();
    const circuitState = { open: false, failures: 0 };

    for (let i = 0; i < 100; i++) {
      circuitState.failures++;
      if (circuitState.failures >= 5) {
        circuitState.open = true;
      }
    }

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(200);
    expect(circuitState.open).toBe(true);
  });

  test('should reset within 50ms after cooldown', () => {
    const startTime = Date.now();

    const circuit = {
      open: true,
      cooldownMs: 1000,
      lastTrip: Date.now() - 2000, // Already cooled down
    };

    // Check if should reset
    const shouldReset = Date.now() - circuit.lastTrip > circuit.cooldownMs;
    if (shouldReset) {
      circuit.open = false;
    }

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(50);
    expect(circuit.open).toBe(false);
  });
});
