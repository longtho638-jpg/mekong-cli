/**
 * RaaS Quota Enforcement System - Type Definitions
 *
 * Implements real-time usage quota tracking and enforcement
 * for Stripe/Polar billing integration
 */

/**
 * @typedef {Object} QuotaLimit
 * @property {string} licenseKey - The mk_ API key
 * @property {string} tier - free | pro | enterprise
 * @property {number} monthlyRequests - Monthly request limit
 * @property {number} monthlyPayloadBytes - Monthly payload limit in bytes
 * @property {number} dailyRequests - Daily request limit (optional)
 * @property {number} hourlyRequests - Hourly request limit (optional)
 * @property {string} billingPeriodStart - ISO timestamp
 * @property {string} billingPeriodEnd - ISO timestamp
 * @property {boolean} overageAllowed - Whether overage billing is enabled
 * @property {number} overageRate - Price per extra request (cents)
 */

/**
 * @typedef {Object} UsageCounters
 * @property {string} licenseKey - The mk_ API key
 * @property {number} monthlyRequests - Requests this billing period
 * @property {number} monthlyPayloadBytes - Payload bytes this period
 * @property {number} dailyRequests - Requests today (UTC day)
 * @property {number} hourlyRequests - Requests this hour (UTC hour)
 * @property {string} lastUpdated - ISO timestamp
 */

/**
 * @typedef {Object} QuotaStatus
 * @property {string} licenseKey - The mk_ API key
 * @property {QuotaLimit} limit - Quota limits
 * @property {UsageCounters} usage - Current usage
 * @property {number} monthlyUsagePercent - 0-100
 * @property {number} dailyUsagePercent - 0-100 (if daily limit set)
 * @property {number} hourlyUsagePercent - 0-100 (if hourly limit set)
 * @property {boolean} isOverQuota - Whether quota is exceeded
 * @property {boolean} isNearQuota - Whether at 80% threshold
 * @property {string[]} exceededLimits - Array of exceeded limit types
 */

/**
 * @typedef {Object} QuotaCheckResult
 * @property {boolean} allowed - Whether request is allowed
 * @property {QuotaStatus} status - Current quota status
 * @property {number} remaining - Requests remaining
 * @property {number} resetIn - Seconds until quota reset
 * @property {string} blockReason - Reason for blocking (if any)
 */

/**
 * @typedef {Object} QuotaAlert
 * @property {string} licenseKey - The mk_ API key
 * @property {string} alertType - quota_warning | quota_exceeded | overage_enabled
 * @property {number} threshold - Percentage threshold (80, 100)
 * @property {QuotaStatus} status - Status at time of alert
 * @property {string} timestamp - ISO timestamp
 * @property {string} webhookUrl - Webhook destination
 */

/**
 * Quota thresholds for alerts
 * @enum {number}
 */
export const QUOTA_THRESHOLDS = {
  WARNING: 80,    // Send webhook alert
  CRITICAL: 95,   // Send urgent alert
  EXCEEDED: 100   // Block requests (or enable overage)
};

/**
 * KV key prefixes for quota storage
 * @enum {string}
 */
export const KV_KEYS = {
  LIMITS: 'quota:limits:',        // quota:limits:<licenseKey>
  USAGE: 'quota:usage:',          // quota:usage:<licenseKey>
  ALERTS: 'quota:alerts:',        // quota:alerts:<licenseKey>:<timestamp>
  DAILY: 'quota:daily:',          // quota:daily:<licenseKey>:<YYYY-MM-DD>
  HOURLY: 'quota:hourly:'         // quota:hourly:<licenseKey>:<YYYY-MM-DD-HH>
};

/**
 * Default quota limits by tier
 * @type {Record<string, Partial<QuotaLimit>>}
 */
export const DEFAULT_TIER_LIMITS = {
  free: {
    monthlyRequests: 1000,
    monthlyPayloadBytes: 10 * 1024 * 1024, // 10MB
    dailyRequests: 100,
    hourlyRequests: 20,
    overageAllowed: false
  },
  trial: {
    monthlyRequests: 500,
    monthlyPayloadBytes: 5 * 1024 * 1024, // 5MB
    dailyRequests: 50,
    hourlyRequests: 10,
    overageAllowed: false
  },
  pro: {
    monthlyRequests: 10000,
    monthlyPayloadBytes: 100 * 1024 * 1024, // 100MB
    dailyRequests: 1000,
    hourlyRequests: 100,
    overageAllowed: true,
    overageRate: 0.001 // $0.001 per extra request
  },
  enterprise: {
    monthlyRequests: 100000,
    monthlyPayloadBytes: 1024 * 1024 * 1024, // 1GB
    dailyRequests: 10000,
    hourlyRequests: 1000,
    overageAllowed: true,
    overageRate: 0.0005 // $0.0005 per extra request
  },
  service: {
    monthlyRequests: Infinity,
    monthlyPayloadBytes: Infinity,
    dailyRequests: Infinity,
    hourlyRequests: Infinity,
    overageAllowed: true,
    overageRate: 0
  }
};
