"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { TerminalHeader } from "@/components/terminal/TerminalHeader";
import { DataStream } from "@/components/terminal/DataStream";
import { NodePulse } from "@/components/terminal/NodePulse";
import {
    Sprout,
    ShoppingBag,
    Landmark,
    Package,
    Truck,
    Users,
    TrendingUp,
    Activity,
    DollarSign,
    ThermometerSun
} from "lucide-react";

interface NodeData {
    id: string;
    name: string;
    nameVi: string;
    icon: React.ReactNode;
    status: "online" | "warning" | "offline";
    color: string;
    metrics: {
        label: string;
        value: string | number;
        trend?: "up" | "down" | "neutral";
    }[];
    activeCount: number;
}

export default function AdminTerminalPage() {
    const [currentTime, setCurrentTime] = useState("");
    const [nodes, setNodes] = useState<NodeData[]>([
        {
            id: "farmers",
            name: "FARMERS",
            nameVi: "NÔNG_DÂN",
            icon: <Sprout className="w-6 h-6" />,
            status: "online",
            color: "emerald",
            activeCount: 1247,
            metrics: [
                { label: "DOANH_THU", value: "₫2.4B", trend: "up" },
                { label: "SẢN_PHẨM", value: 3420 },
                { label: "TÍN_DỤNG_TB", value: "AA-" },
            ]
        },
        {
            id: "buyers",
            name: "BUYERS",
            nameVi: "KHÁCH_HÀNG",
            icon: <ShoppingBag className="w-6 h-6" />,
            status: "online",
            color: "blue",
            activeCount: 8934,
            metrics: [
                { label: "ĐƠN_HÀNG", value: 1892, trend: "up" },
                { label: "GIỎ_HÀNG", value: 4521 },
                { label: "TỶ_LỆ_CHUYỂN", value: "12.4%" },
            ]
        },
        {
            id: "banks",
            name: "BANKS",
            nameVi: "NGÂN_HÀNG",
            icon: <Landmark className="w-6 h-6" />,
            status: "online",
            color: "yellow",
            activeCount: 12,
            metrics: [
                { label: "TÍN_DỤNG_XANH", value: "₫450M" },
                { label: "GIẢI_NGÂN", value: 89, trend: "up" },
                { label: "NỢ_XẤU", value: "0.8%" },
            ]
        },
        {
            id: "suppliers",
            name: "SUPPLIERS",
            nameVi: "NHÀ_CUNG_CẤP",
            icon: <Package className="w-6 h-6" />,
            status: "warning",
            color: "orange",
            activeCount: 156,
            metrics: [
                { label: "SKU_HOẠT_ĐỘNG", value: 2341 },
                { label: "TỒN_KHO_THẤP", value: 23, trend: "down" },
                { label: "GIAO_JIT", value: "94%" },
            ]
        },
        {
            id: "logistics",
            name: "LOGISTICS",
            nameVi: "VẬN_TẢI",
            icon: <Truck className="w-6 h-6" />,
            status: "online",
            color: "cyan",
            activeCount: 45,
            metrics: [
                { label: "ĐANG_GIAO", value: 234 },
                { label: "NHIỆT_ĐỘ", value: "18.5°C" },
                { label: "ĐÚNG_GIỜ", value: "97.2%", trend: "up" },
            ]
        },
    ]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }));
        }, 1000);

        // Simulate live updates
        const statsTimer = setInterval(() => {
            setNodes(prev => prev.map(node => ({
                ...node,
                activeCount: node.activeCount + Math.floor(Math.random() * 5) - 2
            })));
        }, 5000);

        return () => {
            clearInterval(timer);
            clearInterval(statsTimer);
        };
    }, []);

    const getColorClasses = (color: string) => ({
        border: `border-${color}-500/30`,
        bg: `bg-${color}-900/20`,
        text: `text-${color}-400`,
        glow: `shadow-${color}-500/20`
    });

    const totalNodes = nodes.reduce((sum, n) => sum + n.activeCount, 0);

    return (
        <div className="min-h-screen bg-stone-950 text-emerald-400 font-mono p-6">
            {/* Grid Background */}
            <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />

            {/* Page Header */}
            <motion.div
                className="mb-8 text-center"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <h1 className="text-3xl font-bold tracking-[0.2em] text-white mb-2">
                    5-NODE<span className="text-emerald-400">_ECOSYSTEM</span>
                </h1>
                <p className="text-stone-500 text-sm tracking-wider">
                    THỜI_GIAN_THỰC // TỔNG_NODE: <span className="text-emerald-400">{totalNodes.toLocaleString()}</span> //
                    GIỜ: <span className="text-white">{currentTime}</span>
                </p>
            </motion.div>

            {/* 5-Node Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {nodes.map((node, index) => (
                    <motion.div
                        key={node.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`
                            bg-stone-900/50 border border-stone-800 rounded-lg p-6
                            hover:border-${node.color}-500/50 transition-all duration-300
                            hover:shadow-lg hover:shadow-${node.color}-500/10
                        `}
                    >
                        {/* Node Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`
                                    w-12 h-12 rounded border border-${node.color}-500/30 
                                    bg-${node.color}-900/20 flex items-center justify-center
                                    text-${node.color}-400
                                `}>
                                    {node.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white tracking-wider">
                                        {node.nameVi}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-stone-500">
                                        <NodePulse
                                            size="sm"
                                            color={node.status === "online" ? "emerald" : node.status === "warning" ? "amber" : "red"}
                                        />
                                        <span className={
                                            node.status === "online" ? "text-emerald-400" :
                                                node.status === "warning" ? "text-yellow-400" : "text-red-400"
                                        }>
                                            {node.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-white">
                                    {node.activeCount.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-stone-500 tracking-wider">
                                    HOẠT_ĐỘNG
                                </div>
                            </div>
                        </div>

                        {/* Node Metrics */}
                        <div className="grid grid-cols-3 gap-2">
                            {node.metrics.map((metric, i) => (
                                <div
                                    key={i}
                                    className="bg-stone-950/50 p-2 rounded border border-stone-800"
                                >
                                    <div className="text-[9px] text-stone-500 mb-1 truncate">
                                        {metric.label}
                                    </div>
                                    <div className={`text-sm font-bold ${metric.trend === "up" ? "text-emerald-400" :
                                        metric.trend === "down" ? "text-red-400" : "text-white"
                                        }`}>
                                        {metric.value}
                                        {metric.trend && (
                                            <span className="ml-1 text-[10px]">
                                                {metric.trend === "up" ? "↗" : "↘"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}

                {/* Central Summary Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-emerald-900/20 to-stone-900/20 
                               border border-emerald-500/30 rounded-lg p-6"
                >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg border border-emerald-500/30 bg-emerald-900/20 
                                          flex items-center justify-center">
                                <Activity className="w-8 h-8 text-emerald-400 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-wider">
                                    TỔNG_HỆ_THỐNG
                                </h3>
                                <p className="text-stone-500 text-xs">
                                    Bloomberg Terminal for Vietnamese Agriculture
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-8">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-emerald-400">
                                    {totalNodes.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-stone-500 tracking-wider">TỔNG_NODE</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">₫2.85B</div>
                                <div className="text-[10px] text-stone-500 tracking-wider">DÒNG_TIỀN</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-400">99.9%</div>
                                <div className="text-[10px] text-stone-500 tracking-wider">UPTIME</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-cyan-400">5/5</div>
                                <div className="text-[10px] text-stone-500 tracking-wider">NODE_ONLINE</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
