'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Command, Briefcase, TrendingUp, DollarSign, Target, Award } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, FunnelChart, Funnel, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Sales pipeline stages
const pipelineStages = [
    { stage: 'Prospecting', value: 120, fill: '#3b82f6' },
    { stage: 'Qualified', value: 85, fill: '#8b5cf6' },
    { stage: 'Proposal', value: 45, fill: '#a855f7' },
    { stage: 'Negotiation', value: 28, fill: '#10b981' },
    { stage: 'Closed Won', value: 18, fill: '#22c55e' },
];

const velocityData = Array.from({ length: 6 }, (_, i) => ({
    month: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    avgDays: 45 - i * 3 + Math.random() * 5,
}));

const repPerformance = [
    { name: 'Sarah Chen', deals: 24, value: 480000, quota: 500000 },
    { name: 'Mike Johnson', deals: 19, value: 420000, quota: 450000 },
    { name: 'Lisa Wang', deals: 16, value: 380000, quota: 400000 },
    { name: 'Tom Rodriguez', deals: 12, value: 290000, quota: 350000 },
    { name: 'Emma Davis', deals: 9, value: 210000, quota: 300000 },
];

export default function SalesPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Common');

    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    const totalPipeline = pipelineStages.reduce((sum, s) => sum + s.value, 0);
    const totalValue = repPerformance.reduce((sum, r) => sum + r.value, 0);
    const avgVelocity = Math.round(velocityData.reduce((sum, v) => sum + v.avgDays, 0) / velocityData.length);

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-green-500/30 selection:text-green-300">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />
            <div className="fixed top-[15%] right-[20%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(34,197,94,0.08)_0%,transparent_70%)] pointer-events-none" />

            <nav className="fixed top-0 w-full z-50 border-b border-green-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-green-500/20 border border-green-500/30 rounded text-green-300 animate-pulse">
                            SALES
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>Sales</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <Briefcase className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-green-300 font-bold">{totalPipeline} Deals</span>
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
                                        ? 'bg-green-500/20 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
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
                    <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3 text-green-400">
                        💼 Sales Dashboard
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse box-content border-4 border-green-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm max-w-xl">
                        Pipeline Management • Deal Velocity • Rep Performance
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Pipeline Value" value={`$${(totalValue / 1000000).toFixed(1)}M`} icon={<DollarSign />} color="text-green-400" />
                    <StatCard label="Total Deals" value={totalPipeline.toString()} icon={<Briefcase />} color="text-blue-400" />
                    <StatCard label="Avg Velocity" value={`${avgVelocity}d`} icon={<TrendingUp />} color="text-purple-400" />
                    <StatCard label="Win Rate" value="15%" icon={<Target />} color="text-emerald-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Pipeline Funnel */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Sales Pipeline Funnel</h3>

                        <ResponsiveContainer width="100%" height={280}>
                            <FunnelChart>
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-black/90 border border-white/20 rounded p-2">
                                                <div className="text-xs font-bold mb-1">{data.stage}</div>
                                                <div className="text-sm" style={{ color: data.fill }}>
                                                    {data.value} deals
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Funnel dataKey="value" data={pipelineStages} isAnimationActive>
                                    {pipelineStages.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Funnel>
                            </FunnelChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-5 gap-2 mt-4 text-xs">
                            {pipelineStages.map((stage) => (
                                <div key={stage.stage} className="text-center p-2 bg-white/5 rounded">
                                    <div className="text-[10px] text-gray-400 mb-1">{stage.stage}</div>
                                    <div className="text-sm font-bold" style={{ color: stage.fill }}>
                                        {stage.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Deal Velocity */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Deal Velocity Trend (Avg Days to Close)</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={velocityData}>
                                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                                <YAxis stroke="#6b7280" fontSize={10} />
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        return (
                                            <div className="bg-black/90 border border-white/20 rounded p-2">
                                                <div className="text-xs text-gray-400">{payload[0].payload.month}</div>
                                                <div className="text-sm text-green-400">{Math.round(payload[0].value as number)} days</div>
                                            </div>
                                        );
                                    }}
                                />
                                <Line type="monotone" dataKey="avgDays" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>

                        <div className="text-center mt-4">
                            <div className="text-3xl font-bold text-green-400">{avgVelocity} days</div>
                            <div className="text-xs text-gray-500 mt-1">Average Time to Close (6-month avg)</div>
                        </div>
                    </div>
                </div>

                {/* Rep Performance */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Sales Rep Performance (Q4)</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-3 text-gray-400">Rep</th>
                                    <th className="text-right p-3 text-gray-400">Deals Closed</th>
                                    <th className="text-right p-3 text-gray-400">Revenue</th>
                                    <th className="text-right p-3 text-gray-400">Quota</th>
                                    <th className="text-right p-3 text-gray-400">Attainment</th>
                                    <th className="text-left p-3 text-gray-400">Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {repPerformance.map((rep, i) => {
                                    const attainment = ((rep.value / rep.quota) * 100).toFixed(0);
                                    return (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-3 font-bold text-green-300 flex items-center gap-2">
                                                {i === 0 && <Award className="w-4 h-4 text-yellow-400" />}
                                                {rep.name}
                                            </td>
                                            <td className="p-3 text-right">{rep.deals}</td>
                                            <td className="p-3 text-right font-mono text-green-400">${(rep.value / 1000).toFixed(0)}K</td>
                                            <td className="p-3 text-right font-mono text-gray-400">${(rep.quota / 1000).toFixed(0)}K</td>
                                            <td className="p-3 text-right">
                                                <span
                                                    className={`px-2 py-1 rounded font-bold ${parseInt(attainment) >= 95
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : parseInt(attainment) >= 80
                                                                ? 'bg-blue-500/20 text-blue-400'
                                                                : 'bg-yellow-500/20 text-yellow-400'
                                                        }`}
                                                >
                                                    {attainment}%
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="w-full bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${parseInt(attainment) >= 95 ? 'bg-green-500' : parseInt(attainment) >= 80 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                                                        style={{ width: `${Math.min(100, parseInt(attainment))}%` }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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
