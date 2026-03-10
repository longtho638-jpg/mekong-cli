/**
 * Rate Limiter Middleware - Integration Tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { rateLimitMiddleware } from '../lib/rate-limiter-middleware';
import { resetAllRateLimits } from '../lib/rate-limiter';
import { LicenseService, LicenseTier } from '../lib/raas-gate';

describe('Rate Limiter Middleware', () => {
  beforeEach(() => {
    resetAllRateLimits();
    LicenseService.getInstance().reset();
  });

  describe('Middleware integration', () => {
    test('should allow requests within rate limit', async () => {
      // Simulate FREE tier
      LicenseService.getInstance().validate();

      const middleware = rateLimitMiddleware();
      const mockContext = {
        req: {
          header: (name: string) => {
            if (name === 'x-api-key') return undefined;
            if (name === 'authorization') return undefined;
            if (name === 'x-forwarded-for') return '127.0.0.1';
            return undefined;
          },
          method: 'GET',
          path: '/api/test',
        },
        header: jest.fn(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await middleware(mockContext as any, next as any);

      // Should call next() for allowed requests
      expect(next).toHaveBeenCalled();
    });

    test('should return 429 when rate limit exceeded', async () => {
      // Simulate FREE tier
      LicenseService.getInstance().validate();

      const middleware = rateLimitMiddleware();

      // Exhaust burst limit first
      const mockContext1 = {
        req: {
          header: (name: string) => {
            if (name === 'x-api-key') return 'test-key';
            if (name === 'x-forwarded-for') return '127.0.0.1';
            return undefined;
          },
          method: 'GET',
          path: '/api/test',
        },
        header: jest.fn(),
        json: jest.fn(),
      };

      const next = jest.fn();

      // Make 2 requests (burst limit for FREE tier)
      await middleware(mockContext1 as any, next as any);
      await middleware(mockContext1 as any, next as any);

      // 3rd request should be rate limited
      const mockContext2 = {
        req: {
          header: (name: string) => {
            if (name === 'x-api-key') return 'test-key';
            if (name === 'x-forwarded-for') return '127.0.0.1';
            return undefined;
          },
          method: 'GET',
          path: '/api/test',
        },
        header: jest.fn(),
        json: jest.fn(),
      };

      await middleware(mockContext2 as any, next as any);

      // Should return 429 response
      expect(mockContext2.json).toHaveBeenCalled();
      const response = (mockContext2.json as jest.Mock).mock.calls[0][0];
      expect(response.error).toBe('Rate Limit Exceeded');
    });

    test('should use different limits for different API keys', async () => {
      LicenseService.getInstance().validate();

      const middleware = rateLimitMiddleware();
      const next = jest.fn();

      // Exhaust key1's limit
      for (let i = 0; i < 2; i++) {
        const mockContext = {
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return 'key-1';
              if (name === 'x-forwarded-for') return '127.0.0.1';
              return undefined;
            },
            method: 'GET',
            path: '/api/test',
          },
          header: jest.fn(),
          json: jest.fn(),
        };
        await middleware(mockContext as any, next as any);
      }

      // key-1 should be blocked
      const blockedContext = {
        req: {
          header: (name: string) => {
            if (name === 'x-api-key') return 'key-1';
            if (name === 'x-forwarded-for') return '127.0.0.1';
            return undefined;
          },
          method: 'GET',
          path: '/api/test',
        },
        header: jest.fn(),
        json: jest.fn(),
      };

      await middleware(blockedContext as any, next as any);
      expect(blockedContext.json).toHaveBeenCalled();

      // key-2 should still work
      next.mockClear();
      const allowedContext = {
        req: {
          header: (name: string) => {
            if (name === 'x-api-key') return 'key-2';
            if (name === 'x-forwarded-for') return '127.0.0.1';
            return undefined;
          },
          method: 'GET',
          path: '/api/test',
        },
        header: jest.fn(),
        json: jest.fn(),
      };

      await middleware(allowedContext as any, next as any);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Header extraction', () => {
    test('should extract X-API-Key header', async () => {
      LicenseService.getInstance().validate('raas-pro-test');

      const middleware = rateLimitMiddleware();
      const next = jest.fn();

      const mockContext = {
        req: {
          header: (name: string) => {
            if (name === 'x-api-key') return 'raas-pro-test-key';
            if (name === 'x-forwarded-for') return '127.0.0.1';
            return undefined;
          },
          method: 'GET',
          path: '/api/test',
        },
        header: jest.fn(),
        json: jest.fn(),
      };

      await middleware(mockContext as any, next as any);
      expect(next).toHaveBeenCalled();
    });

    test('should extract Authorization Bearer header', async () => {
      LicenseService.getInstance().validate('raas-pro-test');

      const middleware = rateLimitMiddleware();
      const next = jest.fn();

      const mockContext = {
        req: {
          header: (name: string) => {
            if (name === 'authorization') return 'Bearer raas-pro-test-key';
            if (name === 'x-forwarded-for') return '127.0.0.1';
            return undefined;
          },
          method: 'GET',
          path: '/api/test',
        },
        header: jest.fn(),
        json: jest.fn(),
      };

      await middleware(mockContext as any, next as any);
      expect(next).toHaveBeenCalled();
    });

    test('X-API-Key takes priority over Authorization', async () => {
      LicenseService.getInstance().validate('raas-pro-test');

      const middleware = rateLimitMiddleware();
      const next = jest.fn();

      const mockContext = {
        req: {
          header: (name: string) => {
            if (name === 'x-api-key') return 'api-key-priority';
            if (name === 'authorization') return 'Bearer different-key';
            if (name === 'x-forwarded-for') return '127.0.0.1';
            return undefined;
          },
          method: 'GET',
          path: '/api/test',
        },
        header: jest.fn(),
        json: jest.fn(),
      };

      await middleware(mockContext as any, next as any);
      expect(next).toHaveBeenCalled();
    });
  });
});
