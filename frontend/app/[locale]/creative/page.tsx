'use client';

import { Palette, Image, Video, Wand2, Eye, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

// Creative Metrics
const creativeMetrics = [
    {
        label: 'Assets Created',
        value: '248',
        icon: <Image className="w-5 h-5" />,
        color: '#ec4899',
        trend: { value: '+32', direction: 'up' as const },
    },
    {
        label: 'Approval Rate',
        value: '94%',
        icon: <Eye className="w-5 h-5" />,
        color: '#22c55e',
        trend: { value: '+5%', direction: 'up' as const },
    },
    {
        label: 'Campaigns Live',
        value: '12',
        icon: <Wand2 className="w-5 h-5" />,
        color: '#3b82f6',
        trend: { value: '+3', direction: 'up' as const },
    },
    {
        label: 'Avg Engagement',
        value: '4.2%',
        icon: <Heart className="w-5 h-5" />,
        color: '#a855f7',
        trend: { value: '+0.8%', direction: 'up' as const },
    },
];

// Assets by Type
const assetsByType = [
    { name: 'Social Posts', value: 85, color: '#ec4899' },
    { name: 'Videos', value: 42, color: '#3b82f6' },
    { name: 'Banners', value: 65, color: '#22c55e' },
    { name: 'Emails', value: 38, color: '#f59e0b' },
    { name: 'Landing Pages', value: 18, color: '#a855f7' },
];

// Weekly Output
const weeklyOutput = [
    { name: 'Mon', value: 12 },
    { name: 'Tue', value: 18 },
    { name: 'Wed', value: 15 },
    { name: 'Thu', value: 22 },
    { name: 'Fri', value: 8 },
];

// Brand Performance
const brandPerformance = [
    { name: 'On Brand', value: 88, color: '#22c55e' },
    { name: 'Minor Edits', value: 10, color: '#f59e0b' },
    { name: 'Major Revision', value: 2, color: '#ef4444' },
];

const creativeCharts = [
    { type: 'bar' as const, title: 'Assets by Type', data: assetsByType },
    { type: 'area' as const, title: 'Weekly Creative Output', data: weeklyOutput },
    { type: 'pie' as const, title: 'Brand Compliance', data: brandPerformance },
];

const creativeActions = [
    { icon: '🎨', label: 'New Design', onClick: () => console.log('New Design') },
    { icon: '📹', label: 'Create Video', onClick: () => console.log('Create Video') },
    { icon: '✍️', label: 'Write Copy', onClick: () => console.log('Write Copy') },
    { icon: '🖼️', label: 'Asset Library', onClick: () => console.log('Asset Library') },
    { icon: '📊', label: 'Analytics', onClick: () => console.log('Analytics') },
    { icon: '🎯', label: 'Brand Guide', onClick: () => console.log('Brand Guide') },
];

export default function CreativePage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard
            title="Creative Studio"
            subtitle="Design • Video • Copywriting • Brand Management"
            icon="🎨"
            color="pink"
            statusLabel="Assets"
            statusValue="248"
            metrics={creativeMetrics}
            charts={creativeCharts}
            quickActions={creativeActions}
            locale={locale}
        >
            {/* Recent Projects */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-pink-400" />
                    Active Creative Projects
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { name: 'Q1 Campaign Launch', status: 'In Progress', progress: 75, color: '#ec4899' },
                        { name: 'Brand Refresh', status: 'Review', progress: 90, color: '#3b82f6' },
                        { name: 'Product Videos', status: 'Planning', progress: 25, color: '#22c55e' },
                    ].map((project) => (
                        <div key={project.name} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-white">{project.name}</span>
                                <span className="text-xs px-2 py-1 rounded" style={{ background: `${project.color}20`, color: project.color }}>
                                    {project.status}
                                </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="h-2 rounded-full" style={{ width: `${project.progress}%`, background: project.color }} />
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{project.progress}% complete</div>
                        </div>
                    ))}
                </div>
            </div>
        </DepartmentDashboard>
    );
}
