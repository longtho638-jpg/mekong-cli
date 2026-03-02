/**
 * Tests for hyperparameter optimization job routes.
 * Routes NOT in buildServer() — registered manually via Fastify.register().
 * Background jobs fire via setImmediate but don't affect HTTP response assertions.
 */

import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { hyperparameterOptimizationRoutes } from '../routes/hyperparameter-optimization-job-routes';

jest.setTimeout(30000);

const VALID_BODY = {
  strategyName: 'RsiSma',
  pair: 'BTC/USDT',
  days: 5,
  paramRanges: [{ name: 'rsiPeriod', values: [10, 14] }],
  maxTrials: 1,
};

describe('hyperparameter-optimization-routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = Fastify({ logger: false });
    void server.register(hyperparameterOptimizationRoutes);
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('POST /api/v1/optimization — valid body returns 202 queued', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/optimization',
      payload: VALID_BODY,
    });
    expect(res.statusCode).toBe(202);
    const body = res.json<{ jobId: string; status: string }>();
    expect(body.jobId).toMatch(/^opt-/);
    expect(body.status).toBe('queued');
  });

  it('POST /api/v1/optimization — empty body returns 400', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/optimization',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBeDefined();
  });

  it('GET /api/v1/optimization/nonexistent — 404', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/optimization/nonexistent-id',
    });
    expect(res.statusCode).toBe(404);
  });

  it('GET /api/v1/optimization/:jobId — returns job after POST', async () => {
    const post = await server.inject({
      method: 'POST',
      url: '/api/v1/optimization',
      payload: VALID_BODY,
    });
    const { jobId } = post.json<{ jobId: string }>();

    const get = await server.inject({
      method: 'GET',
      url: `/api/v1/optimization/${jobId}`,
    });
    expect(get.statusCode).toBe(200);
    const body = get.json<{ jobId: string; status: string; createdAt: string }>();
    expect(body.jobId).toBe(jobId);
    expect(['queued', 'running', 'completed', 'failed']).toContain(body.status);
    expect(body.createdAt).toBeDefined();
  });
});
