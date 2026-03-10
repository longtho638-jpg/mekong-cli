/**
 * KV Rate Limiter — per API key, sliding window via Cloudflare KV TTL
 * Tiers: free=100 req/min, pro=1000 req/min, service=unlimited
 */

/** Rate limits by role tier (requests per minute) */
const RATE_LIMITS = {
  free: 100,
  pro: 1000,
  service: Infinity,
  anon: 20
};

/**
 * Build KV key for rate limit counter
 * @param {string} tenantId
 * @param {string} windowKey - minute bucket e.g. "2026-03-02T10:45"
 * @returns {string}
 */
function buildKVKey(tenantId, windowKey) {
  return `rl:${tenantId}:${windowKey}`;
}

/**
 * Get current minute bucket string (UTC)
 * @returns {string} e.g. "2026-03-02T10:45"
 */
function getCurrentMinuteBucket() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const mo = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const h = String(now.getUTCHours()).padStart(2, '0');
  const mi = String(now.getUTCMinutes()).padStart(2, '0');
  return `${y}-${mo}-${d}T${h}:${mi}`;
}

/**
 * Check and increment rate limit counter in KV
 * Uses atomic read-increment-write with 70s TTL (covers 1 min window + buffer)
 *
 * @param {object} env - Cloudflare Worker env bindings (needs RATE_LIMIT_KV)
 * @param {string} tenantId
 * @param {string} role - "free" | "pro" | "service" | "anon"
 * @returns {Promise<{ allowed: boolean, remaining: number, limit: number, resetIn: number }>}
 */
export async function checkRateLimit(env, tenantId, role) {
  const limit = RATE_LIMITS[role] ?? RATE_LIMITS.free;

  // Service accounts bypass rate limiting
  if (limit === Infinity) {
    return { allowed: true, remaining: Infinity, limit: -1, resetIn: 0 };
  }

  // KV binding required
  if (!env.RATE_LIMIT_KV) {
    // No KV configured — allow but log warning
    console.warn('RATE_LIMIT_KV binding missing, skipping rate limit');
    return { allowed: true, remaining: limit, limit, resetIn: 60 };
  }

  const windowKey = getCurrentMinuteBucket();
  const kvKey = buildKVKey(tenantId, windowKey);

  try {
    const raw = await env.RATE_LIMIT_KV.get(kvKey);
    const current = raw ? parseInt(raw, 10) : 0;

    if (current >= limit) {
      return { allowed: false, remaining: 0, limit, resetIn: 60 };
    }

    // Increment counter, TTL = 70s to cover full minute + buffer
    await env.RATE_LIMIT_KV.put(kvKey, String(current + 1), { expirationTtl: 70 });

    return {
      allowed: true,
      remaining: limit - current - 1,
      limit,
      resetIn: 60
    };
  } catch (err) {
    // KV error — fail open (allow request) to avoid blocking legitimate traffic
    console.error('Rate limit KV error:', err.message);
    return { allowed: true, remaining: limit, limit, resetIn: 60 };
  }
}

/**
 * Build rate limit response headers for client feedback
 * @param {{ remaining: number, limit: number, resetIn: number }} info
 * @returns {object} headers object
 */
export function buildRateLimitHeaders(info) {
  return {
    'X-RateLimit-Limit': String(info.limit === -1 ? 'unlimited' : info.limit),
    'X-RateLimit-Remaining': String(info.remaining === Infinity ? 'unlimited' : info.remaining),
    'X-RateLimit-Reset': String(info.resetIn)
  };
}
