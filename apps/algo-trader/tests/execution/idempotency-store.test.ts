/**
 * Unit tests for RedisIdempotencyStore
 */

import { RedisIdempotencyStore, resetDefaultIdempotencyStore } from '../../src/execution/idempotency-store';
import { HybridIdempotencyStore, InMemoryIdempotencyStore } from '../../src/middleware/idempotency-middleware';

describe('InMemoryIdempotencyStore', () => {
  let store: InMemoryIdempotencyStore;

  beforeEach(() => {
    store = new InMemoryIdempotencyStore();
  });

  afterEach(() => {
    store.clear();
  });

  it('should return null for non-existent key', async () => {
    const result = await store.get('non-existent-key');
    expect(result).toBeNull();
  });

  it('should store and retrieve response', async () => {
    const response = { success: true, data: { id: 123 } };
    await store.set('test-key', response);
    const result = await store.get('test-key');
    expect(result).toEqual(response);
  });

  it('should check existence correctly', async () => {
    expect(await store.exists('new-key')).toBe(false);
    await store.set('existing-key', { data: 'test' });
    expect(await store.exists('existing-key')).toBe(true);
  });

  it('should respect TTL', async () => {
    const shortTtlStore = new InMemoryIdempotencyStore(100); // 100ms TTL
    await shortTtlStore.set('expiring-key', { data: 'test' });

    // Should exist immediately
    expect(await shortTtlStore.exists('expiring-key')).toBe(true);

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should be expired
    expect(await shortTtlStore.exists('expiring-key')).toBe(false);
    expect(await shortTtlStore.get('expiring-key')).toBeNull();
  });

  it('should return correct size', async () => {
    expect(store.size()).toBe(0);
    await store.set('key1', 'value1');
    expect(store.size()).toBe(1);
    await store.set('key2', 'value2');
    expect(store.size()).toBe(2);
  });
});

describe('HybridIdempotencyStore', () => {
  let store: HybridIdempotencyStore;

  beforeEach(() => {
    store = new HybridIdempotencyStore();
  });

  afterEach(() => {
    store.clear();
    resetDefaultIdempotencyStore();
  });

  it('should use in-memory fallback when Redis is unavailable', async () => {
    // Redis connection will fail, should fall back to memory
    const response = { order: 'test', amount: 100 };
    const success = await store.set('order-123', 'tenant-1', response);

    // Should succeed (using memory fallback)
    expect(success).toBe(true);

    const result = await store.get('order-123', 'tenant-1');
    expect(result).toEqual(response);
  });

  it('should handle tenant isolation', async () => {
    const tenant1Data = { tenant: 'tenant-1', data: 'A' };
    const tenant2Data = { tenant: 'tenant-2', data: 'B' };

    await store.set('shared-key', 'tenant-1', tenant1Data);
    await store.set('shared-key', 'tenant-2', tenant2Data);

    const result1 = await store.get('shared-key', 'tenant-1');
    const result2 = await store.get('shared-key', 'tenant-2');

    expect(result1).toEqual(tenant1Data);
    expect(result2).toEqual(tenant2Data);
  });

  it('should detect duplicate requests', async () => {
    const response = { status: 'completed', orderId: 'abc-123' };

    // First request - should store
    await store.set('idempotency-key-1', 'tenant-1', response);

    // Check existence
    const exists = await store.exists('idempotency-key-1', 'tenant-1');
    expect(exists).toBe(true);

    // Retrieve cached response
    const cached = await store.get('idempotency-key-1', 'tenant-1');
    expect(cached).toEqual(response);
  });
});

describe('Idempotency Middleware Integration', () => {
  it('should have correct default options', () => {
    const store = new HybridIdempotencyStore();
    expect(store).toBeDefined();
    expect(store.isUsingFallback()).toBe(false);
  });
});
