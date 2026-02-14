"use client";

import { motion } from "framer-motion";
import { Sprout, ShoppingBag, Building2, Package, Truck, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StakeholderCTABlocksProps {
    onOpenWizard: (role: "farmer" | "buyer" | "bank" | "supplier" | "logistics" | "research" | "government" | "media") => void;
}

const STAKEHOLDERS = [
    {
        id: "farmer" as const,
        icon: Sprout,
        title: "🌱 DÀNH CHO NHÀ VƯỜN",
        benefits: ["Marketing miễn phí", "Vận chuyển lo đủ", "Thu tiền tự động"],
        cta: "ĐĂNG KÝ BÁN HOA",
        color: "emerald",
        highlight: true
    },
    {
        id: "buyer" as const,
        icon: ShoppingBag,
        title: "🛒 DÀNH CHO NGƯỜI MUA",
        benefits: ["Giá tận gốc -30%", "Ship 24h tận nhà", "Bảo hành tươi 7 ngày"],
        cta: "MUA HOA NGAY",
        color: "cyan",
        highlight: false
    },
    {
        id: "bank" as const,
        icon: Building2,
        title: "🏦 DÀNH CHO NGÂN HÀNG",
        benefits: ["Data tín dụng real-time", "Nợ xấu <1%", "API tích hợp sẵn"],
        cta: "TRỞ THÀNH ĐỐI TÁC",
        color: "amber",
        highlight: false
    },
    {
        id: "supplier" as const,
        icon: Package,
        title: "📦 DÀNH CHO NHÀ CUNG CẤP",
        benefits: ["Đơn hàng ổn định", "Thanh toán đúng hạn", "Quản lý tồn kho"],
        cta: "BÁN VẬT TƯ",
        color: "purple",
        highlight: false
    },
    {
        id: "logistics" as const,
        icon: Truck,
        title: "🚚 DÀNH CHO SHIPPER",
        benefits: ["Route tối ưu", "Cold chain tracking", "Hoa hồng hấp dẫn"],
        cta: "ĐĂNG KÝ ĐỐI TÁC",
        color: "rose",
        highlight: false
    },
];

export function StakeholderCTABlocks({ onOpenWizard }: StakeholderCTABlocksProps) {
    return (
        <section className="py-16">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-mono mb-2">
                        📢 BẠN THUỘC NHÓM NÀO?
                    </p>
                    <h2 className="text-2xl font-light text-white">
                        Giải pháp cho <span className="text-emerald-400 font-bold font-mono">MỌI ĐỐI TƯỢNG</span>
                    </h2>
                </div>

                {/* CTA Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                    {STAKEHOLDERS.map((s, i) => (
                        <motion.div
                            key={s.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`
                                p-6 rounded-lg border transition-all cursor-pointer group
                                ${s.highlight
                                    ? 'bg-emerald-950/40 border-emerald-500/50 md:col-span-2 lg:col-span-1'
                                    : 'bg-stone-950 border-stone-800 hover:border-emerald-500/30'}
                            `}
                            onClick={() => onOpenWizard(s.id)}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-lg bg-${s.color}-500/20 border border-${s.color}-500/30 flex items-center justify-center`}>
                                    <s.icon className={`w-5 h-5 text-${s.color}-400`} />
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                    {s.title}
                                </h3>
                            </div>

                            <ul className="space-y-2 mb-6">
                                {s.benefits.map((benefit, j) => (
                                    <li key={j} className="flex items-center gap-2 text-sm text-stone-400">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                        {benefit}
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`w-full font-mono text-xs tracking-wider ${s.highlight
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                                    : 'bg-black border border-stone-700 text-stone-400 hover:border-emerald-500/50 hover:text-emerald-400'
                                    }`}
                            >
                                {s.cta}
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
