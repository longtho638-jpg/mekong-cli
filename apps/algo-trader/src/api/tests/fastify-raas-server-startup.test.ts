/**
 * Tests for Fastify RaaS server startup, shutdown, and plugin loading.
 * Verifies server lifecycle and that all route namespaces are registered.
 */

import { buildServer, startRaasServer, stopRaasServer } from '../fastify-raas-server';

describe('fastify-raas-server: lifecycle', () => {
  it('builds server without throwing', () => {
    const server = buildServer();
    expect(server).toBeDefined();
    void server.close();
  });

  it('starts and stops cleanly', async () => {
    const port = await startRaasServer({ port: 0 });
    expect(port).toBeGreaterThan(0);
    await stopRaasServer();
  });

  it('registers /health route', async () => {
    const server = buildServer();
    await server.ready();
    const res = await server.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ status: string; uptime: number; version: string }>();
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
    void server.close();
  });

  it('registers /ready route', async () => {
    const server = buildServer();
    await server.ready();
    const res = await server.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(503);
    const body = res.json<{ ready: boolean }>();
    expect(body.ready).toBe(false);
    void server.close();
  });

  it('returns 404 for unknown routes', async () => {
    const server = buildServer({ skipAuth: true });
    await server.ready();
    const res = await server.inject({ method: 'GET', url: '/unknown-route' });
    expect(res.statusCode).toBe(404);
    void server.close();
  });
});
