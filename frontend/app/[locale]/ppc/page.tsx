'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useTranslations } from 'next-intl';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const keywords = [
    { keyword: 'agency software', cpc: 12.5, conversions: 145, color: '#3b82f6' },
    { keyword: 'marketing platform', cpc: 8.2, conversions: 89, color: '#8b5cf6' },
    { keyword: 'crm solution', cpc: 15.0, conversions: 234, color: '#10b981' },
    { keyword: 'sales automation', cpc: 11.3, conversions: 178, color: '#f59e0b' },
];

export default function PPCPage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics } = useAnalytics();

    return (
        <MD3AppShell title="PPC Campaigns 💰" subtitle="Google Ads • Keywords • Conversions">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <MD3Surface shape="large" className="auto-safe">
                    <div className="text-xs text-gray-500 mb-2">Avg CPC</div>
                    <div className="text-2xl font-bold text-orange-400">$11.75</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="text-xs text-gray-500 mb-2">Total Conv.</div>
                    <div className="text-2xl font-bold text-emerald-400">646</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="text-xs text-gray-500 mb-2">CTR</div>
                    <div className="text-2xl font-bold text-blue-400">3.8%</div>
                </MD3Surface>
            </div>

            <MD3Surface shape="extra-large" className="auto-safe">
                <h3 className="text-lg font-bold mb-6">Top Keywords by Conversions</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={keywords} layout="vertical">
                        <XAxis type="number" stroke="#6b7280" fontSize={10} />
                        <YAxis type="category" dataKey="keyword" stroke="#6b7280" fontSize={10} width={120} />
                        <Tooltip />
                        <Bar dataKey="conversions" radius={[0, 4, 4, 0]}>
                            {keywords.map((e, i) => (
                                <Cell key={i} fill={e.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </MD3Surface>
        </MD3AppShell>
    );
}
