"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UrgencyBannerProps {
    onOpenWizard?: () => void;
}

export function UrgencyBanner({ onOpenWizard }: UrgencyBannerProps) {
    const [timeLeft, setTimeLeft] = useState({
        days: 2,
        hours: 14,
        minutes: 37,
        seconds: 0
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                let { days, hours, minutes, seconds } = prev;

                if (seconds > 0) {
                    seconds--;
                } else if (minutes > 0) {
                    minutes--;
                    seconds = 59;
                } else if (hours > 0) {
                    hours--;
                    minutes = 59;
                    seconds = 59;
                } else if (days > 0) {
                    days--;
                    hours = 23;
                    minutes = 59;
                    seconds = 59;
                }

                return { days, hours, minutes, seconds };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatNumber = (n: number) => n.toString().padStart(2, "0");

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8"
        >
            <div className="container mx-auto px-6">
                <div className="bg-gradient-to-r from-orange-950/50 via-red-950/50 to-orange-950/50 border border-orange-500/30 rounded-lg p-6 text-center relative overflow-hidden">
                    {/* Animated background glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/10 to-orange-500/5 animate-pulse" />

                    {/* Content */}
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                                Ưu đãi có hạn
                            </span>
                            <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                        </div>

                        {/* Main Message */}
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
                            CHỈ CÒN <span className="text-orange-400">3 SUẤT</span> MIỄN PHÍ ONBOARDING!
                        </h3>

                        {/* Countdown */}
                        <div className="flex justify-center items-center gap-4 mb-6">
                            {[
                                { value: timeLeft.days, label: "Ngày" },
                                { value: timeLeft.hours, label: "Giờ" },
                                { value: timeLeft.minutes, label: "Phút" },
                                { value: timeLeft.seconds, label: "Giây" },
                            ].map((unit, i) => (
                                <div key={unit.label} className="text-center">
                                    <div className="bg-black border border-orange-500/30 px-3 py-2 rounded-lg mb-1">
                                        <span className="text-2xl md:text-3xl font-mono font-bold text-white">
                                            {formatNumber(unit.value)}
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-stone-500 uppercase">{unit.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <Button
                            onClick={onOpenWizard}
                            className="bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm px-8"
                        >
                            ĐĂNG KÝ NGAY
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>

                        {/* Subtext */}
                        <p className="text-[10px] text-stone-500 mt-4">
                            * Chương trình khuyến mãi - số lượng có thể thay đổi
                        </p>
                        <p className="text-[9px] text-stone-600">
                            [Demo countdown - không phải offer thực]
                        </p>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
