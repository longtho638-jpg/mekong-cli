"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Leaderboard } from "@/components/Leaderboard";
import { ChevronLeft, Trophy, Crown, Star, Sparkles, Medal, Flame } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ParticleBackground } from "@/components/wow/ParticleBackground";
import { useLanguage } from "@/lib/i18n";
import { WOWLanguageToggle } from "@/components/wow/WOWLanguageToggle";

export default function LeaderboardPage() {
    const { t } = useLanguage();
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        // Brief confetti on load for top hunters
        setTimeout(() => setShowConfetti(true), 300);
        setTimeout(() => setShowConfetti(false), 2500);
    }, []);

    return (
        <div className="min-h-screen bg-stone-950 text-white relative overflow-hidden">
            {/* Star Particle Background */}
            <ParticleBackground variant="stars" intensity="high" />

            {/* Background */}
            <div className="fixed inset-0 z-0">
                <img
                    src="/assets/digital-twins/agrios_festival_hyperreal_1765367683935.png"
                    className="w-full h-full object-cover opacity-15"
                    alt="Leaderboard background"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-stone-950/90 to-stone-950" />
            </div>

            {/* Ambient Glow */}
            <div className="fixed inset-0 pointer-events-none z-1">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/10 rounded-full blur-[150px]" />
                <div className="absolute top-1/4 left-1/4 w-[200px] h-[200px] bg-yellow-500/10 rounded-full blur-[80px]" />
                <div className="absolute top-1/4 right-1/4 w-[200px] h-[200px] bg-orange-500/10 rounded-full blur-[80px]" />
            </div>

            {/* Confetti Burst */}
            <AnimatePresence>
                {showConfetti && (
                    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 rounded-sm"
                                style={{
                                    left: `${30 + Math.random() * 40}%`,
                                    backgroundColor: ['#F59E0B', '#FCD34D', '#FBBF24', '#D97706'][i % 4],
                                }}
                                initial={{ y: -20, opacity: 1, rotate: 0 }}
                                animate={{
                                    y: "50vh",
                                    opacity: [1, 1, 0],
                                    rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                                }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: 2 + Math.random(),
                                    delay: Math.random() * 0.3,
                                    ease: "linear"
                                }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <div className="relative z-10 p-4 pb-24">
                <div className="max-w-md mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-8"
                    >
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="hover:bg-amber-500/10 -ml-2">
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                        </Link>
                        <WOWLanguageToggle />
                        <motion.div
                            className="flex items-center gap-2"
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <motion.div
                                animate={{
                                    rotate: [0, 5, -5, 0],
                                    filter: ["drop-shadow(0 0 8px #FCD34D)", "drop-shadow(0 0 16px #FCD34D)", "drop-shadow(0 0 8px #FCD34D)"]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Trophy className="w-6 h-6 text-yellow-400" />
                            </motion.div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
                                {t("leaderboard.title")}
                            </h1>
                            <motion.div
                                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Flame className="w-5 h-5 text-orange-400" />
                            </motion.div>
                        </motion.div>
                        <div className="w-10" /> {/* Spacer for balance */}
                    </motion.div>

                    {/* Top 3 Highlight */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-r from-amber-900/30 via-yellow-900/20 to-amber-900/30 border border-amber-500/30 rounded-2xl p-4 mb-6"
                    >
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Crown className="w-5 h-5 text-yellow-400" />
                            <span className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                                {t("leaderboard.top_hunters")}
                            </span>
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div className="flex justify-center gap-4">
                            {[
                                { rank: 2, medal: "🥈", color: "silver" },
                                { rank: 1, medal: "🥇", color: "gold" },
                                { rank: 3, medal: "🥉", color: "bronze" },
                            ].map((item, i) => (
                                <motion.div
                                    key={item.rank}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    className={`flex flex-col items-center ${item.rank === 1 ? "scale-110" : ""}`}
                                >
                                    <motion.span
                                        className="text-3xl"
                                        animate={{ y: item.rank === 1 ? [0, -5, 0] : 0 }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        {item.medal}
                                    </motion.span>
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br 
                                        ${item.rank === 1 ? "from-amber-400 to-yellow-600 shadow-[0_0_15px_rgba(251,191,36,0.5)]" : ""}
                                        ${item.rank === 2 ? "from-stone-300 to-stone-500" : ""}
                                        ${item.rank === 3 ? "from-amber-600 to-amber-800" : ""}
                                        flex items-center justify-center text-white font-bold text-sm mt-1
                                    `}>
                                        #{item.rank}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Leaderboard Component */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-stone-900/50 backdrop-blur-xl border border-amber-500/20 rounded-2xl overflow-hidden shadow-xl"
                    >
                        <Leaderboard />
                    </motion.div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-6 text-center"
                    >
                        <Link href="/scan">
                            <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold px-8 py-3 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                                <Sparkles className="w-4 h-4 mr-2" />
                                {t("leaderboard.scan_cta")}
                                <Star className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
