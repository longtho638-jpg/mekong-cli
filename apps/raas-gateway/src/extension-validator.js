/**
 * RaaS Extension Validator — Validate extension eligibility and track usage
 *
 * Extensions are premium features that require higher tier licenses:
 * - algo-trader: Available to Pro and Enterprise tiers
 * - agi-auto-pilot: Enterprise only
 *
 * KV Key Format: extension:{tenantId}:{extensionName}
 * KV Value: { permitted: boolean, status: 'approved'|'pending'|'denied'|'none', usage: number, limit: number }
 * TTL: 86400 seconds (24h)
 */

/**
 * Extension configuration by name
 * @type {Record<string, { requiredTier: string[], defaultLimit: number }>}
 */
const EXTENSION_CONFIG = {
  'algo-trader': {
    requiredTier: ['pro', 'enterprise'],
    defaultLimit: 1000  // requests per hour
  },
  'agi-auto-pilot': {
    requiredTier: ['enterprise'],
    defaultLimit: 100   // requests per hour
  }
};

/**
 * Validate if tenant/role can access specific extension
 * @param {string} tenantId
 * @param {string} role - free | trial | pro | enterprise | service
 * @param {string} extensionName - e.g. 'algo-trader'
 * @returns {{ allowed: boolean, required?: string, reason?: string }}
 */
export function validateExtensionFlags(request, env, tenantId, role, extensionName = 'algo-trader') {
  const config = EXTENSION_CONFIG[extensionName];

  if (!config) {
    // Unknown extension, deny by default
    return { allowed: false, required: extensionName, reason: 'unknown_extension' };
  }

  // Service tier always has access
  if (role === 'service') {
    return { allowed: true };
  }

  const hasRequiredTier = config.requiredTier.includes(role);

  if (!hasRequiredTier) {
    return {
      allowed: false,
      required: extensionName,
      reason: `requires_${config.requiredTier.join('_or_')}_tier`
    };
  }

  return { allowed: true };
}

/**
 * Get extension status from KV cache
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} tenantId
 * @param {string} extensionName
 * @returns {Promise<{
 *   permitted: boolean,
 *   status: 'approved'|'pending'|'denied'|'none',
 *   usage: number,
 *   limit: number,
 *   resetAt: string|null
 * }>}
 */
export async function getExtensionStatus(env, tenantId, extensionName = 'algo-trader') {
  try {
    if (!env.SUSPENSION_CACHE) {
      // KV not configured, return default permitted status based on role
      return {
        permitted: true,
        status: 'none',
        usage: 0,
        limit: EXTENSION_CONFIG[extensionName]?.defaultLimit || 1000,
        resetAt: null
      };
    }

    const key = `extension:${tenantId}:${extensionName}`;
    const value = await env.SUSPENSION_CACHE.get(key, { type: 'json' });

    if (!value) {
      return {
        permitted: true,
        status: 'none',
        usage: 0,
        limit: EXTENSION_CONFIG[extensionName]?.defaultLimit || 1000,
        resetAt: null
      };
    }

    // Calculate reset time (24h from key creation)
    const resetAt = value.createdAt
      ? new Date(value.createdAt + 86400000).toISOString()
      : null;

    return {
      permitted: value.permitted,
      status: value.status || 'none',
      usage: value.usage || 0,
      limit: value.limit || EXTENSION_CONFIG[extensionName]?.defaultLimit || 1000,
      resetAt
    };
  } catch (error) {
    console.error('[ExtensionStatus] KV read error:', error);
    // Fail-open: return permitted on KV errors
    return {
      permitted: true,
      status: 'none',
      usage: 0,
      limit: EXTENSION_CONFIG[extensionName]?.defaultLimit || 1000,
      resetAt: null
    };
  }
}

/**
 * Track extension usage with idempotency support
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} tenantId
 * @param {string} extensionName
 * @param {number} requestCount - Number of requests to add (default: 1)
 * @param {string} idempotencyKey - Optional idempotency key to prevent duplicates
 * @returns {Promise<{
 *   success: boolean,
 *   duplicate?: boolean,
 *   usage: number,
 *   limit: number,
 *   exceeded: boolean
 * }>}
 */
export async function trackExtensionUsage(env, tenantId, extensionName, requestCount = 1, idempotencyKey) {
  try {
    if (!env.SUSPENSION_CACHE) {
      // KV not configured, allow without tracking
      return { success: true, usage: 0, limit: 0, exceeded: false };
    }

    // Check idempotency key if provided
    if (idempotencyKey) {
      const idempotencyCacheKey = `idempotency:${idempotencyKey}`;
      const cachedResult = await env.SUSPENSION_CACHE.get(idempotencyCacheKey, { type: 'json' });

      if (cachedResult) {
        // Duplicate request, return cached result
        return { success: true, duplicate: true, ...cachedResult };
      }
    }

    const usageKey = `extension:${tenantId}:${extensionName}`;
    const currentValue = await env.SUSPENSION_CACHE.get(usageKey, { type: 'json' });

    const currentUsage = (currentValue?.usage || 0) + requestCount;
    const limit = currentValue?.limit || EXTENSION_CONFIG[extensionName]?.defaultLimit || 1000;
    const exceeded = currentUsage > limit;

    const newValue = {
      permitted: currentValue?.permitted ?? true,
      status: currentValue?.status || 'approved',
      usage: currentUsage,
      limit,
      createdAt: currentValue?.createdAt || Date.now(),
      lastUsed: Date.now()
    };

    // Store with 24h TTL
    await env.SUSPENSION_CACHE.put(usageKey, JSON.stringify(newValue), {
      expirationTtl: 86400
    });

    // Store idempotency result if key provided
    if (idempotencyKey) {
      const idempotencyCacheKey = `idempotency:${idempotencyKey}`;
      const resultToCache = {
        usage: currentUsage,
        limit,
        exceeded
      };
      await env.SUSPENSION_CACHE.put(idempotencyCacheKey, JSON.stringify(resultToCache), {
        expirationTtl: 86400  // 24 hours
      });
    }

    return {
      success: true,
      usage: currentUsage,
      limit,
      exceeded
    };
  } catch (error) {
    console.error('[TrackExtensionUsage] KV error:', error);
    return { success: false, usage: 0, limit: 0, exceeded: false };
  }
}

/**
 * Set extension status in KV (for admin approval flows)
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} tenantId
 * @param {string} extensionName
 * @param {boolean} permitted
 * @param {'approved'|'pending'|'denied'} status
 * @param {number} limit - Optional custom limit
 * @returns {Promise<boolean>}
 */
export async function setExtensionStatus(env, tenantId, extensionName, permitted, status, limit) {
  try {
    if (!env.SUSPENSION_CACHE) {
      console.warn('[SetExtensionStatus] KV not configured');
      return false;
    }

    const key = `extension:${tenantId}:${extensionName}`;
    const value = {
      permitted,
      status,
      usage: 0,
      limit: limit || EXTENSION_CONFIG[extensionName]?.defaultLimit || 1000,
      createdAt: Date.now(),
      lastUsed: Date.now()
    };

    await env.SUSPENSION_CACHE.put(key, JSON.stringify(value), {
      expirationTtl: 86400  // 24 hours
    });

    console.log(`[SetExtensionStatus] Tenant ${tenantId} extension ${extensionName} set to ${status}`);
    return true;
  } catch (error) {
    console.error('[SetExtensionStatus] KV error:', error);
    return false;
  }
}
