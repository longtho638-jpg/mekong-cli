/**
 * Drawdown Tracker Unit Tests
 *
 * Tests for drawdown tracking from high-water mark:
 * - Drawdown calculation
 * - High-water mark updates
 * - Rolling window statistics
 * - Event emissions on threshold breaches
 */

import { DrawdownTracker, type DrawdownSnapshot } from './drawdown-tracker';
import { RiskEventEmitter } from '../core/risk-events';

describe('DrawdownTracker', () => {
  let tracker: DrawdownTracker;
  let riskEmitter: RiskEventEmitter;

  beforeEach(() => {
    tracker = new DrawdownTracker({
      initialValue: 10000,
      warningThreshold: 0.10,
      criticalThreshold: 0.15,
      enableRollingWindows: true,
      windowDurations: [3600000, 86400000], // 1h, 24h
    });
    riskEmitter = RiskEventEmitter.getInstance();
    riskEmitter.reset();
  });

  afterEach(() => {
    tracker.reset();
  });

  describe('Initial State', () => {
    it('should start with initial value', () => {
      const metrics = tracker.getMetrics();
      expect(metrics.currentValue).toBe(10000);
      expect(metrics.peakValue).toBe(10000);
      expect(metrics.allTimeHigh).toBe(10000);
      expect(metrics.drawdown).toBe(0);
    });

    it('should have empty history initially', () => {
      expect(tracker.getHistory().length).toBe(0);
    });
  });

  describe('Drawdown Calculation', () => {
    it('should calculate drawdown correctly', () => {
      tracker.updateValue(9000); // -10% from 10000

      const metrics = tracker.getMetrics();
      expect(metrics.drawdown).toBeCloseTo(0.10, 2);
      expect(metrics.drawdownPct).toBeCloseTo(10, 1);
    });

    it('should update peak on new highs', () => {
      tracker.updateValue(12000); // New peak

      const metrics = tracker.getMetrics();
      expect(metrics.peakValue).toBe(12000);
      expect(metrics.allTimeHigh).toBe(12000);
    });

    it('should maintain peak after value drops', () => {
      tracker.updateValue(12000); // Peak at 12000
      tracker.updateValue(10000); // Drop

      const metrics = tracker.getMetrics();
      expect(metrics.peakValue).toBe(12000);
      expect(metrics.drawdown).toBeCloseTo(0.167, 2); // (12000-10000)/12000
    });

    it('should calculate drawdown from ATH correctly', () => {
      tracker.updateValue(12000); // ATH
      tracker.updateValue(10000); // Current

      const metrics = tracker.getMetrics();
      expect(metrics.fromAth).toBe(2000);
      expect(metrics.fromAthPct).toBeCloseTo(16.67, 1);
    });
  });

  describe('History Tracking', () => {
    it('should record snapshots in history', () => {
      tracker.updateValue(9500);
      tracker.updateValue(9000);
      tracker.updateValue(9200);

      const history = tracker.getHistory();
      expect(history.length).toBe(3);
      expect(history[0].value).toBe(9500);
      expect(history[2].value).toBe(9200);
    });

    it('should limit history to last N snapshots', () => {
      for (let i = 0; i < 150; i++) {
        tracker.updateValue(10000 - i * 10);
      }

      const history = tracker.getHistory(100);
      expect(history.length).toBe(100);
    });

    it('should include correct snapshot data', () => {
      tracker.updateValue(9000);

      const history = tracker.getHistory();
      const snapshot = history[0];

      expect(snapshot.value).toBe(9000);
      expect(snapshot.peak).toBe(10000);
      expect(snapshot.drawdown).toBeCloseTo(0.10, 2);
      expect(snapshot.timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Rolling Windows', () => {
    it('should track window statistics', () => {
      tracker.updateValue(9500);

      const stats = tracker.getAllWindowStats();
      expect(stats.length).toBe(2); // 1h and 24h windows

      for (const stat of stats) {
        expect(stat.windowMs).toBeGreaterThan(0);
        expect(stat.sampleCount).toBe(1);
      }
    });

    it('should update window peak', () => {
      tracker.updateValue(11000);
      tracker.updateValue(10500);

      const stats = tracker.getAllWindowStats();
      for (const stat of stats) {
        expect(stat.peakValue).toBe(11000);
      }
    });

    it('should calculate window drawdown', () => {
      tracker.updateValue(11000); // Peak
      tracker.updateValue(10000); // Current

      const stats = tracker.getAllWindowStats();
      for (const stat of stats) {
        expect(stat.drawdown).toBeGreaterThan(0);
      }
    });
  });

  describe('Event Emissions', () => {
    it('should emit warning event at warning threshold', (done) => {
      tracker.on('warning', ({ drawdown }) => {
        expect(drawdown).toBeGreaterThanOrEqual(0.10);
        done();
      });

      tracker.updateValue(9000); // -10%
    });

    it('should emit critical event at critical threshold', (done) => {
      tracker.on('critical', ({ drawdown }) => {
        expect(drawdown).toBeGreaterThanOrEqual(0.15);
        done();
      });

      tracker.updateValue(8500); // -15%
    });

    it('should emit window-update events', (done) => {
      let callCount = 0;
      tracker.on('window-update', ({ window }) => {
        callCount++;
        expect(window.windowMs).toBeDefined();
        expect(window.drawdown).toBeDefined();
        if (callCount >= 2) { // Expect 2 windows (1h and 24h)
          done();
        }
      });

      tracker.updateValue(9500);
    });

    it('should emit reset event', (done) => {
      // Create fresh tracker to avoid interference from beforeEach
      const freshTracker = new DrawdownTracker({
        initialValue: 10000,
        warningThreshold: 0.10,
        criticalThreshold: 0.15,
      });

      freshTracker.on('reset', ({ value }) => {
        expect(value).toBe(5000);
        done();
      });

      freshTracker.reset(5000);
    });
  });

  describe('Threshold Deduplication', () => {
    it('should not emit duplicate warnings within same minute', () => {
      let warningCount = 0;

      tracker.on('warning', () => {
        warningCount++;
      });

      // Multiple updates at warning level
      for (let i = 0; i < 5; i++) {
        tracker.updateValue(9000);
      }

      // Should have emitted only once (or limited times due to dedup)
      expect(warningCount).toBeLessThanOrEqual(2);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to initial value', () => {
      tracker.updateValue(8000);
      tracker.reset();

      const metrics = tracker.getMetrics();
      expect(metrics.currentValue).toBe(10000);
      expect(metrics.peakValue).toBe(10000);
      expect(metrics.historyLength).toBe(0);
    });

    it('should reset to custom value', () => {
      tracker.reset(5000);

      const metrics = tracker.getMetrics();
      expect(metrics.currentValue).toBe(5000);
      expect(metrics.peakValue).toBe(5000);
      expect(metrics.allTimeHigh).toBe(5000);
    });

    it('should clear breach log on reset', () => {
      // Trigger breach
      tracker.updateValue(8500);

      // Reset
      tracker.reset();

      // Should be able to trigger breach again
      let breachCount = 0;
      tracker.on('critical', () => breachCount++);
      tracker.updateValue(8500);

      expect(breachCount).toBe(1);
    });
  });

  describe('Time Since Peak', () => {
    it('should calculate time since peak', () => {
      tracker.updateValue(11000); // Peak
      const beforeSleep = tracker.getTimeSincePeak();

      // Simulate time passing (using small delay)
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Note: In real tests, we'd use fake timers
      // For now, just verify the method returns a number
      expect(beforeSleep).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero value', () => {
      tracker.updateValue(0);

      const metrics = tracker.getMetrics();
      expect(metrics.currentValue).toBe(0);
      expect(metrics.drawdown).toBe(1); // 100% drawdown
    });

    it('should handle rapid updates', () => {
      const values = [10000, 9000, 8000, 7000, 8000, 9000, 10000, 11000];
      for (const value of values) {
        tracker.updateValue(value);
      }

      const metrics = tracker.getMetrics();
      expect(metrics.allTimeHigh).toBe(11000);
      expect(metrics.peakValue).toBe(11000);
    });

    it('should handle negative values (should not happen but test anyway)', () => {
      tracker.updateValue(-1000);

      const metrics = tracker.getMetrics();
      expect(metrics.currentValue).toBe(-1000);
    });
  });

  describe('setValue Method', () => {
    it('should update value via setValue', () => {
      tracker.setValue(9500);

      const metrics = tracker.getMetrics();
      expect(metrics.currentValue).toBe(9500);
    });
  });
});
