'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useTranslations } from 'next-intl';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import Link from 'next/link';

const HUBS = [
    { id: 'warroom', icon: '🏯', path: '/warroom', color: 'red' },
    { id: 'executive', icon: '👑', path: '/executive', color: 'yellow' },
    { id: 'agentops', icon: '🎯', path: '/agentops', color: 'blue' },
    { id: 'sales', icon: '💰', path: '/sales', color: 'yellow' },
    { id: 'crm', icon: '💼', path: '/crm', color: 'pink' },
    { id: 'marketing', icon: '📢', path: '/marketing', color: 'red' },
    { id: 'analytics', icon: '📊', path: '/analytics', color: 'green' },
    { id: 'hr', icon: '👥', path: '/hr', color: 'purple' },
    { id: 'operations', icon: '⚙️', path: '/operations', color: 'orange' },
    { id: 'product', icon: '🚀', path: '/product', color: 'blue' },
    { id: 'binhphap', icon: '🏯', path: '/binhphap', color: 'red' },
    { id: 'portfolio', icon: '💎', path: '/vc/portfolio', color: 'green' },
];

export default function HubsPage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics } = useAnalytics();
    const t = useTranslations('HubsPage');

    return (
        <MD3AppShell title={`🏯 ${t('title')}`} subtitle="Navigate to specialized hubs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {HUBS.map((hub) => (
                    <Link key={hub.id} href={`/${locale}${hub.path}`}>
                        <MD3Surface shape="large" className="auto-safe hover:scale-105 transition-transform cursor-pointer">
                            <div className="text-4xl mb-3">{hub.icon}</div>
                            <div className="text-lg font-bold mb-1">{t(hub.id)}</div>
                            <div className="text-xs text-gray-500">{hub.id}</div>
                        </MD3Surface>
                    </Link>
                ))}
            </div>
        </MD3AppShell>
    );
}
