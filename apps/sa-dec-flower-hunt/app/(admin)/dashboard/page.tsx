

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { DollarSign, Users, Zap, TrendingUp, Cpu, Activity, ShoppingCart, Eye, Target, Loader2 } from "lucide-react";
import { KPICard } from "@/components/admin/KPICard";
import { LiveMetricCard } from "@/components/admin/LiveMetricCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getAdminStats, getDailyRevenue, AdminStats, DailyRevenue } from "@/lib/api/admin";
import { useLanguage } from "@/lib/i18n";

// --- Dynamic Imports for Performance ---
const RevenueChart = dynamic(() => import("@/components/admin/RevenueChart").then(mod => mod.RevenueChart), {
    loading: () => <LoadingSpinner />,
    ssr: false
});
const AgentFeed = dynamic(() => import("@/components/admin/AgentFeed").then(mod => mod.AgentFeed), {
    loading: () => <LoadingSpinner />,
    ssr: false
});
const CEOActions = dynamic(() => import("@/components/admin/CEOActions").then(mod => mod.CEOActions), {
    loading: () => <LoadingSpinner />
});
const ActivityFeed = dynamic(() => import("@/components/admin/ActivityFeed").then(mod => mod.ActivityFeed), {
    loading: () => <LoadingSpinner />,
    ssr: false
});
const ParticleBackground = dynamic(() => import("@/components/ui/ParticleBackground").then(mod => mod.ParticleBackground), {
    ssr: false
});
const ThreeDCard = dynamic(() => import("@/components/ui/ThreeDCard").then(mod => mod.ThreeDCard), {
    ssr: false
});

// --- Helper Components ---
function LoadingSpinner() {
    return <div className="w-full h-full flex items-center justify-center min-h-[100px]"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;
}

export default function DashboardPage() {
    const { t } = useLanguage();
    const [mounted, setMounted] = useState(false);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
    const [loading, setLoading] = useState(true);

    // Live Metrics State
    const [liveMetrics, setLiveMetrics] = useState<any>(null);
    const [activityFeed, setActivityFeed] = useState<any[]>([]);

    // Fetch initial data
    useEffect(() => {
        setMounted(true);
        async function fetchData() {
            try {
                const [statsData, revenueData] = await Promise.all([
                    getAdminStats(),
                    getDailyRevenue()
                ]);
                setStats(statsData);
                setDailyRevenue(revenueData);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Fetch Live Metrics with Polling (30s)
    useEffect(() => {
        async function fetchLiveMetrics() {
            try {
                const res = await fetch('/api/admin/live-metrics');
                const data = await res.json();
                setLiveMetrics(data);

                // Transform recent activity for ActivityFeed
                const formattedActivity = data.recentActivity?.map((item: any) => ({
                    id: item.id,
                    type: 'order' as const,
                    title: `Đơn hàng mới #${item.id.slice(0, 8)}`,
                    description: `Tổng: ${new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                    }).format(item.amount)}`,
                    timestamp: item.timestamp,
                    amount: item.amount
                })) || [];
                setActivityFeed(formattedActivity);
            } catch (error) {
                console.error("Live metrics error:", error);
            }
        }

        // Initial fetch
        fetchLiveMetrics();

        // Poll every 30 seconds
        const interval = setInterval(fetchLiveMetrics, 30000);

        return () => clearInterval(interval);
    }, []);

    if (!mounted) return null;

    return (
        <div className="p-8 space-y-8 min-h-screen relative font-mono text-blue-50">
            {/* Background */}
            <div className="fixed inset-0 bg-slate-950 -z-20" />
            <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 -z-10" />
            <ParticleBackground />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-blue-900/30 pb-6 backdrop-blur-sm">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-widest uppercase flex items-center gap-3">
                        {t("dashboard.title")}
                        <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">Lvl.5</span>
                    </h2>
                    <p className="text-blue-400/60 mt-1 text-sm">{t("dashboard.subtitle")}</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="px-3 py-1 rounded bg-green-950/30 text-green-500 border border-green-500/30 text-xs font-mono flex items-center gap-2 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {t("dashboard.live_stream")}
                    </span>
                    {loading && <span className="text-blue-500 text-xs animate-pulse">{t("dashboard.syncing")}</span>}
                </div>
            </div>

            {/* Live Metrics Section */}
            {liveMetrics && (
                <LiveMetricsDashboard
                    liveMetrics={liveMetrics}
                    activityFeed={activityFeed}
                    t={t}
                />
            )}

            {/* Original KPI Grid */}
            <div className="grid grid-cols-4 gap-4">
                <KPICard
                    icon={<DollarSign className="w-6 h-6 text-green-500" />}
                    label="Real-time Revenue"
                    value={stats ? `$${stats.total_revenue.toLocaleString()}` : "..."}
                    sub="Lifetime Gross Volume"
                    color="green"
                />
                <KPICard
                    icon={<Users className="w-6 h-6 text-blue-500" />}
                    label="Total Orders"
                    value={stats ? stats.total_orders.toString() : "..."}
                    sub="Processed Orders"
                    color="blue"
                />
                <KPICard
                    icon={<Cpu className="w-6 h-6 text-purple-500" />}
                    label="Active Products"
                    value={stats ? stats.active_products.toString() : "..."}
                    sub={`${stats?.low_stock_products || 0} Low Stock`}
                    color="purple"
                />
                <KPICard
                    icon={<TrendingUp className="w-6 h-6 text-orange-500" />}
                    label="Autonomy Score"
                    value="98.5%"
                    sub="Level 5 Achieved"
                    color="orange"
                />
            </div>

            <div className="grid grid-cols-3 gap-6 h-[500px]">
                {/* Main Chart Section */}
                <div className="col-span-2 bg-slate-900/60 border border-blue-900/30 rounded-xl p-6 flex flex-col backdrop-blur-sm shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                    <h3 className="text-sm font-bold text-blue-300 mb-6 flex items-center gap-2 uppercase tracking-widest">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        {t("dashboard.revenue_perf")}
                    </h3>
                    <div className="flex-1 w-full min-h-0 opacity-90">
                        <RevenueChart data={dailyRevenue} />
                    </div>
                </div>

                {/* Agent Feed Section */}
                <div className="col-span-1 bg-slate-900/60 border border-yellow-900/30 rounded-xl p-6 flex flex-col overflow-hidden backdrop-blur-sm">
                    <h3 className="text-sm font-bold text-yellow-500 mb-6 flex items-center gap-2 uppercase tracking-widest">
                        <Zap className="w-4 h-4" />
                        {t("dashboard.ai_activity")}
                    </h3>
                    <div className="flex-1 overflow-auto opacity-80">
                        <AgentFeed />
                    </div>
                </div>
            </div>

            {/* CEO Actions Suite */}
            <div className="border border-blue-900/20 rounded-xl p-4 bg-slate-900/40">
                <CEOActions />
            </div>

            <footer className="text-center text-[10px] text-blue-900/50 font-mono mt-8 uppercase tracking-[0.3em]">
                {t("dashboard.secure_footer")}
            </footer>
        </div>
    );
}

// --- Sub-Components ---
function LiveMetricsDashboard({ liveMetrics, activityFeed, t }: { liveMetrics: any, activityFeed: any[], t: any }) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-blue-500" />
                {t("dashboard.live_command")}
                <span className="text-[10px] text-blue-600 font-normal">
                    (POLLING: 30s)
                </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ThreeDCard className="bg-slate-900/80 border-blue-800/50">
                    <div className="p-4">
                        <LiveMetricCard
                            title="Active Users"
                            value={liveMetrics.activeUsersNow}
                            icon={Eye}
                            subtitle="Last 5 minutes"
                        />
                    </div>
                </ThreeDCard>
                <ThreeDCard className="bg-slate-900/80 border-blue-800/50">
                    <div className="p-4">
                        <LiveMetricCard
                            title="Orders Today"
                            value={liveMetrics.ordersToday}
                            icon={ShoppingCart}
                            format="number"
                            subtitle={`Rev: ${new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                                notation: 'compact'
                            }).format(liveMetrics?.revenueToday || 0)}`}
                        />
                    </div>
                </ThreeDCard>
                <ThreeDCard className="bg-slate-900/80 border-blue-800/50">
                    <div className="p-4">
                        <LiveMetricCard
                            title="Conversion"
                            value={liveMetrics.conversionRate}
                            icon={Target}
                            format="percentage"
                            trend={liveMetrics.conversionRate > 3 ? 5 : -2}
                            subtitle="Funnel Efficiency"
                        />
                    </div>
                </ThreeDCard>
                <ThreeDCard className="bg-slate-900/80 border-blue-800/50">
                    <div className="p-4">
                        <LiveMetricCard
                            title="Avg Cart Val"
                            value={liveMetrics.avgCartValue}
                            icon={DollarSign}
                            format="currency"
                            subtitle="Per Transaction"
                        />
                    </div>
                </ThreeDCard>
            </div>

            {/* Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-slate-900/60 border border-blue-900/30 rounded-xl p-4 backdrop-blur-md">
                        <ActivityFeed activities={activityFeed} maxHeight="350px" />
                    </div>
                </div>
                <div>
                    <ThreeDCard className="bg-gradient-to-br from-purple-900/40 to-slate-900/80 border-purple-500/30 h-full">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Top Performer
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-bold text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                                {liveMetrics?.topSellingProduct?.name || "No Data"}
                            </p>
                            <p className="text-sm text-purple-400 mt-1 font-mono">
                                {liveMetrics?.topSellingProduct?.quantity || 0} UNITS DEPLOYED
                            </p>
                        </CardContent>
                    </ThreeDCard>
                </div>
            </div>
        </div>
    );
}


