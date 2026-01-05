'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

const SHOWCASES = [
    { title: 'VC Portfolio Galaxy', path: '/vc/portfolio', color: 'green', description: '6 interactive Recharts visualizations' },
    { title: 'War Room Command', path: '/warroom', color: 'red', description: 'Real-time mission control' },
    { title: 'Binh Pháp Strategy', path: '/binhphap', color: 'red', description: '13 Sun Tzu chapters' },
    { title: 'AgentOps Dashboard', path: '/agentops', color: 'blue', description: '156 AI agents monitored' },
    { title: 'Sales Pipeline', path: '/sales', color: 'yellow', description: 'Sankey flow visualization' },
    { title: 'Analytics Hub', path: '/analytics', color: 'green', description: 'Business intelligence' },
    { title: 'Marketing Command', path: '/marketing', color: 'red', description: 'Multi-channel attribution' },
    { title: 'HR Dashboard', path: '/hr', color: 'purple', description: 'People analytics' },
];

export default function ShowcasePage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics } = useAnalytics();

    return (
        <MD3AppShell title="🎨 Showcase" subtitle="Explore Pro Max dashboards with interactive visualizations">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {SHOWCASES.map((item) => (
                    <Link key={item.path} href={`/${locale}${item.path}`}>
                        <MD3Surface shape="large" className="auto-safe hover:scale-105 transition-transform cursor-pointer group">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-lg font-bold">{item.title}</h3>
                                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                            </div>
                            <p className="text-sm text-gray-400">{item.description}</p>
                            <div className="mt-4 inline-block px-2 py-1 text-xs bg-emerald-500/20 border border-emerald-500/30 rounded">
                                Interactive
                            </div>
                        </MD3Surface>
                    </Link>
                ))}
            </div>

            <MD3Surface shape="extra-large" className="auto-safe text-center">
                <h2 className="text-2xl font-bold mb-4">🏯 Built with Pro Max Standard</h2>
                <p className="text-gray-400 mb-6">All dashboards feature Fintech Dark theme, Recharts visualizations, and full i18n support</p>
                <div className="flex gap-4 justify-center text-sm flex-wrap">
                    <div className="px-4 py-2 bg-white/5 rounded">Next.js 14</div>
                    <div className="px-4 py-2 bg-white/5 rounded">Recharts</div>
                    <div className="px-4 py-2 bg-white/5 rounded">next-intl</div>
                    <div className="px-4 py-2 bg-white/5 rounded">Tailwind CSS</div>
                </div>
            </MD3Surface>
        </MD3AppShell>
    );
}
