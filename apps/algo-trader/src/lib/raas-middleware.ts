/**
 * RaaS License Middleware - Framework Agnostic
 *
 * Universal middleware compatible with Express, Next.js, Fastify, Hono, etc.
 *
 * USAGE EXPRESS:
 *   import { expressLicenseMiddleware } from './raas-middleware';
 *   app.use('/api/premium/*', expressLicenseMiddleware('PRO'));
 *
 * USAGE NEXT.JS (Pages):
 *   import { withLicenseGuard } from './raas-middleware';
 *   export default withLicenseGuard(async (req, res) => {...}, 'PRO');
 *
 * USAGE NEXT.JS (App Router):
 *   import { nextJsMiddleware } from './raas-middleware';
 *   export default function middleware(req) { return nextJsMiddleware(req); }
 *
 * USAGE FASTIFY:
 *   import { fastifyLicensePlugin } from './raas-middleware';
 *   server.register(fastifyLicensePlugin, { tier: 'PRO' });
 *
 * USAGE HONO:
 *   import { honoLicenseMiddleware } from './raas-middleware';
 *   app.use('/*', honoLicenseMiddleware('PRO'));
 */

import { LicenseService, LicenseTier, LicenseError, LicenseValidation } from './raas-gate';
import { raasKVClient } from './raas-gateway-kv-client';
import { logger } from '../utils/logger';

export interface MiddlewareContext {
  getHeader: (name: string) => string | undefined;
  getIP: () => string | undefined;
  deny: (code: number, body: Record<string, unknown>) => void;
  allow: () => void;
}

export interface NextMiddlewareResult {
  headers?: Record<string, string>;
  response?: { status: number; body: Record<string, unknown> };
}

/**
 * Core license validation logic
 */
async function validateLicenseCore(
  getHeader: (name: string) => string | undefined,
  getIP: () => string | undefined,
  requiredTier: LicenseTier
): Promise<{ valid: boolean; validation?: LicenseValidation; error?: unknown }> {
  const key = getHeader('x-api-key') ||
              getHeader('authorization')?.replace('Bearer ', '') ||
              process.env.RAAS_LICENSE_KEY;

  const ip = getIP() || '';
  const licenseService = LicenseService.getInstance();

  try {
    const validation = await licenseService.validate(key, ip);

    if (!validation.valid) {
      return { valid: false, error: { type: 'unlicensed', validation } };
    }

    const tierOrder: Record<string, number> = { [LicenseTier.FREE]: 0, [LicenseTier.PRO]: 1, [LicenseTier.ENTERPRISE]: 2 };
    if (tierOrder[validation.tier] < tierOrder[requiredTier]) {
      return { valid: false, error: { type: 'insufficient_tier', validation, requiredTier } };
    }

    // NEW: Check suspension flag from KV
    const suspensionCheck = key ? await raasKVClient.isSuspended(key) : { suspended: false };
    if (suspensionCheck.suspended) {
      return {
        valid: false,
        error: {
          type: 'suspended',
          reason: suspensionCheck.reason,
          suspendedAt: suspensionCheck.suspendedAt,
        },
      };
    }

    return { valid: true, validation };
  } catch (error) {
    if (error instanceof LicenseError) {
      return { valid: false, error: { type: 'license_error', error } };
    }
    // KV error or other unexpected error - log but don't block
    logger.warn('[RaaS Middleware] License validation error', { error });
    throw error;
  }
}

/**
 * Create framework-agnostic middleware
 */
export function createLicenseMiddleware(requiredTier: LicenseTier = LicenseTier.PRO) {
  return async (ctx: MiddlewareContext) => {
    const result = await validateLicenseCore(ctx.getHeader, ctx.getIP, requiredTier);

    if (!result.valid) {
      const { error, validation } = result.error!;
      let body: Record<string, unknown>;

      if (error.type === 'unlicensed') {
        body = {
          error: 'License Required',
          message: 'Valid license key required',
          requiredTier,
          currentTier: validation?.tier,
        };
      } else if (error.type === 'insufficient_tier') {
        body = {
          error: 'Insufficient License Tier',
          message: `This endpoint requires ${requiredTier.toUpperCase()} license`,
          requiredTier,
          currentTier: validation?.tier,
        };
      } else if (error.type === 'suspended') {
        // NEW: Handle suspended accounts
        body = {
          error: 'Account Suspended',
          message: 'Access suspended due to payment failure',
          reason: error.reason,
          suspendedAt: error.suspendedAt,
          retryUrl: 'https://agencyos.network/billing/restore',
        };
        ctx.deny(403, body);
        return false;
      } else {
        body = {
          error: 'License Error',
          message: error.error.message,
          requiredTier: error.error.requiredTier,
          feature: error.error.feature,
        };
      }

      ctx.deny(403, body);
      return false;
    }

    return true;
  };
}

/**
 * Express middleware factory
 */
export function expressLicenseMiddleware(requiredTier: LicenseTier = LicenseTier.PRO) {
  const middleware = createLicenseMiddleware(requiredTier);
  return async (req: unknown, res: unknown, next: () => void) => {
    const allowed = await middleware({
      getHeader: (name) => {
        const val = (req as Record<string, unknown>)?.[name];
        return Array.isArray(val) ? val[0] : val;
      },
      getIP: () => (req as Record<string, unknown>)?.ip || (req as Record<string, unknown>)?.socket?.remoteAddress || '',
      deny: (code, body) => (res as Record<string, unknown>).status(code).json(body),
      allow: () => next(),
    });
    if (allowed) next();
  };
}

/**
 * Next.js HOC for Pages Router
 */
export function withLicenseGuard(handler: unknown, requiredTier: LicenseTier = LicenseTier.PRO) {
  const middleware = createLicenseMiddleware(requiredTier);
  return async (req: unknown, res: unknown) => {
    const allowed = await middleware({
      getHeader: (name) => {
        const val = (req as Record<string, unknown>)?.[name];
        return Array.isArray(val) ? val[0] : val;
      },
      getIP: () => (req as Record<string, unknown>)?.ip || (req as Record<string, unknown>)?.socket?.remoteAddress || '',
      deny: (code, body) => (res as Record<string, unknown>).status(code).json(body),
      allow: () => {},
    });
    if (allowed) {
      (req as Record<string, unknown>).license = { valid: true, tier: requiredTier };
      return (handler as (req: unknown, res: unknown) => void)(req, res);
    }
  };
}

/**
 * Next.js App Router middleware
 */
export function nextJsMiddleware(request: unknown, requiredTier: LicenseTier = LicenseTier.PRO) {
  const pathname = (request as Record<string, unknown>)?.nextUrl?.pathname || '';
  const publicPaths = ['/api/health', '/api/ready', '/api/public', '/dashboard'];

  if (publicPaths.some(p => pathname.startsWith(p))) {
    return new Response(null, { headers: { 'x-license-tier': 'public' } });
  }

  const middleware = createLicenseMiddleware(requiredTier);
  let result: NextMiddlewareResult = {};

  middleware({
    getHeader: (name) => (request as Record<string, unknown>)?.headers?.[name] || (request as Record<string, unknown>)?.headers?.get?.(name),
    getIP: () => (request as Record<string, unknown>)?.ip || (request as Record<string, unknown>)?.headers?.get?.('x-forwarded-for') || '',
    deny: (code, body) => {
      result = { response: { status: code, body } };
    },
    allow: () => {},
  }).catch(() => {});

  if (result.response) {
    return new Response(JSON.stringify(result.response.body), {
      status: result.response.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(null, {
    headers: { 'x-license-tier': requiredTier },
  });
}

/**
 * Fastify plugin
 */
export async function fastifyLicensePlugin(fastify: unknown, opts: { tier?: LicenseTier } = {}) {
  const middleware = createLicenseMiddleware(opts.tier || LicenseTier.PRO);

  fastify.addHook('preHandler', async (request: unknown, reply: unknown) => {
    const publicPaths = ['/health', '/ready', '/metrics', '/api/v1/billing/webhook'];
    if (publicPaths.some(p => (request as Record<string, string>)?.url?.startsWith(p))) return;

    const allowed = await middleware({
      getHeader: (name) => (request as Record<string, unknown>)?.headers?.[name],
      getIP: () => (request as Record<string, unknown>)?.ip || (request as Record<string, unknown>)?.raw?.socket?.remoteAddress || '',
      deny: (code, body) => (reply as Record<string, unknown>).code(code).send(body),
      allow: () => {},
    });

    if (!allowed) {
      throw new Error('License denied');
    }

    (request as Record<string, unknown>).license = { valid: true };
  });
}

/**
 * Hono middleware
 */
export function honoLicenseMiddleware(requiredTier: LicenseTier = LicenseTier.PRO) {
  const middleware = createLicenseMiddleware(requiredTier);
  return async (c: unknown, next: () => Promise<void>) => {
    const allowed = await middleware({
      getHeader: (name) => (c as Record<string, unknown>)?.req?.header(name),
      getIP: () => (c as Record<string, unknown>)?.req?.raw?.headers?.get('x-forwarded-for') || '',
      deny: (code, body) => (c as Record<string, unknown>).json(body, code),
      allow: () => {},
    });
    if (allowed) await next();
  };
}

/**
 * Tier check helper
 */
export function hasTier(tier: LicenseTier, required: LicenseTier): boolean {
  const order: Record<string, number> = { [LicenseTier.FREE]: 0, [LicenseTier.PRO]: 1, [LicenseTier.ENTERPRISE]: 2 };
  return order[tier] >= order[required];
}
