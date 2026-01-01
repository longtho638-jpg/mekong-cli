'use client';

import { DepartmentChartConfig, colorMap } from './types';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

interface ChartSectionProps {
    charts: DepartmentChartConfig[];
    color: keyof typeof colorMap;
}

const defaultColors = [
    '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#eab308',
];

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload || !payload[0]) return null;

    return (
        <div className="bg-black/95 border border-white/20 rounded-lg p-3 shadow-xl">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            {payload.map((entry: any, index: number) => (
                <div key={index} className="text-sm font-bold" style={{ color: entry.color }}>
                    {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                </div>
            ))}
        </div>
    );
}

export function ChartSection({ charts, color }: ChartSectionProps) {
    const colors = colorMap[color];

    const renderChart = (chart: DepartmentChartConfig, index: number) => {
        const chartColors = chart.colors || defaultColors;

        switch (chart.type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chart.data}>
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                            <YAxis stroke="#6b7280" fontSize={11} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {chart.data.map((entry, i) => (
                                    <Cell key={i} fill={entry.color || chartColors[i % chartColors.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chart.data}>
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                            <YAxis stroke="#6b7280" fontSize={11} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={colors.primary}
                                strokeWidth={2}
                                dot={{ fill: colors.primary, r: 4 }}
                                activeDot={{ r: 6, fill: colors.primary }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={chart.data}>
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                            <YAxis stroke="#6b7280" fontSize={11} />
                            <Tooltip content={<CustomTooltip />} />
                            <defs>
                                <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={colors.primary} stopOpacity={0.4} />
                                    <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={colors.primary}
                                strokeWidth={2}
                                fill={`url(#gradient-${index})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Tooltip content={<CustomTooltip />} />
                            <Pie
                                data={chart.data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                            >
                                {chart.data.map((entry, i) => (
                                    <Cell key={i} fill={entry.color || chartColors[i % chartColors.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {charts.map((chart, index) => (
                <div
                    key={index}
                    className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 
                     hover:border-white/20 transition-all duration-300"
                >
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: colors.primary }} />
                        {chart.title}
                    </h3>
                    {renderChart(chart, index)}
                </div>
            ))}
        </div>
    );
}
