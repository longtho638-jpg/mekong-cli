"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Database, Globe, Lock, ShieldCheck, Zap } from "lucide-react";
import { NeonButton } from "@/components/ui/neon-button";
import { GlassPanel } from "@/components/ui/glass-panel";

import { withI18n, WithI18nProps } from "@/lib/withI18n";

function PartnerPage({ texts }: WithI18nProps) {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 font-sans overflow-x-hidden">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <img
                    src="/assets/digital-twins/agrios_lab_hyperreal_1765368168487.png"
                    alt="Garden OS Lab"
                    className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black z-10" />
            </div>

            <div className="relative z-20 container mx-auto px-6 py-20">
                {/* Header */}
                <div className="flex justify-between items-center mb-20">
                    <Link href="/" className="text-stone-400 hover:text-white transition-colors flex items-center gap-2 group">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> {texts.back}
                    </Link>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-1 rounded-full text-xs font-mono text-emerald-400">
                        {texts.status}
                    </div>
                </div>

                {/* Hero */}
                <div className="max-w-4xl mx-auto text-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-900/80 border border-stone-800 rounded-full mb-6 text-xs font-mono text-stone-400">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            {texts.badge}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-stone-400">
                            {texts["title.prefix"]} <span className="text-emerald-500">{texts["title.highlight"]}</span><br />
                            {texts["title.suffix"]}
                        </h1>
                        <p className="text-xl text-stone-300 leading-relaxed max-w-2xl mx-auto mb-10">
                            {texts.desc}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/partner/register">
                                <NeonButton variant="primary" className="w-48 group">
                                    {texts["cta.access"]} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </NeonButton>
                            </Link>
                            <Link href="/contact">
                                <NeonButton variant="secondary" className="w-48">
                                    {texts["cta.contact"]}
                                </NeonButton>
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-32">
                    <FeatureCard
                        icon={<Database className="w-6 h-6 text-blue-400" />}
                        title={texts["feature.twin.title"]}
                        desc={texts["feature.twin.desc"]}
                    />
                    <FeatureCard
                        icon={<BarChart3 className="w-6 h-6 text-emerald-400" />}
                        title={texts["feature.yield.title"]}
                        desc={texts["feature.yield.desc"]}
                    />
                    <FeatureCard
                        icon={<Globe className="w-6 h-6 text-amber-400" />}
                        title={texts["feature.market.title"]}
                        desc={texts["feature.market.desc"]}
                    />
                </div>

                {/* Security Section */}
                <div className="grid md:grid-cols-2 gap-12 items-center bg-stone-900/30 border border-white/5 rounded-3xl p-12 backdrop-blur-sm">
                    <div>
                        <h2 className="text-3xl font-bold mb-6">{texts["security.title"]}</h2>
                        <ul className="space-y-4">
                            <SecurityItem text={texts["security.1"]} />
                            <SecurityItem text={texts["security.2"]} />
                            <SecurityItem text={texts["security.3"]} />
                            <SecurityItem text={texts["security.4"]} />
                        </ul>
                    </div>
                    <div className="relative h-64 bg-black/50 rounded-2xl border border-stone-800 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                        <ShieldCheck className="w-24 h-24 text-emerald-500/20" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                            <Lock className="w-12 h-12 text-emerald-500 mb-2 mx-auto" />
                            <div className="text-sm font-mono text-emerald-500">{texts["security.encrypted"]}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withI18n(PartnerPage, "partner");

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <GlassPanel intensity="low" className="p-8 hover:bg-white/5 transition-colors">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 border border-white/10">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-stone-400 leading-relaxed text-sm">
                {desc}
            </p>
        </GlassPanel>
    )
}

function SecurityItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-3 text-stone-300">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-3 h-3 text-emerald-500" />
            </div>
            {text}
        </li>
    )
}
