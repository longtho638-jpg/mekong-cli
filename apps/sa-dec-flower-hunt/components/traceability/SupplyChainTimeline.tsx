"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    CheckCircle,
    Clock,
    MapPin,
    User,
    Leaf,
    Package,
    Truck,
    Home,
    Shield,
    Loader2
} from "lucide-react";

interface JourneyEvent {
    event: string;
    event_type: string;
    location: string;
    actor: string;
    role: string;
    notes: string;
    timestamp: string;
    timeAgo: string;
}

interface SupplyChainData {
    success: boolean;
    mode: 'live' | 'demo';
    qr_code: string;
    journey: JourneyEvent[];
    verified?: boolean;
    certification?: string;
    message?: string;
}

const EVENT_ICONS: Record<string, any> = {
    'planted': Leaf,
    'growing': Leaf,
    'harvested': CheckCircle,
    'packed': Package,
    'quality_check': Shield,
    'shipped': Truck,
    'in_transit': Truck,
    'delivered': Home
};

export function SupplyChainTimeline({ qrCode }: { qrCode: string }) {
    const [data, setData] = useState<SupplyChainData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSupplyChain() {
            try {
                const response = await fetch(`/api/supply-chain?qr_code=${qrCode}`);
                const result = await response.json();

                if (result.success) {
                    setData(result);
                } else {
                    setError(result.error || 'Không thể tải dữ liệu');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (qrCode) {
            fetchSupplyChain();
        }
    }, [qrCode]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                <span className="ml-2 text-stone-400">Đang tải hành trình...</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="text-center p-8 text-red-400">
                <p>Không thể tải dữ liệu truy xuất nguồn gốc</p>
                <p className="text-sm text-stone-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-stone-950 border border-emerald-500/20 rounded-lg p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white">
                        🔍 Truy Xuất Nguồn Gốc
                    </h3>
                    <p className="text-xs text-stone-500 font-mono">
                        QR: {data.qr_code}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {data.mode === 'live' ? (
                        <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            VERIFIED
                        </span>
                    ) : (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                            DEMO DATA
                        </span>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <div className="relative space-y-4">
                {/* Vertical Line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-emerald-500/20" />

                {data.journey.map((event, index) => {
                    const Icon = EVENT_ICONS[event.event_type] || CheckCircle;
                    const isLast = index === data.journey.length - 1;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative pl-10"
                        >
                            {/* Icon */}
                            <div className={`
                                absolute left-0 w-8 h-8 rounded-full border-2 flex items-center justify-center
                                ${isLast
                                    ? 'bg-emerald-500 border-emerald-400 text-black'
                                    : 'bg-stone-900 border-emerald-500/50 text-emerald-400'}
                            `}>
                                <Icon className="w-4 h-4" />
                            </div>

                            {/* Content */}
                            <div className={`
                                bg-stone-900/50 border border-stone-800 rounded-lg p-4
                                ${isLast ? 'border-emerald-500/30' : ''}
                            `}>
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-bold text-white text-sm">
                                        {event.event}
                                    </h4>
                                    <span className="text-[10px] text-stone-500 font-mono">
                                        {event.timeAgo}
                                    </span>
                                </div>

                                <div className="space-y-1 text-xs text-stone-400">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>{event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        <span>{event.actor} ({event.role})</span>
                                    </div>
                                    {event.notes && (
                                        <p className="text-stone-500 italic mt-2">
                                            "{event.notes}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Footer */}
            {data.certification && (
                <div className="mt-6 pt-4 border-t border-stone-800 text-center">
                    <p className="text-[10px] text-stone-600 font-mono">
                        {data.certification}
                    </p>
                </div>
            )}

            {data.message && (
                <p className="mt-4 text-[10px] text-stone-600 text-center">
                    {data.message}
                </p>
            )}
        </div>
    );
}
