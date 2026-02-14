"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    Building2, Code2, Database, Globe, Truck, ShoppingBag,
    Leaf, Coffee, Sparkles, Wallet, Plane, Megaphone,
    Award, TrendingUp, Users, MapPin, Mail, Phone,
    CheckCircle2, ArrowRight, ExternalLink
} from "lucide-react";
import { withI18n, WithI18nProps } from "@/lib/withI18n";

const CATEGORY_COLORS = {
    CORE_TECH: "from-blue-500 to-cyan-500",
    COMMERCE: "from-emerald-500 to-green-500",
    FMCG: "from-amber-500 to-orange-500",
    FINTECH: "from-purple-500 to-pink-500",
};

function AboutPage({ texts }: WithI18nProps) {

    const VSIC_CODES = [
        { code: "6201", name: texts["vsic.6201"], icon: Code2, category: "CORE_TECH", isPrimary: true },
        { code: "6311", name: texts["vsic.6311"], icon: Database, category: "CORE_TECH" },
        { code: "6202", name: texts["vsic.6202"], icon: Globe, category: "CORE_TECH" },
        { code: "6312", name: texts["vsic.6312"], icon: Globe, category: "COMMERCE" },
        { code: "4791", name: texts["vsic.4791"], icon: ShoppingBag, category: "COMMERCE" },
        { code: "5229", name: texts["vsic.5229"], icon: Truck, category: "COMMERCE" },
        { code: "4620", name: texts["vsic.4620"], icon: Leaf, category: "FMCG" },
        { code: "4632", name: texts["vsic.4632"], icon: Coffee, category: "FMCG" },
        { code: "4649", name: texts["vsic.4649"], icon: Sparkles, category: "FMCG" },
        { code: "6619", name: texts["vsic.6619"], icon: Wallet, category: "FINTECH" },
        { code: "7990", name: texts["vsic.7990"], icon: Plane, category: "FINTECH" },
        { code: "7310", name: texts["vsic.7310"], icon: Megaphone, category: "FINTECH" },
    ];

    const STATS = [
        { value: "50+", label: texts["stats.partners"], icon: Users },
        { value: "1B", label: texts["stats.capital"], icon: Building2 },
        { value: "6", label: texts["stats.hours"], icon: Truck },
        { value: "12", label: texts["stats.vsic"], icon: Award },
    ];

    return (
        <div className="min-h-screen bg-stone-950 text-white relative">
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_landing_hyperreal_1765367547331.png" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-stone-950/90" />
            </div>
            <div className="relative z-10 w-full">
                {/* Hero Section */}
                <section className="relative overflow-hidden py-24 px-6">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

                    <div className="container mx-auto max-w-6xl relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center"
                        >
                            <Link href="/" className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-2 mb-8 group">
                                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                                {texts["back"]}
                            </Link>

                            {/* Company Logo/Name */}
                            <div className="mb-8">
                                <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-green-400 p-[2px] rounded-2xl"
                                >
                                    <div className="bg-stone-950 rounded-2xl px-8 py-4">
                                        <span className="text-3xl md:text-4xl font-black bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                                            AGRIOS
                                        </span>
                                        <span className="text-stone-500 text-lg ml-2">TECH</span>
                                    </div>
                                </motion.div>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                {texts["hero.title_prefix"]}{" "}
                                <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                                    AGRIOS
                                </span>
                            </h1>
                            <p className="text-xl text-emerald-400 font-semibold mb-4">
                                {texts["hero.subtitle"]}
                            </p>
                            <p className="text-stone-400 text-lg max-w-2xl mx-auto">
                                {texts["hero.desc"]}
                            </p>
                        </motion.div>

                        {/* Stats Grid */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12"
                        >
                            {STATS.map((stat, i) => (
                                <div key={i} className="bg-stone-800/50 border border-stone-700 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-colors">
                                    <stat.icon className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                                    <div className="text-stone-500 text-sm">{stat.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Vision & Mission */}
                <section className="py-16 px-6 border-t border-stone-800">
                    <div className="container mx-auto max-w-6xl">
                        <div className="grid md:grid-cols-2 gap-8">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="bg-gradient-to-br from-emerald-900/30 to-green-900/20 border border-emerald-500/30 rounded-2xl p-8"
                            >
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                                    {texts["vision.title"]}
                                </h2>
                                <p className="text-stone-300 leading-relaxed">
                                    {texts["vision.desc"]}
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-blue-500/30 rounded-2xl p-8"
                            >
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Award className="w-6 h-6 text-blue-400" />
                                    {texts["mission.title"]}
                                </h2>
                                <p className="text-stone-300 leading-relaxed">
                                    {texts["mission.desc"]}
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* VSIC Codes - Business License */}
                <section className="py-16 px-6 bg-stone-900/50">
                    <div className="container mx-auto max-w-6xl">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-3xl font-bold text-white mb-4">
                                {texts["legal.title"]}
                            </h2>
                            <p className="text-stone-400">
                                {texts["legal.desc"]}
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {VSIC_CODES.map((vsic, i) => {
                                const Icon = vsic.icon;
                                const gradient = CATEGORY_COLORS[vsic.category as keyof typeof CATEGORY_COLORS];
                                return (
                                    <motion.div
                                        key={vsic.code}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.05 }}
                                        className={`
                                        relative group bg-stone-800/50 border rounded-xl p-4
                                        hover:bg-stone-800 transition-all cursor-default
                                        ${vsic.isPrimary ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-stone-700'}
                                    `}
                                    >
                                        {vsic.isPrimary && (
                                            <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                MAIN
                                            </div>
                                        )}
                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
                                            <Icon className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="text-emerald-400 font-mono text-sm">{vsic.code}</div>
                                        <div className="text-white text-sm font-medium mt-1">{vsic.name}</div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Tax Benefits Note */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mt-8 bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-6"
                        >
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-emerald-300 font-medium">{texts["tax.title"]}</p>
                                    <p className="text-stone-400 text-sm">
                                        {texts["tax.desc"]}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Company Info */}
                <section className="py-16 px-6 border-t border-stone-800">
                    <div className="container mx-auto max-w-6xl">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Registration Info */}
                            <div className="bg-stone-800/50 border border-stone-700 rounded-2xl p-8">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-emerald-400" />
                                    {texts["info.title"]}
                                </h3>
                                <div className="space-y-4 text-stone-300">
                                    <InfoRow label={texts["info.name_label"]} value={texts["info.name_value"]} />
                                    <InfoRow label={texts["info.eng_label"]} value={texts["info.eng_value"]} />
                                    <InfoRow label={texts["info.type_label"]} value={texts["info.type_value"]} />
                                    <InfoRow label={texts["info.cap_label"]} value={texts["info.cap_value"]} highlight />
                                    <InfoRow label={texts["info.tax_label"]} value={texts["info.tax_value"]} pending />
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="bg-stone-800/50 border border-stone-700 rounded-2xl p-8">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-emerald-400" />
                                    {texts["contact.title"]}
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-stone-500 mt-0.5" />
                                        <div>
                                            <p className="text-white">{texts["contact.hq_label"]}</p>
                                            <p className="text-stone-400 text-sm">{texts["contact.hq_value"]}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-stone-500 mt-0.5" />
                                        <div>
                                            <p className="text-white">{texts["contact.hotline_label"]}</p>
                                            <p className="text-emerald-400 text-sm">1900-AGRIOS</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Mail className="w-5 h-5 text-stone-500 mt-0.5" />
                                        <div>
                                            <p className="text-white">{texts["contact.email_label"]}</p>
                                            <p className="text-emerald-400 text-sm">hello@agrios.tech</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-stone-700">
                                    <Link
                                        href="/partner/register"
                                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white py-3 rounded-xl font-bold transition-all"
                                    >
                                        {texts["contact.partner_btn"]} <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 px-6 bg-gradient-to-t from-emerald-900/20 to-transparent">
                    <div className="container mx-auto max-w-4xl text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            {texts["cta.title"]}
                        </h2>
                        <p className="text-stone-400 mb-8 max-w-2xl mx-auto">
                            {texts["cta.desc"]}
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/investor"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
                            >
                                {texts["cta.investor_btn"]} <ExternalLink className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/insights"
                                className="bg-stone-800 hover:bg-stone-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors border border-stone-700"
                            >
                                {texts["cta.blog_btn"]} <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

// Helper components
function InfoRow({ label, value, highlight, pending }: {
    label: string;
    value: string;
    highlight?: boolean;
    pending?: boolean;
}) {
    return (
        <div className="flex justify-between items-start gap-4">
            <span className="text-stone-500 text-sm shrink-0">{label}</span>
            <span className={`text-right text-sm ${highlight ? 'text-emerald-400 font-bold' :
                pending ? 'text-amber-400 italic' : 'text-white'
                }`}>
                {value}
            </span>
        </div>
    );
}

export default withI18n(AboutPage, "about");
