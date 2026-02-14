"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
    {
        q: "Chi phí như thế nào?",
        a: "Đăng ký MIỄN PHÍ. Chúng tôi chỉ thu phí 5-10% trên mỗi đơn hàng thành công. Không đơn = Không phí."
    },
    {
        q: "Làm sao nhận tiền?",
        a: "Tiền được chuyển vào tài khoản ngân hàng của bạn trong vòng 24-48h sau khi đơn hàng hoàn tất. Đối soát minh bạch qua app."
    },
    {
        q: "Vận chuyển có đảm bảo không?",
        a: "Có! Chúng tôi sử dụng cold chain (xe lạnh) để giữ hoa tươi. Nếu hư hỏng do vận chuyển, chúng tôi bồi hoàn 100%."
    },
    {
        q: "Tôi cần chuẩn bị gì để bắt đầu?",
        a: "Chỉ cần: (1) Điện thoại có Zalo, (2) Ảnh vườn hoa, (3) CMND/CCCD. Đăng ký 5 phút, bắt đầu bán hoa trong 24h."
    },
    {
        q: "Có hỗ trợ kỹ thuật không?",
        a: "Có! Đội ngũ hỗ trợ 24/7 qua Zalo. Ngoài ra có AI Copilot tự động trả lời 80% câu hỏi thường gặp."
    },
    {
        q: "Tại sao chọn Sa Đéc Flower Hunt?",
        a: "Chúng tôi là nền tảng DUY NHẤT kết nối đầy đủ 5 bên: Nhà vườn - Người mua - Ngân hàng - Nhà cung cấp - Vận chuyển. Hệ sinh thái hoàn chỉnh = Lợi nhuận tối đa."
    }
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-16 border-t border-emerald-500/10">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-mono mb-2">
                        ❓ CÂU HỎI THƯỜNG GẶP
                    </p>
                    <h2 className="text-2xl font-light text-white">
                        Giải đáp <span className="text-emerald-400 font-bold font-mono">THẮC MẮC</span>
                    </h2>
                </div>

                {/* FAQ Accordion */}
                <div className="max-w-2xl mx-auto space-y-3">
                    {FAQS.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-stone-950 border border-stone-800 rounded-lg overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-900/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <HelpCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    <span className="text-sm text-white font-medium">{faq.q}</span>
                                </div>
                                <ChevronDown
                                    className={`w-4 h-4 text-stone-500 transition-transform ${openIndex === i ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4 pt-0">
                                            <div className="pl-7 text-sm text-stone-400 leading-relaxed">
                                                {faq.a}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
