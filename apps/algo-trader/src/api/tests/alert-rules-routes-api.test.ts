/**
 * Tests for Fastify alert rules routes — CRUD and evaluate endpoint.
 * Uses fastify.inject() to avoid real network I/O.
 */

import { buildServer } from '../fastify-raas-server';
import { _resetAlertStore } from '../routes/alert-rules-routes';
import type { FastifyInstance } from 'fastify';

const BASE_RULE = {
  id: 'rule-drawdown',
  metric: 'drawdown_pct',
  operator: 'gt',
  threshold: 10,
  action: 'log',
  cooldownMs: 0,
};

describe('alert-rules-routes', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    _resetAlertStore();
    server = buildServer({ skipAuth: true });
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it('GET /api/v1/alerts/rules — returns empty array initially', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/alerts/rules' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('POST /api/v1/alerts/rules — creates rule', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/alerts/rules',
      payload: BASE_RULE,
    });
    expect(res.statusCode).toBe(201);
    expect(res.json<{ id: string }>().id).toBe(BASE_RULE.id);
  });

  it('POST /api/v1/alerts/rules — 409 on duplicate id', async () => {
    await server.inject({ method: 'POST', url: '/api/v1/alerts/rules', payload: BASE_RULE });
    const res = await server.inject({ method: 'POST', url: '/api/v1/alerts/rules', payload: BASE_RULE });
    expect(res.statusCode).toBe(409);
  });

  it('POST /api/v1/alerts/rules — 400 on invalid body', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/alerts/rules',
      payload: { id: '', metric: 'unknown', operator: 'eq', threshold: 'not-a-number', action: 'log', cooldownMs: -1 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('DELETE /api/v1/alerts/rules/:id — removes rule', async () => {
    await server.inject({ method: 'POST', url: '/api/v1/alerts/rules', payload: BASE_RULE });
    const res = await server.inject({ method: 'DELETE', url: `/api/v1/alerts/rules/${BASE_RULE.id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ deleted: string }>().deleted).toBe(BASE_RULE.id);
  });

  it('DELETE /api/v1/alerts/rules/:id — 404 for unknown rule', async () => {
    const res = await server.inject({ method: 'DELETE', url: '/api/v1/alerts/rules/ghost' });
    expect(res.statusCode).toBe(404);
  });

  it('POST /api/v1/alerts/evaluate — triggers rule when threshold exceeded', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/alerts/evaluate',
      payload: {
        rules: [BASE_RULE],
        metrics: { drawdown_pct: 15 },
      },
    });
    expect(res.statusCode).toBe(200);
    const results = res.json<Array<{ triggered: boolean; ruleId: string }>>();
    expect(results[0].triggered).toBe(true);
    expect(results[0].ruleId).toBe(BASE_RULE.id);
  });

  it('POST /api/v1/alerts/evaluate — does not trigger when below threshold', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/alerts/evaluate',
      payload: {
        rules: [BASE_RULE],
        metrics: { drawdown_pct: 5 },
      },
    });
    expect(res.statusCode).toBe(200);
    const results = res.json<Array<{ triggered: boolean }>>();
    expect(results[0].triggered).toBe(false);
  });
});
