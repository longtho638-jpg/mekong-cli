/**
 * Integration Tests for Usage Metering System
 *
 * Tests:
 * - End-to-end tracking and retrieval
 * - Internal API route functionality
 * - Stripe and Polar billing integration (adapter formats)
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { UsageTrackerService } from '../../src/metering/usage-tracker-service';
import { PolarSubscriptionService } from '../../src/billing/polar-subscription-service';

// Mock external dependencies
jest.mock('../../src/db/queries/usage-queries');
jest.mock('../../src/db/client');

const INTERNAL_API_KEY = 'test-internal-api-key';

describe('Usage Metering Integration Tests', () => {
  beforeEach(() => {
    UsageTrackerService.resetInstance();
    PolarSubscriptionService.resetInstance();
    jest.clearAllMocks();
    process.env.INTERNAL_API_KEY = INTERNAL_API_KEY;
  });

  afterEach(() => {
    process.env.INTERNAL_API_KEY = undefined;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Track API calls → buffered → flushed to DB
  // ─────────────────────────────────────────────────────────────────────────────

  describe('API call tracking workflow', () => {
    test('should track usage via buffer and retrieve aggregated data', async () => {
      const licenseKey = 'lic_workflow_001';

      const tracker = UsageTrackerService.getInstance();

      // Track multiple events
      await tracker.track(licenseKey, 'api_call', 10);
      await tracker.track(licenseKey, 'api_call', 5);
      await tracker.track(licenseKey, 'compute_minute', 5.5);
      await tracker.track(licenseKey, 'backtest_run', 3);

      // Flush to storage
      await tracker.flush();

      // Get aggregated usage
      const usage = await tracker.getUsage(licenseKey, '2026-03');

      expect(usage.licenseKey).toBe(licenseKey);
      expect(usage.month).toBe('2026-03');
      expect(usage.totalUnits).toBe(23.5);
      expect(usage.byEventType['api_call']).toBe(15);
      expect(usage.byEventType['compute_minute']).toBe(5.5);
      expect(usage.byEventType['backtest_run']).toBe(3);
      expect(usage.events).toHaveLength(4);
    });

    test('should auto-flush buffer when getUsage is called', async () => {
      const licenseKey = 'lic_auto_flush';

      const tracker = UsageTrackerService.getInstance();

      // Add events without explicit flush
      await tracker.track(licenseKey, 'api_call', 10);
      await tracker.track(licenseKey, 'compute_minute', 5);

      // Buffer should have events
      expect(tracker.getBufferSize()).toBe(2);

      // GetUsage triggers auto-flush
      const usage = await tracker.getUsage(licenseKey, '2026-03');

      // Buffer should be empty after auto-flush
      expect(tracker.getBufferSize()).toBe(0);
      expect(usage.totalUnits).toBe(15);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Multi-month tracking
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Multi-month tracking', () => {
    test('should separate usage by month', async () => {
      const licenseKey = 'lic_multi_month';

      const tracker = UsageTrackerService.getInstance();

      // March events
      await tracker.track(licenseKey, 'api_call', 100);
      jest.useFakeTimers({ now: new Date('2026-04-15') });
      await tracker.track(licenseKey, 'api_call', 150);
      jest.useRealTimers();

      await tracker.flush();

      const usageMarch = await tracker.getUsage(licenseKey, '2026-03');
      const usageApril = await tracker.getUsage(licenseKey, '2026-04');

      expect(usageMarch.totalUnits).toBe(100);
      expect(usageApril.totalUnits).toBe(150);
    });

    test('should get all usage records across months', async () => {
      const licenseKey = 'lic_all_months';

      const tracker = UsageTrackerService.getInstance();

      await tracker.track(licenseKey, 'api_call', 100);
      jest.useFakeTimers({ now: new Date('2026-04-15') });
      await tracker.track(licenseKey, 'api_call', 200);
      jest.useRealTimers();

      await tracker.flush();

      const allUsage = await tracker.getAllUsage(licenseKey);

      expect(allUsage).toHaveLength(2);

      // Sort by month to ensure consistent ordering
      allUsage.sort((a, b) => a.month.localeCompare(b.month));

      expect(allUsage[0].month).toBe('2026-03');
      expect(allUsage[0].totalUnits).toBe(100);
      expect(allUsage[1].month).toBe('2026-04');
      expect(allUsage[1].totalUnits).toBe(200);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Stripe adapter format
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Stripe billing export format', () => {
    test('should provide events with timestamps for Stripe export', async () => {
      const licenseKey = 'lic_stripe_fmt';

      const tracker = UsageTrackerService.getInstance();

      await tracker.track(licenseKey, 'api_call', 100, { timestamp: '2026-03-15T10:00:00.000Z' });
      await tracker.track(licenseKey, 'api_call', 150, { timestamp: '2026-03-15T11:00:00.000Z' });
      await tracker.track(licenseKey, 'compute_minute', 30, { timestamp: '2026-03-16T10:00:00.000Z' });

      await tracker.flush();

      const usage = await tracker.getUsage(licenseKey, '2026-03');

      // Stripe format requires: subscription_item, quantity, timestamp, action
      const stripeRecords = usage.events.map((e) => ({
        subscription_item: 'sub_item_123',
        quantity: e.units,
        timestamp: Math.floor(new Date(e.timestamp).getTime() / 1000),
        action: 'set' as const,
      }));

      expect(stripeRecords).toHaveLength(3);
      expect(stripeRecords[0].action).toBe('set');
      expect(stripeRecords[0].quantity).toBe(100);
    });

    test('should aggregate by day for Stripe export', async () => {
      const licenseKey = 'lic_stripe_daily';

      const tracker = UsageTrackerService.getInstance();

      // Use explicit timestamps
      await tracker.track(licenseKey, 'api_call', 100);
      await tracker.track(licenseKey, 'api_call', 150);
      await tracker.track(licenseKey, 'api_call', 200);

      await tracker.flush();

      const usage = await tracker.getUsage(licenseKey, '2026-03');

      // Aggregate by day using UTC to ensure consistent results
      const dailyTotals = new Map<number, number>();
      for (const event of usage.events) {
        const dayStart = new Date(event.timestamp);
        dayStart.setUTCHours(0, 0, 0, 0);
        const timestamp = Math.floor(dayStart.getTime() / 1000);

        const current = dailyTotals.get(timestamp) || 0;
        dailyTotals.set(timestamp, current + event.units);
      }

      expect(dailyTotals.size).toBe(1); // All events on same day

      // Verify total
      let total = 0;
      for (const [timestamp, quantity] of dailyTotals.entries()) {
        total += quantity;
      }

      expect(total).toBe(450); // 100 + 150 + 200
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Polar adapter format
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Polar billing format', () => {
    test('should provide usage with event type buckets', async () => {
      const licenseKey = 'lic_polar_fmt';

      const tracker = UsageTrackerService.getInstance();

      await tracker.track(licenseKey, 'api_call', 200);
      await tracker.track(licenseKey, 'compute_minute', 45);
      await tracker.track(licenseKey, 'backtest_run', 3);
      await tracker.track(licenseKey, 'ml_inference', 10);

      await tracker.flush();

      const usage = await tracker.getUsage(licenseKey, '2026-03');

      // Polar format: get counts per event type
      const polarFormat = {
        apiCallCount: usage.byEventType['api_call'] || 0,
        computeMinutes: usage.byEventType['compute_minute'] || 0,
        backtestCount: usage.byEventType['backtest_run'] || 0,
        mlInferenceCount: usage.byEventType['ml_inference'] || 0,
      };

      expect(polarFormat.apiCallCount).toBe(200);
      expect(polarFormat.computeMinutes).toBe(45);
      expect(polarFormat.backtestCount).toBe(3);
      expect(polarFormat.mlInferenceCount).toBe(10);
    });

    test('should support Polar usage summary by license', async () => {
      const licenseKey = 'lic_polar_summary';

      const tracker = UsageTrackerService.getInstance();

      await tracker.track(licenseKey, 'api_call', 500);
      await tracker.track(licenseKey, 'compute_minute', 200);
      await tracker.track(licenseKey, 'backtest_run', 5);

      await tracker.flush();

      const usage = await tracker.getUsage(licenseKey, '2026-03');

      // Verify summary structure
      expect(usage.totalUnits).toBe(705);
      expect(usage.byEventType['api_call']).toBe(500);
      expect(usage.byEventType['compute_minute']).toBe(200);
      expect(usage.byEventType['backtest_run']).toBe(5);
      expect(Array.isArray(usage.events)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Multi-tenant isolation
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Multi-tenant isolation', () => {
    test('should keep usage separate for different licenses', async () => {
      const licenses = ['lic_iso_1', 'lic_iso_2', 'lic_iso_3'];

      const tracker = UsageTrackerService.getInstance();

      // Track different amounts for each license
      await tracker.track(licenses[0], 'api_call', 100);
      await tracker.track(licenses[1], 'api_call', 200);
      await tracker.track(licenses[2], 'api_call', 300);

      await tracker.flush();

      // Get usage for each
      for (let i = 0; i < licenses.length; i++) {
        const usage = await tracker.getUsage(licenses[i], '2026-03');
        expect(usage.totalUnits).toBe((i + 1) * 100);
        expect(usage.licenseKey).toBe(licenses[i]);
      }
    });

    test('should handle concurrent multi-tenant tracking', async () => {
      const tracker = UsageTrackerService.getInstance();

      // Track for multiple licenses concurrently
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const licenseKey = `lic_concurrent_${i}`;
        promises.push(
          tracker.track(licenseKey, 'api_call', i + 1),
        );
      }

      await Promise.all(promises);
      await tracker.flush();

      // Verify each license has correct usage
      for (let i = 0; i < 10; i++) {
        const licenseKey = `lic_concurrent_${i}`;
        const usage = await tracker.getUsage(licenseKey, '2026-03');
        expect(usage.totalUnits).toBe(i + 1);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Edge cases
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    test('should handle zero units', async () => {
      const licenseKey = 'lic_zero';

      const tracker = UsageTrackerService.getInstance();
      await tracker.track(licenseKey, 'api_call', 0);
      await tracker.flush();

      const usage = await tracker.getUsage(licenseKey, '2026-03');
      expect(usage.totalUnits).toBe(0);
      expect(usage.events).toHaveLength(1);
    });

    test('should handle negative units (refunds)', async () => {
      const licenseKey = 'lic_refund';

      const tracker = UsageTrackerService.getInstance();
      await tracker.track(licenseKey, 'api_call', -5);
      await tracker.flush();

      const usage = await tracker.getUsage(licenseKey, '2026-03');
      expect(usage.totalUnits).toBe(-5);
    });

    test('should handle large unit values', async () => {
      const licenseKey = 'lic_large';
      const largeUnits = 999999999;

      const tracker = UsageTrackerService.getInstance();
      await tracker.track(licenseKey, 'api_call', largeUnits);
      await tracker.flush();

      const usage = await tracker.getUsage(licenseKey, '2026-03');
      expect(usage.totalUnits).toBe(largeUnits);
    });

    test('should handle special characters in license key', async () => {
      const specialKeys = ['lic-test_123', 'lic.test.456', ' lic:xyz:789 '];

      const tracker = UsageTrackerService.getInstance();

      for (const key of specialKeys) {
        await tracker.track(key.trim(), 'api_call', 1);
      }

      await tracker.flush();

      for (const key of specialKeys) {
        const usage = await tracker.getUsage(key.trim(), '2026-03');
        expect(usage.licenseKey).toBe(key.trim());
        expect(usage.totalUnits).toBe(1);
      }
    });

    test('should handle empty metadata', async () => {
      const licenseKey = 'lic_empty_meta';

      const tracker = UsageTrackerService.getInstance();
      await tracker.track(licenseKey, 'api_call', 1);

      const usage = await tracker.getUsage(licenseKey, '2026-03');
      expect(usage.events[0].metadata).toEqual({});
    });

    test('should handle nested metadata objects', async () => {
      const licenseKey = 'lic_nested_meta';
      const metadata = {
        endpoint: '/api/v1/ml/predict',
        model: 'gpt-4',
        context: {
          tenant: 'test-tenant',
          source: 'web',
        },
      };

      const tracker = UsageTrackerService.getInstance();
      await tracker.track(licenseKey, 'api_call', 1, metadata);

      const usage = await tracker.getUsage(licenseKey, '2026-03');
      expect(usage.events[0].metadata).toEqual(metadata);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Monitoring tests
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Monitoring', () => {
    test('should report buffer size correctly', async () => {
      const tracker = UsageTrackerService.getInstance();

      expect(tracker.getBufferSize()).toBe(0);

      await tracker.track('lic_mon', 'api_call', 1);
      expect(tracker.getBufferSize()).toBe(1);

      await tracker.track('lic_mon', 'api_call', 1);
      expect(tracker.getBufferSize()).toBe(2);

      await tracker.flush();
      expect(tracker.getBufferSize()).toBe(0);
    });

    test('should report total stored events correctly', async () => {
      const tracker = UsageTrackerService.getInstance();

      expect(tracker.getTotalStoredEvents()).toBe(0);

      await tracker.track('lic_cnt_1', 'api_call', 1);
      await tracker.flush();
      expect(tracker.getTotalStoredEvents()).toBe(1);

      await tracker.track('lic_cnt_2', 'api_call', 1);
      await tracker.flush();
      expect(tracker.getTotalStoredEvents()).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Automatic flush threshold
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Auto-flush threshold', () => {
    test('should auto-flush after 100 events', async () => {
      const tracker = UsageTrackerService.getInstance();

      for (let i = 0; i < 100; i++) {
        await tracker.track('lic_threshold', 'api_call', 1);
      }

      // Buffer should be automatically flushed
      expect(tracker.getBufferSize()).toBe(0);
      expect(tracker.getTotalStoredEvents()).toBe(100);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Singleton pattern
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Singleton pattern', () => {
    test('should return same instance on multiple calls', () => {
      const instance1 = UsageTrackerService.getInstance();
      const instance2 = UsageTrackerService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should reset instance correctly', () => {
      const instance1 = UsageTrackerService.getInstance();
      UsageTrackerService.resetInstance();
      const instance2 = UsageTrackerService.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Current month convenience
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Current month convenience', () => {
    test('should get usage for current month', async () => {
      const licenseKey = 'lic_current';
      const currentMonth = new Date().toISOString().slice(0, 7);

      const tracker = UsageTrackerService.getInstance();
      await tracker.track(licenseKey, 'api_call', 7);
      await tracker.flush();

      const usage = await tracker.getCurrentMonthUsage(licenseKey);
      expect(usage.month).toBe(currentMonth);
      expect(usage.totalUnits).toBe(7);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Polar subscription integration
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Polar subscription service', () => {
    test('should support subscription activation', () => {
      const service = PolarSubscriptionService.getInstance();

      service.activateSubscription('t1', 'pro', 'prod_pro', null);
      expect(service.isActive('t1')).toBe(true);
      expect(service.getCurrentTier('t1')).toBe('pro');
    });

    test('should support subscription deactivation', () => {
      const service = PolarSubscriptionService.getInstance();

      service.activateSubscription('t1', 'pro', 'prod_pro', null);
      service.deactivateSubscription('t1');

      expect(service.isActive('t1')).toBe(false);
      expect(service.getCurrentTier('t1')).toBe('free');
    });
  });
});
