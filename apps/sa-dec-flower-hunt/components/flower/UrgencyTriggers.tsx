"use client";

import { useState, useEffect } from "react";
import { Users, AlertTriangle, Clock } from "lucide-react";
import { motion } from "framer-motion";

export function UrgencyTriggers({ stock }: { stock: number }) {
    // Random viewers between 5 and 15
    const [viewers, setViewers] = useState(0);

    useEffect(() => {
        setViewers(Math.floor(Math.random() * 10) + 5);
    }, []);

    if (viewers === 0) return null; // Wait for hydration

    return (
        <div className="space-y-3 py-4">
            {/* Live Viewers */}
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 w-fit px-3 py-1.5 rounded-full border border-rose-100"
            >
                <Users className="w-4 h-4 animate-pulse" />
                <span className="font-medium">{viewers} người đang xem sản phẩm này</span>
            </motion.div>

            {/* Low Stock Warning */}
            {stock < 20 && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                        Chỉ còn <span className="font-bold">{stock} sản phẩm</span> - Hết hàng sớm!
                    </span>
                </div>
            )}

            {/* Flash Sale Timer (Fake) */}
            <div className="flex items-center gap-2 text-xs text-stone-500">
                <Clock className="w-3 h-3" />
                <span>Ưu đãi kết thúc sau 4 giờ 30 phút</span>
            </div>
        </div>
    );
}
