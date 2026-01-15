'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Animated AntigravityKit Test Page with Framer Motion
export default function AnimatedTestPage() {
    const [modules, setModules] = useState<any>(null);
    const [dna, setDna] = useState<any>(null);
    const [vc, setVc] = useState<any>(null);
    const [revenue, setRevenue] = useState<any>(null);
    const [leads, setLeads] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const fetchData = async () => {
        try {
            const [modulesRes, dnaRes, vcRes, revenueRes, leadsRes] = await Promise.all([
                fetch(`${API_BASE}/api/antigravity/modules`),
                fetch(`${API_BASE}/api/antigravity/dna`),
                fetch(`${API_BASE}/api/antigravity/vc`),
                fetch(`${API_BASE}/api/antigravity/revenue`),
                fetch(`${API_BASE}/api/antigravity/leads`)
            ]);

            setModules(await modulesRes.json());
            setDna(await dnaRes.json());
            setVc(await vcRes.json());
            setRevenue(await revenueRes.json());
            setLeads(await leadsRes.json());
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    const cardHover = {
        scale: 1.02,
        y: -5,
        transition: { type: 'spring', stiffness: 400, damping: 10 }
    };

    const pulseVariants = {
        pulse: {
            scale: [1, 1.05, 1],
            transition: { duration: 2, repeat: Infinity }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                    />
                    <motion.p
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-xl"
                    >
                        Loading AntigravityKit...
                    </motion.p>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: 3 }}
                        className="text-6xl mb-4"
                    >
                        ❌
                    </motion.div>
                    <p className="text-xl text-red-400">Error: {error}</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchData}
                        className="mt-4 px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500"
                    >
                        Retry
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="text-center mb-12">
                    <motion.h1
                        className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                        animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                        transition={{ duration: 5, repeat: Infinity }}
                    >
                        🚀 AntigravityKit WOW 2.0
                    </motion.h1>
                    <p className="text-gray-400 mt-3">Live data with Framer Motion animations</p>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-500/20 text-green-400 rounded-full"
                    >
                        <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-2 h-2 bg-green-400 rounded-full"
                        />
                        Connected • Last: {lastUpdated.toLocaleTimeString()}
                    </motion.div>
                </motion.div>

                {/* Stats Row */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Leads', value: leads?.total_leads || 0, icon: '🧲', color: 'from-blue-500 to-cyan-500' },
                        { label: 'Clients', value: leads?.total_clients || 0, icon: '👥', color: 'from-green-500 to-emerald-500' },
                        { label: 'MRR', value: revenue?.mrr_formatted || '$0', icon: '💰', color: 'from-yellow-500 to-orange-500' },
                        { label: 'VC Score', value: `${vc?.score || 0}/100`, icon: '📊', color: 'from-purple-500 to-pink-500' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            whileHover={cardHover}
                            className={`bg-gradient-to-br ${stat.color} p-[1px] rounded-xl`}
                        >
                            <div className="bg-gray-800 rounded-xl p-5 h-full">
                                <div className="text-3xl mb-2">{stat.icon}</div>
                                <motion.div
                                    key={stat.value}
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-2xl font-bold"
                                >
                                    {stat.value}
                                </motion.div>
                                <div className="text-gray-400 text-sm">{stat.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* AgencyDNA Card */}
                <motion.div
                    variants={itemVariants}
                    whileHover={cardHover}
                    className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 mb-6 border border-gray-700/50"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <motion.span
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            className="text-4xl"
                        >
                            🧬
                        </motion.span>
                        <h2 className="text-2xl font-bold">AgencyDNA</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Name', value: dna?.name },
                            { label: 'Niche', value: dna?.niche },
                            { label: 'Location', value: dna?.location },
                            { label: 'Tone', value: dna?.tone?.replace('_', ' ') },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-gray-700/30 rounded-lg p-4"
                            >
                                <p className="text-gray-400 text-sm">{item.label}</p>
                                <p className="text-xl font-semibold capitalize">{item.value}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* VC Readiness Card */}
                <motion.div
                    variants={itemVariants}
                    whileHover={cardHover}
                    className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur rounded-2xl p-6 mb-6 border border-orange-500/30"
                >
                    <div className="flex items-center justify-between flex-wrap gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <motion.span
                                    variants={pulseVariants}
                                    animate="pulse"
                                    className="text-4xl"
                                >
                                    📊
                                </motion.span>
                                <h2 className="text-2xl font-bold">VC Readiness</h2>
                            </div>
                            <motion.div
                                key={vc?.score}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                className="text-7xl font-bold text-orange-400"
                            >
                                {vc?.score}<span className="text-3xl text-gray-400">/100</span>
                            </motion.div>
                            <p className="text-gray-400 mt-2">Stage: {vc?.stage?.toUpperCase()}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                                { label: 'LTV/CAC', value: `${vc?.ltv_cac_ratio?.toFixed(1)}x`, color: 'text-green-400' },
                                { label: 'Rule of 40', value: `${vc?.rule_of_40?.toFixed(0)}%`, color: 'text-blue-400' },
                                { label: 'NRR', value: `${vc?.nrr}%`, color: 'text-purple-400' },
                                { label: 'Growth', value: `${vc?.growth_rate}%`, color: 'text-pink-400' },
                                { label: 'Margin', value: `${vc?.gross_margin}%`, color: 'text-cyan-400' },
                                { label: 'ARR', value: revenue?.arr_formatted, color: 'text-yellow-400' },
                            ].map((metric, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.05 }}
                                    whileHover={{ scale: 1.1 }}
                                    className="text-center p-3 bg-gray-800/50 rounded-lg"
                                >
                                    <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                                    <p className="text-gray-400 text-xs">{metric.label}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Modules Grid */}
                <motion.div
                    variants={itemVariants}
                    className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700/50"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-3xl">🎯</span>
                        <h2 className="text-2xl font-bold">All Modules ({modules?.total_modules})</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <AnimatePresence>
                            {modules?.modules?.map((mod: any, i: number) => (
                                <motion.div
                                    key={mod.name}
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ delay: i * 0.05, type: 'spring' }}
                                    whileHover={{
                                        scale: 1.1,
                                        y: -10,
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                                    }}
                                    className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl p-4 text-center cursor-pointer border border-gray-600/30"
                                >
                                    <motion.div
                                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                                        transition={{ duration: 0.3 }}
                                        className="text-4xl mb-3"
                                    >
                                        {mod.icon}
                                    </motion.div>
                                    <p className="font-medium text-sm">{mod.name}</p>
                                    <motion.div
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className={`text-xs mt-2 ${mod.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}
                                    >
                                        ● {mod.status === 'active' ? 'Active' : 'Inactive'}
                                    </motion.div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Refresh Button */}
                <motion.div variants={itemVariants} className="text-center mt-8">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchData}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold hover:from-blue-500 hover:to-purple-500 transition-all"
                    >
                        🔄 Refresh Data
                    </motion.button>
                </motion.div>

                {/* Footer */}
                <motion.div
                    variants={itemVariants}
                    className="text-center mt-8 text-gray-500 text-sm"
                >
                    <p>AntigravityKit WOW 2.0 • 9/9 Endpoints • Framer Motion ✨</p>
                    <p className="mt-1">Auto-refresh every 30 seconds</p>
                </motion.div>
            </motion.div>
        </div>
    );
}
