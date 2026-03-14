'use client'

import { useState, useEffect } from 'react'
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton'

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate initial load - will be replaced with real data fetching
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--md-on-surface)]">Billing Overview</h2>
        <p className="text-[var(--md-on-surface-variant)]">Track your credits, usage, and transactions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Credits Remaining"
          value="1,250"
          subtext="of 2,000 monthly"
          trend="+15% from last month"
        />
        <StatCard
          label="Current Usage"
          value="750"
          subtext="credits this month"
          trend="37.5% of allowance"
        />
        <StatCard
          label="Active Alerts"
          value="2"
          subtext="requiring attention"
          trend="View in Alerts tab"
        />
        <StatCard
          label="Team Members"
          value="5"
          subtext="active users"
          trend="2 pending invites"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--md-on-surface)]">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="mekong-button-primary">
            Purchase Credits
          </button>
          <button className="mekong-button-outline">
            View Transactions
          </button>
          <button className="mekong-button-outline">
            Manage Team
          </button>
          <button className="mekong-button-outline">
            Set Alerts
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--md-primary-container)]">
            <svg className="h-5 w-5 text-[var(--md-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-[var(--md-on-surface)]">Dashboard Components Coming Soon</h4>
            <p className="mt-1 text-sm text-[var(--md-on-surface-variant)]">
              Additional dashboard features including usage charts, transaction history, and team management are currently under development.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  subtext: string
  trend: string
}

function StatCard({ label, value, subtext, trend }: StatCardProps) {
  return (
    <div className="rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-4 transition-colors hover:border-[var(--md-outline)]">
      <div className="text-sm text-[var(--md-on-surface-variant)]">{label}</div>
      <div className="mt-1 text-2xl font-bold text-[var(--md-on-surface)]">{value}</div>
      <div className="mt-1 text-xs text-[var(--md-on-surface-variant)]">{subtext}</div>
      <div className="mt-2 text-xs text-[var(--md-primary)]">{trend}</div>
    </div>
  )
}
