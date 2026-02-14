"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    TrendingUp,
    Users,
    Star,
    ShoppingCart,
    DollarSign,
    Activity
} from "lucide-react";

interface LiveMetrics {
    orders_today: number;
    orders_week: number;
    total_revenue: number;
    revenue_today: number;
    revenue_week: number;
    total_farmers: number;
    active_farmers_week: number;
    platform_avg_rating: number;
    total_reviews: number;
    qr_scans_week: number;
}

export function LiveMetricCard({
    title,
    value,
    change,
    icon: Icon,
    color = "emerald"
}: {
    title: string;
    value: string | number;
    change?: string;
    icon: any;
    color?: "emerald" | "cyan" | "amber" | "purple";
}) {
    const [displayValue, setDisplayValue] = useState(0);
    const targetValue = typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.-]+/g, ''));

    useEffect(() => {
        if (isNaN(targetValue)) {
            setDisplayValue(0);
            return;
        }

        const duration = 1000; // 1 second
        const steps = 60;
        const increment = targetValue / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= targetValue) {
                setDisplayValue(targetValue);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [targetValue]);

    const colorClasses = {
        emerald: {
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/30",
            icon: "text-emerald-400",
            text: "text-emerald-500"
        },
        cyan: {
            bg: "bg-cyan-500/10",
            border: "border-cyan-500/30",
            icon: "text-cyan-400",
            text: "text-cyan-500"
        },
        amber: {
            bg: "bg-amber-500/10",
            border: "border-amber-500/30",
            icon: "text-amber-400",
            text: "text-amber-500"
        },
        purple: {
            bg: "bg-purple-500/10",
            border: "border-purple-500/30",
            icon: "text-purple-400",
            text: "text-purple-500"
        }
    };

    const colors = colorClasses[color];

    return (
        <motion.div
            className={`${colors.bg} border ${colors.border} rounded-sm p-6 backdrop-blur-sm`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${colors.bg} rounded flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                {change && (
                    <div className={`text-xs font-bold ${colors.text} flex items-center gap-1`}>
                        <TrendingUp className="w-3 h-3" />
                        {change}
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <div className={`text-3xl font-bold ${colors.text}`}>
                    {typeof value === 'number' ? displayValue.toLocaleString() : value}
                </div>
                <div className="text-sm text-stone-400 uppercase tracking-wider">
                    {title}
                </div>
            </div>
        </motion.div>
    );
}
