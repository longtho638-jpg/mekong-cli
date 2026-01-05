'use client';
import { useTranslations } from 'next-intl';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { Users, TrendingUp, Percent, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const equityDistribution = [
    { name: 'Founders', value: 45, color: '#10b981' },
    { name: 'Employees', value: 15, color: '#3b82f6' },
    { name: 'Angels', value: 10, color: '#a855f7' },
    { name: 'Series A', value: 20, color: '#f59e0b' },
    { name: 'Reserved Pool', value: 10, color: '#6b7280' },
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
    const totalShares = 10000000;
    const postMoneyValuation = 25000000;
    const pricePerShare = postMoneyValuation / totalShares;

    return (
        <MD3AppShell title="📊 Cap Table" subtitle="Equity Ownership • Dilution Tracking • Stakeholder Management">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Total Shares</div>
                        <Percent className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-2xl font-bold text-cyan-400">10.0M</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Post-Money</div>
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">$25M</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Price/Share</div>
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-400">${pricePerShare.toFixed(2)}</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Stakeholders</div>
                        <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{stakeholders.length}</div>
                </MD3Surface>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <MD3Surface shape="extra-large" className="auto-safe">
                    <h3 className="text-lg font-bold mb-6">Equity Distribution</h3>
                    <div className="flex items-center gap-6">
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={equityDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={2}>
                                        {equityDistribution.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.9} />)}
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
                                    <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </MD3Surface>

                <MD3Surface shape="extra-large" className="auto-safe">
                    <h3 className="text-lg font-bold mb-6">Dilution Waterfall</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={dilutionHistory} layout="vertical">
                            <XAxis type="number" domain={[0, 100]} stroke="#6b7280" fontSize={10} />
                            <YAxis type="category" dataKey="round" stroke="#6b7280" fontSize={12} width={100} />
                            <Tooltip />
                            <Bar dataKey="founders" stackId="a" fill="#10b981" />
                            <Bar dataKey="investors" stackId="a" fill="#f59e0b" />
                            <Bar dataKey="pool" stackId="a" fill="#6b7280" />
                        </BarChart>
                    </ResponsiveContainer>
                </MD3Surface>
            </div>

            <MD3Surface shape="extra-large" className="auto-safe">
                <h3 className="text-lg font-bold mb-6">Stakeholder Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left p-3 text-gray-400">Stakeholder</th>
                                <th className="text-right p-3 text-gray-400">Shares</th>
                                <th className="text-right p-3 text-gray-400">Ownership %</th>
                                <th className="text-right p-3 text-gray-400">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stakeholders.map((sh, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="p-3 font-bold text-cyan-300">{sh.name}</td>
                                    <td className="p-3 text-right font-mono">{(sh.shares / 1000000).toFixed(1)}M</td>
                                    <td className="p-3 text-right">
                                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded font-bold">{sh.percentage}%</span>
                                    </td>
                                    <td className="p-3 text-right text-emerald-400 font-bold">
                                        ${((postMoneyValuation * sh.percentage) / 100 / 1000000).toFixed(2)}M
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </MD3Surface>
        </MD3AppShell>
    );
}
