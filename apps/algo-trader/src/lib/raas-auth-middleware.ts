/**
 * RaaS Auth Middleware - JWT & API Key Authentication
 *
 * Validates Authorization headers for RaaS (Revenue-as-a-Service) tenants.
 * Supports both JWT tokens (Supabase Auth) and mk_ API key format.
 *
 * API Key Format: mk_<key>:<tenantId>:<tier>
 * - key: Unique API key prefix
 * - tenantId: Tenant identifier
 * - tier: Subscription tier (free, starter, growth, pro, enterprise)
 *
 * @see https://supabase.com/docs/guides/auth
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { z } from 'zod';

/**
 * Subscription tiers for RaaS
 */
export enum RaasTier {
  FREE = 'free',
  STARTER = 'starter',
  GROWTH = 'growth',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

/**
 * MK API Key structure
 */
export interface MKApiKey {
  key: string; // mk_<key>:<tenantId>:<tier>
  tenantId: string;
  tier: RaasTier;
  raw: string;
}

/**
 * JWT payload from Supabase Auth
 */
export interface SupabaseJWTPayload {
  iss: string;
  sub: string; // user UUID
  aud: string;
  exp: number;
  iat: number;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

/**
 * Auth context attached to request after middleware
 */
export interface AuthContext {
  tenantId: string;
  tier: RaasTier;
  userId?: string;
  apiKey?: MKApiKey;
  jwtPayload?: SupabaseJWTPayload;
}

/**
 * Parsed API key result
 */
export interface ParsedApiKey {
  valid: boolean;
  apiKey?: MKApiKey;
  error?: string;
}

/**
 * Tier hierarchy for comparison
 */
const TIER_ORDER: Record<RaasTier, number> = {
  [RaasTier.FREE]: 0,
  [RaasTier.STARTER]: 1,
  [RaasTier.GROWTH]: 2,
  [RaasTier.PRO]: 3,
  [RaasTier.ENTERPRISE]: 4,
};

/**
 * Supabase JWKS URL (configurable)
 */
const SUPABASE_JWKS_URL =
  process.env.SUPABASE_JWKS_URL ||
  `${process.env.SUPABASE_URL || ''}/auth/v1/jwks`;

/**
 * JWK Set for JWT verification
 */
let jwkSet: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwkSet() {
  if (!jwkSet) {
    jwkSet = createRemoteJWKSet(new URL(SUPABASE_JWKS_URL), {
      cooldownDuration: 60 * 60 * 1000, // 1 hour
      cacheMaxAge: 60 * 60 * 1000, // 1 hour
    });
  }
  return jwkSet;
}

/**
 * Parse mk_ API key format
 *
 * Format: mk_<key>:<tenantId>:<tier>
 * Example: mk_abc123:tenant-uuid-123:pro
 */
export function parseMKApiKey(apiKey: string): ParsedApiKey {
  try {
    if (!apiKey || !apiKey.startsWith('mk_')) {
      return { valid: false, error: 'Invalid API key format. Expected mk_<key>:<tenantId>:<tier>' };
    }

    // Remove 'mk_' prefix
    const withoutPrefix = apiKey.slice(3);
    const parts = withoutPrefix.split(':');

    if (parts.length !== 3) {
      return { valid: false, error: 'API key must have 3 parts separated by colons' };
    }

    const [key, tenantId, tierStr] = parts;

    if (!key || !tenantId || !tierStr) {
      return { valid: false, error: 'API key parts cannot be empty' };
    }

    // Validate tier
    const tier = tierStr.toLowerCase() as RaasTier;
    if (!Object.values(RaasTier).includes(tier)) {
      return {
        valid: false,
        error: `Invalid tier: ${tierStr}. Valid tiers: ${Object.values(RaasTier).join(', ')}`,
      };
    }

    return {
      valid: true,
      apiKey: {
        key,
        tenantId,
        tier,
        raw: apiKey,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error parsing API key',
    };
  }
}

/**
 * Verify Supabase JWT token
 */
export async function verifySupabaseJWT(token: string): Promise<{
  valid: boolean;
  payload?: SupabaseJWTPayload;
  error?: string;
}> {
  try {
    if (!token) {
      return { valid: false, error: 'Token is required' };
    }

    const jwkSet = getJwkSet();
    const { payload } = await jwtVerify(token, jwkSet, {
      issuer: process.env.SUPABASE_JWT_ISSUER,
      audience: process.env.SUPABASE_JWT_AUDIENCE || 'authenticated',
    });

    return {
      valid: true,
      payload: payload as unknown as SupabaseJWTPayload,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific JWT errors
      if (error.message.includes('expired')) {
        return { valid: false, error: 'JWT token has expired' };
      }
      if (error.message.includes('invalid signature')) {
        return { valid: false, error: 'Invalid JWT signature' };
      }
      if (error.message.includes('invalid issuer')) {
        return { valid: false, error: 'Invalid JWT issuer' };
      }
      return { valid: false, error: `JWT verification failed: ${error.message}` };
    }
    return { valid: false, error: 'Unknown error verifying JWT' };
  }
}

/**
 * Extract auth from request headers
 */
function extractAuthHeaders(request: FastifyRequest): {
  bearerToken?: string;
  apiKey?: string;
} {
  const authHeader = request.headers.authorization;
  const apiKeyHeader = request.headers['x-api-key'];

  let bearerToken: string | undefined;

  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      bearerToken = authHeader.slice(7);
    } else {
      // Maybe they put the raw token without Bearer
      bearerToken = authHeader;
    }
  }

  return {
    bearerToken,
    apiKey: apiKeyHeader as string | undefined,
  };
}

/**
 * Check if tier has sufficient access
 */
export function hasTierAccess(current: RaasTier, required: RaasTier): boolean {
  return TIER_ORDER[current] >= TIER_ORDER[required];
}

/**
 * Get tier from request context
 */
export function getTierFromContext(request: FastifyRequest): RaasTier | null {
  const context = (request as any).context?.auth as AuthContext | undefined;
  return context?.tier || null;
}

/**
 * Fastify plugin for RaaS auth middleware
 *
 * Validates Authorization: Bearer <jwt> or X-API-Key: mk_<key>:<tenantId>:<tier>
 * Attaches auth context to request for downstream handlers
 *
 * Usage:
 *   server.register(raasAuthMiddleware);
 *   server.get('/api/orders', { onRequest: [server.hasAuth] }, async (req, res) => {
 *     const tenantId = (req as any).context.auth.tenantId;
 *     ...
 *   });
 */
export const raasAuthMiddleware: FastifyPluginAsync = async (server) => {
  // Decorate server with auth checker
  server.decorate(
    'hasAuth',
    async function authChecker(request: FastifyRequest, reply: FastifyReply) {
      const { bearerToken, apiKey } = extractAuthHeaders(request);

      // No auth provided
      if (!bearerToken && !apiKey) {
        return reply.code(401).send({
          error: 'Authentication Required',
          message: 'Provide either Authorization: Bearer <token> or X-API-Key: mk_<key>:<tenantId>:<tier>',
        });
      }

      let authContext: AuthContext | null = null;

      // Try API key first
      if (apiKey) {
        const parsed = parseMKApiKey(apiKey);
        if (!parsed.valid || !parsed.apiKey) {
          return reply.code(401).send({
            error: 'Invalid API Key',
            message: parsed.error || 'Missing API key data',
          });
        }

        authContext = {
          tenantId: parsed.apiKey.tenantId,
          tier: parsed.apiKey.tier,
          apiKey: parsed.apiKey,
        };
      }

      // Try JWT token
      if (bearerToken) {
        const jwtResult = await verifySupabaseJWT(bearerToken);
        if (!jwtResult.valid) {
          return reply.code(401).send({
            error: 'Invalid JWT Token',
            message: jwtResult.error,
          });
        }

        // Extract tenant from JWT claims (supabase_user_id or custom claim)
        const payload = jwtResult.payload!;
        const tenantId =
          (payload as any).tenant_id ||
          payload.sub ||
          payload.email?.split('@')[0];

        if (!tenantId) {
          return reply.code(401).send({
            error: 'Invalid JWT Claims',
            message: 'Could not extract tenant ID from JWT token',
          });
        }

        // Default tier from JWT, can be overridden by user metadata
        const tier = ((payload as any).tier || RaasTier.FREE) as RaasTier;

        authContext = {
          tenantId,
          tier,
          userId: payload.sub,
          jwtPayload: payload,
        };
      }

      // Attach context to request
      if (!(request as any).context) {
        (request as any).context = {};
      }
      (request as any).context.auth = authContext;

      // Add rate limit headers (authContext is guaranteed non-null here)
      if (authContext) {
        reply.header('X-Tenant-ID', authContext.tenantId);
        reply.header('X-Tier', authContext.tier);
      }
    }
  );

  // Add type-safe type guard decorator
  server.decorate(
    'requireTier',
    function requireTierFactory(required: RaasTier) {
      return async function tierChecker(request: FastifyRequest, reply: FastifyReply) {
        const context = (request as any).context?.auth as AuthContext | undefined;

        if (!context) {
          return reply.code(401).send({
            error: 'Authentication Required',
            message: 'Please authenticate first',
          });
        }

        if (!hasTierAccess(context.tier, required)) {
          return reply.code(403).send({
            error: 'Insufficient Tier',
            message: `This endpoint requires ${required.toUpperCase()} tier. Your tier: ${context.tier.toUpperCase()}`,
            requiredTier: required,
            currentTier: context.tier,
          });
        }
      };
    }
  );
};

/**
 * Extract tenant ID from authenticated request
 */
export function getTenantId(request: FastifyRequest): string | null {
  const context = (request as any).context?.auth as AuthContext | undefined;
  return context?.tenantId || null;
}

/**
 * Extract user ID from authenticated request (JWT only)
 */
export function getUserId(request: FastifyRequest): string | null {
  const context = (request as any).context?.auth as AuthContext | undefined;
  return context?.userId || null;
}

/**
 * Type guard for checking if request is authenticated
 */
export function isAuthenticated(request: FastifyRequest): boolean {
  const context = (request as any).context?.auth as AuthContext | undefined;
  return !!context?.tenantId;
}

/**
 * Zod schema for tenant validation
 */
export const TenantIdSchema = z.string().uuid().or(z.string().min(1));

/**
 * Zod schema for API key validation
 */
export const ApiKeySchema = z.string().regex(/^mk_[a-zA-Z0-9]+:[a-zA-Z0-9-]+:(free|starter|growth|pro|enterprise)$/);
