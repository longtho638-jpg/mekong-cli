"use client";

// ============================================================================
// TET COUNTDOWN - Countdown to Lunar New Year 2025
// ============================================================================
// Urgency widget for Tet Offensive campaign
// ============================================================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, Clock, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";

// Tet 2026 date (Lunar New Year: February 17, 2026)
const TET_DATE = new Date('2026-02-17T00:00:00+07:00');

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function calculateTimeLeft(): TimeLeft {
    const now = new Date();
    const diff = TET_DATE.getTime() - now.getTime();

    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
    };
}

// Time unit display
function TimeUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="text-center">
            <motion.div
                key={value}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-red-600 text-white text-2xl md:text-4xl font-bold px-3 md:px-4 py-2 md:py-3 rounded-xl"
            >
                {value.toString().padStart(2, '0')}
            </motion.div>
            <div className="text-red-300 text-xs mt-1">{label}</div>
        </div>
    );
}

// Main countdown component
export function TetCountdown({ variant = 'full' }: { variant?: 'full' | 'compact' | 'banner' }) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!mounted) {
        return null;
    }

    // Compact version
    if (variant === 'compact') {
        return (
            <Link href="/festival" className="block">
                <div className="bg-gradient-to-r from-red-600 to-amber-600 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🎊</span>
                        <div>
                            <div className="text-white font-bold text-sm">Tết 2025</div>
                            <div className="text-red-100 text-xs">Còn {timeLeft.days} ngày</div>
                        </div>
                    </div>
                    <div className="text-white text-xl font-bold font-mono">
                        {timeLeft.days}:{timeLeft.hours.toString().padStart(2, '0')}:{timeLeft.minutes.toString().padStart(2, '0')}
                    </div>
                </div>
            </Link>
        );
    }

    // Banner version
    if (variant === 'banner') {
        return (
            <div className="bg-gradient-to-r from-red-600 via-red-500 to-amber-500 py-2">
                <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.span
                            animate={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-2xl"
                        >
                            🎊
                        </motion.span>
                        <span className="text-white font-bold">TẾT 2025</span>
                        <span className="text-red-100">Còn {timeLeft.days} ngày {timeLeft.hours} giờ</span>
                    </div>
                    <Link
                        href="/festival"
                        className="text-white hover:text-red-100 text-sm font-medium flex items-center gap-1"
                    >
                        Xem lễ hội <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    // Full version
    return (
        <div className="bg-gradient-to-br from-red-900/50 to-amber-900/50 border border-red-500/30 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-red-600/20 p-4 text-center">
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-4xl mb-2"
                >
                    🎊
                </motion.div>
                <h3 className="text-xl font-bold text-white">ĐẾM NGƯỢC TẾT 2025</h3>
                <p className="text-red-300 text-sm">Lễ hội Hoa Xuân Sa Đéc</p>
            </div>

            {/* Countdown */}
            <div className="p-6">
                <div className="flex justify-center gap-2 md:gap-4 mb-6">
                    <TimeUnit value={timeLeft.days} label="NGÀY" />
                    <span className="text-red-500 text-3xl font-bold self-start mt-2">:</span>
                    <TimeUnit value={timeLeft.hours} label="GIỜ" />
                    <span className="text-red-500 text-3xl font-bold self-start mt-2">:</span>
                    <TimeUnit value={timeLeft.minutes} label="PHÚT" />
                    <span className="text-red-500 text-3xl font-bold self-start mt-2">:</span>
                    <TimeUnit value={timeLeft.seconds} label="GIÂY" />
                </div>

                {/* Promo */}
                <div className="bg-amber-900/30 border border-amber-500/30 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
                        <Gift className="w-5 h-5" />
                        Ưu đãi Tết
                    </div>
                    <ul className="text-amber-200 text-sm space-y-1">
                        <li>• Giảm 20% vận chuyển toàn quốc</li>
                        <li>• Tặng loot box may mắn</li>
                        <li>• Flash Sale hàng ngày từ 23 tháng Chạp</li>
                    </ul>
                </div>

                {/* CTA */}
                <div className="flex gap-3">
                    <Link
                        href="/shop"
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold text-center transition-colors"
                    >
                        Mua hoa Tết 🌸
                    </Link>
                    <Link
                        href="/festival"
                        className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-bold text-center transition-colors"
                    >
                        Xem lễ hội 🎊
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Floating countdown badge
export function TetCountdownBadge() {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!mounted) return null;

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed bottom-6 left-6 z-40"
        >
            <Link
                href="/festival"
                className="bg-gradient-to-r from-red-600 to-amber-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 hover:shadow-xl transition-shadow"
            >
                <span className="text-lg">🎊</span>
                <span>Tết còn {timeLeft.days} ngày</span>
            </Link>
        </motion.div>
    );
}

export default TetCountdown;
