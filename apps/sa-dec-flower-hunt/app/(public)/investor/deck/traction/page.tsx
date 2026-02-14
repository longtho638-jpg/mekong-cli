"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, DollarSign, Tractor, Clock } from "lucide-react";
import { DataStream } from "@/components/terminal/DataStream";

interface TractionMetrics {
    activeUsers: number;
    gmv7Day: number;
    farmerCount: number;
    dailyGrowthPercent: number;
    timestamp: string;
}

export default function TractionSlide() {
    const [metrics, setMetrics] = useState<TractionMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch("/api/investor/traction");
                const data = await response.json();
                setMetrics(data);
            } catch (error) {
                console.error("Failed to fetch metrics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const formatVND = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
    const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(n);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 md:p-16">
            <div className="max-w-6xl w-full space-y-12">
                {/* Header */}
                <motion.div
                    className="text-center space-y-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <TrendingUp className="w-8 h-8 text-emerald-500" />
                        <h1 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-wider">
                            Traction
                        </h1>
                    </div>
                    {metrics && (
                        <div className="flex items-center justify-center gap-2 text-sm text-stone-500">
                            <Clock className="w-3 h-3" />
                            <span className="uppercase tracking-wider">
                                Updated: {new Date(metrics.timestamp).toLocaleTimeString("vi-VN")}
                            </span>
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-emerald-500 uppercase">LIVE</span>
                        </div>
                    )}
                </motion.div>

                {/* Metrics Grid */}
                {loading ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-stone-950/50 border border-stone-800 rounded-sm p-8 animate-pulse">
                                <div className="h-4 bg-stone-800 rounded w-24 mb-4" />
                                <div className="h-12 bg-stone-800 rounded w-32" />
                            </div>
                        ))}
                    </div>
                ) : metrics && (
                    <motion.div
                        className="grid md:grid-cols-2 gap-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        {/* Active Users */}
                        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-sm p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="w-6 h-6 text-emerald-400" />
                                <h3 className="text-sm text-emerald-500 uppercase tracking-widest font-bold">Active Users</h3>
                            </div>
                            <DataStream
                                label="TERMINAL SESSIONS"
                                value={formatNumber(metrics.activeUsers)}
                                trend={metrics.dailyGrowthPercent > 0 ? "up" : "down"}
                            />
                        </div>

                        {/* Daily Growth */}
                        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-sm p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="w-6 h-6 text-emerald-400" />
                                <h3 className="text-sm text-emerald-500 uppercase tracking-widest font-bold">Daily Growth</h3>
                            </div>
                            <DataStream
                                label="GROWTH RATE"
                                value={metrics.dailyGrowthPercent.toFixed(1)}
                                unit="%"
                                trend={metrics.dailyGrowthPercent > 0 ? "up" : "neutral"}
                            />
                        </div>

                        {/* GMV (7-Day) */}
                        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-sm p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <DollarSign className="w-6 h-6 text-emerald-400" />
                                <h3 className="text-sm text-emerald-500 uppercase tracking-widest font-bold">GMV (7-Day)</h3>
                            </div>
                            <div className="text-3xl font-bold text-white font-mono">
                                {formatVND(metrics.gmv7Day)}
                            </div>
                            <div className="text-xs text-stone-500 mt-2 uppercase">Gross Merchandise Value</div>
                        </div>

                        {/* Farmer Count */}
                        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-sm p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Tractor className="w-6 h-6 text-emerald-400" />
                                <h3 className="text-sm text-emerald-500 uppercase tracking-widest font-bold">Farmers Onboarded</h3>
                            </div>
                            <DataStream
                                label="SUPPLY SIDE"
                                value={formatNumber(metrics.farmerCount)}
                                trend="up"
                            />
                        </div>
                    </motion.div>
                )}

                {/* Bottom Banner */}
                <motion.div
                    className="bg-stone-950/80 border border-emerald-500/20 rounded-sm p-6 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <p className="text-sm text-stone-400">
                        <span className="text-emerald-400 font-bold">Pro Tip:</span> These numbers update in real-time from our production database.
                        <br />
                        <span className="text-xs">No screenshots. No faking. Just live proof.</span>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
