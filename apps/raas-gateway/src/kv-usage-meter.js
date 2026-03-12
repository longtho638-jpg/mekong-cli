/**
 * RaaS Usage Meter — Cloudflare Worker KV-based usage tracking
 * Tracks request count, payload size, and endpoint type per license key
 * Hourly bucket aggregation for billing purposes
 */

/**
 * Get current hour bucket string (UTC)
 * @returns {string} e.g. "2026-03-08-10"
 */
export function getCurrentHourBucket() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const mo = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const h = String(now.getUTCHours()).padStart(2, '0');
  return `${y}-${mo}-${d}-${h}`;
}

/**
 * Build KV key for usage metrics
 * @param {string} licenseKey
 * @param {string} hourBucket
 * @returns {string}
 */
export function buildUsageKVKey(licenseKey, hourBucket) {
  return `usage:${licenseKey}:${hourBucket}`;
}

/**
 * Parse payload size from request
 * @param {Request} request
 * @returns {Promise<number>}
 */
export async function getPayloadSize(request) {
  if (['GET', 'HEAD'].includes(request.method)) {
    return 0;
  }

  try {
    const cloned = request.clone();
    const arrayBuffer = await cloned.arrayBuffer();
    return arrayBuffer.byteLength;
  } catch {
    return 0;
  }
}

/**
 * Extract endpoint type from URL path
 * @param {string} pathname
 * @returns {string}
 */
export function getEndpointType(pathname) {
  if (pathname.startsWith('/v1/scan')) return 'scan';
  if (pathname.startsWith('/v1/analyze')) return 'analyze';
  if (pathname.startsWith('/v1/trade')) return 'trade';
  if (pathname.startsWith('/v1/backtest')) return 'backtest';
  if (pathname.startsWith('/v1/status')) return 'status';
  if (pathname.startsWith('/v1/config')) return 'config';
  return 'unknown';
}

/**
 * Usage metric structure
 * @typedef {Object} UsageMetric
 * @property {string} licenseKey
 * @property {string} tenantId
 * @property {string} tier
 * @property {string} endpoint
 * @property {string} method
 * @property {number} requestCount
 * @property {number} payloadSize
 * @property {string} timestamp
 * @property {string} hourBucket
 */

/**
 * Initialize or update usage metric in KV
 * @param {object} env - Cloudflare Worker env bindings (needs RaaS_USAGE_KV)
 * @param {string} licenseKey
 * @param {string} tenantId
 * @param {string} tier
 * @param {string} endpoint
 * @param {string} method
 * @param {number} payloadSize
 * @returns {Promise<void>}
 */
export async function trackUsage(env, licenseKey, tenantId, tier, endpoint, method, payloadSize) {
  if (!env.RAAS_USAGE_KV) {
    /* RAAS_USAGE_KV binding missing, skipping usage tracking */
    return;
  }

  const hourBucket = getCurrentHourBucket();
  const kvKey = buildUsageKVKey(licenseKey, hourBucket);

  try {
    // Get existing metrics for this hour
    const raw = await env.RAAS_USAGE_KV.get(kvKey);
    /** @type {UsageMetric} */
    const metrics = raw ? JSON.parse(raw) : {
      licenseKey,
      tenantId,
      tier,
      endpoint,
      method,
      requestCount: 0,
      payloadSize: 0,
      timestamp: new Date().toISOString(),
      hourBucket
    };

    // Update metrics
    metrics.requestCount += 1;
    metrics.payloadSize += payloadSize;
    metrics.timestamp = new Date().toISOString();

    // Store in KV with 24-hour TTL (keeps data for 1 day)
    await env.RAAS_USAGE_KV.put(kvKey, JSON.stringify(metrics), { expirationTtl: 86400 });
  } catch (err) {
    /* Usage tracking KV error */
  }
}

/**
 * Get usage metrics for a specific license and time range
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} licenseKey
 * @param {string} startHour - Start hour bucket (YYYY-MM-DD-HH)
 * @param {string} endHour - End hour bucket (YYYY-MM-DD-HH)
 * @param {number} limit - Number of records to return (pagination)
 * @param {number} offset - Offset for pagination
 * @returns {Promise<{ metrics: UsageMetric[], total: number, hasMore: boolean }>}
 */
export async function getUsageMetrics(env, licenseKey, startHour, endHour, limit = 100, offset = 0) {
  if (!env.RAAS_USAGE_KV) {
    return { metrics: [], total: 0, hasMore: false };
  }

  try {
    const prefix = `usage:${licenseKey}:`;
    const keys = await env.RAAS_USAGE_KV.list({ prefix });
    const allMetrics = [];

    for (const { name } of keys.keys) {
      const raw = await env.RAAS_USAGE_KV.get(name);
      if (raw) {
        const metric = JSON.parse(raw);
        // Filter by time range if provided
        if ((!startHour || metric.hourBucket >= startHour) && (!endHour || metric.hourBucket <= endHour)) {
          allMetrics.push(metric);
        }
      }
    }

    // Sort by hour bucket ascending
    const sortedMetrics = allMetrics.sort((a, b) => a.hourBucket.localeCompare(b.hourBucket));

    // Apply pagination
    const startIndex = offset;
    const endIndex = offset + limit;
    const paginatedMetrics = sortedMetrics.slice(startIndex, endIndex);
    const hasMore = endIndex < sortedMetrics.length;

    return {
      metrics: paginatedMetrics,
      total: sortedMetrics.length,
      hasMore: hasMore
    };
  } catch (err) {
    /* Get usage metrics error */
    return { metrics: [], total: 0, hasMore: false };
  }
}

/**
 * Get hourly usage metrics for a license
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} licenseKey
 * @returns {Promise<UsageMetric[]>}
 */
export async function getHourlyUsage(env, licenseKey) {
  if (!env.RAAS_USAGE_KV) {
    return [];
  }

  try {
    const prefix = `usage:${licenseKey}:`;
    const keys = await env.RAAS_USAGE_KV.list({ prefix });
    const metrics = [];

    for (const { name } of keys.keys) {
      const raw = await env.RAAS_USAGE_KV.get(name);
      if (raw) {
        metrics.push(JSON.parse(raw));
      }
    }

    return metrics.sort((a, b) => a.hourBucket.localeCompare(b.hourBucket));
  } catch (err) {
    /* Get hourly usage error */
    return [];
  }
}

/**
 * Aggregate usage data for overage billing calculation
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} licenseKey
 * @param {string} startHour - Start hour bucket (YYYY-MM-DD-HH)
 * @param {string} endHour - End hour bucket (YYYY-MM-DD-HH)
 * @returns {Promise<{
 *   totalRequests: number,
 *   totalPayloadSize: number,
 *   hoursActive: number,
 *   avgRequestsPerHour: number,
 *   peakHour: { bucket: string, requests: number } | null,
 *   endpointBreakdown: Record<string, { requests: number, payloadSize: number }>,
 *   methodBreakdown: Record<string, { requests: number, payloadSize: number }>
 * }>}
 */
export async function aggregateUsageForBilling(env, licenseKey, startHour, endHour) {
  const metrics = await getUsageMetrics(env, licenseKey, startHour, endHour, 1000, 0);

  if (!metrics.metrics || metrics.metrics.length === 0) {
    return {
      totalRequests: 0,
      totalPayloadSize: 0,
      hoursActive: 0,
      avgRequestsPerHour: 0,
      peakHour: null,
      endpointBreakdown: {},
      methodBreakdown: {}
    };
  }

  // Aggregate totals
  let totalRequests = 0;
  let totalPayloadSize = 0;
  const endpointMap = new Map();
  const methodMap = new Map();
  let peakHour = { bucket: '', requests: 0 };
  const uniqueHours = new Set();

  for (const m of metrics.metrics) {
    totalRequests += m.requestCount || 0;
    totalPayloadSize += m.payloadSize || 0;
    uniqueHours.add(m.hourBucket);

    // Track peak hour
    if (m.requestCount > peakHour.requests) {
      peakHour = { bucket: m.hourBucket, requests: m.requestCount };
    }

    // Endpoint breakdown
    const epKey = m.endpoint || 'unknown';
    if (!endpointMap.has(epKey)) {
      endpointMap.set(epKey, { requests: 0, payloadSize: 0 });
    }
    const epData = endpointMap.get(epKey);
    epData.requests += m.requestCount || 0;
    epData.payloadSize += m.payloadSize || 0;

    // Method breakdown
    const methodKey = m.method || 'unknown';
    if (!methodMap.has(methodKey)) {
      methodMap.set(methodKey, { requests: 0, payloadSize: 0 });
    }
    const methodData = methodMap.get(methodKey);
    methodData.requests += m.requestCount || 0;
    methodData.payloadSize += m.payloadSize || 0;
  }

  const hoursActive = uniqueHours.size;
  const avgRequestsPerHour = hoursActive > 0 ? Math.round(totalRequests / hoursActive) : 0;

  return {
    totalRequests,
    totalPayloadSize,
    hoursActive,
    avgRequestsPerHour,
    peakHour: peakHour.requests > 0 ? peakHour : null,
    endpointBreakdown: Object.fromEntries(endpointMap),
    methodBreakdown: Object.fromEntries(methodMap)
  };
}
