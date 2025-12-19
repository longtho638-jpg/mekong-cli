'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Shield, Command, Activity, Zap, TrendingDown, AlertTriangle, Award } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Mock data
const taskQueueData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    depth: Math.floor(Math.random() * 50) + 20,
}));

const agentLeaderboard = [
    { name: 'SCOUT-01', tasks: 342, success: 98.5, errors: 5 },
    { name: 'ANALYST-02', tasks: 289, success: 97.2, errors: 8 },
    { name: 'EXECUTOR-03', tasks: 256, success: 96.8, errors: 9 },
    { name: 'GUARDIAN-01', tasks: 198, success: 99.1, errors: 2 },
    { name: 'PLANNER-02', tasks: 187, success: 95.4, errors: 12 },
];

const errorHeatmapData = [
    { agent: 'Scout', mon: 2, tue: 1, wed: 0, thu: 3, fri: 1, sat: 0, sun: 1 },
    { agent: 'Analyst', mon: 1, tue: 2, wed: 1, thu: 1, fri: 0, sat: 2, sun: 1 },
    { agent: 'Executor', mon: 3, tue: 1, wed: 2, thu: 0, fri: 1, sat: 1, sun: 2 },
    { agent: 'Guardian', mon: 0, tue: 0, wed: 1, thu: 0, fri: 0, sat: 0, sun: 1 },
    { agent: 'Planner', mon: 2, tue: 3, wed: 1, thu: 2, fri: 1, sat: 1, sun: 2 },
];

export default function AgentOpsPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('AI');
    const tHubs = useTranslations('Hubs');

    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    const totalTasks = agentLeaderboard.reduce((sum, a) => sum + a.tasks, 0);
    const avgSuccess = (agentLeaderboard.reduce((sum, a) => sum + a.success, 0) / agentLeaderboard.length).toFixed(1);
    const totalErrors = agentLeaderboard.reduce((sum, a) => sum + a.errors, 0);

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-purple-500/30 selection:text-purple-300">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />
            <div className="fixed top-[10%] right-[20%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(168,85,247,0.08)_0%,transparent_70%)] pointer-events-none" />

            {/* Top Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-purple-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-purple-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 animate-pulse">
                            AGENT OPS
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>{tHubs('admin_hub')}</span>
                        <span className="opacity-50">/</span>
                        <span className="text-white">AgentOps</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <Zap className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-purple-300 font-bold">{agentLeaderboard.length} {t('agents_online')}</span>
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
                                        ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
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
                    <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3 text-purple-400">
                        <Activity className="w-9 h-9" />
                        Agent Operations
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse box-content border-4 border-purple-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm max-w-xl">
                        Task Queue Monitoring • Performance Leaderboard • Error Analytics
                    </p>
                </header>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <MetricCard label={t('tasks_running')} value={totalTasks.toString()} icon={<Activity />} color="text-purple-400" />
                    <MetricCard label="Avg Success Rate" value={`${avgSuccess}%`} icon={<Award />} color="text-emerald-400" />
                    <MetricCard label="Total Errors" value={totalErrors.toString()} icon={<AlertTriangle />} color="text-red-400" />
                    <MetricCard label="Queue Depth" value="32" icon={<TrendingDown />} color="text-cyan-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Task Queue Depth */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-cyan-400" />
                            Task Queue Depth (24h)
                        </h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={taskQueueData}>
                                <XAxis dataKey="hour" stroke="#6b7280" fontSize={10} />
                                <YAxis stroke="#6b7280" fontSize={10} />
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        return (
                                            <div className="bg-black/90 border border-purple-500/30 rounded p-2">
                                                <div className="text-xs text-purple-400">{payload[0].payload.hour}</div>
                                                <div className="text-sm font-bold">{payload[0].value} tasks</div>
                                            </div>
                                        );
                                    }}
                                />
                                <Line type="monotone" dataKey="depth" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Agent Performance Leaderboard */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Award className="w-4 h-4 text-emerald-400" />
                            Agent Performance Leaderboard
                        </h3>

                        <div className="space-y-3">
                            {agentLeaderboard.map((agent, i) => (
                                <div key={agent.name} className="flex items-center gap-4 p-3 bg-white/5 rounded border border-white/10">
                                    <div className="text-2xl font-bold text-gray-600">#{i + 1}</div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-purple-300">{agent.name}</div>
                                        <div className="text-xs text-gray-500">{agent.tasks} tasks completed</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-emerald-400">{agent.success}%</div>
                                        <div className="text-xs text-gray-500">{agent.errors} errors</div>
                                    </div>
                                    <div className="w-24">
                                        <div className="h-2 bg-gray-700 rounded overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                                                style={{ width: `${agent.success}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Error Rate Heatmap */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        Error Rate Heatmap (Last 7 Days)
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-3 text-gray-400">Agent Type</th>
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                        <th key={day} className="text-center p-3 text-gray-400">{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {errorHeatmapData.map((row) => (
                                    <tr key={row.agent} className="border-b border-white/5">
                                        <td className="p-3 font-bold text-purple-300">{row.agent}</td>
                                        {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => {
                                            const value = row[day as keyof typeof row] as number;
                                            return (
                                                <td key={day} className="text-center p-3">
                                                    <div
                                                        className={`inline-block w-10 h-10 rounded flex items-center justify-center font-bold ${value === 0
                                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                                : value <= 1
                                                                    ? 'bg-yellow-500/20 text-yellow-400'
                                                                    : value <= 2
                                                                        ? 'bg-orange-500/30 text-orange-400'
                                                                        : 'bg-red-500/40 text-red-400'
                                                            }`}
                                                    >
                                                        {value}
                                                    </div>
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

function MetricCard({ label, value, icon, color }: any) {
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
