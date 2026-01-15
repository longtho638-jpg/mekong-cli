'use client';

import React from 'react';

/**
 * AntigravityKit Modules Display
 * Shows all 7 core modules with live status
 */

interface ModuleCardProps {
    icon: string;
    name: string;
    description: string;
    status: 'active' | 'pending' | 'error';
    metrics?: { label: string; value: string }[];
}

const ModuleCard: React.FC<ModuleCardProps> = ({ icon, name, description, status, metrics }) => {
    const statusColors = {
        active: 'bg-green-500',
        pending: 'bg-yellow-500',
        error: 'bg-red-500'
    };

    return (
        <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <div>
                        <h3 className="font-semibold text-foreground">{name}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${statusColors[status]}`} />
            </div>
            {metrics && (
                <div className="space-y-2 mt-4 pt-4 border-t border-border">
                    {metrics.map((m, i) => (
                        <div key={i} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{m.label}</span>
                            <span className="font-medium text-foreground">{m.value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export function AntigravityModules() {
    const modules = [
        {
            icon: '🧬',
            name: 'AgencyDNA',
            description: 'Identity + Vietnamese tones',
            status: 'active' as const,
            metrics: [
                { label: 'Tone', value: 'Miền Tây' },
                { label: 'Services', value: '5' }
            ]
        },
        {
            icon: '🧲',
            name: 'ClientMagnet',
            description: 'Lead generation engine',
            status: 'active' as const,
            metrics: [
                { label: 'Leads', value: '127' },
                { label: 'Pipeline', value: '$45K' }
            ]
        },
        {
            icon: '💰',
            name: 'RevenueEngine',
            description: 'MRR/ARR tracking',
            status: 'active' as const,
            metrics: [
                { label: 'MRR', value: '$75,000' },
                { label: 'ARR', value: '$900K' }
            ]
        },
        {
            icon: '🎨',
            name: 'ContentFactory',
            description: 'Mass content production',
            status: 'active' as const,
            metrics: [
                { label: 'Ideas', value: '87' },
                { label: 'Virality', value: '78/100' }
            ]
        },
        {
            icon: '🏢',
            name: 'FranchiseManager',
            description: 'Territory network',
            status: 'active' as const,
            metrics: [
                { label: 'Territories', value: '3/8' },
                { label: 'Royalties', value: '$9K' }
            ]
        },
        {
            icon: '📊',
            name: 'VCMetrics',
            description: 'VC readiness dashboard',
            status: 'active' as const,
            metrics: [
                { label: 'Score', value: '83/100' },
                { label: 'LTV/CAC', value: '12x' }
            ]
        },
        {
            icon: '🛡️',
            name: 'DataMoat',
            description: 'Proprietary intelligence',
            status: 'active' as const,
            metrics: [
                { label: 'Data Points', value: '1,247' },
                { label: 'Defensibility', value: 'MEDIUM' }
            ]
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">🚀 AntigravityKit</h2>
                    <p className="text-muted-foreground">7 Core Modules • All Active</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-green-500">System Online</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {modules.map((mod) => (
                    <ModuleCard key={mod.name} {...mod} />
                ))}
            </div>
        </div>
    );
}

export default AntigravityModules;
