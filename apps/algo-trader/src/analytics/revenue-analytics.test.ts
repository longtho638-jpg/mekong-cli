/**
 * RevenueAnalyticsService Tests
 *
 * Tests for revenue analytics and metrics:
 * - MRR (Monthly Recurring Revenue) calculation
 * - DAL (Daily Active Licenses) tracking
 * - Churn rate analysis
 * - ARPA (Average Revenue Per Account)
 * - Revenue by tier breakdown
 * - Utilization trends
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  RevenueAnalyticsService,
  revenueAnalytics,
} from './revenue-analytics';
import { PolarAuditLogger } from '../billing/polar-audit-logger';

describe('RevenueAnalyticsService', () => {
  let service: RevenueAnalyticsService;
  let auditLogger: PolarAuditLogger;

  beforeEach(() => {
    RevenueAnalyticsService.resetInstance();
    PolarAuditLogger.getInstance().reset();
    service = RevenueAnalyticsService.getInstance();
    auditLogger = PolarAuditLogger.getInstance();
  });

  describe('recordSubscription', () => {
    test('should record a new subscription activation', async () => {
      await service.recordSubscription(
        'tenant_123',
        'sub_456',
        'pro',
        '2026-03-01T10:00:00Z',
      );

      const events = service.getRevenueEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('subscription.active');
      expect(events[0].tenantId).toBe('tenant_123');
      expect(events[0].tier).toBe('pro');
      expect(events[0].amount).toBe(49);
    });

    test('should record free tier subscription', async () => {
      await service.recordSubscription(
        'tenant_free',
        'sub_free',
        'free',
        '2026-03-01T10:00:00Z',
      );

      const events = service.getRevenueEvents();
      expect(events[0].tier).toBe('free');
      expect(events[0].amount).toBe(0);
    });

    test('should record enterprise tier subscription', async () => {
      await service.recordSubscription(
        'tenant_ent',
        'sub_ent',
        'enterprise',
        '2026-03-01T10:00:00Z',
      );

      const events = service.getRevenueEvents();
      expect(events[0].tier).toBe('enterprise');
      expect(events[0].amount).toBe(199);
    });
  });

  describe('recordCancellation', () => {
    test('should record subscription cancellation', async () => {
      await service.recordSubscription(
        'tenant_123',
        'sub_456',
        'pro',
        '2026-02-01T10:00:00Z',
      );

      await service.recordCancellation('sub_456', '2026-03-15T10:00:00Z');

      const events = service.getRevenueEvents();
      expect(events).toHaveLength(2);
      expect(events[1].eventType).toBe('subscription.canceled');
      expect(events[1].amount).toBe(0);
    });

    test('should handle cancellation for non-existent subscription', async () => {
      await service.recordCancellation('sub_nonexistent', '2026-03-15T10:00:00Z');

      const events = service.getRevenueEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('getMRR', () => {
    test('should calculate MRR for single subscription', async () => {
      await service.recordSubscription(
        'tenant_1',
        'sub_1',
        'pro',
        '2026-03-01T10:00:00Z',
      );

      const result = await service.getMRR('2026-03');

      expect(result.month).toBe('2026-03');
      expect(result.totalMRR).toBe(49);
      expect(result.byTier.pro).toBe(49);
      expect(result.activeSubscriptions).toBe(1);
    });

    test('should calculate MRR with multiple tiers', async () => {
      await service.recordSubscription('tenant_1', 'sub_1', 'free', '2026-03-01T10:00:00Z');
      await service.recordSubscription('tenant_2', 'sub_2', 'pro', '2026-03-01T10:00:00Z');
      await service.recordSubscription('tenant_3', 'sub_3', 'enterprise', '2026-03-01T10:00:00Z');

      const result = await service.getMRR('2026-03');

      expect(result.totalMRR).toBe(248); // 0 + 49 + 199
      expect(result.byTier.free).toBe(0);
      expect(result.byTier.pro).toBe(49);
      expect(result.byTier.enterprise).toBe(199);
      expect(result.activeSubscriptions).toBe(3);
    });

    test('should exclude cancelled subscriptions from MRR', async () => {
      await service.recordSubscription('tenant_1', 'sub_1', 'pro', '2026-02-01T10:00:00Z');
      await service.recordSubscription('tenant_2', 'sub_2', 'pro', '2026-02-01T10:00:00Z');
      await service.recordCancellation('sub_1', '2026-03-15T10:00:00Z');

      const result = await service.getMRR('2026-03');

      expect(result.totalMRR).toBe(49);
      expect(result.activeSubscriptions).toBe(1);
    });

    test('should calculate growth rate from previous month', async () => {
      // Previous month: 1 pro subscription
      await service.recordSubscription('tenant_1', 'sub_1', 'pro', '2026-02-01T10:00:00Z');

      // Current month: add 1 enterprise subscription
      await service.recordSubscription('tenant_2', 'sub_2', 'enterprise', '2026-03-01T10:00:00Z');

      const result = await service.getMRR('2026-03');

      // Previous MRR: 49, Current MRR: 248, Growth: (248-49)/49 * 100 = 406.12%
      expect(result.growthRate).toBeDefined();
      expect(result.growthRate!).toBeGreaterThan(400);
    });

    test('should return zero MRR for month with no subscriptions', async () => {
      const result = await service.getMRR('2026-03');

      expect(result.totalMRR).toBe(0);
      expect(result.activeSubscriptions).toBe(0);
    });
  });

  describe('getDAL', () => {
    test('should calculate daily active licenses', async () => {
      await service.recordSubscription('tenant_1', 'sub_1', 'pro', '2026-03-01T10:00:00Z');
      await service.recordSubscription('tenant_2', 'sub_2', 'free', '2026-03-01T10:00:00Z');

      const result = await service.getDAL('2026-03-15');

      expect(result.date).toBe('2026-03-15');
      expect(result.totalLicenses).toBe(2);
      expect(result.byTier.pro).toBe(1);
      expect(result.byTier.free).toBe(1);
    });

    test('should track licenses with activity', async () => {
      await service.recordSubscription('tenant_1', 'sub_1', 'pro', '2026-03-01T10:00:00Z');

      await service.updateUsage('tenant_1', {
        apiCalls: 100,
        computeMinutes: 10,
        mlInferences: 5,
        period: '2026-03',
      });

      const result = await service.getDAL('2026-03-15');

      expect(result.licensesWithActivity).toBe(1);
    });

    test('should exclude cancelled subscriptions', async () => {
      await service.recordSubscription('tenant_1', 'sub_1', 'pro', '2026-02-01T10:00:00Z');
      await service.recordSubscription('tenant_2', 'sub_2', 'pro', '2026-02-01T10:00:00Z');
      await service.recordCancellation('sub_1', '2026-03-01T10:00:00Z');

      const result = await service.getDAL('2026-03-15');

      expect(result.totalLicenses).toBe(1);
    });
  });

  describe('getChurnRate', () => {
    test('should calculate churn rate', async () => {
      // 4 subscriptions from previous month
      await service.recordSubscription('tenant_1', 'sub_1', 'pro', '2026-02-01T10:00:00Z');
      await service.recordSubscription('tenant_2', 'sub_2', 'pro', '2026-02-01T10:00:00Z');
      await service.recordSubscription('tenant_3', 'sub_3', 'pro', '2026-02-01T10:00:00Z');
      await service.recordSubscription('tenant_4', 'sub_4', 'pro', '2026-02-01T10:00:00Z');

      // 1 cancellation in March
      await service.recordCancellation('sub_1', '2026-03-15T10:00:00Z');

      const result = await service.getChurnRate('2026-03');

      expect(result.month).toBe('2026-03');
      expect(result.churnRate).toBe(25); // 1/4 * 100 = 25%
      expect(result.cancellations).toBe(1);
      expect(result.startSubscriptions).toBe(4);
    });

    test('should return zero churn when no cancellations', async () => {
      await service.recordSubscription('tenant_1', 'sub_1', 'pro', '2026-02-01T10:00:00Z');
      await service.recordSubscription('tenant_2', 'sub_2', 'pro', '2026-02-01T10:00:00Z');

      const result = await service.getChurnRate('2026-03');

      expect(result.churnRate).toBe(0);
      expect(result.cancellations).toBe(0);
    });

    test('should return zero churn when no previous subscriptions', async () => {
      const result = await service.getChurnRate('2026-03');

      expect(result.churnRate).toBe(0);
      expect(result.startSubscriptions).toBe(0);
    });

    test('should track churn by tier', async () => {
      await service.recordSubscription('tenant_1', 'sub_1', 'pro', '2026-02-01T10:00:00Z');
      await service.recordSubscription('tenant_2', 'sub_2', 'enterprise', '2026-02-01T10:00:00Z');
      await service.recordCancellation('sub_1', '2026-03-15T10:00:00Z');

      const result = await service.getChurnRate('2026-03');

      expect(result.byTier.pro).toBe(1);
      expect(result.byTier.enterprise).toBe(0);
    });
  });

  describe('getARPA', () => {
    test('should calculate ARPA', async () => {
      await service.recordSubscription('tenant_1', 'sub_1', 'pro', '2026-03-01T10:00:00Z');
      await service.recordSubscription('tenant_2', 'sub_2', 'pro', '2026-03-01T10:00:00Z');

      const result = await service.getARPA('2026-03');

      expect(result.month).toBe('2026-03');
      expect(result.arpa).toBe(49); // Total 98 / 2 accounts
      expect(result.totalRevenue).toBe(98);
      expect(result.totalAccounts).toBe(2);
    });

    test('should calculate ARPA with mixed tiers', async () => {
      await service.recordSubscription('tenant_1', 'sub_1', 'free', '2026-03-01T10:00:00Z');
      await service.recordSubscription('tenant_2', 'sub_2', 'enterprise', '2026-03-01T10:00:00Z');

      const result = await service.getARPA('2026-03');

      expect(result.arpa).toBe(99.5); // Total 199 / 2 accounts
    });

    test('should return zero ARPA when no accounts', async () => {
      const result = await service.getARPA('2026-03');

      expect(result.arpa).toBe(0);
      expect(result.totalAccounts).toBe(0);
    });
  });

  describe('getRevenueByTier', () => {
    test('should return revenue breakdown by tier', async () => {
      await service.recordSubscription('tenant_1', 'sub_1', 'free', '2026-03-01T10:00:00Z');
      await service.recordSubscription('tenant_2', 'sub_2', 'pro', '2026-03-01T10:00:00Z');
      await service.recordSubscription('tenant_3', 'sub_3', 'enterprise', '2026-03-01T10:00:00Z');

      const result = await service.getRevenueByTier('2026-03');

      expect(result.month).toBe('2026-03');
      expect(result.totalRevenue).toBe(248);
      expect(result.tiers).toHaveLength(3);

      const freeTier = result.tiers.find(t => t.tier === 'free');
      expect(freeTier?.revenue).toBe(0);
      expect(freeTier?.percentage).toBe(0);
      expect(freeTier?.subscriptionCount).toBe(1);

      const proTier = result.tiers.find(t => t.tier === 'pro');
      expect(proTier?.revenue).toBe(49);
      expect(proTier?.subscriptionCount).toBe(1);

      const enterpriseTier = result.tiers.find(t => t.tier === 'enterprise');
      expect(enterpriseTier?.revenue).toBe(199);
      expect(enterpriseTier?.subscriptionCount).toBe(1);
    });

    test('should calculate correct percentages', async () => {
      await service.recordSubscription('tenant_1', 'sub_1', 'pro', '2026-03-01T10:00:00Z');
      await service.recordSubscription('tenant_2', 'sub_2', 'pro', '2026-03-01T10:00:00Z');

      const result = await service.getRevenueByTier('2026-03');

      const proTier = result.tiers.find(t => t.tier === 'pro');
      expect(proTier?.percentage).toBe(100);
    });
  });

  describe('getUtilizationTrends', () => {
    test('should calculate average utilization', async () => {
      await service.recordSubscription('tenant_1', 'sub_1', 'pro', '2026-03-01T10:00:00Z');
      await service.recordSubscription('tenant_2', 'sub_2', 'pro', '2026-03-01T10:00:00Z');

      await service.updateUsage('tenant_1', {
        apiCalls: 25000, // 50% of 50000
        computeMinutes: 10,
        mlInferences: 5,
        period: '2026-03',
      });

      await service.updateUsage('tenant_2', {
        apiCalls: 12500, // 25% of 50000
        computeMinutes: 5,
        mlInferences: 2,
        period: '2026-03',
      });

      const result = await service.getUtilizationTrends('2026-03');

      expect(result.month).toBe('2026-03');
      expect(result.averageUtilization).toBeGreaterThan(0);
      expect(result.byTier.pro.tenantCount).toBe(2);
    });

    test('should identify top consumers', async () => {
      for (let i = 1; i <= 5; i++) {
        await service.recordSubscription(
          `tenant_${i}`,
          `sub_${i}`,
          'pro',
          '2026-03-01T10:00:00Z',
        );
        await service.updateUsage(`tenant_${i}`, {
          apiCalls: i * 10000,
          computeMinutes: i,
          mlInferences: i,
          period: '2026-03',
        });
      }

      const result = await service.getUtilizationTrends('2026-03');

      expect(result.topConsumers).toHaveLength(5);
      expect(result.topConsumers[0].licenseKey).toBe('tenant_5');
    });

    test('should break down utilization by tier', async () => {
      await service.recordSubscription('tenant_1', 'sub_1', 'free', '2026-03-01T10:00:00Z');
      await service.recordSubscription('tenant_2', 'sub_2', 'pro', '2026-03-01T10:00:00Z');
      await service.recordSubscription('tenant_3', 'sub_3', 'enterprise', '2026-03-01T10:00:00Z');

      await service.updateUsage('tenant_1', { apiCalls: 500, computeMinutes: 0, mlInferences: 0, period: '2026-03' });
      await service.updateUsage('tenant_2', { apiCalls: 25000, computeMinutes: 10, mlInferences: 5, period: '2026-03' });
      await service.updateUsage('tenant_3', { apiCalls: 500000, computeMinutes: 100, mlInferences: 50, period: '2026-03' });

      const result = await service.getUtilizationTrends('2026-03');

      expect(result.byTier.free.tenantCount).toBe(1);
      expect(result.byTier.pro.tenantCount).toBe(1);
      expect(result.byTier.enterprise.tenantCount).toBe(1);
    });
  });

  describe('updateUsage', () => {
    test('should update usage data for tenant', async () => {
      await service.updateUsage('tenant_1', {
        apiCalls: 1000,
        computeMinutes: 100,
        mlInferences: 50,
        period: '2026-03',
      });

      const result = await service.getUtilizationTrends('2026-03');
      // Usage should be tracked
      expect(result.month).toBe('2026-03');
    });

    test('should record usage billing event', async () => {
      await service.updateUsage('tenant_1', {
        apiCalls: 1000,
        computeMinutes: 100,
        mlInferences: 50,
        period: '2026-03',
      });

      const events = service.getRevenueEvents();
      const usageEvents = events.filter(e => e.eventType === 'usage.billed');
      expect(usageEvents.length).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    test('should clear all cached data', async () => {
      await service.recordSubscription('tenant_1', 'sub_1', 'pro', '2026-03-01T10:00:00Z');
      await service.updateUsage('tenant_1', { apiCalls: 1000, computeMinutes: 10, mlInferences: 5, period: '2026-03' });

      service.reset();

      const mrr = await service.getMRR('2026-03');
      expect(mrr.totalMRR).toBe(0);
      expect(mrr.activeSubscriptions).toBe(0);

      const events = service.getRevenueEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance from getInstance', () => {
      const instance1 = RevenueAnalyticsService.getInstance();
      const instance2 = RevenueAnalyticsService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should reset instance correctly', () => {
      const instance1 = RevenueAnalyticsService.getInstance();
      RevenueAnalyticsService.resetInstance();
      const instance2 = RevenueAnalyticsService.getInstance();
      expect(instance1).not.toBe(instance2);
    });

    test('should export singleton instance', () => {
      // Note: revenueAnalytics is created at module load time
      // After resetInstance, getInstance returns a new instance
      // So we need to check that revenueAnalytics is an instance of the class
      expect(revenueAnalytics).toBeDefined();
      expect(revenueAnalytics instanceof RevenueAnalyticsService).toBe(true);
    });
  });
});
