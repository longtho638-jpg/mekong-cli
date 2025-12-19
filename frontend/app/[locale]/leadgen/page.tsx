'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Command, Target, Users, MousePointerClick, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Lead source distribution
const leadSources = [
    { name: 'Organic Search', value: 35, color: '#10b981', leads: 1240 },
    { name: 'Paid Social', value: 28, color: '#3b82f6', leads: 980 },
    { name: 'Referrals', value: 20, color: '#a855f7', leads: 710 },
    { name: 'Email Campaigns', value: 12, color: '#f59e0b', leads: 425 },
    { name: 'Events', value: 5, color: '#ef4444', leads: 178 },
];

// Monthly lead generation trend
const monthlyTrend = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    leads: 200 + Math.floor(Math.random() * 150),
    mql: 80 + Math.floor(Math.random() * 60),
}));

// Lead quality by source
const qualityBySource = [
    { source: 'Organic', total: 1240, mql: 520, sql: 180 },
    { source: 'Paid Social', total: 980, mql: 380, sql: 120 },
    { source: 'Referral', total: 710, mql: 290, sql: 95 },
    { source: 'Email', total: 425, mql: 150, sql: 48 },
    { source: 'Events', total: 178, mql: 85, sql: 32 },
];

export default function LeadGenPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Common');

    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    const totalLeads = leadSources.reduce((sum, s) => sum + s.leads, 0);
    const totalMQL = qualityBySource.reduce((sum, s) => sum + s.mql, 0);
    const totalSQL = qualityBySource.reduce((sum, s) => sum + s.sql, 0);
    const mqlRate = ((totalMQL / totalLeads) * 100).toFixed(1);

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-purple-500/30 selection:text-purple-300">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />
            <div className="fixed top-[10%] left-[25%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(168,85,247,0.08)_0%,transparent_70%)] pointer-events-none" />

            <nav className="fixed top-0 w-full z-50 border-b border-purple-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-purple-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 animate-pulse">
                            LEAD GEN
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>Lead Generation</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <Target className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-purple-300 font-bold">{totalLeads} Leads</span>
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
                        🎯 Lead Generation Dashboard
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse box-content border-4 border-purple-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm max-w-xl">
                        Source Attribution • Lead Quality • Conversion Tracking
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Leads" value={totalLeads.toLocaleString()} icon={<Users />} color="text-purple-400" />
                    <StatCard label="MQL" value={totalMQL.toLocaleString()} icon={<MousePointerClick />} color="text-blue-400" />
                    <StatCard label="SQL" value={totalSQL.toString()} icon={<Target />} color="text-emerald-400" />
                    <StatCard label="MQL Rate" value={`${mqlRate}%`} icon={<TrendingUp />} color="text-yellow-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Lead Source Breakdown */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Lead Source Distribution</h3>

                        <div className="flex items-center gap-6">
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={leadSources} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={2}>
                                            {leadSources.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} opacity={0.9} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="flex-1 space-y-2">
                                {leadSources.map((source) => (
                                    <div key={source.name} className="flex items-center justify-between p-2 bg-white/5 rounded">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                                            <span className="text-sm">{source.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold" style={{ color: source.color }}>
                                                {source.value}%
                                            </div>
                                            <div className="text-xs text-gray-500">{source.leads}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Monthly Trend */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Monthly Lead Generation Trend</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={monthlyTrend}>
                                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                                <YAxis stroke="#6b7280" fontSize={10} />
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        return (
                                            <div className="bg-black/90 border border-white/20 rounded p-2">
                                                <div className="text-xs text-gray-400">{payload[0].payload.month}</div>
                                                <div className="text-sm text-purple-400">Total: {payload[0].payload.leads}</div>
                                                <div className="text-sm text-blue-400">MQL: {payload[0].payload.mql}</div>
                                            </div>
                                        );
                                    }}
                                />
                                <Line type="monotone" dataKey="leads" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 3 }} />
                                <Line type="monotone" dataKey="mql" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                            <div className="p-2 bg-purple-500/10 rounded text-center">
                                <div className="text-purple-400 font-bold">Total Leads</div>
                            </div>
                            <div className="p-2 bg-blue-500/10 rounded text-center">
                                <div className="text-blue-400 font-bold">MQL</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lead Quality by Source */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Lead Quality by Source</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-3 text-gray-400">Source</th>
                                    <th className="text-right p-3 text-gray-400">Total Leads</th>
                                    <th className="text-right p-3 text-gray-400">MQL</th>
                                    <th className="text-right p-3 text-gray-400">SQL</th>
                                    <th className="text-right p-3 text-gray-400">MQL Rate</th>
                                    <th className="text-right p-3 text-gray-400">SQL Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {qualityBySource.map((row, i) => {
                                    const mqlRate = ((row.mql / row.total) * 100).toFixed(0);
                                    const sqlRate = ((row.sql / row.total) * 100).toFixed(0);
                                    return (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-3 font-bold text-purple-300">{row.source}</td>
                                            <td className="p-3 text-right font-mono">{row.total.toLocaleString()}</td>
                                            <td className="p-3 text-right text-blue-400 font-bold">{row.mql}</td>
                                            <td className="p-3 text-right text-emerald-400 font-bold">{row.sql}</td>
                                            <td className="p-3 text-right">
                                                <span
                                                    className={`px-2 py-1 rounded font-bold ${parseInt(mqlRate) >= 40 ? 'bg-emerald-500/20 text-emerald-400' : parseInt(mqlRate) >= 30 ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                                                        }`}
                                                >
                                                    {mqlRate}%
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded font-bold">{sqlRate}%</span>
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
