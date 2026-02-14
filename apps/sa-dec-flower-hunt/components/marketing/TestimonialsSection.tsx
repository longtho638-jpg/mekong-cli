"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Sprout, ShoppingBag, Building2, Package, Truck } from "lucide-react";

const TESTIMONIALS = [
    {
        id: "farmer",
        icon: Sprout,
        name: "Anh Nguyễn Văn Tâm",
        role: "Nhà Vườn - Sa Đéc",
        content: "Trước đây bán hoa phải tự đi giao, giờ chỉ cần đăng lên app là có người đến lấy. Doanh thu tăng 40% mà nhẹ đầu hơn nhiều!",
        color: "emerald"
    },
    {
        id: "buyer",
        icon: ShoppingBag,
        name: "Chị Trần Thị Mai",
        role: "Khách hàng - TP.HCM",
        content: "Mua hoa tận gốc giá rẻ hơn 30% so với chợ Hồ Thị Kỷ, ship 24h là đến. Hoa tươi như vừa cắt!",
        color: "cyan"
    },
    {
        id: "bank",
        icon: Building2,
        name: "Ông Lê Minh Đức",
        role: "Giám đốc CN - Agribank Đồng Tháp",
        content: "Dữ liệu từ nền tảng giúp chúng tôi đánh giá tín dụng chính xác hơn. Nợ xấu giảm từ 5% xuống dưới 1%.",
        color: "amber"
    },
    {
        id: "supplier",
        icon: Package,
        name: "Anh Phạm Hoàng Long",
        role: "NCC Phân bón - Cần Thơ",
        content: "Đơn hàng từ nông dân trên nền tảng ổn định hàng tháng. Không cần đi sales như trước nữa.",
        color: "purple"
    },
    {
        id: "logistics",
        icon: Truck,
        name: "Chị Võ Thị Hương",
        role: "Đối tác Vận chuyển - GHTK",
        content: "Cold chain tracking giúp giảm hư hỏng từ 15% xuống 2%. Khách hàng hài lòng hơn nhiều.",
        color: "rose"
    }
];

export function TestimonialsSection() {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % TESTIMONIALS.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const activeTestimonial = TESTIMONIALS[activeIndex];

    return (
        <section className="py-16">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-mono mb-2">
                        💬 TIẾNG NÓI TỪ CHUỖI GIÁ TRỊ
                    </p>
                    <h2 className="text-2xl font-light text-white">
                        Họ nói gì về <span className="text-emerald-400 font-bold font-mono">AGRIOS.tech</span>
                    </h2>
                </div>

                {/* Testimonial Tabs */}
                <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
                    {TESTIMONIALS.map((t, i) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveIndex(i)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-full border transition-all
                                ${i === activeIndex
                                    ? `bg-${t.color}-500/20 border-${t.color}-500/50 text-${t.color}-400`
                                    : 'bg-black/40 border-stone-800 text-stone-500 hover:border-stone-600'}
                            `}
                        >
                            <t.icon className="w-4 h-4" />
                            <span className="text-xs font-mono uppercase">{t.role.split(' - ')[0]}</span>
                        </button>
                    ))}
                </div>

                {/* Active Testimonial Card */}
                <div className="max-w-2xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTestimonial.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-stone-950 border border-emerald-500/20 rounded-lg p-8 text-center"
                        >
                            <Quote className="w-8 h-8 text-emerald-500/30 mx-auto mb-4" />
                            <p className="text-lg text-stone-300 mb-6 leading-relaxed">
                                "{activeTestimonial.content}"
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                    <activeTestimonial.icon className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="text-left">
                                    <div className="text-white font-bold text-sm">{activeTestimonial.name}</div>
                                    <div className="text-stone-500 text-xs">{activeTestimonial.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Dots Indicator */}
                <div className="flex items-center justify-center gap-2 mt-6">
                    {TESTIMONIALS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? 'bg-emerald-500 w-6' : 'bg-stone-700'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
