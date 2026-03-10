import { describe, test, expect, beforeEach } from '@jest/globals';
import { CircuitBreaker } from './circuit-breaker';

describe('CircuitBreaker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should halt after max consecutive losses', () => {
    const cb = new CircuitBreaker({ maxLossesInRow: 3 });
    cb.recordTrade(-100);
    cb.recordTrade(-100);
    expect(cb.canTrade()).toBe(true);
    cb.recordTrade(-100);
    expect(cb.canTrade()).toBe(false);
    expect(cb.getState().isHalted).toBe(true);
  });

  test('should reset consecutive losses on win', () => {
    const cb = new CircuitBreaker({ maxLossesInRow: 3 });
    cb.recordTrade(-100);
    cb.recordTrade(-100);
    cb.recordTrade(200);
    cb.recordTrade(-100);
    expect(cb.canTrade()).toBe(true);
  });

  test('should resume after cooldown', () => {
    const cb = new CircuitBreaker({ maxLossesInRow: 2, cooldownMs: 60000 });
    cb.recordTrade(-100);
    cb.recordTrade(-100);
    expect(cb.canTrade()).toBe(false);
    jest.advanceTimersByTime(60000);
    expect(cb.canTrade()).toBe(true);
  });

  test('should halt on max error count', () => {
    const cb = new CircuitBreaker();
    for (let i = 0; i < 5; i++) cb.recordError('error');
    expect(cb.canTrade()).toBe(false);
  });

  test('should track win rate', () => {
    const cb = new CircuitBreaker();
    const state = cb.getState();
    expect(state.totalTrades).toBe(0);
    expect(state.consecutiveLosses).toBe(0);
  });
});

/**
 * Tests for Circuit Breaker Edge Cases
 * Added: 2026-03-05 - Production robustness improvements
 */

import { CircuitBreaker, CircuitBreakerLegacy, GlobalCircuitBreaker, CircuitBreakerConfig } from './circuit-breaker';

describe('Circuit Breaker Edge Cases', () => {
  // Edge Case 1: Stale Price Data Detection
  describe('stale price data detection', () => {
    it('should halt after 3 consecutive stale data occurrences', () => {
      const config: CircuitBreakerConfig = { staleDataThresholdMs: 1000 };
      const cb = new CircuitBreaker(config);

      const oldTimestamp = Date.now() - 2000; // 2 seconds old (> 1s threshold)
      
      cb.recordDataTimestamp(oldTimestamp);
      expect(cb.getState().staleDataCount).toBe(1);
      expect(cb.canTrade()).toBe(true);

      cb.recordDataTimestamp(oldTimestamp);
      expect(cb.getState().staleDataCount).toBe(2);
      expect(cb.canTrade()).toBe(true);

      cb.recordDataTimestamp(oldTimestamp);
      expect(cb.getState().staleDataCount).toBe(3);
      expect(cb.canTrade()).toBe(false); // Should be halted now
    });

    it('should reset stale count when fresh data arrives', () => {
      const config: CircuitBreakerConfig = { staleDataThresholdMs: 1000 };
      const cb = new CircuitBreaker(config);

      // Stale data
      cb.recordDataTimestamp(Date.now() - 2000);
      expect(cb.getState().staleDataCount).toBe(1);

      // Fresh data
      cb.recordDataTimestamp(Date.now());
      expect(cb.getState().staleDataCount).toBe(0);
    });
  });

  // Edge Case 4: Latency Monitoring
  describe('latency monitoring', () => {
    it('should halt after 5 high latency violations', () => {
      const config: CircuitBreakerConfig = { maxLatencyMs: 100 };
      const cb = new CircuitBreaker(config);

      for (let i = 0; i < 4; i++) {
        cb.recordLatency(150); // > 100ms threshold
        expect(cb.canTrade()).toBe(true);
      }

      cb.recordLatency(150); // 5th violation
      expect(cb.canTrade()).toBe(false); // Should be halted
    });

    it('should reset latency violations when latency is normal', () => {
      const config: CircuitBreakerConfig = { maxLatencyMs: 100 };
      const cb = new CircuitBreaker(config);

      cb.recordLatency(150); // Violation
      expect(cb.getState().latencyViolations).toBe(1);

      cb.recordLatency(50); // Normal
      expect(cb.getState().latencyViolations).toBe(0);
    });
  });

  // Edge Case 2: API Version Check
  describe('API version checking', () => {
    it('should accept matching API version', () => {
      const config: CircuitBreakerConfig = { apiVersion: 'v2' };
      const cb = new CircuitBreaker(config);

      const result = cb.checkApiVersion('v2.1.0');
      expect(result).toBe(true);
      expect(cb.getState().errorCount).toBe(0);
    });

    it('should record error on version mismatch', () => {
      const config: CircuitBreakerConfig = { apiVersion: 'v2' };
      const cb = new CircuitBreaker(config);

      const result = cb.checkApiVersion('v1.0.0');
      expect(result).toBe(false);
      expect(cb.getState().errorCount).toBe(1);
    });

    it('should halt after 5 version mismatches', () => {
      const config: CircuitBreakerConfig = { apiVersion: 'v2' };
      const cb = new CircuitBreaker(config);

      for (let i = 0; i < 5; i++) {
        cb.checkApiVersion('v1.0.0');
      }

      expect(cb.canTrade()).toBe(false); // Should halt after 5 errors
    });
  });

  // Edge Case 3: Global Circuit Breaker for Cascading Failures
  describe('Global Circuit Breaker for cascading failures', () => {
    it('should allow trading when exchanges are healthy', () => {
      const gcb = new GlobalCircuitBreaker(2);
      const cb1 = new CircuitBreaker();
      const cb2 = new CircuitBreaker();

      gcb.registerExchange('exchange1', cb1);
      gcb.registerExchange('exchange2', cb2);

      expect(gcb.canTrade()).toBe(true);
    });

    it('should halt when threshold exceeded', () => {
      const gcb = new GlobalCircuitBreaker(2);
      const cb1 = new CircuitBreaker({ maxLossesInRow: 1 });
      const cb2 = new CircuitBreaker({ maxLossesInRow: 1 });
      const cb3 = new CircuitBreaker();

      gcb.registerExchange('exchange1', cb1);
      gcb.registerExchange('exchange2', cb2);
      gcb.registerExchange('exchange3', cb3);

      // Trigger circuit breakers on 2 exchanges
      cb1.recordTrade(-100); // Loss
      cb2.recordTrade(-100); // Loss

      // Now global CB should detect 2 halted exchanges
      expect(gcb.canTrade()).toBe(false);
    });

    it('should recover after cooldown', async () => {
      const gcb = new GlobalCircuitBreaker(1, 100); // 100ms cooldown
      const cb = new CircuitBreaker({ maxLossesInRow: 1, cooldownMs: 50 });

      gcb.registerExchange('exchange1', cb);

      // Trigger halt
      cb.recordTrade(-100);
      
      // Wait for cooldown
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(gcb.canTrade()).toBe(true);
    });

    it('should return halted exchanges in state', () => {
      const gcb = new GlobalCircuitBreaker(3);
      const cb1 = new CircuitBreaker({ maxLossesInRow: 1 });
      const cb2 = new CircuitBreaker();

      gcb.registerExchange('binance', cb1);
      gcb.registerExchange('okx', cb2);

      cb1.recordTrade(-100); // Halt binance

      const state = gcb.getState();
      expect(state.haltedExchanges).toContain('binance');
      expect(state.haltedExchanges).not.toContain('okx');
    });
  });

  // Integration tests for multiple edge cases
  describe('integrated edge case scenarios', () => {
    it('should handle combined stale data + latency violations', () => {
      const config: CircuitBreakerConfig = {
        staleDataThresholdMs: 1000,
        maxLatencyMs: 100,
      };
      const cb = new CircuitBreaker(config);

      // Simulate stale data (2 times)
      cb.recordDataTimestamp(Date.now() - 2000);
      cb.recordDataTimestamp(Date.now() - 2000);
      expect(cb.getState().staleDataCount).toBe(2);

      // Simulate high latency (3 times)
      cb.recordLatency(150);
      cb.recordLatency(150);
      cb.recordLatency(150);
      expect(cb.getState().latencyViolations).toBe(3);

      // One more stale data should halt
      cb.recordDataTimestamp(Date.now() - 2000);
      expect(cb.canTrade()).toBe(false);
    });

    it('should check global circuit before local trade', () => {
      const gcb = new GlobalCircuitBreaker(1);
      const cb1 = new CircuitBreaker({ maxLossesInRow: 1 });
      const cb2 = new CircuitBreaker();

      gcb.registerExchange('exchange1', cb1);
      gcb.registerExchange('exchange2', cb2);

      // Halt exchange1
      cb1.recordTrade(-100);

      // Global CB should now be halted
      expect(gcb.canTrade()).toBe(false);

      // Exchange2's global check should fail
      expect(cb2.checkGlobalCircuit()).toBe(false);
    });
  });
});
