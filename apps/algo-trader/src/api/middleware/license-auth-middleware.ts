/**
 * License Authentication Middleware for API Routes
 *
 * Enforces tier-based access control on premium endpoints.
 * Works with both Hono (Cloudflare Workers) and Fastify.
 */

import { LicenseService, LicenseTier, LicenseError } from '../../lib/raas-gate';
import type { Context as HonoContext, Next as HonoNext } from 'hono';
import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Extract license key from request headers
 * Priority: X-API-Key > Authorization Bearer > RAAS_LICENSE_KEY env
 */
function extractLicenseKey(headers: Record<string, string | undefined>): string | undefined {
  // Check X-API-Key header first
  const apiKey = headers['x-api-key'];
  if (apiKey) return apiKey;

  // Check Authorization Bearer token
  const authHeader = headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Fall back to environment variable
  return process.env.RAAS_LICENSE_KEY;
}

/**
 * Hono middleware for Cloudflare Workers
 * Usage: app.use('/api/premium/*', licenseMiddleware('pro'))
 */
export function licenseMiddleware(requiredTier: LicenseTier = LicenseTier.PRO) {
  return async (c: HonoContext, next: HonoNext) => {
    try {
      const headers: Record<string, string | undefined> = {};
      c.req.raw.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      const licenseKey = extractLicenseKey(headers);
      const licenseService = LicenseService.getInstance();

      // Validate license if not already cached
      if (licenseKey) {
        licenseService.validate(licenseKey);
      }

      // Check tier access
      if (!licenseService.hasTier(requiredTier)) {
        return c.json({
          error: 'License Required',
          message: `This endpoint requires ${requiredTier.toUpperCase()} license. Current tier: ${licenseService.getTier()}`,
          requiredTier,
          currentTier: licenseService.getTier(),
        }, 403);
      }

      await next();
    } catch (err) {
      if (err instanceof LicenseError) {
        const currentTier = LicenseService.getInstance().getTier();
        return c.json({
          error: 'License Required',
          message: err.message,
          requiredTier: err.requiredTier,
          currentTier,
        }, 403);
      }
      throw err;
    }
  };
}

/**
 * Fastify plugin for license authentication
 * Usage: fastify.register(licenseAuthPlugin, { requiredTier: 'pro' })
 */
export async function licenseAuthPlugin(
  fastify: any,
  options: { requiredTier?: LicenseTier }
) {
  const requiredTier = options.requiredTier ?? LicenseTier.PRO;

  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const headers = request.headers as Record<string, string | undefined>;
      const licenseKey = extractLicenseKey(headers);
      const licenseService = LicenseService.getInstance();

      // Validate license if not already cached
      if (licenseKey) {
        licenseService.validate(licenseKey);
      }

      // Check tier access
      if (!licenseService.hasTier(requiredTier)) {
        return reply.status(403).send({
          error: 'License Required',
          message: `This endpoint requires ${requiredTier.toUpperCase()} license. Current tier: ${licenseService.getTier()}`,
          requiredTier,
          currentTier: licenseService.getTier(),
        });
      }
    } catch (err) {
      if (err instanceof LicenseError) {
        const currentTier = LicenseService.getInstance().getTier();
        return reply.status(403).send({
          error: 'License Required',
          message: err.message,
          requiredTier: err.requiredTier,
          currentTier,
        });
      }
      throw err;
    }
  });
}

/**
 * Route-level decorator for Fastify
 * Wraps route handler with license check
 */
export function requireLicenseHandler<T extends (...args: any[]) => any>(
  handler: T,
  requiredTier: LicenseTier = LicenseTier.PRO
): T {
  return (async (...args: any[]) => {
    const request = args[0] as FastifyRequest;
    const reply = args[1] as FastifyReply;

    try {
      const headers = request.headers as Record<string, string | undefined>;
      const licenseKey = extractLicenseKey(headers);
      const licenseService = LicenseService.getInstance();

      if (licenseKey) {
        licenseService.validate(licenseKey);
      }

      if (!licenseService.hasTier(requiredTier)) {
        return reply.status(403).send({
          error: 'License Required',
          message: `This endpoint requires ${requiredTier.toUpperCase()} license.`,
          requiredTier,
          currentTier: licenseService.getTier(),
        });
      }

      return handler(...args);
    } catch (err) {
      if (err instanceof LicenseError) {
        return reply.status(403).send({
          error: 'License Required',
          message: err.message,
          requiredTier: err.requiredTier,
        });
      }
      throw err;
    }
  }) as T;
}

// Re-export for convenience
export { LicenseService, LicenseTier, LicenseError };
