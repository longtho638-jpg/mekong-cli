"use client";

import { motion } from "framer-motion";
import { Landmark, Award, FileCheck, Users, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GovernmentSectionProps {
    onOpenWizard?: (role: "government") => void;
}

const PROGRAMS = [
    {
        name: "OCOP",
        fullName: "Mỗi Xã Một Sản Phẩm",
        status: "Đạt tiêu chuẩn 4★",
        icon: Award,
        color: "amber"
    },
    {
        name: "Nông Thôn Mới",
        fullName: "Chương trình Quốc gia",
        status: "Pilot Program",
        icon: Users,
        color: "emerald"
    },
    {
        name: "Chuyển Đổi Số",
        fullName: "Nông nghiệp 4.0",
        status: "Official Partner",
        icon: FileCheck,
        color: "cyan"
    }
];

const PARTNERS = [
    { name: "UNDP", logo: "🇺🇳" },
    { name: "GIZ", logo: "🇩🇪" },
    { name: "USAID", logo: "🇺🇸" },
    { name: "World Bank", logo: "🌍" },
    { name: "Bộ NN&PTNT", logo: "🌾" },
];

export function GovernmentSection({ onOpenWizard }: GovernmentSectionProps) {
    return (
        <section className="py-16">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-mono mb-2">
                        🏛️ HỢP TÁC CHÍNH PHỦ & TỔ CHỨC
                    </p>
                    <h2 className="text-2xl font-light text-white">
                        Đang <span className="text-emerald-400 font-bold font-mono">ĐĂNG KÝ</span> tham gia
                    </h2>
                    <p className="text-[10px] text-stone-600 mt-2">[Chương trình mục tiêu - đang triển khai]</p>
                </div>

                {/* Government Programs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
                    {PROGRAMS.map((program, i) => (
                        <motion.div
                            key={program.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-stone-950 border border-emerald-500/20 rounded-lg p-6 text-center hover:border-emerald-500/50 transition-all"
                        >
                            <div className={`w-12 h-12 mx-auto mb-4 bg-${program.color}-500/10 border border-${program.color}-500/30 rounded-lg flex items-center justify-center`}>
                                <program.icon className={`w-6 h-6 text-${program.color}-400`} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">{program.name}</h3>
                            <p className="text-[10px] text-stone-500 mb-2">{program.fullName}</p>
                            <span className="inline-block text-[9px] font-mono px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">
                                ✓ {program.status}
                            </span>
                        </motion.div>
                    ))}
                </div>

                {/* Partner Logos */}
                <div className="flex justify-center items-center gap-6 flex-wrap mb-8">
                    {PARTNERS.map((partner) => (
                        <div
                            key={partner.name}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-900/50 border border-stone-800 rounded-lg"
                        >
                            <span className="text-xl">{partner.logo}</span>
                            <span className="text-xs text-stone-400 font-mono">{partner.name}</span>
                        </div>
                    ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        variant="outline"
                        className="border-stone-700 text-stone-400 hover:bg-stone-900"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Tải Hồ Sơ Năng Lực
                    </Button>
                    <Button
                        onClick={() => onOpenWizard?.("government")}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                    >
                        <Landmark className="w-4 h-4 mr-2" />
                        Liên Hệ Hợp Tác
                    </Button>
                </div>
            </div>
        </section>
    );
}
