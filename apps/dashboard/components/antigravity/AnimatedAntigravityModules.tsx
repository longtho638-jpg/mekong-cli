'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAntigravity } from '../../hooks/useAntigravity';

/**
 * Animated AntigravityKit Modules with Framer Motion
 * Enhanced with micro-interactions and smooth transitions
 */

interface ModuleCardProps {
    icon: string;
    name: string;
    description: string;
    status: 'active' | 'pending' | 'error';
    metrics?: { label: string; value: string }[];
    loading?: boolean;
    index: number;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
    icon, name, description, status, metrics, loading, index
}) => {
    const statusColors = {
        active: 'bg-green-500',
        pending: 'bg-yellow-500',
        error: 'bg-red-500'
    };

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl p-5"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-8 h-8 bg-muted rounded"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-muted rounded" />
                            <div className="h-3 w-24 bg-muted rounded" />
                        </div>
                    </div>
                    <motion.div
                        className="w-3 h-3 bg-muted rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                delay: index * 0.1,
                type: "spring",
                stiffness: 260,
                damping: 20
            }}
            whileHover={{
                scale: 1.03,
                y: -5,
                transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <motion.span
                        className="text-2xl"
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        {icon}
                    </motion.span>
                    <div>
                        <h3 className="font-semibold text-foreground">{name}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>
                <motion.span
                    className={`w-2.5 h-2.5 rounded-full ${statusColors[status]}`}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.8, 1]
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            </div>

            {metrics && metrics.length > 0 && (
                <motion.div
                    className="space-y-2 mt-4 pt-4 border-t border-border"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                >
                    {metrics.map((m, i) => (
                        <motion.div
                            key={i}
                            className="flex justify-between text-sm"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + 0.3 + (i * 0.05) }}
                        >
                            <span className="text-muted-foreground">{m.label}</span>
                            <motion.span
                                className="font-medium text-foreground"
                                whileHover={{ scale: 1.05 }}
                            >
                                {m.value}
                            </motion.span>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
};

export function AnimatedAntigravityModules() {
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
                { label: 'Data Points', value: moat.data_points.toLocaleString() },
                { label: 'Insights', value: moat.insights_generated.toString() },
                { label: 'Defensibility', value: moat.defensibility },
            ] : undefined
        }
    ];

    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center"
            >
                <p className="text-red-500">Error loading modules: {error}</p>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={refresh}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                    Retry
                </motion.button>
            </motion.div>
        );
    }

    return (
        <div className="space-y-6">
            <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div>
                    <motion.h2
                        className="text-2xl font-bold text-foreground"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        🚀 AntigravityKit Live
                    </motion.h2>
                    <motion.p
                        className="text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        {modules ? `${modules.total_modules} Modules • All Active` : 'Loading...'}
                    </motion.p>
                </div>

                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {!loading && modules && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full"
                            >
                                <motion.span
                                    className="w-2 h-2 bg-green-500 rounded-full"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                />
                                <span className="text-sm text-green-500">Live Data</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={refresh}
                        disabled={loading}
                        className="px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-sm text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                        <motion.span
                            animate={loading ? { rotate: 360 } : {}}
                            transition={loading ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
                            className="inline-block"
                        >
                            🔄
                        </motion.span>
                        {' '}{loading ? 'Refreshing...' : 'Refresh'}
                    </motion.button>
                </div>
            </motion.div>

            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <AnimatePresence mode="wait">
                    {moduleData.map((mod, index) => (
                        <ModuleCard
                            key={mod.name}
                            {...mod}
                            loading={loading && !mod.metrics}
                            index={index}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>

            {modules && (
                <motion.div
                    className="text-center text-xs text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                >
                    Last updated: {new Date(modules.timestamp).toLocaleTimeString()}
                </motion.div>
            )}
        </div>
    );
}

export default AnimatedAntigravityModules;
