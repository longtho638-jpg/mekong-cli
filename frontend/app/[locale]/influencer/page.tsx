'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useTranslations } from 'next-intl';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';

import { usePathname, useRouter } from 'next/navigation';
import { Shield, Users, TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const influencers = [
    { name: '@techinfluencer', followers: 125000, engagement: 4.5, roi: 320, color: '#3b82f6' },
    { name: '@marketingguru', followers: 89000, engagement: 6.2, roi: 450, color: '#8b5cf6' },
    { name: '@startuphero', followers: 210000, engagement: 3.8, roi: 280, color: '#10b981' },
    { name: '@bizleader', followers: 156000, engagement: 5.1, roi: 380, color: '#f59e0b' },
];

export default function InfluencerPage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics, loading, projects, clients } = useAnalytics();
    const kpi1 = analytics.totalRevenue;
    const kpi2 = analytics.activeClients;

    return (
        <MD3AppShell title="Influencer Marketing 🌟" subtitle="Partnerships • Campaigns • ROI Analytics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <MD3Surface shape="large" className="auto-safe">
                    <div className="text-xs text-gray-500 mb-2">Total Reach</div>
                    <div className="text-2xl font-bold text-purple-400">580K</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="text-xs text-gray-500 mb-2">Avg Engagement</div>
                    <div className="text-2xl font-bold text-emerald-400">4.9%</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="text-xs text-gray-500 mb-2">Avg ROI</div>
                    <div className="text-2xl font-bold text-blue-400">358%</div>
                </MD3Surface>
            </div>

            <MD3Surface shape="extra-large" className="auto-safe">
                <h3 className="text-lg font-bold mb-6">Influencer ROI Performance</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={influencers} layout="vertical">
                        <XAxis type="number" stroke="#6b7280" fontSize={10} />
                        <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={10} width={120} />
                        <Tooltip />
                        <Bar dataKey="roi" radius={[0, 4, 4, 0]}>
                            {influencers.map((e, i) => (
                                <Cell key={i} fill={e.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </MD3Surface>
        </MD3AppShell>
    );
}

