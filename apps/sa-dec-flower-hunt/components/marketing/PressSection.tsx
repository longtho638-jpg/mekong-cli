"use client";

import { motion } from "framer-motion";
import { Newspaper, Download, Camera, Phone, ExternalLink, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PressSectionProps {
    onOpenWizard?: (role: "media") => void;
}

const MEDIA_LOGOS = [
    { name: "VTV", icon: "📺" },
    { name: "VnExpress", icon: "📰" },
    { name: "Tuổi Trẻ", icon: "📖" },
    { name: "Dân Trí", icon: "📱" },
    { name: "Thanh Niên", icon: "🗞️" },
    { name: "Bloomberg", icon: "💹" },
];

const PRESS_QUOTE = {
    quote: "Nền tảng số hóa chuỗi cung ứng hoa kiểng đầu tiên tại Việt Nam, kết nối trực tiếp nhà vườn Sa Đéc với thị trường toàn quốc.",
    source: "Tầm nhìn AGRIOS.tech",
    date: "Vision Statement"
};

export function PressSection({ onOpenWizard }: PressSectionProps) {
    return (
        <section className="py-16 bg-gradient-to-b from-transparent via-stone-950/50 to-transparent">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-mono mb-2">
                        📰 BÁO CHÍ & TRUYỀN THÔNG
                    </p>
                    <h2 className="text-2xl font-light text-white">
                        Media <span className="text-emerald-400 font-bold font-mono">MỤC TIÊU</span>
                    </h2>
                    <p className="text-[10px] text-stone-600 mt-2">[Đang tiếp cận - chưa có bài viết chính thức]</p>
                </div>

                {/* Media Logos */}
                <div className="flex justify-center items-center gap-4 flex-wrap mb-10">
                    {MEDIA_LOGOS.map((media, i) => (
                        <motion.div
                            key={media.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-2 px-4 py-2 bg-black border border-stone-800 rounded-lg hover:border-emerald-500/30 transition-colors cursor-pointer"
                        >
                            <span className="text-lg">{media.icon}</span>
                            <span className="text-xs text-stone-400 font-mono">{media.name}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Featured Quote */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl mx-auto mb-10"
                >
                    <div className="bg-stone-950 border border-emerald-500/20 rounded-lg p-6 relative">
                        <Quote className="absolute top-4 left-4 w-6 h-6 text-emerald-500/30" />
                        <blockquote className="text-center">
                            <p className="text-white italic mb-4 px-8">
                                "{PRESS_QUOTE.quote}"
                            </p>
                            <footer className="text-sm">
                                <cite className="not-italic text-emerald-400 font-mono">
                                    — {PRESS_QUOTE.source}
                                </cite>
                                <span className="text-stone-600 ml-2">
                                    {PRESS_QUOTE.date}
                                </span>
                            </footer>
                        </blockquote>
                    </div>
                </motion.div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/assets/press-kit.md" download="AGRIOS_Press_Kit.md">
                        <Button
                            variant="outline"
                            className="border-stone-700 text-stone-400 hover:bg-stone-900 w-full"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Press Kit (MD)
                        </Button>
                    </a>
                    <a href="/assets/brand-assets.md" download="AGRIOS_Brand_Assets.md">
                        <Button
                            variant="outline"
                            className="border-stone-700 text-stone-400 hover:bg-stone-900 w-full"
                        >
                            <Camera className="w-4 h-4 mr-2" />
                            Brand Assets
                        </Button>
                    </a>
                    <Button
                        onClick={() => onOpenWizard?.("media")}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                    >
                        <Newspaper className="w-4 h-4 mr-2" />
                        Liên Hệ Phóng Viên
                    </Button>
                </div>
            </div>
        </section>
    );
}
