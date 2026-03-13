/**
 * Circuit Breaker Unit Tests
 *
 * Tests for automatic trading halt on drawdown limits:
 * - State transitions (CLOSED → WARNING → TRIPPED)
 * - Trip and reset functionality
 * - Recovery mode logic
 */

import { CircuitBreaker, type CircuitState } from './circuit-breaker';
import { RiskEventEmitter } from '../core/risk-events';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  let riskEmitter: RiskEventEmitter;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      breakerId: 'test-breaker',
      hardLimit: 0.15,
      softLimit: 0.10,
      recoveryPct: 0.05,
    });
    riskEmitter = RiskEventEmitter.getInstance();
    riskEmitter.reset();
  });

  afterEach(() => {
    riskEmitter.reset();
  });

  describe('Initial State', () => {
    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.canTrade()).toBe(true);
    });

    it('should have correct initial metrics', () => {
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.currentState).toBe('CLOSED');
      expect(metrics.currentDrawdown).toBe(0);
      expect(metrics.peakValue).toBe(1000);
      expect(metrics.tripCount).toBe(0);
    });
  });

  describe('State Transitions', () => {
    it('should transition to WARNING at soft limit (-10%)', () => {
      // Drop value to -10% drawdown
      circuitBreaker.updateValue(900);
      expect(circuitBreaker.getState()).toBe('WARNING');
      expect(circuitBreaker.canTrade()).toBe(true);
    });

    it('should transition to TRIPPED at hard limit (-15%)', () => {
      // Drop value to -15% drawdown
      circuitBreaker.updateValue(850);
      expect(circuitBreaker.getState()).toBe('TRIPPED');
      expect(circuitBreaker.canTrade()).toBe(false);
    });

    it('should emit trip event when tripped', (done) => {
      circuitBreaker.on('trip', ({ reason, triggerValue }) => {
        expect(reason).toBe('drawdown_limit');
        expect(triggerValue).toBeGreaterThanOrEqual(0.15);
        done();
      });
      circuitBreaker.updateValue(850);
    });
  });

  describe('Recovery Mode', () => {
    it('should require +5% recovery before resetting', () => {
      // Trip the breaker at 850
      circuitBreaker.updateValue(850);
      expect(circuitBreaker.getState()).toBe('TRIPPED');

      const metrics = circuitBreaker.getMetrics();
      const recoveryStartValue = metrics.lastTripTime
        ? 850 // We know we tripped at 850
        : 850;

      // Recovery needs to be +5% from trip value: 850 * 1.05 = 892.5
      const recoveryTarget = recoveryStartValue * 1.05;

      // Update to just below recovery
      circuitBreaker.updateValue(recoveryTarget - 1);
      expect(circuitBreaker.getState()).toBe('TRIPPED');

      // Update to at or above recovery
      circuitBreaker.updateValue(recoveryTarget + 1);
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should emit reset event when recovered', (done) => {
      // Trip first
      circuitBreaker.updateValue(850);

      circuitBreaker.on('reset', ({ downtimeMs }) => {
        // downtimeMs can be 0 if reset happens immediately
        expect(downtimeMs).toBeGreaterThanOrEqual(0);
        done();
      });

      // Trigger recovery (850 * 1.05 = 892.5)
      circuitBreaker.updateValue(900);
    });
  });

  describe('Peak Tracking', () => {
    it('should update peak value on new highs', () => {
      circuitBreaker.updateValue(1000);
      expect(circuitBreaker.getMetrics().peakValue).toBe(1000);

      circuitBreaker.updateValue(1200);
      expect(circuitBreaker.getMetrics().peakValue).toBe(1200);

      circuitBreaker.updateValue(1100);
      expect(circuitBreaker.getMetrics().peakValue).toBe(1200); // Peak doesn't decrease
    });

    it('should calculate drawdown correctly from peak', () => {
      circuitBreaker.updateValue(1000); // Sets peak to 1000
      circuitBreaker.updateValue(900);  // -10% drawdown

      const drawdown = circuitBreaker.getMetrics().currentDrawdown;
      expect(drawdown).toBeCloseTo(0.10, 2);
    });
  });

  describe('Manual Override', () => {
    it('should allow manual trip', (done) => {
      circuitBreaker.on('trip', ({ reason }) => {
        expect(reason).toBe('manual_test');
        done();
      });
      circuitBreaker.manualTrip('test');
    });

    it('should allow manual reset', () => {
      circuitBreaker.manualTrip('test');
      expect(circuitBreaker.getState()).toBe('TRIPPED');

      circuitBreaker.manualReset();
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple updates at same value', () => {
      circuitBreaker.updateValue(900);
      circuitBreaker.updateValue(900);
      circuitBreaker.updateValue(900);

      expect(circuitBreaker.getState()).toBe('WARNING');
    });

    it('should handle rapid value changes', () => {
      const values = [1000, 950, 900, 850, 900, 950, 1000];
      for (const value of values) {
        circuitBreaker.updateValue(value);
      }

      // Should recover after dropping and recovering
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should not reset twice without re-tripping', () => {
      circuitBreaker.updateValue(850); // Trip
      expect(circuitBreaker.getState()).toBe('TRIPPED');

      circuitBreaker.updateValue(900); // Recover
      expect(circuitBreaker.getState()).toBe('CLOSED');

      // Manual reset should warn (not tripped)
      circuitBreaker.manualReset();
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });

  describe('Threshold Configuration', () => {
    it('should use custom thresholds', () => {
      const customBreaker = new CircuitBreaker({
        breakerId: 'custom',
        hardLimit: 0.20,
        softLimit: 0.15,
        recoveryPct: 0.10,
      });

      // At -10%, should still be CLOSED
      customBreaker.updateValue(900);
      expect(customBreaker.getState()).toBe('CLOSED');

      // At -15%, should be WARNING
      customBreaker.updateValue(850);
      expect(customBreaker.getState()).toBe('WARNING');

      // At -20%, should TRIP
      customBreaker.updateValue(800);
      expect(customBreaker.getState()).toBe('TRIPPED');
    });
  });
});
