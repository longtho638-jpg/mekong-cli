import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { GlassCard } from '../ui/GlassCard';
import { FadeIn } from '../animations/FadeIn';

export interface SubscriptionTier {
  name: string;
  count: number;
  color: 'primary' | 'secondary' | 'success' | 'warning';
  maxSubscribers?: number;
}

export interface SubscriptionGaugeProps {
  tiers: SubscriptionTier[];
  title?: string;
  totalLabel?: string;
  className?: string;
  animated?: boolean;
}

export const SubscriptionGauge: React.FC<SubscriptionGaugeProps> = ({
  tiers,
  title = 'Subscription Distribution',
  totalLabel = 'Total Subscribers',
  className,
  animated = true,
}) => {
  const totalSubscribers = tiers.reduce((sum, tier) => sum + tier.count, 0);

  const colorMap = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
  };

  const glowMap = {
    primary: 'shadow-neon-cyan',
    secondary: 'shadow-neon-purple',
    success: 'shadow-green-500/50',
    warning: 'shadow-yellow-500/50',
  };

  const segments = tiers.reduce((acc, tier) => {
    const percent = totalSubscribers > 0 ? (tier.count / totalSubscribers) * 100 : 0;
    const startPercent = acc.cumulativePercent;
    const newCumulativePercent = acc.cumulativePercent + percent;

    acc.segments.push({
      ...tier,
      percent,
      startPercent: startPercent,
      rotation: startPercent * 3.6 - 90,
      arcLength: percent * 3.6,
    });

    return { ...acc, cumulativePercent: newCumulativePercent };
  }, { segments: [] as (SubscriptionTier & { percent: number; startPercent: number; rotation: number; arcLength: number })[], cumulativePercent: 0 }).segments;

  return (
    <FadeIn direction="up">
      <GlassCard data-testid="subscription-gauge" className={cn('p-6', className)}>
        {title && <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>}

        <div className="flex flex-col items-center">
          {/* Gauge Ring */}
          <div className="relative w-48 h-48">
            {/* Background ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="12"
                strokeLinecap="round"
              />
            </svg>

            {/* Animated segments */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {segments.map((segment, index) => {
                if (segment.percent === 0) return null;

                const circumference = 2 * Math.PI * 42;
                const strokeDasharray = (segment.percent / 100) * circumference;
                const strokeDashoffset = -(segment.startPercent / 100) * circumference;

                return (
                  <motion.circle
                    key={segment.name}
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeLinecap="round"
                    className={cn(colorMap[segment.color], glowMap[segment.color])}
                    initial={
                      animated
                        ? { strokeDasharray: 0, opacity: 0 }
                        : { strokeDasharray, opacity: 1 }
                    }
                    animate={
                      animated
                        ? {
                            strokeDasharray,
                            strokeDashoffset,
                            opacity: 1,
                          }
                        : {}
                    }
                    transition={
                      animated
                        ? {
                            duration: 1,
                            delay: index * 0.2,
                            ease: [0.21, 0.47, 0.32, 0.98],
                          }
                        : {}
                    }
                    style={{
                      transformOrigin: '50% 50%',
                    }}
                  />
                );
              })}
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={totalSubscribers}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-bold text-white"
              >
                {totalSubscribers.toLocaleString()}
              </motion.span>
              <span className="text-xs text-gray-400">{totalLabel}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-3 mt-6 w-full">
            {tiers.map((tier, index) => (
              <FadeIn key={tier.name} delay={0.3 + index * 0.1} direction="up">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                  <div
                    className={cn('w-3 h-3 rounded-full', colorMap[tier.color])}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-300">{tier.name}</span>
                      <span className="text-xs font-medium text-white">
                        {tier.count}
                      </span>
                    </div>
                    {tier.maxSubscribers && (
                      <div className="text-xs text-gray-500">
                        Max: {tier.maxSubscribers.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </GlassCard>
    </FadeIn>
  );
};
