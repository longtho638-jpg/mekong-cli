'use client'

import { useState, useCallback } from 'react'
import { getTier, getUsage, TierResponse, UsageResponse, ApiError } from '@/lib/api/billing-client'

interface TierCardProps {
  workspaceId: string
}

// Tier configuration with display info
interface TierConfig {
  name: string
  icon: string
  dailyLimit: number | null // null = unlimited
  monthlyLimit: number | null
  price: number
  color: string
}

const TIER_CONFIGS: Record<string, TierConfig> = {
  free: {
    name: 'Free',
    icon: '🆓',
    dailyLimit: 10,
    monthlyLimit: 100,
    price: 0,
    color: 'md-on-surface-variant',
  },
  starter: {
    name: 'Starter',
    icon: '🚀',
    dailyLimit: 50,
    monthlyLimit: 500,
    price: 49,
    color: 'md-primary',
  },
  growth: {
    name: 'Growth',
    icon: '📈',
    dailyLimit: 200,
    monthlyLimit: 2000,
    price: 149,
    color: 'md-secondary',
  },
  pro: {
    name: 'Pro',
    icon: '💎',
    dailyLimit: 500,
    monthlyLimit: 5000,
    price: 299,
    color: 'md-tertiary',
  },
  enterprise: {
    name: 'Enterprise',
    icon: '🏢',
    dailyLimit: null,
    monthlyLimit: null,
    price: 499,
    color: 'md-primary',
  },
}

// Next tier upgrade mapping
const UPGRADE_PATH: Record<string, string | null> = {
  free: 'starter',
  starter: 'growth',
  growth: 'pro',
  pro: 'enterprise',
  enterprise: null, // No upgrade from enterprise
}

/**
 * Tier Card Component
 *
 * Displays current tier information with limits and upgrade options.
 * Handles loading, error, and empty states. Includes refresh functionality.
 */
export default function TierCard({ workspaceId }: TierCardProps) {
  const [tier, setTier] = useState<TierResponse | null>(null)
  const [usage, setUsage] = useState<UsageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const [tierData, usageData] = await Promise.all([
        getTier(workspaceId),
        getUsage(workspaceId),
      ])
      setTier(tierData)
      setUsage(usageData)
    } catch (err) {
      const message = err instanceof ApiError
        ? `Failed to fetch tier info: ${err.message}`
        : 'An unexpected error occurred'
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [workspaceId])

  // Initial fetch
  useState(() => {
    fetchData()
  })

  // Format limit display (handles unlimited)
  const formatLimit = (limit: number | null): string => {
    if (limit === null) return 'Unlimited'
    return limit.toLocaleString('en-US')
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return timestamp
    }
  }

  // Get upgrade URL (Polar checkout)
  const getUpgradeUrl = (): string => {
    // Default to Polar checkout page
    return process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL || 'https://buy.polar.sh/polar'
  }

  // Loading state
  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 animate-pulse rounded-full bg-[var(--md-outline)]" />
            <div className="h-5 w-24 animate-pulse rounded bg-[var(--md-outline)]" />
          </div>
          <div className="h-6 w-6 animate-pulse rounded bg-[var(--md-outline)]" />
        </div>

        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-28 animate-pulse rounded bg-[var(--md-outline)]" />
              <div className="h-4 w-20 animate-pulse rounded bg-[var(--md-outline)]" />
            </div>
          ))}
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 animate-pulse rounded bg-[var(--md-outline)]" />
            <div className="h-3 w-24 animate-pulse rounded bg-[var(--md-outline)]" />
          </div>
        </div>

        <div className="mt-4 h-10 w-full animate-pulse rounded bg-[var(--md-outline)]" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-[var(--md-error-container)] bg-[var(--md-error-container-low)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-6 w-6 text-[var(--md-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-semibold text-[var(--md-on-error-container)]">Current Tier</span>
          </div>
          <button
            onClick={() => fetchData(true)}
            className="rounded-lg p-2 text-[var(--md-on-error-container)] transition-colors hover:bg-[var(--md-error-container-high)]"
            aria-label="Refresh"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-[var(--md-on-error-container)]">{error}</p>

        <button
          onClick={() => fetchData(true)}
          className="mt-4 rounded-lg bg-[var(--md-error)] px-4 py-2 text-sm font-medium text-[var(--md-on-error)] transition-colors hover:bg-[var(--md-error-high)]"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Empty state (no tier data)
  if (!tier) {
    return (
      <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <span className="text-lg font-semibold text-[var(--md-on-surface)]">Current Tier</span>
          </div>
          <button
            onClick={() => fetchData(true)}
            className="rounded-lg p-2 text-[var(--md-on-surface-variant)] transition-colors hover:bg-[var(--md-surface-container-high)]"
            aria-label="Refresh"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-[var(--md-on-surface-variant)]">No tier information available</p>
      </div>
    )
  }

  // Get tier configuration
  const tierConfig = TIER_CONFIGS[tier.tier.toLowerCase()] || TIER_CONFIGS.free
  const nextTierKey = UPGRADE_PATH[tier.tier.toLowerCase()]
  const nextTier = nextTierKey ? TIER_CONFIGS[nextTierKey] : null
  const isEnterprise = tier.tier.toLowerCase() === 'enterprise'

  return (
    <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{tierConfig.icon}</span>
          <div>
            <span className="text-lg font-semibold text-[var(--md-on-surface)]">
              {tierConfig.name}
            </span>
            {isEnterprise && (
              <span className="ml-2 rounded-full bg-[var(--md-primary-container)] px-2 py-0.5 text-xs font-medium text-[var(--md-primary)]">
                Current Plan
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className={`rounded-lg p-2 text-[var(--md-on-surface-variant)] transition-colors hover:bg-[var(--md-surface-container-high)] ${
            refreshing ? 'animate-spin' : ''
          }`}
          aria-label="Refresh"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Limits Grid */}
      <div className="mb-4 space-y-3">
        {/* Daily Limit */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--md-on-surface-variant)]">
            Daily Limit
          </span>
          <span className="text-sm font-semibold text-[var(--md-on-surface)]">
            {usage ? `${usage.daily_used}/${formatLimit(tierConfig.dailyLimit)}` : formatLimit(tierConfig.dailyLimit)}
            <span className="ml-1 text-xs text-[var(--md-on-surface-variant)]">MCU/day</span>
          </span>
        </div>

        {/* Monthly Limit */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--md-on-surface-variant)]">
            Monthly Limit
          </span>
          <span className="text-sm font-semibold text-[var(--md-on-surface)]">
            {usage ? `${usage.monthly_used}/${formatLimit(tierConfig.monthlyLimit)}` : formatLimit(tierConfig.monthlyLimit)}
            <span className="ml-1 text-xs text-[var(--md-on-surface-variant)]">MCU/month</span>
          </span>
        </div>

        {/* Overage */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--md-on-surface-variant)]">
            Overage
          </span>
          <span className={`text-sm font-semibold ${
            tier.overage_allowed
              ? 'text-[var(--md-secondary)]'
              : 'text-[var(--md-on-surface-variant)]'
          }`}>
            {tier.overage_allowed ? '✅ Allowed' : '❌ Not Allowed'}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--md-outline-variant)]" />

      {/* Footer */}
      <div className="mt-4 space-y-3">
        {/* Last Updated */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--md-on-surface-variant)]">
            Updated
          </span>
          <span className="text-xs text-[var(--md-on-surface-variant)]">
            {formatTimestamp(new Date().toISOString())}
          </span>
        </div>

        {/* Upgrade Button */}
        {!isEnterprise && nextTier && (
          <a
            href={getUpgradeUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mekong-button-primary flex w-full items-center justify-center gap-2"
          >
            <span>Upgrade to {nextTier.name}</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        )}

        {/* Enterprise Message */}
        {isEnterprise && (
          <div className="rounded-lg bg-[var(--md-primary-container)] p-3 text-center">
            <p className="text-sm font-medium text-[var(--md-primary)]">
              🎉 You have the highest tier!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
