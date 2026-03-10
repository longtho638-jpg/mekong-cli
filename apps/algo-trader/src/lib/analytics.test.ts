/**
 * Analytics Tests
 */

import { recordUsage, recordRateLimitHit, getAnalyticsSummary, getRateLimitAnalytics, metricsStore } from '../lib/analytics';
import { LicenseService } from '../lib/raas-gate';

describe('Analytics', () => {
  beforeEach(() => {
    metricsStore.reset();
    LicenseService.getInstance().reset();
  });

  describe('recordUsage', () => {
    it('records usage for tenant', () => {
      recordUsage('tenant-1', '/api/test');
      recordUsage('tenant-1', '/api/test');
      recordUsage('tenant-1', '/api/other');

      const usage = metricsStore.getUsage('tenant-1');
      expect(usage.count).toBe(3);
      expect(usage.endpoints['/api/test']).toBe(2);
      expect(usage.endpoints['/api/other']).toBe(1);
    });
  });

  describe('recordRateLimitHit', () => {
    it('records rate limit hit', () => {
      recordRateLimitHit('tenant-1');
      recordRateLimitHit('tenant-1');

      const hits = metricsStore.getRateLimitHits('tenant-1');
      expect(hits).toBe(2);
    });
  });

  describe('getAnalyticsSummary', () => {
    it('returns aggregated summary', async () => {
      recordUsage('tenant-1', '/api/test');
      recordUsage('tenant-2', '/api/other');
      recordUsage('tenant-2', '/api/test');

      const summary = await getAnalyticsSummary();

      expect(summary.totalTenants).toBeGreaterThan(0);
      expect(summary.topEndpoints).toBeDefined();
    });
  });

  describe('getRateLimitAnalytics', () => {
    it('returns rate limit stats', async () => {
      recordRateLimitHit('tenant-1');
      recordRateLimitHit('tenant-2');
      recordRateLimitHit('tenant-2');

      const limits = await getRateLimitAnalytics();

      expect(limits.totalHits).toBe(3);
      expect(limits.byTenant['tenant-1']).toBe(1);
      expect(limits.byTenant['tenant-2']).toBe(2);
    });
  });
});
