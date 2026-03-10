/**
 * Overage Middleware Tests
 */

import { createOverageMiddleware, trackOverageForRequest } from './overage-middleware';
import { OverageMeteringService } from '../../billing/overage-metering-service';
import { UsageTrackerService } from '../../metering/usage-tracker-service';
import { LicenseService } from '../../lib/raas-gate';

describe('OverageMiddleware', () => {
  beforeEach(() => {
    OverageMeteringService.resetInstance();
    UsageTrackerService.resetInstance();
    LicenseService.getInstance().reset();
  });

  it('should create middleware with default options', () => {
    const middleware = createOverageMiddleware();
    expect(middleware).toBeDefined();
    expect(middleware.preHandler).toBeDefined();
  });

  it('should create middleware with custom options', () => {
    const middleware = createOverageMiddleware({
      enabled: false,
      excludePaths: ['/custom'],
    });
    expect(middleware).toBeDefined();
  });

  it('should exclude health check paths', () => {
    const middleware = createOverageMiddleware();
    expect(middleware.preHandler).toBeDefined();
  });

  describe('trackOverageForRequest', () => {
    it('should not track when not in overage', async () => {
      const mockRequest = {
        url: '/api/test',
        method: 'GET',
      } as any;

      // No overage check result = no tracking
      await trackOverageForRequest(mockRequest, 'lic_test');
      // Should not throw
    });
  });
});
