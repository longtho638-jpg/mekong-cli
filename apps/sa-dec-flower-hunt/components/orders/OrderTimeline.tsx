"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Package, Truck, MapPin, Star, Clock } from "lucide-react";

interface TimelineEntry {
    id: string;
    status: string;
    previousStatus: string | null;
    note: string | null;
    changedBy: string;
    changedByRole: string;
    timestamp: string;
}

interface OrderTimelineProps {
    orderId: string;
}

const statusConfig: Record<string, { icon: any; label: string; color: string }> = {
    pending: { icon: Clock, label: "Chờ xử lý", color: "text-stone-500" },
    paid: { icon: CheckCircle, label: "Đã thanh toán", color: "text-emerald-500" },
    confirmed: { icon: CheckCircle, label: "Đã xác nhận", color: "text-emerald-500" },
    preparing: { icon: Package, label: "Đang chuẩn bị", color: "text-cyan-500" },
    shipped: { icon: Truck, label: "Đang vận chuyển", color: "text-blue-500" },
    delivered: { icon: MapPin, label: "Đã giao hàng", color: "text-purple-500" },
    completed: { icon: Star, label: "Hoàn thành", color: "text-amber-500" },
    cancelled: { icon: CheckCircle, label: "Đã hủy", color: "text-red-500" },
    disputed: { icon: CheckCircle, label: "Tranh chấp", color: "text-orange-500" },
};

export function OrderTimeline({ orderId }: OrderTimelineProps) {
    const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTimeline();
    }, [orderId]);

    const fetchTimeline = async () => {
        try {
            const response = await fetch(`/api/orders/${orderId}/timeline`);
            const data = await response.json();
            if (data.timeline) {
                setTimeline(data.timeline);
            }
        } catch (error) {
            console.error("Failed to fetch timeline:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-10 h-10 bg-stone-800 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-stone-800 rounded w-1/3" />
                            <div className="h-3 bg-stone-800 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-stone-800" />

            {/* Timeline entries */}
            <div className="space-y-6">
                {timeline.map((entry, index) => {
                    const config = statusConfig[entry.status] || statusConfig.pending;
                    const Icon = config.icon;
                    const isCurrent = index === timeline.length - 1;

                    return (
                        <motion.div
                            key={entry.id}
                            className="relative flex gap-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            {/* Icon */}
                            <div className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center 
                ${isCurrent ? 'border-emerald-500 bg-emerald-900/30' : 'border-stone-700 bg-stone-900'}`}
                            >
                                <Icon className={`w-5 h-5 ${isCurrent ? 'text-emerald-400' : config.color}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-6">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className={`font-bold ${isCurrent ? 'text-white' : 'text-stone-400'}`}>
                                        {config.label}
                                    </h4>
                                    <span className="text-xs text-stone-500">
                                        {new Date(entry.timestamp).toLocaleString('vi-VN')}
                                    </span>
                                </div>

                                {entry.note && (
                                    <p className="text-sm text-stone-500 mb-2">{entry.note}</p>
                                )}

                                <div className="text-xs text-stone-600">
                                    Bởi: {entry.changedBy} ({entry.changedByRole})
                                </div>

                                {isCurrent && (
                                    <motion.div
                                        className="mt-2 inline-block px-2 py-1 bg-emerald-900/30 border border-emerald-500/30 rounded text-xs text-emerald-400"
                                        initial={{ scale: 0.9 }}
                                        animate={{ scale: 1 }}
                                        transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
                                    >
                                        Trạng thái hiện tại
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
