'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Command, Users, TrendingUp, Percent, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

// Mock data
const equityDistribution = [
    { name: 'Founders', value: 45, color: '#10b981', fill: '#10b981' },
    { name: 'Employees', value: 15, color: '#3b82f6', fill: '#3b82f6' },
    { name: 'Angels', value: 10, color: '#a855f7', fill: '#a855f7' },
    { name: 'Series A', value: 20, color: '#f59e0b', fill: '#f59e0b' },
    { name: 'Reserved Pool', value: 10, color: '#6b7280', fill: '#6b7280' },
];

const dilutionHistory = [
    { round: 'Seed', founders: 80, investors: 15, pool: 5 },
    { round: 'Series A', founders: 45, investors: 35, pool: 20 },
    { round: 'Series B (Proj)', founders: 32, investors: 53, pool: 15 },
];

const stakeholders = [
    { name: 'Founder 1 (CEO)', shares: 2500000, percentage: 25.0, vesting: '4Y/1Y Cliff' },
    { name: 'Founder 2 (CTO)', shares: 2000000, percentage: 20.0, vesting: '4Y/1Y Cliff' },
    { name: 'Angel Investors', shares: 1000000, percentage: 10.0, vesting: 'Fully Vested' },
    { name: 'Series A (VC)', shares: 2000000, percentage: 20.0, vesting: 'N/A' },
    { name: 'Employee Pool', shares: 1500000, percentage: 15.0, vesting: '4Y/1Y Cliff' },
    { name: 'Reserved', shares: 1000000, percentage: 10.0, vesting: 'Unallocated' },
];

export default function CapTablePage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('VC');
    const tHubs = useTranslations('Hubs');

    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    const totalShares = 10000000;
    const postMoneyValuation = 25000000;
    const pricePerShare = postMoneyValuation / totalShares;

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-cyan-500/30 selection:text-cyan-300">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />
            <div className="fixed top-[15%] right-[25%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(6,182,212,0.08)_0%,transparent_70%)] pointer-events-none" />

            {/* Top Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-cyan-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-300 animate-pulse">
                            CAP TABLE
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>{tHubs('vc_hub')}</span>
                        <span className="opacity-50">/</span>
                        <span className="text-white">{t('cap_table')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                        <Users className="w-3 h-3 text-cyan-400" />
                        <span className="text-xs text-cyan-300 font-bold">{stakeholders.length} Stakeholders</span>
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
                                    ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
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
                    <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3 text-cyan-400">
                        📊 {t('cap_table')}
                        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse box-content border-4 border-cyan-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm max-w-xl">
                        Equity Ownership • Dilution Tracking • Stakeholder Management
                    </p>
                </header>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Shares" value="10.0M" icon={<Percent />} color="text-cyan-400" />
                    <StatCard label="Post-Money Valuation" value="$25M" icon={<DollarSign />} color="text-emerald-400" />
                    <StatCard label="Price/Share" value={`$${pricePerShare.toFixed(2)}`} icon={<TrendingUp />} color="text-purple-400" />
                    <StatCard label="Stakeholders" value={stakeholders.length.toString()} icon={<Users />} color="text-blue-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Equity Distribution */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Current Equity Distribution</h3>

                        <div className="flex items-center gap-6">
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={equityDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={90}
                                            dataKey="value"
                                            paddingAngle={2}
                                        >
                                            {equityDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} opacity={0.9} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="flex-1 space-y-2">
                                {equityDistribution.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between p-2 bg-white/5 rounded">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-sm">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: item.color }}>
                                            {item.value}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dilution Waterfall */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Dilution Waterfall (By Round)</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={dilutionHistory} layout="vertical">
                                <XAxis type="number" domain={[0, 100]} stroke="#6b7280" fontSize={10} />
                                <YAxis type="category" dataKey="round" stroke="#6b7280" fontSize={12} width={100} />
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        return (
                                            <div className="bg-black/90 border border-white/20 rounded p-2">
                                                <div className="text-xs font-bold mb-1">{payload[0].payload.round}</div>
                                                <div className="text-sm text-emerald-400">Founders: {payload[0].payload.founders}%</div>
                                                <div className="text-sm text-orange-400">Investors: {payload[0].payload.investors}%</div>
                                                <div className="text-sm text-gray-400">Pool: {payload[0].payload.pool}%</div>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey="founders" stackId="a" fill="#10b981" />
                                <Bar dataKey="investors" stackId="a" fill="#f59e0b" />
                                <Bar dataKey="pool" stackId="a" fill="#6b7280" />
                            </BarChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                            <div className="p-2 bg-emerald-500/10 rounded text-center">
                                <div className="text-emerald-400 font-bold">Founders</div>
                            </div>
                            <div className="p-2 bg-orange-500/10 rounded text-center">
                                <div className="text-orange-400 font-bold">Investors</div>
                            </div>
                            <div className="p-2 bg-gray-500/10 rounded text-center">
                                <div className="text-gray-400 font-bold">Pool</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stakeholder Table */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Stakeholder Breakdown</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-3 text-gray-400">Stakeholder</th>
                                    <th className="text-right p-3 text-gray-400">Shares</th>
                                    <th className="text-right p-3 text-gray-400">Ownership %</th>
                                    <th className="text-right p-3 text-gray-400">Value ($25M)</th>
                                    <th className="text-left p-3 text-gray-400">Vesting</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stakeholders.map((sh, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-3 font-bold text-cyan-300">{sh.name}</td>
                                        <td className="p-3 text-right font-mono">{(sh.shares / 1000000).toFixed(1)}M</td>
                                        <td className="p-3 text-right">
                                            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded font-bold">
                                                {sh.percentage.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="p-3 text-right text-emerald-400 font-bold">
                                            ${((postMoneyValuation * sh.percentage) / 100 / 1000000).toFixed(2)}M
                                        </td>
                                        <td className="p-3 text-xs text-gray-400">{sh.vesting}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-cyan-500/30">
                                    <td className="p-3 font-bold text-white">TOTAL</td>
                                    <td className="p-3 text-right font-mono font-bold">{(totalShares / 1000000).toFixed(1)}M</td>
                                    <td className="p-3 text-right">
                                        <span className="px-2 py-1 bg-white/10 text-white rounded font-bold">100.0%</span>
                                    </td>
                                    <td className="p-3 text-right text-emerald-400 font-bold">${(postMoneyValuation / 1000000).toFixed(0)}M</td>
                                    <td className="p-3"></td>
                                </tr>
                            </tfoot>
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
