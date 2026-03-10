/**
 * Rate Limiting Middleware for Hono and Fastify
 *
 * Integrates rate limiting with license-based tier enforcement.
 */

import { checkRateLimit, getRateLimitHeaders, getRateLimitConfig } from './rate-limiter';
import { LicenseService, LicenseTier } from './raas-gate';
import type { Context as HonoContext, Next as HonoNext } from 'hono';
import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Extract client identifier from request
 * Priority: License Key > X-API-Key > IP Address
 */
function getClientIdentifier(c: HonoContext): string {
  // Try to get license key from headers
  const apiKey = c.req.header('x-api-key');
  if (apiKey) return `apikey:${apiKey}`;

  const authHeader = c.req.header('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return `bearer:${authHeader.substring(7)}`;
  }

  // Fall back to IP address
  const ip = c.req.header('x-forwarded-for')?.split(',')[0] || 'unknown';
  return `ip:${ip}`;
}

/**
 * Extract client identifier from Fastify request
 */
function getClientIdentifierFastify(request: FastifyRequest): string {
  const apiKey = request.headers['x-api-key'] as string | undefined;
  if (apiKey) return `apikey:${apiKey}`;

  const authHeader = request.headers['authorization'] as string | undefined;
  if (authHeader?.startsWith('Bearer ')) {
    return `bearer:${authHeader.substring(7)}`;
  }

  const ip = request.headers['x-forwarded-for'] as string | undefined;
  return `ip:${ip?.split(',')[0] || 'unknown'}`;
}

/**
 * Hono middleware for rate limiting
 * Usage: app.use('/api/*', rateLimitMiddleware())
 */
export function rateLimitMiddleware() {
  return async (c: HonoContext, next: HonoNext) => {
    const clientId = getClientIdentifier(c);
    const licenseService = LicenseService.getInstance();

    // Get current tier for rate limit config
    const tier = licenseService.getTier();

    // Check rate limit
    const allowed = checkRateLimit(clientId, tier);

    if (!allowed) {
      const headers = getRateLimitHeaders(clientId);
      return c.json(
        {
          error: 'Rate Limit Exceeded',
          message: 'Too many requests. Please slow down.',
          retryAfter: 60,
        },
        429,
        {
          ...headers,
          'Retry-After': '60',
        }
      );
    }

    // Add rate limit headers to response
    const headers = getRateLimitHeaders(clientId);
    c.header('X-RateLimit-Limit', headers['X-RateLimit-Limit']);
    c.header('X-RateLimit-Remaining', headers['X-RateLimit-Remaining']);
    c.header('X-RateLimit-Hour-Limit', headers['X-RateLimit-Hour-Limit']);
    c.header('X-RateLimit-Hour-Remaining', headers['X-RateLimit-Hour-Remaining']);

    await next();
  };
}
