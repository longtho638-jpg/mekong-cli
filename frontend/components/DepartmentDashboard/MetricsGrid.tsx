'use client';

import { DepartmentMetric, colorMap } from './types';

interface MetricsGridProps {
    metrics: DepartmentMetric[];
    color: keyof typeof colorMap;
}

export function MetricsGrid({ metrics, color }: MetricsGridProps) {
    const colors = colorMap[color];

    return (
        <div className="bento-catalyst section-in-fluid">
            {metrics.map((metric, index) => {
                // Asymmetrical bento logic: 1st large, then normal, 4th wide
                const isLarge = index === 0;
                const isWide = index === 3;

                return (
                    <div
                        key={index}
                        className={`metric-card-catalyst glass-ultra shadow-catalyst hover-lift hover-glow bento-item ${isLarge ? 'bento-item-large' : isWide ? 'bento-item-wide' : ''
                            }`}
                        style={{
                            animationDelay: `${index * 0.1}s`,
                            borderColor: isLarge ? `${colors.primary}20` : undefined
                        }}
                    >
                        {/* Content Container */}
                        <div className="relative z-10">
                            {/* Icon + Label */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-icon-text-default, 12px)', marginBottom: 8 }}>
                                <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                                    {metric.icon}
                                </div>
                                <span className="text-xs tracking-wide opacity-60 font-semibold uppercase">{metric.label}</span>
                            </div>

                            {/* Value */}
                            <div
                                className={`${isLarge ? 'text-3xl' : 'text-xl'} font-bold tracking-tight mb-1`}
                                style={{ color: metric.color || colors.primary }}
                            >
                                {metric.value}
                            </div>

                            {metric.trend && (
                                <div
                                    className={`text-xs flex items-center font-semibold ${metric.trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}
                                    style={{ gap: 'var(--md-sys-spacing-gap-xs, 4px)' }}
                                >
                                    <span className="opacity-70">{metric.trend.direction === 'up' ? '↗' : '↘'}</span>
                                    <span>{metric.trend.value}</span>
                                    <span className="opacity-40" style={{ marginLeft: 4 }}>vs last period</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
