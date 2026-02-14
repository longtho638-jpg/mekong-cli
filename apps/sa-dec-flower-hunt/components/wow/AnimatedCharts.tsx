"use client";

// ============================================================================
// ANIMATED CHARTS - Dashboard Data Visualization
// ============================================================================
// Beautiful animated charts with spring physics
// ============================================================================

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Flower2, Users, ShoppingCart, Coins } from "lucide-react";

interface AnimatedNumberProps {
    value: number;
    suffix?: string;
    prefix?: string;
    className?: string;
}

export function AnimatedNumber({ value, suffix = "", prefix = "", className }: AnimatedNumberProps) {
    const spring = useSpring(0, { stiffness: 50, damping: 15 });
    const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return (
        <motion.span className={className}>
            {prefix}
            <motion.span>{display}</motion.span>
            {suffix}
        </motion.span>
    );
}

interface ProgressRingProps {
    value: number;
    max: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
    icon?: React.ReactNode;
}

export function ProgressRing({
    value,
    max,
    size = 120,
    strokeWidth = 8,
    color = "#10b981",
    label,
    icon,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const percent = (value / max) * 100;

    return (
        <div className="relative flex flex-col items-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-stone-800"
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - (percent / 100) * circumference }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {icon && <div className="mb-1" style={{ color }}>{icon}</div>}
                <span className="text-2xl font-bold text-white">{Math.round(percent)}%</span>
            </div>
            {label && <span className="mt-2 text-sm text-stone-400">{label}</span>}
        </div>
    );
}

interface BarChartProps {
    data: { label: string; value: number; color?: string }[];
    maxValue?: number;
    className?: string;
}

export function AnimatedBarChart({ data, maxValue, className }: BarChartProps) {
    const max = maxValue || Math.max(...data.map((d) => d.value));

    return (
        <div className={cn("space-y-4", className)}>
            {data.map((item, i) => (
                <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-stone-400">{item.label}</span>
                        <AnimatedNumber value={item.value} className="text-white font-medium" />
                    </div>
                    <div className="h-3 bg-stone-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{
                                backgroundColor: item.color || "#10b981",
                                boxShadow: `0 0 10px ${item.color || "#10b981"}50`,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.value / max) * 100}%` }}
                            transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: number;
    suffix?: string;
    prefix?: string;
    change?: number;
    icon: React.ReactNode;
    color?: string;
}

export function StatCard({ title, value, suffix, prefix, change, icon, color = "#10b981" }: StatCardProps) {
    const isPositive = change && change >= 0;

    return (
        <motion.div
            className="relative p-6 bg-stone-900/50 backdrop-blur-sm border border-stone-800 rounded-2xl overflow-hidden group"
            whileHover={{ scale: 1.02, borderColor: color }}
            transition={{ type: "spring", stiffness: 300 }}
        >
            {/* Glow effect */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                style={{ background: `radial-gradient(circle at center, ${color}, transparent 70%)` }}
            />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: `${color}20`, color }}
                    >
                        {icon}
                    </div>
                    {change !== undefined && (
                        <div
                            className={cn(
                                "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
                                isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                            )}
                        >
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(change)}%
                        </div>
                    )}
                </div>

                <p className="text-stone-500 text-sm mb-1">{title}</p>
                <AnimatedNumber
                    value={value}
                    prefix={prefix}
                    suffix={suffix}
                    className="text-3xl font-bold text-white"
                />
            </div>
        </motion.div>
    );
}

// Dashboard Demo Component
export function ChartsDashboard({ className }: { className?: string }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const barData = [
        { label: "Mai Vàng", value: 1250, color: "#facc15" },
        { label: "Lan Hồ Điệp", value: 890, color: "#a855f7" },
        { label: "Hoa Hồng", value: 1100, color: "#f43f5e" },
        { label: "Cúc Họa Mi", value: 650, color: "#f97316" },
        { label: "Hoa Sen", value: 420, color: "#ec4899" },
    ];

    return (
        <div className={cn("space-y-8 p-6", className)}>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng Doanh Thu"
                    value={125000000}
                    prefix="₫"
                    change={12.5}
                    icon={<Coins className="w-5 h-5" />}
                    color="#10b981"
                />
                <StatCard
                    title="Đơn Hàng"
                    value={1847}
                    change={8.2}
                    icon={<ShoppingCart className="w-5 h-5" />}
                    color="#3b82f6"
                />
                <StatCard
                    title="Khách Hàng"
                    value={3256}
                    change={15.3}
                    icon={<Users className="w-5 h-5" />}
                    color="#8b5cf6"
                />
                <StatCard
                    title="Hoa Bán Được"
                    value={8923}
                    change={-2.1}
                    icon={<Flower2 className="w-5 h-5" />}
                    color="#f43f5e"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="p-6 bg-stone-900/50 backdrop-blur-sm border border-stone-800 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Top Hoa Bán Chạy</h3>
                    <AnimatedBarChart data={barData} />
                </div>

                {/* Progress Rings */}
                <div className="p-6 bg-stone-900/50 backdrop-blur-sm border border-stone-800 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Mục Tiêu Tháng</h3>
                    <div className="flex justify-around items-center">
                        <ProgressRing
                            value={78}
                            max={100}
                            color="#10b981"
                            label="Doanh thu"
                            icon={<Coins className="w-5 h-5" />}
                        />
                        <ProgressRing
                            value={92}
                            max={100}
                            color="#3b82f6"
                            label="Đơn hàng"
                            icon={<ShoppingCart className="w-5 h-5" />}
                        />
                        <ProgressRing
                            value={65}
                            max={100}
                            color="#f43f5e"
                            label="Khách mới"
                            icon={<Users className="w-5 h-5" />}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChartsDashboard;
