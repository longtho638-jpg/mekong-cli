'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useTranslations } from 'next-intl';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const adSpend = Array.from({ length: 12 }, (_, i) => ({
    month: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i],
    spend: 5000 + i * 1000 + Math.random() * 2000,
    roas: 2.5 + i * 0.2 + Math.random() * 0.5,
}));

export default function PaidSocialPage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics } = useAnalytics();

    return (
        <MD3AppShell title="Paid Social 📱" subtitle="Facebook • Instagram • TikTok Ads">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <MD3Surface shape="large" className="auto-safe">
                    <div className="text-xs text-gray-500 mb-2">Total Spend</div>
                    <div className="text-2xl font-bold text-pink-400">$125K</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="text-xs text-gray-500 mb-2">ROAS</div>
                    <div className="text-2xl font-bold text-emerald-400">4.2x</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="text-xs text-gray-500 mb-2">Impressions</div>
                    <div className="text-2xl font-bold text-blue-400">2.5M</div>
                </MD3Surface>
            </div>

            <MD3Surface shape="extra-large" className="auto-safe">
                <h3 className="text-lg font-bold mb-6">Spend & ROAS Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={adSpend}>
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                        <YAxis stroke="#6b7280" fontSize={10} />
                        <Tooltip />
                        <Line type="monotone" dataKey="roas" stroke="#ec4899" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </MD3Surface>
        </MD3AppShell>
    );
}
