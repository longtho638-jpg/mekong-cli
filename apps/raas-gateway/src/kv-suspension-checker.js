/**
 * KV Suspension Checker — Check tenant suspension status from KV cache
 *
 * KV Key Format: suspended:{tenantId}
 * KV Value: { status: 'SUSPENDED'|'REVOKED', since: ISODate, reason: string }
 * TTL: 86400 seconds (24h)
 */

/**
 * Check if tenant is suspended/revoked
 * @param {object} env - Cloudflare Worker env bindings with SUSPENSION_CACHE
 * @param {string} tenantId
 * @returns {Promise<{ blocked: boolean, status: string|null, since: string|null, reason: string|null }>}
 */
export async function checkSuspensionStatus(env, tenantId) {
  try {
    if (!env.SUSPENSION_CACHE) {
      // KV not configured, fail-open
      return { blocked: false, status: null, since: null, reason: null };
    }

    const key = `suspended:${tenantId}`;
    const value = await env.SUSPENSION_CACHE.get(key, { type: 'json' });

    if (!value) {
      return { blocked: false, status: null, since: null, reason: null };
    }

    return {
      blocked: true,
      status: value.status,
      since: value.since,
      reason: value.reason || 'Payment delinquency'
    };
  } catch (error) {
    console.error('[SuspensionCheck] KV read error:', error);
    // Fail-open: KV errors should not block all traffic
    return { blocked: false, status: null, since: null, reason: null };
  }
}

/**
 * Sync tenant suspension status to KV
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} tenantId
 * @param {'SUSPENDED'|'REVOKED'|'ACTIVE'} status
 * @param {string} reason - Optional reason
 * @returns {Promise<boolean>}
 */
export async function syncSuspensionToKV(env, tenantId, status, reason = '') {
  try {
    if (!env.SUSPENSION_CACHE) {
      console.warn('[SuspensionSync] KV not configured');
      return false;
    }

    const key = `suspended:${tenantId}`;

    if (status === 'ACTIVE') {
      // Remove from suspension cache
      await env.SUSPENSION_CACHE.delete(key);
      console.log(`[SuspensionSync] Tenant ${tenantId} reactivated, removed from KV`);
      return true;
    }

    // SUSPENDED or REVOKED
    const value = {
      status,
      since: new Date().toISOString(),
      reason: reason || 'Payment delinquency'
    };

    // TTL: 86400 seconds = 24 hours
    await env.SUSPENSION_CACHE.put(key, JSON.stringify(value), {
      expirationTtl: 86400
    });

    console.log(`[SuspensionSync] Tenant ${tenantId} marked as ${status} in KV`);
    return true;
  } catch (error) {
    console.error('[SuspensionSync] KV write error:', error);
    return false;
  }
}

/**
 * Build suspension status for /v1/auth/validate response
 * @param {object} suspensionResult from checkSuspensionStatus()
 * @returns {object}
 */
export function buildSuspensionStatusHeader(suspensionResult) {
  return {
    'X-Suspension-Status': suspensionResult.blocked ? 'blocked' : 'active',
    'X-Suspension-Reason': suspensionResult.reason || ''
  };
}
