/**
 * Tests for Fastify Prometheus /metrics endpoint — text exposition format validation.
 * /metrics is auth-excluded; skipAuth used for consistency with other route tests.
 */

import { buildServer } from '../fastify-raas-server';
import type { FastifyInstance } from 'fastify';

describe('prometheus-metrics-routes', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = buildServer({ skipAuth: true });
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it('GET /metrics — 200 with text/plain content-type', async () => {
    const res = await server.inject({ method: 'GET', url: '/metrics' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
  });

  it('GET /metrics — contains algo_trader_heap_used_bytes', async () => {
    const res = await server.inject({ method: 'GET', url: '/metrics' });
    expect(res.body).toContain('algo_trader_heap_used_bytes');
  });

  it('GET /metrics — contains algo_trader_uptime_seconds', async () => {
    const res = await server.inject({ method: 'GET', url: '/metrics' });
    expect(res.body).toContain('algo_trader_uptime_seconds');
  });

  it('GET /metrics — contains # HELP and # TYPE lines', async () => {
    const res = await server.inject({ method: 'GET', url: '/metrics' });
    expect(res.body).toContain('# HELP');
    expect(res.body).toContain('# TYPE');
  });

  it('GET /metrics — matches Prometheus exposition format', async () => {
    const res = await server.inject({ method: 'GET', url: '/metrics' });
    const lines = res.body.split('\n').filter(Boolean);
    const helpLines = lines.filter(l => l.startsWith('# HELP'));
    const typeLines = lines.filter(l => l.startsWith('# TYPE'));
    expect(helpLines.length).toBeGreaterThan(0);
    expect(typeLines.length).toBeGreaterThan(0);
    // Every TYPE line declares gauge or counter
    typeLines.forEach(l => {
      expect(l).toMatch(/# TYPE \S+ (gauge|counter)/);
    });
  });
});
