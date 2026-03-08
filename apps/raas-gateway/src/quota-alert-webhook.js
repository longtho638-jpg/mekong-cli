/**
 * RaaS Quota Alert Webhook Service
 * Sends webhook notifications when quota thresholds are crossed
 * Prevents alert spam with rate limiting (max 1 alert per hour per threshold)
 */

import { QUOTA_THRESHOLDS } from './quota-types.js';

/**
 * Build KV key for tracking sent alerts
 * @param {string} licenseKey
 * @param {string} threshold - "80" | "100"
 * @param {string} dateHour - YYYY-MM-DD-HH
 * @returns {string}
 */
function buildAlertKVKey(licenseKey, threshold, dateHour) {
  return `quota:alerts:${licenseKey}:${threshold}:${dateHour}`;
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
 * Check if alert was already sent in current hour (rate limiting)
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} licenseKey
 * @param {number} threshold
 * @returns {Promise<boolean>}
 */
export async function shouldSendAlert(env, licenseKey, threshold) {
  if (!env.QUOTA_KV) {
    return true; // No KV configured, allow alerts
  }

  try {
    const hourBucket = getCurrentHourBucket();
    const key = buildAlertKVKey(licenseKey, String(threshold), hourBucket);
    const existing = await env.QUOTA_KV.get(key);
    return !existing; // Send if no alert sent this hour
  } catch (err) {
    console.error('ShouldSendAlert error:', err.message);
    return true; // Fail open - allow alert
  }
}

/**
 * Track that an alert was sent (prevents duplicate alerts within hour)
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
    // Store for 2 hours to ensure no overlap
    await env.QUOTA_KV.put(key, Date.now().toString(), { expirationTtl: 7200 });
  } catch (err) {
    console.error('TrackAlertSent error:', err.message);
  }
}

/**
 * Send quota alert webhook to AgencyOS dashboard
 * @param {object} env - Cloudflare Worker env bindings
 * @param {Object} alertData
 * @param {string} alertData.licenseKey
 * @param {string} alertData.alertType - 'quota_warning' | 'quota_exceeded'
 * @param {number} alertData.threshold - 80 | 100
 * @param {object} alertData.status - QuotaStatus object
 * @param {string} alertData.timestamp - ISO timestamp
 * @returns {Promise<boolean>}
 */
export async function sendQuotaAlert(env, alertData) {
  const webhookUrl = env.AGENCYOS_WEBHOOK_URL;
  const authToken = env.AGENCYOS_WEBHOOK_AUTH_TOKEN;

  if (!webhookUrl || !authToken) {
    console.warn('Webhook not configured, skipping quota alert');
    return false;
  }

  // Rate limit check
  const shouldSend = await shouldSendAlert(env, alertData.licenseKey, alertData.threshold);
  if (!shouldSend) {
    console.log(`Alert already sent this hour for ${alertData.licenseKey} at ${alertData.threshold}%`);
    return false;
  }

  try {
    const payload = {
      eventType: alertData.alertType,
      licenseKey: alertData.licenseKey,
      threshold: alertData.threshold,
      timestamp: alertData.timestamp,
      status: {
        monthlyUsagePercent: alertData.status.monthlyUsagePercent,
        dailyUsagePercent: alertData.status.dailyUsagePercent,
        hourlyUsagePercent: alertData.status.hourlyUsagePercent,
        isOverQuota: alertData.status.isOverQuota,
        exceededLimits: alertData.status.exceededLimits,
        remaining: alertData.status.limit.monthlyRequests - alertData.status.usage.monthlyRequests
      },
      metadata: {
        tier: alertData.status.limit.tier,
        monthlyLimit: alertData.status.limit.monthlyRequests,
        monthlyUsed: alertData.status.usage.monthlyRequests,
        overageAllowed: alertData.status.limit.overageAllowed,
        overageRate: alertData.status.limit.overageRate
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'User-Agent': 'RaaS-Gateway-Quota-Alert/1.0'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`Quota alert sent successfully for ${alertData.licenseKey} at ${alertData.threshold}%`);
      // Track that alert was sent
      await trackAlertSent(env, alertData.licenseKey, alertData.threshold);
      return true;
    } else {
      console.error(`Quota alert failed with status: ${response.status}`);
      return false;
    }
  } catch (err) {
    console.error('SendQuotaAlert error:', err.message);
    return false;
  }
}

/**
 * Check and trigger alerts based on quota status
 * Main entry point for alert evaluation
 * @param {object} env - Cloudflare Worker env bindings
 * @param {import('./quota-types.js').QuotaCheckResult} quotaResult
 * @returns {Promise<void>}
 */
export async function checkAndTriggerAlerts(env, quotaResult) {
  if (!quotaResult || !quotaResult.status) {
    return;
  }

  const { status } = quotaResult;
  const timestamp = new Date().toISOString();

  // Check 100% threshold (quota exceeded)
  if (status.isOverQuota) {
    await sendQuotaAlert(env, {
      licenseKey: status.licenseKey,
      alertType: 'quota_exceeded',
      threshold: 100,
      status,
      timestamp
    });
  }
  // Check 80% threshold (warning)
  else if (status.isNearQuota) {
    await sendQuotaAlert(env, {
      licenseKey: status.licenseKey,
      alertType: 'quota_warning',
      threshold: 80,
      status,
      timestamp
    });
  }
}
