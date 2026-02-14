"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Activity,
    ShoppingCart,
    Users,
    Star,
    QrCode,
    DollarSign,
    TrendingUp
} from "lucide-react";
import { LiveMetricCard } from "@/components/dashboard/LiveMetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TopFarmersLeaderboard } from "@/components/dashboard/TopFarmersLeaderboard";

interface DashboardData {
    metrics: any;
    revenue_trend: any[];
    top_farmers: any[];
    recent_activity: any[];
}

export default function CommandCenterPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const fetchData = async () => {
        try {
            const response = await fetch('/api/admin/command-center');
            const json = await response.json();
            setData(json);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchData();

        // Poll every 10 seconds for live updates
        const interval = setInterval(fetchData, 10000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <Activity className="w-16 h-16 text-emerald-500 animate-pulse mx-auto mb-4" />
                    <p className="text-stone-400">Loading Command Center...</p>
                </div>
            </div>
        );
    }

    const metrics = data?.metrics || {};
    const revenueTrend = data?.revenue_trend || [];
    const topFarmers = data?.top_farmers || [];
    const recentActivity = data?.recent_activity || [];

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div>
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            Live Command Center
                        </h1>
                        <p className="text-stone-500">Real-time platform analytics & insights</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-sm">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                                Live
                            </span>
                        </div>
                        <div className="text-xs text-stone-600">
                            Updated {lastUpdate.toLocaleTimeString()}
                        </div>
                    </div>
                </motion.div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <LiveMetricCard
                        title="Orders Today"
                        value={metrics.orders_today || 0}
                        change="+12%"
                        icon={ShoppingCart}
                        color="emerald"
                    />

                    <LiveMetricCard
                        title="Revenue (Week)"
                        value={`${((metrics.revenue_week || 0) / 1000).toFixed(0)}K`}
                        change="+23%"
                        icon={DollarSign}
                        color="cyan"
                    />

                    <LiveMetricCard
                        title="Active Farmers"
                        value={metrics.active_farmers_week || 0}
                        change="+8%"
                        icon={Users}
                        color="amber"
                    />

                    <LiveMetricCard
                        title="Platform Rating"
                        value={(metrics.platform_avg_rating || 0).toFixed(1)}
                        change="+0.3"
                        icon={Star}
                        color="purple"
                    />
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        className="bg-stone-950 border border-stone-800 rounded-sm p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {metrics.total_farmers || 0}
                                </div>
                                <div className="text-xs text-stone-500 uppercase tracking-wider">
                                    Total Farmers
                                </div>
                            </div>
                            <Users className="w-8 h-8 text-stone-700" />
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-stone-950 border border-stone-800 rounded-sm p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {metrics.qr_scans_week || 0}
                                </div>
                                <div className="text-xs text-stone-500 uppercase tracking-wider">
                                    QR Scans (Week)
                                </div>
                            </div>
                            <QrCode className="w-8 h-8 text-stone-700" />
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-stone-950 border border-stone-800 rounded-sm p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {metrics.total_reviews || 0}
                                </div>
                                <div className="text-xs text-stone-500 uppercase tracking-wider">
                                    Total Reviews
                                </div>
                            </div>
                            <Star className="w-8 h-8 text-stone-700" />
                        </div>
                    </motion.div>
                </div>

                {/* Charts & Leaderboard */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <RevenueChart data={revenueTrend} />
                    </div>

                    <div>
                        <TopFarmersLeaderboard farmers={topFarmers} />
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <motion.div
                    className="bg-stone-950 border border-stone-800 rounded-sm p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-cyan-500" />
                            Recent Activity
                        </h3>
                        <p className="text-sm text-stone-500">Latest orders across the platform</p>
                    </div>

                    <div className="space-y-2">
                        {recentActivity.length === 0 ? (
                            <div className="text-center py-8 text-stone-600">
                                No recent activity
                            </div>
                        ) : (
                            recentActivity.map((order: any, index: number) => (
                                <motion.div
                                    key={order.id}
                                    className="flex items-center justify-between p-3 bg-stone-900/30 rounded hover:bg-stone-900/50 transition-colors"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${order.status === 'completed' ? 'bg-emerald-500' :
                                                order.status === 'pending' ? 'bg-amber-500' :
                                                    'bg-cyan-500'
                                            }`} />
                                        <div>
                                            <div className="font-medium text-white">
                                                {order.recipient_name}
                                            </div>
                                            <div className="text-xs text-stone-500">
                                                {new Date(order.created_at).toLocaleString('vi-VN')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-emerald-500">
                                            {(order.final_price / 1000).toFixed(0)}K
                                        </div>
                                        <div className="text-xs text-stone-500 uppercase">
                                            {order.status}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Footer Stats */}
                <div className="text-center text-xs text-stone-600">
                    <p>Command Center updates every 10 seconds • Total Revenue: {((metrics.total_revenue || 0) / 1000000).toFixed(2)}M VNĐ</p>
                </div>
            </div>
        </div>
    );
}
