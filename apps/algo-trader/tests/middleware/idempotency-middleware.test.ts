/**
 * Idempotency Middleware Tests
 */

import { IdempotencyStore, idempotencyMiddleware, createIdempotencyResponseHandler } from '../../src/middleware/idempotency-middleware';

describe('IdempotencyStore', () => {
  let store: IdempotencyStore;

  beforeEach(() => {
    store = new IdempotencyStore();
  });

  afterEach(() => {
    store.clear();
  });

  test('should return null for new event_id', async () => {
    const result = await store.check('event-123');
    expect(result).toBeNull();
  });

  test('should return cached result for duplicate event_id', async () => {
    const eventId = 'event-456';
    const expectedResult = { success: true, message: 'Processed' };

    await store.markProcessed(eventId, expectedResult);
    const result = await store.check(eventId);

    expect(result).toEqual(expectedResult);
  });

  test('should expire old records', async () => {
    const shortTtlStore = new IdempotencyStore(100); // 100ms TTL
    const eventId = 'event-expiry';

    await shortTtlStore.markProcessed(eventId, { success: true });

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    const result = await shortTtlStore.check(eventId);
    expect(result).toBeNull();
  });

  test('should cleanup expired records', async () => {
    const shortTtlStore = new IdempotencyStore(50);

    await shortTtlStore.markProcessed('event-1', { success: true });
    await shortTtlStore.markProcessed('event-2', { success: true });

    expect(shortTtlStore.size()).toBe(2);

    // Wait for expiry
    await new Promise(resolve => setTimeout(resolve, 100));

    const removed = shortTtlStore.cleanup();
    expect(removed).toBe(2);
    expect(shortTtlStore.size()).toBe(0);
  });
});

describe('idempotencyMiddleware', () => {
  let store: IdempotencyStore;
  let middleware: ReturnType<typeof idempotencyMiddleware>;

  beforeEach(() => {
    store = new IdempotencyStore();
    middleware = idempotencyMiddleware(store);
  });

  test('should skip non-webhook routes', async () => {
    const request = { url: '/api/v1/other', body: { event_id: 'event-123' } };
    const reply = { send: jest.fn() };

    await middleware(request, reply);

    expect(reply.send).not.toHaveBeenCalled();
  });

  test('should allow first webhook request through', async () => {
    const request = {
      url: '/api/v1/billing/webhook',
      body: { event_id: 'first-event' },
      log: { warn: jest.fn() },
    };
    const reply = { send: jest.fn() };

    await middleware(request, reply);

    expect(reply.send).not.toHaveBeenCalled();
  });

  test('should return cached result for duplicate event_id', async () => {
    const eventId = 'duplicate-event';
    const cachedResult = { success: true, message: 'Already processed' };

    // Pre-populate store
    await store.markProcessed(eventId, cachedResult);

    const request = {
      url: '/api/v1/billing/webhook',
      body: { event_id: eventId },
      log: { info: jest.fn() },
    };
    const reply = { send: jest.fn() };

    await middleware(request, reply);

    expect(request.log.info).toHaveBeenCalledWith(
      { eventId },
      'Duplicate webhook event — returning cached result'
    );
    expect(reply.send).toHaveBeenCalledWith(cachedResult);
  });

  test('should warn if event_id is missing', async () => {
    const request = {
      url: '/api/v1/billing/webhook',
      body: {},
      log: { warn: jest.fn() },
    };
    const reply = { send: jest.fn() };

    await middleware(request, reply);

    expect(request.log.warn).toHaveBeenCalledWith(
      { url: request.url },
      'Webhook missing event_id'
    );
  });
});

describe('createIdempotencyResponseHandler', () => {
  let store: IdempotencyStore;
  let handler: ReturnType<typeof createIdempotencyResponseHandler>;

  beforeEach(() => {
    store = new IdempotencyStore();
    handler = createIdempotencyResponseHandler(store);
  });

  test('should skip non-webhook routes', async () => {
    const request = { url: '/api/v1/other', body: { event_id: 'event-123' } };
    const payload = { success: true };

    const result = await handler(request, null as any, payload);

    expect(result).toEqual(payload);
    expect(await store.check('event-123')).toBeNull();
  });

  test('should cache webhook response', async () => {
    const eventId = 'response-test';
    const payload = { success: true, message: 'Webhook processed' };

    const request = {
      url: '/api/v1/billing/webhook',
      body: { event_id: eventId },
    };

    await handler(request, null as any, payload);

    const cachedResult = await store.check(eventId);
    expect(cachedResult).toEqual(payload);
  });

  test('should not cache if event_id is missing', async () => {
    const payload = { success: true };

    const request = {
      url: '/api/v1/billing/webhook',
      body: {},
    };

    await handler(request, null as any, payload);

    expect(store.size()).toBe(0);
  });
});

describe('Integration: Idempotency Flow', () => {
  let store: IdempotencyStore;
  let middleware: ReturnType<typeof idempotencyMiddleware>;
  let responseHandler: ReturnType<typeof createIdempotencyResponseHandler>;

  beforeEach(() => {
    store = new IdempotencyStore();
    middleware = idempotencyMiddleware(store);
    responseHandler = createIdempotencyResponseHandler(store);
  });

  test('should process first request and cache duplicate', async () => {
    const eventId = 'integration-test';
    const payload = { success: true, message: 'Processed' };

    // First request
    const request1 = {
      url: '/api/v1/billing/webhook',
      body: { event_id: eventId },
      log: { warn: jest.fn(), info: jest.fn() },
    };
    const reply1 = { send: jest.fn() };

    await middleware(request1, reply1);
    expect(reply1.send).not.toHaveBeenCalled();

    // Simulate response
    await responseHandler(request1, null as any, payload);

    // Second request (duplicate)
    const request2 = {
      url: '/api/v1/billing/webhook',
      body: { event_id: eventId },
      log: { warn: jest.fn(), info: jest.fn() },
    };
    const reply2 = { send: jest.fn() };

    await middleware(request2, reply2);

    expect(reply2.send).toHaveBeenCalledWith(payload);
    expect(request2.log.info).toHaveBeenCalled();
  });
});
