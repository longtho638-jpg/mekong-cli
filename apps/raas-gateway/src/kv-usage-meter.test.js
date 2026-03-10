#!/usr/bin/env node

import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  getCurrentHourBucket,
  buildUsageKVKey,
  getEndpointType,
  getPayloadSize,
  trackUsage,
  getHourlyUsage,
  getUsageMetrics
} from './kv-usage-meter.js';

describe('kv-usage-meter', () => {
  describe('getCurrentHourBucket', () => {
    it('should return valid hour bucket format', () => {
      const bucket = getCurrentHourBucket();
      assert.match(bucket, /^\d{4}-\d{2}-\d{2}-\d{2}$/);
    });
  });

  describe('buildUsageKVKey', () => {
    it('should build valid KV key format', () => {
      const licenseKey = 'mk_test123';
      const hourBucket = '2026-03-08-10';
      const key = buildUsageKVKey(licenseKey, hourBucket);
      assert.strictEqual(key, `usage:${licenseKey}:${hourBucket}`);
    });
  });

  describe('getEndpointType', () => {
    it('should return correct endpoint type for known endpoints', () => {
      assert.strictEqual(getEndpointType('/v1/scan'), 'scan');
      assert.strictEqual(getEndpointType('/v1/analyze'), 'analyze');
      assert.strictEqual(getEndpointType('/v1/trade'), 'trade');
      assert.strictEqual(getEndpointType('/v1/backtest'), 'backtest');
      assert.strictEqual(getEndpointType('/v1/status'), 'status');
      assert.strictEqual(getEndpointType('/v1/config'), 'config');
    });

    it('should return "unknown" for unknown endpoints', () => {
      assert.strictEqual(getEndpointType('/v1/unknown'), 'unknown');
      assert.strictEqual(getEndpointType('/v1/abc123'), 'unknown');
    });
  });

  describe('getPayloadSize', () => {
    it('should return 0 for GET requests', async () => {
      const request = {
        method: 'GET',
        clone: () => ({
          arrayBuffer: async () => new ArrayBuffer(0)
        })
      };
      const size = await getPayloadSize(request);
      assert.strictEqual(size, 0);
    });

    it('should return 0 for HEAD requests', async () => {
      const request = {
        method: 'HEAD',
        clone: () => ({
          arrayBuffer: async () => new ArrayBuffer(0)
        })
      };
      const size = await getPayloadSize(request);
      assert.strictEqual(size, 0);
    });

    it('should calculate payload size correctly', async () => {
      const testData = JSON.stringify({ key: 'value', numbers: [1, 2, 3] });
      const buffer = new TextEncoder().encode(testData).buffer;

      const request = {
        method: 'POST',
        clone: () => ({
          arrayBuffer: async () => buffer
        })
      };
      const size = await getPayloadSize(request);
      assert.strictEqual(size, buffer.byteLength);
    });

    it('should handle errors when reading body', async () => {
      const request = {
        method: 'POST',
        clone: () => ({
          arrayBuffer: async () => {
            throw new Error('Failed to read body');
          }
        })
      };
      const size = await getPayloadSize(request);
      assert.strictEqual(size, 0);
    });
  });

  describe('KV operations', () => {
    function createMockEnv() {
      const store = new Map();
      return {
        RAAS_USAGE_KV: {
          store,
          get: async (key) => store.get(key) || null,
          put: async (key, value) => store.set(key, value),
          list: async ({ prefix }) => {
            const keys = Array.from(store.keys())
              .filter(key => key.startsWith(prefix))
              .map(key => ({ name: key }));
            return { keys };
          }
        }
      };
    }

    it('should track and retrieve usage metrics', async () => {
      const mockEnv = createMockEnv();
      const licenseKey = 'mk_test123';
      const tenantId = 'test-tenant';
      const tier = 'pro';
      const endpoint = 'scan';
      const method = 'GET';
      const payloadSize = 0;

      // Track usage
      await trackUsage(mockEnv, licenseKey, tenantId, tier, endpoint, method, payloadSize);

      // Get usage metrics
      const metrics = await getHourlyUsage(mockEnv, licenseKey);
      assert.strictEqual(metrics.length, 1);
      assert.strictEqual(metrics[0].licenseKey, licenseKey);
      assert.strictEqual(metrics[0].tenantId, tenantId);
      assert.strictEqual(metrics[0].tier, tier);
      assert.strictEqual(metrics[0].endpoint, endpoint);
      assert.strictEqual(metrics[0].method, method);
      assert.strictEqual(metrics[0].requestCount, 1);
      assert.strictEqual(metrics[0].payloadSize, payloadSize);
    });

    it('should aggregate multiple requests into same hour bucket', async () => {
      const mockEnv = createMockEnv();
      const licenseKey = 'mk_test456';
      const tenantId = 'test-tenant-2';
      const tier = 'free';
      const endpoint = 'analyze';
      const method = 'POST';
      const payloadSize = 1000;

      // Track multiple requests
      await trackUsage(mockEnv, licenseKey, tenantId, tier, endpoint, method, payloadSize);
      await trackUsage(mockEnv, licenseKey, tenantId, tier, endpoint, method, payloadSize);
      await trackUsage(mockEnv, licenseKey, tenantId, tier, endpoint, method, payloadSize);

      // Get usage metrics
      const metrics = await getHourlyUsage(mockEnv, licenseKey);
      assert.strictEqual(metrics.length, 1);
      assert.strictEqual(metrics[0].requestCount, 3);
      assert.strictEqual(metrics[0].payloadSize, payloadSize * 3);
    });

    it('should handle missing KV binding', async () => {
      const invalidEnv = {};

      // Should not throw an error
      const metrics = await getHourlyUsage(invalidEnv, 'mk_test789');
      assert.strictEqual(metrics.length, 0);
    });
  });
});

console.log('All tests passed!');
