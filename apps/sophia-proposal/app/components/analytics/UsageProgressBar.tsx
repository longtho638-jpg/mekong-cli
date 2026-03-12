import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { GlassCard } from '../ui/GlassCard';
import { FadeIn } from '../animations/FadeIn';

export interface UsageTier {
  name: string;
  current: number;
  limit: number;
  unit: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  description?: string;
}

export interface UsageProgressBarProps {
  tiers: UsageTier[];
  title?: string;
  className?: string;
  animated?: boolean;
  showPercentage?: boolean;
}

export const UsageProgressBar: React.FC<UsageProgressBarProps> = ({
  tiers,
  title = 'Usage Overview',
  className,
  animated = true,
  showPercentage = true,
}) => {
  const colorMap = {
    primary: 'from-primary/60 to-primary bg-primary',
    secondary: 'from-secondary/60 to-secondary bg-secondary',
    success: 'from-green-500/60 to-green-500 bg-green-500',
    warning: 'from-yellow-500/60 to-yellow-500 bg-yellow-500',
    danger: 'from-red-500/60 to-red-500 bg-red-500',
  };

  const getStatusColor = (percent: number) => {
    if (percent >= 90) return 'danger';
    if (percent >= 70) return 'warning';
    if (percent >= 40) return 'success';
    return 'primary';
  };

  return (
    <FadeIn direction="up">
      <GlassCard data-testid="usage-progress" className={cn('p-6', className)}>
        {title && <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>}

        <div className="space-y-5">
          {tiers.map((tier, index) => {
            const percent = Math.min((tier.current / tier.limit) * 100, 100);
            const isNearLimit = percent >= 80;
            const statusColor = tier.color || getStatusColor(percent);

            return (
              <FadeIn key={tier.name} delay={index * 0.1} direction="left">
                <div className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-300">
                          {tier.name}
                        </span>
                        {isNearLimit && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400">
                            Near limit
                          </span>
                        )}
                      </div>
                      {tier.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {tier.description}
                        </p>
                      )}
                    </div>

                    {showPercentage && (
                      <motion.span
                        key={percent}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded',
                          percent >= 90
                            ? 'bg-red-500/10 text-red-400'
                            : percent >= 70
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'bg-white/5 text-gray-400'
                        )}
                      >
                        {percent.toFixed(0)}%
                      </motion.span>
                    )}
                  </div>

                  <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                    {animated ? (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{
                          duration: 0.8,
                          delay: index * 0.1,
                          ease: [0.21, 0.47, 0.32, 0.98],
                        }}
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          'bg-gradient-to-r',
                          colorMap[statusColor as keyof typeof colorMap],
                          isNearLimit && 'animate-pulse'
                        )}
                      />
                    ) : (
                      <div
                        className={cn(
                          'h-full rounded-full',
                          'bg-gradient-to-r',
                          colorMap[statusColor as keyof typeof colorMap]
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    )}

                    {/* Limit marker */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-white/30"
                      style={{ left: '100%' }}
                    />
                  </div>

                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-gray-500">
                      {tier.current.toLocaleString()} {tier.unit} used
                    </span>
                    <span className="text-xs text-gray-500">
                      {tier.limit.toLocaleString()} {tier.unit} limit
                    </span>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </GlassCard>
    </FadeIn>
  );
};
