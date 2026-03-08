import { createClient } from '@/lib/supabase/server'
import { Target, Bot, TrendingUp, Activity } from 'lucide-react'
import { MissionFeedTable } from '@/components/mission-feed-table'
import { AgentActivityLog } from '@/components/agent-activity-log-scrollable'
import { McuUsageBarChart } from '@/components/mcu-usage-bar-chart-svg'
import { TradeMonitorWidget } from '@/components/trading/TradeMonitorWidget'
import { getMissions, getDashboardStats } from '@/lib/fetch-dashboard-data'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? 'User'

  const [stats, recentMissions] = await Promise.all([
    getDashboardStats(),
    getMissions(5),
  ])

  const STATS = [
    { label: 'Total Missions',  value: String(stats.totalMissions),    icon: Target,    color: 'text-purple-400' },
    { label: 'Agents Running',  value: String(stats.activeAgentsCount), icon: Bot,       color: 'text-blue-400' },
    { label: 'Active Tasks',    value: String(stats.activeMissions),    icon: Activity,  color: 'text-cyan-400' },
    { label: 'Success Rate',    value: stats.successRate,               icon: TrendingUp, color: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, <span className="text-purple-400">{email.split('@')[0]}</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Here&apos;s your RaaS engine status.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-medium">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
            </div>
            <span className="text-3xl font-bold text-white">{value}</span>
          </div>
        ))}
      </div>

      {/* Trade Monitor Widget */}
      <TradeMonitorWidget
        tenantId={user?.id || 'anonymous'}
        apiKey={process.env.NEXT_PUBLIC_RAAS_API_KEY || ''}
        tier="pro"
        showHeader={true}
        compact={false}
      />

      {/* MCU Chart + Activity Log side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <McuUsageBarChart />
        <AgentActivityLog />
      </div>

      {/* Recent Missions — dữ liệu thực từ mission-history.json */}
      <MissionFeedTable title="Recent Missions" missions={recentMissions} maxRows={5} />
    </div>
  )
}
