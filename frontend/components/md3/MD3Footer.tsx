'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react';

/**
 * 🦶 MD3 Footer Component
 * Fixes the void at page bottom
 */

export function MD3Footer({ locale = 'en' }: { locale?: string }) {
    const year = new Date().getFullYear();

    return (
        <footer className="mt-auto border-t border-white/10 bg-black/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">🏯</span>
                            <span className="font-bold text-lg">Agency OS</span>
                        </div>
                        <p className="text-gray-400 text-sm max-w-xs">
                            WIN-WIN-WIN Operating System for Modern Agencies.
                            Powered by AI & Binh Pháp Strategy.
                        </p>
                        <div className="flex gap-4 mt-4">
                            <a href="https://github.com" className="text-gray-400 hover:text-white transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="https://twitter.com" className="text-gray-400 hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="https://linkedin.com" className="text-gray-400 hover:text-white transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="mailto:hello@agencyos.network" className="text-gray-400 hover:text-white transition-colors">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-300">Platform</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href={`/${locale}/hubs`} className="hover:text-white transition-colors">Hubs</Link></li>
                            <li><Link href={`/${locale}/dashboard`} className="hover:text-white transition-colors">Dashboard</Link></li>
                            <li><Link href={`/${locale}/analytics`} className="hover:text-white transition-colors">Analytics</Link></li>
                            <li><Link href={`/${locale}/agents`} className="hover:text-white transition-colors">AI Agents</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-300">Resources</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href={`/${locale}/binhphap`} className="hover:text-white transition-colors">Binh Pháp</Link></li>
                            <li><Link href={`/${locale}/pricing-plans`} className="hover:text-white transition-colors">Pricing</Link></li>
                            <li><a href="https://docs.agencyos.network" className="hover:text-white transition-colors">Docs</a></li>
                            <li><a href="https://github.com/agencyos" className="hover:text-white transition-colors">GitHub</a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-500">
                        © {year} Agency OS. All rights reserved.
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                        Made with <Heart className="w-4 h-4 text-red-500 mx-1" /> by Mekong Team
                    </div>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">Privacy</Link>
                        <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">Terms</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default MD3Footer;
