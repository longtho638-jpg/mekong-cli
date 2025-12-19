'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Command, TrendingUp, Users, MousePointerClick, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, FunnelChart, Funnel, Tooltip } from 'recharts';

// Mock data
const trafficSources = [
    { name: 'Organic', value: 45, color: '#10b981' },
    { name: 'Direct', value: 25, color: '#3b82f6' },
    { name: 'Referral', value: 18, color: '#a855f7' },
    { name: 'Social', value: 12, color: '#f59e0b' },
];

const conversionFunnel = [
    { stage: 'Visitors', value: 10000, fill: '#3b82f6' },
    { stage: 'Sign Ups', value: 3200, fill: '#8b5cf6' },
    { stage: 'Active Users', value: 1500, fill: '#a855f7' },
    { stage: 'Paying', value: 420, fill: '#10b981' },
];

const cohortData = [
    { month: 'Nov', w1: 100, w2: 85, w3: 72, w4: 68 },
    { month: 'Dec', w1: 100, w2: 88, w3: 75, w4: 0 },
    { month: 'Jan', w1: 100, w2: 90, w3: 0, w4: 0 },
];

export default function AnalyticsPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Common');
    const tHubs = useTranslations('Hubs');

    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    const totalVisitors = conversionFunnel[0].value;
    const conversionRate = ((conversionFunnel[3].value / totalVisitors) * 100).toFixed(1);

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-blue-500/30 selection:text-blue-300">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />
            <div className="fixed top-[10%] left-[30%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(59,130,246,0.08)_0%,transparent_70%)] pointer-events-none" />

            {/* Top Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-blue-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-blue-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 animate-pulse">
                            ANALYTICS
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>{tHubs('admin_hub')}</span>
                        <span className="opacity-50">/</span>
                        <span className="text-white">Analytics</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <BarChart3 className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-blue-300 font-bold">LIVE DATA</span>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-gray-400">
                        <Command className="w-3 h-3" />
                        <span>Search...</span>
                        <span className="bg-white/10 px-1 rounded text-[10px]">⌘K</span>
                    </div>

                    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                        {['en', 'vi', 'zh'].map((l) => (
                            <button
                                key={l}
                                onClick={() => switchLocale(l)}
                                className={`px-3 py-1 text-xs font-bold rounded transition-all ${locale === l
                                        ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                        : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                {l.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="pt-24 px-6 max-w-[1920px] mx-auto pb-20">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3 text-blue-400">
                        📊 Analytics Dashboard
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse box-content border-4 border-blue-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm max-w-xl">
                        Traffic Analysis • Conversion Funnel • User Retention
                    </p>
                </header>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Visitors" value="10.0K" icon={<Users />} color="text-blue-400" />
                    <StatCard label="Conversion Rate" value={`${conversionRate}%`} icon={<TrendingUp />} color="text-emerald-400" />
                    <StatCard label="Active Users" value="1.5K" icon={<MousePointerClick />} color="text-purple-400" />
                    <StatCard label="Paying Customers" value="420" icon={<BarChart3 />} color="text-yellow-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Traffic Sources */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Traffic Sources</h3>

                        <div className="flex items-center gap-6">
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={trafficSources}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            dataKey="value"
                                            paddingAngle={3}
                                        >
                                            {trafficSources.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} opacity={0.9} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="flex-1 space-y-2">
                                {trafficSources.map((source) => (
                                    <div key={source.name} className="flex items-center justify-between p-2 bg-white/5 rounded">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                                            <span className="text-sm">{source.name}</span>
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: source.color }}>
                                            {source.value}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Conversion Funnel */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Conversion Funnel</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <FunnelChart>
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-black/90 border border-white/20 rounded p-2">
                                                <div className="text-xs font-bold mb-1">{data.stage}</div>
                                                <div className="text-sm" style={{ color: data.fill }}>
                                                    {data.value.toLocaleString()} users
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Funnel dataKey="value" data={conversionFunnel} isAnimationActive>
                                    {conversionFunnel.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Funnel>
                            </FunnelChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-4 gap-2 mt-4">
                            {conversionFunnel.map((stage) => (
                                <div key={stage.stage} className="text-center p-2 bg-white/5 rounded">
                                    <div className="text-[10px] text-gray-400 mb-1">{stage.stage}</div>
                                    <div className="text-sm font-bold" style={{ color: stage.fill }}>
                                        {(stage.value / 1000).toFixed(1)}K
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* User Retention Cohort */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">User Retention Cohort Analysis</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-3 text-gray-400">Cohort</th>
                                    <th className="text-center p-3 text-gray-400">Week 1</th>
                                    <th className="text-center p-3 text-gray-400">Week 2</th>
                                    <th className="text-center p-3 text-gray-400">Week 3</th>
                                    <th className="text-center p-3 text-gray-400">Week 4</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cohortData.map((row) => (
                                    <tr key={row.month} className="border-b border-white/5">
                                        <td className="p-3 font-bold text-blue-300">{row.month}</td>
                                        {['w1', 'w2', 'w3', 'w4'].map((week) => {
                                            const value = row[week as keyof typeof row] as number;
                                            return (
                                                <td key={week} className="text-center p-3">
                                                    {value > 0 ? (
                                                        <div
                                                            className={`inline-block px-3 py-1 rounded font-bold ${value >= 90
                                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                                    : value >= 75
                                                                        ? 'bg-blue-500/20 text-blue-400'
                                                                        : value >= 60
                                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                                            : 'bg-red-500/20 text-red-400'
                                                                }`}
                                                        >
                                                            {value}%
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-600">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ label, value, icon, color }: any) {
    return (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</div>
                <div className={color}>{icon}</div>
            </div>
            <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
        </div>
    );
}
