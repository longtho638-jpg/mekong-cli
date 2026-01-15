'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export function Navigation() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-nav' : 'border-b border-white/5 bg-black/30 backdrop-blur-lg'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all duration-300">
                        🏯
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white group-hover:text-purple-200 transition-colors">
                        Agency OS
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/60 border border-white/10">
                        v2026
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    {['Features', 'Marketplace', 'Docs', 'GitHub'].map((item) => (
                        <Link
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="text-sm font-medium text-white/60 hover:text-white transition-colors"
                        >
                            {item}
                        </Link>
                    ))}
                    <div className="h-4 w-px bg-white/10" />
                    <Link
                        href="/auth/login"
                        className="text-sm font-medium text-white hover:text-purple-400 transition-colors"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/auth/signup"
                        className="px-5 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-all duration-300 magnetic-hover"
                    >
                        Get Started
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-white/60 hover:text-white"
                    aria-label="Menu"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                </button>
            </div>
        </nav>
    )
}
