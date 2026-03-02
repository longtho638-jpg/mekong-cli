/**
 * Tests for api-key-manager: generate, hash, validate.
 */
import { generateApiKey, hashKey, validateKey } from './api-key-manager';
import type { ApiKeyRecord } from './types';

describe('generateApiKey', () => {
  it('returns raw key with algo_ prefix', () => {
    const result = generateApiKey('tenant1', ['backtest']);
    expect(result.raw).toMatch(/^algo_[0-9a-f]{32}$/);
  });

  it('raw key is exactly 37 characters (algo_ + 32 hex)', () => {
    const result = generateApiKey('tenant1', ['backtest']);
    expect(result.raw.length).toBe(37);
  });

  it('returns hashed key as 64-char hex (SHA-256)', () => {
    const result = generateApiKey('tenant1', ['backtest']);
    expect(result.hashed).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashed matches hashKey(raw)', () => {
    const result = generateApiKey('tenant1', ['backtest']);
    expect(result.hashed).toBe(hashKey(result.raw));
  });

  it('returns a record with correct tenantId and scopes', () => {
    const result = generateApiKey('acme', ['live:trade', 'live:monitor'], 'production key');
    expect(result.record.tenantId).toBe('acme');
    expect(result.record.scopes).toEqual(['live:trade', 'live:monitor']);
    expect(result.record.label).toBe('production key');
  });

  it('generates unique keys on each call', () => {
    const a = generateApiKey('t1', ['backtest']);
    const b = generateApiKey('t1', ['backtest']);
    expect(a.raw).not.toBe(b.raw);
    expect(a.keyId).not.toBe(b.keyId);
  });

  it('createdAt is a recent timestamp', () => {
    const before = Date.now();
    const result = generateApiKey('t1', ['backtest']);
    const after = Date.now();
    expect(result.record.createdAt).toBeGreaterThanOrEqual(before);
    expect(result.record.createdAt).toBeLessThanOrEqual(after);
  });
});

describe('hashKey', () => {
  it('produces deterministic output', () => {
    expect(hashKey('algo_abc')).toBe(hashKey('algo_abc'));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashKey('algo_aaa')).not.toBe(hashKey('algo_bbb'));
  });

  it('returns 64-char hex string', () => {
    expect(hashKey('algo_test')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('validateKey', () => {
  function makeStore(raw: string, tenantId: string, scopes: string[]): Map<string, ApiKeyRecord> {
    const { keyId, hashed } = generateApiKey(tenantId, scopes);
    // override with our raw key's hash
    const hash = hashKey(raw);
    const record: ApiKeyRecord = {
      keyId,
      tenantId,
      hashedKey: hash,
      scopes,
      createdAt: Date.now(),
    };
    return new Map([[keyId, record]]);
  }

  it('returns AuthContext for a valid key', () => {
    const raw = 'algo_' + 'a'.repeat(32);
    const store = makeStore(raw, 'tenant1', ['backtest']);
    const ctx = validateKey(raw, store);
    expect(ctx).not.toBeNull();
    expect(ctx?.tenantId).toBe('tenant1');
    expect(ctx?.scopes).toEqual(['backtest']);
  });

  it('returns null for wrong key', () => {
    const raw = 'algo_' + 'a'.repeat(32);
    const store = makeStore(raw, 'tenant1', ['backtest']);
    const ctx = validateKey('algo_' + 'b'.repeat(32), store);
    expect(ctx).toBeNull();
  });

  it('returns null for key without algo_ prefix', () => {
    const raw = 'algo_' + 'a'.repeat(32);
    const store = makeStore(raw, 'tenant1', ['backtest']);
    const ctx = validateKey('invalid_key_without_prefix', store);
    expect(ctx).toBeNull();
  });

  it('returns null for empty store', () => {
    const ctx = validateKey('algo_' + 'a'.repeat(32), new Map());
    expect(ctx).toBeNull();
  });

  it('returns correct keyId in AuthContext', () => {
    const { raw, keyId, record } = generateApiKey('t1', ['admin']);
    const store = new Map([[keyId, record]]);
    const ctx = validateKey(raw, store);
    expect(ctx?.keyId).toBe(keyId);
  });
});
