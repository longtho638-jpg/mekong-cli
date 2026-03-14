'use client'

import { useState, useEffect } from 'react'
import { getUsage, UsageResponse, ApiError } from '@/lib/api/billing-client'

interface UsageSummaryProps {
  workspaceId: string
}

/**
 * Usage Summary Component
 *
 * Displays usage statistics with progress bars and color coding.
 * Features:
 * - Progress bars for daily/monthly usage
 * - Color coding (green/yellow/red based on usage)
 * - Remaining quota display
 * - Tier information
 * - Overage status
 */
export default function UsageSummary({ workspaceId }: UsageSummaryProps) {
  const [usage, setUsage] = useState<UsageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsage()
  }, [workspaceId])

  const fetchUsage = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getUsage(workspaceId)
      setUsage(data)
    } catch (err) {
      const message = err instanceof ApiError
        ? `Failed to fetch usage: ${err.message}`
        : 'An unexpected error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // Get progress bar color based on percentage
  const getProgressColor = (percent: number): string => {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // Get status text based on percentage
  const getStatusText = (percent: number): string => {
    if (percent >= 90) return 'Critical'
    if (percent >= 70) return 'Warning'
    return 'Healthy'
  }

  // Get status color
  const getStatusColor = (percent: number): string => {
    if (percent >= 90) return 'text-red-500'
    if (percent >= 70) return 'text-yellow-500'
    return 'text-green-500'
  }

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US')
  }

  // Format reset time (next day for daily, next month for monthly)
  const formatResetTime = (type: 'daily' | 'monthly'): string => {
    const now = new Date()
    if (type === 'daily') {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      return `Resets ${tomorrow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      return `Resets ${nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-6 w-6 animate-pulse rounded bg-[var(--md-outline)]" />
          <div className="h-5 w-32 animate-pulse rounded bg-[var(--md-outline)]" />
        </div>
        <div className="space-y-4">
          <div className="h-4 animate-pulse rounded bg-[var(--md-outline)]" />
          <div className="h-20 animate-pulse rounded bg-[var(--md-outline)]" />
          <div className="h-20 animate-pulse rounded bg-[var(--md-outline)]" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-[var(--md-error-container)] bg-[var(--md-error-container-low)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-[var(--md-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-lg font-semibold text-[var(--md-on-error-container)]">Usage Summary</span>
        </div>
        <p className="text-sm text-[var(--md-on-error-container)]">{error}</p>
        <button
          onClick={fetchUsage}
          className="mt-4 rounded-lg bg-[var(--md-error)] px-4 py-2 text-sm font-medium text-[var(--md-on-error)] transition-colors hover:bg-[var(--md-error-high)]"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Empty state
  if (!usage) {
    return (
      <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <svg className="h-6 w-6 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-lg font-semibold text-[var(--md-on-surface)]">Usage Summary</span>
        </div>
        <p className="text-sm text-[var(--md-on-surface-variant)]">No usage data available</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
      <div className="mb-6 flex items-center gap-2">
        <span className="text-2xl">📈</span>
        <span className="text-lg font-semibold text-[var(--md-on-surface)]">Usage Summary</span>
      </div>

      <div className="space-y-6">
        {/* Tier Info */}
        <div className="rounded-lg bg-[var(--md-surface-container)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[var(--md-on-surface-variant)]">Current Tier</div>
              <div className="text-xl font-bold text-[var(--md-on-surface)]">{usage.tier}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-[var(--md-on-surface-variant)]">Overage Allowed</div>
              <div className={`text-sm font-medium ${usage.overage_allowed ? 'text-green-500' : 'text-red-500'}`}>
                {usage.overage_allowed ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Usage */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--md-on-surface-variant)]">Daily Usage</span>
            <span className={`text-sm font-medium ${getStatusColor(usage.daily_percent)}`}>
              {getStatusText(usage.daily_percent)}
            </span>
          </div>
          <div className="mb-2 h-3 w-full rounded-full bg-[var(--md-surface-container-high)]">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor(usage.daily_percent)}`}
              style={{ width: `${Math.min(usage.daily_percent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--md-on-surface-variant)]">
              {formatNumber(usage.daily_used)} / {formatNumber(usage.daily_limit)} credits
            </span>
            <span className="font-medium text-[var(--md-primary)]">
              {formatNumber(usage.daily_remaining)} remaining
            </span>
          </div>
          <div className="mt-1 text-xs text-[var(--md-on-surface-variant)]">
            {formatResetTime('daily')}
          </div>
        </div>

        {/* Monthly Usage */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--md-on-surface-variant)]">Monthly Usage</span>
            <span className={`text-sm font-medium ${getStatusColor(usage.monthly_percent)}`}>
              {getStatusText(usage.monthly_percent)}
            </span>
          </div>
          <div className="mb-2 h-3 w-full rounded-full bg-[var(--md-surface-container-high)]">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor(usage.monthly_percent)}`}
              style={{ width: `${Math.min(usage.monthly_percent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--md-on-surface-variant)]">
              {formatNumber(usage.monthly_used)} / {formatNumber(usage.monthly_limit)} credits
            </span>
            <span className="font-medium text-[var(--md-primary)]">
              {formatNumber(usage.monthly_remaining)} remaining
            </span>
          </div>
          <div className="mt-1 text-xs text-[var(--md-on-surface-variant)]">
            {formatResetTime('monthly')}
          </div>
        </div>
      </div>
    </div>
  )
}
