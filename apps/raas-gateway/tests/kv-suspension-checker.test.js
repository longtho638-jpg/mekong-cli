/**
 * KV Suspension Checker Tests
 * Tests for Phase 6: KV-based Suspension Status Caching
 *
 * Run with: node --test tests/kv-suspension-checker.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { checkSuspensionStatus, syncSuspensionToKV, buildSuspensionStatusHeader } from '../src/kv-suspension-checker.js';

// ─────────────────────────────────────────────────────────────────────────────
// Mock KV namespace using Map
// ─────────────────────────────────────────────────────────────────────────────

class MockKVNamespace {
  constructor() {
    this.store = new Map();
  }

  async get(key, options) {
    const value = this.store.get(key);
    if (options?.type === 'json' && value) {
      return JSON.parse(value);
    }
    return value;
  }

  async put(key, value, options) {
    this.store.set(key, value);
    return undefined;
  }

  async delete(key) {
    this.store.delete(key);
    return undefined;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

// ── checkSuspensionStatus Tests ─────────────────────────────────────────────

test('checkSuspensionStatus should return blocked=false when KV not configured', async () => {
  const env = {};
  const result = await checkSuspensionStatus(env, 'tenant-001');

  assert.strictEqual(result.blocked, false);
  assert.strictEqual(result.status, null);
  assert.strictEqual(result.since, null);
  assert.strictEqual(result.reason, null);
});

test('checkSuspensionStatus should return blocked=false when tenant not in KV', async () => {
  const env = { SUSPENSION_CACHE: new MockKVNamespace() };
  const result = await checkSuspensionStatus(env, 'tenant-001');

  assert.strictEqual(result.blocked, false);
  assert.strictEqual(result.status, null);
});

test('checkSuspensionStatus should return blocked=true for SUSPENDED tenant', async () => {
  const env = { SUSPENSION_CACHE: new MockKVNamespace() };
  await env.SUSPENSION_CACHE.put('suspended:tenant-001', JSON.stringify({
    status: 'SUSPENDED',
    since: '2026-03-08T00:00:00.000Z',
    reason: 'Payment delinquency',
  }));

  const result = await checkSuspensionStatus(env, 'tenant-001');

  assert.strictEqual(result.blocked, true);
  assert.strictEqual(result.status, 'SUSPENDED');
  assert.strictEqual(result.since, '2026-03-08T00:00:00.000Z');
  assert.strictEqual(result.reason, 'Payment delinquency');
});

test('checkSuspensionStatus should return blocked=true for REVOKED tenant', async () => {
  const env = { SUSPENSION_CACHE: new MockKVNamespace() };
  await env.SUSPENSION_CACHE.put('suspended:tenant-002', JSON.stringify({
    status: 'REVOKED',
    since: '2026-03-01T00:00:00.000Z',
    reason: 'Extended non-payment',
  }));

  const result = await checkSuspensionStatus(env, 'tenant-002');

  assert.strictEqual(result.blocked, true);
  assert.strictEqual(result.status, 'REVOKED');
  assert.strictEqual(result.reason, 'Extended non-payment');
});

test('checkSuspensionStatus should use default reason when reason not provided', async () => {
  const env = { SUSPENSION_CACHE: new MockKVNamespace() };
  await env.SUSPENSION_CACHE.put('suspended:tenant-003', JSON.stringify({
    status: 'SUSPENDED',
    since: '2026-03-08T00:00:00.000Z',
  }));

  const result = await checkSuspensionStatus(env, 'tenant-003');

  assert.strictEqual(result.blocked, true);
  assert.strictEqual(result.reason, 'Payment delinquency');
});

// ── syncSuspensionToKV Tests ────────────────────────────────────────────────

test('syncSuspensionToKV should sync SUSPENDED status to KV', async () => {
  const env = { SUSPENSION_CACHE: new MockKVNamespace() };

  const success = await syncSuspensionToKV(env, 'tenant-003', 'SUSPENDED', 'Test reason');

  assert.strictEqual(success, true);
  const stored = await env.SUSPENSION_CACHE.get('suspended:tenant-003', { type: 'json' });
  assert.strictEqual(stored.status, 'SUSPENDED');
  assert.strictEqual(stored.reason, 'Test reason');
  assert.ok(stored.since !== undefined);
});

test('syncSuspensionToKV should sync REVOKED status to KV', async () => {
  const env = { SUSPENSION_CACHE: new MockKVNamespace() };

  const success = await syncSuspensionToKV(env, 'tenant-004', 'REVOKED');

  assert.strictEqual(success, true);
  const stored = await env.SUSPENSION_CACHE.get('suspended:tenant-004', { type: 'json' });
  assert.strictEqual(stored.status, 'REVOKED');
});

test('syncSuspensionToKV should use default reason when not provided', async () => {
  const env = { SUSPENSION_CACHE: new MockKVNamespace() };

  await syncSuspensionToKV(env, 'tenant-005', 'SUSPENDED');

  const stored = await env.SUSPENSION_CACHE.get('suspended:tenant-005', { type: 'json' });
  assert.strictEqual(stored.reason, 'Payment delinquency');
});

test('syncSuspensionToKV should remove tenant from KV when status is ACTIVE', async () => {
  const env = { SUSPENSION_CACHE: new MockKVNamespace() };

  await env.SUSPENSION_CACHE.put('suspended:tenant-005', JSON.stringify({
    status: 'SUSPENDED',
    since: '2026-03-08T00:00:00.000Z',
  }));

  const success = await syncSuspensionToKV(env, 'tenant-005', 'ACTIVE');

  assert.strictEqual(success, true);
  const stored = await env.SUSPENSION_CACHE.get('suspended:tenant-005');
  assert.strictEqual(stored, undefined);
});

test('syncSuspensionToKV should return false when KV not configured', async () => {
  const env = {};

  const success = await syncSuspensionToKV(env, 'tenant-006', 'SUSPENDED');

  assert.strictEqual(success, false);
});

// ── buildSuspensionStatusHeader Tests ───────────────────────────────────────

test('buildSuspensionStatusHeader should return active headers when not blocked', () => {
  const result = buildSuspensionStatusHeader({ blocked: false, status: null, reason: null });

  assert.strictEqual(result['X-Suspension-Status'], 'active');
  assert.strictEqual(result['X-Suspension-Reason'], '');
});

test('buildSuspensionStatusHeader should return blocked headers when blocked', () => {
  const result = buildSuspensionStatusHeader({
    blocked: true,
    status: 'SUSPENDED',
    reason: 'Payment delinquency',
  });

  assert.strictEqual(result['X-Suspension-Status'], 'blocked');
  assert.strictEqual(result['X-Suspension-Reason'], 'Payment delinquency');
});

test('buildSuspensionStatusHeader should handle empty reason', () => {
  const result = buildSuspensionStatusHeader({
    blocked: true,
    status: 'REVOKED',
    reason: '',
  });

  assert.strictEqual(result['X-Suspension-Status'], 'blocked');
  assert.strictEqual(result['X-Suspension-Reason'], '');
});
