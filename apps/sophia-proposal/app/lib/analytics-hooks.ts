// Analytics Hooks for Sophia Phase 5.1
// React hooks for dashboard metrics and license health monitoring

import { useMemo } from 'react'
import { LicenseService } from './license-service'
import { UsageMetering } from './usage-metering'
import type { LicenseStats } from './license-types'

/**
 * Revenue metrics returned by useRevenueMetrics
 */
export interface RevenueMetrics {
  mrr: number         // Monthly Recurring Revenue
  arr: number         // Annual Recurring Revenue
  totalRevenue: number
  byTier: Record<string, number>
}

/**
 * Subscription metrics from Polar webhook data
 */
export interface SubscriptionMetrics {
  activeSubscriptions: number
  churnRate: number
  uncancelledSubscriptions: number
  cancelledSubscriptions: number
}

/**
 * Usage metrics from UsageMetering
 */
export interface UsageMetrics {
  totalApiCalls: number
  totalTransferMb: number
  byLicense: Array<{
    licenseId: string
    tier: string
    apiCalls: number
    transferMb: number
  }>
}

/**
 * License health status
 */
export interface LicenseHealth {
  total: number
  active: number
  revoked: number
  expired: number
  healthScore: number  // 0-100
}

/**
 * Hook: Calculate revenue metrics from LicenseService
 *
 * @returns Revenue metrics (MRR, ARR, total revenue)
 */
export function useRevenueMetrics(): RevenueMetrics {
  return useMemo(() => {
    try {
      const licenses = LicenseService.getAll()

      // Pricing tiers (reference Polar.sh configuration)
      const PRICING: Record<string, number> = {
        FREE: 0,
        PRO: 49,
        ENTERPRISE: 149,
        MASTER: 499,
      }

      // Calculate MRR from active subscriptions
      const byTier: Record<string, number> = { FREE: 0, PRO: 0, ENTERPRISE: 0, MASTER: 0 }
      let mrr = 0

      licenses.forEach((license) => {
        if (license.status === 'active' || license.subscriptionStatus === 'active') {
          const price = PRICING[license.tier] || 0
          byTier[license.tier] += price
          mrr += price
        }
      })

      return {
        mrr,
        arr: mrr * 12,
        totalRevenue: mrr, // Simplified: current MRR as total
        byTier,
      }
    } catch (error) {
      // Log error for debugging (development only)
      // TODO: Replace with proper error tracking (Sentry, etc.)
      return {
        mrr: 0,
        arr: 0,
        totalRevenue: 0,
        byTier: { FREE: 0, PRO: 0, ENTERPRISE: 0, MASTER: 0 },
      }
    }
  }, [])
}

/**
 * Hook: Get subscription metrics from Polar webhook data
 *
 * @returns Subscription metrics (active, churn rate, etc.)
 */
export function useSubscriptionMetrics(): SubscriptionMetrics {
  return useMemo(() => {
    try {
      const licenses = LicenseService.getAll()

      let active = 0
      let cancelled = 0
      let uncancelled = 0

      licenses.forEach((license) => {
        if (license.subscriptionStatus === 'active') {
          active++
        } else if (license.subscriptionStatus === 'cancelled') {
          cancelled++
        } else if (license.subscriptionStatus === 'uncancelled') {
          uncancelled++
        }
      })

      // Churn rate = cancelled / (active + cancelled)
      const totalWithSubscription = active + cancelled
      const churnRate = totalWithSubscription > 0
        ? Math.round((cancelled / totalWithSubscription) * 100)
        : 0

      return {
        activeSubscriptions: active,
        churnRate,
        uncancelledSubscriptions: uncancelled,
        cancelledSubscriptions: cancelled,
      }
    } catch (error) {
      // Log error for debugging (development only)
      // eslint-disable-next-line no-console
      console.error('Error calculating subscription metrics:', error)
      return {
        activeSubscriptions: 0,
        churnRate: 0,
        uncancelledSubscriptions: 0,
        cancelledSubscriptions: 0,
      }
    }
  }, [])
}

/**
 * Hook: Get usage metrics from UsageMetering service
 *
 * @returns Usage metrics (API calls, transfer MB)
 */
export function useUsageMetrics(): UsageMetrics {
  return useMemo(() => {
    try {
      const licenses = LicenseService.getAll()
      const byLicense: UsageMetrics['byLicense'] = []
      let totalApiCalls = 0
      let totalTransferMb = 0

      licenses.forEach((license) => {
        const usage = UsageMetering.getUsage(license.id, 'day')
        const monthlyUsage = UsageMetering.getUsage(license.id, 'month')

        const licenseUsage = {
          licenseId: license.id,
          tier: license.tier,
          apiCalls: usage.apiCalls,
          transferMb: monthlyUsage.transferMb,
        }

        byLicense.push(licenseUsage)
        totalApiCalls += usage.apiCalls
        totalTransferMb += monthlyUsage.transferMb
      })

      return {
        totalApiCalls,
        totalTransferMb,
        byLicense,
      }
    } catch (error) {
      // Log error for debugging (development only)
      // TODO: Replace with proper error tracking (Sentry, etc.)
      return {
        totalApiCalls: 0,
        totalTransferMb: 0,
        byLicense: [],
      }
    }
  }, [])
}

/**
 * Hook: Get license health status
 *
 * @returns License health metrics and score
 */
export function useLicenseHealth(): LicenseHealth {
  return useMemo(() => {
    try {
      const stats: LicenseStats = LicenseService.getStats()

      const total = stats.total
      const active = stats.byStatus.active
      const revoked = stats.byStatus.revoked
      const expired = stats.byStatus.expired

      // Health score = (active / total) * 100
      const healthScore = total > 0
        ? Math.round((active / total) * 100)
        : 100

      return {
        total,
        active,
        revoked,
        expired,
        healthScore,
      }
    } catch (error) {
      // Log error for debugging (development only)
      // TODO: Replace with proper error tracking (Sentry, etc.)
      return {
        total: 0,
        active: 0,
        revoked: 0,
        expired: 0,
        healthScore: 100,
      }
    }
  }, [])
}

/**
 * Combined hook: Get all analytics metrics at once
 * More efficient than calling individual hooks separately
 *
 * @returns All analytics metrics
 */
export function useAllAnalytics() {
  const revenue = useRevenueMetrics()
  const subscription = useSubscriptionMetrics()
  const usage = useUsageMetrics()
  const health = useLicenseHealth()

  return useMemo(() => ({
    revenue,
    subscription,
    usage,
    health,
  }), [revenue, subscription, usage, health])
}
