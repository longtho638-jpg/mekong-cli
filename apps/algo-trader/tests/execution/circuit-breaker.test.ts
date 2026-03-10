/**
 * Circuit Breaker Tests - CircuitBreakerLegacy
 * Tests the legacy wrapper around CircuitBreaker
 */

import { describe, test, expect } from '@jest/globals';
import { CircuitBreakerLegacy, CircuitBreakerConfig } from '../../src/execution/circuit-breaker';

describe('Circuit Breaker Legacy', () => {
  const defaultConfig: CircuitBreakerConfig = {
    maxDrawdownPercent: 5,
    maxErrorRate: 0.1,
    maxLossesInRow: 3,
    cooldownMs: 1000
  };

  describe('Initialization', () => {
    test('should start in CLOSED state', () => {
      const cb = new CircuitBreakerLegacy(defaultConfig);
      const metrics = cb.getMetrics();
      expect(metrics.state).toBe('CLOSED');
      expect(metrics.failureCount).toBe(0);
      expect(metrics.totalTrades).toBe(0);
    });

    test('should have zero metrics on init', () => {
      const cb = new CircuitBreakerLegacy(defaultConfig);
      const metrics = cb.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.totalFailures).toBe(0);
      expect(metrics.totalSuccesses).toBe(0);
    });
  });

  describe('Execute', () => {
    test('should pass through successful operation', async () => {
      const cb = new CircuitBreakerLegacy(defaultConfig);
      const result = await cb.execute(async () => 'success');
      expect(result).toBe('success');
    });

    test('should throw when circuit is halted', async () => {
      const cb = new CircuitBreakerLegacy(defaultConfig);
      // Trigger halt by consecutive losses
      for (let i = 0; i < 3; i++) {
        cb.recordTrade(-100);
      }
      await expect(async () => cb.execute(async () => 'ok'))
        .rejects.toThrow('Circuit breaker is open');
    });

    test('should handle async operation rejection', async () => {
      const cb = new CircuitBreakerLegacy(defaultConfig);
      await expect(cb.execute(async () => {
        throw new Error('test error');
      })).rejects.toThrow('test error');
    });
  });

  describe('Trade Recording', () => {
    test('should track consecutive losses', () => {
      const cb = new CircuitBreakerLegacy(defaultConfig);
      cb.recordTrade(100); // win
      cb.recordTrade(-50); // loss
      cb.recordTrade(-50); // loss
      const state = cb.getState();
      expect(state.consecutiveLosses).toBe(2);
    });

    test('should reset consecutive losses on win', () => {
      const cb = new CircuitBreakerLegacy(defaultConfig);
      cb.recordTrade(-50);
      cb.recordTrade(-50);
      cb.recordTrade(100); // win
      const state = cb.getState();
      expect(state.consecutiveLosses).toBe(0);
    });

    test('should halt after max consecutive losses', () => {
      const cb = new CircuitBreakerLegacy(defaultConfig);
      for (let i = 0; i < 3; i++) {
        cb.recordTrade(-100);
      }
      expect(cb.canTrade()).toBe(false);
    });
  });

  describe('Get Metrics', () => {
    test('should return metrics derived from state', async () => {
      const cb = new CircuitBreakerLegacy(defaultConfig);
      cb.recordTrade(100);
      cb.recordTrade(-50);
      cb.recordTrade(-50);

      const metrics = cb.getMetrics();
      expect(metrics.totalTrades).toBe(3);
      expect(metrics.totalFailures).toBe(2); // losses
      expect(metrics.totalSuccesses).toBe(1); // wins
      expect(metrics.consecutiveLosses).toBe(2);
    });
  });

  describe('Reset', () => {
    test('should reset all metrics', () => {
      const cb = new CircuitBreakerLegacy(defaultConfig);
      cb.recordTrade(100);
      cb.recordTrade(-50);
      cb.recordTrade(-50);
      cb.recordTrade(-50); // triggers halt

      cb.reset();

      const metrics = cb.getMetrics();
      expect(metrics.state).toBe('CLOSED');
      expect(metrics.failureCount).toBe(0);
      expect(metrics.totalTrades).toBe(0);
      expect(cb.canTrade()).toBe(true);
    });
  });
});
