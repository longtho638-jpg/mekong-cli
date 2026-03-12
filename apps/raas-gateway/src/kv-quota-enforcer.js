/**
 * RaaS Quota Enforcer — Cloudflare Worker KV-based quota enforcement
 * Tracks real-time usage against quota limits from Stripe/Polar billing
 * Blocks requests when quota exceeded (429) and alerts at 80% threshold
 */

import {
  QUOTA_THRESHOLDS,
  KV_KEYS,
  DEFAULT_TIER_LIMITS
} from './quota-types.js';

/**
 * Get current date bucket (UTC)
 * @returns {string} e.g. "2026-03-09"
 */
function getCurrentDateBucket() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const mo = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

/**
 * Get current hour bucket (UTC)
 * @returns {string} e.g. "2026-03-09-10"
 */
function getCurrentHourBucket() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const mo = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const h = String(now.getUTCHours()).padStart(2, '0');
  return `${y}-${mo}-${d}-${h}`;
}

/**
 * Get billing period info (simplified - assumes calendar month)
 * @returns {{start: string, end: string}}
 */
function getCurrentBillingPeriod() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  // Start of current month
  const start = new Date(Date.UTC(year, month, 1));
  // End of current month (start of next month)
  const end = new Date(Date.UTC(year, month + 1, 1));

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

/**
 * Get quota limits for a license key from KV
 * Falls back to default tier limits if not stored
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} licenseKey - mk_ API key
 * @param {string} tier - User tier
 * @returns {Promise<import('./quota-types.js').QuotaLimit>}
 */
export async function getQuotaLimits(env, licenseKey, tier) {
  // Check if custom limits stored in KV (from Stripe/Polar webhook)
  if (env.QUOTA_KV) {
    try {
      const stored = await env.QUOTA_KV.get(`${KV_KEYS.LIMITS}${licenseKey}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      /* Quota limits KV read error */
    }
  }

  // Fall back to default tier limits
  const period = getCurrentBillingPeriod();
  return {
    licenseKey,
    tier,
    ...DEFAULT_TIER_LIMITS[tier] || DEFAULT_TIER_LIMITS.free,
    billingPeriodStart: period.start,
    billingPeriodEnd: period.end
  };
}

/**
 * Get current usage counters for a license key
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} licenseKey - mk_ API key
 * @param {string} tier - User tier
 * @returns {Promise<import('./quota-types.js').UsageCounters>}
 */
export async function getUsageCounters(env, licenseKey, tier) {
  if (!env.QUOTA_KV) {
    // No KV - return empty counters
    return {
      licenseKey,
      monthlyRequests: 0,
      monthlyPayloadBytes: 0,
      dailyRequests: 0,
      hourlyRequests: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  try {
    const period = getCurrentBillingPeriod();
    const dateBucket = getCurrentDateBucket();
    const hourBucket = getCurrentHourBucket();

    // Get monthly usage from RAAS_USAGE_KV (existing usage metering)
    let monthlyRequests = 0;
    let monthlyPayloadBytes = 0;

    if (env.RAAS_USAGE_KV) {
      try {
        const prefix = `usage:${licenseKey}:`;
        const keys = await env.RAAS_USAGE_KV.list({ prefix });

        for (const { name } of keys.keys) {
          const raw = await env.RAAS_USAGE_KV.get(name);
          if (raw) {
            const metric = JSON.parse(raw);
            // Only count requests within current billing period
            if (metric.timestamp >= period.start) {
              monthlyRequests += metric.requestCount || 0;
              monthlyPayloadBytes += metric.payloadSize || 0;
            }
          }
        }
      } catch (err) {
        /* Usage KV read error */
      }
    }

    // Get daily counter
    let dailyRequests = 0;
    const dailyKey = `${KV_KEYS.DAILY}${licenseKey}:${dateBucket}`;
    const dailyRaw = await env.QUOTA_KV.get(dailyKey);
    if (dailyRaw) {
      dailyRequests = parseInt(dailyRaw, 10) || 0;
    }

    // Get hourly counter
    let hourlyRequests = 0;
    const hourlyKey = `${KV_KEYS.HOURLY}${licenseKey}:${hourBucket}`;
    const hourlyRaw = await env.QUOTA_KV.get(hourlyKey);
    if (hourlyRaw) {
      hourlyRequests = parseInt(hourlyRaw, 10) || 0;
    }

    return {
      licenseKey,
      monthlyRequests,
      monthlyPayloadBytes,
      dailyRequests,
      hourlyRequests,
      lastUpdated: new Date().toISOString()
    };
  } catch (err) {
    /* Get usage counters error */
    return {
      licenseKey,
      monthlyRequests: 0,
      monthlyPayloadBytes: 0,
      dailyRequests: 0,
      hourlyRequests: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Calculate usage percentage
 * @param {number} used
 * @param {number} limit
 * @returns {number} 0-100+ percentage
 */
function calculateUsagePercent(used, limit) {
  if (limit === Infinity || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

/**
 * Check quota for a license key
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} licenseKey - mk_ API key
 * @param {string} tier - User tier
 * @returns {Promise<import('./quota-types.js').QuotaCheckResult>}
 */
export async function checkQuota(env, licenseKey, tier) {
  try {
    const [limits, usage] = await Promise.all([
      getQuotaLimits(env, licenseKey, tier),
      getUsageCounters(env, licenseKey, tier)
    ]);

    // Calculate percentages
    const monthlyPercent = calculateUsagePercent(usage.monthlyRequests, limits.monthlyRequests);
    const dailyPercent = limits.dailyRequests !== Infinity
      ? calculateUsagePercent(usage.dailyRequests, limits.dailyRequests)
      : 0;
    const hourlyPercent = limits.hourlyRequests !== Infinity
      ? calculateUsagePercent(usage.hourlyRequests, limits.hourlyRequests)
      : 0;

    // Determine exceeded limits
    const exceededLimits = [];
    let isOverQuota = false;

    if (limits.monthlyRequests !== Infinity && usage.monthlyRequests >= limits.monthlyRequests) {
      exceededLimits.push('monthly_requests');
      isOverQuota = true;
    }

    if (limits.monthlyPayloadBytes !== Infinity && usage.monthlyPayloadBytes >= limits.monthlyPayloadBytes) {
      exceededLimits.push('monthly_payload');
      isOverQuota = true;
    }

    if (limits.dailyRequests !== Infinity && usage.dailyRequests >= limits.dailyRequests) {
      exceededLimits.push('daily_requests');
      isOverQuota = true;
    }

    if (limits.hourlyRequests !== Infinity && usage.hourlyRequests >= limits.hourlyRequests) {
      exceededLimits.push('hourly_requests');
      isOverQuota = true;
    }

    // Check if near quota (80% threshold)
    const isNearQuota = monthlyPercent >= QUOTA_THRESHOLDS.WARNING ||
                        dailyPercent >= QUOTA_THRESHOLDS.WARNING ||
                        hourlyPercent >= QUOTA_THRESHOLDS.WARNING;

    // Build status object
    const status = {
      licenseKey,
      limit: limits,
      usage,
      monthlyUsagePercent: monthlyPercent,
      dailyUsagePercent: dailyPercent,
      hourlyUsagePercent: hourlyPercent,
      isOverQuota,
      isNearQuota,
      exceededLimits
    };

    // Determine if request is allowed
    let allowed = true;
    let blockReason = null;
    let remaining = Math.max(0, limits.monthlyRequests - usage.monthlyRequests);
    let resetIn = 0;

    if (isOverQuota) {
      allowed = false;
      blockReason = `Quota exceeded: ${exceededLimits.join(', ')}`;
      remaining = 0;
      // Calculate reset time (simplified - until end of billing period)
      const periodEnd = new Date(limits.billingPeriodEnd);
      resetIn = Math.max(0, Math.floor((periodEnd.getTime() - Date.now()) / 1000));
    }

    return {
      allowed,
      status,
      remaining,
      resetIn,
      blockReason
    };
  } catch (err) {
    /* Quota check error */
    // Fail open - allow request but log error
    return {
      allowed: true,
      status: null,
      remaining: Infinity,
      resetIn: 0,
      blockReason: null
    };
  }
}

/**
 * Increment usage counters in KV
 * Called after request is processed
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} licenseKey - mk_ API key
 * @param {number} payloadSize - Request payload size in bytes
 * @param {string} idempotencyKey - Optional idempotency key to prevent double-counting
 * @returns {Promise<void>}
 */
export async function incrementUsage(env, licenseKey, payloadSize, idempotencyKey) {
  if (!env.QUOTA_KV) {
    /* QUOTA_KV binding missing, skipping usage increment */
    return;
  }

  try {
    const dateBucket = getCurrentDateBucket();
    const hourBucket = getCurrentHourBucket();

    // Increment daily counter
    const dailyKey = `${KV_KEYS.DAILY}${licenseKey}:${dateBucket}`;
    const dailyRaw = await env.QUOTA_KV.get(dailyKey);
    const dailyCount = dailyRaw ? parseInt(dailyRaw, 10) : 0;
    await env.QUOTA_KV.put(dailyKey, String(dailyCount + 1), { expirationTtl: 86400 * 2 }); // 2 days

    // Increment hourly counter
    const hourlyKey = `${KV_KEYS.HOURLY}${licenseKey}:${hourBucket}`;
    const hourlyRaw = await env.QUOTA_KV.get(hourlyKey);
    const hourlyCount = hourlyRaw ? parseInt(hourlyRaw, 10) : 0;
    await env.QUOTA_KV.put(hourlyKey, String(hourlyCount + 1), { expirationTtl: 7200 }); // 2 hours

    // Note: Monthly usage is aggregated from RAAS_USAGE_KV by existing metering
    // This just adds daily/hourly granularity for quota checks

  } catch (err) {
    /* Increment usage error */
  }
}

/**
 * Store custom quota limits from Stripe/Polar webhook
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} licenseKey - mk_ API key
 * @param {Partial<import('./quota-types.js').QuotaLimit>} limits - Custom limits
 * @returns {Promise<boolean>}
 */
export async function storeQuotaLimits(env, licenseKey, limits) {
  if (!env.QUOTA_KV) {
    /* QUOTA_KV binding missing, cannot store limits */
    return false;
  }

  try {
    const key = `${KV_KEYS.LIMITS}${licenseKey}`;
    const existing = await getQuotaLimits(env, licenseKey, limits.tier || 'free');
    const merged = { ...existing, ...limits };

    await env.QUOTA_KV.put(key, JSON.stringify(merged));
    return true;
  } catch (err) {
    /* Store quota limits error */
    return false;
  }
}
