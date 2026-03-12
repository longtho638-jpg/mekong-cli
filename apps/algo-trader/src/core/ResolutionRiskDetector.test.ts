/**
 * ResolutionRiskDetector tests
 */

import { ResolutionRiskDetector, PositionInfo } from './ResolutionRiskDetector';

describe('ResolutionRiskDetector', () => {
  let detector: ResolutionRiskDetector;
  let now: number;

  beforeEach(() => {
    now = Date.now();
    jest.useFakeTimers();
    jest.setSystemTime(now);

    detector = new ResolutionRiskDetector({
      warningHours: [72, 48, 24],
      autoReduceLimit: 50,
      criticalThreshold: 24,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('trackPosition', () => {
    it('should add a position for tracking', () => {
      const position: PositionInfo = {
        symbol: 'PRES-2024',
        eventId: 'pres-election-2024',
        size: 100,
        side: 'long',
        entryPrice: 0.55,
      };

      const resolutionTime = now + 48 * 60 * 60 * 1000; // 48 hours
      detector.trackPosition(position, resolutionTime);

      const tracked = detector.getTrackedPositions();
      expect(tracked.length).toBe(1);
      expect(tracked[0].symbol).toBe('PRES-2024');
      expect(tracked[0].hoursUntil).toBeCloseTo(48, 1);
    });

    it('should track multiple positions', () => {
      detector.trackPosition(
        { symbol: 'A', eventId: 'event-a' },
        now + 24 * 60 * 60 * 1000
      );
      detector.trackPosition(
        { symbol: 'B', eventId: 'event-b' },
        now + 48 * 60 * 60 * 1000
      );

      expect(detector.getTrackedPositions().length).toBe(2);
    });
  });

  describe('checkResolutionRisk', () => {
    it('should generate critical alerts for positions resolving within 24h', () => {
      detector.trackPosition(
        { symbol: 'PRES-2024', eventId: 'pres', size: 100, side: 'long' },
        now + 12 * 60 * 60 * 1000 // 12 hours
      );

      const alerts = detector.checkResolutionRisk();

      expect(alerts.length).toBe(1);
      expect(alerts[0].riskLevel).toBe('critical');
      expect(alerts[0].hoursUntilResolution).toBeCloseTo(12, 1);
      expect(alerts[0].recommendedAction).toContain('URGENT');
    });

    it('should generate high alerts for positions resolving within 48h', () => {
      detector.trackPosition(
        { symbol: 'FED-JAN', eventId: 'fed' },
        now + 36 * 60 * 60 * 1000 // 36 hours
      );

      const alerts = detector.checkResolutionRisk();

      expect(alerts.length).toBe(1);
      expect(alerts[0].riskLevel).toBe('high');
    });

    it('should generate medium alerts for positions resolving within 72h', () => {
      detector.trackPosition(
        { symbol: 'NFP', eventId: 'nfp' },
        now + 60 * 60 * 60 * 1000 // 60 hours
      );

      const alerts = detector.checkResolutionRisk();

      expect(alerts.length).toBe(1);
      expect(alerts[0].riskLevel).toBe('medium');
    });

    it('should not generate alerts for positions with low risk', () => {
      detector.trackPosition(
        { symbol: 'LONG-TERM', eventId: 'long' },
        now + 100 * 60 * 60 * 1000 // 100 hours
      );

      const alerts = detector.checkResolutionRisk();

      expect(alerts.length).toBe(0);
    });

    it('should generate critical alert for already resolved positions', () => {
      detector.trackPosition(
        { symbol: 'EXPIRED', eventId: 'expired' },
        now - 1 * 60 * 60 * 1000 // 1 hour ago
      );

      const alerts = detector.checkResolutionRisk();

      expect(alerts.length).toBe(1);
      expect(alerts[0].riskLevel).toBe('critical');
      expect(alerts[0].hoursUntilResolution).toBe(0);
    });
  });

  describe('getPositionsResolvingWithin', () => {
    it('should return positions resolving within specified hours', () => {
      detector.trackPosition(
        { symbol: 'SOON', eventId: 'soon' },
        now + 12 * 60 * 60 * 1000
      );
      detector.trackPosition(
        { symbol: 'LATER', eventId: 'later' },
        now + 100 * 60 * 60 * 1000
      );

      const soon = detector.getPositionsResolvingWithin(24);

      expect(soon.length).toBe(1);
      expect(soon[0].symbol).toBe('SOON');
    });
  });

  describe('getPositionLimit', () => {
    it('should reduce position limit within critical threshold', () => {
      detector.trackPosition(
        { symbol: 'CRITICAL', eventId: 'critical' },
        now + 12 * 60 * 60 * 1000
      );

      const limit = detector.getPositionLimit('CRITICAL', 100);

      expect(limit).toBe(50); // 50% of normal limit
    });

    it('should return normal limit outside critical threshold', () => {
      detector.trackPosition(
        { symbol: 'SAFE', eventId: 'safe' },
        now + 48 * 60 * 60 * 1000
      );

      const limit = detector.getPositionLimit('SAFE', 100);

      expect(limit).toBe(100);
    });
  });

  describe('isCriticalResolution', () => {
    it('should return true for positions within critical threshold', () => {
      detector.trackPosition(
        { symbol: 'CRIT', eventId: 'crit' },
        now + 20 * 60 * 60 * 1000
      );

      expect(detector.isCriticalResolution('CRIT')).toBe(true);
    });

    it('should return false for positions outside critical threshold', () => {
      detector.trackPosition(
        { symbol: 'SAFE', eventId: 'safe' },
        now + 48 * 60 * 60 * 1000
      );

      expect(detector.isCriticalResolution('SAFE')).toBe(false);
    });

    it('should return false for unknown symbols', () => {
      expect(detector.isCriticalResolution('UNKNOWN')).toBe(false);
    });
  });

  describe('untrackPosition', () => {
    it('should remove position and its alerts', () => {
      detector.trackPosition(
        { symbol: 'REMOVE', eventId: 'remove' },
        now + 12 * 60 * 60 * 1000
      );
      detector.checkResolutionRisk();

      detector.untrackPosition('REMOVE');

      expect(detector.getTrackedPositions().length).toBe(0);
      expect(detector.getAlerts().length).toBe(0);
    });
  });

  describe('reset', () => {
    it('should clear all tracked positions and alerts', () => {
      detector.trackPosition(
        { symbol: 'A', eventId: 'a' },
        now + 24 * 60 * 60 * 1000
      );
      detector.trackPosition(
        { symbol: 'B', eventId: 'b' },
        now + 48 * 60 * 60 * 1000
      );
      detector.checkResolutionRisk();

      detector.reset();

      expect(detector.getTrackedPositions().length).toBe(0);
      expect(detector.getAlerts().length).toBe(0);
    });
  });

  describe('getRecommendedAction', () => {
    it('should recommend appropriate action based on time to resolution', () => {
      const testCases = [
        { hours: -1, expected: 'resolving' },
        { hours: 6, expected: 'URGENT' },
        { hours: 18, expected: 'Reduce' },
        { hours: 36, expected: 'Review' },
        { hours: 60, expected: 'Monitor' },
        { hours: 100, expected: 'No immediate' },
      ];

      for (const tc of testCases) {
        detector.trackPosition(
          { symbol: `TEST-${tc.hours}`, eventId: 'test' },
          now + tc.hours * 60 * 60 * 1000
        );
      }

      const alerts = detector.checkResolutionRisk();

      expect(alerts.find(a => a.hoursUntilResolution <= 0)?.recommendedAction).toContain('resolving');
      expect(alerts.find(a => a.hoursUntilResolution === 6)?.recommendedAction).toContain('URGENT');
      expect(alerts.find(a => a.hoursUntilResolution === 18)?.recommendedAction).toContain('Reduce');
    });
  });
});
