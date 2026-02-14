"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Users,
    ShoppingCart,
    TrendingUp,
    MessageSquare,
    HeadphonesIcon,
    Target,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Calendar,
    Zap,
    RefreshCw,
    Terminal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

// Playbook Targets from SOLO_1M_PLAYBOOK
const TARGETS = {
    farmersPerWeek: 5,
    ordersPerDay: 10,
    gmvGrowthPercent: 20,
    npsScore: 50,
    ticketsPerDay: 10
};

interface DailyMetrics {
    activeFarmers: number;
    farmersThisWeek: number;
    todayOrders: number;
    weeklyGMV: number;
    lastWeekGMV: number;
    npsScore: number;
    supportTickets: number;
    isLoading: boolean;
}

function getStatusIcon(actual: number, target: number, isLowerBetter = false) {
    const ratio = isLowerBetter ? target / actual : actual / target;
    if (ratio >= 1) return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (ratio >= 0.7) return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
}

function getStatusClass(actual: number, target: number, isLowerBetter = false) {
    const ratio = isLowerBetter ? target / actual : actual / target;
    if (ratio >= 1) return "border-emerald-500/50 bg-emerald-950/20";
    if (ratio >= 0.7) return "border-amber-500/50 bg-amber-950/20";
    return "border-red-500/50 bg-red-950/20";
}

export default function SoloDashboard() {
    const [metrics, setMetrics] = useState<DailyMetrics>({
        activeFarmers: 0,
        farmersThisWeek: 0,
        todayOrders: 0,
        weeklyGMV: 0,
        lastWeekGMV: 0,
        npsScore: 0,
        supportTickets: 0,
        isLoading: true
    });
    const [currentTime, setCurrentTime] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchMetrics = useCallback(async () => {
        if (!supabase) {
            setMetrics(prev => ({ ...prev, isLoading: false }));
            return;
        }

        setIsRefreshing(true);

        try {
            // Get today's date boundaries
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            // Get week boundaries
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekStartISO = weekStart.toISOString();

            const lastWeekStart = new Date(weekStart);
            lastWeekStart.setDate(lastWeekStart.getDate() - 7);
            const lastWeekStartISO = lastWeekStart.toISOString();

            // Fetch active farmers (profiles with role = farmer)
            const { count: farmerCount } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .eq("role", "farmer");

            // Fetch farmers added this week
            const { count: newFarmersCount } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .eq("role", "farmer")
                .gte("created_at", weekStartISO);

            // Fetch today's orders
            const { count: todayOrdersCount } = await supabase
                .from("orders")
                .select("*", { count: "exact", head: true })
                .gte("created_at", todayISO);

            // Fetch weekly GMV
            const { data: weeklyOrders } = await supabase
                .from("orders")
                .select("total")
                .gte("created_at", weekStartISO);

            const weeklyGMV = weeklyOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

            // Fetch last week GMV for comparison
            const { data: lastWeekOrders } = await supabase
                .from("orders")
                .select("total")
                .gte("created_at", lastWeekStartISO)
                .lt("created_at", weekStartISO);

            const lastWeekGMV = lastWeekOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

            // Mock NPS and tickets (would need separate tables in production)
            const mockNPS = 62;
            const mockTickets = 7;

            setMetrics({
                activeFarmers: farmerCount || 0,
                farmersThisWeek: newFarmersCount || 0,
                todayOrders: todayOrdersCount || 0,
                weeklyGMV,
                lastWeekGMV,
                npsScore: mockNPS,
                supportTickets: mockTickets,
                isLoading: false
            });
        } catch (error) {
            console.error("Error fetching metrics:", error);
            setMetrics(prev => ({ ...prev, isLoading: false }));
        }

        setIsRefreshing(false);
    }, []);

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, [fetchMetrics]);

    const gmvGrowth = metrics.lastWeekGMV > 0
        ? ((metrics.weeklyGMV - metrics.lastWeekGMV) / metrics.lastWeekGMV) * 100
        : 0;

    const formatVND = (n: number) => new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(n);

    const metricCards = [
        {
            id: "farmers",
            title: "NÔNG_DÂN_TUẦN_NÀY",
            icon: Users,
            value: metrics.farmersThisWeek,
            target: TARGETS.farmersPerWeek,
            unit: "người",
            subtitle: `Tổng: ${metrics.activeFarmers} nông dân active`
        },
        {
            id: "orders",
            title: "ĐƠN_HÀNG_HÔM_NAY",
            icon: ShoppingCart,
            value: metrics.todayOrders,
            target: TARGETS.ordersPerDay,
            unit: "đơn"
        },
        {
            id: "gmv",
            title: "GMV_TUẦN_NÀY",
            icon: TrendingUp,
            value: gmvGrowth,
            target: TARGETS.gmvGrowthPercent,
            unit: "%",
            subtitle: formatVND(metrics.weeklyGMV)
        },
        {
            id: "nps",
            title: "NPS_SCORE",
            icon: MessageSquare,
            value: metrics.npsScore,
            target: TARGETS.npsScore,
            unit: ""
        },
        {
            id: "tickets",
            title: "TICKET_HÔM_NAY",
            icon: HeadphonesIcon,
            value: metrics.supportTickets,
            target: TARGETS.ticketsPerDay,
            unit: "",
            isLowerBetter: true
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white font-mono p-6">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_lab_hyperreal_1765368168487.png" className="w-full h-full object-cover opacity-15" />
                <div className="absolute inset-0 bg-stone-950/90" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    className="flex items-center justify-between mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Terminal className="w-6 h-6 text-emerald-500" />
                            <h1 className="text-2xl font-bold">SOLO_DASHBOARD</h1>
                            <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/50 rounded text-xs text-emerald-400">
                                25_TỶ_MODE
                            </span>
                        </div>
                        <p className="text-stone-500 text-sm">
                            Track 5 metrics mỗi ngày → Đạt mục tiêu Playbook
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-stone-500 text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {currentTime}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchMetrics}
                            disabled={isRefreshing}
                            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-950"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </motion.div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {metricCards.map((card, i) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`
                                border rounded-lg p-5 transition-all
                                ${getStatusClass(card.value, card.target, card.isLowerBetter)}
                            `}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <card.icon className="w-4 h-4 text-stone-500" />
                                    <span className="text-xs text-stone-500 uppercase tracking-wider">
                                        {card.title}
                                    </span>
                                </div>
                                {getStatusIcon(card.value, card.target, card.isLowerBetter)}
                            </div>

                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-black text-white">
                                    {metrics.isLoading ? "—" : card.value.toFixed(card.id === 'gmv' ? 1 : 0)}
                                </span>
                                <span className="text-lg text-stone-500">{card.unit}</span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-stone-600 flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    Mục tiêu: {card.target}{card.unit}
                                </span>
                                {card.subtitle && (
                                    <span className="text-stone-500">{card.subtitle}</span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-stone-950 border border-emerald-500/20 rounded-lg p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-bold uppercase tracking-wider">
                            Quick Actions
                        </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button variant="outline" className="border-stone-800 text-stone-400 hover:bg-stone-900 text-xs h-auto py-3">
                            📞 Gọi Nông dân
                        </Button>
                        <Button variant="outline" className="border-stone-800 text-stone-400 hover:bg-stone-900 text-xs h-auto py-3">
                            📝 Tạo Content
                        </Button>
                        <Button variant="outline" className="border-stone-800 text-stone-400 hover:bg-stone-900 text-xs h-auto py-3">
                            📊 Chạy Ads Report
                        </Button>
                        <Button variant="outline" className="border-stone-800 text-stone-400 hover:bg-stone-900 text-xs h-auto py-3">
                            🤝 Outreach Bank
                        </Button>
                    </div>
                </motion.div>

                {/* Footer */}
                <div className="mt-8 text-center text-stone-600 text-xs">
                    <p>Dựa trên <span className="text-emerald-500">SOLO_1M_PLAYBOOK</span> • Track mỗi ngày để đạt 25 tỷ</p>
                </div>
            </div>
        </div>
    );
}
