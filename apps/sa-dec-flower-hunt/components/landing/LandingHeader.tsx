"use client";

// ============================================================================
// LANDING HEADER - Extracted from LandingPageClient
// ============================================================================

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

interface LandingHeaderProps {
    onLoginClick: () => void;
}

export function LandingHeader({ onLoginClick }: LandingHeaderProps) {
    const { t } = useLanguage();

    return (
        <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-40">
            <nav className="container mx-auto px-6 py-3 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-emerald-900/50 border border-emerald-500/30 flex items-center justify-center">
                        <span className="text-xs">💠</span>
                    </div>
                    <h1 className="text-sm font-bold tracking-[0.2em] font-mono text-white">
                        AGRIOS<span className="text-emerald-500">.tech</span>
                    </h1>
                </div>

                {/* Status indicators */}
                <div className="hidden md:flex items-center gap-6 text-[10px] font-mono text-stone-500 tracking-widest uppercase">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{t("common.sys_nominal")}</span>
                    </div>
                    <span className="hover:text-emerald-400 cursor-pointer transition-colors">
                        {t("common.nodes")}: 1,402
                    </span>
                    <span className="hover:text-emerald-400 cursor-pointer transition-colors">
                        {t("common.volume")}: $2.4M
                    </span>
                </div>

                {/* Login button */}
                <Button
                    onClick={onLoginClick}
                    variant="outline"
                    className="bg-emerald-900/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 font-mono text-[10px] tracking-widest h-8"
                >
                    {t("nav.login_terminal")}
                </Button>
            </nav>
        </header>
    );
}
