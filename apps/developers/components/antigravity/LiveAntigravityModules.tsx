'use client';

import React from 'react';
import { useAntigravity } from '../../hooks/useAntigravity';

/**
 * Live AntigravityKit Modules Display
 * Fetches real data from API with auto-refresh
 */

interface ModuleCardProps {
    icon: string;
    name: string;
    description: string;
    status: 'active' | 'pending' | 'error';
    metrics?: { label: string; value: string }[];
    loading?: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ icon, name, description, status, metrics, loading }) => {
    const statusColors = {
        active: 'bg-green-500',
        pending: 'bg-yellow-500',
        error: 'bg-red-500'
    };

    if (loading) {
        return (
            <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded" />
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-muted rounded" />
                            <div className="h-3 w-24 bg-muted rounded" />
                        </div>
                    </div>
                    <div className="w-3 h-3 bg-muted rounded-full" />
                </div>
            </div>
        );
    }

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
                <span className={`w-2.5 h-2.5 rounded-full ${statusColors[status]} animate-pulse`} />
            </div>
            {metrics && metrics.length > 0 && (
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

export function LiveAntigravityModules() {
    const { modules, dna, leads, revenue, content, franchise, vc, moat, loading, error, refresh } = useAntigravity();

    const moduleData = [
        {
            icon: '🧬',
            name: 'AgencyDNA',
            description: 'Identity + Vietnamese tones',
            status: 'active' as const,
            metrics: dna ? [
                { label: 'Name', value: dna.name },
                { label: 'Niche', value: dna.niche },
                { label: 'Tone', value: dna.tone },
            ] : undefined
        },
        {
            icon: '🧲',
            name: 'ClientMagnet',
            description: 'Lead generation engine',
            status: 'active' as const,
            metrics: leads ? [
                { label: 'Leads', value: leads.total_leads.toString() },
                { label: 'Hot', value: leads.hot_leads.toString() },
                { label: 'Pipeline', value: leads.pipeline_value_formatted },
            ] : undefined
        },
        {
            icon: '💰',
            name: 'RevenueEngine',
            description: 'MRR/ARR tracking',
            status: 'active' as const,
            metrics: revenue ? [
                { label: 'MRR', value: revenue.mrr_formatted },
                { label: 'ARR', value: revenue.arr_formatted },
                { label: 'Collection', value: `${revenue.collection_rate.toFixed(1)}%` },
            ] : undefined
        },
        {
            icon: '🎨',
            name: 'ContentFactory',
            description: 'Mass content production',
            status: 'active' as const,
            metrics: content ? [
                { label: 'Ideas', value: content.total_ideas.toString() },
                { label: 'Content', value: content.total_content.toString() },
                { label: 'Virality', value: `${content.avg_virality_score.toFixed(0)}/100` },
            ] : undefined
        },
        {
            icon: '🏢',
            name: 'FranchiseManager',
            description: 'Territory network',
            status: 'active' as const,
            metrics: franchise ? [
                { label: 'Franchisees', value: franchise.active_franchisees.toString() },
                { label: 'Territories', value: `${franchise.covered_territories}/${franchise.total_territories}` },
                { label: 'Royalties', value: franchise.royalties_formatted },
            ] : undefined
        },
        {
            icon: '📊',
            name: 'VCMetrics',
            description: 'VC readiness dashboard',
            status: 'active' as const,
            metrics: vc ? [
                { label: 'Score', value: `${vc.score}/100` },
                { label: 'LTV/CAC', value: `${vc.ltv_cac_ratio.toFixed(1)}x` },
                { label: 'Stage', value: vc.stage },
            ] : undefined
        },
        {
            icon: '🛡️',
            name: 'DataMoat',
            description: 'Proprietary intelligence',
            status: 'active' as const,
            metrics: moat ? [
                { label: 'Data Points', value: new Intl.NumberFormat('en-US').format(moat.data_points) },
                { label: 'Insights', value: moat.insights_generated.toString() },
                { label: 'Defensibility', value: moat.defensibility },
            ] : undefined
        }
    ];

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                <p className="text-red-500">Error loading modules: {error}</p>
                <button
                    onClick={refresh}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">🚀 AntigravityKit Live</h2>
                    <p className="text-muted-foreground">
                        {modules ? `${modules.total_modules} Modules • All Active` : 'Loading...'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {!loading && modules && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm text-green-500">Live Data</span>
                        </div>
                    )}
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-sm text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Refreshing...' : '🔄 Refresh'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {moduleData.map((mod) => (
                    <ModuleCard key={mod.name} {...mod} loading={loading && !mod.metrics} />
                ))}
            </div>

            {modules && (
                <div className="text-center text-xs text-muted-foreground">
                    Last updated: {new Date(modules.timestamp).toLocaleTimeString()}
                </div>
            )}
        </div>
    );
}

export default LiveAntigravityModules;
