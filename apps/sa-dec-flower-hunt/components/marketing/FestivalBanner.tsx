"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flower2, ArrowRight, X } from "lucide-react";
import Link from "next/link";

export function FestivalBanner() {
    const [isVisible, setIsVisible] = useState(true);
    const [daysLeft, setDaysLeft] = useState(0);

    useEffect(() => {
        // Calculate days until festival (Dec 27, 2025)
        const festivalDate = new Date("2025-12-27");
        const today = new Date();
        const diff = Math.ceil((festivalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        setDaysLeft(Math.max(0, diff));
    }, []);

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 border-b border-rose-500/50"
        >
            <div className="container mx-auto px-6 py-2 flex items-center justify-between">
                <Link href="/festival" className="flex items-center gap-3 group flex-1">
                    <div className="flex items-center gap-2">
                        <Flower2 className="w-4 h-4 text-white animate-bounce" />
                        <span className="text-white text-xs font-bold uppercase tracking-wider">
                            🎊 Lễ Hội Hoa Sa Đéc 2025
                        </span>
                    </div>
                    <span className="text-rose-200 text-xs hidden sm:inline">
                        — Còn <span className="font-bold text-white">{daysLeft} ngày</span>
                    </span>
                    <span className="text-white text-xs font-bold flex items-center gap-1 ml-auto group-hover:underline">
                        XEM NGAY
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                </Link>
                <button
                    onClick={() => setIsVisible(false)}
                    className="ml-4 text-white/60 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
