'use client';

import { DepartmentMetric, colorMap } from './types';

interface MetricsGridProps {
    metrics: DepartmentMetric[];
    color: keyof typeof colorMap;
}

export function MetricsGrid({ metrics, color }: MetricsGridProps) {
    const colors = colorMap[color];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
                <div
                    key={index}
                    className="group bg-[#0A0A0A] border border-white/10 rounded-xl p-5 
                     hover:border-opacity-50 hover:scale-[1.02] transition-all duration-300
                     hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                    style={{
                        animationDelay: `${index * 100}ms`,
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                            {metric.label}
                        </div>
                        <div className={`${colors.text} opacity-70 group-hover:opacity-100 transition-opacity`}>
                            {metric.icon}
                        </div>
                    </div>

                    {/* Value */}
                    <div className="flex items-end justify-between">
                        <div
                            className="text-3xl font-bold font-mono transition-all group-hover:scale-105"
                            style={{ color: metric.color || colors.primary }}
                        >
                            {metric.value}
                        </div>

                        {/* Trend */}
                        {metric.trend && (
                            <div
                                className={`text-xs font-bold px-2 py-1 rounded ${metric.trend.direction === 'up'
                                        ? 'bg-green-500/20 text-green-400'
                                        : metric.trend.direction === 'down'
                                            ? 'bg-red-500/20 text-red-400'
                                            : 'bg-gray-500/20 text-gray-400'
                                    }`}
                            >
                                {metric.trend.direction === 'up' && '↑'}
                                {metric.trend.direction === 'down' && '↓'}
                                {metric.trend.direction === 'neutral' && '→'}
                                {' '}{metric.trend.value}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
