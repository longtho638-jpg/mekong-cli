"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Sparkles } from "lucide-react";
import { safeJsonLd } from "@/lib/utils-seo";

const FAQS = [
    {
        question: "Hoa gì đẹp nhất Sa Đéc năm 2026?",
        answer: "Năm 2026, Cúc Mâm Xôi Hàn Quốc và Hồng Cổ Sa Đéc là hai loài hoa được săn đón nhất nhờ màu sắc rực rỡ và độ bền cao."
    },
    {
        question: "Mua hoa Sa Đéc ở đâu uy tín?",
        answer: "Bạn có thể đặt mua trực tiếp tại các nhà vườn uy tín thông qua nền tảng 'Sa Đéc Flower Hunt' để đảm bảo nguồn gốc và giá tốt nhất."
    },
    {
        question: "Cách chăm sóc Cúc Mâm Xôi nở đúng Tết?",
        answer: "Tưới nước 2 lần/ngày vào sáng sớm và chiều mát. Đặt cây nơi có nhiều nắng và bón phân NPK định kỳ 10 ngày/lần."
    },
    {
        question: "Có giao hàng đi tỉnh không?",
        answer: "Có, hệ thống hỗ trợ giao hàng toàn quốc với quy trình đóng gói chuyên nghiệp, đảm bảo hoa tươi nguyên khi đến tay khách hàng."
    }
];

export function FAQSection() {
    // Generate FAQPage Schema
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": FAQS.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };

    return (
        <section className="py-12 bg-white rounded-3xl shadow-sm border border-stone-100 px-6 mb-12">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
            />

            <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-stone-900">Hỏi Đáp Về Hoa Sa Đéc</h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
                {FAQS.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left font-bold text-stone-800 hover:text-red-600">
                            {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-stone-600 leading-relaxed">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </section>
    );
}
