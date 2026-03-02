import { Zap, TrendingUp, CreditCard } from 'lucide-react'
import { getBillingData } from '@/lib/fetch-dashboard-data'

type PlanTier = 'free' | 'pro' | 'enterprise'

interface Plan {
  tier: PlanTier
  label: string
  mcuLimit: number
  priceLabel: string
  accentClass: string
}

const PLANS: Plan[] = [
  { tier: 'free',       label: 'Free',       mcuLimit: 10_000,  priceLabel: '$0 / mo',  accentClass: 'text-zinc-400' },
  { tier: 'pro',        label: 'Pro',        mcuLimit: 500_000, priceLabel: '$49 / mo', accentClass: 'text-purple-400' },
  { tier: 'enterprise', label: 'Enterprise', mcuLimit: -1,      priceLabel: 'Custom',   accentClass: 'text-blue-400' },
]

const CURRENT_TIER: PlanTier = 'pro'
const MCU_LIMIT = 500_000

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const barColor = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-purple-500'
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-zinc-500">
          <span className="text-white font-mono">{used.toLocaleString()}</span>
          {' / '}
          <span className="font-mono">{limit.toLocaleString()}</span>
          {' MCU'}
        </span>
        <span className="text-xs font-medium text-zinc-400">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-800" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default async function BillingPage() {
  const { totalMcu, usageHistory } = await getBillingData()
  const currentPlan = PLANS.find((p) => p.tier === CURRENT_TIER)!

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="mt-1 text-sm text-zinc-500">MCU balance, plan details, and usage history.</p>
      </div>

      {/* Current plan + MCU balance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Plan card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            <span className="text-xs text-zinc-500 uppercase tracking-wide">Current Plan</span>
          </div>
          <div className="flex items-end justify-between">
            <span className={`text-2xl font-bold ${currentPlan.accentClass}`}>{currentPlan.label}</span>
            <span className="text-sm text-zinc-400">{currentPlan.priceLabel}</span>
          </div>
          <button
            type="button"
            className="w-full rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            Upgrade Plan
          </button>
        </div>

        {/* MCU balance card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-400" aria-hidden="true" />
            <span className="text-xs text-zinc-500 uppercase tracking-wide">MCU Balance</span>
          </div>
          <UsageBar used={totalMcu} limit={MCU_LIMIT} />
          <p className="text-xs text-zinc-600">Resets on the 1st of each month.</p>
        </div>
      </div>

      {/* Plan comparison */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">Available Plans</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
          {PLANS.map((plan) => {
            const isCurrent = plan.tier === CURRENT_TIER
            return (
              <div key={plan.tier} className={`p-5 space-y-2 ${isCurrent ? 'bg-purple-900/10' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${plan.accentClass}`}>{plan.label}</span>
                  {isCurrent && (
                    <span className="rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 text-xs">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-white">{plan.priceLabel}</p>
                <p className="text-xs text-zinc-500">
                  {plan.mcuLimit === -1 ? 'Unlimited MCU' : `${plan.mcuLimit.toLocaleString()} MCU / mo`}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Usage history */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-zinc-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-white">Usage History</h2>
        </div>
        {usageHistory.length === 0 ? (
          <p className="px-5 py-6 text-sm text-zinc-600">No usage history available.</p>
        ) : (
          <ul className="divide-y divide-zinc-800/60" role="list" aria-label="MCU usage history">
            {usageHistory.map((row) => (
              <li key={row.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/30 transition-colors gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-300 truncate">{row.description}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{row.date}</p>
                </div>
                <span className="font-mono text-xs text-zinc-400 shrink-0">{row.mcu.toLocaleString()} MCU</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
