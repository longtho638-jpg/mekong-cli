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
                    className="metric-card hover-subtle"
                >
                    {/* Icon + Label */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="text-gray-500">
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
                        <div className={`text-xs mt-1 ${metric.trend.direction === 'up' ? 'text-green-500' : 'text-red-400'
                            }`}>
                            {metric.trend.direction === 'up' ? '↑' : '↓'} {metric.trend.value}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
