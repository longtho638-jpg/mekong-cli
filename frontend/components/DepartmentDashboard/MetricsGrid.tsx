'use client';

import { DepartmentMetric, colorMap } from './types';

interface MetricsGridProps {
    metrics: DepartmentMetric[];
    color: keyof typeof colorMap;
}

export function MetricsGrid({ metrics, color }: MetricsGridProps) {
    const colors = colorMap[color];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
                <div
                    key={index}
                    className="metric-card-wow card-3d stagger-in"
                    style={{ animationDelay: `${index * 0.08}s` }}
                >
                    {/* Icon + Label */}
                    <div className="flex items-center gap-2 mb-3">
                        <div className="text-gray-400 text-sm">
                            {metric.icon}
                        </div>
                        <span className="text-label">{metric.label}</span>
                    </div>

                    {/* Value */}
                    <div className="text-metric" style={{ color: metric.color || colors.primary }}>
                        {metric.value}
                    </div>

                    {/* Trend - subtle */}
                    {metric.trend && (
                        <div className={`text-xs mt-2 flex items-center gap-1 ${metric.trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
                            }`}>
                            <span>{metric.trend.direction === 'up' ? '↑' : '↓'}</span>
                            <span>{metric.trend.value}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
