/**
 * Integration tests for Idempotency Middleware
 *
 * Tests the full middleware flow with mock Fastify request/response
 */

import {
  HybridIdempotencyStore,
  idempotencyMiddleware,
  createIdempotencyResponseHandler,
  resetDefaultIdempotencyStore,
} from '../../src/middleware/idempotency-middleware';

// Mock Fastify request/response
function createMockRequest(headers: Record<string, string> = {}, body?: any) {
  return {
    headers,
    body,
    url: '/api/orders',
    log: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  };
}

function createMockReply() {
  const reply = {
    sentData: null,
    send: jest.fn(function (data: any) {
      this.sentData = data;
      return this;
    }),
  };
  return reply;
}

describe('Idempotency Middleware Integration', () => {
  let store: HybridIdempotencyStore;

  beforeEach(() => {
    store = new HybridIdempotencyStore();
    resetDefaultIdempotencyStore();
  });

  afterEach(() => {
    store.clear();
    resetDefaultIdempotencyStore();
  });

  it('should allow request without Idempotency-Key header', async () => {
    const middleware = idempotencyMiddleware(store);
    const request = createMockRequest({ 'x-tenant-id': 'tenant-1' });
    const reply = createMockReply();

    await middleware(request, reply);

    // Should not block request
    expect(reply.send).not.toHaveBeenCalled();
  });

  it('should cache response for first request with Idempotency-Key', async () => {
    const middleware = idempotencyMiddleware(store);
    const responseHandler = createIdempotencyResponseHandler(store);

    const request = createMockRequest(
      { 'idempotency-key': 'order-123', 'x-tenant-id': 'tenant-1' },
      { order: 'test' }
    );
    const reply = createMockReply();

    // First request - should not return cached response
    await middleware(request, reply);
    expect(reply.send).not.toHaveBeenCalled();

    // Simulate response
    const responseBody = { success: true, orderId: 'abc-123' };
    await responseHandler(request, null as any, responseBody);

    // Verify stored
    const exists = await store.exists('order-123', 'tenant-1');
    expect(exists).toBe(true);
  });

  it('should return cached response for duplicate request', async () => {
    const middleware = idempotencyMiddleware(store);
    const responseHandler = createIdempotencyResponseHandler(store);

    const cachedResponse = { success: true, orderId: 'abc-123' };

    // First request - store response
    const request1 = createMockRequest(
      { 'idempotency-key': 'order-456', 'x-tenant-id': 'tenant-1' }
    );
    const reply1 = createMockReply();
    await middleware(request1, reply1);
    await responseHandler(request1, null as any, cachedResponse);

    // Duplicate request - should return cached response
    const request2 = createMockRequest(
      { 'idempotency-key': 'order-456', 'x-tenant-id': 'tenant-1' }
    );
    const reply2 = createMockReply();
    await middleware(request2, reply2);

    expect(reply2.send).toHaveBeenCalledWith(cachedResponse);
  });

  it('should isolate by tenant ID', async () => {
    const middleware = idempotencyMiddleware(store);
    const responseHandler = createIdempotencyResponseHandler(store);

    const tenant1Response = { tenant: 'tenant-1', data: 'A' };
    const tenant2Response = { tenant: 'tenant-2', data: 'B' };

    // Tenant 1 request
    const request1 = createMockRequest(
      { 'idempotency-key': 'shared-key', 'x-tenant-id': 'tenant-1' }
    );
    await middleware(request1, createMockReply());
    await responseHandler(request1, null as any, tenant1Response);

    // Tenant 2 request with same idempotency key
    const request2 = createMockRequest(
      { 'idempotency-key': 'shared-key', 'x-tenant-id': 'tenant-2' }
    );
    await middleware(request2, createMockReply());
    await responseHandler(request2, null as any, tenant2Response);

    // Verify tenant isolation
    const result1 = await store.get('shared-key', 'tenant-1');
    const result2 = await store.get('shared-key', 'tenant-2');

    expect(result1).toEqual(tenant1Response);
    expect(result2).toEqual(tenant2Response);
  });

  it('should use custom header name if provided', async () => {
    const customHeader = 'X-Idempotency-Key';
    const middleware = idempotencyMiddleware(store, { headerName: customHeader });
    const responseHandler = createIdempotencyResponseHandler(store, { headerName: customHeader });

    const response = { success: true };

    // Request with custom header
    const request = createMockRequest(
      { 'x-idempotency-key': 'custom-123', 'x-tenant-id': 'tenant-1' }
    );
    const reply = createMockReply();

    await middleware(request, reply);
    await responseHandler(request, null as any, response);

    // Duplicate with same custom header
    const request2 = createMockRequest(
      { 'x-idempotency-key': 'custom-123', 'x-tenant-id': 'tenant-1' }
    );
    const reply2 = createMockReply();
    await middleware(request2, reply2);

    expect(reply2.send).toHaveBeenCalledWith(response);
  });

  it('should handle race condition with processing marker', async () => {
    const middleware = idempotencyMiddleware(store);

    const request = createMockRequest(
      { 'idempotency-key': 'race-test', 'x-tenant-id': 'tenant-1' }
    );
    const reply = createMockReply();

    // First request sets processing marker
    await middleware(request, reply);

    // Before response is cached, check store
    const marker = await store.get('race-test', 'tenant-1');
    expect(marker).toEqual({ processing: true, timestamp: expect.any(Number) });
  });
});
