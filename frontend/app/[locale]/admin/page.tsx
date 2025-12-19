'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Shield, Command, Users, DollarSign, TrendingUp, Activity, Server, AlertCircle } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, LineChart, Line } from 'recharts';

// Mock data generators
const generateSparklineData = (baseValue: number, variance: number) =>
    Array.from({ length: 15 }, (_, i) => ({
        time: i,
        value: baseValue + (Math.random() - 0.5) * variance,
    }));

export default function AdminPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('AI');
    const tHubs = useTranslations('Hubs');

    const pathname = usePathname();
    const router = useRouter();

    const [metrics, setMetrics] = useState({
        revenue: 128500,
        users: 1247,
        costs: 42300,
        uptime: 99.97,
    });

    const [revenueData] = useState(generateSparklineData(128000, 5000));
    const [usersData] = useState(generateSparklineData(1200, 100));
    const [costsData] = useState(generateSparklineData(42000, 2000));

    // Agent grid (10x10 = 100 agents)
    const agentGrid = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        status: Math.random() > 0.92 ? 'error' : Math.random() > 0.75 ? 'warning' : 'active',
    }));

    const activeAgents = agentGrid.filter((a) => a.status === 'active').length;
    const warningAgents = agentGrid.filter((a) => a.status === 'warning').length;
    const errorAgents = agentGrid.filter((a) => a.status === 'error').length;

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    // Simulate real-time updates
    useEffect(() => {
        const timer = setInterval(() => {
            setMetrics((prev) => ({
                revenue: prev.revenue + Math.floor(Math.random() * 1000) - 200,
                users: Math.max(1000, prev.users + Math.floor(Math.random() * 10) - 4),
                costs: prev.costs + Math.floor(Math.random() * 100) - 30,
                uptime: Math.max(99.5, Math.min(100, prev.uptime + (Math.random() - 0.5) * 0.1)),
            }));
        }, 3000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-emerald-500/30 selection:text-emerald-300">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />

            {/* Emerald glow */}
            <div className="fixed top-[10%] left-[20%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none" />

            {/* Top Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-emerald-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-300 animate-pulse">
                            ADMIN
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>{tHubs('admin_hub')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* System Status */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-emerald-300 font-bold">OPERATIONAL</span>
                        <span className="text-xs text-gray-500">|</span>
                        <span className="text-xs text-gray-400">{metrics.uptime.toFixed(2)}%</span>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-gray-400">
                        <Command className="w-3 h-3" />
                        <span>Search...</span>
                        <span className="bg-white/10 px-1 rounded text-[10px]">⌘K</span>
                    </div>

                    {/* Language Switcher */}
                    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                        {['en', 'vi', 'zh'].map((l) => (
                            <button
                                key={l}
                                onClick={() => switchLocale(l)}
                                className={`px-3 py-1 text-xs font-bold rounded transition-all ${locale === l
                                        ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
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
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3 text-emerald-400">
                        📋 {tHubs('admin_hub')}
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse box-content border-4 border-emerald-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm max-w-xl">
                        System Health • Agent Monitoring • KPI Dashboard
                    </p>
                </header>

                {/* KPI Cards with Sparklines */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <KPICard
                        icon={<DollarSign className="w-4 h-4" />}
                        label="Revenue (MRR)"
                        value={`$${(metrics.revenue / 1000).toFixed(1)}K`}
                        change="+12.5%"
                        data={revenueData}
                        color="#10b981"
                    />
                    <KPICard
                        icon={<Users className="w-4 h-4" />}
                        label="Active Users"
                        value={metrics.users.toString()}
                        change="+8.2%"
                        data={usersData}
                        color="#3b82f6"
                    />
                    <KPICard
                        icon={<TrendingUp className="w-4 h-4" />}
                        label={t('cost_today')}
                        value={`$${(metrics.costs / 1000).toFixed(1)}K`}
                        change="-2.1%"
                        data={costsData}
                        color="#f59e0b"
                    />
                    <KPICard
                        icon={<Server className="w-4 h-4" />}
                        label="System Uptime"
                        value={`${metrics.uptime.toFixed(2)}%`}
                        change="Stable"
                        data={[]}
                        color="#8b5cf6"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Agent Health Grid */}
                    <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-400" />
                                {t('agent_health')}
                            </h3>
                            <div className="text-xs text-gray-500">100 Agents Total</div>
                        </div>

                        <div className="grid grid-cols-10 gap-1.5 mb-4">
                            {agentGrid.map((agent) => (
                                <div
                                    key={agent.id}
                                    className={`w-full aspect-square rounded-sm transition-all cursor-pointer hover:scale-125 ${agent.status === 'active'
                                            ? 'bg-emerald-500/90 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse'
                                            : agent.status === 'warning'
                                                ? 'bg-yellow-500/70 shadow-[0_0_4px_rgba(234,179,8,0.4)]'
                                                : 'bg-red-500/70 shadow-[0_0_4px_rgba(239,68,68,0.4)]'
                                        }`}
                                    title={`Agent ${agent.id}: ${agent.status.toUpperCase()}`}
                                />
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-xs">
                            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                    <span className="text-gray-400">Active</span>
                                </div>
                                <span className="text-lg font-bold text-emerald-400">{activeAgents}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                    <span className="text-gray-400">Warning</span>
                                </div>
                                <span className="text-lg font-bold text-yellow-400">{warningAgents}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                                    <span className="text-gray-400">Error</span>
                                </div>
                                <span className="text-lg font-bold text-red-400">{errorAgents}</span>
                            </div>
                        </div>
                    </div>

                    {/* System Alerts */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-400" />
                            {t('system_alerts')}
                        </h3>

                        <div className="space-y-3">
                            {[
                                { type: 'info', msg: 'Database backup completed', time: '2m ago' },
                                { type: 'warning', msg: 'High memory usage detected', time: '15m ago' },
                                { type: 'success', msg: 'SSL certificate renewed', time: '1h ago' },
                                { type: 'error', msg: 'Failed login attempt from unknown IP', time: '3h ago' },
                            ].map((alert, i) => (
                                <div
                                    key={i}
                                    className={`p-3 rounded border-l-4 text-xs ${alert.type === 'error'
                                            ? 'bg-red-500/10 border-red-500'
                                            : alert.type === 'warning'
                                                ? 'bg-yellow-500/10 border-yellow-500'
                                                : alert.type === 'success'
                                                    ? 'bg-emerald-500/10 border-emerald-500'
                                                    : 'bg-blue-500/10 border-blue-500'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-white">{alert.type.toUpperCase()}</span>
                                        <span className="text-gray-500">{alert.time}</span>
                                    </div>
                                    <p className="text-gray-300">{alert.msg}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Task Summary Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[
                        { title: 'Pending Tasks', count: 12, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                        { title: 'In Progress', count: 8, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { title: 'Completed Today', count: 24, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    ].map((item) => (
                        <div key={item.title} className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                            <div className={`text-sm text-gray-400 mb-2`}>{item.title}</div>
                            <div className={`text-4xl font-bold ${item.color}`}>{item.count}</div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

function KPICard({ icon, label, value, change, data, color }: any) {
    return (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</div>
                <div style={{ color }}>{icon}</div>
            </div>

            <div className="text-2xl font-bold font-mono tracking-tight mb-2" style={{ color }}>
                {value}
            </div>

            {data.length > 0 && (
                <div className="h-12 -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#gradient-${label})`} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="text-[10px] mt-2" style={{ color }}>
                {change}
            </div>
        </div>
    );
}
