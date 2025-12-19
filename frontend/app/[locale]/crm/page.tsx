'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Command, Users, Heart, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Customer lifecycle stages
const lifecycleData = [
    { stage: 'Lead', count: 450, value: 0, color: '#6b7280' },
    { stage: 'MQL', count: 280, value: 0, color: '#3b82f6' },
    { stage: 'SQL', count: 120, value: 0, color: '#8b5cf6' },
    { stage: 'Customer', count: 85, value: 425000, color: '#10b981' },
    { stage: 'Champion', count: 24, value: 480000, color: '#22c55e' },
];

// Cohort retention data
const cohortRetention = [
    { cohort: 'Jan 2024', month0: 100, month1: 88, month2: 76, month3: 68, month4: 62, month5: 58 },
    { cohort: 'Feb 2024', month0: 100, month1: 92, month2: 82, month3: 75, month4: 70, month5: 0 },
    { cohort: 'Mar 2024', month0: 100, month1: 90, month2: 80, month3: 72, month4: 0, month5: 0 },
    { cohort: 'Apr 2024', month0: 100, month1: 85, month2: 75, month3: 0, month4: 0, month5: 0 },
];

// Customer health scores
const healthScores = [
    { name: 'Acme Corp', score: 95, arr: 120000, status: 'healthy' },
    { name: 'TechCo', score: 82, arr: 85000, status: 'healthy' },
    { name: 'StartupXYZ', score: 68, arr: 45000, status: 'at-risk' },
    { name: 'Global Inc', score: 45, arr: 150000, status: 'critical' },
    { name: 'SmallBiz LLC', score: 92, arr: 28000, status: 'healthy' },
];

export default function CRMPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Common');

    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    const totalCustomers = lifecycleData.find((l) => l.stage === 'Customer')?.count || 0;
    const totalValue = lifecycleData.reduce((sum, l) => sum + l.value, 0);
    const avgHealth = Math.round(healthScores.reduce((sum, h) => sum + h.score, 0) / healthScores.length);

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-blue-500/30 selection:text-blue-300">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />
            <div className="fixed top-[18%] left-[30%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(59,130,246,0.08)_0%,transparent_70%)] pointer-events-none" />

            <nav className="fixed top-0 w-full z-50 border-b border-blue-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-blue-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 animate-pulse">
                            CRM
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>Customer Relationship</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <Users className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-blue-300 font-bold">{totalCustomers} Customers</span>
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
                        💙 CRM Dashboard
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse box-content border-4 border-blue-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm max-w-xl">
                        Customer Lifecycle • Retention Cohorts • Health Monitoring
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Customers" value={totalCustomers.toString()} icon={<Users />} color="text-blue-400" />
                    <StatCard label="Total ARR" value={`$${(totalValue / 1000).toFixed(0)}K`} icon={<DollarSign />} color="text-green-400" />
                    <StatCard label="Avg Health" value={`${avgHealth}%`} icon={<Heart />} color="text-purple-400" />
                    <StatCard label="Retention" value="68%" icon={<TrendingUp />} color="text-emerald-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Customer Lifecycle */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Customer Lifecycle Distribution</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={lifecycleData} layout="vertical">
                                <XAxis type="number" stroke="#6b7280" fontSize={10} />
                                <YAxis type="category" dataKey="stage" stroke="#6b7280" fontSize={12} width={80} />
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-black/90 border border-white/20 rounded p-2">
                                                <div className="text-xs font-bold mb-1">{data.stage}</div>
                                                <div className="text-sm" style={{ color: data.color }}>
                                                    {data.count} contacts
                                                </div>
                                                {data.value > 0 && <div className="text-xs text-green-400">${(data.value / 1000).toFixed(0)}K ARR</div>}
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                    {lifecycleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Retention Cohorts */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Cohort Retention Analysis</h3>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left p-2 text-gray-400">Cohort</th>
                                        <th className="text-center p-2 text-gray-400">M0</th>
                                        <th className="text-center p-2 text-gray-400">M1</th>
                                        <th className="text-center p-2 text-gray-400">M2</th>
                                        <th className="text-center p-2 text-gray-400">M3</th>
                                        <th className="text-center p-2 text-gray-400">M4</th>
                                        <th className="text-center p-2 text-gray-400">M5</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cohortRetention.map((row) => (
                                        <tr key={row.cohort} className="border-b border-white/5">
                                            <td className="p-2 font-bold text-blue-300">{row.cohort}</td>
                                            {['month0', 'month1', 'month2', 'month3', 'month4', 'month5'].map((month) => {
                                                const value = row[month as keyof typeof row] as number;
                                                return (
                                                    <td key={month} className="text-center p-2">
                                                        {value > 0 ? (
                                                            <div
                                                                className={`inline-block px-2 py-1 rounded font-bold ${value >= 90
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
                </div>

                {/* Customer Health Monitor */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Customer Health Monitor</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-3 text-gray-400">Account</th>
                                    <th className="text-right p-3 text-gray-400">Health Score</th>
                                    <th className="text-right p-3 text-gray-400">ARR</th>
                                    <th className="text-left p-3 text-gray-400">Status</th>
                                    <th className="text-left p-3 text-gray-400">Health Bar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {healthScores.map((customer, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-3 font-bold text-blue-300">{customer.name}</td>
                                        <td className="p-3 text-right">
                                            <span
                                                className={`px-2 py-1 rounded font-bold ${customer.score >= 80
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : customer.score >= 60
                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                            : 'bg-red-500/20 text-red-400'
                                                    }`}
                                            >
                                                {customer.score}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right font-mono text-green-400">${(customer.arr / 1000).toFixed(0)}K</td>
                                        <td className="p-3">
                                            <span
                                                className={`px-2 py-1 rounded text-xs ${customer.status === 'healthy'
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : customer.status === 'at-risk'
                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                            : 'bg-red-500/20 text-red-400'
                                                    }`}
                                            >
                                                {customer.status}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="w-full bg-gray-700 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${customer.score >= 80 ? 'bg-emerald-500' : customer.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${customer.score}%` }}
                                                />
                                            </div>
                                        </td>
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
