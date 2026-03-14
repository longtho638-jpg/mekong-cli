'use client'

import { useState, useCallback } from 'react'
import { getBalance, BalanceResponse, ApiError } from '@/lib/api/billing-client'

interface CreditBalanceCardProps {
  workspaceId: string
}

/**
 * Credit Balance Card Component
 *
 * Displays credit balance, total earned, and total spent with visual styling.
 * Handles loading, error, and empty states. Includes refresh functionality.
 */
export default function CreditBalanceCard({ workspaceId }: CreditBalanceCardProps) {
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchBalance = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const data = await getBalance(workspaceId)
      setBalance(data)
    } catch (err) {
      const message = err instanceof ApiError
        ? `Failed to fetch balance: ${err.message}`
        : 'An unexpected error occurred'
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [workspaceId])

  // Initial fetch
  useState(() => {
    fetchBalance()
  })

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US')
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

  // Loading state
  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 animate-pulse rounded-full bg-[var(--md-outline)]" />
            <div className="h-5 w-32 animate-pulse rounded bg-[var(--md-outline)]" />
          </div>
          <div className="h-8 w-8 animate-pulse rounded bg-[var(--md-outline)]" />
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-24 animate-pulse rounded bg-[var(--md-outline)]" />
              <div className="h-6 w-20 animate-pulse rounded bg-[var(--md-outline)]" />
            </div>
          ))}
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 animate-pulse rounded bg-[var(--md-outline)]" />
            <div className="h-3 w-24 animate-pulse rounded bg-[var(--md-outline)]" />
          </div>
        </div>
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
            <span className="text-lg font-semibold text-[var(--md-on-error-container)]">Credit Balance</span>
          </div>
          <button
            onClick={() => fetchBalance(true)}
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
          onClick={() => fetchBalance(true)}
          className="mt-4 rounded-lg bg-[var(--md-error)] px-4 py-2 text-sm font-medium text-[var(--md-on-error)] transition-colors hover:bg-[var(--md-error-high)]"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Empty state (no balance data)
  if (!balance) {
    return (
      <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-6 w-6 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-semibold text-[var(--md-on-surface)]">Credit Balance</span>
          </div>
          <button
            onClick={() => fetchBalance(true)}
            className="rounded-lg p-2 text-[var(--md-on-surface-variant)] transition-colors hover:bg-[var(--md-surface-container-high)]"
            aria-label="Refresh"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-[var(--md-on-surface-variant)]">No balance data available</p>
      </div>
    )
  }

  // Normal state with data
  return (
    <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <span className="text-lg font-semibold text-[var(--md-on-surface)]">Credit Balance</span>
        </div>
        <button
          onClick={() => fetchBalance(true)}
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

      <div className="space-y-4">
        {/* Balance */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--md-on-surface-variant)]">Balance</span>
          <span className="text-xl font-bold text-[var(--md-primary)]">
            {formatNumber(balance.balance)} MCU
          </span>
        </div>

        {/* Total Earned */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--md-on-surface-variant)]">Total Earned</span>
          <span className="text-lg font-semibold text-[var(--md-tertiary)]">
            +{formatNumber(balance.total_earned)} MCU
          </span>
        </div>

        {/* Total Spent */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--md-on-surface-variant)]">Total Spent</span>
          <span className="text-lg font-semibold text-[var(--md-error)]">
            -{formatNumber(balance.total_spent)} MCU
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--md-outline-variant)]" />

        {/* Last Updated */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--md-on-surface-variant)]">Updated</span>
          <span className="text-xs text-[var(--md-on-surface-variant)]">
            {formatTimestamp(balance.updated_at)}
          </span>
        </div>
      </div>
    </div>
  )
}
