'use client';

import { DepartmentMetric, colorMap } from './types';

interface MetricsGridProps {
    metrics: DepartmentMetric[];
    color: keyof typeof colorMap;
}

export function MetricsGrid({ metrics, color }: MetricsGridProps) {
    const colors = colorMap[color];

    return (
        <div className="bento-grid section-in-fluid">
            {metrics.map((metric, index) => {
                // Asymmetrical bento logic: 1st large, then normal, 4th wide
                const isLarge = index === 0;
                const isWide = index === 3;

                return (
                    <div
                        key={index}
                        className={`metric-card-wow spotlight-card bento-item ${isLarge ? 'bento-item-large' : isWide ? 'bento-item-wide' : ''
                            }`}
                        style={{
                            animationDelay: `${index * 0.1}s`,
                            borderColor: isLarge ? `${colors.primary}40` : undefined
                        }}
                    >
                        {/* Liquid Glass Layer */}
                        <div className="absolute inset-0 bg-white/[0.01] backdrop-blur-[24px]" />

                        {/* Content Container */}
                        <div className="relative z-10">
                            {/* Icon + Label */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 rounded-lg bg-white/5 border border-white/10 glass-refraction">
                                    {metric.icon}
                                </div>
                                <span className="text-label tracking-widest opacity-60">{metric.label}</span>
                            </div>

                            {/* Value */}
                            <div
                                className={`${isLarge ? 'text-4xl' : 'text-2xl'} font-bold tracking-tight mb-1`}
                                style={{ color: metric.color || colors.primary }}
                            >
                                {metric.value}
                            </div>

                            {/* Trend */}
                            {metric.trend && (
                                <div className={`text-xs flex items-center gap-1 font-medium ${metric.trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    <span className="opacity-70">{metric.trend.direction === 'up' ? '↗' : '↘'}</span>
                                    <span>{metric.trend.value}</span>
                                    <span className="opacity-40 ml-1">vs last period</span>
                                </div>
                            )}

                            {/* Subtle Refraction Glow */}
                            {isLarge && (
                                <div
                                    className="absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-20 pointer-events-none"
                                    style={{ background: colors.primary }}
                                />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
