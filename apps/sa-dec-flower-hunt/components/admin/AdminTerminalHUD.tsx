"use client";

import { useEffect, useState } from "react";
import { Terminal, Activity, TrendingUp, Wifi, Shield, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useRealtimeMetrics } from "@/hooks/useRealtimeMetrics";

export function AdminTerminalHUD() {
    const [currentTime, setCurrentTime] = useState("");
    const {
        activeFarmers,
        activeCustomers,
        totalRevenue,
        totalOrders,
        isLoading,
        lastUpdate,
        error,
        refetch
    } = useRealtimeMetrics();

    // Calculate total nodes (farmers + customers + admin estimate)
    const nodesActive = activeFarmers + activeCustomers + 12; // 12 = banks/suppliers/logistics

    // Determine system status based on metrics
    const getSystemStatus = () => {
        if (error) return "CRITICAL" as const;
        if (isLoading) return "WARNING" as const;
        return "NOMINAL" as const;
    };

    const systemStatus = getSystemStatus();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            notation: "compact",
            maximumFractionDigits: 1
        }).format(n);

    const statusColor = {
        NOMINAL: "text-emerald-400",
        WARNING: "text-yellow-400",
        CRITICAL: "text-red-400"
    };

    const statusBg = {
        NOMINAL: "bg-emerald-500",
        WARNING: "bg-yellow-500",
        CRITICAL: "bg-red-500"
    };

    return (
        <motion.header
            className="bg-stone-950 border-b border-emerald-900/50 px-6 py-3 font-mono"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
        >
            <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Left: Brand */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 border border-emerald-500/30 flex items-center justify-center bg-emerald-900/20">
                            <Terminal className="w-5 h-5 text-emerald-400 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-[0.15em] text-white">
                                AGRIOS<span className="text-emerald-400">.tech</span>
                            </h1>
                            <div className="text-[10px] text-stone-500 tracking-wider flex items-center gap-2">
                                ADMIN_TERMINAL v4.0
                                {lastUpdate && (
                                    <span className="text-emerald-500">
                                        LIVE
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: Live Stats */}
                <div className="flex items-center gap-6 text-xs">
                    {/* Nodes Active */}
                    <div className="flex items-center gap-2 bg-stone-900/50 px-3 py-1.5 rounded border border-stone-800">
                        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-stone-400">NODES:</span>
                        <span className="text-white font-bold">
                            {isLoading ? "..." : nodesActive.toLocaleString()}
                        </span>
                    </div>

                    {/* Volume */}
                    <div className="flex items-center gap-2 bg-stone-900/50 px-3 py-1.5 rounded border border-stone-800">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-stone-400">VOLUME:</span>
                        <span className="text-emerald-400 font-bold">
                            {isLoading ? "..." : formatCurrency(totalRevenue)}
                        </span>
                    </div>

                    {/* Orders */}
                    <div className="flex items-center gap-2 bg-stone-900/50 px-3 py-1.5 rounded border border-stone-800">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-stone-400">ORDERS:</span>
                        <span className="text-white font-bold">
                            {isLoading ? "..." : totalOrders}
                        </span>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={refetch}
                        className="p-1.5 hover:bg-stone-800 rounded transition-colors"
                        title="Refresh metrics"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-stone-400 hover:text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Right: System Status */}
                <div className="flex items-center gap-4">
                    {/* Time */}
                    <div className="text-xs text-stone-500">
                        <span className="text-stone-400">TIME:</span>{" "}
                        <span className="text-white font-mono">{currentTime}</span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 bg-emerald-900/20 px-3 py-1.5 rounded border border-emerald-500/30">
                        <div className={`w-2 h-2 rounded-full ${statusBg[systemStatus]} animate-pulse`} />
                        <Shield className={`w-3.5 h-3.5 ${statusColor[systemStatus]}`} />
                        <span className={`text-xs font-bold ${statusColor[systemStatus]}`}>
                            SYSTEM: {systemStatus}
                        </span>
                    </div>
                </div>
            </div>
        </motion.header>
    );
}
