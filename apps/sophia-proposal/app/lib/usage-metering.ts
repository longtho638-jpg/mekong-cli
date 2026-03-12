// Usage Metering Service for Sophia ROIaaS Phase 4
// Tracks API usage per license with in-memory storage

import type { UsageMetric } from './usage-limits'
import { getLimit, isUnlimited } from './usage-limits'
import { LicenseService } from './license-service'

/**
 * Usage record structure
 */
export interface UsageRecord {
  licenseId: string
  metric: UsageMetric
  value: number
  timestamp: Date
}

/**
 * Aggregated usage for a period
 */
export interface UsageSummary {
  apiCalls: number
  transferMb: number
  periodStart: Date
  periodEnd: Date
}

/**
 * In-memory storage for usage records
 */
class UsageMeteringClass {
  private records: Map<string, UsageRecord[]> = new Map()

  /**
   * Record usage for a license
   */
  recordUsage(licenseId: string, metric: UsageMetric, value: number): void {
    if (!this.records.has(licenseId)) {
      this.records.set(licenseId, [])
    }

    const records = this.records.get(licenseId)!
    records.push({
      licenseId,
      metric,
      value,
      timestamp: new Date(),
    })

    // Cleanup old records (keep last 90 days)
    this.cleanup(licenseId)
  }

  /**
   * Get usage summary for a license
   * Period: 'day' for API calls, 'month' for transfer
   */
  getUsage(licenseId: string, period: 'day' | 'month' = 'day'): UsageSummary {
    const records = this.records.get(licenseId) || []
    const now = new Date()

    // Calculate period start
    const periodStart = new Date(now)
    if (period === 'day') {
      periodStart.setHours(0, 0, 0, 0)
    } else {
      periodStart.setDate(1)
      periodStart.setHours(0, 0, 0, 0)
    }

    // Filter records within period
    const periodRecords = records.filter(r => r.timestamp >= periodStart)

    // Aggregate by metric
    const summary: UsageSummary = {
      apiCalls: 0,
      transferMb: 0,
      periodStart,
      periodEnd: now,
    }

    periodRecords.forEach(record => {
      if (record.metric === 'api_calls') {
        summary.apiCalls += record.value
      } else {
        summary.transferMb += record.value
      }
    })

    return summary
  }

  /**
   * Check if license has exceeded its limit
   */
  checkLimit(licenseId: string): {
    exceeded: boolean
    apiCallsPercent: number
    transferMbPercent: number
  } {
    const license = LicenseService.getById(licenseId)
    if (!license) {
      return { exceeded: false, apiCallsPercent: 0, transferMbPercent: 0 }
    }

    // Check API calls (daily limit)
    const dailyUsage = this.getUsage(licenseId, 'day')
    const apiCallsLimit = getLimit(license.tier, 'api_calls')
    const apiCallsPercent = isUnlimited(license.tier)
      ? 0
      : (dailyUsage.apiCalls / apiCallsLimit) * 100

    // Check transfer (monthly limit)
    const monthlyUsage = this.getUsage(licenseId, 'month')
    const transferMbLimit = getLimit(license.tier, 'transfer_mb')
    const transferMbPercent = isUnlimited(license.tier)
      ? 0
      : (monthlyUsage.transferMb / transferMbLimit) * 100

    const exceeded = apiCallsPercent >= 100 || transferMbPercent >= 100

    return {
      exceeded,
      apiCallsPercent: Math.min(100, apiCallsPercent),
      transferMbPercent: Math.min(100, transferMbPercent),
    }
  }

  /**
   * Get detailed usage stats for a license
   */
  getUsageStats(licenseId: string): {
    tier: string
    apiCalls: { used: number; limit: number; percent: number }
    transferMb: { used: number; limit: number; percent: number }
    status: 'normal' | 'warning' | 'critical' | 'exceeded'
  } {
    const license = LicenseService.getById(licenseId)
    const dailyUsage = this.getUsage(licenseId, 'day')
    const monthlyUsage = this.getUsage(licenseId, 'month')

    if (!license) {
      return {
        tier: 'unknown',
        apiCalls: { used: 0, limit: 0, percent: 0 },
        transferMb: { used: 0, limit: 0, percent: 0 },
        status: 'normal',
      }
    }

    const apiCallsLimit = getLimit(license.tier, 'api_calls')
    const transferMbLimit = getLimit(license.tier, 'transfer_mb')

    const apiCallsPercent = isUnlimited(license.tier)
      ? 0
      : Math.round((dailyUsage.apiCalls / apiCallsLimit) * 100)

    const transferMbPercent = isUnlimited(license.tier)
      ? 0
      : Math.round((monthlyUsage.transferMb / transferMbLimit) * 100)

    // Determine status based on higher of the two percentages
    const maxPercent = Math.max(apiCallsPercent, transferMbPercent)
    let status: 'normal' | 'warning' | 'critical' | 'exceeded' = 'normal'
    if (maxPercent >= 100) status = 'exceeded'
    else if (maxPercent >= 90) status = 'critical'
    else if (maxPercent >= 80) status = 'warning'

    return {
      tier: license.tier,
      apiCalls: {
        used: dailyUsage.apiCalls,
        limit: isUnlimited(license.tier) ? Infinity : apiCallsLimit,
        percent: apiCallsPercent,
      },
      transferMb: {
        used: monthlyUsage.transferMb,
        limit: isUnlimited(license.tier) ? Infinity : transferMbLimit,
        percent: transferMbPercent,
      },
      status,
    }
  }

  /**
   * Cleanup old records for a license
   */
  private cleanup(licenseId: string): void {
    const records = this.records.get(licenseId) || []
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days
    const filtered = records.filter(r => r.timestamp >= cutoff)
    if (filtered.length !== records.length) {
      this.records.set(licenseId, filtered)
    }
  }

  /**
   * Clear all usage data (for testing)
   */
  clear(): void {
    this.records.clear()
  }
}

// Singleton instance
export const UsageMetering = new UsageMeteringClass()
