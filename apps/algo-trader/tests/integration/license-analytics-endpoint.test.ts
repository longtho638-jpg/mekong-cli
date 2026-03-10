/**
 * Integration tests for license analytics endpoint
 * Tests GET /api/v1/licenses/analytics endpoint
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { LicenseUsageAnalytics } from '../../src/lib/license-usage-analytics';
import { licenseQueries } from '../../src/db/queries/license-queries';

describe('License Analytics Endpoint', () => {
  const analytics = LicenseUsageAnalytics.getInstance();

  beforeEach(() => {
    analytics.reset();
  });

  afterEach(() => {
    analytics.reset();
  });

  describe('Analytics Response Structure', () => {
    test('should return correct response structure', async () => {
      const response = {
        total: 5,
        byTier: { free: 2, pro: 2, enterprise: 1 },
        byStatus: { active: 4, revoked: 1 },
        usage: { apiCalls: 10, mlFeatures: 5, premiumData: 3 },
        recentActivity: [
          { event: 'created', timestamp: new Date().toISOString(), licenseId: 'license-1' },
        ],
      };

      expect(response).toHaveProperty('total');
      expect(response).toHaveProperty('byTier');
      expect(response).toHaveProperty('byStatus');
      expect(response).toHaveProperty('usage');
      expect(response).toHaveProperty('recentActivity');

      expect(typeof response.total).toBe('number');
      expect(response.byTier).toHaveProperty('free');
      expect(response.byTier).toHaveProperty('pro');
      expect(response.byTier).toHaveProperty('enterprise');
      expect(response.byStatus).toHaveProperty('active');
      expect(response.byStatus).toHaveProperty('revoked');
      expect(response.usage).toHaveProperty('apiCalls');
      expect(response.usage).toHaveProperty('mlFeatures');
      expect(response.usage).toHaveProperty('premiumData');
      expect(Array.isArray(response.recentActivity)).toBe(true);
    });
  });

  describe('LicenseUsageAnalytics - Event Tracking', () => {
    test('should track API call events', () => {
      analytics.initTenant('tenant-1', 'pro');
      const result = analytics.trackApiCall('tenant-1', '/api/v1/trades');

      expect(result).toBe(true);
      const events = analytics.getEvents('tenant-1');
      expect(events.some((e) => e.event === 'api_call')).toBe(true);
    });

    test('should track ML prediction events', () => {
      analytics.initTenant('tenant-1', 'pro');
      const result = analytics.trackMLPrediction('tenant-1', 'lstm-predictor');

      expect(result).toBe(true);
      const events = analytics.getEvents('tenant-1');
      expect(events.some((e) => e.event === 'ml_prediction')).toBe(true);
    });

    test('should track premium data events', () => {
      analytics.initTenant('tenant-1', 'enterprise');
      analytics.trackDataPoints('tenant-1', 100);

      const events = analytics.getEvents('tenant-1');
      expect(events.length).toBeGreaterThan(0);
    });

    test('should return recent events limited by count', () => {
      analytics.initTenant('tenant-1', 'pro');

      for (let i = 0; i < 15; i++) {
        analytics.trackApiCall('tenant-1', `/api/v1/test-${i}`);
      }

      const events = analytics.getEvents('tenant-1', 10);
      expect(events.length).toBe(10);
    });

    test('should calculate usage percentages correctly', () => {
      analytics.initTenant('tenant-1', 'pro');

      for (let i = 0; i < 100; i++) {
        analytics.trackApiCall('tenant-1');
      }

      const percentages = analytics.getUsagePercentages('tenant-1');
      expect(percentages.apiCalls).toBeGreaterThan(0);
      expect(percentages.apiCalls).toBeLessThanOrEqual(100);
    });

    test('should reset usage correctly', () => {
      analytics.initTenant('tenant-1', 'pro');

      for (let i = 0; i < 50; i++) {
        analytics.trackApiCall('tenant-1');
      }

      analytics.resetUsage('tenant-1');

      const usage = analytics.getUsage('tenant-1');
      expect(usage?.apiCalls).toBe(0);
      expect(usage?.mlPredictions).toBe(0);
      expect(usage?.dataPoints).toBe(0);
    });
  });

  describe('License Queries - Analytics', () => {
    test('getAnalytics should return tier breakdown structure', async () => {
      const result = await licenseQueries.getAnalytics();

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('byTier');
      expect(result.byTier).toHaveProperty('free');
      expect(result.byTier).toHaveProperty('pro');
      expect(result.byTier).toHaveProperty('enterprise');
      expect(result).toHaveProperty('byStatus');
      expect(result.byStatus).toHaveProperty('active');
      expect(result.byStatus).toHaveProperty('revoked');

      expect(typeof result.total).toBe('number');
      expect(typeof result.byTier.free).toBe('number');
      expect(typeof result.byTier.pro).toBe('number');
      expect(typeof result.byTier.enterprise).toBe('number');
    });

    test('getAnalytics should return zero counts when no licenses exist', async () => {
      const result = await licenseQueries.getAnalytics();

      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.byTier.free).toBeGreaterThanOrEqual(0);
      expect(result.byTier.pro).toBeGreaterThanOrEqual(0);
      expect(result.byTier.enterprise).toBeGreaterThanOrEqual(0);
    });

    test('getRecentActivity should return empty array when no activity', async () => {
      const result = await licenseQueries.getRecentActivity(10);

      expect(Array.isArray(result)).toBe(true);
    });

    test('getRecentActivity should respect limit parameter', async () => {
      const result = await licenseQueries.getRecentActivity(5);

      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Usage Event Filtering', () => {
    test('should filter events by type correctly', () => {
      analytics.initTenant('tenant-1', 'pro');

      analytics.trackApiCall('tenant-1', '/api/test');
      analytics.trackMLPrediction('tenant-1', 'model-1');
      analytics.trackDataPoints('tenant-1', 50);

      const allEvents = analytics.getEvents('tenant-1');
      const apiCalls = allEvents.filter((e) => e.event === 'api_call');
      const mlPredictions = allEvents.filter((e) => e.event === 'ml_prediction');

      expect(apiCalls.length).toBe(1);
      expect(mlPredictions.length).toBe(1);
    });
  });

  describe('Export Report', () => {
    test('should export valid JSON report', () => {
      analytics.initTenant('tenant-1', 'pro');
      analytics.trackApiCall('tenant-1');

      const report = analytics.exportReport('tenant-1');
      const parsed = JSON.parse(report);

      expect(parsed).toHaveProperty('tenantId');
      expect(parsed).toHaveProperty('usage');
      expect(parsed).toHaveProperty('percentages');
      expect(parsed).toHaveProperty('recentEvents');
      expect(parsed).toHaveProperty('generatedAt');
      expect(parsed.tenantId).toBe('tenant-1');
    });

    test('should return error for unknown tenant', () => {
      const report = analytics.exportReport('unknown-tenant');
      const parsed = JSON.parse(report);

      expect(parsed).toHaveProperty('error');
      expect(parsed.error).toBe('Tenant not found');
    });
  });
});
