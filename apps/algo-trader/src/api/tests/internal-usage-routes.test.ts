/**
 * Integration tests for Internal Usage API Routes
 *
 * Tests the /internal/usage/* endpoints for usage metering and billing integration.
 * Verifies authentication, rate limiting, and response formats.
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { buildServer } from '../fastify-raas-server';
import Fastify from 'fastify';

describe('Internal Usage API', () => {
  let server: Fastify.FastifyInstance;
  let testApiKey: string;

  beforeEach(async () => {
    // Set up internal API key for testing
    testApiKey = 'test-internal-key-123';
    process.env.INTERNAL_API_KEY = testApiKey;

    // Build server with skipAuth for unit testing internal routes only
    server = buildServer({ skipAuth: true });
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
    delete process.env.INTERNAL_API_KEY;
  });

  describe('GET /internal/usage/:licenseKey', () => {
    test('should return 401 without X-Internal-API-Key header', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/test-license-123',
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body)).toEqual({
        error: 'Unauthorized',
        message: 'Valid X-Internal-API-Key header required',
      });
    });

    test('should return 401 with invalid API key', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/test-license-123',
        headers: {
          'x-internal-api-key': 'wrong-key',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body)).toEqual({
        error: 'Unauthorized',
        message: 'Valid X-Internal-API-Key header required',
      });
    });

    test('should return 400 for invalid license key format', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/abc',
        headers: {
          'x-internal-api-key': testApiKey,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        error: 'Bad Request',
        message: 'Invalid license key format - must be at least 8 characters',
      });
    });

    test('should return 400 for invalid month format', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/test-license-123?month=invalid',
        headers: {
          'x-internal-api-key': testApiKey,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        error: 'Bad Request',
        message: 'Invalid month format - use YYYY-MM',
      });
    });

    test('should return usage data for valid request with empty usage', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/test-license-123',
        headers: {
          'x-internal-api-key': testApiKey,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('licenseKey', 'test-license-123');
      expect(body).toHaveProperty('month');
      expect(body.month).toMatch(/^\d{4}-\d{2}$/);
      expect(body).toHaveProperty('totalUnits', 0);
      expect(body).toHaveProperty('byEventType', {});
      expect(body).toHaveProperty('computeMinutes', 0);
      expect(body).toHaveProperty('apiCalls', 0);
    });

    test('should accept valid month parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/test-license-123?month=2026-03',
        headers: {
          'x-internal-api-key': testApiKey,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.month).toBe('2026-03');
    });

    test('should work without INTERNAL_API_KEY set (dev mode)', async () => {
      delete process.env.INTERNAL_API_KEY;

      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/test-license-123',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /internal/usage/:licenseKey/export', () => {
    test('should return 401 without API key', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/test-license-123/export',
      });

      expect(response.statusCode).toBe(401);
    });

    test('should return 400 without subscription_item param', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/test-license-123/export',
        headers: {
          'x-internal-api-key': testApiKey,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        error: 'Bad Request',
        message: 'subscription_item query param required for Stripe export',
      });
    });

    test('should return 400 for invalid month format', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/test-license-123/export?month=bad&subscription_item=si_123',
        headers: {
          'x-internal-api-key': testApiKey,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        error: 'Bad Request',
        message: 'Invalid month format - use YYYY-MM',
      });
    });

    test('should return Stripe-compatible format', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/test-license-123/export?subscription_item=si_test123',
        headers: {
          'x-internal-api-key': testApiKey,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('licenseKey', 'test-license-123');
      expect(body).toHaveProperty('period');
      expect(body).toHaveProperty('records');
      expect(Array.isArray(body.records)).toBe(true);
    });
  });

  describe('GET /internal/usage/:licenseKey/compute', () => {
    test('should return 401 without API key', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/test-license-123/compute',
      });

      expect(response.statusCode).toBe(401);
    });

    test('should return compute minutes for valid request', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/test-license-123/compute',
        headers: {
          'x-internal-api-key': testApiKey,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('licenseKey', 'test-license-123');
      expect(body).toHaveProperty('month');
      expect(body).toHaveProperty('computeMinutes', 0);
    });

    test('should accept month parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/test-license-123/compute?month=2026-02',
        headers: {
          'x-internal-api-key': testApiKey,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).month).toBe('2026-02');
    });
  });

  describe('GET /internal/usage/recent', () => {
    test('should return 401 without API key', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/recent',
      });

      expect(response.statusCode).toBe(401);
    });

    test('should return recent usage events', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/recent',
        headers: {
          'x-internal-api-key': testApiKey,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('events');
      expect(body).toHaveProperty('count');
      expect(Array.isArray(body.events)).toBe(true);
      expect(typeof body.count).toBe('number');
    });

    test('should respect limit parameter (max 100)', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/recent?limit=25',
        headers: {
          'x-internal-api-key': testApiKey,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.count).toBeLessThanOrEqual(25);
    });

    test('should cap limit at 100', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/internal/usage/recent?limit=500',
        headers: {
          'x-internal-api-key': testApiKey,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.count).toBeLessThanOrEqual(100);
    });
  });
});
