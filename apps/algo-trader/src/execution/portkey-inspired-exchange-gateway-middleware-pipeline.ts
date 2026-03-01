/**
 * Portkey-inspired Gateway Middleware Pipeline for Exchange Routing.
 * Composable middleware chain: request → [...middlewares] → exchange → response.
 * Supports: logging, caching, retry, fallback, budget, latency tracking.
 */

import { logger } from '../utils/logger';

// --- Types ---

export interface GatewayContext {
  tenantId: string;
  strategyId: string;
  exchangeId: string;
  operation: string; // 'fetchTicker', 'createOrder', etc.
  params: Record<string, unknown>;
  metadata: Record<string, unknown>;
  startTime: number;
}

export interface GatewayResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  latency: number;
  exchangeId: string;
  cached: boolean;
  retries: number;
}

export type MiddlewareFn = (
  ctx: GatewayContext,
  next: (newCtx?: GatewayContext) => Promise<GatewayResponse>
) => Promise<GatewayResponse>;

// --- Gateway ---

export class ExchangeGateway {
  private middlewares: MiddlewareFn[] = [];
  private handler: (ctx: GatewayContext) => Promise<GatewayResponse>;

  constructor(handler: (ctx: GatewayContext) => Promise<GatewayResponse>) {
    this.handler = handler;
  }

  /** Append a middleware to the chain (FIFO order). */
  use(middleware: MiddlewareFn): this {
    this.middlewares.push(middleware);
    return this;
  }

  /** Execute the full middleware chain then the core handler. */
  async execute(ctx: Omit<GatewayContext, 'startTime'>): Promise<GatewayResponse> {
    const fullCtx: GatewayContext = { ...ctx, startTime: Date.now() };

    const compose = (index: number, currentCtx: GatewayContext): (() => Promise<GatewayResponse>) => {
      if (index < this.middlewares.length) {
        return async (newCtx?: GatewayContext) => {
          const effectiveCtx = newCtx || currentCtx;
          return this.middlewares[index](effectiveCtx, (nextCtx) => compose(index + 1, nextCtx || effectiveCtx)());
        };
      }
      return () => this.handler(currentCtx);
    };

    return compose(0, fullCtx)();
  }
}

// --- Built-in Middlewares ---

/** Logs request start/end with latency and outcome. */
export function loggingMiddleware(): MiddlewareFn {
  return async (ctx, next) => {
    logger.info(`[Gateway] → ${ctx.operation} on ${ctx.exchangeId} [Tenant:${ctx.tenantId}]`);
    const res = await next();
    const status = res.success ? 'OK' : `ERR: ${res.error}`;
    const cachedStr = res.cached ? ' (cached)' : '';
    const retryStr = res.retries > 0 ? ` (retries: ${res.retries})` : '';
    logger.info(`[Gateway] ← ${ctx.operation} ${status}${cachedStr}${retryStr} in ${res.latency}ms`);
    return res;
  };
}

/**
 * Retries failed requests with exponential backoff.
 * Inspired by Portkey's retry strategy.
 */
export function retryMiddleware(maxRetries = 3, initialDelayMs = 200, backoffFactor = 2): MiddlewareFn {
  return async (ctx, next) => {
    let attempt = 0;
    let lastResponse: GatewayResponse | null = null;

    while (attempt <= maxRetries) {
      const res = await next();
      if (res.success) {
        return { ...res, retries: attempt };
      }
      lastResponse = res;
      attempt++;

      if (attempt <= maxRetries) {
        const delay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
        logger.warn(`[Retry] Attempt ${attempt}/${maxRetries} for ${ctx.operation} on ${ctx.exchangeId} in ${delay}ms`);
        await new Promise<void>(resolve => setTimeout(resolve, delay));
      }
    }

    return { ...(lastResponse as GatewayResponse), retries: attempt - 1 };
  };
}

/**
 * Fallback middleware: if the primary exchange fails, try alternative exchanges.
 * Inspired by Portkey's fallback pattern.
 */
export function fallbackMiddleware(fallbacks: string[]): MiddlewareFn {
  return async (ctx, next) => {
    let res = await next();
    if (res.success || fallbacks.length === 0) return res;

    logger.warn(`[Fallback] Primary ${ctx.exchangeId} failed (${res.error}), trying fallbacks: ${fallbacks.join(', ')}`);

    for (const fallbackId of fallbacks) {
      if (fallbackId === ctx.exchangeId) continue;

      logger.info(`[Fallback] Trying ${fallbackId} for ${ctx.operation}...`);
      const fallbackCtx = { ...ctx, exchangeId: fallbackId };

      const fallbackRes = await next(fallbackCtx);
      if (fallbackRes.success) {
        logger.info(`[Fallback] Success on ${fallbackId}`);
        return { ...fallbackRes, exchangeId: fallbackId };
      }
      res = fallbackRes; // Keep last failure
    }

    return res;
  };
}

/** Caches successful GET-style responses. */
export function cachingMiddleware(ttlMs = 5000): MiddlewareFn {
  const cache = new Map<string, { res: GatewayResponse; expires: number }>();
  const MUTABLE_OPS = new Set(['createOrder', 'cancelOrder', 'editOrder', 'withdraw']);

  return async (ctx, next) => {
    if (MUTABLE_OPS.has(ctx.operation)) return next();

    const key = `${ctx.exchangeId}:${ctx.operation}:${JSON.stringify(ctx.params)}`;
    const now = Date.now();
    const hit = cache.get(key);

    if (hit && hit.expires > now) {
      return { ...hit.res, cached: true };
    }

    const res = await next();
    if (res.success) {
      cache.set(key, { res, expires: now + ttlMs });
    }
    return res;
  };
}

/** Tracks and enforces daily budget per strategy. */
export function budgetMiddleware(maxDailyUsd: number): MiddlewareFn {
  const spendTracker = new Map<string, { spent: number; resetAt: number }>();
  const DAY_MS = 86_400_000;

  return async (ctx, next) => {
    const key = `${ctx.tenantId}:${ctx.strategyId}`;
    const now = Date.now();

    let record = spendTracker.get(key);
    if (!record || now >= record.resetAt) {
      record = { spent: 0, resetAt: now + DAY_MS };
      spendTracker.set(key, record);
    }

    const estimatedCost = (ctx.metadata.estimatedCostUsd as number) || 0;

    if (record.spent + estimatedCost > maxDailyUsd) {
      logger.warn(`[Budget] Blocked ${ctx.operation} — Daily limit $${maxDailyUsd} reached for ${key}`);
      return {
        success: false,
        error: `Daily budget exceeded for strategy ${ctx.strategyId}`,
        latency: 0,
        exchangeId: ctx.exchangeId,
        cached: false,
        retries: 0
      };
    }

    const res = await next();
    if (res.success) {
      record.spent += estimatedCost;
    }
    return res;
  };
}

/** Measures wall-clock latency for the request. */
export function latencyTrackingMiddleware(slowThresholdMs = 1000): MiddlewareFn {
  return async (ctx, next) => {
    const t0 = Date.now();
    const res = await next();
    const latency = Date.now() - t0;

    if (latency > slowThresholdMs) {
      logger.warn(`[Latency] Slow call: ${ctx.operation} on ${ctx.exchangeId} took ${latency}ms`);
    }

    return { ...res, latency };
  };
}
