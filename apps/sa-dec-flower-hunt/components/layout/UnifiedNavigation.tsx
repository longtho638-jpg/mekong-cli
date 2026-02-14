"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    Map,
    ShoppingBag,
    ScanLine,
    Menu,
    X,
    Tractor,
    Truck,
    Store,
    Briefcase,
    Cpu,
    Users,
    Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import { supabase } from "@/lib/supabase"; // Import Supabase Client

const APP_VERSION = "v1.0.1-unified";

export function UnifiedNavigation() {
    const pathname = usePathname();
    const { t, language, setLanguage } = useLanguage();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Auth State
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Check Authentication on Mount
    useEffect(() => {
        const checkAuth = async () => {
            if (!supabase) {
                setIsCheckingAuth(false);
                return;
            }
            const { data } = await supabase.auth.getSession();
            setIsAuthenticated(!!data.session);
            setIsCheckingAuth(false);
        };
        checkAuth();
    }, []);

    // Handle scroll for glassmorphism effect intensity
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navItems = [
        { href: "/", icon: Home, label: t('nav.home') },
        { href: "/map", icon: Map, label: t('nav.map') },
        { href: "/scan", icon: ScanLine, label: t('nav.scan'), isFloat: true },
        { href: "/shop", icon: ShoppingBag, label: t('nav.shop') },
        {
            isMenuTrigger: true,
            icon: isMenuOpen ? X : Menu,
            label: t('nav.menu')
        },
    ];

    const toggleLanguage = () => {
        setLanguage(language === 'vi' ? 'en' : 'vi');
    };

    // LOGIC:
    // 1. If checking auth, show nothing (prevent flash)
    // 2. If NOT authenticated, return NULL (Hide on Mobile for Guests)
    // 3. CSS: 'md:hidden' will handle Desktop hiding in the JSX wrapper below
    if (isCheckingAuth || !isAuthenticated) return null;

    return (
        <>
            {/* MEGA MENU OVERLAY */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-20 pb-32 px-6 overflow-y-auto"
                    >
                        <div className="max-w-md mx-auto space-y-8">

                            {/* Language Switcher (Premium) */}
                            <div className="flex justify-end">
                                <button
                                    onClick={toggleLanguage}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all font-mono text-sm text-emerald-400"
                                >
                                    <Globe className="w-4 h-4" />
                                    <span>{language === 'vi' ? 'VIETNAMESE' : 'ENGLISH'}</span>
                                </button>
                            </div>

                            {/* Value Chain Section */}
                            <section>
                                <h3 className="text-emerald-400 font-bold text-sm tracking-wider uppercase mb-4">
                                    {t('nav.value_chain')}
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <MenuLink
                                        href="/farmer"
                                        icon={Tractor}
                                        title={t('nav.farmer')}
                                        desc={t('nav.farmer_desc')}
                                    />
                                    <MenuLink
                                        href="/trader"
                                        icon={Store}
                                        title={t('nav.trader')}
                                        desc={t('nav.trader_desc')}
                                    />
                                    <MenuLink
                                        href="/suppliers"
                                        icon={Briefcase}
                                        title={t('nav.suppliers')}
                                        desc={t('nav.suppliers_desc')}
                                    />
                                    <MenuLink
                                        href="/logistics"
                                        icon={Truck}
                                        title={t('nav.logistics')}
                                        desc={t('nav.logistics_desc')}
                                    />
                                </div>
                            </section>

                            {/* Enterprise Section */}
                            <section>
                                <h3 className="text-blue-400 font-bold text-sm tracking-wider uppercase mb-4">
                                    {t('nav.enterprise')}
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <MenuLink
                                        href="/admin/leadership"
                                        icon={Users}
                                        title={t('nav.leadership')}
                                        desc={t('nav.leadership_desc')}
                                    />
                                    <MenuLink
                                        href="/admin/command-center"
                                        icon={Cpu}
                                        title={t('nav.command')}
                                        desc={t('nav.command_desc')}
                                    />
                                </div>
                            </section>

                            {/* Version Tag */}
                            <div className="text-center mt-12">
                                <p className="text-xs text-white/30 font-mono">
                                    {t('nav.deployment_ver')}: <span className="text-emerald-500">{APP_VERSION}</span>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BOTTOM "ISLAND" NAVIGATION - MOBILE ONLY (Logged In) */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[420px] md:hidden">
                <div
                    className={`
            relative flex items-center justify-between px-6 py-4 rounded-full 
            transition-all duration-300 border border-white/10 shadow-2xl
            ${isScrolled || isMenuOpen ? "bg-black/80 backdrop-blur-xl" : "bg-black/60 backdrop-blur-lg"}
          `}
                >
                    {navItems.map((item, idx) => {
                        if (item.isMenuTrigger) {
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className={`flex flex-col items-center gap-1 transition-colors ${isMenuOpen ? "text-white" : "text-white/60 hover:text-white"}`}
                                >
                                    <item.icon className="w-6 h-6" />
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </button>
                            );
                        }

                        if (item.isFloat) {
                            return (
                                <Link
                                    key={idx}
                                    href={item.href || "#"}
                                    className="relative -top-8"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <div className="
                    flex flex-col items-center justify-center w-16 h-16 
                    bg-gradient-to-tr from-emerald-500 to-lime-400 
                    rounded-full shadow-lg shadow-emerald-500/30 
                    border-4 border-black transition-transform hover:scale-110 active:scale-95
                  ">
                                        <item.icon className="w-7 h-7 text-black" />
                                    </div>
                                </Link>
                            );
                        }

                        return (
                            <Link
                                key={idx}
                                href={item.href || "#"}
                                onClick={() => setIsMenuOpen(false)}
                                className={`
                  flex flex-col items-center gap-1 transition-colors 
                  ${pathname === item.href ? "text-emerald-400" : "text-white/60 hover:text-white"}
                `}
                            >
                                <item.icon className="w-6 h-6" />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}

function MenuLink({ href, icon: Icon, title, desc }: { href: string, icon: any, title: string, desc: string }) {
    return (
        <Link
            href={href}
            className="
        flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 
        hover:bg-white/10 hover:border-emerald-500/50 transition-all group
      "
        >
            <div className="p-2 rounded-full bg-white/10 w-fit group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-400">{title}</h4>
                <p className="text-xs text-white/50">{desc}</p>
            </div>
        </Link>
    );
}
