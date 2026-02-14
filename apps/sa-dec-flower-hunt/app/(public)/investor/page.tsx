"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Download, PieChart, TrendingUp, Users, Sparkles, Trophy, Target } from "lucide-react";
import { NeonButton } from "@/components/ui/neon-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { ParticleBackground } from "@/components/wow/ParticleBackground";
import { useLanguage } from "@/lib/i18n";
import { WOWLanguageToggle } from "@/components/wow/WOWLanguageToggle";

// Animated number component for metrics
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
    const spring = useSpring(0, { stiffness: 50, damping: 20 });
    const display = useTransform(spring, (v) => Math.floor(v).toLocaleString());
    const [displayValue, setDisplayValue] = useState("0");

    useEffect(() => {
        spring.set(value);
        const unsubscribe = display.on("change", (v) => setDisplayValue(v));
        return () => unsubscribe();
    }, [value, spring, display]);

    return <span>{displayValue}{suffix}</span>;
}

export default function InvestorLandingPage() {
    const [mounted, setMounted] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-amber-500/30 font-sans overflow-hidden relative">
            {/* Gold Particle Background */}
            <ParticleBackground variant="investor" intensity="high" />

            {/* Background Image */}
            <div className="fixed inset-0 z-0">
                <img
                    src="/assets/digital-twins/agrios_lab_hyperreal_1765368168487.png"
                    alt="Investor Relations"
                    className="w-full h-full object-cover opacity-15"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/60 to-black z-10" />
            </div>

            {/* Ambient Glow Effects */}
            <div className="fixed inset-0 pointer-events-none z-5">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-20 container mx-auto px-6 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-16"
                >
                    <Link href="/" className="text-stone-400 hover:text-white transition-colors flex items-center gap-2 group">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> {t("festival.back")}
                    </Link>
                    <div className="flex items-center gap-3">
                        <WOWLanguageToggle />
                        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-full">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Sparkles className="w-4 h-4 text-amber-400" />
                            </motion.div>
                            <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">{t("investor.series_a")}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Hero */}
                <div className="max-w-5xl mx-auto text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, type: "spring" }}
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 px-6 py-2 rounded-full mb-8"
                        >
                            <Trophy className="w-5 h-5 text-amber-400" />
                            <span className="text-amber-300 font-mono text-sm">{t("investor.hero.badge")}</span>
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        </motion.div>

                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8">
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-amber-100 to-amber-300 drop-shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                                {t("investor.hero.title1")}
                            </span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500">
                                {t("investor.hero.title2")}
                            </span>
                        </h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-xl md:text-2xl text-stone-300 leading-relaxed max-w-3xl mx-auto mb-12 font-light"
                        >
                            {t("investor.hero.desc")} <span className="text-amber-400 font-semibold">{t("investor.hero.highlight1")}</span> {t("investor.hero.connector")}{" "}
                            <span className="text-white font-semibold">{t("investor.hero.highlight2")}</span>.
                            <br />{t("investor.hero.tagline")}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <Link href="/investor/deck">
                                <NeonButton variant="primary" className="w-60 h-14 text-base group shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    {t("investor.cta.deck")}
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </NeonButton>
                            </Link>
                            <motion.button
                                whileHover={{ scale: 1.02, borderColor: "rgba(251,191,36,0.5)" }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all text-stone-300 font-medium font-mono text-sm"
                            >
                                <Download className="w-5 h-5" /> {t("investor.cta.onepager")}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Metrics Grid - Animated */}
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {[
                        {
                            icon: <TrendingUp className="w-7 h-7 text-emerald-400" />,
                            value: 204,
                            suffix: "%",
                            prefix: "+",
                            label: t("investor.metric.growth"),
                            desc: t("investor.metric.growth_desc"),
                            color: "emerald",
                            delay: 0.8,
                        },
                        {
                            icon: <Users className="w-7 h-7 text-blue-400" />,
                            value: 10200,
                            suffix: "",
                            prefix: "",
                            label: t("investor.metric.farmers"),
                            desc: t("investor.metric.farmers_desc"),
                            color: "blue",
                            delay: 0.9,
                        },
                        {
                            icon: <Target className="w-7 h-7 text-amber-400" />,
                            value: 52,
                            suffix: "B",
                            prefix: "$",
                            label: t("investor.metric.tam"),
                            desc: t("investor.metric.tam_desc"),
                            color: "amber",
                            delay: 1.0,
                        },
                    ].map((metric, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: metric.delay, type: "spring", stiffness: 100 }}
                        >
                            <GlassPanel
                                intensity="medium"
                                className="p-8 text-center hover:-translate-y-2 transition-all duration-500 group border-white/5 hover:border-amber-500/30"
                                hoverEffect
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className={`w-16 h-16 mx-auto bg-${metric.color}-500/10 rounded-2xl flex items-center justify-center mb-5 border border-${metric.color}-500/30 group-hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]`}
                                >
                                    {metric.icon}
                                </motion.div>
                                <div className="text-5xl font-black text-white mb-3 tracking-tight font-mono">
                                    {mounted ? (
                                        <>
                                            {metric.prefix}
                                            <AnimatedNumber value={metric.value} suffix={metric.suffix} />
                                        </>
                                    ) : (
                                        `${metric.prefix}${metric.value}${metric.suffix}`
                                    )}
                                </div>
                                <div className={`text-sm font-bold text-${metric.color}-400 uppercase tracking-widest mb-2`}>
                                    {metric.label}
                                </div>
                                <p className="text-stone-500 text-sm leading-relaxed">{metric.desc}</p>
                            </GlassPanel>
                        </motion.div>
                    ))}
                </div>

                {/* Why Invest Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-24 max-w-4xl mx-auto"
                >
                    <h2 className="text-3xl font-bold text-center mb-12">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
                            {t("investor.why_title")}
                        </span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { title: t("investor.benefit.first_mover"), desc: t("investor.benefit.first_mover_desc") },
                            { title: t("investor.benefit.retention"), desc: t("investor.benefit.retention_desc") },
                            { title: t("investor.benefit.model"), desc: t("investor.benefit.model_desc") },
                            { title: t("investor.benefit.ipo"), desc: t("investor.benefit.ipo_desc") },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-gradient-to-r from-stone-900/80 to-stone-900/40 border border-stone-800 hover:border-amber-500/30 rounded-xl p-6 group transition-all"
                            >
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-stone-400 text-sm">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Footer Quote */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mt-32 border-t border-amber-500/10 pt-12"
                >
                    <p className="font-mono text-stone-400 text-lg italic">
                        "{t("investor.footer_quote")}"
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                            TC
                        </div>
                        <div className="text-left">
                            <span className="text-white text-sm font-bold block">TechCrunch Asia</span>
                            <span className="text-stone-500 text-xs">{t("investor.footer_source")}</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
