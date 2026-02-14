"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ScanLine,
    Trophy,
    MapPin,
    ShoppingBag,
    Sparkles,
    Terminal,
    Zap,
    Gift,
    Flame,
    Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TetCountdown } from "@/components/wow/TetCountdown";
import { FloatingLanterns, ParticleBackground } from "@/components/wow/ParticleBackground";
import { useLanguage } from "@/lib/i18n";
import { WOWLanguageToggle } from "@/components/wow/WOWLanguageToggle";

export default function FestivalHubPage() {
    const [mounted, setMounted] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        setMounted(true);
        // Show confetti burst on initial load
        setTimeout(() => setShowConfetti(true), 500);
        setTimeout(() => setShowConfetti(false), 3000);
    }, []);

    const quickLinks = [
        {
            href: "/scan",
            icon: ScanLine,
            titleKey: "festival.quicklinks.hunt",
            badge: "HOT",
            gradient: "from-emerald-500 to-green-500"
        },
        {
            href: "/leaderboard",
            icon: Trophy,
            titleKey: "festival.quicklinks.leaderboard",
            badge: null,
            gradient: "from-amber-500 to-orange-500"
        },
        {
            href: "/festival/check-in",
            icon: MapPin,
            titleKey: "festival.quicklinks.map",
            badge: "GIFT",
            gradient: "from-pink-500 to-rose-500"
        },
        {
            href: "/shop",
            icon: ShoppingBag,
            titleKey: "festival.quicklinks.shop",
            badge: null,
            gradient: "from-blue-500 to-cyan-500"
        }
    ];

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-black text-white font-mono overflow-hidden relative">
            {/* Floating Lanterns */}
            <FloatingLanterns count={10} />

            {/* Festival Particles */}
            <ParticleBackground variant="festival" intensity="medium" />

            {/* Background */}
            <div className="fixed inset-0 z-0">
                <img
                    src="/assets/digital-twins/agrios_festival_hyperreal_1765368149735.png"
                    className="w-full h-full object-cover opacity-30"
                    alt="Festival background"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
            </div>

            {/* Ambient Glow */}
            <div className="fixed inset-0 pointer-events-none z-1">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-500/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-rose-500/10 rounded-full blur-[100px]" />
            </div>

            {/* Confetti Burst */}
            <AnimatePresence>
                {showConfetti && (
                    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-3 h-3 rounded-sm"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    backgroundColor: ['#DC2626', '#F59E0B', '#FCD34D', '#10B981', '#EC4899'][i % 5],
                                }}
                                initial={{ y: -20, opacity: 1, rotate: 0 }}
                                animate={{
                                    y: "100vh",
                                    opacity: [1, 1, 0],
                                    rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                                }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: 3 + Math.random() * 2,
                                    delay: Math.random() * 0.5,
                                    ease: "linear"
                                }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="relative z-30 border-b border-red-500/20 bg-black/80 backdrop-blur-xl">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <Terminal className="w-5 h-5 text-red-500 group-hover:text-red-400 transition-colors" />
                        <span className="text-xs text-red-500 uppercase tracking-wider group-hover:text-red-400 transition-colors">
                            {t("festival.header.os")}
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <WOWLanguageToggle />
                        <motion.div
                            className="flex items-center gap-2 text-xs bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full"
                            animate={{ boxShadow: ["0 0 10px rgba(220,38,38,0.2)", "0 0 20px rgba(220,38,38,0.4)", "0 0 10px rgba(220,38,38,0.2)"] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-red-400">{t("festival.header.tet")}</span>
                            <Flame className="w-3 h-3 text-orange-400" />
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="relative z-10 pt-6 pb-4 px-4">
                <motion.div
                    className="text-center max-w-md mx-auto"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.div
                        className="inline-flex items-center gap-2 mb-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/40 px-4 py-1.5 rounded-full"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Zap className="w-4 h-4 text-orange-400" />
                        <span className="text-xs text-orange-300 uppercase tracking-wider font-bold">
                            🎊 {t("festival.title")} 🎊
                        </span>
                        <Star className="w-4 h-4 text-yellow-400" />
                    </motion.div>

                    <h1 className="text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                        {t("festival.hero.sadec")}
                    </h1>
                    <h2 className="text-lg text-stone-300 uppercase tracking-widest">
                        {t("festival.hero.subtitle")}
                    </h2>
                </motion.div>
            </div>

            {/* Tết Countdown - Full Integration */}
            <motion.div
                className="relative z-10 px-4 mb-6"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
            >
                <div className="max-w-md mx-auto">
                    <TetCountdown compact />
                </div>
            </motion.div>

            {/* Quick Links Grid */}
            <div className="relative z-10 px-4 pb-28">
                <div className="max-w-md mx-auto space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <motion.div
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Gift className="w-5 h-5 text-red-400" />
                        </motion.div>
                        <span className="text-xs text-stone-400 uppercase tracking-wider font-bold">
                            {t("festival.quicklinks.title")}
                        </span>
                        <motion.div
                            animate={{ rotate: [0, -15, 15, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Gift className="w-5 h-5 text-red-400" />
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {quickLinks.map((link, i) => (
                            <motion.div
                                key={link.href}
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                            >
                                <Link href={link.href}>
                                    <motion.div
                                        className="relative bg-stone-950/80 backdrop-blur-sm border border-red-500/20 rounded-xl p-5 group transition-all"
                                        whileHover={{
                                            scale: 1.02,
                                            borderColor: "rgba(220,38,38,0.5)",
                                            boxShadow: "0 0 25px rgba(220,38,38,0.2)"
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {link.badge && (
                                            <motion.span
                                                className={`absolute -top-2 -right-2 bg-gradient-to-r ${link.gradient} text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg`}
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            >
                                                {link.badge}
                                            </motion.span>
                                        )}
                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-3 group-hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-shadow`}>
                                            <link.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="font-bold text-white text-sm uppercase tracking-wider group-hover:text-red-400 transition-colors">
                                            {t(link.titleKey)}
                                        </h3>
                                    </motion.div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* Partner CTA */}
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9, type: "spring" }}
                    >
                        <Link href="/partner/register">
                            <Button className="w-full h-14 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:from-red-500 hover:via-orange-400 hover:to-amber-400 text-white font-bold text-sm uppercase tracking-wider rounded-xl mt-4 shadow-[0_0_30px_rgba(220,38,38,0.4)] border-0">
                                <motion.span
                                    className="flex items-center gap-2"
                                    animate={{ scale: [1, 1.02, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    🌿 {t("festival.register_cta")}
                                    <Sparkles className="w-4 h-4" />
                                </motion.span>
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-red-500/20 bg-black/90 backdrop-blur-xl p-3">
                <div className="text-center">
                    <motion.p
                        className="text-stone-500 text-[10px] uppercase tracking-wider font-mono"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        {t("festival.footer.powered")} <span className="text-red-400">Sa_Dec_Flower_Hunt</span> • <span className="text-orange-400">{t("festival.header.tet")}</span>
                    </motion.p>
                </div>
            </div>
        </div>
    );
}
