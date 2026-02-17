"use client";

import {
    Zap,
    Shield,
    TrendingUp,
    Bot,
    ArrowRight,
    Terminal,
    Wallet,
    Activity,
} from "lucide-react";

const stats = [
    { label: "AUTOMATION RATE", value: "99.7%", icon: Bot },
    { label: "ROI MULTIPLIER", value: "12.4x", icon: TrendingUp },
    { label: "UPTIME SLA", value: "99.99%", icon: Shield },
    { label: "ACTIVE AGENTS", value: "1,247", icon: Activity },
];

const features = [
    {
        icon: Bot,
        title: "AI AGENT SWARM",
        description:
            "Deploy autonomous agents that work 24/7. Self-healing, self-optimizing, self-scaling.",
        accent: "from-cyan-400 to-blue-500",
    },
    {
        icon: TrendingUp,
        title: "PREDICTIVE ROI ENGINE",
        description:
            "Machine learning models that forecast and maximize returns before the market moves.",
        accent: "from-purple-400 to-pink-500",
    },
    {
        icon: Shield,
        title: "ENTERPRISE SECURITY",
        description:
            "Military-grade encryption. Zero-trust architecture. Your assets, impenetrable.",
        accent: "from-green-400 to-emerald-500",
    },
    {
        icon: Zap,
        title: "INSTANT DEPLOYMENT",
        description:
            "From zero to production in 60 seconds. One command. Full infrastructure.",
        accent: "from-yellow-400 to-orange-500",
    },
];

export default function HomePage() {
    return (
        <main className="relative min-h-screen overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 cyber-grid-bg" />
            <div className="glow-orb w-[600px] h-[600px] bg-cyber-cyan/20 -top-40 -left-40" />
            <div className="glow-orb w-[500px] h-[500px] bg-cyber-magenta/20 top-1/3 -right-40" />
            <div className="glow-orb w-[400px] h-[400px] bg-cyber-purple/20 bottom-20 left-1/3" />

            {/* Scan Line Effect */}
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-[0.03]">
                <div className="w-full h-[2px] bg-cyber-cyan animate-scan-line" />
            </div>

            {/* Navigation */}
            <nav className="relative z-40 flex items-center justify-between px-6 lg:px-12 py-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-cyan to-cyber-magenta flex items-center justify-center">
                        <Terminal className="w-5 h-5 text-cyber-bg" />
                    </div>
                    <span className="font-mono font-bold text-lg tracking-wider">
                        LOBSTER<span className="text-cyber-cyan">_</span>EMPIRE
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    <a
                        href="#features"
                        className="text-sm text-gray-400 hover:text-cyber-cyan transition-colors font-mono"
                    >
                        FEATURES
                    </a>
                    <a
                        href="#stats"
                        className="text-sm text-gray-400 hover:text-cyber-cyan transition-colors font-mono"
                    >
                        METRICS
                    </a>
                    <a
                        href="#deploy"
                        className="text-sm text-gray-400 hover:text-cyber-cyan transition-colors font-mono"
                    >
                        DEPLOY
                    </a>
                </div>

                <button className="cyber-btn-outline flex items-center gap-2 text-sm">
                    <Wallet className="w-4 h-4" />
                    CONNECT WALLET
                </button>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-6 text-center">
                {/* Status Badge */}
                <div className="cyber-border rounded-full px-5 py-2 mb-8 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
                    <span className="text-xs font-mono text-gray-400 tracking-widest uppercase">
                        SYSTEM OPERATIONAL — v0.1.0 GENESIS
                    </span>
                </div>

                {/* Main Headline */}
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-6">
                    <span className="block text-white">ROI AS A</span>
                    <span className="block cyber-text-gradient">SERVICE</span>
                </h1>

                {/* Subtitle */}
                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-4 font-light leading-relaxed">
                    AUTOMATION FOR 2026
                </p>
                <p className="text-sm md:text-base text-gray-500 max-w-xl mb-10 leading-relaxed">
                    Deploy autonomous AI agents that generate, optimize, and compound your
                    returns. Built for the machines. Controlled by you.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-16">
                    <button className="cyber-btn-primary flex items-center justify-center gap-2">
                        LAUNCH DASHBOARD
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    <button className="cyber-btn-outline flex items-center justify-center gap-2">
                        <Wallet className="w-4 h-4" />
                        CONNECT WALLET
                    </button>
                </div>

                {/* Terminal Preview */}
                <div className="w-full max-w-2xl cyber-card text-left">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-cyber-red/60" />
                        <div className="w-3 h-3 rounded-full bg-cyber-yellow/60" />
                        <div className="w-3 h-3 rounded-full bg-cyber-green/60" />
                        <span className="text-xs font-mono text-gray-500 ml-2">
                            lobster-empire:~
                        </span>
                    </div>
                    <div className="font-mono text-sm space-y-2">
                        <p className="text-gray-500">
                            <span className="text-cyber-green">$</span> openclaw deploy
                            --strategy=aggressive --agents=12
                        </p>
                        <p className="text-cyber-cyan">
                            ✓ Deploying 12 autonomous agents...
                        </p>
                        <p className="text-cyber-magenta">
                            ✓ ROI prediction model loaded (97.3% accuracy)
                        </p>
                        <p className="text-cyber-green">
                            ✓ All systems operational. Expected ROI: +340% / quarter
                        </p>
                        <p className="text-gray-400 animate-pulse">
                            <span className="text-cyber-cyan">█</span> Awaiting Đại Tướng
                            Quân&apos;s command...
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section id="stats" className="relative z-10 py-20 px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => (
                        <div key={stat.label} className="cyber-card text-center">
                            <stat.icon className="w-8 h-8 text-cyber-cyan mx-auto mb-3" />
                            <p className="text-3xl md:text-4xl font-black text-white mb-1 font-mono">
                                {stat.value}
                            </p>
                            <p className="text-xs font-mono text-gray-500 tracking-widest">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative z-10 py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-xs font-mono text-cyber-cyan tracking-[0.3em] mb-4">
                            CORE CAPABILITIES
                        </p>
                        <h2 className="text-4xl md:text-5xl font-black text-white">
                            THE <span className="cyber-text-gradient">ARSENAL</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {features.map((feature) => (
                            <div key={feature.title} className="cyber-card group">
                                <div
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.accent} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                                >
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 font-mono tracking-wide">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Deploy CTA Section */}
            <section id="deploy" className="relative z-10 py-32 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-xs font-mono text-cyber-green tracking-[0.3em] mb-4">
                        READY TO DEPLOY
                    </p>
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
                        ONE COMMAND.
                        <br />
                        <span className="cyber-text-gradient">INFINITE ROI.</span>
                    </h2>
                    <p className="text-gray-400 max-w-xl mx-auto mb-10">
                        Stop building. Start deploying. The Lobster Empire awaits your
                        command, Đại Tướng Quân.
                    </p>

                    <div className="cyber-card max-w-lg mx-auto text-left mb-10">
                        <div className="font-mono text-sm">
                            <p className="text-gray-500 mb-1">
                                # Deploy the entire empire
                            </p>
                            <p>
                                <span className="text-cyber-green">$</span>{" "}
                                <span className="text-white">make up</span>
                            </p>
                        </div>
                    </div>

                    <button className="cyber-btn-primary text-lg px-10 py-4">
                        BEGIN GENESIS PROTOCOL
                        <ArrowRight className="inline w-5 h-5 ml-2" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-cyber-border py-8 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-cyber-cyan" />
                        <span className="font-mono text-sm text-gray-500">
                            LOBSTER_EMPIRE v0.1.0 — GENESIS BUILD
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 font-mono">
                        🦞 DOANH TRẠI TÔM HÙM — Year of the Horse 2026
                    </p>
                </div>
            </footer>
        </main>
    );
}
