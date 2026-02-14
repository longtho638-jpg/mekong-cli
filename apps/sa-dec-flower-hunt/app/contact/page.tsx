"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, Clock, Globe } from "lucide-react";
import { NeonButton } from "@/components/ui/neon-button";
import { GlassPanel } from "@/components/ui/glass-panel";

import { withI18n, WithI18nProps } from "@/lib/withI18n";

function ContactPage({ texts }: WithI18nProps) {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 font-sans">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <img
                    src="/assets/digital-twins/agrios_landing_hyperreal_1765367547331.png"
                    alt="Sa Dec Contact"
                    className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-stone-950/80 z-10" />
            </div>

            <div className="relative z-20 container mx-auto px-6 py-20">
                <Link href="/" className="text-stone-400 hover:text-white transition-colors flex items-center gap-2 mb-12 group inline-block">
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> {texts.back}
                </Link>

                <div className="grid lg:grid-cols-2 gap-16 items-start">
                    {/* Left Column: Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl font-bold mb-6">{texts.title}</h1>
                        <p className="text-xl text-stone-300 mb-12 leading-relaxed">
                            {texts.desc}
                        </p>

                        <div className="space-y-6 mb-12">
                            <ContactItem
                                icon={<MapPin className="w-5 h-5 text-emerald-400" />}
                                title={texts["hq.title"]}
                                content={texts["hq.addr"]}
                            />
                            <ContactItem
                                icon={<Mail className="w-5 h-5 text-blue-400" />}
                                title={texts["email.title"]}
                                content="hello@agrios.tech"
                                link="mailto:hello@agrios.tech"
                            />
                            <ContactItem
                                icon={<Phone className="w-5 h-5 text-amber-400" />}
                                title={texts["hotline.title"]}
                                content="1900-AGRIOS (24/7)"
                                link="tel:1900247467"
                            />
                            <ContactItem
                                icon={<Clock className="w-5 h-5 text-purple-400" />}
                                title={texts["hours.title"]}
                                content={texts["hours.time"]}
                            />
                        </div>

                        <div className="p-6 bg-emerald-900/10 border border-emerald-500/20 rounded-2xl">
                            <h3 className="font-bold flex items-center gap-2 mb-2">
                                <Globe className="w-5 h-5 text-emerald-500" />
                                {texts["visit.title"]}
                            </h3>
                            <p className="text-stone-400 text-sm mb-4">
                                {texts["visit.desc"]}
                            </p>
                            <Link href="/festival">
                                <span className="text-emerald-400 text-sm font-bold hover:underline cursor-pointer">
                                    {texts["visit.cta"]}
                                </span>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Right Column: Message Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <GlassPanel className="p-8 md:p-10" intensity="low">
                            <h2 className="text-2xl font-bold mb-6">{texts["form.title"]}</h2>
                            <form className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-stone-500 tracking-wider">{texts["form.name"]}</label>
                                        <input
                                            type="text"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                            placeholder={texts["form.placeholder.name"]}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-stone-500 tracking-wider">{texts["form.email"]}</label>
                                        <input
                                            type="email"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                            placeholder={texts["form.placeholder.email"]}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-stone-500 tracking-wider">{texts["form.subject"]}</label>
                                    <select className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none">
                                        <option>General Inquiry</option>
                                        <option>Partnership / Garden OS</option>
                                        <option>Order Support</option>
                                        <option>Press / Media</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-stone-500 tracking-wider">{texts["form.message"]}</label>
                                    <textarea
                                        rows={5}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                                        placeholder={texts["form.placeholder.msg"]}
                                    />
                                </div>

                                <NeonButton variant="primary" className="w-full justify-center">
                                    <Send className="w-4 h-4 mr-2" /> {texts["form.send"]}
                                </NeonButton>
                            </form>
                        </GlassPanel>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default withI18n(ContactPage, "contact");

function ContactItem({ icon, title, content, link }: { icon: React.ReactNode; title: string; content: string; link?: string }) {
    const Wrapper = link ? "a" : "div";
    const props = link ? { href: link, className: "block hover:opacity-80 transition-opacity" } : { className: "block" };

    return (
        // @ts-ignore
        <Wrapper {...props}>
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shrink-0">
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-white mb-1">{title}</h3>
                    <p className="text-stone-400 text-sm leading-relaxed">{content}</p>
                </div>
            </div>
        </Wrapper>
    )
}
