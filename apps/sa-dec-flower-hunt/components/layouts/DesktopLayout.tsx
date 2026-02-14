"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, User, Scan, ShoppingCart, Menu, Terminal, Activity, Zap, Command, Shield } from "lucide-react";
import { LoginModal } from "@/components/LoginModal";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { WOWLanguageToggle } from "@/components/wow/WOWLanguageToggle";

interface DesktopLayoutProps {
    children: React.ReactNode;
    onLoginClick: () => void;
}

/**
 * Desktop Layout - Agri-OS Command Center
 * Features: Cyberpunk Sidebar, System Status, Terminal Navigation
 */
export function DesktopLayout({ children, onLoginClick }: DesktopLayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const { t } = useLanguage();

    const menuItems = [
        { href: "/", icon: Terminal, label: t("sidebar.main") },
        { href: "/shop", icon: ShoppingCart, label: t("sidebar.market") },
        { href: "/scan", icon: Scan, label: t("sidebar.scan") },
        { href: "/campaign", icon: Zap, label: t("sidebar.event") },
        { href: "/partner", icon: Shield, label: t("sidebar.alliance") },
        { href: "/blog", icon: Command, label: t("sidebar.data") },
    ];

    return (
        <div className="min-h-screen bg-stone-950 flex text-white font-sans selection:bg-emerald-500/30">
            {/* Cyberpunk Sidebar */}
            <aside className="w-72 bg-black border-r border-emerald-900/30 fixed h-full overflow-y-auto z-50">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-5 pointer-events-none" />

                <div className="p-6 relative z-10">
                    {/* System Logo */}
                    <div className="mb-10 pl-2 border-l-2 border-emerald-500/50">
                        <h1 className="text-xl font-bold font-mono tracking-tighter text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                            SA_DEC_OS <span className="text-[10px] text-emerald-500/50 align-top">v3.0</span>
                        </h1>
                        <p className="text-emerald-500/40 text-[10px] font-mono mt-1 tracking-widest uppercase">
                            {t("system.subtitle")}
                        </p>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="space-y-1 mb-10">
                        <div className="text-[10px] font-mono text-stone-500 mb-4 px-2 tracking-widest">
                            {t("sidebar.modules")}
                        </div>
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link key={item.href} href={item.href}>
                                    <Button
                                        variant="ghost"
                                        className={`w-full justify-start gap-3 h-12 font-mono text-sm tracking-wide transition-all duration-300 group relative overflow-hidden ${isActive
                                            ? 'bg-emerald-900/10 text-emerald-400 border-r-2 border-emerald-500'
                                            : 'text-stone-400 hover:text-emerald-300 hover:bg-emerald-950/30'
                                            }`}
                                    >
                                        <div className={`absolute inset-0 bg-emerald-500/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ${isActive ? 'translate-x-0' : ''}`} />
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400 animate-pulse' : 'text-stone-600 group-hover:text-emerald-500'}`} />
                                        <span className="relative z-10">{item.label}</span>
                                        {isActive && <span className="absolute right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />}
                                    </Button>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* System Status Panel */}
                    <div className="p-4 bg-black/40 border border-emerald-900/30 rounded mb-8 relative group overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500/20 group-hover:animate-scan-fast" />
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                                {t("status.system")}
                            </p>
                            <span className="text-[9px] font-mono text-emerald-900">{t("status.nominal")}</span>
                        </div>

                        <div className="space-y-2 font-mono text-[10px] text-emerald-500/70">
                            <div className="flex justify-between items-center">
                                <span>&gt; {t("status.network")}</span>
                                <span className="text-emerald-400">{t("status.online")}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>&gt; {t("status.nodes")}</span>
                                <span className="text-emerald-400">1,402</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>&gt; {t("status.secure_key")}</span>
                                <span className="text-emerald-400">*****</span>
                            </div>
                        </div>
                    </div>

                    {/* Language Toggle */}
                    <div className="mb-4">
                        <WOWLanguageToggle />
                    </div>

                    {/* Auth Button */}
                    <div className="pt-4 border-t border-emerald-900/30">
                        <Button
                            className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:border-emerald-400 h-10 font-mono text-xs tracking-wider group relative overflow-hidden"
                            onClick={onLoginClick}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                <User className="w-3 h-3" />
                                {t("cmd.access")}
                            </span>
                            <div className="absolute inset-0 bg-emerald-400/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                        </Button>
                    </div>
                </div>

                {/* Decor */}
                <div className="absolute bottom-4 left-6 text-[9px] font-mono text-stone-700">
                    ID: 8492-AX // SA_DEC
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="ml-72 flex-1 p-0 relative min-h-screen">
                <div className="fixed top-0 left-72 right-0 h-1 bg-gradient-to-r from-emerald-500/50 to-transparent z-40 opacity-20" />
                <div className="max-w-7xl mx-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
