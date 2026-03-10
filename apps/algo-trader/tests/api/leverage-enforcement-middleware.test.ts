/**
 * Tests for leverage enforcement middleware
 *
 * Validates that trade requests with leverage are properly checked
 * against tier-based caps (FREE=1x, PRO=10x, ENTERPRISE=20x).
 */

import Fastify, { FastifyInstance } from 'fastify';
import { leverageEnforcementPlugin } from '../../src/api/middleware/leverage-enforcement-middleware';

describe('leverageEnforcementPlugin', () => {
  let server: FastifyInstance;
  let currentTier: string;

  /** Build a fresh server with leverage enforcement using the given tier */
  async function buildServer(tier: string): Promise<FastifyInstance> {
    currentTier = tier;
    const s = Fastify();

    // Register leverage enforcement with DI tier resolver
    await s.register(leverageEnforcementPlugin, {
      getTier: () => currentTier,
    });

    // Test route that accepts leverage in body
    s.post('/test/trade', async (request, reply) => {
      return reply.send({ ok: true, body: request.body });
    });

    // Test route without body
    s.get('/test/status', async (_request, reply) => {
      return reply.send({ ok: true });
    });

    await s.ready();
    return s;
  }

  afterEach(async () => {
    if (server) await server.close();
  });

  // ── FREE tier (max 1x) ──────────────────────────────────────────────

  describe('FREE tier (max 1x)', () => {
    beforeEach(async () => {
      server = await buildServer('free');
    });

    it('should allow spot (leverage=1)', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/test/trade',
        payload: { symbol: 'BTC/USDT', leverage: 1 },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().ok).toBe(true);
    });

    it('should reject leverage > 1x for free tier', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/test/trade',
        payload: { symbol: 'BTC/USDT', leverage: 2 },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().error).toBe('Leverage Exceeded');
      expect(res.json().maxAllowed).toBe(1);
    });

    it('should reject 10x leverage for free tier', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/test/trade',
        payload: { symbol: 'BTC/USDT', leverage: 10 },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().requestedLeverage).toBe(10);
      expect(res.json().tier).toBe('free');
    });
  });

  // ── PRO tier (max 10x) ─────────────────────────────────────────────

  describe('PRO tier (max 10x)', () => {
    beforeEach(async () => {
      server = await buildServer('pro');
    });

    it('should allow 5x leverage for pro tier', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/test/trade',
        payload: { symbol: 'BTC/USDT', leverage: 5 },
      });
      expect(res.statusCode).toBe(200);
    });

    it('should allow exactly 10x leverage for pro tier', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/test/trade',
        payload: { symbol: 'BTC/USDT', leverage: 10 },
      });
      expect(res.statusCode).toBe(200);
    });

    it('should reject 11x leverage for pro tier', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/test/trade',
        payload: { symbol: 'BTC/USDT', leverage: 11 },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().maxAllowed).toBe(10);
    });

    it('should reject 20x leverage for pro tier', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/test/trade',
        payload: { symbol: 'BTC/USDT', leverage: 20 },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── ENTERPRISE tier (max 20x) ───────────────────────────────────────

  describe('ENTERPRISE tier (max 20x)', () => {
    beforeEach(async () => {
      server = await buildServer('enterprise');
    });

    it('should allow 20x leverage for enterprise tier', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/test/trade',
        payload: { symbol: 'BTC/USDT', leverage: 20 },
      });
      expect(res.statusCode).toBe(200);
    });

    it('should allow 10x leverage for enterprise tier', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/test/trade',
        payload: { symbol: 'BTC/USDT', leverage: 10 },
      });
      expect(res.statusCode).toBe(200);
    });

    it('should allow spot for enterprise tier', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/test/trade',
        payload: { symbol: 'BTC/USDT', leverage: 1 },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────

  describe('edge cases', () => {
    beforeEach(async () => {
      server = await buildServer('pro');
    });

    it('should pass through requests without leverage field', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/test/trade',
        payload: { symbol: 'BTC/USDT', amount: 1 },
      });
      expect(res.statusCode).toBe(200);
    });

    it('should pass through GET requests (no body)', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/test/status',
      });
      expect(res.statusCode).toBe(200);
    });

    it('should pass through requests with non-numeric leverage', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/test/trade',
        payload: { symbol: 'BTC/USDT', leverage: 'high' },
      });
      expect(res.statusCode).toBe(200);
    });

    it('should reject negative leverage with 400', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/test/trade',
        payload: { symbol: 'BTC/USDT', leverage: -5 },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe('Invalid Leverage');
    });

    it('should reject zero leverage with 400', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/test/trade',
        payload: { symbol: 'BTC/USDT', leverage: 0 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('should not expose tier caps in rejection response', async () => {
      currentTier = 'free';
      const res = await server.inject({
        method: 'POST',
        url: '/test/trade',
        payload: { symbol: 'BTC/USDT', leverage: 5 },
      });
      expect(res.statusCode).toBe(403);
      const body = res.json();
      expect(body.caps).toBeUndefined();
      expect(body.maxAllowed).toBe(1);
    });
  });
});
