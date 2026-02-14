"use client";

import Link from "next/link";
import { AgriosVectorLogo } from "@/components/brand/AgriosVectorLogo";
import { useLanguage } from "@/lib/i18n";
import {
    Facebook, Instagram, Youtube,
    Mail, Phone, MapPin
} from "lucide-react";

// Footer Structure - Uses i18n keys for full translation support
const getFooterLinks = (t: (key: string) => string) => ({
    company: {
        label: t('footer.company'),
        items: [
            { href: "/about", label: t('footer.about') },
            { href: "/founding", label: t('footer.story') },
            { href: "/contact", label: t('footer.contact') },
            { href: "/insights", label: t('footer.insights') },
        ]
    },
    legal: {
        label: t('footer.legal'),
        items: [
            { href: "/terms", label: t('footer.terms') },
            { href: "/privacy", label: t('footer.privacy') },
            { href: "/payment-policy", label: t('footer.payments') },
        ]
    },
    business: {
        label: t('footer.business'),
        items: [
            { href: "/partner", label: t('footer.partners') },
            { href: "/suppliers", label: t('footer.suppliers') },
            { href: "/investor", label: t('footer.investors') },
            { href: "/fintech", label: t('footer.fintech') },
        ]
    },
    features: {
        label: t('footer.features'),
        items: [
            { href: "/festival", label: t('footer.festival') },
            { href: "/hunt", label: t('footer.ar_hunt') },
            { href: "/adopt", label: t('footer.adopt') },
            { href: "/leaderboard", label: t('footer.ranks') },
        ]
    }
});

export function GlobalFooter() {
    const { t } = useLanguage();
    const currentYear = new Date().getFullYear();
    const FOOTER_LINKS = getFooterLinks(t);

    return (
        <footer className="bg-black border-t border-white/5 text-stone-400">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-1 space-y-4">
                        <AgriosVectorLogo variant="full" className="h-10" animate={false} />
                        <p className="text-sm text-stone-500 leading-relaxed">
                            {t('footer.tagline')}
                        </p>
                        {/* Social Links */}
                        <div className="flex gap-3 pt-2">
                            <a href="https://facebook.com/agrios.tech" target="_blank" rel="noopener noreferrer"
                                className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors">
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a href="https://instagram.com/agrios.tech" target="_blank" rel="noopener noreferrer"
                                className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors">
                                <Instagram className="w-4 h-4" />
                            </a>
                            <a href="https://youtube.com/@agrios.tech" target="_blank" rel="noopener noreferrer"
                                className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors">
                                <Youtube className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(FOOTER_LINKS).map(([key, section]) => (
                        <div key={key} className="space-y-4">
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                                {section.label}
                            </h3>
                            <ul className="space-y-2">
                                {section.items.map((item) => (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className="text-sm hover:text-emerald-400 transition-colors"
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Contact Bar */}
                <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-6 text-sm">
                    <a href="mailto:hello@agrios.tech" className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                        <Mail className="w-4 h-4" />
                        hello@agrios.tech
                    </a>
                    <a href="tel:+84939888888" className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                        <Phone className="w-4 h-4" />
                        0939 888 888
                    </a>
                    <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {t('footer.location')}
                    </span>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/5 py-4">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-stone-500">
                    <p>© {currentYear} AGRIOS Tech. {t('footer.copyright')}</p>
                    <p className="font-mono text-emerald-500/50">
                        GARDEN_OS v2.0 // NODE_ACTIVE
                    </p>
                </div>
            </div>
        </footer>
    );
}

