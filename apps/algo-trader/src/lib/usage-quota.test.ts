/**
 * Usage Quota Tests
 */

import {
  UsageQuotaService,
  getCurrentPeriod,
  QUOTA_LIMITS,
  ALERT_THRESHOLDS,
  requireQuotaMiddleware,
} from './usage-quota';

describe('Usage Quota', () => {
  describe('getCurrentPeriod', () => {
    it('returns current month period', () => {
      const period = getCurrentPeriod();
      const now = new Date();

      expect(period.start.getFullYear()).toBe(now.getFullYear());
      expect(period.start.getMonth()).toBe(now.getMonth());
      expect(period.start.getDate()).toBe(1);

      expect(period.end.getFullYear()).toBe(now.getFullYear());
      expect(period.end.getMonth()).toBe(now.getMonth());
      expect(period.end.getDate()).toBe(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
    });
  });

  describe('QUOTA_LIMITS', () => {
    it('has correct limits by tier', () => {
      expect(QUOTA_LIMITS.free).toBe(1000);
      expect(QUOTA_LIMITS.pro).toBe(10000);
      expect(QUOTA_LIMITS.enterprise).toBe(100000);
    });
  });

  describe('ALERT_THRESHOLDS', () => {
    it('has correct thresholds', () => {
      expect(ALERT_THRESHOLDS).toEqual([80, 90, 100]);
    });
  });

  describe('UsageQuotaService', () => {
    let service: UsageQuotaService;

    beforeEach(() => {
      // Reset singleton
      (UsageQuotaService as any).instance = null;
      service = UsageQuotaService.getInstance();
    });

    afterEach(async () => {
      await service.close();
    });

    describe('increment', () => {
      it('increments counter for license key', async () => {
        const key = `test-${Date.now()}`;

        const count1 = await service.increment(key, 'free');
        const count2 = await service.increment(key, 'free');

        expect(count1).toBe(1);
        expect(count2).toBe(2);
      });

      it('starts from 1 for new key', async () => {
        const key = `test-new-${Date.now()}`;
        const count = await service.increment(key, 'pro');
        expect(count).toBe(1);
      });
    });

    describe('getUsage', () => {
      it('returns usage status', async () => {
        const key = `test-usage-${Date.now()}`;

        await service.increment(key, 'free');
        await service.increment(key, 'free');
        await service.increment(key, 'free');

        const usage = await service.getUsage(key, 'free');

        expect(usage.licenseKey).toBe(key);
        expect(usage.used).toBe(3);
        expect(usage.limit).toBe(1000);
        expect(usage.remaining).toBe(997);
        expect(usage.percentUsed).toBeLessThan(1);
        expect(usage.tier).toBe('free');
        expect(usage.isExceeded).toBe(false);
      });

      it('calculates percent correctly', async () => {
        const key = `test-percent-${Date.now()}`;

        // Use memory storage directly for predictable testing
        const period = getCurrentPeriod();
        const quotaKey = `raas:quota:${key}:${period.start.toISOString().slice(0, 7)}`;
        (service as any).memoryStorage.set(quotaKey, { count: 500, thresholds: [] });

        const usage = await service.getUsage(key, 'free');

        expect(usage.percentUsed).toBe(50);
      });

      it('returns correct tier limits', async () => {
        const key = `test-tier-${Date.now()}`;

        const freeUsage = await service.getUsage(key, 'free');
        const proUsage = await service.getUsage(key, 'pro');
        const enterpriseUsage = await service.getUsage(key, 'enterprise');

        expect(freeUsage.limit).toBe(1000);
        expect(proUsage.limit).toBe(10000);
        expect(enterpriseUsage.limit).toBe(100000);
      });
    });

    describe('reset', () => {
      it('resets usage counter', async () => {
        const key = `test-reset-${Date.now()}`;

        await service.increment(key, 'free');
        await service.increment(key, 'free');

        let usage = await service.getUsage(key, 'free');
        expect(usage.used).toBe(2);

        await service.reset(key);

        usage = await service.getUsage(key, 'free');
        expect(usage.used).toBe(0);
      });
    });

    describe('isExceeded', () => {
      it('returns false when under limit', async () => {
        const key = `test-under-${Date.now()}`;
        await service.increment(key, 'free');

        const exceeded = await service.isExceeded(key, 'free');
        expect(exceeded).toBe(false);
      });

      it('returns true when over limit', async () => {
        const key = `test-over-${Date.now()}`;
        const limit = QUOTA_LIMITS.free;

        // Simulate exceeding limit
        const period = getCurrentPeriod();
        const quotaKey = `raas:quota:${key}:${period.start.toISOString().slice(0, 7)}`;
        (service as any).memoryStorage.set(quotaKey, { count: limit + 1, thresholds: [] });

        const exceeded = await service.isExceeded(key, 'free');
        expect(exceeded).toBe(true);
      });
    });

    describe('getNewAlerts', () => {
      it('returns empty array for new key', async () => {
        const key = `test-alerts-${Date.now()}`;
        const alerts = await service.getNewAlerts(key, 'free');
        expect(alerts).toEqual([]);
      });
    });
  });

  describe('requireQuotaMiddleware', () => {
    it('returns middleware function', () => {
      const middleware = requireQuotaMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('rejects requests without license key', async () => {
      const middleware = requireQuotaMiddleware();

      const mockReq = { headers: {} };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockNext = jest.fn();

      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'License key required' });
    });

    it('allows requests with license key under quota', async () => {
      const middleware = requireQuotaMiddleware();

      const mockReq = {
        headers: { 'x-license-key': 'test-key', 'x-license-tier': 'free' },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        setHeader: jest.fn(),
      };
      const mockNext = jest.fn();

      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', expect.anything());
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.anything());
    });

    it('returns 429 when quota exceeded', async () => {
      const middleware = requireQuotaMiddleware();
      const key = `test-exceeded-${Date.now()}`;
      const limit = QUOTA_LIMITS.free;

      // Simulate exceeded quota
      const service = UsageQuotaService.getInstance();
      const period = getCurrentPeriod();
      const quotaKey = `raas:quota:${key}:${period.start.toISOString().slice(0, 7)}`;
      (service as any).memoryStorage.set(quotaKey, { count: limit + 1, thresholds: [] });

      const mockReq = {
        headers: { 'x-license-key': key, 'x-license-tier': 'free' },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        setHeader: jest.fn(),
      };
      const mockNext = jest.fn();

      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Quota exceeded' })
      );
    });
  });
});
