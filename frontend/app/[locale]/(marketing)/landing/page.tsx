'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Footer } from '@/components/md3/MD3Footer';
import { MD3FilledButton, MD3OutlinedButton } from '@/components/md3/MD3Button';
import { ArrowRight, Zap, Users, TrendingUp, Bot, BookOpen, Target, Sparkles, Rocket, Shield, Globe, Cpu } from 'lucide-react';
import { AnimatedNumber, AnimatedCurrency } from '@/components/ui/AnimatedNumber';
import { motion } from 'framer-motion';

/**
 * 🏯 LANDING PAGE v4 (WOW EDITION)
 * 
 * "Max Level WOW MD3":
 * - Aurora Gradients (Animated)
 * - Glassmorphism (Backdrop Blur)
 * - Bento Grid (Dynamic Layout)
 * - Typography: Plus Jakarta Sans / Outfit (via tokens)
 */

const AuroraBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] delay-2000" />
    </div>
);

const BentoCard = ({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className={`group relative overflow-hidden rounded-[32px] border border-white/5 bg-[#1A1A1A]/60 backdrop-blur-xl hover:bg-[#1A1A1A]/80 transition-all duration-300 hover:border-white/10 hover:shadow-2xl ${className}`}
    >
        {/* Glow Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        {children}
    </motion.div>
);

export default function LandingPage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics } = useAnalytics();
    const t = useTranslations('Landing');

    return (
        <>
            <AuroraBackground />

            {/* === HEADER === */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-[#121212]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-purple-500/20">🏯</div>
                        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Agency OS</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        {['Hubs', 'Agents', 'Binh Phap', 'Pricing'].map((item) => (
                            <Link key={item} href={`/${locale}/${item.toLowerCase().replace(' ', '-')}`} className="text-sm font-medium text-white/60 hover:text-white transition-colors relative group">
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all group-hover:w-full" />
                            </Link>
                        ))}
                    </nav>
                    <MD3FilledButton size="medium" icon={<ArrowRight className="w-4 h-4" />}>Get Started</MD3FilledButton>
                </div>
            </header>

            {/* === HERO === */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 mb-8 backdrop-blur-md"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-semibold tracking-wide">THE FUTURE OF AGENCIES IS HERE</span>
                    </motion.div>

                    <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-[1.1] tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">WIN-WIN-WIN</span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 animate-gradient-x">Operating System</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Combine AI automation with ancient strategic wisdom.
                        Deploy your <span className="text-white font-medium">Agency Empire</span> in 15 minutes.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
                        <Link href={`/${locale}/hubs`} className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                            Explore Hubs
                            <ArrowRight className="w-5 h-5 inline-block ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href={`/${locale}/pricing-plans`} className="px-8 py-4 rounded-full border border-white/20 text-white font-medium hover:bg-white/5 transition-colors backdrop-blur-sm">
                            View Pricing
                        </Link>
                    </div>

                    {/* Stats Glass Strip */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-3 divide-x divide-white/10 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md p-6 max-w-4xl mx-auto"
                    >
                        {[
                            { label: 'Total Revenue', value: analytics.totalRevenue, type: 'currency' },
                            { label: 'Active Clients', value: analytics.activeClients, type: 'number' },
                            { label: 'Projects', value: analytics.totalProjects, type: 'number' }
                        ].map((stat, i) => (
                            <div key={i} className="text-center px-4">
                                <div className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                                    {stat.type === 'currency' ? <AnimatedCurrency value={stat.value} /> : <AnimatedNumber value={stat.value} />}
                                </div>
                                <div className="text-sm font-medium text-white/40 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* === BENTO GRID FEATURES === */}
            <section className="px-6 py-24 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16 text-center">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to <span className="text-purple-400">Scale</span></h2>
                        <p className="text-white/50 text-lg">Powerful modules designed for modern agency warfare.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
                        {/* Large Card: Hubs */}
                        <BentoCard className="md:col-span-2 md:row-span-2 p-8 flex flex-col justify-between bg-gradient-to-br from-[#1A1A1A]/60 to-purple-900/10">
                            <div>
                                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6">
                                    <Target className="w-8 h-8 text-purple-400" />
                                </div>
                                <h3 className="text-3xl font-bold mb-4">168 Modules</h3>
                                <p className="text-white/60 text-lg leading-relaxed mb-6">
                                    Complete agency management suite covering every aspect from CRM to Finance.
                                    The ultimate arsenal for your business.
                                </p>
                            </div>
                            <MD3OutlinedButton className="w-fit" icon={<ArrowRight className="w-4 h-4" />}>Explore All Modules</MD3OutlinedButton>
                        </BentoCard>

                        {/* Medium Card: AI */}
                        <BentoCard className="md:col-span-2 p-8 flex items-center gap-8" delay={0.2}>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold mb-2">156 AI Agents</h3>
                                <p className="text-white/60 mb-4">Autonomous workforce ready to deploy.</p>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">GPT-4</span>
                                    <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">Claude 3</span>
                                </div>
                            </div>
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 blur-2xl opacity-50" />
                            <Bot className="w-16 h-16 text-blue-400 relative z-10" />
                        </BentoCard>

                        {/* Small Card: Binh Phap */}
                        <BentoCard className="p-8 flex flex-col justify-center" delay={0.3}>
                            <BookOpen className="w-10 h-10 text-pink-400 mb-4" />
                            <h3 className="text-xl font-bold mb-2">13 Binh Pháp</h3>
                            <p className="text-white/50 text-sm">Strategic wisdom integrated into code.</p>
                        </BentoCard>

                        {/* Small Card: Analytics */}
                        <BentoCard className="p-8 flex flex-col justify-center" delay={0.4}>
                            <TrendingUp className="w-10 h-10 text-green-400 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Realtime Stats</h3>
                            <p className="text-white/50 text-sm">Powered by Supabase & Next.js 14.</p>
                        </BentoCard>
                    </div>
                </div>
            </section>

            {/* === TRUST GRID === */}
            <section className="px-6 py-24 bg-[#0A0A0A]">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { icon: Shield, label: 'Enterprise Security', desc: 'Bank-grade encryption' },
                        { icon: Globe, label: 'Global CDN', desc: 'Edge deployment' },
                        { icon: Cpu, label: 'Serverless', desc: 'Infinite scalability' },
                        { icon: Zap, label: 'Instant Updates', desc: 'CI/CD Automated' },
                    ].map((item, i) => (
                        <div key={i} className="flex gap-4 items-start">
                            <item.icon className="w-6 h-6 text-white/30" />
                            <div>
                                <h4 className="font-bold text-white mb-1">{item.label}</h4>
                                <p className="text-sm text-white/40">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <MD3Footer locale={locale} />
        </>
    );
}
