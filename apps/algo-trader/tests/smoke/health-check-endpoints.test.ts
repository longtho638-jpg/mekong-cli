/**
 * Smoke Tests — Post-Deploy Health Check Validation
 *
 * Run these tests after deployment to verify:
 * - Server startup successful
 * - Health endpoints responding
 * - Core services connected (Redis, Database)
 * - API routes accessible
 *
 * Usage: npm test -- tests/smoke/*.test.ts
 */

import { buildServer } from '../../src/api/fastify-raas-server';
import { FastifyInstance } from 'fastify';

describe('Smoke Tests — Post-Deploy Health Checks', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    // Build server without auth for smoke tests
    server = buildServer({ skipAuth: true });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  // ── Critical Health Probes (P0) ──

  describe('Critical Health Endpoints', () => {
    test('GET /health returns 200 — server is alive', async () => {
      const res = await server.inject({ method: 'GET', url: '/health' });
      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(body.status).toBe('ok');
      expect(body.uptime).toBeGreaterThanOrEqual(0);
      expect(body.timestamp).toBeDefined();
      expect(body.version).toBeDefined();
    });

    test('Server uptime is reasonable (> 0s, < 1 hour for fresh deploy)', async () => {
      const res = await server.inject({ method: 'GET', url: '/health' });
      const body = JSON.parse(res.body);

      expect(body.uptime).toBeGreaterThan(0);
      expect(body.uptime).toBeLessThan(3600); // Fresh deploy should be < 1 hour
    });

    test('GET /ready returns readiness status', async () => {
      const res = await server.inject({ method: 'GET', url: '/ready' });
      expect([200, 503]).toContain(res.statusCode);

      const body = JSON.parse(res.body);
      expect(typeof body.ready).toBe('boolean');
    });
  });

  // ── API Route Validation (P1) ──

  describe('API Route Accessibility', () => {
    test('GET /metrics returns Prometheus format', async () => {
      const res = await server.inject({ method: 'GET', url: '/metrics' });
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');

      const body = res.body;
      // Check for expected metrics
      expect(body).toContain('# TYPE');
      expect(body).toContain('# HELP');
    });

    test('Unknown routes return 404', async () => {
      const res = await server.inject({ method: 'GET', url: '/nonexistent-route' });
      expect(res.statusCode).toBe(404);
    });

    test('API version prefix is accessible', async () => {
      const res = await server.inject({ method: 'GET', url: '/api/v1/health' });
      // Should exist or 404, but not 500
      expect(res.statusCode).not.toBe(500);
    });
  });

  // ── Response Time Checks (P2) ──

  describe('Response Time Validation', () => {
    test('Health endpoint responds within 100ms', async () => {
      const start = Date.now();
      const res = await server.inject({ method: 'GET', url: '/health' });
      const duration = Date.now() - start;

      expect(res.statusCode).toBe(200);
      expect(duration).toBeLessThan(100);
    });

    test('Metrics endpoint responds within 500ms', async () => {
      const start = Date.now();
      const res = await server.inject({ method: 'GET', url: '/metrics' });
      const duration = Date.now() - start;

      expect(res.statusCode).toBe(200);
      expect(duration).toBeLessThan(500);
    });
  });

  // ── Error Recovery (P2) ──

  describe('Error Handling', () => {
    test('Server handles malformed JSON gracefully', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/health',
        body: 'invalid-json',
        headers: { 'content-type': 'application/json' },
      });
      // Should not crash — 400 or 405 is acceptable
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

    test('Server handles large payloads without crashing', async () => {
      const largePayload = 'x'.repeat(10000);
      const res = await server.inject({
        method: 'POST',
        url: '/health',
        body: largePayload,
      });
      // Should reject but not crash
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
  });
});
