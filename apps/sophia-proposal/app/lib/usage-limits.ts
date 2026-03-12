// Usage Limits for Sophia ROIaaS Phase 4
// Tier-based usage limits for API calls and data transfer

import type { LicenseTier } from './license-types.js'

/**
 * Metric types for usage tracking
 */
export type UsageMetric = 'api_calls' | 'transfer_mb'

/**
 * Usage limit configuration per tier
 */
export interface TierLimits {
  apiCalls: number      // API calls per day
  transferMb: number    // MB transfer per month
}

/**
 * Tier-based usage limits
 * - FREE: 10 API calls/day, 100 MB/month
 * - PRO: 1000 API calls/day, 10 GB/month
 * - ENTERPRISE: 10000 API calls/day, 100 GB/month
 * - MASTER: unlimited
 */
export const USAGE_LIMITS: Record<LicenseTier, TierLimits> = {
  FREE: {
    apiCalls: 10,
    transferMb: 100,
  },
  PRO: {
    apiCalls: 1000,
    transferMb: 10 * 1024, // 10 GB
  },
  ENTERPRISE: {
    apiCalls: 10000,
    transferMb: 100 * 1024, // 100 GB
  },
  MASTER: {
    apiCalls: Number.MAX_SAFE_INTEGER,
    transferMb: Number.MAX_SAFE_INTEGER,
  },
}

/**
 * Alert thresholds (percentage of limit)
 */
export const ALERT_THRESHOLDS = [80, 90, 100]

/**
 * Get usage limit for a specific tier and metric
 */
export function getLimit(tier: LicenseTier, metric: UsageMetric): number {
  const limits = USAGE_LIMITS[tier]
  return metric === 'api_calls' ? limits.apiCalls : limits.transferMb
}

/**
 * Check if tier has unlimited usage
 */
export function isUnlimited(tier: LicenseTier): boolean {
  return tier === 'MASTER'
}

/**
 * Calculate usage percentage
 */
export function calculateUsagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

/**
 * Get alert level based on usage percentage
 * Returns: null, 'warning' (80%), 'critical' (90%), 'exceeded' (100%)
 */
export function getAlertLevel(percent: number): string | null {
  if (percent >= 100) return 'exceeded'
  if (percent >= 90) return 'critical'
  if (percent >= 80) return 'warning'
  return null
}
