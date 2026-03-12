import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { GlassCard } from '../ui/GlassCard';
import { FadeIn } from '../animations/FadeIn';

export interface RevenueDataPoint {
  label: string;
  value: number;
  projected?: boolean;
}

export interface RevenueChartProps {
  data: RevenueDataPoint[];
  title?: string;
  currency?: 'USD' | 'VND';
  height?: number;
  className?: string;
  showGrid?: boolean;
  animated?: boolean;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  title = 'Revenue Overview',
  currency = 'USD',
  height = 240,
  className,
  showGrid = true,
  animated = true,
}) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = height - 40;

  const formatValue = (value: number) => {
    if (currency === 'VND') {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    return `$${value.toLocaleString('en-US')}`;
  };

  const bars = data.map((point, index) => {
    const barHeight = (point.value / maxValue) * chartHeight;
    const isProjected = point.projected;

    return (
      <div
        key={point.label}
        className="flex-1 flex flex-col items-center gap-2 group"
        style={{ minWidth: '40px' }}
      >
        <div className="relative w-full flex justify-center" style={{ height: chartHeight }}>
          {animated ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: barHeight, opacity: 1 }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              className={cn(
                'w-full max-w-[48px] rounded-t-lg transition-all duration-300',
                isProjected
                  ? 'bg-gradient-to-t from-secondary/40 to-secondary/60 border-t-2 border-dashed border-secondary'
                  : 'bg-gradient-to-t from-primary/60 to-primary border-t-2 border-primary/80',
                'group-hover:from-primary/80 group-hover:to-primary'
              )}
              style={{ height: barHeight }}
            />
          ) : (
            <div
              className={cn(
                'w-full max-w-[48px] rounded-t-lg',
                isProjected
                  ? 'bg-gradient-to-t from-secondary/40 to-secondary/60 border-t-2 border-dashed border-secondary'
                  : 'bg-gradient-to-t from-primary/60 to-primary border-t-2 border-primary/80'
              )}
              style={{ height: barHeight }}
            />
          )}

          {/* Value tooltip */}
          <div
            className={cn(
              'absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-medium',
              'bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'
            )}
          >
            {formatValue(point.value)}
          </div>
        </div>

        <span className="text-xs text-gray-400 font-medium">{point.label}</span>
      </div>
    );
  });

  const gridLines = showGrid
    ? [0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
        <div
          key={idx}
          className="absolute left-0 right-0 border-t border-white/5"
          style={{ bottom: ratio * chartHeight }}
        >
          <span className="absolute -left-12 -top-1.5 text-xs text-gray-500">
            {formatValue(maxValue * ratio)}
          </span>
        </div>
      ))
    : null;

  return (
    <FadeIn direction="up">
      <GlassCard data-testid="revenue-chart" className={cn('p-6', className)}>
        {title && <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>}

        <div className="relative" style={{ height }}>
          {gridLines}

          <div className="absolute inset-0 flex items-end gap-2 pl-12">{bars}</div>
        </div>
      </GlassCard>
    </FadeIn>
  );
};
