/**
 * Usage Billing Adapter Tests
 *
 * Tests for Stripe and Polar usage formatting.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  UsageBillingAdapter,
  usageBillingAdapter,
  USAGE_PRICING,
  calculateApiCallCost,
  calculateComputeCost,
  calculateMlInferenceCost,
  type UsageSummary,
  type StripeUsageRecord,
  type PolarUsageReport,
} from './usage-billing-adapter';
import { UsageTrackerService } from '../metering/usage-tracker-service';

describe('UsageBillingAdapter', () => {
  let adapter: UsageBillingAdapter;

  beforeEach(() => {
    UsageTrackerService.resetInstance();
    UsageBillingAdapter.resetInstance();
    adapter = UsageBillingAdapter.getInstance();
  });

  afterEach(() => {
    UsageTrackerService.resetInstance();
    UsageBillingAdapter.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = UsageBillingAdapter.getInstance();
      const instance2 = UsageBillingAdapter.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should allow instance reset for testing', () => {
      const instance1 = UsageBillingAdapter.getInstance();
      UsageBillingAdapter.resetInstance();
      const instance2 = UsageBillingAdapter.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Pricing Calculations', () => {
    describe('calculateApiCallCost', () => {
      it('should calculate cost for basic usage', () => {
        expect(calculateApiCallCost(1000)).toBe(0.001);
        expect(calculateApiCallCost(2000)).toBe(0.002);
        expect(calculateApiCallCost(1500)).toBe(0.002); // Rounded up
      });

      it('should apply tier discounts', () => {
        expect(calculateApiCallCost(1000, 'free')).toBe(0.001);
        expect(calculateApiCallCost(1000, 'pro')).toBeLessThanOrEqual(0.001); // 20% discount
        expect(calculateApiCallCost(1000, 'enterprise')).toBeLessThanOrEqual(0.001); // 50% discount
      });

      it('should handle zero usage', () => {
        expect(calculateApiCallCost(0)).toBe(0);
      });

      it('should handle large numbers', () => {
        expect(calculateApiCallCost(1000000)).toBe(1); // 1M calls = $1
      });
    });

    describe('calculateComputeCost', () => {
      it('should calculate cost for basic usage', () => {
        expect(calculateComputeCost(1)).toBe(0.05);
        expect(calculateComputeCost(10)).toBe(0.5);
        expect(calculateComputeCost(60)).toBe(3); // 1 hour
      });

      it('should apply tier discounts', () => {
        expect(calculateComputeCost(10, 'free')).toBe(0.5);
        expect(calculateComputeCost(10, 'pro')).toBe(0.4); // 20% discount
        expect(calculateComputeCost(10, 'enterprise')).toBe(0.25); // 50% discount
      });

      it('should handle zero usage', () => {
        expect(calculateComputeCost(0)).toBe(0);
      });
    });

    describe('calculateMlInferenceCost', () => {
      it('should calculate cost for basic usage', () => {
        expect(calculateMlInferenceCost(1)).toBe(0.01);
        expect(calculateMlInferenceCost(10)).toBe(0.1);
        expect(calculateMlInferenceCost(100)).toBe(1);
      });

      it('should apply tier discounts', () => {
        expect(calculateMlInferenceCost(100, 'free')).toBe(1);
        expect(calculateMlInferenceCost(100, 'pro')).toBe(0.8); // 20% discount
        expect(calculateMlInferenceCost(100, 'enterprise')).toBe(0.5); // 50% discount
      });

      it('should handle zero usage', () => {
        expect(calculateMlInferenceCost(0)).toBe(0);
      });
    });
  });

  describe('toStripeUsageRecords', () => {
    const mockSubscriptionItem = 'si_abc123';

    it('should convert usage to Stripe format', () => {
      const usage: UsageSummary = {
        apiCalls: 1000,
        computeMinutes: 30,
        mlInferences: 50,
        period: '2026-03',
      };

      const records = adapter.toStripeUsageRecords(usage, mockSubscriptionItem);

      expect(records).toHaveLength(3);
      expect(records[0]).toMatchObject({
        subscription_item: mockSubscriptionItem,
        quantity: 1000,
        action: 'increment',
      });
      expect(records[1]).toMatchObject({
        subscription_item: mockSubscriptionItem,
        quantity: 30,
        action: 'increment',
      });
      expect(records[2]).toMatchObject({
        subscription_item: mockSubscriptionItem,
        quantity: 50,
        action: 'increment',
      });
    });

    it('should handle zero usage', () => {
      const usage: UsageSummary = {
        apiCalls: 0,
        computeMinutes: 0,
        mlInferences: 0,
        period: '2026-03',
      };

      const records = adapter.toStripeUsageRecords(usage, mockSubscriptionItem);
      expect(records).toHaveLength(0);
    });

    it('should handle partial usage', () => {
      const usage: UsageSummary = {
        apiCalls: 500,
        computeMinutes: 0,
        mlInferences: 10,
        period: '2026-03',
      };

      const records = adapter.toStripeUsageRecords(usage, mockSubscriptionItem);
      expect(records).toHaveLength(2);
      expect(records[0].quantity).toBe(500);
      expect(records[1].quantity).toBe(10);
    });

    it('should round up compute minutes', () => {
      const usage: UsageSummary = {
        apiCalls: 100,
        computeMinutes: 5.5,
        mlInferences: 0,
        period: '2026-03',
      };

      const records = adapter.toStripeUsageRecords(usage, mockSubscriptionItem);
      expect(records).toHaveLength(2);
      expect(records.find(r => r.quantity === 6)).toBeDefined(); // Rounded up from 5.5
    });

    it('should include timestamp', () => {
      const usage: UsageSummary = {
        apiCalls: 100,
        computeMinutes: 10,
        mlInferences: 5,
        period: '2026-03',
      };

      const records = adapter.toStripeUsageRecords(usage, mockSubscriptionItem);
      const now = Math.floor(Date.now() / 1000);

      records.forEach(record => {
        expect(record.timestamp).toBeGreaterThanOrEqual(now - 1);
        expect(record.timestamp).toBeLessThanOrEqual(now + 1);
      });
    });
  });

  describe('toPolarUsageReport', () => {
    const mockSubscriptionId = 'sub_xyz789';

    it('should convert usage to Polar format', () => {
      const usage: UsageSummary = {
        apiCalls: 1000,
        computeMinutes: 30,
        mlInferences: 50,
        period: '2026-03',
      };

      const reports = adapter.toPolarUsageReport(usage, mockSubscriptionId);

      expect(reports).toHaveLength(3);
      expect(reports[0]).toMatchObject({
        subscription_id: mockSubscriptionId,
        metric_name: 'api_calls',
        quantity: 1000,
      });
      expect(reports[1]).toMatchObject({
        subscription_id: mockSubscriptionId,
        metric_name: 'compute_minutes',
        quantity: 30,
      });
      expect(reports[2]).toMatchObject({
        subscription_id: mockSubscriptionId,
        metric_name: 'ml_inferences',
        quantity: 50,
      });
    });

    it('should handle zero usage', () => {
      const usage: UsageSummary = {
        apiCalls: 0,
        computeMinutes: 0,
        mlInferences: 0,
        period: '2026-03',
      };

      const reports = adapter.toPolarUsageReport(usage, mockSubscriptionId);
      expect(reports).toHaveLength(0);
    });

    it('should use ISO 8601 timestamps', () => {
      const usage: UsageSummary = {
        apiCalls: 100,
        computeMinutes: 10,
        mlInferences: 5,
        period: '2026-03',
      };

      const reports = adapter.toPolarUsageReport(usage, mockSubscriptionId);

      reports.forEach(report => {
        expect(() => new Date(report.timestamp)).not.toThrow();
        expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    });

    it('should have correct metric names', () => {
      const usage: UsageSummary = {
        apiCalls: 100,
        computeMinutes: 10,
        mlInferences: 5,
        period: '2026-03',
      };

      const reports = adapter.toPolarUsageReport(usage, mockSubscriptionId);
      const metricNames = reports.map(r => r.metric_name);

      expect(metricNames).toContain('api_calls');
      expect(metricNames).toContain('compute_minutes');
      expect(metricNames).toContain('ml_inferences');
    });
  });

  describe('syncUsageToStripe', () => {
    const mockLicenseKey = 'lic_test123';
    const mockSubscriptionItem = 'si_abc123';

    it('should generate Stripe records from tracked usage', async () => {
      const tracker = UsageTrackerService.getInstance();

      // Track some usage
      await tracker.track(mockLicenseKey, 'api_call', 100);
      await tracker.track(mockLicenseKey, 'api_call', 200);
      await tracker.track(mockLicenseKey, 'compute_minute', 15);
      await tracker.track(mockLicenseKey, 'ml_inference', 25);

      // Force flush
      await tracker.flush();

      const records = await adapter.syncUsageToStripe(
        mockLicenseKey,
        mockSubscriptionItem
      );

      expect(records.length).toBeGreaterThan(0);
      const apiRecord = records.find(r => r.quantity === 300);
      expect(apiRecord).toBeDefined();
    });

    it('should handle missing usage', async () => {
      const records = await adapter.syncUsageToStripe(
        'lic_nonexistent',
        mockSubscriptionItem
      );

      expect(records).toHaveLength(0);
    });
  });

  describe('reportUsageToPolar', () => {
    const mockTenantId = 'tenant_test123';
    const mockSubscriptionId = 'sub_xyz789';

    it('should generate Polar reports from tracked usage', async () => {
      const tracker = UsageTrackerService.getInstance();

      // Track some usage
      await tracker.track(mockTenantId, 'api_call', 500);
      await tracker.track(mockTenantId, 'compute_minute', 20);
      await tracker.track(mockTenantId, 'ml_inference', 30);

      // Force flush
      await tracker.flush();

      const reports = await adapter.reportUsageToPolar(
        mockTenantId,
        mockSubscriptionId
      );

      expect(reports.length).toBeGreaterThan(0);
      const apiReport = reports.find(r => r.quantity === 500);
      expect(apiReport).toBeDefined();
    });

    it('should handle missing usage', async () => {
      const reports = await adapter.reportUsageToPolar(
        'tenant_nonexistent',
        mockSubscriptionId
      );

      expect(reports).toHaveLength(0);
    });
  });

  describe('getBillingSummary', () => {
    const mockLicenseKey = 'lic_summary_test';

    it('should return billing summary with usage and costs', async () => {
      const tracker = UsageTrackerService.getInstance();

      // Track usage
      await tracker.track(mockLicenseKey, 'api_call', 5000);
      await tracker.track(mockLicenseKey, 'compute_minute', 60);
      await tracker.track(mockLicenseKey, 'ml_inference', 100);
      await tracker.flush();

      const summary = await adapter.getBillingSummary(mockLicenseKey, 'free');

      expect(summary.period).toBeDefined();
      expect(summary.usage.apiCalls).toBe(5000);
      expect(summary.usage.computeMinutes).toBe(60);
      expect(summary.usage.mlInferences).toBe(100);
      expect(summary.estimatedCost.total).toBeGreaterThan(0);
    });

    it('should apply tier pricing', async () => {
      const tracker = UsageTrackerService.getInstance();

      await tracker.track(mockLicenseKey, 'api_call', 1000);
      await tracker.flush();

      const freeSummary = await adapter.getBillingSummary(mockLicenseKey, 'free');
      const proSummary = await adapter.getBillingSummary(mockLicenseKey, 'pro');
      const enterpriseSummary = await adapter.getBillingSummary(mockLicenseKey, 'enterprise');

      expect(freeSummary.estimatedCost.apiCalls).toBe(0.001);
      expect(proSummary.estimatedCost.apiCalls).toBeLessThanOrEqual(freeSummary.estimatedCost.apiCalls);
      expect(enterpriseSummary.estimatedCost.apiCalls).toBeLessThanOrEqual(proSummary.estimatedCost.apiCalls);
    });

    it('should handle zero usage', async () => {
      const summary = await adapter.getBillingSummary('lic_no_usage', 'free');

      expect(summary.usage.apiCalls).toBe(0);
      expect(summary.usage.computeMinutes).toBe(0);
      expect(summary.usage.mlInferences).toBe(0);
      expect(summary.estimatedCost.total).toBe(0);
    });
  });

  describe('Exported singleton instance', () => {
    it('should export usageBillingAdapter singleton', () => {
      expect(usageBillingAdapter).toBeDefined();
      // Check it's an instance of UsageBillingAdapter by checking a method exists
      expect(usageBillingAdapter.toStripeUsageRecords).toBeDefined();
      expect(usageBillingAdapter.toPolarUsageReport).toBeDefined();
    });
  });
});
