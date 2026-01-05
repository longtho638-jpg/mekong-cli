'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useTranslations } from 'next-intl';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const leadScoring = [
    { score: '90-100', count: 45, color: '#22c55e' },
    { score: '80-89', count: 78, color: '#10b981' },
    { score: '70-79', count: 124, color: '#3b82f6' },
    { score: '60-69', count: 89, color: '#f59e0b' },
    { score: '<60', count: 34, color: '#ef4444' },
];

export default function B2BMarketingPage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics } = useAnalytics();
    const totalLeads = leadScoring.reduce((s, l) => s + l.count, 0);

    return (
        <MD3AppShell title="B2B Marketing 🏢" subtitle="Lead Scoring • ABM • Enterprise Sales">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <MD3Surface shape="large" className="auto-safe">
                    <div className="text-xs text-gray-500 mb-2">Total Leads</div>
                    <div className="text-2xl font-bold text-blue-400">{totalLeads}</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="text-xs text-gray-500 mb-2">High Quality</div>
                    <div className="text-2xl font-bold text-emerald-400">{leadScoring[0].count + leadScoring[1].count}</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="text-xs text-gray-500 mb-2">MQL Rate</div>
                    <div className="text-2xl font-bold text-purple-400">32%</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="text-xs text-gray-500 mb-2">Conversion</div>
                    <div className="text-2xl font-bold text-yellow-400">8.5%</div>
                </MD3Surface>
            </div>

            <MD3Surface shape="extra-large" className="auto-safe">
                <h3 className="text-lg font-bold mb-6">Lead Scoring Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={leadScoring}>
                        <XAxis dataKey="score" stroke="#6b7280" fontSize={10} />
                        <YAxis stroke="#6b7280" fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {leadScoring.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </MD3Surface>
        </MD3AppShell>
    );
}
