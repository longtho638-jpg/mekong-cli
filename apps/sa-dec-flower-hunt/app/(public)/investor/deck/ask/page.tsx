"use client";

import { motion } from "framer-motion";
import { Rocket, Mail, Calendar } from "lucide-react";

export default function AskSlide() {
    const useOfFunds = [
        { category: "IoT Deployment", amount: 150000, percentage: 30, color: "bg-emerald-500" },
        { category: "Team Expansion", amount: 200000, percentage: 40, color: "bg-cyan-500" },
        { category: "Marketing", amount: 100000, percentage: 20, color: "bg-amber-500" },
        { category: "Reserve", amount: 50000, percentage: 10, color: "bg-purple-500" },
    ];

    const milestones = [
        { month: "Month 3", target: "500 farmers onboarded" },
        { month: "Month 6", target: "Break-even on operations" },
        { month: "Month 9", target: "$500K ARR" },
        { month: "Month 12", target: "Series A readiness ($5M)" },
    ];

    const formatUSD = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);

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
                        <Rocket className="w-8 h-8 text-emerald-500" />
                        <h1 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-wider">
                            The Ask
                        </h1>
                    </div>
                    <div className="text-6xl font-bold text-emerald-500 font-mono">$500K</div>
                    <p className="text-xl text-stone-400">Seed Round</p>
                </motion.div>

                {/* Use of Funds */}
                <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <h3 className="text-sm text-emerald-500 uppercase tracking-widest font-bold mb-4 text-center">Use of Funds</h3>
                    {useOfFunds.map((item, index) => (
                        <div key={index} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-white font-bold">{item.category}</span>
                                <span className="text-emerald-400">{formatUSD(item.amount)} ({item.percentage}%)</span>
                            </div>
                            <div className="h-10 bg-stone-900 rounded-sm overflow-hidden border border-stone-800">
                                <motion.div
                                    className={`h-full ${item.color} flex items-center px-4 text-black font-bold text-sm`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.percentage}%` }}
                                    transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                                >
                                    {item.percentage}%
                                </motion.div>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* 12-Month Milestones */}
                <motion.div
                    className="bg-stone-950/50 border border-stone-800 rounded-sm p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <div className="flex items-center gap-2 mb-6">
                        <Calendar className="w-5 h-5 text-emerald-500" />
                        <h3 className="text-sm text-emerald-500 uppercase tracking-widest font-bold">12-Month Roadmap</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {milestones.map((milestone, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 bg-emerald-950/20 border border-emerald-500/20 rounded-sm p-4"
                            >
                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
                                    <span className="text-emerald-400 font-bold text-xs">{milestone.month.replace("Month ", "M")}</span>
                                </div>
                                <div>
                                    <div className=" text-xs text-emerald-500 font-bold uppercase tracking-wider">{milestone.month}</div>
                                    <div className="text-sm text-white mt-1">{milestone.target}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    className="bg-emerald-950/30 border border-emerald-500/50 rounded-sm p-8 text-center space-y-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 }}
                >
                    <Mail className="w-12 h-12 text-emerald-400 mx-auto" />
                    <h3 className="text-2xl font-bold text-white">Ready to Discuss Terms?</h3>
                    <p className="text-stone-400">Agrios.tech is raising $1.5M Seed Round (Valuation Cap: $8M) to digitize the Mekong Delta's flower supply chain.g</p>
                    <div className="text-emerald-400 font-mono text-lg">founder@agrios.tech</div>
                </motion.div>
            </div>
        </div>
    );
}
