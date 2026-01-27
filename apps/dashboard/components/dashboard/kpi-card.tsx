import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

export interface KPIProps {
  title: string;
  value: string | number;
  trend?: number; // percentage, e.g., 15 for +15%, -5 for -5%
  trendLabel?: string; // e.g., "vs last month"
  sparklineData?: { value: number }[];
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success' | 'warning';
}

export function KPICard({
  title,
  value,
  trend,
  trendLabel = 'vs previous period',
  sparklineData,
  icon,
  color = 'primary'
}: KPIProps) {

  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const isNeutral = trend !== undefined && trend === 0;

  let TrendIcon = Minus;
  let trendColorClass = 'text-[var(--md-sys-color-on-surface-variant)]';

  if (isPositive) {
    TrendIcon = ArrowUp;
    trendColorClass = 'text-green-600 dark:text-green-400';
  } else if (isNegative) {
    TrendIcon = ArrowDown;
    trendColorClass = 'text-red-600 dark:text-red-400';
  }

  // Determine sparkline color based on trend or default to primary
  const sparklineColor = isPositive ? '#16a34a' : isNegative ? '#dc2626' : '#2563eb';

  return (
    <div className="h-full flex flex-col p-4 bg-[var(--md-sys-color-surface)] rounded-[var(--md-sys-shape-corner-medium)] border border-[var(--md-sys-color-outline-variant)] shadow-sm relative overflow-hidden">

      <div className="flex justify-between items-start mb-2">
        <h3 className="m3-label-large text-[var(--md-sys-color-on-surface-variant)] font-medium">
          {title}
        </h3>
        {icon && (
          <div className={`p-2 rounded-full bg-[var(--md-sys-color-${color}-container)] text-[var(--md-sys-color-on-${color}-container)]`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 z-10">
        <span className="m3-display-small font-bold text-[var(--md-sys-color-on-surface)]">
          {value}
        </span>

        {trend !== undefined && (
          <div className="flex items-center gap-1 text-sm">
            <span className={`flex items-center font-medium ${trendColorClass}`}>
              <TrendIcon className="w-4 h-4" />
              {Math.abs(trend)}%
            </span>
            <span className="text-[var(--md-sys-color-on-surface-variant)] opacity-80">
              {trendLabel}
            </span>
          </div>
        )}
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <Area
                type="monotone"
                dataKey="value"
                stroke={sparklineColor}
                fill={sparklineColor}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
