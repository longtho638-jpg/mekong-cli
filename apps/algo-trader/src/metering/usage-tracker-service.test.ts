/**
 * UsageTrackerService Tests
 *
 * Tests for usage metering service:
 * - Singleton pattern
 * - Event tracking and buffering
 * - Auto-flush on threshold (100 events)
 * - Usage aggregation
 * - Monitoring methods
 *
 * Note: Auto-flush interval (30s) and shutdown hook tests are skipped
 * to avoid test flakiness and MaxListenersExceededWarning.
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { UsageTrackerService } from './usage-tracker-service';

describe('UsageTrackerService', () => {
  let tracker: UsageTrackerService;

  beforeEach(() => {
    UsageTrackerService.resetInstance();
    tracker = UsageTrackerService.getInstance();
    tracker.clear();
  });

  afterEach(() => {
    tracker.clear();
    UsageTrackerService.resetInstance();
  });

  describe('Singleton Pattern', () => {
    test('should return same instance on multiple calls', () => {
      const instance1 = UsageTrackerService.getInstance();
      const instance2 = UsageTrackerService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should reset instance when called', () => {
      const instance1 = UsageTrackerService.getInstance();
      UsageTrackerService.resetInstance();
      const instance2 = UsageTrackerService.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('track()', () => {
    test('should add event to buffer', async () => {
      await tracker.track('lic_test123', 'api_call', 1, { endpoint: '/v1/scan' });
      expect(tracker.getBufferSize()).toBe(1);
    });

    test('should track multiple events', async () => {
      await tracker.track('lic_test123', 'api_call', 1);
      await tracker.track('lic_test123', 'backtest_run', 5);
      await tracker.track('lic_test123', 'live_trade', 1);
      expect(tracker.getBufferSize()).toBe(3);
    });

    test('should handle default units value', async () => {
      await tracker.track('lic_test123', 'api_call');
      const usage = await tracker.getUsage('lic_test123', '2026-03');
      expect(usage.totalUnits).toBe(1);
    });

    test('should store metadata', async () => {
      const metadata = { endpoint: '/v1/scan', method: 'POST', duration: 150 };
      await tracker.track('lic_test123', 'api_call', 1, metadata);
      const usage = await tracker.getUsage('lic_test123', '2026-03');
      expect(usage.events[0].metadata).toEqual(metadata);
    });

    test('should generate timestamp', async () => {
      await tracker.track('lic_test123', 'api_call', 1);
      const usage = await tracker.getUsage('lic_test123', '2026-03');
      expect(usage.events[0].timestamp).toBeDefined();
      expect(new Date(usage.events[0].timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  describe('flush()', () => {
    test('should write buffered events to storage', async () => {
      await tracker.track('lic_test123', 'api_call', 1);
      await tracker.track('lic_test123', 'backtest_run', 5);

      const flushed = await tracker.flush();
      expect(flushed).toBe(2);
      expect(tracker.getBufferSize()).toBe(0);
    });

    test('should return 0 when buffer is empty', async () => {
      const flushed = await tracker.flush();
      expect(flushed).toBe(0);
    });

    test('should organize events by license and month', async () => {
      await tracker.track('lic_test123', 'api_call', 1);
      await tracker.track('lic_test456', 'api_call', 2);
      await tracker.flush();

      const usage1 = await tracker.getUsage('lic_test123', '2026-03');
      const usage2 = await tracker.getUsage('lic_test456', '2026-03');

      expect(usage1.totalUnits).toBe(1);
      expect(usage2.totalUnits).toBe(2);
    });
  });

  describe('getUsage()', () => {
    test('should return aggregated usage for license and month', async () => {
      await tracker.track('lic_test123', 'api_call', 10);
      await tracker.track('lic_test123', 'api_call', 5);
      await tracker.track('lic_test123', 'backtest_run', 3);
      await tracker.flush();

      const usage = await tracker.getUsage('lic_test123', '2026-03');

      expect(usage.licenseKey).toBe('lic_test123');
      expect(usage.month).toBe('2026-03');
      expect(usage.totalUnits).toBe(18);
      expect(usage.byEventType['api_call']).toBe(15);
      expect(usage.byEventType['backtest_run']).toBe(3);
    });

    test('should return empty usage for unknown license', async () => {
      const usage = await tracker.getUsage('lic_unknown', '2026-03');
      expect(usage.totalUnits).toBe(0);
      expect(usage.byEventType).toEqual({});
      expect(usage.events).toEqual([]);
    });

    test('should auto-flush buffer before returning usage', async () => {
      await tracker.track('lic_test123', 'api_call', 1);
      const usage = await tracker.getUsage('lic_test123', '2026-03');
      expect(usage.totalUnits).toBe(1);
      expect(tracker.getBufferSize()).toBe(0);
    });
  });

  describe('getCurrentMonthUsage()', () => {
    test('should return usage for current month', async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      await tracker.track('lic_test123', 'api_call', 5);
      await tracker.flush();

      const usage = await tracker.getCurrentMonthUsage('lic_test123');
      expect(usage.month).toBe(currentMonth);
      expect(usage.totalUnits).toBe(5);
    });
  });

  describe('getAllUsage()', () => {
    test('should return usage for all months', async () => {
      await tracker.track('lic_test123', 'api_call', 10);
      await tracker.flush();

      const allUsage = await tracker.getAllUsage('lic_test123');
      expect(allUsage.length).toBeGreaterThan(0);
      expect(allUsage[0].licenseKey).toBe('lic_test123');
    });

    test('should auto-flush buffer before returning', async () => {
      await tracker.track('lic_test123', 'api_call', 1);
      const allUsage = await tracker.getAllUsage('lic_test123');
      expect(allUsage.length).toBeGreaterThan(0);
    });
  });

  describe('Auto-flush Threshold', () => {
    test('should auto-flush after 100 events', async () => {
      for (let i = 0; i < 100; i++) {
        await tracker.track('lic_test123', 'api_call', 1);
      }
      expect(tracker.getBufferSize()).toBe(0);
    });
  });

  describe('Monitoring Methods', () => {
    test('should report buffer size', async () => {
      expect(tracker.getBufferSize()).toBe(0);
      await tracker.track('lic_test123', 'api_call', 1);
      expect(tracker.getBufferSize()).toBe(1);
      await tracker.track('lic_test123', 'api_call', 1);
      expect(tracker.getBufferSize()).toBe(2);
    });

    test('should report total stored events', async () => {
      expect(tracker.getTotalStoredEvents()).toBe(0);
      await tracker.track('lic_test123', 'api_call', 1);
      await tracker.flush();
      expect(tracker.getTotalStoredEvents()).toBe(1);
      await tracker.track('lic_test456', 'api_call', 2);
      await tracker.flush();
      expect(tracker.getTotalStoredEvents()).toBe(2);
    });
  });

  describe('Clear (Testing Only)', () => {
    test('should clear all data', async () => {
      await tracker.track('lic_test123', 'api_call', 1);
      await tracker.flush();
      tracker.clear();
      expect(tracker.getBufferSize()).toBe(0);
      expect(tracker.getTotalStoredEvents()).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty metadata', async () => {
      await tracker.track('lic_test123', 'api_call', 1);
      const usage = await tracker.getUsage('lic_test123', '2026-03');
      expect(usage.events[0].metadata).toEqual({});
    });

    test('should handle large unit values', async () => {
      await tracker.track('lic_test123', 'api_call', 1000000);
      const usage = await tracker.getUsage('lic_test123', '2026-03');
      expect(usage.totalUnits).toBe(1000000);
    });

    test('should handle special characters in license key', async () => {
      await tracker.track('lic_test-123_abc', 'api_call', 1);
      const usage = await tracker.getUsage('lic_test-123_abc', '2026-03');
      expect(usage.licenseKey).toBe('lic_test-123_abc');
      expect(usage.totalUnits).toBe(1);
    });
  });
});
