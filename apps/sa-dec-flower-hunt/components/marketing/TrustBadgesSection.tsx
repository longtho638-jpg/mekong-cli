"use client";

import { motion } from "framer-motion";
import { Award, Users, TrendingUp, Building2 } from "lucide-react";

const STATS = [
    { icon: Users, value: "47+", label: "Nhà Vườn", color: "emerald" },
    { icon: TrendingUp, value: "₫2.4B", label: "GMV", color: "cyan" },
    { icon: Award, value: "1,402", label: "Active Nodes", color: "amber" },
    { icon: Building2, value: "5", label: "Đối Tác NH", color: "purple" },
];

const MEDIA_LOGOS = [
    { name: "VTV", url: "#" },
    { name: "VnExpress", url: "#" },
    { name: "Tuổi Trẻ", url: "#" },
    { name: "Báo Đồng Tháp", url: "#" },
];

export function TrustBadgesSection() {
    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="py-12 border-y border-emerald-500/10"
        >
            <div className="container mx-auto px-6">
                {/* Media Logos */}
                <div className="text-center mb-8">
                    <p className="text-[10px] text-stone-600 uppercase tracking-widest font-mono mb-4">
                        📺 Như đã xuất hiện trên
                    </p>
                    <div className="flex items-center justify-center gap-8 flex-wrap">
                        {MEDIA_LOGOS.map((logo, i) => (
                            <motion.div
                                key={logo.name}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 + i * 0.1 }}
                                className="px-4 py-2 bg-stone-900/50 border border-stone-800 rounded text-stone-500 text-xs font-mono hover:border-emerald-500/30 hover:text-emerald-400 transition-colors cursor-pointer"
                            >
                                {logo.name}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                    {STATS.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="text-center p-4 bg-black/40 border border-emerald-500/10 rounded-lg"
                        >
                            <stat.icon className={`w-5 h-5 mx-auto mb-2 text-${stat.color}-500`} />
                            <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
                            <div className="text-[10px] text-stone-500 uppercase tracking-wider">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
}
