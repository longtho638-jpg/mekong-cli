'use client'

import { AgencyCard } from '@/components/ui/agency-card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/format'

interface TrendData {
  snapshot_date: string
  total_revenue: number
  mrr: number
  active_subscribers: number
}

interface RevenueTrendChartProps {
  data: TrendData[]
  loading?: boolean
}

export function RevenueTrendChart({ data, loading }: RevenueTrendChartProps) {
  if (loading) {
    return (
      <AgencyCard variant="glass" className="h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-neutral-500">Loading chart data...</div>
      </AgencyCard>
    )
  }

  if (!data || data.length === 0) {
    return (
      <AgencyCard variant="glass" className="h-[400px] flex items-center justify-center">
        <div className="text-neutral-500">No trend data available</div>
      </AgencyCard>
    )
  }

  return (
    <AgencyCard variant="glass" className="h-[400px] p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">Revenue Trend</h3>
        <p className="text-sm text-neutral-400">30-day MRR growth</p>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis
              dataKey="snapshot_date"
              tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#666"
              fontSize={12}
              tickFormatter={(val) => `$${val/1000}k`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }}
              labelStyle={{ color: '#999' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: number) => [formatCurrency(Number(value)), 'MRR']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Area
              type="monotone"
              dataKey="mrr"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMrr)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AgencyCard>
  )
}
