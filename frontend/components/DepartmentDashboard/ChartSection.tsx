'use client';

import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DepartmentChartConfig, colorMap } from './types';

interface ChartSectionProps {
    charts: DepartmentChartConfig[];
    color: keyof typeof colorMap;
}

export function ChartSection({ charts, color }: ChartSectionProps) {
    const colors = colorMap[color];

    const renderChart = (chart: DepartmentChartConfig) => {
        const chartColors = chart.data.map((item) => item.color || colors.primary);

        switch (chart.type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chart.data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#0f0f14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12 }}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {chart.data.map((_, index) => (
                                    <Cell key={index} fill={chartColors[index % chartColors.length]} fillOpacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chart.data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#0f0f14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12 }}
                            />
                            <Line type="monotone" dataKey="value" stroke={colors.primary} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'area':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chart.data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <defs>
                                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={colors.primary} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#0f0f14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12 }}
                            />
                            <Area type="monotone" dataKey="value" stroke={colors.primary} strokeWidth={2} fill={`url(#gradient-${color})`} />
                        </AreaChart>
                    </ResponsiveContainer>
                );
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chart.data}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {chart.data.map((entry, index) => (
                                    <Cell key={index} fill={entry.color || chartColors[index % chartColors.length]} fillOpacity={0.85} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: '#0f0f14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12 }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {charts.map((chart, index) => (
                <div key={index} className="chart-container">
                    <h4 className="text-section mb-3">{chart.title}</h4>
                    <div className="h-[220px]">
                        {renderChart(chart)}
                    </div>
                </div>
            ))}
        </div>
    );
}
