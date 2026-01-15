'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useTranslations } from 'next-intl';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { Target, Users, MousePointerClick, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const leadSources = [
    { name: 'Organic Search', value: 35, color: '#10b981', leads: 1240 },
    { name: 'Paid Social', value: 28, color: '#3b82f6', leads: 980 },
    { name: 'Referrals', value: 20, color: '#a855f7', leads: 710 },
    { name: 'Email Campaigns', value: 12, color: '#f59e0b', leads: 425 },
    { name: 'Events', value: 5, color: '#ef4444', leads: 178 },
];

const monthlyTrend = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    leads: 200 + Math.floor(Math.random() * 150),
    mql: 80 + Math.floor(Math.random() * 60),
}));

const qualityBySource = [
    { source: 'Organic', total: 1240, mql: 520, sql: 180 },
    { source: 'Paid Social', total: 980, mql: 380, sql: 120 },
    { source: 'Referral', total: 710, mql: 290, sql: 95 },
    { source: 'Email', total: 425, mql: 150, sql: 48 },
    { source: 'Events', total: 178, mql: 85, sql: 32 },
];

export default function LeadGenPage() {
    const { analytics } = useAnalytics();
    const totalLeads = leadSources.reduce((sum, s) => sum + s.leads, 0);
    const totalMQL = qualityBySource.reduce((sum, s) => sum + s.mql, 0);
    const totalSQL = qualityBySource.reduce((sum, s) => sum + s.sql, 0);
    const mqlRate = ((totalMQL / totalLeads) * 100).toFixed(1);

    return (
        <MD3AppShell title="🎯 Lead Generation" subtitle="Lead Pipeline • Source Attribution • Quality Metrics">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Total Leads</div>
                        <Target className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-400">{totalLeads.toLocaleString()}</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">MQL</div>
                        <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{totalMQL.toLocaleString()}</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">SQL</div>
                        <MousePointerClick className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">{totalSQL}</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Conversion</div>
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-bold text-amber-400">{mqlRate}%</div>
                </MD3Surface>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <MD3Surface shape="extra-large" className="auto-safe">
                    <h3 className="text-lg font-bold mb-6">Lead Sources</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={leadSources} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                                {leadSources.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-4">
                        {leadSources.map(s => (
                            <div key={s.name} className="flex justify-between p-2 bg-white/5 rounded">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                                    <span className="text-sm">{s.name}</span>
                                </div>
                                <span className="text-sm font-bold" style={{ color: s.color }}>{s.leads}</span>
                            </div>
                        ))}
                    </div>
                </MD3Surface>

                <MD3Surface shape="extra-large" className="auto-safe">
                    <h3 className="text-lg font-bold mb-6">Monthly Trend</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={monthlyTrend}>
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                            <YAxis stroke="#6b7280" fontSize={10} />
                            <Tooltip />
                            <Line type="monotone" dataKey="leads" stroke="#a855f7" strokeWidth={2} />
                            <Line type="monotone" dataKey="mql" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </MD3Surface>
            </div>

            <MD3Surface shape="extra-large" className="auto-safe">
                <h3 className="text-lg font-bold mb-6">Lead Quality by Source</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={qualityBySource} layout="vertical">
                        <XAxis type="number" stroke="#6b7280" fontSize={10} />
                        <YAxis dataKey="source" type="category" stroke="#6b7280" fontSize={12} width={80} />
                        <Tooltip />
                        <Bar dataKey="mql" fill="#3b82f6" name="MQL" />
                        <Bar dataKey="sql" fill="#10b981" name="SQL" />
                    </BarChart>
                </ResponsiveContainer>
            </MD3Surface>
        </MD3AppShell>
    );
}
