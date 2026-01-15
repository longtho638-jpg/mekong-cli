'use client'

import Link from 'next/link'

export function Footer() {
    const footerLinks = {
        Product: [
            { name: 'Features', href: '#features' },
            { name: 'Pricing', href: '/pricing' },
            { name: 'Marketplace', href: '#marketplace' },
            { name: 'Changelog', href: '#' },
        ],
        Resources: [
            { name: 'Documentation', href: '#' },
            { name: 'API Reference', href: '#' },
            { name: 'Guides', href: '#' },
            { name: 'Support', href: '#' },
        ],
        Company: [
            { name: 'About', href: '#' },
            { name: 'Blog', href: '#' },
            { name: 'Careers', href: '#' },
            { name: 'Contact', href: '#' },
        ],
        Legal: [
            { name: 'Privacy', href: '#' },
            { name: 'Terms', href: '#' },
            { name: 'Security', href: '#' },
            { name: 'License', href: '#' },
        ],
    }

    const socialLinks = [
        { name: 'GitHub', icon: '⚡', href: '#' },
        { name: 'Twitter', icon: '🐦', href: '#' },
        { name: 'Discord', icon: '💬', href: '#' },
        { name: 'LinkedIn', icon: '💼', href: '#' },
    ]

    return (
        <footer className="border-t border-white/10 bg-black py-16 relative z-10">
            <div className="max-w-7xl mx-auto px-6">
                {/* Top Section */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
                    {/* Brand Column */}
                    <div className="col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg">
                                🏯
                            </div>
                            <span className="text-lg font-bold text-white">Agency OS</span>
                        </div>
                        <p className="text-sm text-white/40 leading-relaxed mb-6">
                            Open Source Agency Operating System.
                            <br />
                            Built for the bold.
                        </p>
                        {/* Social Links */}
                        <div className="flex gap-3">
                            {socialLinks.map((social) => (
                                <Link
                                    key={social.name}
                                    href={social.href}
                                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-300 group"
                                    aria-label={social.name}
                                >
                                    <span className="text-lg group-hover:scale-110 transition-transform">
                                        {social.icon}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h3 className="text-sm font-semibold text-white mb-4">{category}</h3>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-white/40 hover:text-white transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Section */}
                <div className="pt-8 border-t border-white/5">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-white/20 font-mono">
                            © 2026 Mekong HQ. All rights reserved. System Status: Nominal.
                        </p>
                        <div className="flex gap-6 text-xs text-white/20">
                            <span>Built with 🏯 in Vietnam</span>
                            <span>•</span>
                            <span>Open Source</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
