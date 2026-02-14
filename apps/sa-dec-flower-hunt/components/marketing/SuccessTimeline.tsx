"use client";

import { motion } from "framer-motion";
import { UserPlus, Upload, Clock, ShoppingBag, Wallet, CheckCircle } from "lucide-react";

const STEPS = [
    {
        id: 1,
        icon: UserPlus,
        title: "Đăng Ký",
        duration: "5 phút",
        description: "Tạo tài khoản miễn phí"
    },
    {
        id: 2,
        icon: Upload,
        title: "Upload Sản Phẩm",
        duration: "15 phút",
        description: "Chụp ảnh, nhập giá"
    },
    {
        id: 3,
        icon: Clock,
        title: "Chờ Duyệt",
        duration: "~2 giờ",
        description: "Admin xét duyệt thủ công"
    },
    {
        id: 4,
        icon: ShoppingBag,
        title: "Đơn Đầu Tiên",
        duration: "1-3 ngày",
        description: "Nhận đơn hàng online"
    },
    {
        id: 5,
        icon: Wallet,
        title: "Thu Nhập",
        duration: "24h",
        description: "Tiền về tài khoản"
    },
];

export function SuccessTimeline() {
    return (
        <section className="py-16">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-mono mb-2">
                        🚀 HÀNH TRÌNH THÀNH CÔNG
                    </p>
                    <h2 className="text-2xl font-light text-white">
                        Từ <span className="text-emerald-400 font-mono">Đăng Ký</span> đến <span className="text-emerald-400 font-mono">Thu Nhập</span>
                    </h2>
                </div>

                {/* Timeline */}
                <div className="max-w-4xl mx-auto">
                    {/* Desktop Timeline */}
                    <div className="hidden md:block relative">
                        {/* Line */}
                        <div className="absolute top-8 left-0 right-0 h-0.5 bg-stone-800">
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                className="h-full bg-emerald-500"
                            />
                        </div>

                        {/* Steps */}
                        <div className="flex justify-between relative">
                            {STEPS.map((step, i) => (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.2 }}
                                    className="flex flex-col items-center text-center w-1/5"
                                >
                                    <div className={`
                                        w-16 h-16 rounded-full border-2 flex items-center justify-center mb-4 z-10
                                        ${i === STEPS.length - 1
                                            ? "bg-emerald-500 border-emerald-400"
                                            : "bg-stone-950 border-emerald-500/50"}
                                    `}>
                                        <step.icon className={`w-6 h-6 ${i === STEPS.length - 1 ? "text-black" : "text-emerald-400"}`} />
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-1">{step.title}</h3>
                                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded mb-2">
                                        {step.duration}
                                    </span>
                                    <p className="text-[10px] text-stone-500">{step.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Timeline (Vertical) */}
                    <div className="md:hidden space-y-4">
                        {STEPS.map((step, i) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-4"
                            >
                                <div className={`
                                    w-12 h-12 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                                    ${i === STEPS.length - 1
                                        ? "bg-emerald-500 border-emerald-400"
                                        : "bg-stone-950 border-emerald-500/50"}
                                `}>
                                    <step.icon className={`w-5 h-5 ${i === STEPS.length - 1 ? "text-black" : "text-emerald-400"}`} />
                                </div>
                                <div className="flex-1 pb-4 border-b border-stone-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-sm font-bold text-white">{step.title}</h3>
                                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                            {step.duration}
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-500">{step.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
