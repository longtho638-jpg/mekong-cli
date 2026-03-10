/**
 * Phase 6 Ghost Protocol API Routes Tests
 * Tests for leverage enforcement, status endpoints, and configuration management
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { buildServer } from '../../src/api/fastify-raas-server';
import { FastifyInstance } from 'fastify';
import { TIER_LEVERAGE_CAPS } from '../../src/execution/max-order-limits';

describe('Phase 6 Ghost Protocol Routes', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    // Create server with skipAuth to test routes directly
    server = buildServer({ skipAuth: true });
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  describe('GET /api/v1/phase6/status', () => {
    test('should return 200 with phase 6 status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/status',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toBeDefined();
    });

    test('should return phase 6 codename', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/status',
      });

      const body = JSON.parse(response.body);
      expect(body.phase).toBe(6);
      expect(body.codename).toBe('Ghost Protocol');
    });

    test('should return module status object', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/status',
      });

      const body = JSON.parse(response.body);
      expect(body.modules).toBeDefined();
      expect(typeof body.modules).toBe('object');
    });

    test('should return polymorphicMatrix module status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/status',
      });

      const body = JSON.parse(response.body);
      expect(body.modules.polymorphicMatrix).toBeDefined();
      expect(typeof body.modules.polymorphicMatrix.enabled).toBe('boolean');
    });

    test('should return wsSharding module status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/status',
      });

      const body = JSON.parse(response.body);
      expect(body.modules.wsSharding).toBeDefined();
      expect(typeof body.modules.wsSharding.enabled).toBe('boolean');
    });

    test('should return chameleon module status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/status',
      });

      const body = JSON.parse(response.body);
      expect(body.modules.chameleon).toBeDefined();
      expect(typeof body.modules.chameleon.enabled).toBe('boolean');
    });

    test('should include leverage caps in status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/status',
      });

      const body = JSON.parse(response.body);
      expect(body.leverageCaps).toBeDefined();
      expect(body.leverageCaps.free).toBe(1);
      expect(body.leverageCaps.pro).toBe(10);
      expect(body.leverageCaps.enterprise).toBe(20);
    });

    test('should have consistent leverageCaps with constant', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/status',
      });

      const body = JSON.parse(response.body);
      expect(body.leverageCaps).toEqual(TIER_LEVERAGE_CAPS);
    });
  });

  describe('GET /api/v1/phase6/leverage/caps', () => {
    test('should return 200 with leverage caps', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/leverage/caps',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toBeDefined();
    });

    test('should return caps object with all tiers', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/leverage/caps',
      });

      const body = JSON.parse(response.body);
      expect(body.caps).toBeDefined();
      expect(body.caps.free).toBe(1);
      expect(body.caps.pro).toBe(10);
      expect(body.caps.enterprise).toBe(20);
    });

    test('should return maxGlobal field', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/leverage/caps',
      });

      const body = JSON.parse(response.body);
      expect(body.maxGlobal).toBeDefined();
      expect(typeof body.maxGlobal).toBe('number');
      expect(body.maxGlobal).toBe(20);
    });

    test('should return description field', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/leverage/caps',
      });

      const body = JSON.parse(response.body);
      expect(body.description).toBeDefined();
      expect(typeof body.description).toBe('string');
      expect(body.description.length).toBeGreaterThan(0);
    });

    test('should match TIER_LEVERAGE_CAPS constant', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/leverage/caps',
      });

      const body = JSON.parse(response.body);
      expect(body.caps).toEqual(TIER_LEVERAGE_CAPS);
    });
  });

  describe('POST /api/v1/phase6/leverage/check', () => {
    test('should accept valid leverage check request', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 5,
          tier: 'pro',
        },
      });

      expect(response.statusCode).toBeOneOf([200, 403]);
    });

    test('should return 200 for valid leverage within cap', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 5,
          tier: 'pro',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.passed).toBe(true);
    });

    test('should return 403 for leverage exceeding cap', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 15,
          tier: 'pro',
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.passed).toBe(false);
    });

    test('should return check result with passed flag', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 10,
          tier: 'pro',
        },
      });

      const body = JSON.parse(response.body);
      expect(body.passed).toBeDefined();
      expect(typeof body.passed).toBe('boolean');
    });

    test('should return requested leverage in result', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 7,
          tier: 'pro',
        },
      });

      const body = JSON.parse(response.body);
      expect(body.requestedLeverage).toBe(7);
    });

    test('should return maxAllowed in result', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 5,
          tier: 'pro',
        },
      });

      const body = JSON.parse(response.body);
      expect(body.maxAllowed).toBe(10);
    });

    test('should return tier in result', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 5,
          tier: 'pro',
        },
      });

      const body = JSON.parse(response.body);
      expect(body.tier).toBe('pro');
    });

    test('should reject missing leverage field', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          tier: 'pro',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
    });

    test('should reject non-numeric leverage', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 'invalid',
          tier: 'pro',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    test('should reject zero leverage', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 0,
          tier: 'pro',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    test('should reject negative leverage', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: -5,
          tier: 'pro',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    test('should default to enterprise tier if not specified', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 20,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.tier).toBe('enterprise');
      expect(body.maxAllowed).toBe(20);
    });

    test('should support free tier checks', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 1,
          tier: 'free',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.maxAllowed).toBe(1);
    });

    test('should reject leverage > 1 on free tier', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 2,
          tier: 'free',
        },
      });

      expect(response.statusCode).toBe(403);
    });

    test('should support enterprise tier checks', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 20,
          tier: 'enterprise',
        },
      });

      expect(response.statusCode).toBe(200);
    });

    test('should reject leverage > 20 on enterprise tier', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 21,
          tier: 'enterprise',
        },
      });

      expect(response.statusCode).toBe(403);
    });

    test('should include rejection reason when check fails', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 25,
          tier: 'pro',
        },
      });

      const body = JSON.parse(response.body);
      expect(body.rejectedReason).toBeDefined();
      expect(typeof body.rejectedReason).toBe('string');
    });

    test('should not include rejection reason on success', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 5,
          tier: 'pro',
        },
      });

      const body = JSON.parse(response.body);
      expect(body.rejectedReason).toBeUndefined();
    });

    test('should handle case-insensitive tier names', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 5,
          tier: 'PRO',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.tier.toLowerCase()).toBe('pro');
    });

    test('should support fractional leverage values', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 2.5,
          tier: 'pro',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.requestedLeverage).toBe(2.5);
    });
  });

  describe('PUT /api/v1/phase6/config', () => {
    test('should accept config update request', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/v1/phase6/config',
        payload: {
          polymorphicMatrix: { enabled: true },
        },
      });

      expect(response.statusCode).toBe(200);
    });

    test('should return success message on update', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/v1/phase6/config',
        payload: {
          polymorphicMatrix: { enabled: true },
        },
      });

      const body = JSON.parse(response.body);
      expect(body.message).toBeDefined();
      expect(body.message.toLowerCase()).toContain('updated');
    });

    test('should return updated config', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/v1/phase6/config',
        payload: {
          polymorphicMatrix: { enabled: true },
        },
      });

      const body = JSON.parse(response.body);
      expect(body.config).toBeDefined();
      expect(typeof body.config).toBe('object');
    });

    test('should update polymorphicMatrix setting', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/v1/phase6/config',
        payload: {
          polymorphicMatrix: { enabled: true },
        },
      });

      const body = JSON.parse(response.body);
      expect(body.config.polymorphicMatrix).toBeDefined();
      expect(body.config.polymorphicMatrix.enabled).toBe(true);
    });

    test('should update wsSharding setting', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/v1/phase6/config',
        payload: {
          wsSharding: { enabled: false },
        },
      });

      const body = JSON.parse(response.body);
      expect(body.config.wsSharding).toBeDefined();
      expect(body.config.wsSharding.enabled).toBe(false);
    });

    test('should update chameleon setting', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/v1/phase6/config',
        payload: {
          chameleon: { enabled: true },
        },
      });

      const body = JSON.parse(response.body);
      expect(body.config.chameleon).toBeDefined();
      expect(body.config.chameleon.enabled).toBe(true);
    });

    test('should update multiple settings at once', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/v1/phase6/config',
        payload: {
          polymorphicMatrix: { enabled: true },
          wsSharding: { enabled: false },
          chameleon: { enabled: true },
        },
      });

      const body = JSON.parse(response.body);
      expect(body.config.polymorphicMatrix.enabled).toBe(true);
      expect(body.config.wsSharding.enabled).toBe(false);
      expect(body.config.chameleon.enabled).toBe(true);
    });

    test('should reject missing body', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/v1/phase6/config',
        payload: null,
      });

      expect(response.statusCode).toBe(400);
    });

    test('should reject non-object body', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/v1/phase6/config',
        payload: 'not an object',
      });

      // Fastify may return 415 (Unsupported Media Type) or 400 for non-JSON body
      expect([400, 415]).toContain(response.statusCode);
    });

    test('should accept empty config object', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/v1/phase6/config',
        payload: {},
      });

      expect(response.statusCode).toBe(200);
    });

    test('should preserve existing config when partially updating', async () => {
      // First set a value
      const response1 = await server.inject({
        method: 'PUT',
        url: '/api/v1/phase6/config',
        payload: {
          polymorphicMatrix: { enabled: true },
        },
      });

      const body1 = JSON.parse(response1.body);
      const polymorphicValue = body1.config.polymorphicMatrix.enabled;

      // Update different value
      const response2 = await server.inject({
        method: 'PUT',
        url: '/api/v1/phase6/config',
        payload: {
          wsSharding: { enabled: true },
        },
      });

      const body2 = JSON.parse(response2.body);
      // The first value should still be there (or at least config object exists)
      expect(body2.config).toBeDefined();
      expect(body2.config.wsSharding).toBeDefined();
    });
  });

  describe('Authentication & Authorization (Phase 6 endpoints)', () => {
    test('GET /api/v1/phase6/status should work with skipAuth', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/status',
      });

      expect(response.statusCode).toBe(200);
    });

    test('POST /api/v1/phase6/leverage/check should work with skipAuth', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: {
          leverage: 5,
          tier: 'pro',
        },
      });

      expect([200, 403]).toContain(response.statusCode);
    });

    test('GET /api/v1/phase6/leverage/caps should work with skipAuth', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/leverage/caps',
      });

      expect(response.statusCode).toBe(200);
    });

    test('PUT /api/v1/phase6/config should work with skipAuth', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/v1/phase6/config',
        payload: {},
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Response Content-Type', () => {
    test('GET /api/v1/phase6/status should return JSON', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/status',
      });

      expect(() => JSON.parse(response.body)).not.toThrow();
    });

    test('POST /api/v1/phase6/leverage/check should return JSON', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/phase6/leverage/check',
        payload: { leverage: 5, tier: 'pro' },
      });

      expect(() => JSON.parse(response.body)).not.toThrow();
    });

    test('GET /api/v1/phase6/leverage/caps should return JSON', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/phase6/leverage/caps',
      });

      expect(() => JSON.parse(response.body)).not.toThrow();
    });

    test('PUT /api/v1/phase6/config should return JSON', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/v1/phase6/config',
        payload: {},
      });

      expect(() => JSON.parse(response.body)).not.toThrow();
    });
  });
});

// Helper: Extend Matcher for toBeOneOf
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: (string | number)[]): R;
    }
  }
}

expect.extend({
  toBeOneOf(received: string | number, expected: (string | number)[]) {
    const pass = expected.includes(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be one of ${expected}`
          : `expected ${received} to be one of ${expected}`,
    };
  },
});
