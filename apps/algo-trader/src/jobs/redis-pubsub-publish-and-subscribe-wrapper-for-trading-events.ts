/**
 * Redis Pub/Sub wrapper for cross-process trading event delivery.
 * Provides publish(channel, data) and subscribe(channel, cb) helpers.
 * Uses separate publisher and subscriber IORedis connections (required by Redis protocol).
 * Keeps SignalMesh as in-process bus; this module handles cross-process events only.
 */

import { logger } from '../utils/logger';
import {
  createRedisConnection,
  createSubscriberConnection,
  IRedisClient,
} from './ioredis-connection-factory-and-singleton-pool';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PubSubCallback = (data: unknown, channel: string) => void;

interface SubscriptionEntry {
  channel: string;
  callbacks: Set<PubSubCallback>;
}

// ─── State ───────────────────────────────────────────────────────────────────

let _publisher: IRedisClient | null = null;
let _subscriber: IRedisClient | null = null;
const _subscriptions = new Map<string, SubscriptionEntry>();
let _subscriberInitialized = false;

// ─── Internal helpers ────────────────────────────────────────────────────────

function getPublisher(): IRedisClient | null {
  if (!_publisher) {
    try {
      _publisher = createRedisConnection();
    } catch (err) {
      logger.warn(`[PubSub] Publisher unavailable: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return _publisher;
}

function getSubscriber(): IRedisClient | null {
  if (!_subscriber) {
    try {
      _subscriber = createSubscriberConnection();
    } catch (err) {
      logger.warn(`[PubSub] Subscriber unavailable: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return _subscriber;
}

function initSubscriberMessageHandler(): void {
  if (_subscriberInitialized) return;
  const sub = getSubscriber();
  if (!sub) return;

  sub.on('message', (channel: unknown, message: unknown) => {
    const ch = String(channel);
    const entry = _subscriptions.get(ch);
    if (!entry) return;

    let parsed: unknown = message;
    try {
      parsed = JSON.parse(String(message));
    } catch {
      // Not JSON — deliver raw string
    }

    for (const cb of entry.callbacks) {
      try {
        cb(parsed, ch);
      } catch (err) {
        logger.error(`[PubSub] Callback error on channel "${ch}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  });

  sub.on('error', (err: unknown) => {
    logger.error(`[PubSub] Subscriber error: ${err instanceof Error ? (err as Error).message : String(err)}`);
  });

  _subscriberInitialized = true;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Publish data to a Redis channel.
 * Data is JSON-serialised before sending.
 * Returns false if Redis is unavailable (non-fatal).
 */
export async function publish(channel: string, data: unknown): Promise<boolean> {
  const pub = getPublisher();
  if (!pub) {
    logger.warn(`[PubSub] Publish skipped (no Redis) channel="${channel}"`);
    return false;
  }

  try {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    const receivers = await pub.publish(channel, message);
    logger.debug?.(`[PubSub] Published to "${channel}" — ${receivers} receiver(s)`);
    return true;
  } catch (err) {
    logger.error(`[PubSub] publish error on "${channel}": ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

/**
 * Subscribe to a Redis channel.
 * Returns an unsubscribe function.
 * Multiple callbacks can be registered on the same channel.
 */
export function subscribe(channel: string, cb: PubSubCallback): () => void {
  initSubscriberMessageHandler();

  if (!_subscriptions.has(channel)) {
    _subscriptions.set(channel, { channel, callbacks: new Set() });

    const sub = getSubscriber();
    if (sub) {
      sub.subscribe(channel).catch((err) => {
        logger.warn(`[PubSub] Subscribe failed for "${channel}": ${err instanceof Error ? err.message : String(err)}`);
      });
    } else {
      logger.warn(`[PubSub] Subscribe skipped (no Redis) channel="${channel}"`);
    }
  }

  _subscriptions.get(channel)!.callbacks.add(cb);
  logger.info(`[PubSub] Subscribed to "${channel}" (total callbacks: ${_subscriptions.get(channel)!.callbacks.size})`);

  return () => unsubscribe(channel, cb);
}

/**
 * Remove a specific callback from a channel.
 * Channel-level subscription is cleaned up when no callbacks remain.
 */
export function unsubscribe(channel: string, cb: PubSubCallback): void {
  const entry = _subscriptions.get(channel);
  if (!entry) return;

  entry.callbacks.delete(cb);

  if (entry.callbacks.size === 0) {
    _subscriptions.delete(channel);
    logger.info(`[PubSub] Unsubscribed from "${channel}"`);
  }
}

/** Reset all state — for testing only */
export function _resetPubSubForTesting(): void {
  _publisher = null;
  _subscriber = null;
  _subscriptions.clear();
  _subscriberInitialized = false;
}

export function getActiveSubscriptions(): string[] {
  return Array.from(_subscriptions.keys());
}
