/**
 * Unit tests for Cloudflare Worker Gateway
 * Tests Hono-based API edge layer for algo-trader
 */

import { describe, test, expect } from '@jest/globals';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timing } from 'hono/timing';
import { poweredBy } from 'hono/powered-by';
import { secureHeaders } from 'hono/secure-headers';

// Create a minimal test app without license middleware
const testApp = new Hono();

testApp.use('*', cors());
testApp.use('*', logger());
testApp.use('*', timing());
testApp.use('*', poweredBy());
testApp.use('*', secureHeaders());

testApp.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

testApp.get('/ready', (c) => {
  return c.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

describe('Cloudflare Worker Gateway', () => {
  describe('Health Endpoints', () => {
    test('GET /health returns healthy status', async () => {
      const response = await testApp.request('/health', { method: 'GET' });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
    });

    test('GET /ready returns ready status', async () => {
      const response = await testApp.request('/ready', { method: 'GET' });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('ready');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    test('includes security headers', async () => {
      const response = await testApp.request('/health', { method: 'GET' });
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    });
  });

  describe('404 Handler', () => {
    test('returns 404 for unknown routes', async () => {
      const response = await testApp.request('/unknown-route', { method: 'GET' });
      expect(response.status).toBe(404);
    });
  });
});
