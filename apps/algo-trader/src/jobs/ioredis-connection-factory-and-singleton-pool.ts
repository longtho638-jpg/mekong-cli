/**
 * IORedis connection factory with singleton pool.
 * Creates shared Redis connections for BullMQ queues and pub/sub.
 * Falls back gracefully when Redis is unavailable (lazy connect).
 * Max pool: 10 connections. Default URL: REDIS_URL env or redis://localhost:6379.
 */

import { logger } from '../utils/logger';

// Types mirroring ioredis API — actual ioredis import resolves at runtime
export interface RedisOptions {
  maxRetriesPerRequest?: number | null;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
  connectTimeout?: number;
  retryStrategy?: (times: number) => number | null;
}

// Lightweight interface matching IORedis surface used in this codebase
export interface IRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: (string | number)[]): Promise<string | null>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  publish(channel: string, message: string): Promise<number>;
  subscribe(channel: string): Promise<void>;
  on(event: string, listener: (...args: unknown[]) => void): this;
  quit(): Promise<string>;
  duplicate(): IRedisClient;
  status: string;
  eval(script: string, numkeys: number, ...args: string[]): Promise<unknown>;
}

const DEFAULT_REDIS_URL = 'redis://localhost:6379';
const MAX_POOL_SIZE = 10;
const MAX_RETRIES = 3;

/** Singleton connection pool keyed by url */
const pool = new Map<string, IRedisClient>();

function buildRetryStrategy(times: number): number | null {
  if (times > MAX_RETRIES) {
    logger.warn(`[RedisFactory] Max retries (${MAX_RETRIES}) exceeded — giving up`);
    return null; // Stop retrying
  }
  const delay = Math.min(1000 * 2 ** (times - 1), 8000); // 1s, 2s, 4s, 8s cap
  logger.warn(`[RedisFactory] Redis retry #${times} in ${delay}ms`);
  return delay;
}

/**
 * Returns a singleton IORedis connection for the given URL.
 * Creates a new connection if none exists for that URL.
 * Connection is lazy — does not block startup if Redis is down.
 */
export function createRedisConnection(url?: string): IRedisClient {
  const redisUrl = url ?? process.env['REDIS_URL'] ?? DEFAULT_REDIS_URL;

  if (pool.has(redisUrl)) {
    return pool.get(redisUrl)!;
  }

  if (pool.size >= MAX_POOL_SIZE) {
    logger.warn(`[RedisFactory] Pool at capacity (${MAX_POOL_SIZE}), reusing first connection`);
    return pool.values().next().value as IRedisClient;
  }

  // Dynamic import so the module loads without ioredis installed in test env
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const IORedis = require('ioredis');

  const options: RedisOptions = {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 5000,
    retryStrategy: buildRetryStrategy,
  };

  const client: IRedisClient = new IORedis(redisUrl, options);

  client.on('connect', () => logger.info(`[Redis] Connected: ${redisUrl}`));
  client.on('error', (...args: unknown[]) => {
    const err = args[0];
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`[Redis] Error on ${redisUrl}: ${msg}`);
  });
  client.on('close', () => logger.warn(`[Redis] Connection closed: ${redisUrl}`));

  pool.set(redisUrl, client);
  logger.info(`[RedisFactory] Created connection (pool size: ${pool.size})`);

  return client;
}

/**
 * Creates a dedicated subscriber connection (separate from command connection).
 * IORedis connections in subscribe mode cannot issue other commands.
 */
export function createSubscriberConnection(url?: string): IRedisClient {
  const redisUrl = url ?? process.env['REDIS_URL'] ?? DEFAULT_REDIS_URL;
  const subscriberKey = `${redisUrl}:subscriber`;

  if (pool.has(subscriberKey)) {
    return pool.get(subscriberKey)!;
  }

  const base = createRedisConnection(url);
  const subscriber = base.duplicate();
  pool.set(subscriberKey, subscriber);
  return subscriber;
}

/** Close all connections — call on process shutdown */
export async function closeAllConnections(): Promise<void> {
  const closures = Array.from(pool.values()).map(c => c.quit().catch(() => null));
  await Promise.all(closures);
  pool.clear();
  logger.info('[RedisFactory] All connections closed');
}

/** Exposed for testing */
export function getPoolSize(): number {
  return pool.size;
}

export function clearPool(): void {
  pool.clear();
}
