import { AgencyCard } from '@/components/ui/agency-card'
import { ArrowDownRight, ArrowUpRight, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RevenueMetricCardProps {
  title: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  iconColor?: string
  variant?: 'neon' | 'glass' | 'glass-pro' | 'bento'
}

export function RevenueMetricCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  iconColor = 'text-emerald-400',
  variant = 'glass-pro'
}: RevenueMetricCardProps) {
  return (
    <AgencyCard variant={variant} className="relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-neutral-400 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
        </div>
        <div className={cn("p-2 rounded-xl bg-white/5", iconColor)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {change && (
        <div className={cn(
          "mt-4 flex items-center text-sm font-medium",
          trend === 'up' ? "text-emerald-400" :
          trend === 'down' ? "text-red-400" : "text-neutral-400"
        )}>
          {trend === 'up' && <ArrowUpRight className="w-4 h-4 mr-1" />}
          {trend === 'down' && <ArrowDownRight className="w-4 h-4 mr-1" />}
          <span>{change}</span>
        </div>
      )}
    </AgencyCard>
  )
}
