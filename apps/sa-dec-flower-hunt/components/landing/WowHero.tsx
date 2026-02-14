"use client";

// ============================================================================
// WOW HERO - Ultra Premium Landing Hero
// ============================================================================
// Particle effects, 3D transforms, glassmorphism, premium animations
// ============================================================================

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
    Sparkles, ArrowRight, Play, Gift, Zap, TrendingUp,
    Star, Users, ShoppingCart, Flower2, MapPin, Heart
} from "lucide-react";
import Link from "next/link";

// Floating flower particle
function FloatingFlower({ delay, duration, x, size }: { delay: number; duration: number; x: number; size: number }) {
    const flowers = ['🌸', '🌺', '🌹', '🌻', '🌷', '🪻', '🌼', '💐'];
    const flower = flowers[Math.floor(Math.random() * flowers.length)];

    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{ left: `${x}%`, fontSize: `${size}rem` }}
            initial={{ y: '110vh', opacity: 0, rotate: 0 }}
            animate={{
                y: '-10vh',
                opacity: [0, 1, 1, 0],
                rotate: 360
            }}
            transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: 'linear'
            }}
        >
            {flower}
        </motion.div>
    );
}

// Gradient orb background
function GradientOrbs() {
    return (
        <div className="absolute inset-0 overflow-hidden">
            <motion.div
                animate={{
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 20, repeat: Infinity }}
                className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-500/30 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    x: [0, -100, 0],
                    y: [0, 50, 0],
                    scale: [1.2, 1, 1.2]
                }}
                transition={{ duration: 25, repeat: Infinity }}
                className="absolute -top-20 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    x: [0, 50, 0],
                    y: [0, -30, 0]
                }}
                transition={{ duration: 15, repeat: Infinity }}
                className="absolute top-1/2 left-1/4 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"
            />
        </div>
    );
}

// Stats counter with animation
function AnimatedCounter({ target, suffix = '', label }: { target: number; suffix?: string; label: string }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [target]);

    return (
        <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                {count.toLocaleString()}{suffix}
            </div>
            <div className="text-stone-400 text-sm">{label}</div>
        </div>
    );
}

// Feature card with glow
function FeatureCard({ icon, title, description, href, color, delay }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    href: string;
    color: string;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
        >
            <Link href={href}>
                <div className={`
          relative group bg-stone-900/50 backdrop-blur-sm border border-stone-800 
          rounded-2xl p-6 hover:border-${color}-500/50 transition-all duration-300
          hover:shadow-2xl hover:shadow-${color}-500/20 hover:-translate-y-2
        `}>
                    {/* Glow effect on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/0 to-${color}-500/0 group-hover:from-${color}-500/10 group-hover:to-transparent rounded-2xl transition-all duration-300`} />

                    <div className="relative z-10">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-${color}-500 to-${color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            {icon}
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-emerald-400 transition-colors">
                            {title}
                        </h3>
                        <p className="text-stone-400 text-sm">{description}</p>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// Main WOW Hero component
export function WowHero() {
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 500], [0, 150]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950">
            {/* Gradient orbs */}
            <GradientOrbs />

            {/* Floating flowers */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <FloatingFlower
                        key={i}
                        delay={i * 0.5}
                        duration={15 + Math.random() * 10}
                        x={Math.random() * 100}
                        size={1.5 + Math.random() * 1.5}
                    />
                ))}
            </div>

            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: `linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
            }} />

            {/* Hero content */}
            <motion.div
                style={{ y, opacity }}
                className="relative z-10 max-w-6xl mx-auto px-4 pt-20 pb-12"
            >
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-full text-sm font-medium backdrop-blur-sm">
                        <Sparkles className="w-4 h-4" />
                        🎊 Lễ hội Hoa Xuân 2025 sắp diễn ra!
                        <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        >
                            ✨
                        </motion.span>
                    </div>
                </motion.div>

                {/* Main title */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-5xl md:text-7xl font-black mb-4">
                        <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400 bg-clip-text text-transparent">
                            AGRIOS
                        </span>
                        <span className="text-white">.tech</span>
                    </h1>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl md:text-2xl text-stone-400"
                    >
                        Nền tảng nông nghiệp thông minh <span className="text-emerald-400">Sa Đéc</span>
                    </motion.div>
                </motion.div>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-stone-400 text-lg md:text-xl text-center max-w-2xl mx-auto mb-12"
                >
                    Kết nối nông dân → khách hàng • Cold-chain logistics • Fintech nông nghiệp
                </motion.p>

                {/* CTA buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap justify-center gap-4 mb-16"
                >
                    <Link
                        href="/shop"
                        className="group bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/50 hover:scale-105"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        Mua hoa ngay
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        href="/dashboard"
                        className="bg-stone-800 hover:bg-stone-700 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 border border-stone-700 transition-all hover:scale-105"
                    >
                        <Play className="w-5 h-5" />
                        Khám phá
                    </Link>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-20 p-8 bg-stone-900/50 backdrop-blur-sm rounded-3xl border border-stone-800"
                >
                    <AnimatedCounter target={500} suffix="+" label="Nhà vườn" />
                    <AnimatedCounter target={10000} suffix="+" label="Sản phẩm" />
                    <AnimatedCounter target={50000} suffix="+" label="Khách hàng" />
                    <AnimatedCounter target={99} suffix="%" label="Hài lòng" />
                </motion.div>
            </motion.div>

            {/* Feature cards */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
                <motion.h2
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="text-3xl font-bold text-white text-center mb-12"
                >
                    Trải nghiệm <span className="text-emerald-400">WOW</span>
                </motion.h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FeatureCard
                        icon={<Gift className="w-7 h-7 text-white" />}
                        title="Săn Loot Box"
                        description="Game săn hoa ảo, nhận quà thật từ vườn"
                        href="/hunt"
                        color="amber"
                        delay={0.1}
                    />
                    <FeatureCard
                        icon={<Flower2 className="w-7 h-7 text-white" />}
                        title="Nhận Nuôi Cây"
                        description="Virtual farming - theo dõi cây lớn mỗi ngày"
                        href="/adopt"
                        color="emerald"
                        delay={0.2}
                    />
                    <FeatureCard
                        icon={<Sparkles className="w-7 h-7 text-white" />}
                        title="Sản Phẩm Hoa"
                        description="Nước hoa hồng, trà sen organic"
                        href="/shop/fmcg"
                        color="pink"
                        delay={0.3}
                    />
                    <FeatureCard
                        icon={<MapPin className="w-7 h-7 text-white" />}
                        title="Farmstay"
                        description="Nghỉ dưỡng giữa vườn hoa"
                        href="/farmstay"
                        color="cyan"
                        delay={0.4}
                    />
                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-6 h-10 border-2 border-stone-600 rounded-full flex justify-center"
                >
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2"
                    />
                </motion.div>
            </motion.div>
        </div>
    );
}

export default WowHero;
