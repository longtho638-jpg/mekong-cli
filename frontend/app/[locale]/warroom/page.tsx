'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Shield, Command, TrendingUp, Cpu, DollarSign, Activity, Zap, AlertTriangle } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock real-time data
const generateMetricData = () => Array.from({ length: 20 }, (_, i) => ({
    time: i,
    value: Math.floor(Math.random() * 30) + 70,
}));

export default function WarroomPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Strategy');
    const tAI = useTranslations('AI');
    const tHubs = useTranslations('Hubs');

    const pathname = usePathname();
    const router = useRouter();

    const [currentTime, setCurrentTime] = useState(new Date());
    const [cpuData] = useState(generateMetricData());
    const [revenueData] = useState(generateMetricData());

    // Real-time ticker state
    const [metrics, setMetrics] = useState({
        cpu: 72,
        revenue: 85420,
        cost: 12340,
        agents: 24,
    });

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    // Simulate real-time updates
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const metricsTimer = setInterval(() => {
            setMetrics(prev => ({
                cpu: Math.max(60, Math.min(95, prev.cpu + (Math.random() - 0.5) * 5)),
                revenue: prev.revenue + Math.floor(Math.random() * 100),
                cost: prev.cost + Math.floor(Math.random() * 10),
                agents: Math.max(20, Math.min(30, prev.agents + Math.floor(Math.random() * 3) - 1)),
            }));
        }, 2000);

        return () => {
            clearInterval(timer);
            clearInterval(metricsTimer);
        };
    }, []);

    // Matrix-style command log
    const commandLogs = [
        { time: '19:42:15', cmd: 'AGENT-SCOUT', status: 'OK', msg: 'Market scan complete: 3 new opportunities' },
        { time: '19:41:52', cmd: 'AGENT-ANALYST', status: 'OK', msg: 'Financial model updated' },
        { time: '19:41:20', cmd: 'AGENT-EXECUTOR', status: 'WARN', msg: 'Low runway detected: 4 months' },
        { time: '19:40:58', cmd: 'AGENT-GUARDIAN', status: 'OK', msg: 'Win-Win-Win check passed' },
        { time: '19:40:12', cmd: 'SYSTEM', status: 'OK', msg: 'All agents operational' },
    ];

    // Agent Health Grid (10x10)
    const agentGrid = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        status: Math.random() > 0.9 ? 'error' : Math.random() > 0.7 ? 'warning' : 'active',
    }));

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-red-500/30 selection:text-red-300">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />

            {/* Red glow for warroom atmosphere */}
            <div className="fixed top-[10%] right-[20%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(239,68,68,0.08)_0%,transparent_70%)] pointer-events-none" />

            {/* Top Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-red-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-red-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-red-500/20 border border-red-500/30 rounded text-red-300 animate-pulse">
                            WAR ROOM
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>{tHubs('strategy_hub')}</span>
                        <span className="opacity-50">/</span>
                        <span className="text-white">{t('warroom')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Live Status */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                        <span className="text-xs text-red-300 font-bold">LIVE</span>
                        <span className="text-xs text-gray-500">|</span>
                        <span className="text-xs text-gray-400" suppressHydrationWarning>
                            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
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
                                    ? 'bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
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
                    <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3 text-red-400">
                        🏯 {t('warroom')}
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse box-content border-4 border-red-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm max-w-xl">
                        Real-time Command Center • Agent Health Monitoring • System Metrics
                    </p>
                </header>

                {/* Real-time Ticker Tape */}
                <div className="bg-[#0A0A0A] border border-red-500/20 rounded-xl p-4 mb-6 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <TickerMetric icon={<Cpu className="w-4 h-4" />} label={tAI('cpu_usage')} value={`${metrics.cpu.toFixed(1)}%`} color="text-cyan-400" />
                            <TickerMetric icon={<DollarSign className="w-4 h-4" />} label={tAI('revenue')} value={`$${(metrics.revenue / 1000).toFixed(1)}K`} color="text-emerald-400" />
                            <TickerMetric icon={<TrendingUp className="w-4 h-4" />} label={tAI('cost_today')} value={`$${(metrics.cost / 1000).toFixed(1)}K`} color="text-orange-400" />
                            <TickerMetric icon={<Activity className="w-4 h-4" />} label={tAI('agents_online')} value={metrics.agents.toString()} color="text-purple-400" />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded">
                            <Zap className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs text-emerald-300 font-bold">{tAI('copilot_active')}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Agent Health Grid */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-400" />
                            {tAI('agent_health')}
                        </h3>

                        <div className="grid grid-cols-10 gap-1">
                            {agentGrid.map((agent) => (
                                <div
                                    key={agent.id}
                                    className={`w-full aspect-square rounded-sm transition-all ${agent.status === 'active'
                                        ? 'bg-emerald-500/80 shadow-[0_0_4px_rgba(16,185,129,0.5)] animate-pulse'
                                        : agent.status === 'warning'
                                            ? 'bg-yellow-500/60'
                                            : 'bg-red-500/60'
                                        }`}
                                    title={`Agent ${agent.id}: ${agent.status}`}
                                />
                            ))}
                        </div>

                        <div className="flex items-center justify-between mt-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                <span className="text-gray-400">Active: 88</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                <span className="text-gray-400">Warning: 10</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                <span className="text-gray-400">Error: 2</span>
                            </div>
                        </div>
                    </div>

                    {/* CPU Trend */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-cyan-400" />
                            {tAI('cpu_usage')} Trend
                        </h3>

                        <ResponsiveContainer width="100%" height={150}>
                            <AreaChart data={cpuData}>
                                <defs>
                                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} fill="url(#cpuGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>

                        <div className="text-center mt-4">
                            <div className="text-3xl font-bold text-cyan-400">{metrics.cpu.toFixed(1)}%</div>
                            <div className="text-xs text-gray-500">Current Load</div>
                        </div>
                    </div>

                    {/* Revenue Trend */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            {tAI('revenue')} Trend
                        </h3>

                        <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={revenueData}>
                                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>

                        <div className="text-center mt-4">
                            <div className="text-3xl font-bold text-emerald-400">${(metrics.revenue / 1000).toFixed(1)}K</div>
                            <div className="text-xs text-gray-500">Today's Total</div>
                        </div>
                    </div>
                </div>

                {/* Matrix-style Command Log */}
                <div className="bg-[#0A0A0A] border border-red-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                        {tAI('command_log')}
                    </h3>

                    <div className="space-y-2 font-mono text-xs">
                        {commandLogs.map((log, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 p-2 bg-black/50 rounded border border-white/5 hover:border-white/20 transition-all"
                            >
                                <span className="text-gray-600">[{log.time}]</span>
                                <span className="text-cyan-400 w-36">{log.cmd}</span>
                                <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === 'OK'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : log.status === 'WARN'
                                            ? 'bg-yellow-500/20 text-yellow-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}
                                >
                                    {log.status}
                                </span>
                                <span className="flex-1 text-gray-400">{log.msg}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

function TickerMetric({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={color}>{icon}</div>
            <div>
                <div className="text-[10px] text-gray-500 uppercase">{label}</div>
                <div className={`text-lg font-bold font-mono ${color}`} suppressHydrationWarning>
                    {value}
                </div>
            </div>
        </div>
    );
}
