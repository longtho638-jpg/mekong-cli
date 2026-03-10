/**
 * Usage Billing Adapter Tests
 *
 * Tests for usage billing adapter with overage configuration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UsageBillingAdapter, OverageBillingConfig, SubscriptionItemMapping } from '../../src/billing/usage-billing-adapter';
import { UsageTrackerService } from '../../src/metering/usage-tracker-service';

describe('UsageBillingAdapter - Overage Billing', () => {
  let adapter: UsageBillingAdapter;
  let tracker: UsageTrackerService;

  beforeEach(() => {
    UsageBillingAdapter.resetInstance();
    UsageTrackerService.resetInstance();
    adapter = UsageBillingAdapter.getInstance();
    tracker = UsageTrackerService.getInstance();
  });

  afterEach(() => {
    UsageBillingAdapter.resetInstance();
    UsageTrackerService.resetInstance();
  });

  describe('registerSubscriptionItem', () => {
    it('should register subscription item mapping', () => {
      const mapping: SubscriptionItemMapping = {
        licenseKey: 'lic_test_001',
        subscriptionId: 'sub_test',
        subscriptionItemId: 'si_test',
        meterId: 'meter_api_calls',
        metric: 'api_calls',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      adapter.registerSubscriptionItem(mapping);

      const retrieved = adapter.getSubscriptionItem('lic_test_001');
      expect(retrieved).toEqual(mapping);
    });

    it('should return null for unregistered license', () => {
      const retrieved = adapter.getSubscriptionItem('lic_unknown');
      expect(retrieved).toBe(null);
    });
  });

  describe('registerOverageConfig', () => {
    it('should register overage configuration', () => {
      const config: OverageBillingConfig = {
        licenseKey: 'lic_test_001',
        subscriptionItemId: 'si_test',
        quotaLimit: 1000,
        overagePricePerUnit: 0.01,
        overageEnabled: true,
        metric: 'api_calls',
      };

      adapter.registerOverageConfig(config);

      const retrieved = adapter.getOverageConfig('lic_test_001');
      expect(retrieved).toEqual(config);
    });

    it('should return null for unregistered license', () => {
      const retrieved = adapter.getOverageConfig('lic_unknown');
      expect(retrieved).toBe(null);
    });
  });

  describe('getOverageLicenses', () => {
    it('should return only licenses with overage enabled', () => {
      adapter.registerOverageConfig({
        licenseKey: 'lic_enabled_001',
        subscriptionItemId: 'si_001',
        quotaLimit: 1000,
        overagePricePerUnit: 0.01,
        overageEnabled: true,
        metric: 'api_calls',
      });

      adapter.registerOverageConfig({
        licenseKey: 'lic_enabled_002',
        subscriptionItemId: 'si_002',
        quotaLimit: 500,
        overagePricePerUnit: 0.02,
        overageEnabled: true,
        metric: 'compute_minutes',
      });

      adapter.registerOverageConfig({
        licenseKey: 'lic_disabled_001',
        subscriptionItemId: 'si_003',
        quotaLimit: 1000,
        overagePricePerUnit: 0.01,
        overageEnabled: false,
        metric: 'api_calls',
      });

      const licenses = adapter.getOverageLicenses();

      expect(licenses).toHaveLength(2);
      expect(licenses).toContain('lic_enabled_001');
      expect(licenses).toContain('lic_enabled_002');
      expect(licenses).not.toContain('lic_disabled_001');
    });

    it('should return empty array when no overage enabled', () => {
      const licenses = adapter.getOverageLicenses();
      expect(licenses).toHaveLength(0);
    });
  });

  describe('calculateOverageUnits', () => {
    it('should calculate overage units when usage exceeds quota', async () => {
      adapter.registerOverageConfig({
        licenseKey: 'lic_test_001',
        subscriptionItemId: 'si_test',
        quotaLimit: 1000,
        overagePricePerUnit: 0.01,
        overageEnabled: true,
        metric: 'api_calls',
      });

      // Mock usage at 1500 (500 over quota)
      vi.spyOn(tracker, 'getUsage').mockResolvedValue({
        byEventType: {
          api_call: 1500,
          compute_minute: 0,
          ml_inference: 0,
        },
        totalUnits: 1500,
        month: '2026-03',
        licenseKey: 'lic_test_001',
        events: [],
      });

      const overageUnits = await adapter.calculateOverageUnits('lic_test_001');

      expect(overageUnits).toBe(500);
    });

    it('should return 0 when usage is below quota', async () => {
      adapter.registerOverageConfig({
        licenseKey: 'lic_test_001',
        subscriptionItemId: 'si_test',
        quotaLimit: 1000,
        overagePricePerUnit: 0.01,
        overageEnabled: true,
        metric: 'api_calls',
      });

      // Mock usage at 800 (below quota)
      vi.spyOn(tracker, 'getUsage').mockResolvedValue({
        byEventType: {
          api_call: 800,
          compute_minute: 0,
          ml_inference: 0,
        },
        totalUnits: 800,
        month: '2026-03',
        licenseKey: 'lic_test_001',
        events: [],
      });

      const overageUnits = await adapter.calculateOverageUnits('lic_test_001');

      expect(overageUnits).toBe(0);
    });

    it('should return 0 when overage is disabled', async () => {
      adapter.registerOverageConfig({
        licenseKey: 'lic_test_001',
        subscriptionItemId: 'si_test',
        quotaLimit: 1000,
        overagePricePerUnit: 0.01,
        overageEnabled: false, // Disabled
        metric: 'api_calls',
      });

      const overageUnits = await adapter.calculateOverageUnits('lic_test_001');
      expect(overageUnits).toBe(0);
    });
  });

  describe('generateOverageRecords', () => {
    it('should generate overage record when usage exceeds quota', async () => {
      adapter.registerOverageConfig({
        licenseKey: 'lic_test_001',
        subscriptionItemId: 'si_test',
        quotaLimit: 1000,
        overagePricePerUnit: 0.01,
        overageEnabled: true,
        metric: 'api_calls',
      });

      // Mock usage at 1500 (500 over quota)
      vi.spyOn(tracker, 'getUsage').mockResolvedValue({
        byEventType: {
          api_call: 1500,
          compute_minute: 0,
          ml_inference: 0,
        },
        totalUnits: 1500,
        month: '2026-03',
        licenseKey: 'lic_test_001',
        events: [],
      });

      const records = await adapter.generateOverageRecords('lic_test_001');

      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({
        subscription_item: 'si_test',
        quantity: 500,
        isOverage: true,
      });
    });

    it('should return empty array when no overage', async () => {
      adapter.registerOverageConfig({
        licenseKey: 'lic_test_001',
        subscriptionItemId: 'si_test',
        quotaLimit: 1000,
        overagePricePerUnit: 0.01,
        overageEnabled: true,
        metric: 'api_calls',
      });

      // Mock usage at 800 (below quota)
      vi.spyOn(tracker, 'getUsage').mockResolvedValue({
        byEventType: {
          api_call: 800,
          compute_minute: 0,
          ml_inference: 0,
        },
        totalUnits: 800,
        month: '2026-03',
        licenseKey: 'lic_test_001',
        events: [],
      });

      const records = await adapter.generateOverageRecords('lic_test_001');
      expect(records).toHaveLength(0);
    });
  });
});
