"use client";

import { motion } from "framer-motion";
import { PieChart, TrendingUp, Calculator } from "lucide-react";

export default function BusinessSlide() {
    const revenueStreams = [
        { label: "Marketplace Commission", value: 20, desc: "3% on all orders", color: "bg-emerald-500" },
        { label: "SaaS for Farmers", value: 30, desc: "$10/month IoT dashboard", color: "bg-cyan-500" },
        { label: "Supply Chain Finance", value: 40, desc: "Interest on bank loans", color: "bg-amber-500" },
        { label: "Data Licensing", value: 10, desc: "Anonymized agri-data", color: "bg-purple-500" },
    ];

    const economics = [
        { metric: "CAC", value: "$2", desc: "Organic viral acquisition", trend: "down" },
        { metric: "LTV", value: "$120", desc: "1-year farmer retention", trend: "up" },
        { metric: "LTV/CAC", value: "60x", desc: "Industry best-in-class", trend: "up" },
        { metric: "Gross Margin", value: "75%", desc: "SaaS + marketplace mix", trend: "neutral" },
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 md:p-16">
            <div className="max-w-6xl w-full space-y-12">
                {/* Header */}
                <motion.div
                    className="text-center space-y-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <PieChart className="w-8 h-8 text-emerald-500" />
                        <h1 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-wider">
                            Business Model
                        </h1>
                    </div>
                    <p className="text-xl text-emerald-400">Multi-Revenue Streams & Unit Economics</p>
                </motion.div>

                {/* Revenue Streams */}
                <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <h3 className="text-sm text-emerald-500 uppercase tracking-widest font-bold mb-4">Revenue Mix</h3>
                    {revenueStreams.map((stream, index) => (
                        <div key={index} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-white font-bold">{stream.label}</span>
                                <span className="text-emerald-400">{stream.value}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-8 bg-stone-900 rounded-sm overflow-hidden border border-stone-800">
                                    <motion.div
                                        className={`h-full ${stream.color}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stream.value}%` }}
                                        transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                                    />
                                </div>
                                <span className="text-xs text-stone-500 whitespace-nowrap">{stream.desc}</span>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Unit Economics */}
                <motion.div
                    className="grid md:grid-cols-4 gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    {economics.map((item, index) => (
                        <div
                            key={index}
                            className="bg-stone-950/50 border border-stone-800 rounded-sm p-6 text-center space-y-2"
                        >
                            <div className="text-xs text-emerald-500 uppercase tracking-widest font-bold">{item.metric}</div>
                            <div className="text-3xl font-bold text-white font-mono">{item.value}</div>
                            <div className="text-[10px] text-stone-500">{item.desc}</div>
                            {item.trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto" />}
                            {item.trend === "down" && <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto rotate-180" />}
                        </div>
                    ))}
                </motion.div>

                {/* Bottom Highlight */}
                <motion.div
                    className="bg-emerald-950/30 border border-emerald-500/30 rounded-sm p-6 flex items-center justify-center gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    <Calculator className="w-8 h-8 text-emerald-400" />
                    <div>
                        <div className="text-2xl font-bold text-white">Path to $10M ARR in 18 Months</div>
                        <div className="text-sm text-stone-400">With viral growth + 500 farmers @ $20/mo average</div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
