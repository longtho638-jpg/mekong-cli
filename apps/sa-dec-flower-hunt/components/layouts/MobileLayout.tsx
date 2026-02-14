"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Scan, Menu, X, Home, FileText, Handshake, Zap, Terminal, Activity, Wifi, Battery } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { WOWLanguageToggle } from "@/components/wow/WOWLanguageToggle";

interface MobileLayoutProps {
    children: React.ReactNode;
    onLoginClick: () => void;
}

/**
 * Mobile Layout - Agri-OS Field Terminal
 * Features: CyberHUD Header, Tactical Bottom Nav, Central Scan FAB
 */
export function MobileLayout({ children, onLoginClick }: MobileLayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const { t } = useLanguage();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="min-h-screen bg-stone-950 pb-24 text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
            {/* Cyber Grid Background */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:30px_30px] z-0 pointer-events-none" />

            {/* Mobile Header - CyberHUD */}
            <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-emerald-900/30 px-4 py-3">
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 -ml-2 rounded text-emerald-500 hover:bg-emerald-900/20 active:scale-95 transition-all"
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                        <div>
                            <h1 className="text-sm font-bold font-mono tracking-tight text-white flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                                SA_DEC_OS <span className="text-[9px] text-emerald-500/50">v3.0</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Status Icons */}
                        <div className="flex items-center gap-1 text-emerald-900/50">
                            <Wifi className="w-3 h-3" />
                            <Battery className="w-3 h-3" />
                        </div>
                        <WOWLanguageToggle />
                        <Button
                            size="sm"
                            onClick={onLoginClick}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 h-8 text-[10px] font-mono tracking-wider"
                        >
                            <User className="w-3 h-3 mr-1" />
                            {t("cmd.login")}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Slide-out Menu - Mission Log */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                    onClick={() => setIsMenuOpen(false)}
                >
                    <div
                        className="w-72 h-full bg-stone-950 border-r border-emerald-900/30 p-6 flex flex-col relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-0 right-0 p-4">
                            <button onClick={() => setIsMenuOpen(false)} className="text-stone-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mt-8 mb-8 pl-4 border-l border-emerald-500/30">
                            <h2 className="text-lg font-mono font-bold text-white">{t("mobile.mission")}</h2>
                            <p className="text-[10px] text-emerald-500/60 font-mono">{t("mobile.menu_title")}</p>
                        </div>

                        <nav className="space-y-4 flex-1">
                            {[
                                { href: "/", icon: Home, label: t("sidebar.main") },
                                { href: "/shop", icon: Zap, label: t("sidebar.market") },
                                { href: "/scan", icon: Scan, label: t("sidebar.scan") },
                                { href: "/blog", icon: FileText, label: t("sidebar.data") },
                                { href: "/partner", icon: Handshake, label: t("sidebar.alliance") },
                            ].map((item) => (
                                <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start gap-4 h-12 text-sm font-mono text-stone-400 hover:text-emerald-400 hover:bg-emerald-900/10 border border-transparent hover:border-emerald-500/20">
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </Button>
                                </Link>
                            ))}
                        </nav>

                        {/* Quick Info */}
                        <div className="p-4 bg-emerald-900/5 border border-emerald-900/30 rounded mt-auto relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500/20 animate-scan-slow" />
                            <p className="text-[10px] font-bold font-mono text-emerald-500 mb-2 uppercase flex items-center gap-2">
                                <Zap className="w-3 h-3" /> {t("mobile.obj")}
                            </p>
                            <p className="text-[10px] text-stone-400 font-mono">&gt; {t("mobile.scan_obj")}</p>
                            <p className="text-[10px] text-stone-400 font-mono">&gt; {t("mobile.earn_obj")}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="px-4 pt-4 relative z-10">
                {children}
            </main>

            {/* Bottom Navigation - Cyber Deck (Glassmorphism) */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-t border-emerald-900/30 pb-safe pt-2">
                <div className="flex items-center justify-between px-6 pb-2 relative">

                    {/* Home */}
                    <Link href="/">
                        <Button variant="ghost" size="sm" className={`flex-col h-auto gap-1 px-1 hover:bg-transparent ${isActive('/') ? 'text-emerald-400' : 'text-stone-600'}`}>
                            <Home className={`w-5 h-5 ${isActive('/') ? 'drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : ''}`} />
                            <span className="text-[9px] font-mono tracking-wide">{t("mobile.base")}</span>
                        </Button>
                    </Link>

                    {/* Shop */}
                    <Link href="/shop" className="mr-8">
                        <Button variant="ghost" size="sm" className={`flex-col h-auto gap-1 px-1 hover:bg-transparent ${isActive('/shop') ? 'text-emerald-400' : 'text-stone-600'}`}>
                            <Zap className={`w-5 h-5 ${isActive('/shop') ? 'drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : ''}`} />
                            <span className="text-[9px] font-mono tracking-wide">{t("mobile.mart")}</span>
                        </Button>
                    </Link>

                    {/* CENTRAL SCAN FAB - THE EYE */}
                    <div className="absolute left-1/2 -top-8 -translate-x-1/2">
                        <Link href="/scan">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-md opacity-20 group-hover:opacity-40 animate-pulse" />
                                <div className="w-16 h-16 bg-black border-2 border-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform">
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                                        <Scan className="w-6 h-6 text-emerald-400" />
                                    </div>
                                </div>
                                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-500 font-mono tracking-widest bg-black px-1">{t("mobile.scan_fab")}</span>
                            </div>
                        </Link>
                    </div>

                    {/* Blog */}
                    <Link href="/blog" className="ml-8">
                        <Button variant="ghost" size="sm" className={`flex-col h-auto gap-1 px-1 hover:bg-transparent ${isActive('/blog') ? 'text-emerald-400' : 'text-stone-600'}`}>
                            <FileText className={`w-5 h-5 ${isActive('/blog') ? 'drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : ''}`} />
                            <span className="text-[9px] font-mono tracking-wide">{t("sidebar.data")}</span>
                        </Button>
                    </Link>

                    {/* Account */}
                    <button onClick={onLoginClick}>
                        <Button variant="ghost" size="sm" className="flex-col h-auto gap-1 px-1 hover:bg-transparent text-stone-600">
                            <User className="w-5 h-5" />
                            <span className="text-[9px] font-mono tracking-wide">{t("mobile.user")}</span>
                        </Button>
                    </button>
                </div>
            </nav>
        </div>
    );
}
