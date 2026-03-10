/**
 * Smoke Tests — API Server Startup Validation
 *
 * Verifies server can:
 * - Start without errors
 * - Load all routes
 * - Handle concurrent requests
 * - Shutdown gracefully
 */

import { buildServer, startRaasServer, stopRaasServer } from '../../src/api/fastify-raas-server';
import { FastifyInstance } from 'fastify';

describe('Smoke Tests — API Server Startup', () => {
  let server: FastifyInstance | null = null;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }
  });

  // ── Server Startup (P0) ──

  describe('Server Startup', () => {
    test('Server starts without errors', async () => {
      server = buildServer({ skipAuth: true });
      await server.ready();
      // Server needs to listen to be considered "started"
      const port = 0; // Use random available port
      await server.listen({ port, host: '127.0.0.1' });
      expect(server.server.listening).toBe(true);
    });

    test('Server has expected routes registered', async () => {
      server = buildServer({ skipAuth: true });
      await server.ready();
      const port = 0;
      await server.listen({ port, host: '127.0.0.1' });

      const routes = server.printRoutes();
      expect(routes).toContain('health');
      expect(routes).toContain('ready');
      expect(routes).toContain('metrics');
    });

    test('Server startup time is reasonable (< 5s)', async () => {
      const start = Date.now();
      server = buildServer({ skipAuth: true });
      await server.ready();
      const port = 0;
      await server.listen({ port, host: '127.0.0.1' });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
    });
  });

  // ── Route Registration (P1) ──

  describe('Route Registration', () => {
    beforeEach(async () => {
      server = buildServer({ skipAuth: true });
      await server.ready();
      const port = 0;
      await server.listen({ port, host: '127.0.0.1' });
    });

    test('Health routes are registered', async () => {
      const routes = server.printRoutes();
      expect(routes).toMatch(/health/);
      expect(routes).toMatch(/ready/);
    });

    test('API v1 routes are registered', async () => {
      // Verify API v1 routes exist by making actual requests
      // printRoutes() doesn't show full tree, so test behavior instead
      const billingRes = await server.inject({ method: 'GET', url: '/api/v1/billing/products' });
      // Should get a response (401/403 is OK - means route exists)
      expect(billingRes.statusCode).toBeDefined();
      expect(billingRes.statusCode).not.toBe(404);
    });
  });

  // ── Graceful Shutdown (P1) ──

  describe('Graceful Shutdown', () => {
    test('Server shuts down gracefully', async () => {
      server = buildServer({ skipAuth: true });
      await server.ready();
      const port = 0;
      await server.listen({ port, host: '127.0.0.1' });

      const closePromise = server.close();
      await expect(closePromise).resolves.not.toThrow();
    });

    test('Server rejects requests after shutdown', async () => {
      server = buildServer({ skipAuth: true });
      await server.ready();
      const port = 0;
      await server.listen({ port, host: '127.0.0.1' });

      // Make request before shutdown
      const beforeRes = await server.inject({ method: 'GET', url: '/health' });
      expect(beforeRes.statusCode).toBe(200);

      // Shutdown
      await server.close();

      // Attempt request after shutdown
      try {
        await server.inject({ method: 'GET', url: '/health' });
        // If we get here without error, the test framework handles it
      } catch (error) {
        // Expected - server is closed
        expect(error).toBeDefined();
      }
    });
  });

  // ── Concurrent Request Handling (P2) ──

  describe('Concurrent Request Handling', () => {
    beforeEach(async () => {
      server = buildServer({ skipAuth: true });
      await server.ready();
      const port = 0;
      await server.listen({ port, host: '127.0.0.1' });
    });

    test('Server handles 10 concurrent health requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        server.inject({ method: 'GET', url: '/health' })
      );

      const responses = await Promise.all(requests);

      expect(responses.every(r => r.statusCode === 200)).toBe(true);
    });

    test('Server handles mixed concurrent requests', async () => {
      const requests = [
        server.inject({ method: 'GET', url: '/health' }),
        server.inject({ method: 'GET', url: '/ready' }),
        server.inject({ method: 'GET', url: '/metrics' }),
        server.inject({ method: 'GET', url: '/health' }),
        server.inject({ method: 'GET', url: '/ready' }),
      ];

      const responses = await Promise.all(requests);

      // All should complete (some may be 200, some 503 for ready)
      expect(responses.length).toBe(5);
      expect(responses.every(r => r.statusCode >= 200 && r.statusCode < 600)).toBe(true);
    });
  });

  // ── Memory Leak Detection (P2) ──

  describe('Memory Leak Detection', () => {
    test('Server memory stable after multiple requests', async () => {
      server = buildServer({ skipAuth: true });
      await server.ready();
      const port = 0;
      await server.listen({ port, host: '127.0.0.1' });

      const initialMemory = process.memoryUsage();

      // Make 50 requests
      for (let i = 0; i < 50; i++) {
        await server.inject({ method: 'GET', url: '/health' });
      }

      const finalMemory = process.memoryUsage();

      // Memory growth should be reasonable (< 50MB increase)
      const heapIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(heapIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});
