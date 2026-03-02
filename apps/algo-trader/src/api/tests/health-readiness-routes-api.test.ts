/**
 * Tests for Fastify health and readiness routes.
 * Verifies /health always 200 and /ready toggles with setReady().
 */

import { buildServer, setReady } from '../fastify-raas-server';
import type { FastifyInstance } from 'fastify';

describe('health-routes', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    setReady(false);
    server = buildServer();
    await server.ready();
  });

  afterEach(async () => {
    setReady(false);
    await server.close();
  });

  it('GET /health — 200 with status ok', async () => {
    const res = await server.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ status: string; uptime: number; timestamp: string; version: string }>();
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
    expect(typeof body.timestamp).toBe('string');
    expect(typeof body.version).toBe('string');
  });

  it('GET /ready — 503 when not ready', async () => {
    const res = await server.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(503);
    expect(res.json<{ ready: boolean }>().ready).toBe(false);
  });

  it('GET /ready — 200 after setReady(true)', async () => {
    setReady(true);
    const res = await server.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ ready: boolean }>().ready).toBe(true);
  });
});
