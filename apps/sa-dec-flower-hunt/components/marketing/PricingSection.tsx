"use client";

import { motion } from "framer-motion";
import { Check, Sprout, ShoppingBag, Building2 } from "lucide-react";

const PRICING_TIERS = [
    {
        id: "farmer",
        icon: Sprout,
        title: "NHÀ VƯỜN",
        color: "emerald",
        highlight: true,
        features: [
            { text: "Đăng ký", value: "MIỄN PHÍ" },
            { text: "Phí giao dịch", value: "5-8%" },
            { text: "Rút tiền", value: "24h" },
            { text: "Hỗ trợ", value: "24/7 Zalo" },
            { text: "AI Copilot", value: "✓ Có" },
        ]
    },
    {
        id: "buyer",
        icon: ShoppingBag,
        title: "NGƯỜI MUA",
        color: "cyan",
        highlight: false,
        features: [
            { text: "Đăng ký", value: "MIỄN PHÍ" },
            { text: "Giá sản phẩm", value: "Gốc +0%" },
            { text: "Phí ship", value: "Theo GHTK" },
            { text: "Bảo hiểm tươi", value: "2% (tuỳ chọn)" },
            { text: "Đổi trả", value: "7 ngày" },
        ]
    },
    {
        id: "partner",
        icon: Building2,
        title: "ĐỐI TÁC B2B",
        color: "amber",
        highlight: false,
        features: [
            { text: "Tích hợp API", value: "MIỄN PHÍ" },
            { text: "Hoa hồng", value: "1-2%" },
            { text: "Dữ liệu", value: "Real-time" },
            { text: "SLA", value: "99.9%" },
            { text: "Dedicated PM", value: "✓ Có" },
        ]
    },
];

export function PricingSection() {
    return (
        <section className="py-16">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-mono mb-2">
                        💰 BẢNG PHÍ MINH BẠCH
                    </p>
                    <h2 className="text-2xl font-light text-white">
                        Không có <span className="text-emerald-400 font-bold font-mono">PHÍ ẨN</span>
                    </h2>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {PRICING_TIERS.map((tier, i) => (
                        <motion.div
                            key={tier.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`
                                p-6 rounded-lg border transition-all
                                ${tier.highlight
                                    ? `bg-${tier.color}-950/30 border-${tier.color}-500/50`
                                    : 'bg-stone-950 border-stone-800'}
                            `}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-10 h-10 rounded-lg bg-${tier.color}-500/20 border border-${tier.color}-500/30 flex items-center justify-center`}>
                                    <tier.icon className={`w-5 h-5 text-${tier.color}-400`} />
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                    {tier.title}
                                </h3>
                                {tier.highlight && (
                                    <span className="ml-auto text-[9px] bg-emerald-500 text-black px-2 py-0.5 rounded font-bold">
                                        PHỔ BIẾN
                                    </span>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-3">
                                {tier.features.map((feature, j) => (
                                    <li key={j} className="flex items-center justify-between text-sm">
                                        <span className="text-stone-500">{feature.text}</span>
                                        <span className={`font-mono font-bold ${feature.value === "MIỄN PHÍ"
                                                ? "text-emerald-400"
                                                : feature.value.includes("✓")
                                                    ? "text-emerald-400"
                                                    : "text-white"
                                            }`}>
                                            {feature.value}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* Footer Note */}
                <p className="text-center text-[10px] text-stone-600 mt-6 max-w-md mx-auto">
                    Tất cả phí được hiển thị rõ ràng trước khi giao dịch. Không phụ thu.
                </p>
            </div>
        </section>
    );
}
