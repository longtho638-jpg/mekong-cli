'use client'

import { useState, useEffect, useCallback } from 'react'
import { getHistory, type TransactionResponse } from '@/lib/api/billing-client'

interface TransactionTableProps {
  workspaceId: string
  limit?: number
}

const TRANSACTION_TYPES: Record<string, { icon: string; color: string; label: string }> = {
  credit_purchase: { icon: '💳', color: 'text-[var(--md-primary)]', label: 'Purchase' },
  credit_usage: { icon: '⚡', color: 'text-[var(--md-on-surface-variant)]', label: 'Usage' },
  credit_refund: { icon: '↩️', color: 'text-[var(--md-tertiary)]', label: 'Refund' },
  credit_bonus: { icon: '🎁', color: 'text-[var(--md-secondary)]', label: 'Bonus' },
}

const STATUS_CONFIG: Record<string, { badge: string; label: string }> = {
  completed: { badge: 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]', label: 'Completed' },
  pending: { badge: 'bg-[var(--md-tertiary-container)] text-[var(--md-on-tertiary-container)]', label: 'Pending' },
  failed: { badge: 'bg-[var(--md-error-container)] text-[var(--md-on-error-container)]', label: 'Failed' },
}

const RefreshIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const RefreshButton = ({ onClick, disabled, className }: { onClick: () => void; disabled: boolean; className: string }) => (
  <button onClick={onClick} disabled={disabled} className={`rounded-lg p-2 transition-colors hover:bg-[var(--md-surface-container-high)] ${className}`} aria-label="Refresh">
    <RefreshIcon />
  </button>
)

const TransactionRow = ({ tx }: { tx: TransactionResponse }) => {
  const lower = tx.reason.toLowerCase()
  const txType = lower.includes('purchase') || lower.includes('topup') ? 'credit_purchase'
    : lower.includes('refund') || lower.includes('return') ? 'credit_refund'
    : lower.includes('bonus') || lower.includes('promo') ? 'credit_bonus'
    : 'credit_usage'
  const typeConfig = TRANSACTION_TYPES[txType] || TRANSACTION_TYPES.credit_usage
  const status = (tx.metadata?.status as string) || (tx.metadata?.state as string) || 'completed'
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.completed
  const date = new Date(tx.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const sign = tx.amount >= 0 ? '+' : ''
  const amount = `${sign}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

  return (
    <div className="grid grid-cols-1 gap-3 py-3 md:grid-cols-12 md:gap-4 md:py-4">
      <div className="col-span-3 hidden text-sm text-[var(--md-on-surface-variant)] md:block">{date}</div>
      <div className="col-span-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-[var(--md-surface-container)] ${typeConfig.color}`}>
          <span className="text-lg">{typeConfig.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--md-on-surface)]">{tx.reason}</p>
          <p className="truncate text-xs text-[var(--md-on-surface-variant)] md:hidden">{date.split(',')[0]}</p>
        </div>
      </div>
      <div className="col-span-2 flex items-center text-sm text-[var(--md-on-surface-variant)]">{typeConfig.label}</div>
      <div className="col-span-2 flex items-center justify-end text-sm font-semibold">
        <span className={tx.amount >= 0 ? 'text-[var(--md-primary)]' : 'text-[var(--md-error)]'}>{amount} MCU</span>
      </div>
      <div className="col-span-1 flex items-center justify-center md:justify-end">
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusConfig.badge}`}>{statusConfig.label}</span>
      </div>
    </div>
  )
}

export default function TransactionTable({ workspaceId, limit = 10 }: TransactionTableProps) {
  const [transactions, setTransactions] = useState<TransactionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTransactions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const data = await getHistory(workspaceId)
      setTransactions(data.slice(0, limit))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [workspaceId, limit])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const headerContent = (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-lg">📊</span>
        <span className="text-lg font-semibold text-[var(--md-on-surface)]">Transaction History</span>
      </div>
      <RefreshButton onClick={() => fetchTransactions(true)} disabled={refreshing} className={`text-[var(--md-on-surface-variant)] ${refreshing ? 'animate-spin' : ''}`} />
    </div>
  )

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
        {headerContent}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--md-outline)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-[var(--md-outline)]" />
                <div className="h-3 w-24 animate-pulse rounded bg-[var(--md-outline)]" />
              </div>
              <div className="h-6 w-20 animate-pulse rounded bg-[var(--md-outline)]" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[var(--md-error-container)] bg-[var(--md-error-container-low)] p-6">
        {headerContent}
        <p className="text-sm text-[var(--md-on-error-container)]">{error}</p>
        <button onClick={() => fetchTransactions(true)} className="mt-4 rounded-lg bg-[var(--md-error)] px-4 py-2 text-sm font-medium text-[var(--md-on-error)] transition-colors hover:bg-[var(--md-error-high)]">Try Again</button>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
        {headerContent}
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-4xl">📭</span>
          <p className="mt-2 text-sm font-medium text-[var(--md-on-surface)]">No transactions yet</p>
          <p className="text-xs text-[var(--md-on-surface-variant)]">Your transaction history will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
      {headerContent}
      <div className="mb-2 hidden grid-cols-12 gap-4 px-4 text-xs font-medium text-[var(--md-on-surface-variant)] md:grid">
        <div className="col-span-3">Date</div>
        <div className="col-span-4">Description</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2 text-right">Amount</div>
        <div className="col-span-1 text-center">Status</div>
      </div>
      <div className="divide-y divide-[var(--md-outline-variant)]">
        {transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
      </div>
    </div>
  )
}
