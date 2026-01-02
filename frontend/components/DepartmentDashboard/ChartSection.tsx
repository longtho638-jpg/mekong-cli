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
                                contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, backdropFilter: 'blur(10px)' }}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
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
                                contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, backdropFilter: 'blur(10px)' }}
                            />
                            <Line type="monotone" dataKey="value" stroke={colors.primary} strokeWidth={3} dot={{ fill: colors.primary, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'area':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chart.data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <defs>
                                <linearGradient id={`gradient-max-${color}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={colors.primary} stopOpacity={0.4} />
                                    <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, backdropFilter: 'blur(10px)' }}
                            />
                            <Area type="monotone" dataKey="value" stroke={colors.primary} strokeWidth={3} fill={`url(#gradient-max-${color})`} />
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
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={4}
                                dataKey="value"
                            >
                                {chart.data.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={entry.color || chartColors[index % chartColors.length]}
                                        fillOpacity={0.9}
                                        stroke="rgba(255,255,255,0.05)"
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, backdropFilter: 'blur(10px)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 section-in-fluid" style={{ animationDelay: '0.2s' }}>
            {charts.map((chart, index) => (
                <div
                    key={index}
                    className="chart-container glass-liquid spotlight-card bento-item glass-refraction"
                    style={{ height: '320px', animationDelay: `${0.3 + index * 0.1}s` }}
                >
                    <div className="relative z-10 flex flex-col h-full">
                        <h4 className="text-label mb-4 px-2 opacity-70 tracking-widest uppercase">{chart.title}</h4>
                        <div className="flex-1 min-h-0">
                            {renderChart(chart)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
