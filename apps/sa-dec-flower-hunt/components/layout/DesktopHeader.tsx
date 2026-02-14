"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AgriosVectorLogo } from "@/components/brand/AgriosVectorLogo";
import { NeonButton } from "@/components/ui/neon-button";
import { useLanguage } from "@/lib/i18n";
import { WOWLanguageToggle } from "@/components/wow/WOWLanguageToggle";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
    ShoppingBag, Map, ScanLine, Sprout, ChevronDown,
    Sparkles, Trophy, Home as HomeIcon, Tent,
    Truck, Store, Users, TreeDeciduous, Heart,
    Info, Phone, FileText, Briefcase
} from "lucide-react";

// Type for navigation items
interface NavItem {
    href: string;
    labelKey: string; // i18n key
    icon: any;
    hot?: boolean;
}

interface NavSection {
    labelKey: string; // i18n key
    icon: any;
    items: NavItem[];
}

// Navigation Structure - Uses i18n keys for full translation support
const getNavStructure = (t: (key: string) => string): Record<string, { label: string; icon: any; items: { href: string; label: string; icon: any; hot?: boolean }[] }> => ({
    explore: {
        label: t('megamenu.explore'),
        icon: Sparkles,
        items: [
            { href: "/festival", label: t('megamenu.festival'), icon: Sparkles, hot: true },
            { href: "/hub", label: t('megamenu.hub'), icon: HomeIcon },
            { href: "/farmstay", label: t('megamenu.farmstay'), icon: Tent },
            { href: "/leaderboard", label: t('megamenu.leaderboard'), icon: Trophy },
            { href: "/map", label: t('megamenu.flower_map'), icon: Map },
        ]
    },
    commerce: {
        label: t('megamenu.commerce'),
        icon: ShoppingBag,
        items: [
            { href: "/shop", label: t('megamenu.shop'), icon: ShoppingBag },
            { href: "/hunt", label: t('megamenu.ar_hunt'), icon: ScanLine, hot: true },
            { href: "/adopt", label: t('megamenu.adopt'), icon: Heart },
            { href: "/badges", label: t('megamenu.badges'), icon: Trophy },
        ]
    },
    partners: {
        label: t('megamenu.partners'),
        icon: Users,
        items: [
            { href: "/partner", label: t('megamenu.partner_portal'), icon: Sprout },
            { href: "/suppliers", label: t('megamenu.suppliers'), icon: Store },
            { href: "/trader", label: t('megamenu.traders'), icon: Briefcase },
            { href: "/logistics", label: t('megamenu.logistics'), icon: Truck },
        ]
    },
});

export function DesktopHeader() {
    const pathname = usePathname();
    const { t, language } = useLanguage();
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // Get translated nav structure
    const NAV_STRUCTURE = getNavStructure(t);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 hidden md:block">
            <div className="flex items-center justify-between px-8 py-3 bg-black/70 backdrop-blur-xl border-b border-white/5">
                {/* Logo */}
                <Link href="/" className="flex items-center group">
                    <AgriosVectorLogo className="h-10 w-auto group-hover:drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all" variant="full" />
                </Link>

                {/* Main Navigation */}
                <nav className="flex items-center gap-1">
                    {Object.entries(NAV_STRUCTURE).map(([key, section]) => (
                        <div
                            key={key}
                            className="relative"
                            onMouseEnter={() => setOpenDropdown(key)}
                            onMouseLeave={() => setOpenDropdown(null)}
                        >
                            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-stone-300 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                                <section.icon className="w-4 h-4" />
                                {section.label}
                                <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === key ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {openDropdown === key && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full left-0 mt-1 w-56 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                                    >
                                        {section.items.map((item) => {
                                            const isActive = pathname === item.href;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${isActive
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : 'text-stone-400 hover:bg-white/5 hover:text-white'
                                                        }`}
                                                >
                                                    <item.icon className="w-4 h-4" />
                                                    {item.label}
                                                    {item.hot && (
                                                        <span className="ml-auto text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                                            HOT
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}

                    {/* Direct Links */}
                    <Link
                        href="/insights"
                        className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/5 ${pathname === '/insights' ? 'text-emerald-400' : 'text-stone-300 hover:text-white'
                            }`}
                    >
                        {t('megamenu.insights')}
                    </Link>
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <WOWLanguageToggle />
                    <Link href="/farmer">
                        <NeonButton variant="outline" className="h-9 px-4 text-xs">
                            {t('megamenu.login')}
                        </NeonButton>
                    </Link>
                </div>
            </div>
        </header>
    );
}

