/**
 * RaaS Quota Alert Webhook Service - Enhanced
 * Sends webhook notifications when quota thresholds are crossed
 * Features: Idempotency, retry with backoff, dashboard logging, Stripe/Polar metadata
 */

import { QUOTA_THRESHOLDS } from './quota-types.js';

/**
 * Build KV key for tracking sent alerts (rate limiting)
 * @param {string} licenseKey
 * @param {string} threshold
 * @param {string} dateHour
 * @returns {string}
 */
function buildAlertKVKey(licenseKey, threshold, dateHour) {
  return `quota:alerts:${licenseKey}:${threshold}:${dateHour}`;
}

/**
 * Build KV key for alert log (dashboard history)
 * @param {string} licenseKey
 * @param {string} alertId
 * @returns {string}
 */
function buildAlertLogKey(licenseKey, alertId) {
  return `quota:alertlogs:${licenseKey}:${alertId}`;
}

/**
 * Get current hour bucket (UTC)
 * @returns {string}
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
 * Generate unique alert ID for idempotency
 * @param {string} licenseKey
 * @param {number} threshold
 * @param {string} timestamp
 * @returns {string}
 */
function generateAlertId(licenseKey, threshold, timestamp) {
  return `alert_${licenseKey}_${threshold}_${timestamp.replace(/[^0-9]/g, '')}`;
}

/**
 * Check if alert was already sent in current hour (rate limiting)
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} licenseKey
 * @param {number} threshold
 * @returns {Promise<boolean>}
 */
export async function shouldSendAlert(env, licenseKey, threshold) {
  if (!env.QUOTA_KV) {
    return true;
  }

  try {
    const hourBucket = getCurrentHourBucket();
    const key = buildAlertKVKey(licenseKey, String(threshold), hourBucket);
    const existing = await env.QUOTA_KV.get(key);
    return !existing;
  } catch (err) {
    /* ShouldSendAlert error */
    return true;
  }
}

/**
 * Track that an alert was sent (prevents duplicates within hour)
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} licenseKey
 * @param {number} threshold
 * @returns {Promise<void>}
 */
export async function trackAlertSent(env, licenseKey, threshold) {
  if (!env.QUOTA_KV) {
    return;
  }

  try {
    const hourBucket = getCurrentHourBucket();
    const key = buildAlertKVKey(licenseKey, String(threshold), hourBucket);
    await env.QUOTA_KV.put(key, Date.now().toString(), { expirationTtl: 7200 });
  } catch (err) {
    /* TrackAlertSent error */
  }
}

/**
 * Log alert to dashboard KV (for analytics/history)
 * @param {object} env - Cloudflare Worker env bindings
 * @param {object} alertLog
 * @returns {Promise<void>}
 */
export async function logAlertToDashboard(env, alertLog) {
  if (!env.ALERT_LOGS_KV) {
    /* ALERT_LOGS_KV not configured, skipping dashboard log */
    return;
  }

  try {
    const key = buildAlertLogKey(alertLog.licenseKey, alertLog.alertId);
    await env.ALERT_LOGS_KV.put(key, JSON.stringify(alertLog), { expirationTtl: 2592000 }); // 30 days
    /* Alert logged to dashboard */
  } catch (err) {
    /* LogAlertToDashboard error */
  }
}

/**
 * Send webhook with retry logic (exponential backoff)
 * Retries: 3 attempts with delays: 1s, 2s, 4s
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<Response|null>}
 */
async function sendWebhookWithRetry(url, options) {
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Exponential backoff: 2^attempt * 1000ms
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
      /* Webhook attempt failed */
    }
  }

  /* Webhook retry exhausted */
  return null;
}

/**
 * Send quota alert webhook to AgencyOS dashboard
 * @param {object} env - Cloudflare Worker env bindings
 * @param {Object} alertData
 * @param {string} alertData.licenseKey
 * @param {string} alertData.alertType - 'quota_warning' | 'quota_critical' | 'quota_exceeded'
 * @param {number} alertData.threshold - 80 | 95 | 100
 * @param {object} alertData.status - QuotaStatus object
 * @param {string} alertData.timestamp - ISO timestamp
 * @param {object} [alertData.billingMetadata] - Stripe/Polar metadata
 * @returns {Promise<boolean>}
 */
export async function sendQuotaAlert(env, alertData) {
  const webhookUrl = env.AGENCYOS_WEBHOOK_URL;
  const authToken = env.AGENCYOS_WEBHOOK_AUTH_TOKEN;

  if (!webhookUrl || !authToken) {
    /* Webhook not configured, skipping quota alert */
    return false;
  }

  // Rate limit check (idempotency)
  const shouldSend = await shouldSendAlert(env, alertData.licenseKey, alertData.threshold);
  if (!shouldSend) {
    /* Alert already sent this hour */
    return false;
  }

  // Generate unique alert ID for idempotency header
  const alertId = generateAlertId(alertData.licenseKey, alertData.threshold, alertData.timestamp);

  try {
    // Build webhook payload with Stripe/Polar billing metadata
    const payload = {
      eventType: alertData.alertType,
      alertId: alertId,
      licenseKey: alertData.licenseKey,
      threshold: alertData.threshold,
      timestamp: alertData.timestamp,
      status: {
        monthlyUsagePercent: alertData.status.monthlyUsagePercent,
        dailyUsagePercent: alertData.status.dailyUsagePercent,
        hourlyUsagePercent: alertData.status.hourlyUsagePercent,
        isOverQuota: alertData.status.isOverQuota,
        exceededLimits: alertData.status.exceededLimits,
        remaining: alertData.status.limit.monthlyRequests - alertData.status.usage.monthlyRequests,
        limit: alertData.status.limit.monthlyRequests,
        resetAt: alertData.status.limit.billingPeriodEnd
      },
      metadata: {
        tier: alertData.status.limit.tier,
        monthlyLimit: alertData.status.limit.monthlyRequests,
        monthlyUsed: alertData.status.usage.monthlyRequests,
        overageAllowed: alertData.status.limit.overageAllowed,
        overageRate: alertData.status.limit.overageRate
      },
      // Stripe/Polar billing metadata integration
      billing: alertData.billingMetadata || {
        stripeCustomerId: alertData.status.limit.stripeCustomerId || null,
        polarProductId: alertData.status.limit.polarProductId || null,
        subscriptionId: alertData.status.limit.subscriptionId || null,
        planName: alertData.status.limit.planName || alertData.status.limit.tier,
        currency: alertData.status.limit.currency || 'USD',
        currentPeriodStart: alertData.status.limit.billingPeriodStart,
        currentPeriodEnd: alertData.status.limit.billingPeriodEnd
      }
    };

    // Send with retry logic
    const response = await sendWebhookWithRetry(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'User-Agent': 'RaaS-Gateway-Quota-Alert/2.0',
        'X-Alert-Id': alertId,
        'X-Idempotency-Key': alertId
      },
      body: JSON.stringify(payload)
    });

    if (response) {
      /* Quota alert sent successfully */

      // Track alert sent (rate limiting)
      await trackAlertSent(env, alertData.licenseKey, alertData.threshold);

      // Log to dashboard KV
      const alertLog = {
        alertId,
        licenseKey: alertData.licenseKey,
        eventType: alertData.alertType,
        threshold: alertData.threshold,
        timestamp: alertData.timestamp,
        status: payload.status,
        metadata: payload.metadata,
        billing: payload.billing,
        delivered: true
      };
      await logAlertToDashboard(env, alertLog);

      return true;
    } else {
      /* Quota alert failed after retries */

      // Log failed alert
      const alertLog = {
        alertId,
        licenseKey: alertData.licenseKey,
        eventType: alertData.alertType,
        threshold: alertData.threshold,
        timestamp: alertData.timestamp,
        delivered: false,
        error: 'Retry exhausted'
      };
      await logAlertToDashboard(env, alertLog);

      return false;
    }
  } catch (err) {
    /* SendQuotaAlert error */
    return false;
  }
}

/**
 * Check and trigger alerts based on quota status
 * Supports thresholds: 80% (warning), 95% (critical), 100% (exceeded)
 * @param {object} env - Cloudflare Worker env bindings
 * @param {import('./quota-types.js').QuotaCheckResult} quotaResult
 * @param {object} [billingMetadata] - Optional Stripe/Polar metadata
 * @returns {Promise<void>}
 */
export async function checkAndTriggerAlerts(env, quotaResult, billingMetadata = {}) {
  if (!quotaResult || !quotaResult.status) {
    return;
  }

  const { status } = quotaResult;
  const timestamp = new Date().toISOString();

  // Determine highest threshold crossed
  const maxPercent = Math.max(
    status.monthlyUsagePercent,
    status.dailyUsagePercent,
    status.hourlyUsagePercent
  );

  // 100% - Quota Exceeded (block)
  if (status.isOverQuota || maxPercent >= 100) {
    await sendQuotaAlert(env, {
      licenseKey: status.licenseKey,
      alertType: 'quota_exceeded',
      threshold: 100,
      status,
      timestamp,
      billingMetadata
    });
  }
  // 95% - Critical (urgent warning)
  else if (maxPercent >= QUOTA_THRESHOLDS.CRITICAL || maxPercent >= 95) {
    await sendQuotaAlert(env, {
      licenseKey: status.licenseKey,
      alertType: 'quota_critical',
      threshold: 95,
      status,
      timestamp,
      billingMetadata
    });
  }
  // 80% - Warning
  else if (status.isNearQuota || maxPercent >= QUOTA_THRESHOLDS.WARNING) {
    await sendQuotaAlert(env, {
      licenseKey: status.licenseKey,
      alertType: 'quota_warning',
      threshold: 80,
      status,
      timestamp,
      billingMetadata
    });
  }
}

/**
 * Build quota headers for response
 * @param {import('./quota-types.js').QuotaCheckResult} quotaResult
 * @returns {object} Headers object
 */
export function buildQuotaHeaders(quotaResult) {
  if (!quotaResult || !quotaResult.status) {
    return {};
  }

  const { status, remaining, resetIn } = quotaResult;
  const limit = status.limit.monthlyRequests === Infinity ? -1 : status.limit.monthlyRequests;

  return {
    'X-Quota-Limit': String(limit),
    'X-Quota-Remaining': String(remaining === Infinity ? -1 : remaining),
    'X-Quota-Reset': String(resetIn),
    'X-Quota-Used-Percent': String(status.monthlyUsagePercent)
  };
}
