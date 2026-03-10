/**
 * Usage Threshold Monitor Integration Tests
 *
 * Tests for usage threshold monitoring and notification system.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UsageThresholdMonitor } from '../../src/metering/usage-threshold-monitor';
import { UsageTrackerService } from '../../src/metering/usage-tracker-service';
import { UsageBillingAdapter } from '../../src/billing/usage-billing-adapter';
import { BillingNotificationService } from '../../src/notifications/billing-notification-service';

describe('UsageThresholdMonitor', () => {
  let monitor: UsageThresholdMonitor;
  let tracker: UsageTrackerService;
  let billingAdapter: UsageBillingAdapter;
  let notificationService: BillingNotificationService;

  beforeEach(() => {
    // Reset singletons
    UsageThresholdMonitor.resetInstance();
    UsageTrackerService.resetInstance();
    UsageBillingAdapter.resetInstance();
    BillingNotificationService.resetInstance();

    monitor = UsageThresholdMonitor.getInstance({
      warningPercent: 80,
      limitPercent: 100,
      checkIntervalMs: 1000, // Fast for testing
    });

    tracker = UsageTrackerService.getInstance();
    billingAdapter = UsageBillingAdapter.getInstance();
    notificationService = BillingNotificationService.getInstance();
  });

  afterEach(async () => {
    await monitor.stopMonitoring();
    await monitor.shutdown();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = UsageThresholdMonitor.getInstance();
      const instance2 = UsageThresholdMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('startMonitoring / stopMonitoring', () => {
    it('should start and stop monitoring', async () => {
      expect(monitor.isMonitoringRunning()).toBe(false);

      await monitor.startMonitoring();
      expect(monitor.isMonitoringRunning()).toBe(true);

      await monitor.stopMonitoring();
      expect(monitor.isMonitoringRunning()).toBe(false);
    });

    it('should not start multiple timers', async () => {
      await monitor.startMonitoring();
      const firstStart = monitor.isMonitoringRunning();

      await monitor.startMonitoring(); // Should be ignored

      expect(firstStart).toBe(true);
    });
  });

  describe('checkThreshold', () => {
    it('should return null breach when usage is below threshold', async () => {
      // Setup overage config
      billingAdapter.registerOverageConfig({
        licenseKey: 'lic_test_001',
        subscriptionItemId: 'si_test',
        quotaLimit: 1000,
        overagePricePerUnit: 0.01,
        overageEnabled: true,
        metric: 'api_calls',
      });

      // Mock usage at 50% (below 80% warning threshold)
      vi.spyOn(tracker, 'getUsage').mockResolvedValue({
        byEventType: {
          api_call: 500,
          compute_minute: 0,
          ml_inference: 0,
        },
        totalUnits: 500,
        month: '2026-03',
        licenseKey: 'lic_test_001',
        events: [],
      });

      const result = await monitor.checkThreshold('lic_test_001');

      expect(result.breachType).toBe(null);
      expect(result.percentUsed).toBe(50);
      expect(result.notified).toBe(false);
    });

    it('should trigger warning at 80% usage', async () => {
      billingAdapter.registerOverageConfig({
        licenseKey: 'lic_test_001',
        subscriptionItemId: 'si_test',
        quotaLimit: 1000,
        overagePricePerUnit: 0.01,
        overageEnabled: true,
        metric: 'api_calls',
      });

      // Mock usage at 85% (above 80% warning threshold)
      vi.spyOn(tracker, 'getUsage').mockResolvedValue({
        byEventType: {
          api_call: 850,
          compute_minute: 0,
          ml_inference: 0,
        },
        totalUnits: 850,
        month: '2026-03',
        licenseKey: 'lic_test_001',
        events: [],
      });

      const result = await monitor.checkThreshold('lic_test_001');

      expect(result.breachType).toBe('warning');
      expect(result.percentUsed).toBe(85);
      expect(result.notified).toBe(true);
    });

    it('should trigger limit_reached at 100% usage', async () => {
      billingAdapter.registerOverageConfig({
        licenseKey: 'lic_test_001',
        subscriptionItemId: 'si_test',
        quotaLimit: 1000,
        overagePricePerUnit: 0.01,
        overageEnabled: true,
        metric: 'api_calls',
      });

      // Mock usage at 100%
      vi.spyOn(tracker, 'getUsage').mockResolvedValue({
        byEventType: {
          api_call: 1000,
          compute_minute: 0,
          ml_inference: 0,
        },
        totalUnits: 1000,
        month: '2026-03',
        licenseKey: 'lic_test_001',
        events: [],
      });

      const result = await monitor.checkThreshold('lic_test_001');

      expect(result.breachType).toBe('limit_reached');
      expect(result.percentUsed).toBe(100);
    });

    it('should trigger overage_started when usage exceeds quota', async () => {
      billingAdapter.registerOverageConfig({
        licenseKey: 'lic_test_001',
        subscriptionItemId: 'si_test',
        quotaLimit: 1000,
        overagePricePerUnit: 0.01,
        overageEnabled: true,
        metric: 'api_calls',
      });

      // Mock usage at 120% (overage)
      vi.spyOn(tracker, 'getUsage').mockResolvedValue({
        byEventType: {
          api_call: 1200,
          compute_minute: 0,
          ml_inference: 0,
        },
        totalUnits: 1200,
        month: '2026-03',
        licenseKey: 'lic_test_001',
        events: [],
      });

      const result = await monitor.checkThreshold('lic_test_001');

      expect(result.breachType).toBe('overage_started');
      expect(result.percentUsed).toBe(120);
      expect(result.overageUnits).toBe(200);
    });

    it('should return empty result when overage is not enabled', async () => {
      billingAdapter.registerOverageConfig({
        licenseKey: 'lic_test_001',
        subscriptionItemId: 'si_test',
        quotaLimit: 1000,
        overagePricePerUnit: 0.01,
        overageEnabled: false, // Disabled
        metric: 'api_calls',
      });

      const result = await monitor.checkThreshold('lic_test_001');

      expect(result.breachType).toBe(null);
      expect(result.quotaLimit).toBe(0);
    });

    it('should respect cooldown period between notifications', async () => {
      billingAdapter.registerOverageConfig({
        licenseKey: 'lic_test_001',
        subscriptionItemId: 'si_test',
        quotaLimit: 1000,
        overagePricePerUnit: 0.01,
        overageEnabled: true,
        metric: 'api_calls',
      });

      vi.spyOn(tracker, 'getUsage').mockResolvedValue({
        byEventType: {
          api_call: 850,
          compute_minute: 0,
          ml_inference: 0,
        },
        totalUnits: 850,
        month: '2026-03',
        licenseKey: 'lic_test_001',
        events: [],
      });

      // First check - should notify
      const result1 = await monitor.checkThreshold('lic_test_001');
      expect(result1.notified).toBe(true);

      // Second check immediately - should be in cooldown
      const result2 = await monitor.checkThreshold('lic_test_001');
      expect(result2.notified).toBe(false);
    });
  });

  describe('getNotificationState', () => {
    it('should track notification state per license', async () => {
      billingAdapter.registerOverageConfig({
        licenseKey: 'lic_test_001',
        subscriptionItemId: 'si_test',
        quotaLimit: 1000,
        overagePricePerUnit: 0.01,
        overageEnabled: true,
        metric: 'api_calls',
      });

      vi.spyOn(tracker, 'getUsage').mockResolvedValue({
        byEventType: {
          api_call: 850,
          compute_minute: 0,
          ml_inference: 0,
        },
        totalUnits: 850,
        month: '2026-03',
        licenseKey: 'lic_test_001',
        events: [],
      });

      await monitor.checkThreshold('lic_test_001');

      const state = monitor.getNotificationState('lic_test_001');
      expect(state).toBeDefined();
      expect(state?.lastWarningSentAt).toBeDefined();
    });
  });
});
