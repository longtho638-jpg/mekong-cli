'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const data = [
    { subject: 'Anh WIN', A: 100, fullMark: 100, label: 'Owner Equity' },
    { subject: 'Agency WIN', A: 95, fullMark: 100, label: 'Deal Flow' },
    { subject: 'Startup WIN', A: 90, fullMark: 100, label: 'Growth' },
];

export function HarmonyRadar() {
    return (
        <div className="relative h-full flex flex-col items-center justify-center section-in-fluid">
            <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />

            {/* 3D Glass Container - UPGRADED TO GLASS ULTRA */}
            <div className="glass-ultra rounded-2xl p-6 w-full max-w-sm border border-white/10 relative overflow-hidden hover-glow transition-shadow duration-500">

                {/* Floating Particles */}
                <div className="particles-container">
                    <div className="particle" />
                    <div className="particle" />
                    <div className="particle" />
                    <div className="particle" />
                    <div className="particle" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-2 z-10 relative">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent flex items-center gap-2">
                        <span>🏯</span>
                        The Soul (Cốt Lõi)
                    </h3>
                    <motion.span
                        className="text-xs text-green-400 font-mono px-2 py-0.5 rounded-full bg-green-400/10 border border-green-400/20"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        Balanced
                    </motion.span>
                </div>

                <p className="text-xs text-gray-400 mb-4 z-10 relative">
                    Ngũ Sự (5 Elements) Alignment Scan
                </p>

                {/* Radar Chart with Sweep Effect */}
                <div className="h-[200px] w-full relative z-10 radar-sweep">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                            />
                            <Radar
                                name="Harmony"
                                dataKey="A"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fill="#8b5cf6"
                                fillOpacity={0.4}
                            />
                        </RadarChart>
                    </ResponsiveContainer>

                    {/* Animated Pulse at Center - UPGRADED */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full"
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.8, 0.3, 0.8],
                            boxShadow: ['0 0 0 0 rgba(139,92,246,0.7)', '0 0 0 15px rgba(139,92,246,0)', '0 0 0 0 rgba(139,92,246,0.7)']
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
            </div>
        </div>
    );
}
