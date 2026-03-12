'use client'

import React, { Suspense } from 'react'
import { useAllAnalytics } from '../../lib/analytics-hooks'
import { GlassCard } from '../../components/ui/GlassCard'
import { FadeIn } from '../../components/animations/FadeIn'
import { Loader2 } from 'lucide-react'

// Lazy load heavy chart components for code splitting
const MetricsCard = React.lazy(async () => ({ default: (await import('../../components/analytics/MetricsCard')).MetricsCard }))
const RevenueChart = React.lazy(async () => ({ default: (await import('../../components/analytics/RevenueChart')).RevenueChart }))
const SubscriptionGauge = React.lazy(async () => ({ default: (await import('../../components/analytics/SubscriptionGauge')).SubscriptionGauge }))
const UsageProgressBar = React.lazy(async () => ({ default: (await import('../../components/analytics/UsageProgressBar')).UsageProgressBar }))
const LicenseHealthTable = React.lazy(async () => ({ default: (await import('../../components/analytics/LicenseHealthTable')).LicenseHealthTable }))

// Loading fallback component
const ChartSkeleton = () => (
  <div className="h-64 flex items-center justify-center bg-white/5 rounded-lg">
    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
  </div>
)

export default function AnalyticsPage() {
  const analytics = useAllAnalytics()

  const revenueData = React.useMemo(() => [
    { label: 'MRR', value: analytics.revenue.mrr },
    { label: 'ARR', value: analytics.revenue.arr / 12, projected: true },
  ], [analytics.revenue])

  const subscriptionTiers = React.useMemo(() => [
    { name: 'FREE', count: 1, color: 'secondary' as const },
    { name: 'PRO', count: 1, color: 'primary' as const },
    { name: 'ENTERPRISE', count: 1, color: 'success' as const },
    { name: 'MASTER', count: 0, color: 'warning' as const },
  ], [])

  const usageTiers = React.useMemo(() => {
    const byTier: Record<string, { apiCalls: number; transferMb: number }> = {}
    analytics.usage.byLicense.forEach(license => {
      if (!byTier[license.tier]) {
        byTier[license.tier] = { apiCalls: 0, transferMb: 0 }
      }
      byTier[license.tier].apiCalls += license.apiCalls
      byTier[license.tier].transferMb += license.transferMb
    })

    const limits: Record<string, { apiCalls: number; transferMb: number }> = {
      FREE: { apiCalls: 1000, transferMb: 100 },
      PRO: { apiCalls: 10000, transferMb: 1000 },
      ENTERPRISE: { apiCalls: 100000, transferMb: 10000 },
      MASTER: { apiCalls: 1000000, transferMb: 100000 },
    }

    return Object.entries(byTier).map(([tier, usage]) => ({
      name: tier,
      current: usage.apiCalls,
      limit: limits[tier]?.apiCalls || 1000,
      unit: 'calls',
      description: `${usage.transferMb.toFixed(1)} MB transfer`,
    }))
  }, [analytics.usage])

  const licenses = React.useMemo(() => {
    // Use a fixed future date for demo purposes (impure Date.now not allowed in render)
    const futureDate = '2027-01-01T00:00:00.000Z'
    return analytics.usage.byLicense.map((license, index) => ({
      id: license.licenseId,
      key: `SOPHIA-${license.licenseId.slice(-8).toUpperCase()}`,
      tier: license.tier,
      status: 'active' as const,
      customer: `Customer ${index + 1}`,
      expiresAt: futureDate,
      seats: { used: 1, total: 5 },
    }))
  }, [analytics.usage])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <FadeIn direction="up">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">ROI Analytics Dashboard</h1>
            <p className="text-gray-400">Track revenue, subscriptions, and usage metrics</p>
          </div>
        </FadeIn>

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Suspense fallback={<ChartSkeleton />}>
            <MetricsCard
              title="Monthly Revenue"
              value={`$${analytics.revenue.mrr.toLocaleString()}`}
              delta={{ value: 12, isPositive: true, label: 'vs last month' }}
              glow="success"
              delay={0}
            />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <MetricsCard
              title="Annual Revenue"
              value={`$${analytics.revenue.arr.toLocaleString()}`}
              delta={{ value: 8, isPositive: true, label: 'projected' }}
              glow="primary"
              delay={0.1}
            />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <MetricsCard
              title="Active Licenses"
              value={analytics.health.active.toLocaleString()}
              delta={{ value: 5, isPositive: true, label: 'this week' }}
              glow="secondary"
              delay={0.2}
            />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <MetricsCard
              title="Health Score"
              value={`${analytics.health.healthScore}%`}
              delta={{ value: 2, isPositive: true, label: 'improvement' }}
              glow="success"
              delay={0.3}
            />
          </Suspense>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<ChartSkeleton />}>
            <RevenueChart
              data={revenueData}
              title="Revenue Projection"
              currency="USD"
              height={280}
              animated
            />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <SubscriptionGauge
              tiers={subscriptionTiers}
              title="Subscription Distribution"
              totalLabel="Total Subscribers"
              animated
            />
          </Suspense>
        </div>

        {/* Usage & License Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<ChartSkeleton />}>
            <UsageProgressBar
              tiers={usageTiers}
              title="Usage by Tier"
              animated
              showPercentage
            />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <LicenseHealthTable
              licenses={licenses}
              title="License Distribution"
              maxVisible={5}
              onRowClick={(license: { id: string }) => {
                // Row click handler - can be extended with modal or navigation
                void license
              }}
            />
          </Suspense>
        </div>

        {/* License Status Summary */}
        <FadeIn direction="up" delay={0.5}>
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">License Status Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-white/5">
                <div className="text-2xl font-bold text-green-400">{analytics.health.active}</div>
                <div className="text-sm text-gray-400 mt-1">Active</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <div className="text-2xl font-bold text-red-400">{analytics.health.revoked}</div>
                <div className="text-sm text-gray-400 mt-1">Revoked</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <div className="text-2xl font-bold text-yellow-400">{analytics.health.expired}</div>
                <div className="text-sm text-gray-400 mt-1">Expired</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <div className="text-2xl font-bold text-white">{analytics.health.total}</div>
                <div className="text-sm text-gray-400 mt-1">Total</div>
              </div>
            </div>
          </GlassCard>
        </FadeIn>
      </div>
    </div>
  )
}
