"use client";

import { motion } from "framer-motion";
import { Check, X, TrendingUp } from "lucide-react";

const COMPARISON_DATA = [
    {
        feature: "Thời gian giao hàng",
        traditional: "3-5 ngày",
        sadec: "1-2 ngày*",
        improvement: "50%+ nhanh",
    },
    {
        feature: "Phí trung gian",
        traditional: "30-40%",
        sadec: "~10%*",
        improvement: "Tiết kiệm",
    },
    {
        feature: "Thanh toán",
        traditional: "15-30 ngày",
        sadec: "24-48h",
        improvement: "Nhanh hơn",
    },
    {
        feature: "Cold Chain",
        traditional: "Không có",
        sadec: "[Mục tiêu]*",
        improvement: "Planned",
    },
    {
        feature: "AI Pricing",
        traditional: "Thủ công",
        sadec: "Hỗ trợ AI",
        improvement: "Có AI",
    },
    {
        feature: "Truy xuất nguồn gốc",
        traditional: "Không",
        sadec: "QR Profile",
        improvement: "Cơ bản",
    },
];

export function ComparisonTable() {
    return (
        <section className="py-16">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-mono mb-2">
                        🔍 SO SÁNH MỤC TIÊU
                    </p>
                    <h2 className="text-2xl font-light text-white">
                        AGRIOS.tech vs <span className="text-stone-500 font-mono">Truyền Thống</span>
                    </h2>
                    <p className="text-[9px] text-stone-600 mt-2">[Giá trị mục tiêu - đang triển khai]</p>
                </div>

                {/* Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-3xl mx-auto overflow-hidden rounded-lg border border-emerald-500/20"
                >
                    {/* Header Row */}
                    <div className="grid grid-cols-4 bg-stone-950 border-b border-emerald-500/20">
                        <div className="p-4 text-xs text-stone-400 uppercase tracking-wider">Feature</div>
                        <div className="p-4 text-xs text-stone-500 uppercase tracking-wider text-center">Truyền Thống</div>
                        <div className="p-4 text-xs text-emerald-400 uppercase tracking-wider text-center font-bold">AGRIOS.tech</div>
                        <div className="p-4 text-xs text-emerald-400 uppercase tracking-wider text-center">Lợi Ích</div>
                    </div>

                    {/* Data Rows */}
                    {COMPARISON_DATA.map((row, i) => (
                        <motion.div
                            key={row.feature}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`grid grid-cols-4 ${i % 2 === 0 ? "bg-black" : "bg-stone-950/50"} border-b border-stone-800/50 hover:bg-emerald-950/20 transition-colors`}
                        >
                            <div className="p-4 text-sm text-white">{row.feature}</div>
                            <div className="p-4 text-sm text-stone-500 text-center flex items-center justify-center gap-1">
                                <X className="w-3 h-3 text-red-500/50" />
                                {row.traditional}
                            </div>
                            <div className="p-4 text-sm text-emerald-400 text-center font-mono font-bold flex items-center justify-center gap-1">
                                <Check className="w-3 h-3 text-emerald-500" />
                                {row.sadec}
                            </div>
                            <div className="p-4 text-[10px] text-emerald-400/70 text-center font-mono flex items-center justify-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {row.improvement}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
