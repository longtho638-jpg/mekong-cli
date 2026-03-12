import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { GlassCard } from '../ui/GlassCard';
import { FadeIn } from '../animations/FadeIn';

export interface MetricsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  delta?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  description?: string;
  className?: string;
  delay?: number;
  glow?: 'primary' | 'secondary' | 'success' | 'warning' | 'none';
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  icon,
  delta,
  description,
  className,
  delay = 0,
  glow = 'none',
}) => {
  const glowStyles = {
    primary: 'border-primary/30 shadow-neon-cyan/20',
    secondary: 'border-secondary/30 shadow-neon-purple/20',
    success: 'border-green-500/30 shadow-green-500/20',
    warning: 'border-yellow-500/30 shadow-yellow-500/20',
    none: '',
  };

  const iconBgStyles = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    success: 'bg-green-500/10 text-green-400',
    warning: 'bg-yellow-500/10 text-yellow-400',
    none: 'bg-white/5 text-gray-400',
  };

  return (
    <FadeIn delay={delay} direction="up">
      <GlassCard
        className={cn(
          'p-6 transition-all duration-300',
          glow !== 'none' && cn('border', glowStyles[glow]),
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {icon && (
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
                  iconBgStyles[glow]
                )}
              >
                {icon}
              </div>
            )}

            <h3 className="text-sm font-medium text-gray-400 mb-1">{title}</h3>

            <motion.div
              key={String(value)}
              initial={{ scale: 0.95, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-3xl font-bold text-white mb-2"
            >
              {value}
            </motion.div>

            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}

            {delta && (
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className={cn(
                    'text-xs font-medium px-1.5 py-0.5 rounded',
                    delta.isPositive
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-red-500/10 text-red-400'
                  )}
                >
                  {delta.isPositive ? '↑' : '↓'} {Math.abs(delta.value)}%
                </span>
                {delta.label && (
                  <span className="text-xs text-gray-500">{delta.label}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </FadeIn>
  );
};
