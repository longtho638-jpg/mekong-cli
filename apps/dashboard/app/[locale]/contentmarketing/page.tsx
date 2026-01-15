'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useTranslations } from 'next-intl';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';

import { Eye, Heart, Share2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const contentPerformance = [
    { title: 'Ultimate Guide to...', views: 12500, engagement: 8.2, shares: 340, color: '#3b82f6' },
    { title: 'How to Build...', views: 8900, engagement: 6.5, shares: 180, color: '#8b5cf6' },
    { title: '10 Tips for...', views: 15200, engagement: 9.1, shares: 520, color: '#a855f7' },
    { title: 'Case Study:...', views: 6800, engagement: 5.2, shares: 95, color: '#10b981' },
    { title: 'Industry Report', views: 11000, engagement: 7.8, shares: 290, color: '#22c55e' },
];

export default function ContentMarketingPage() {
    const { analytics } = useAnalytics();
    const totalViews = contentPerformance.reduce((sum, c) => sum + c.views, 0);
    const avgEngagement = (contentPerformance.reduce((sum, c) => sum + c.engagement, 0) / contentPerformance.length).toFixed(1);

    return (
        <MD3AppShell title="Content Marketing 📝" subtitle="Content Performance • Engagement • Distribution">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Total Views</div>
                        <Eye className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-bold text-amber-400">{(totalViews / 1000).toFixed(1)}K</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Avg Engagement</div>
                        <Heart className="w-4 h-4 text-pink-400" />
                    </div>
                    <div className="text-2xl font-bold text-pink-400">{avgEngagement}%</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Total Shares</div>
                        <Share2 className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{contentPerformance.reduce((sum, c) => sum + c.shares, 0)}</div>
                </MD3Surface>
            </div>

            <MD3Surface shape="extra-large" className="auto-safe">
                <h3 className="text-lg font-bold mb-6">Top Content Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={contentPerformance} layout="vertical">
                        <XAxis type="number" stroke="#6b7280" fontSize={10} />
                        <YAxis type="category" dataKey="title" stroke="#6b7280" fontSize={10} width={120} />
                        <Tooltip />
                        <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                            {contentPerformance.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </MD3Surface>
        </MD3AppShell>
    );
}
