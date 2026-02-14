"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { GlassPanel } from '@/components/ui/glass-panel';
import { NeonButton } from '@/components/ui/neon-button';
import { AgriosLogo } from '@/components/brand/AgriosLogo';
import { ArrowRight, Play, MapPin, BarChart3, Sprout, ShoppingBag, Globe } from 'lucide-react';
import { WOWLanguageToggle } from '@/components/wow/WOWLanguageToggle';
import { GeoLanguageNotice } from '@/components/wow/GeoLanguageNotice';
import { useLanguage } from '@/lib/i18n';
import { GlobalFooter } from '@/components/layout/GlobalFooter';

export default function LandingPageClient() {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const opacityHero = useTransform(scrollY, [0, 400], [1, 0]);
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-stone-950 text-white overflow-hidden font-sans selection:bg-emerald-500/30">
            {/* Fixed Language Toggle in Top-Right */}
            <div className="fixed top-4 right-4 z-50">
                <WOWLanguageToggle />
            </div>

            {/* Geo Language Notice */}
            <GeoLanguageNotice />

            {/* --- HERO SECTION: DIGITAL TWIN --- */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Background Parallax */}
                <motion.div
                    style={{ y: y1, opacity: opacityHero }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C0A09] via-transparent to-black/40 z-10" />
                    <img
                        src="/assets/digital-twins/agrios_landing_hyperreal_1765367547331.png"
                        alt="Sa Dec Digital Twin"
                        className="w-full h-full object-cover scale-110"
                    />
                </motion.div>

                {/* Hero Content */}
                <div className="relative z-20 container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                    >
                        <div className="mb-6 flex justify-center">
                            <div className="bg-black/30 backdrop-blur-md border border-emerald-500/30 rounded-full px-4 py-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-emerald-400 text-xs font-mono tracking-widest">{t("landing.status.online")}</span>
                            </div>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-emerald-200 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            AGRIOS<span className="text-emerald-500">.tech</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-stone-300 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
                            {t("landing.hero.tagline1")} <span className="text-emerald-400 font-semibold">{t("landing.hero.tagline2")}</span><br />
                            {t("landing.hero.tagline3")}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/hunt">
                                <NeonButton variant="primary" className="w-48 group">
                                    {t("landing.cta.hunter")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </NeonButton>
                            </Link>
                            <Link href="/partner/register">
                                <NeonButton variant="outline" className="w-48 group">
                                    {t("landing.cta.partner")}
                                </NeonButton>
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-stone-500 flex flex-col items-center gap-2"
                >
                    <span className="text-[10px] uppercase tracking-widest">{t("landing.scroll_hint")}</span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-emerald-500 to-transparent" />
                </motion.div>
            </section>

            {/* --- LIVE TICKER: SOCIAL PROOF --- */}
            <div className="bg-emerald-900/10 border-y border-emerald-500/10 py-3 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0C0A09] via-transparent to-[#0C0A09] z-10" />
                <motion.div
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="flex items-center gap-12 whitespace-nowrap text-sm font-mono text-emerald-500/80"
                >
                    {[...Array(4)].map((_, i) => (
                        <React.Fragment key={i}>
                            <span className="flex items-center gap-2">⚡ 10,242 {t("landing.ticker.nodes")}</span>
                            <span className="flex items-center gap-2">🌸 1.2M {t("landing.ticker.flowers")}</span>
                            <span className="flex items-center gap-2">📈 {t("landing.ticker.marketcap")}</span>
                            <span className="flex items-center gap-2">🌐 {t("landing.ticker.hashtag")}</span>
                        </React.Fragment>
                    ))}                </motion.div>
            </div>

            {/* --- ECOSYSTEM GRID --- */}
            <section className="py-32 container mx-auto px-6 relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">{t("landing.ecosystem.title")}</h2>
                    <p className="text-stone-400">{t("landing.ecosystem.desc")}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Hunter Guide */}
                    <Link href="/hunt">
                        <GlassPanel className="h-full p-8 group relative" hoverEffect>
                            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <MapPin className="w-7 h-7 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors">{t("landing.module.hunter.title")}</h3>
                            <p className="text-stone-400 leading-relaxed mb-6">
                                {t("landing.module.hunter.desc")}
                            </p>
                            <div className="absolute bottom-8 right-8 text-blue-500/20 group-hover:text-blue-500/50 transition-colors">
                                <ArrowRight className="w-8 h-8" />
                            </div>
                        </GlassPanel>
                    </Link>

                    {/* Garden OS */}
                    <Link href="/partner">
                        <GlassPanel className="h-full p-8 group relative border-emerald-500/30" hoverEffect intensity="high">
                            <div className="absolute -top-3 -right-3 bg-emerald-500 text-black text-[10px] font-bold px-3 py-1 rounded-full animate-bounce">
                                {t("landing.module.garden.badge")}
                            </div>
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <BarChart3 className="w-7 h-7 text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 group-hover:text-emerald-400 transition-colors">{t("landing.module.garden.title")}</h3>
                            <p className="text-stone-400 leading-relaxed mb-6">
                                {t("landing.module.garden.desc")}
                            </p>
                            <div className="absolute bottom-8 right-8 text-emerald-500/20 group-hover:text-emerald-500/50 transition-colors">
                                <ArrowRight className="w-8 h-8" />
                            </div>
                        </GlassPanel>
                    </Link>

                    {/* Marketplace */}
                    <Link href="/shop">
                        <GlassPanel className="h-full p-8 group relative" hoverEffect>
                            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ShoppingBag className="w-7 h-7 text-amber-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 group-hover:text-amber-400 transition-colors">{t("landing.module.market.title")}</h3>
                            <p className="text-stone-400 leading-relaxed mb-6">
                                {t("landing.module.market.desc")}
                            </p>
                            <div className="absolute bottom-8 right-8 text-amber-500/20 group-hover:text-amber-500/50 transition-colors">
                                <ArrowRight className="w-8 h-8" />
                            </div>
                        </GlassPanel>
                    </Link>
                </div>
            </section>

            {/* --- VISUAL INTERLUDE --- */}
            <section className="py-20 bg-emerald-950/20 border-y border-emerald-900/30 overflow-hidden">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1">
                        <img
                            src="/assets/ui-concept.png"
                            alt="Agrios App UI"
                            className="rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)] border border-emerald-500/20 rotate-[-5deg] hover:rotate-0 transition-transform duration-700"
                        />
                    </div>
                    <div className="flex-1 space-y-8">
                        <div>
                            <span className="text-emerald-500 font-mono text-sm tracking-widest">{t("landing.vision.label")}</span>
                            <h2 className="text-4xl font-bold mt-2">{t("landing.vision.title1")}<br />{t("landing.vision.title2")}</h2>
                        </div>
                        <p className="text-lg text-stone-300">
                            {t("landing.vision.desc")}
                        </p>
                        <div className="grid grid-cols-2 gap-6">
                            <DataPoint label={t("landing.datapoint.trace")} value="100%" />
                            <DataPoint label={t("landing.datapoint.revenue")} value="+30%" />
                            <DataPoint label={t("landing.datapoint.supply")} value="6 Hours" />
                            <DataPoint label={t("landing.datapoint.network")} value="5G/IoT" />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FOOTER (Reusable Component) --- */}
            <GlobalFooter />
        </div>
    );
}

function DataPoint({ label, value }: { label: string, value: string }) {
    return (
        <div className="border-l-2 border-emerald-500/30 pl-4">
            <div className="text-2xl font-bold text-white mb-1 font-mono">{value}</div>
            <div className="text-xs text-stone-500 uppercase tracking-widest">{label}</div>
        </div>
    );
}
