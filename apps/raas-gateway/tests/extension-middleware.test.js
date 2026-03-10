/**
 * Extension Middleware Tests
 * Tests for extension-validator.js and gateway integration
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import {
  validateExtensionFlags,
  getExtensionStatus,
  trackExtensionUsage,
  setExtensionStatus
} from '../src/extension-validator.js';

// Mock KV cache for testing
class MockKVCache {
  constructor() {
    this.store = new Map();
  }

  async get(key, options) {
    const value = this.store.get(key);
    if (!value) return null;
    if (options?.type === 'json') {
      return JSON.parse(value);
    }
    return value;
  }

  async put(key, value, options) {
    this.store.set(key, value);
    return Promise.resolve();
  }

  async delete(key) {
    this.store.delete(key);
    return Promise.resolve();
  }
}

describe('Extension Validator', () => {
  let mockEnv;

  before(() => {
    mockEnv = {
      SUSPENSION_CACHE: new MockKVCache()
    };
  });

  describe('validateExtensionFlags', () => {
    it('should allow pro tier for algo-trader extension', () => {
      const result = validateExtensionFlags(null, mockEnv, 'tenant-123', 'pro', 'algo-trader');
      assert.strictEqual(result.allowed, true);
    });

    it('should allow enterprise tier for algo-trader extension', () => {
      const result = validateExtensionFlags(null, mockEnv, 'tenant-123', 'enterprise', 'algo-trader');
      assert.strictEqual(result.allowed, true);
    });

    it('should deny free tier for algo-trader extension', () => {
      const result = validateExtensionFlags(null, mockEnv, 'tenant-123', 'free', 'algo-trader');
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.required, 'algo-trader');
      assert.strictEqual(result.reason, 'requires_pro_or_enterprise_tier');
    });

    it('should deny trial tier for algo-trader extension', () => {
      const result = validateExtensionFlags(null, mockEnv, 'tenant-123', 'trial', 'algo-trader');
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.required, 'algo-trader');
      assert.strictEqual(result.reason, 'requires_pro_or_enterprise_tier');
    });

    it('should allow service tier (bypass)', () => {
      const result = validateExtensionFlags(null, mockEnv, 'tenant-123', 'service', 'algo-trader');
      assert.strictEqual(result.allowed, true);
    });

    it('should deny unknown extension', () => {
      const result = validateExtensionFlags(null, mockEnv, 'tenant-123', 'pro', 'unknown-extension');
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.reason, 'unknown_extension');
    });

    it('should deny agi-auto-pilot for pro tier (enterprise only)', () => {
      const result = validateExtensionFlags(null, mockEnv, 'tenant-123', 'pro', 'agi-auto-pilot');
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.required, 'agi-auto-pilot');
      assert.strictEqual(result.reason, 'requires_enterprise_tier');
    });

    it('should allow agi-auto-pilot for enterprise tier', () => {
      const result = validateExtensionFlags(null, mockEnv, 'tenant-123', 'enterprise', 'agi-auto-pilot');
      assert.strictEqual(result.allowed, true);
    });
  });

  describe('getExtensionStatus', () => {
    it('should return default permitted status when KV not configured', async () => {
      const emptyEnv = {};
      const result = await getExtensionStatus(emptyEnv, 'tenant-123', 'algo-trader');
      assert.strictEqual(result.permitted, true);
      assert.strictEqual(result.status, 'none');
      assert.strictEqual(result.usage, 0);
      assert.strictEqual(result.limit, 1000);
      assert.strictEqual(result.resetAt, null);
    });

    it('should return default status for new tenant', async () => {
      const result = await getExtensionStatus(mockEnv, 'new-tenant', 'algo-trader');
      assert.strictEqual(result.permitted, true);
      assert.strictEqual(result.status, 'none');
      assert.strictEqual(result.usage, 0);
      assert.strictEqual(result.limit, 1000);
    });

    it('should return stored status for existing tenant', async () => {
      // First set a status
      await setExtensionStatus(mockEnv, 'tenant-with-status', 'algo-trader', true, 'approved', 500);

      const result = await getExtensionStatus(mockEnv, 'tenant-with-status', 'algo-trader');
      assert.strictEqual(result.permitted, true);
      assert.strictEqual(result.status, 'approved');
      assert.strictEqual(result.limit, 500);
      assert.ok(result.resetAt !== null);
    });
  });

  describe('trackExtensionUsage', () => {
    it('should track usage without idempotency key', async () => {
      const result = await trackExtensionUsage(mockEnv, 'usage-tenant', 'algo-trader', 1);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.duplicate, undefined);
      assert.strictEqual(result.usage, 1);
      assert.strictEqual(result.limit, 1000);
      assert.strictEqual(result.exceeded, false);
    });

    it('should increment usage on subsequent calls', async () => {
      await trackExtensionUsage(mockEnv, 'usage-tenant-2', 'algo-trader', 5);
      const result = await trackExtensionUsage(mockEnv, 'usage-tenant-2', 'algo-trader', 3);
      assert.strictEqual(result.usage, 8);
    });

    it('should detect duplicate request with idempotency key', async () => {
      const idempotencyKey = 'unique-key-123';
      const firstResult = await trackExtensionUsage(mockEnv, 'idempotent-tenant', 'algo-trader', 1, idempotencyKey);
      const secondResult = await trackExtensionUsage(mockEnv, 'idempotent-tenant', 'algo-trader', 1, idempotencyKey);

      assert.strictEqual(firstResult.duplicate, undefined);
      assert.strictEqual(secondResult.duplicate, true);
    });

    it('should detect usage exceeded', async () => {
      // Set a low limit
      await setExtensionStatus(mockEnv, 'limit-tenant', 'algo-trader', true, 'approved', 10);

      // Track 12 requests
      for (let i = 0; i < 12; i++) {
        await trackExtensionUsage(mockEnv, 'limit-tenant', 'algo-trader', 1);
      }

      const result = await trackExtensionUsage(mockEnv, 'limit-tenant', 'algo-trader', 1);
      assert.strictEqual(result.exceeded, true);
      assert.strictEqual(result.usage, 13);
    });
  });

  describe('setExtensionStatus', () => {
    it('should set extension status to approved', async () => {
      const result = await setExtensionStatus(mockEnv, 'set-status-tenant', 'algo-trader', true, 'approved', 2000);
      assert.strictEqual(result, true);

      const status = await getExtensionStatus(mockEnv, 'set-status-tenant', 'algo-trader');
      assert.strictEqual(status.permitted, true);
      assert.strictEqual(status.status, 'approved');
      assert.strictEqual(status.limit, 2000);
    });

    it('should set extension status to denied', async () => {
      const result = await setExtensionStatus(mockEnv, 'denied-tenant', 'algo-trader', false, 'denied', 0);
      assert.strictEqual(result, true);

      const status = await getExtensionStatus(mockEnv, 'denied-tenant', 'algo-trader');
      assert.strictEqual(status.permitted, false);
      assert.strictEqual(status.status, 'denied');
    });

    it('should set extension status to pending', async () => {
      const result = await setExtensionStatus(mockEnv, 'pending-tenant', 'algo-trader', true, 'pending', 500);
      assert.strictEqual(result, true);

      const status = await getExtensionStatus(mockEnv, 'pending-tenant', 'algo-trader');
      assert.strictEqual(status.status, 'pending');
    });

    it('should fail when KV not configured', async () => {
      const emptyEnv = {};
      const result = await setExtensionStatus(emptyEnv, 'no-kv-tenant', 'algo-trader', true, 'approved');
      assert.strictEqual(result, false);
    });
  });
});
