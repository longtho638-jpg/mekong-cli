/**
 * Tests for redis-pubsub-publish-and-subscribe-wrapper-for-trading-events.ts
 * Verifies publish/subscribe roundtrip, multi-callback dispatch, and unsubscribe.
 * Uses an in-process EventEmitter-based mock for IORedis subscriber mode.
 */

import { EventEmitter } from 'events';

// ─── IORedis mock with pub/sub support ───────────────────────────────────────

const messageEmitter = new EventEmitter();

const mockPublish = jest.fn().mockImplementation(
  (_channel: string, _msg: string) => Promise.resolve(1)
);

const mockSubscribe = jest.fn().mockImplementation(
  (channel: string) => {
    // Track subscribed channels (real ioredis transitions to subscriber mode)
    void channel;
    return Promise.resolve(undefined);
  }
);

function makeMockRedis() {
  return {
    status: 'ready',
    on: jest.fn().mockImplementation((event: string, listener: (...args: unknown[]) => void) => {
      messageEmitter.on(event, listener);
      return this;
    }),
    quit: jest.fn().mockResolvedValue('OK'),
    duplicate: jest.fn().mockImplementation(makeMockRedis),
    publish: mockPublish,
    subscribe: mockSubscribe,
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(60),
    del: jest.fn().mockResolvedValue(1),
    eval: jest.fn().mockResolvedValue([1, 60]),
  };
}

jest.mock('ioredis', () => jest.fn().mockImplementation(makeMockRedis), { virtual: true });

// ─── Helper: simulate Redis delivering a message ──────────────────────────────

function simulateRedisMessage(channel: string, message: string): void {
  messageEmitter.emit('message', channel, message);
}

// ─── Import after mocks ───────────────────────────────────────────────────────

import {
  publish,
  subscribe,
  unsubscribe,
  getActiveSubscriptions,
  _resetPubSubForTesting,
} from '../../src/jobs/redis-pubsub-publish-and-subscribe-wrapper-for-trading-events';

describe('Redis PubSub wrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    messageEmitter.removeAllListeners();
    _resetPubSubForTesting();
  });

  // ─── publish() ──────────────────────────────────────────────────────────────

  describe('publish()', () => {
    it('calls redis.publish with JSON-serialised data', async () => {
      const data = { signal: 'BUY', pair: 'BTC/USDT' };
      await publish('signal:tenant-1', data);

      expect(mockPublish).toHaveBeenCalledTimes(1);
      const [channel, message] = mockPublish.mock.calls[0] as [string, string];
      expect(channel).toBe('signal:tenant-1');
      expect(JSON.parse(message)).toEqual(data);
    });

    it('returns true on successful publish', async () => {
      const result = await publish('signal:tenant-1', { x: 1 });
      expect(result).toBe(true);
    });

    it('returns false when Redis publish throws', async () => {
      mockPublish.mockRejectedValueOnce(new Error('Redis down'));
      const result = await publish('signal:tenant-1', { x: 1 });
      expect(result).toBe(false);
    });

    it('publishes plain strings without double-encoding', async () => {
      await publish('channel', 'hello');
      const [, message] = mockPublish.mock.calls[0] as [string, string];
      expect(message).toBe('hello');
    });
  });

  // ─── subscribe() ────────────────────────────────────────────────────────────

  describe('subscribe()', () => {
    it('registers channel and invokes callback on simulated message', () => {
      const cb = jest.fn();
      subscribe('trade:tenant-2', cb);

      simulateRedisMessage('trade:tenant-2', JSON.stringify({ price: 50000 }));

      expect(cb).toHaveBeenCalledTimes(1);
      const [data, channel] = cb.mock.calls[0] as [unknown, string];
      expect(channel).toBe('trade:tenant-2');
      expect((data as { price: number }).price).toBe(50000);
    });

    it('calls redis.subscribe for a new channel', () => {
      subscribe('backtest:done:t1', jest.fn());
      expect(mockSubscribe).toHaveBeenCalledWith('backtest:done:t1');
    });

    it('does NOT call redis.subscribe again for same channel', () => {
      subscribe('backtest:done:t1', jest.fn());
      subscribe('backtest:done:t1', jest.fn());
      expect(mockSubscribe).toHaveBeenCalledTimes(1);
    });

    it('dispatches to multiple callbacks on the same channel', () => {
      const cb1 = jest.fn();
      const cb2 = jest.fn();
      subscribe('signal:tenant-3', cb1);
      subscribe('signal:tenant-3', cb2);

      simulateRedisMessage('signal:tenant-3', '{"type":"SELL"}');

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });

    it('returns an unsubscribe function', () => {
      const cb = jest.fn();
      const unsub = subscribe('trade:t4', cb);
      expect(typeof unsub).toBe('function');
    });

    it('tracks active subscriptions', () => {
      subscribe('signal:tenant-5', jest.fn());
      subscribe('trade:tenant-5', jest.fn());
      const active = getActiveSubscriptions();
      expect(active).toContain('signal:tenant-5');
      expect(active).toContain('trade:tenant-5');
    });
  });

  // ─── unsubscribe() ───────────────────────────────────────────────────────────

  describe('unsubscribe()', () => {
    it('stops callback from receiving messages after unsubscribe', () => {
      const cb = jest.fn();
      const unsub = subscribe('signal:t6', cb);
      unsub();

      simulateRedisMessage('signal:t6', '{"x":1}');
      expect(cb).not.toHaveBeenCalled();
    });

    it('removes channel from active subscriptions when last callback removed', () => {
      const cb = jest.fn();
      subscribe('signal:t7', cb);
      expect(getActiveSubscriptions()).toContain('signal:t7');

      unsubscribe('signal:t7', cb);
      expect(getActiveSubscriptions()).not.toContain('signal:t7');
    });

    it('keeps channel active when other callbacks remain', () => {
      const cb1 = jest.fn();
      const cb2 = jest.fn();
      subscribe('trade:t8', cb1);
      subscribe('trade:t8', cb2);

      unsubscribe('trade:t8', cb1);
      expect(getActiveSubscriptions()).toContain('trade:t8');

      simulateRedisMessage('trade:t8', '"msg"');
      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });
});
