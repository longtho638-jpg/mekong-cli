/**
 * Fastify preHandler middleware: extract tenantId from JWT or API key,
 * enforce scope, attach AuthContext to request.
 *
 * Uses duck-typed interfaces to avoid hard dependency on fastify package
 * at typecheck time (fastify installed in Phase 3).
 *
 * Usage:
 *   fastify.addHook('preHandler', createAuthMiddleware(keyStore, limiter))
 *   fastify.get('/route', { preHandler: [requireScope('backtest')] }, handler)
 */
import { verifyToken } from './jwt-token-service';
import { validateKey } from './api-key-manager';
import { hasScope } from './scopes';
import type { ApiKeyRecord, AuthContext } from './types';
import type { SlidingWindowRateLimiter } from './sliding-window-rate-limiter';

/** Minimal duck-typed Fastify request surface used by this middleware. */
export interface AuthRequest {
  headers: Record<string, string | string[] | undefined>;
  authContext?: AuthContext;
}

/** Minimal duck-typed Fastify reply surface used by this middleware. */
export interface AuthReply {
  code(statusCode: number): AuthReply;
  header(key: string, value: string): AuthReply;
  send(payload: unknown): AuthReply;
}

const DEFAULT_RATE_LIMIT = 100;
const DEFAULT_WINDOW_MS = 60_000; // 1 minute

/**
 * Create a global preHandler that validates JWT or API key and
 * attaches authContext to every authenticated request.
 */
export function createAuthMiddleware(
  keyStore: Map<string, ApiKeyRecord>,
  limiter: SlidingWindowRateLimiter,
  rateLimit = DEFAULT_RATE_LIMIT,
  windowMs = DEFAULT_WINDOW_MS
) {
  return async function authMiddleware(
    request: AuthRequest,
    reply: AuthReply
  ): Promise<void> {
    const authHeader = request.headers['authorization'];
    const apiKeyHeader = request.headers['x-api-key'];

    let context: AuthContext | null = null;

    // 1. Try JWT Bearer token
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = verifyToken(token);
        context = {
          tenantId: payload.tenantId,
          scopes: payload.scopes,
          keyId: payload.keyId ?? `jwt:${payload.tenantId}`,
        };
      } catch {
        await reply.code(401).send({ error: 'Invalid or expired token' });
        return;
      }
    }

    // 2. Fallback to API key
    if (!context && typeof apiKeyHeader === 'string') {
      context = validateKey(apiKeyHeader, keyStore);
      if (!context) {
        await reply.code(401).send({ error: 'Invalid API key' });
        return;
      }
    }

    // 3. No credentials provided
    if (!context) {
      await reply.code(401).send({ error: 'Authentication required' });
      return;
    }

    // 4. Rate limit check
    const limitResult = await limiter.check(context.keyId, rateLimit, windowMs);
    const headers = limiter.headers(limitResult);
    Object.entries(headers).forEach(([k, v]) => reply.header(k, v));

    if (!limitResult.allowed) {
      await reply.code(429).send({ error: 'Rate limit exceeded' });
      return;
    }

    request.authContext = context;
  };
}

/**
 * Per-route scope enforcement factory.
 * Returns a preHandler that checks a single required scope.
 */
export function requireScope(requiredScope: string) {
  return async function scopeGuard(
    request: AuthRequest,
    reply: AuthReply
  ): Promise<void> {
    const ctx = request.authContext;
    if (!ctx) {
      await reply.code(401).send({ error: 'Authentication required' });
      return;
    }
    if (!hasScope(requiredScope, ctx.scopes)) {
      await reply.code(403).send({ error: `Scope '${requiredScope}' required` });
    }
  };
}
