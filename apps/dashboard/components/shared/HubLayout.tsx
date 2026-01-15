'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface HubLayoutProps {
    title: string
    icon: string
    color: string
    subtitle: string
    children: ReactNode
}

export function HubLayout({ title, icon, color, subtitle, children }: HubLayoutProps) {
    return (
        <div className="min-h-screen bg-[#050505] text-white font-mono relative overflow-hidden selection:bg-matrix-green selection:text-black">
            {/* Dynamic Background Glow */}
            <div
                className="fixed -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full opacity-20 blur-3xl pointer-events-none mix-blend-screen"
                style={{
                    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                }}
            />

            {/* Noise Texture */}
            <div className="fixed inset-0 bg-noise opacity-[0.03] pointer-events-none z-0" />

            {/* FAILSAFE LAYOUT: Inline styles to guarantee padding and width */}
            <div
                className="mx-auto px-6 relative z-10"
                style={{
                    paddingTop: '140px',
                    paddingBottom: '80px',
                    maxWidth: '1600px'
                }}
            >
                {/* Header - M3 DNA Compliant */}
                <header
                    className="mb-12"
                    style={{ display: 'flex', gap: 'var(--md-sys-spacing-border-inset, 12px)' }}
                >
                    {/* Accent border - properly separated */}
                    <div
                        style={{
                            width: 4,
                            borderRadius: 4,
                            backgroundColor: color,
                            flexShrink: 0,
                        }}
                    />
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-gap-lg, 16px)', marginBottom: 8 }}
                        >
                            <span className="text-5xl filter drop-shadow-lg">{icon}</span>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase font-mono">
                                {title}
                            </h1>
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-400 text-xl font-mono tracking-wide"
                        >
                            {subtitle}
                        </motion.p>
                    </div>
                </header>

                {/* Content */}
                <main className="min-h-[60vh]">
                    {children}
                </main>

                {/* Footer */}
                <footer
                    className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm"
                    style={{ gap: 'var(--md-sys-spacing-gap-lg, 16px)' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-icon-text-default, 12px)' }}>
                        <span>🏯</span>
                        <span className="font-semibold text-gray-400">Agency OS</span>
                        <span className="bg-white/5 px-2 py-0.5 rounded text-xs border border-white/5">v2.0</span>
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Documentation</a>
                        <a href="#" className="hover:text-white transition-colors">Support</a>
                        <a href="#" className="hover:text-white transition-colors">Status</a>
                    </div>
                </footer>
            </div>
        </div>
    )
}

interface GlowBackgroundProps {
    color: string
}

export function GlowBackground({ color }: GlowBackgroundProps) {
    return (
        <div
            className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0"
            style={{
                background: `radial-gradient(circle at 50% 0%, ${color} 0%, transparent 50%)`,
            }}
        />
    )
}
