/**
 * Usage Tracking Middleware Tests
 *
 * ROIaaS Phase 4 - API middleware for auto-tracking usage
 */

import { createUsageTrackingMiddleware, usageTrackingPlugin } from './usage-tracking-middleware';
import { UsageTrackerService } from '../../metering/usage-tracker-service';
import { UsageMeteringService } from '../../lib/usage-metering';

describe('UsageTrackingMiddleware', () => {
  let usageTracker: UsageTrackerService;
  let usageMetering: UsageMeteringService;

  beforeEach(() => {
    UsageTrackerService.resetInstance();
    UsageMeteringService.resetInstance();
    usageTracker = UsageTrackerService.getInstance();
    usageMetering = UsageMeteringService.getInstance();
  });

  describe('createUsageTrackingMiddleware', () => {
    it('should create middleware with default options', () => {
      const middleware = createUsageTrackingMiddleware(usageTracker);
      expect(middleware).toBeDefined();
      expect(middleware.onRequest).toBeDefined();
      expect(middleware.onSend).toBeDefined();
    });

    it('should create middleware with custom options', () => {
      const middleware = createUsageTrackingMiddleware(usageTracker, {
        enabled: false,
        excludePaths: ['/custom'],
      });
      expect(middleware).toBeDefined();
    });

    it('should exclude health check paths', async () => {
      const middleware = createUsageTrackingMiddleware(usageTracker);

      const mockRequest = {
        url: '/health',
        method: 'GET',
        headers: {},
      } as any;

      const mockReply = {
        statusCode: 200,
      } as any;

      await middleware.onRequest(mockRequest, mockReply);
      await middleware.onSend(mockRequest, mockReply, null);

      // Should not track excluded paths
      const usage = await usageTracker.getCurrentMonthUsage('anonymous');
      expect(usage.totalUnits).toBe(0);
    });
  });

  describe('License Key Extraction', () => {
    it('should extract license key from X-API-Key header', async () => {
      const middleware = createUsageTrackingMiddleware(usageTracker);

      const mockRequest = {
        url: '/api/v1/test',
        method: 'GET',
        headers: {
          'x-api-key': 'lic_test123',
        },
      } as any;

      const mockReply = {
        statusCode: 200,
      } as any;

      await middleware.onRequest(mockRequest, mockReply);
      await middleware.onSend(mockRequest, mockReply, null);

      const usage = await usageTracker.getCurrentMonthUsage('lic_test123');
      expect(usage.totalUnits).toBeGreaterThanOrEqual(1);
    });

    it('should extract license key from Authorization Bearer header', async () => {
      const middleware = createUsageTrackingMiddleware(usageTracker);

      const mockRequest = {
        url: '/api/v1/test',
        method: 'GET',
        headers: {
          authorization: 'Bearer lic_bearer456',
        },
      } as any;

      const mockReply = {
        statusCode: 200,
      } as any;

      await middleware.onRequest(mockRequest, mockReply);
      await middleware.onSend(mockRequest, mockReply, null);

      const usage = await usageTracker.getCurrentMonthUsage('lic_bearer456');
      expect(usage.totalUnits).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Event Type Detection', () => {
    it('should track ML inference endpoints', async () => {
      const middleware = createUsageTrackingMiddleware(usageTracker);

      const mockRequest = {
        url: '/api/ml/predict',
        method: 'POST',
        headers: {
          'x-api-key': 'lic_ml_test',
        },
      } as any;

      const mockReply = {
        statusCode: 200,
      } as any;

      await middleware.onRequest(mockRequest, mockReply);
      await middleware.onSend(mockRequest, mockReply, null);

      const usage = await usageTracker.getCurrentMonthUsage('lic_ml_test');
      expect(usage.byEventType['ml_inference']).toBeGreaterThanOrEqual(1);
    });

    it('should track backtest endpoints', async () => {
      const middleware = createUsageTrackingMiddleware(usageTracker);

      const mockRequest = {
        url: '/api/backtest/run',
        method: 'POST',
        headers: {
          'x-api-key': 'lic_backtest',
        },
      } as any;

      const mockReply = {
        statusCode: 200,
      } as any;

      await middleware.onRequest(mockRequest, mockReply);
      await middleware.onSend(mockRequest, mockReply, null);

      const usage = await usageTracker.getCurrentMonthUsage('lic_backtest');
      expect(usage.byEventType['backtest_run']).toBeGreaterThanOrEqual(1);
    });

    it('should track trade execution endpoints', async () => {
      const middleware = createUsageTrackingMiddleware(usageTracker);

      const mockRequest = {
        url: '/api/trade/execute',
        method: 'POST',
        headers: {
          'x-api-key': 'lic_trade',
        },
      } as any;

      const mockReply = {
        statusCode: 200,
      } as any;

      await middleware.onRequest(mockRequest, mockReply);
      await middleware.onSend(mockRequest, mockReply, null);

      const usage = await usageTracker.getCurrentMonthUsage('lic_trade');
      expect(usage.byEventType['trade_execution']).toBeGreaterThanOrEqual(1);
    });

    it('should track strategy execution endpoints', async () => {
      const middleware = createUsageTrackingMiddleware(usageTracker);

      const mockRequest = {
        url: '/api/strategy/run',
        method: 'GET',
        headers: {
          'x-api-key': 'lic_strategy',
        },
      } as any;

      const mockReply = {
        statusCode: 200,
      } as any;

      await middleware.onRequest(mockRequest, mockReply);
      await middleware.onSend(mockRequest, mockReply, null);

      const usage = await usageTracker.getCurrentMonthUsage('lic_strategy');
      expect(usage.byEventType['strategy_execution']).toBeGreaterThanOrEqual(1);
    });

    it('should default to API_CALL for unknown endpoints', async () => {
      const middleware = createUsageTrackingMiddleware(usageTracker);

      const mockRequest = {
        url: '/api/unknown',
        method: 'GET',
        headers: {
          'x-api-key': 'lic_unknown',
        },
      } as any;

      const mockReply = {
        statusCode: 200,
      } as any;

      await middleware.onRequest(mockRequest, mockReply);
      await middleware.onSend(mockRequest, mockReply, null);

      const usage = await usageTracker.getCurrentMonthUsage('lic_unknown');
      expect(usage.byEventType['api_call']).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Duration Tracking', () => {
    it('should track request duration', async () => {
      const middleware = createUsageTrackingMiddleware(usageTracker);

      const mockRequest = {
        url: '/api/v1/test',
        method: 'GET',
        headers: {
          'x-api-key': 'lic_duration',
        },
      } as any;

      const mockReply = {
        statusCode: 200,
      } as any;

      // Simulate delay
      await middleware.onRequest(mockRequest, mockReply);
      await new Promise(resolve => setTimeout(resolve, 10));
      await middleware.onSend(mockRequest, mockReply, null);

      const usage = await usageTracker.getCurrentMonthUsage('lic_duration');
      expect(usage.events.length).toBeGreaterThan(0);
      const event = usage.events[0];
      expect(event.metadata?.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('usageTrackingPlugin', () => {
    it('should register Fastify plugin', async () => {
      const fastify = {
        addHook: jest.fn(),
        log: {
          info: jest.fn(),
        },
      } as any;

      await usageTrackingPlugin(fastify, {});

      expect(fastify.addHook).toHaveBeenCalledWith('onRequest', expect.any(Function));
      expect(fastify.addHook).toHaveBeenCalledWith('onSend', expect.any(Function));
      expect(fastify.log.info).toHaveBeenCalledWith('[UsageTracking] Plugin registered');
    });
  });
});
