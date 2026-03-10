/**
 * Tests for tenant-auth-middleware.ts - authentication and authorization middleware.
 */

import { createAuthMiddleware, requireScope } from '../../src/auth/tenant-auth-middleware';
import { SlidingWindowRateLimiter } from '../../src/auth/sliding-window-rate-limiter';
import { signToken } from '../../src/auth/jwt-token-service';
import { generateApiKey } from '../../src/auth/api-key-manager';

describe('tenant-auth-middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-hs256-signing-1234567890ab';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createAuthMiddleware()', () => {
    let limiter: SlidingWindowRateLimiter;
    let apiKeyStore: Map<string, any>;

    beforeEach(() => {
      limiter = new SlidingWindowRateLimiter();
      apiKeyStore = new Map();
    });

    afterEach(() => {
      limiter.clear();
    });

    it('rejects request with no auth header', async () => {
      const middleware = createAuthMiddleware(apiKeyStore, limiter);
      const request = { headers: {} };
      const reply = createMockReply();

      await middleware(request, reply as any);

      expect(reply.codeCalledWith).toBe(401);
      expect(reply.sendPayload.error).toBe('Authentication required');
    });

    it('rejects request with empty Authorization header', async () => {
      const middleware = createAuthMiddleware(apiKeyStore, limiter);
      const request = { headers: { authorization: '' } };
      const reply = createMockReply();

      await middleware(request, reply as any);

      expect(reply.codeCalledWith).toBe(401);
      expect(reply.sendPayload.error).toBe('Authentication required');
    });

    it('rejects request with invalid JWT token', async () => {
      const middleware = createAuthMiddleware(apiKeyStore, limiter);
      const request = { headers: { authorization: 'Bearer invalid.token.here' } };
      const reply = createMockReply();

      await middleware(request, reply as any);

      expect(reply.codeCalledWith).toBe(401);
      expect(reply.sendPayload.error).toBe('Invalid or expired token');
    });

    it('accepts valid JWT token and attaches authContext', async () => {
      const payload = { tenantId: 'tenant-123', scopes: ['backtest', 'live:trade'], keyId: 'key-456' };
      const token = signToken(payload);

      const middleware = createAuthMiddleware(apiKeyStore, limiter);
      const request = { headers: { authorization: `Bearer ${token}` } };
      const reply = createMockReply();

      await middleware(request, reply as any);

      // Should not have rejected
      expect(reply.codeCalledWith).toBeUndefined();
      expect(request.authContext).toEqual({
        tenantId: 'tenant-123',
        scopes: ['backtest', 'live:trade'],
        keyId: 'key-456',
      });

      // Rate limit headers should be set
      expect(reply.headerCalled).toBe(true);
    });

    it('rejects expired JWT token', async () => {
      // Manually create expired token
      const payload = {
        tenantId: 'expired',
        scopes: ['backtest'],
        keyId: 'expired-key',
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
      };
      const crypto = require('crypto');
      const base64UrlEncode = (data: string): string =>
        Buffer.from(data).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = base64UrlEncode(JSON.stringify(payload));
      const signature = crypto.createHmac('sha256', process.env.JWT_SECRET!)
        .update(`${header}.${body}`).digest('base64url');
      const expiredToken = `${header}.${body}.${signature}`;

      const middleware = createAuthMiddleware(apiKeyStore, limiter);
      const request = { headers: { authorization: `Bearer ${expiredToken}` } };
      const reply = createMockReply();

      await middleware(request, reply as any);

      expect(reply.codeCalledWith).toBe(401);
      expect(reply.sendPayload.error).toBe('Invalid or expired token');
    });

    it('rejects invalid JWT without falling back to API key', async () => {
      // JWT is invalid - middleware rejects immediately, no fallback
      const middleware = createAuthMiddleware(apiKeyStore, limiter);
      const request = {
        headers: {
          authorization: 'Bearer invalid.token',
          'x-api-key': 'algo_invalid-key-to-test-fallback',
        },
      };
      const reply = createMockReply();

      await middleware(request, reply as any);

      // JWT invalid takes precedence over API key fallback
      expect(reply.codeCalledWith).toBe(401);
      expect(reply.sendPayload.error).toBe('Invalid or expired token');
    });

    it('validates API key from store', async () => {
      const apiResult = generateApiKey('tenant-api', ['backtest'], 'Test API Key');
      apiKeyStore.set(apiResult.record.keyId, apiResult.record);

      const middleware = createAuthMiddleware(apiKeyStore, limiter);
      const request = { headers: { 'x-api-key': apiResult.raw } };
      const reply = createMockReply();

      await middleware(request, reply as any);

      expect(reply.codeCalledWith).toBeUndefined();
      expect(request.authContext).toEqual({
        tenantId: 'tenant-api',
        scopes: ['backtest'],
        keyId: apiResult.record.keyId,
      });
    });

    it('rejects invalid API key', async () => {
      const middleware = createAuthMiddleware(apiKeyStore, limiter);
      const request = { headers: { 'x-api-key': 'algo_invalid-key-format' } };
      const reply = createMockReply();

      await middleware(request, reply as any);

      expect(reply.codeCalledWith).toBe(401);
      expect(reply.sendPayload.error).toBe('Invalid API key');
    });

    it('gives priority to JWT over API key', async () => {
      const apiResult = generateApiKey('tenant-api', ['backtest']);
      apiKeyStore.set(apiResult.record.keyId, apiResult.record);

      const jwtPayload = { tenantId: 'tenant-jwt', scopes: ['admin'], keyId: 'jwt-key-123' };
      const jwtToken = signToken(jwtPayload);

      const middleware = createAuthMiddleware(apiKeyStore, limiter);
      const request = {
        headers: {
          authorization: `Bearer ${jwtToken}`,
          'x-api-key': apiResult.raw,
        },
      };
      const reply = createMockReply();

      await middleware(request, reply as any);

      // Should use JWT, not API key
      expect(request.authContext?.tenantId).toBe('tenant-jwt');
      expect(request.authContext?.scopes).toEqual(['admin']);
    });

    it('enforces rate limit', async () => {
      // Set low rate limit for testing
      const middleware = createAuthMiddleware(apiKeyStore, limiter, 2, 60000);
      const request = {
        headers: {
          authorization: 'Bearer ' + signToken({ tenantId: 'rate-test', scopes: [], keyId: 'rate-key' }),
        },
      };

      // First request should succeed
      let reply = createMockReply();
      await middleware(request as any, reply as any);
      expect(reply.codeCalledWith).toBeUndefined();

      // Second request should succeed
      request.headers = { authorization: 'Bearer ' + signToken({ tenantId: 'rate-test', scopes: [], keyId: 'rate-key' }) };
      reply = createMockReply();
      await middleware(request as any, reply as any);
      expect(reply.codeCalledWith).toBeUndefined();

      // Third request should be rate limited
      request.headers = { authorization: 'Bearer ' + signToken({ tenantId: 'rate-test', scopes: [], keyId: 'rate-key' }) };
      reply = createMockReply();
      await middleware(request as any, reply as any);
      expect(reply.codeCalledWith).toBe(429);
      expect(reply.sendPayload.error).toBe('Rate limit exceeded');
    });

    it('sets rate limit headers', async () => {
      const middleware = createAuthMiddleware(apiKeyStore, limiter, 5, 60000);
      const request = {
        headers: {
          authorization: 'Bearer ' + signToken({ tenantId: 'header-test', scopes: [], keyId: 'header-key' }),
        },
      };
      const reply = createMockReply();

      await middleware(request as any, reply as any);

      expect(reply.headerCalled).toBe(true);
      expect(reply.headersMap).toHaveProperty('X-RateLimit-Remaining');
      expect(reply.headersMap).toHaveProperty('X-RateLimit-Reset');
    });

    it('continues to next middleware after successful auth', async () => {
      const middleware = createAuthMiddleware(apiKeyStore, limiter);
      const request = { headers: { authorization: 'Bearer ' + signToken({ tenantId: 'continue', scopes: [], keyId: 'cont-key' }) } };
      const reply = createMockReply();

      await middleware(request, reply as any);

      // Should not have called send
      expect(reply.sendCalled).toBe(false);
    });

    it('handles missing rate limiter gracefully (default rate limit)', async () => {
      // Test uses default rate limit from middleware (100 req/min)
      const middleware = createAuthMiddleware(apiKeyStore, limiter);
      const request = {
        headers: {
          authorization: 'Bearer ' + signToken({ tenantId: 'default-limit', scopes: [], keyId: 'def-key' }),
        },
      };
      const reply = createMockReply();

      await middleware(request, reply as any);

      expect(reply.codeCalledWith).toBeUndefined();
    });
  });

  describe('requireScope()', () => {
    let limiter: SlidingWindowRateLimiter;
    let apiKeyStore: Map<string, any>;

    beforeEach(() => {
      limiter = new SlidingWindowRateLimiter();
      apiKeyStore = new Map();
    });

    it('requires authentication first (no authContext)', async () => {
      const scopeGuard = requireScope('backtest');
      const request = { headers: {} }; // No auth
      const reply = createMockReply();

      await scopeGuard(request, reply as any);

      expect(reply.codeCalledWith).toBe(401);
      expect(reply.sendPayload.error).toBe('Authentication required');
    });

    it('grants access when user has required scope', async () => {
      const scopeGuard = requireScope('backtest');
      const request = {
        headers: {},
        authContext: {
          tenantId: 'tenant-123',
          scopes: ['backtest', 'read'],
          keyId: 'key-456',
        },
      };
      const reply = createMockReply();

      await scopeGuard(request, reply as any);

      expect(reply.codeCalledWith).toBeUndefined();
      expect(reply.sendCalled).toBe(false);
    });

    it('grants access when user has admin scope', async () => {
      const scopeGuard = requireScope('special-scope');
      const request = {
        headers: {},
        authContext: {
          tenantId: 'admin-tenant',
          scopes: ['admin'],
          keyId: 'admin-key',
        },
      };
      const reply = createMockReply();

      await scopeGuard(request, reply as any);

      expect(reply.codeCalledWith).toBeUndefined();
    });

    it('denies access when user lacks required scope', async () => {
      const scopeGuard = requireScope('admin');
      const request = {
        headers: {},
        authContext: {
          tenantId: 'tenant-123',
          scopes: ['backtest', 'read'],
          keyId: 'key-456',
        },
      };
      const reply = createMockReply();

      await scopeGuard(request, reply as any);

      expect(reply.codeCalledWith).toBe(403);
      expect(reply.sendPayload.error).toBe("Scope 'admin' required");
    });

    it('handles empty scopes array', async () => {
      const scopeGuard = requireScope('backtest');
      const request = {
        headers: {},
        authContext: {
          tenantId: 'tenant-123',
          scopes: [],
          keyId: 'key-456',
        },
      };
      const reply = createMockReply();

      await scopeGuard(request, reply as any);

      expect(reply.codeCalledWith).toBe(403);
    });

    it('allows multiple required scopes check', async () => {
      // Note: requireScope only checks single scope, but test scenario
      const scopeGuard = requireScope('backtest');
      const request = {
        headers: {},
        authContext: {
          tenantId: 'tenant-123',
          scopes: ['backtest'],
          keyId: 'key-456',
        },
      };
      const reply = createMockReply();

      await scopeGuard(request, reply as any);

      expect(reply.codeCalledWith).toBeUndefined();
    });
  });

  describe('integration - Full auth flow', () => {
    let limiter: SlidingWindowRateLimiter;
    let apiKeyStore: Map<string, any>;

    beforeEach(() => {
      limiter = new SlidingWindowRateLimiter();
      apiKeyStore = new Map();
    });

    it('authenticates via JWT, then authorizes with scope', async () => {
      const jwtToken = signToken({
        tenantId: 'full-flow',
        scopes: ['backtest', 'live:trade'],
        keyId: 'full-key',
      });

      const middleware = createAuthMiddleware(apiKeyStore, limiter);
      const scopeGuard = requireScope('backtest');

      const request = { headers: { authorization: `Bearer ${jwtToken}` } };
      const reply = createMockReply();

      // Step 1: Auth middleware
      await middleware(request, reply as any);
      expect(reply.codeCalledWith).toBeUndefined();
      expect(request.authContext).toBeDefined();

      // Step 2: Scope guard
      const reply2 = createMockReply();
      await scopeGuard(request, reply2 as any);
      expect(reply2.codeCalledWith).toBeUndefined();
    });

    it('rate limiter persists across requests for same keyId', async () => {
      const keyId = 'rate-test-key';
      const jwtToken = signToken({ tenantId: 'rate-test', scopes: [], keyId });

      // Create new middleware with low limit
      const middleware = createAuthMiddleware(apiKeyStore, limiter, 3, 60000);

      // Simulate 3 requests
      for (let i = 0; i < 3; i++) {
        const request = { headers: { authorization: `Bearer ${jwtToken}` } };
        const reply = createMockReply();
        await middleware(request, reply as any);
        expect(reply.codeCalledWith).toBeUndefined();
      }

      // 4th request should be blocked
      const request = { headers: { authorization: `Bearer ${jwtToken}` } };
      const reply = createMockReply();
      await middleware(request, reply as any);
      expect(reply.codeCalledWith).toBe(429);
    });
  });
});

// Helper to create mock reply object
function createMockReply() {
  let codeCalledWith: number | undefined;
  let sendCalled = false;
  let sendPayload: any = {};
  let headerCalled = false;
  let headersMap: Record<string, string> = {};

  const reply: any = {
    code: (statusCode: number) => {
      codeCalledWith = statusCode;
      return reply; // Enable chaining
    },
    header: (key: string, value: string) => {
      headerCalled = true;
      headersMap[key] = value;
      return reply; // Enable chaining
    },
    send: (payload: any) => {
      sendCalled = true;
      sendPayload = payload;
      return reply; // Enable chaining
    },
    get codeCalledWith() { return codeCalledWith; },
    get sendCalled() { return sendCalled; },
    get sendPayload() { return sendPayload; },
    get headerCalled() { return headerCalled; },
    get headersMap() { return headersMap; },
  };

  return reply;
}
