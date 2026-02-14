"use client";

import { motion } from "framer-motion";
import { Sparkles, QrCode } from "lucide-react";

export default function SolutionSlide() {
    const nodes = [
        { icon: "🏦", label: "Banks", desc: "Credit scoring" },
        { icon: "📦", label: "Suppliers", desc: "Inventory" },
        { icon: "🌱", label: "Farmers", desc: "IoT sensors" },
        { icon: "❄️", label: "Logistics", desc: "Cold chain" },
        { icon: "🌏", label: "Buyers", desc: "Marketplace" },
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 md:p-16">
            <div className="max-w-6xl w-full space-y-8">
                {/* Header */}
                <motion.div
                    className="text-center space-y-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Sparkles className="w-8 h-8 text-emerald-500" />
                        <h1 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-wider">
                            AGRIOS<span className="text-emerald-500">.tech</span>
                        </h1>
                    </div>
                    <p className="text-xl md:text-2xl text-emerald-400">
                        The Central Nervous System for Agriculture
                    </p>
                </motion.div>

                {/* Live Terminal Embed */}
                <motion.div
                    className="relative"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="border-2 border-emerald-500/50 rounded-sm overflow-hidden bg-black shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        <div className="bg-emerald-950/50 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between">
                            <span className="text-xs text-emerald-500 font-mono uppercase tracking-wider">
                                ⚡ LIVE DEMO - Public Terminal
                            </span>
                            <span className="text-[10px] text-stone-500">http://localhost:3000/live</span>
                        </div>
                        <iframe
                            src="http://localhost:3000/live"
                            className="w-full h-[400px] md:h-[500px]"
                            title="Live AGRIOS.tech Demo"
                        />
                    </div>
                    <div className="absolute -top-3 -right-3 bg-emerald-500 text-black px-3 py-1 rounded-sm text-xs font-bold uppercase animate-pulse">
                        Running LIVE
                    </div>
                </motion.div>

                {/* Explanation */}
                <motion.div
                    className="grid md:grid-cols-2 gap-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    {/* Node Architecture */}
                    <div className="bg-stone-950/50 border border-stone-800 rounded-sm p-6 space-y-3">
                        <h3 className="text-sm text-emerald-500 uppercase tracking-widest font-bold mb-4">
                            5-Node Architecture
                        </h3>
                        {nodes.map((node, index) => (
                            <div key={index} className="flex items-center gap-3 text-sm">
                                <span className="text-2xl">{node.icon}</span>
                                <div className="flex-1">
                                    <span className="text-white font-bold">{node.label}</span>
                                    <span className="text-stone-500 ml-2">→ {node.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-sm p-6 flex flex-col items-center justify-center text-center space-y-4">
                        <QrCode className="w-16 h-16 text-emerald-400" />
                        <p className="text-lg text-white font-bold">Try It Yourself</p>
                        <p className="text-sm text-stone-400">
                            Scan QR code or visit <span className="text-emerald-400 font-mono">/live</span> to join as a Node
                        </p>
                        <div className="text-xs text-stone-600 uppercase tracking-wider">
                            Every visitor becomes part of the ecosystem
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
