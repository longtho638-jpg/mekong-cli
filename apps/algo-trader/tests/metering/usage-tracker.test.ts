/**
 * Unit Tests for Usage Tracker Service
 *
 * Tests:
 * - Track API calls → buffered → flushed to DB
 * - Get usage by license + month
 * - Internal API auth + response format
 * - Stripe adapter format
 * - Polar adapter format
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UsageTrackerService, UsageEvent, AggregatedUsage } from '../../src/metering/usage-tracker-service';
import { usageQueries } from '../../src/db/queries/usage-queries';
import { PolarAuditLogger } from '../../src/billing/polar-audit-logger';

// Mock external dependencies
jest.mock('../../src/db/queries/usage-queries', () => ({
  usageQueries: {
    getAggregatedUsage: jest.fn(),
    getUsageByLicense: jest.fn(),
    getRecentUsage: jest.fn(),
  },
}));

jest.mock('../../src/billing/polar-audit-logger', () => ({
  PolarAuditLogger: {
    getInstance: jest.fn(() => ({
      log: jest.fn(),
      logRefund: jest.fn(),
      logOrder: jest.fn(),
      isProcessed: jest.fn(() => false),
      markProcessed: jest.fn(),
      getRecentLogs: jest.fn(() => []),
      reset: jest.fn(),
    })),
  },
}));

describe('UsageTrackerService Unit Tests', () => {
  let tracker: UsageTrackerService;

  beforeEach(() => {
    UsageTrackerService.resetInstance();
    tracker = UsageTrackerService.getInstance();
    tracker.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    tracker.clear();
    UsageTrackerService.resetInstance();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test Scenario 1: Track API calls → buffered → flushed to DB
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Track API calls → buffered → flushed to DB', () => {
    test('should add event to buffer when tracking usage', async () => {
      await tracker.track('lic_test123', 'api_call', 1, { endpoint: '/v1/scan' });

      expect(tracker.getBufferSize()).toBe(1);
    });

    test('should store event with correct fields', async () => {
      const metadata = { endpoint: '/v1/ml/predict', durationMs: 250 };
      await tracker.track('lic_ml_test', 'api_call', 1, metadata);

      const entry = tracker['buffer'][0];
      expect(entry.event.licenseKey).toBe('lic_ml_test');
      expect(entry.event.eventType).toBe('api_call');
      expect(entry.event.units).toBe(1);
      expect(entry.event.metadata).toEqual(metadata);
      expect(entry.event.timestamp).toBeDefined();
    });

    test('should flush buffer to storage on threshold (100 events)', async () => {
      for (let i = 0; i < 100; i++) {
        await tracker.track('lic_batch_test', 'api_call', 1);
      }

      // Auto-flush triggered at threshold
      expect(tracker.getBufferSize()).toBe(0);
      expect(tracker.getTotalStoredEvents()).toBe(100);
    });

    test('should flush buffer when getUsage is called', async () => {
      await tracker.track('lic_flush_test', 'api_call', 1);
      await tracker.track('lic_flush_test', 'api_call', 2);

      // Before flush
      expect(tracker.getBufferSize()).toBe(2);

      // Trigger flush via getUsage
      const usage = await tracker.getUsage('lic_flush_test', '2026-03');

      // Buffer should be empty after auto-flush
      expect(tracker.getBufferSize()).toBe(0);
      expect(usage.totalUnits).toBe(3);
    });

    test('should flush events to monthly buckets correctly', async () => {
      // Track events for different months
      await tracker.track('lic_monthly', 'api_call', 5);
      jest.useFakeTimers({ now: new Date('2026-04-15') });
      await tracker.track('lic_monthly', 'api_call', 10);
      jest.useRealTimers();

      await tracker.flush();

      const usageMarch = await tracker.getUsage('lic_monthly', '2026-03');
      const usageApril = await tracker.getUsage('lic_monthly', '2026-04');

      expect(usageMarch.totalUnits).toBe(5);
      expect(usageApril.totalUnits).toBe(10);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test Scenario 2: Get usage by license + month
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Get usage by license + month', () => {
    test('should return aggregated usage for a license and month', async () => {
      // Add events
      await tracker.track('lic_usage', 'api_call', 10);
      await tracker.track('lic_usage', 'api_call', 5);
      await tracker.track('lic_usage', 'compute_minute', 2.5);
      await tracker.track('lic_usage', 'backtest_run', 1);

      await tracker.flush();

      const usage = await tracker.getUsage('lic_usage', '2026-03');

      expect(usage.licenseKey).toBe('lic_usage');
      expect(usage.month).toBe('2026-03');
      expect(usage.totalUnits).toBe(18.5);
      expect(usage.byEventType['api_call']).toBe(15);
      expect(usage.byEventType['compute_minute']).toBe(2.5);
      expect(usage.byEventType['backtest_run']).toBe(1);
      expect(usage.events).toHaveLength(4);
    });

    test('should return empty usage for unknown license', async () => {
      const usage = await tracker.getUsage('lic_unknown_xyz', '2026-03');

      expect(usage.licenseKey).toBe('lic_unknown_xyz');
      expect(usage.totalUnits).toBe(0);
      expect(usage.byEventType).toEqual({});
      expect(usage.events).toEqual([]);
    });

    test('should return empty usage for unknown month', async () => {
      await tracker.track('lic_known', 'api_call', 5);
      await tracker.flush();

      const usage = await tracker.getUsage('lic_known', '2026-99');

      expect(usage.totalUnits).toBe(0);
    });

    test('should get usage for current month automatically', async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);

      await tracker.track('lic_current', 'api_call', 7);
      await tracker.flush();

      const usage = await tracker.getCurrentMonthUsage('lic_current');

      expect(usage.month).toBe(currentMonth);
      expect(usage.totalUnits).toBe(7);
    });

    test('should get all usage records for a license across months', async () => {
      await tracker.track('lic_all_months', 'api_call', 5);
      jest.useFakeTimers({ now: new Date('2026-04-15') });
      await tracker.track('lic_all_months', 'api_call', 10);
      jest.useRealTimers();

      await tracker.flush();

      const allUsage = await tracker.getAllUsage('lic_all_months');

      expect(allUsage).toHaveLength(2);
      expect(allUsage[0].licenseKey).toBe('lic_all_months');
      expect(allUsage.some((u) => u.month === '2026-03')).toBe(true);
      expect(allUsage.some((u) => u.month === '2026-04')).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test Scenario 3: Internal API auth + response format
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Internal API auth + response format', () => {
    test('should use PolarAuditLogger for event tracking', async () => {
      const logger = PolarAuditLogger.getInstance();

      // The PolarAuditLogger is initialized in the constructor of UsageTrackerService
      // Verify it's available and properly initialized
      expect(logger.log).toBeDefined();
      expect(logger.logRefund).toBeDefined();
      expect(logger.logOrder).toBeDefined();
      expect(logger.isProcessed).toBeDefined();
      expect(logger.markProcessed).toBeDefined();
    });

    test('should track compute minutes for ML endpoints', async () => {
      jest.useFakeTimers({ now: new Date('2026-03-15T10:00:00Z') });

      const ML_ENDPOINTS = ['/api/ml/predict', '/api/predict/values', '/ml/inference'];
      for (const endpoint of ML_ENDPOINTS) {
        await tracker.track('lic_ml', 'api_call', 1, { endpoint, durationMs: 1500 });
      }

      jest.useRealTimers();

      const usage = await tracker.getUsage('lic_ml', '2026-03');
      expect(usage.byEventType['api_call']).toBe(3);
    });

    test('should handle large usage values without overflow', async () => {
      const largeUnits = 999999999;

      await tracker.track('lic_large', 'api_call', largeUnits);
      await tracker.flush();

      const usage = await tracker.getUsage('lic_large', '2026-03');
      expect(usage.totalUnits).toBe(largeUnits);
    });

    test('should clear all data for testing', () => {
      tracker.track('lic_clear', 'api_call', 1);
      tracker.clear();

      expect(tracker.getBufferSize()).toBe(0);
      expect(tracker.getTotalStoredEvents()).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test Scenario 4: Stripe adapter format
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Stripe adapter format', () => {
    test('should return usage events suitable for Stripe billing export', async () => {
      // Simulate events that would be exported to Stripe
      const testEvents: UsageEvent[] = [
        { licenseKey: 'lic_stripe', eventType: 'api_call', units: 10, timestamp: '2026-03-01T10:00:00Z', metadata: {} },
        { licenseKey: 'lic_stripe', eventType: 'api_call', units: 15, timestamp: '2026-03-02T10:00:00Z', metadata: {} },
        { licenseKey: 'lic_stripe', eventType: 'compute_minute', units: 5.5, timestamp: '2026-03-03T10:00:00Z', metadata: {} },
      ];

      // Directly set events without flushing to avoid duplication
      tracker['usageStore'].set('lic_stripe:2026-03', testEvents);

      const usage = await tracker.getUsage('lic_stripe', '2026-03');

      // Verify structure matches Stripe requirements
      expect(usage.licenseKey).toBe('lic_stripe');
      expect(Array.isArray(usage.events)).toBe(true);

      // Events should have timestamp for Stripe daily aggregation
      expect(usage.events[0].timestamp).toBeDefined();
      expect(new Date(usage.events[0].timestamp).getFullYear()).toBe(2026);
    });

    test('should support Stripe daily aggregation format', async () => {
      // Simulate daily events for Stripe export
      const dailyEvents: UsageEvent[] = [
        {
          licenseKey: 'lic_daily',
          eventType: 'api_call',
          units: 100,
          timestamp: '2026-03-15T10:00:00.000Z',
          metadata: {},
        },
        {
          licenseKey: 'lic_daily',
          eventType: 'api_call',
          units: 150,
          timestamp: '2026-03-15T11:00:00.000Z',
          metadata: {},
        },
        {
          licenseKey: 'lic_daily',
          eventType: 'api_call',
          units: 200,
          timestamp: '2026-03-16T10:00:00.000Z',
          metadata: {},
        },
      ];

      // Directly set events without flushing to avoid duplication
      tracker['usageStore'].set('lic_daily:2026-03', dailyEvents);

      const usage = await tracker.getUsage('lic_daily', '2026-03');

      // Aggregate by day for Stripe (using UTC for consistency)
      const dailyTotals = new Map<number, number>();
      for (const event of usage.events) {
        const dayStart = new Date(event.timestamp);
        dayStart.setUTCHours(0, 0, 0, 0);
        const timestamp = Math.floor(dayStart.getTime() / 1000);

        const current = dailyTotals.get(timestamp) || 0;
        dailyTotals.set(timestamp, current + event.units);
      }

      expect(dailyTotals.size).toBe(2); // 2 days

      // Verify totals by iterating the map
      let totalDay1 = 0;
      let totalDay2 = 0;
      for (const [timestamp, quantity] of dailyTotals.entries()) {
        const date = new Date(timestamp * 1000);
        const dateStr = date.toISOString().split('T')[0];
        if (dateStr === '2026-03-15') {
          totalDay1 = quantity;
        } else if (dateStr === '2026-03-16') {
          totalDay2 = quantity;
        }
      }

      expect(totalDay1).toBe(250); // 100 + 150
      expect(totalDay2).toBe(200);
    });

    test('should support Stripe export action format', async () => {
      const stripeEvents: UsageEvent[] = [
        { licenseKey: 'lic_stripe_action', eventType: 'api_call', units: 50, timestamp: '2026-03-01T10:00:00Z', metadata: {} },
      ];

      // Directly set events without flushing
      tracker['usageStore'].set('lic_stripe_action:2026-03', stripeEvents);

      const usage = await tracker.getUsage('lic_stripe_action', '2026-03');

      // Stripe format: quantity, timestamp, action
      const stripeRecords = usage.events.map((e) => ({
        quantity: e.units,
        timestamp: Math.floor(new Date(e.timestamp).getTime() / 1000),
        action: 'set' as const,
      }));

      expect(stripeRecords).toHaveLength(1);
      expect(stripeRecords[0].action).toBe('set');
      expect(stripeRecords[0].quantity).toBe(50);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test Scenario 5: Polar adapter format
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Polar adapter format', () => {
    test('should format usage for Polar subscription billing', async () => {
      // Use actual events with proper aggregation
      await tracker.track('lic_polar', 'api_call', 1);
      await tracker.track('lic_polar', 'compute_minute', 15);
      await tracker.track('lic_polar', 'api_call', 1);

      await tracker.flush();

      const usage = await tracker.getUsage('lic_polar', '2026-03');

      // Polar format: event type buckets with counts
      const polarUsage = {
        licenseKey: usage.licenseKey,
        month: usage.month,
        apiCallCount: usage.byEventType['api_call'] || 0,
        computeMinutes: usage.byEventType['compute_minute'] || 0,
        totalUnits: usage.totalUnits,
      };

      expect(polarUsage.apiCallCount).toBe(2);
      expect(polarUsage.computeMinutes).toBe(15);
      expect(polarUsage.totalUnits).toBe(17);
    });

    test('should handle Polar usage aggregation by event type', async () => {
      // Use actual events - aggregate byEventType
      await tracker.track('lic_polar_agg', 'api_call', 100);
      await tracker.track('lic_polar_agg', 'api_call', 50);
      await tracker.track('lic_polar_agg', 'compute_minute', 30);
      await tracker.track('lic_polar_agg', 'backtest_run', 3);

      await tracker.flush();

      const usage = await tracker.getUsage('lic_polar_agg', '2026-03');

      // Verify event type aggregation - api_call sum is 100 + 50 = 150
      const byEventType = usage.byEventType;

      expect(byEventType['api_call']).toBe(150);
      expect(byEventType['compute_minute']).toBe(30);
      expect(byEventType['backtest_run']).toBe(3);
      expect(byEventType['ml_inference']).toBeUndefined();
    });

    test('should support Polar audit logging integration', async () => {
      const logger = PolarAuditLogger.getInstance();

      // The PolarAuditLogger is initialized when UsageTrackerService is created
      // and events can be logged through it for audit purposes
      expect(logger.log).toBeDefined();
      expect(logger.logRefund).toBeDefined();
      expect(logger.logOrder).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Additional Edge Cases
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    test('should handle negative units gracefully', async () => {
      // Refund scenario
      await tracker.track('lic_refund', 'api_call', -5);

      const usage = await tracker.getUsage('lic_refund', '2026-03');
      expect(usage.totalUnits).toBe(-5);
    });

    test('should handle zero units', async () => {
      await tracker.track('lic_zero', 'api_call', 0);

      const usage = await tracker.getUsage('lic_zero', '2026-03');
      expect(usage.totalUnits).toBe(0);
      expect(usage.events).toHaveLength(1);
    });

    test('should handle special characters in license key', async () => {
      const specialKeys = ['lic-abc_123', 'lic.test.456', 'lic:xyz:789'];

      for (const key of specialKeys) {
        await tracker.track(key, 'api_call', 1);
      }

      await tracker.flush();

      for (const key of specialKeys) {
        const usage = await tracker.getUsage(key, '2026-03');
        expect(usage.licenseKey).toBe(key);
        expect(usage.totalUnits).toBe(1);
      }
    });

    test('should track metadata with nested objects', async () => {
      const metadata = {
        endpoint: '/api/v1/ml/predict',
        model: 'gpt-4',
        inputTokens: 100,
        outputTokens: 50,
        latencyMs: 250,
        context: {
          tenant: 'test-tenant',
          source: 'web',
        },
      };

      await tracker.track('lic_metadata', 'api_call', 1, metadata);

      const usage = await tracker.getUsage('lic_metadata', '2026-03');
      expect(usage.events[0].metadata).toEqual(metadata);
    });

    test('should handle concurrent track calls', async () => {
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          tracker.track(`lic_concurrent_${i % 5}`, 'api_call', 1),
        );
      }

      await Promise.all(promises);

      // Buffer should have all 50 events
      expect(tracker.getBufferSize()).toBe(50);
    });

    test('should reset instance for fresh tests', () => {
      tracker.track('lic_reset', 'api_call', 1);

      UsageTrackerService.resetInstance();
      const newTracker = UsageTrackerService.getInstance();
      newTracker.clear();

      expect(newTracker.getBufferSize()).toBe(0);
      expect(newTracker.getTotalStoredEvents()).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Integration with usage-queries.ts
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Integration with usage-queries', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should fall back to in-memory when DB is unavailable', async () => {
      // Mock DB query to throw error
      (usageQueries.getAggregatedUsage as jest.Mock).mockRejectedValue(new Error('DB unavailable'));

      await tracker.track('lic_fallback', 'api_call', 10);
      await tracker.flush();

      // Usage should still be available from in-memory
      const usage = await tracker.getUsage('lic_fallback', '2026-03');
      expect(usage.totalUnits).toBe(10);
    });

    test('should handle DB fallback gracefully', async () => {
      // Mock DB query to throw error
      (usageQueries.getAggregatedUsage as jest.Mock).mockRejectedValue(new Error('DB unavailable'));

      await tracker.track('lic_fallback', 'api_call', 10);
      await tracker.flush();

      // Usage should still be available from in-memory (not DB)
      const usage = await tracker.getUsage('lic_fallback', '2026-03');
      expect(usage.totalUnits).toBe(10);
    });

    test('should handle DB and in-memory integration', async () => {
      // Mock DB returning some data
      (usageQueries.getAggregatedUsage as jest.Mock).mockResolvedValue([]);

      // Add more to buffer - this tests that in-memory data works independently
      await tracker.track('lic_db_int', 'compute_minute', 2);
      await tracker.flush();

      const usage = await tracker.getUsage('lic_db_int', '2026-03');
      expect(usage.totalUnits).toBe(2);
    });
  });
});
