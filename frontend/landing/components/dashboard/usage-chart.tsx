'use client'

import { useState, useEffect } from 'react'
import { getUsage, UsageResponse, ApiError } from '@/lib/api/billing-client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface UsageChartProps {
  workspaceId: string
}

type TimeRange = 'daily' | 'monthly'

interface ChartData {
  name: string
  used: number
  remaining: number
  percent: number
}

/**
 * Usage Chart Component with Recharts
 *
 * Displays daily/monthly usage with bar chart visualization.
 * Features:
 * - Daily/monthly toggle
 * - Color-coded bars (green/yellow/red based on usage)
 * - Tooltip with detailed info
 */
export default function UsageChart({ workspaceId }: UsageChartProps) {
  const [usage, setUsage] = useState<UsageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('daily')

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

  // Generate chart data based on time range
  const getChartData = (): ChartData[] => {
    if (!usage) return []

    const isDaily = timeRange === 'daily'
    const used = isDaily ? usage.daily_used : usage.monthly_used
    const limit = isDaily ? usage.daily_limit : usage.monthly_limit
    const remaining = limit - used
    const percent = isDaily ? usage.daily_percent : usage.monthly_percent

    return [
      {
        name: 'Used',
        used,
        remaining: 0,
        percent,
      },
      {
        name: 'Remaining',
        used: 0,
        remaining,
        percent: 100 - percent,
      },
    ]
  }

  // Get bar color based on usage percentage
  const getBarColor = (percent: number): string => {
    if (percent >= 90) return '#ef4444' // Red - critical
    if (percent >= 70) return '#f59e0b' // Yellow - warning
    return '#22c55e' // Green - healthy
  }

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US')
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number; name: string }[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] px-3 py-2 text-sm">
          <p className="font-medium text-[var(--md-on-surface)]">{data.name}</p>
          <p className="text-[var(--md-on-surface-variant)]">{formatNumber(data.value)} credits</p>
        </div>
      )
    }
    return null
  }

  const chartData = getChartData()
  const currentPercent = timeRange === 'daily' ? usage?.daily_percent : usage?.monthly_percent
  const barColor = currentPercent ? getBarColor(currentPercent) : '#22c55e'

  // Loading state
  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-[var(--md-on-surface)]">Usage Overview</span>
          </div>
          <div className="h-8 w-24 animate-pulse rounded bg-[var(--md-outline)]" />
        </div>
        <div className="h-48 animate-pulse rounded bg-[var(--md-outline-variant)]" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-[var(--md-error-container)] bg-[var(--md-error-container-low)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[var(--md-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-semibold text-[var(--md-on-error-container)]">Usage Overview</span>
          </div>
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

  return (
    <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <span className="text-lg font-semibold text-[var(--md-on-surface)]">Usage Overview</span>
        </div>

        {/* Time Range Toggle */}
        <div className="flex rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] p-1">
          <button
            onClick={() => setTimeRange('daily')}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              timeRange === 'daily'
                ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)]'
                : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setTimeRange('monthly')}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              timeRange === 'monthly'
                ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)]'
                : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--md-outline-variant)" />
            <XAxis type="number" stroke="var(--md-on-surface-variant)" fontSize={12} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="var(--md-on-surface-variant)"
              fontSize={12}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="used"
              radius={[4, 4, 4, 4]}
              fill={barColor}
            />
            <Bar
              dataKey="remaining"
              radius={[4, 4, 4, 4]}
              fill="#94a3b8"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      {usage && (
        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-[var(--md-outline-variant)] pt-4">
          <div>
            <div className="text-xs text-[var(--md-on-surface-variant)]">
              {timeRange === 'daily' ? 'Daily Used' : 'Monthly Used'}
            </div>
            <div className="text-lg font-bold text-[var(--md-on-surface)]">
              {formatNumber(timeRange === 'daily' ? usage.daily_used : usage.monthly_used)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--md-on-surface-variant)]">
              {timeRange === 'daily' ? 'Daily Limit' : 'Monthly Limit'}
            </div>
            <div className="text-lg font-bold text-[var(--md-on-surface)]">
              {formatNumber(timeRange === 'daily' ? usage.daily_limit : usage.monthly_limit)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--md-on-surface-variant)]">Remaining</div>
            <div className="text-lg font-bold text-[var(--md-primary)]">
              {formatNumber(timeRange === 'daily' ? usage.daily_remaining : usage.monthly_remaining)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
