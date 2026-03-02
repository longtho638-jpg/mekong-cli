/**
 * Tests for Fastify backtest job submission routes — Phase 1 stub behavior.
 * Verifies 202 Accepted on submit and job polling.
 */

import { buildServer } from '../fastify-raas-server';
import { _resetJobRegistry } from '../routes/backtest-job-submission-routes';
import type { FastifyInstance } from 'fastify';

const BASE_JOB = {
  strategyId: 'rsi-sma-v1',
  symbol: 'BTC/USDT',
  days: 30,
  initialBalance: 10000,
};

describe('backtest-job-routes', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    _resetJobRegistry();
    server = buildServer({ skipAuth: true });
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it('POST /api/v1/backtest/jobs — returns 202 with jobId', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/backtest/jobs',
      payload: BASE_JOB,
    });
    expect(res.statusCode).toBe(202);
    const body = res.json<{ jobId: string; status: string }>();
    expect(body.status).toBe('queued');
    expect(typeof body.jobId).toBe('string');
    expect(body.jobId).toMatch(/^bt_/);
  });

  it('POST /api/v1/backtest/jobs — 400 on invalid body', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/backtest/jobs',
      payload: { strategyId: '', days: -1, initialBalance: 0 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBe('validation_error');
  });

  it('GET /api/v1/backtest/jobs/:jobId — returns queued job', async () => {
    const submitRes = await server.inject({
      method: 'POST',
      url: '/api/v1/backtest/jobs',
      payload: BASE_JOB,
    });
    const { jobId } = submitRes.json<{ jobId: string }>();

    const pollRes = await server.inject({ method: 'GET', url: `/api/v1/backtest/jobs/${jobId}` });
    expect(pollRes.statusCode).toBe(200);
    const job = pollRes.json<{ id: string; status: string }>();
    expect(job.id).toBe(jobId);
    expect(job.status).toBe('queued');
  });

  it('GET /api/v1/backtest/jobs/:jobId — 404 for unknown job', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/backtest/jobs/nonexistent' });
    expect(res.statusCode).toBe(404);
  });
});
