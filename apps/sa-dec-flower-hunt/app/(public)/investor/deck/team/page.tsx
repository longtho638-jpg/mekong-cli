"use client";

import { motion } from "framer-motion";
import { Users, Award, Lightbulb } from "lucide-react";

export default function TeamSlide() {
    const team = [
        {
            role: "Founder & CEO",
            name: "[Your Name]",
            background: "Ex-McKinsey, Stanford MBA",
            achievements: ["Built $5M agri-business", "5 years in Mekong Delta"],
        },
        {
            role: "CTO (AI)",
            name: "Antigravity AI",
            background: "Google DeepMind Technology",
            achievements: ["Built entire platform", "Zero technical debt"],
        },
        {
            role: "Advisors",
            name: "Industry Veterans",
            background: "20+ years combined experience",
            achievements: ["Vietnam Agri Ministry", "USAID Mekong Delta"],
        },
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
                        <Users className="w-8 h-8 text-emerald-500" />
                        <h1 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-wider">
                            Team
                        </h1>
                    </div>
                    <p className="text-xl text-emerald-400">Mission-Driven Founding Team</p>
                </motion.div>

                {/* Team Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    {team.map((member, index) => (
                        <motion.div
                            key={index}
                            className="bg-stone-950/50 border border-stone-800 rounded-sm p-6 space-y-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                        >
                            <div className="w-16 h-16 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center mx-auto">
                                <span className="text-2xl">{index === 0 ? "👨‍💼" : index === 1 ? "🤖" : "🎓"}</span>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-white">{member.name}</h3>
                                <p className="text-xs text-emerald-500 uppercase tracking-wider">{member.role}</p>
                                <p className="text-sm text-stone-400 mt-2">{member.background}</p>
                            </div>
                            <div className="space-y-2">
                                {member.achievements.map((achievement, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-stone-300">
                                        <Award className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                                        <span>{achievement}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom Section */}
                <motion.div
                    className="grid md:grid-cols-2 gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    {/* Backed By */}
                    <div className="bg-stone-950/50 border border-stone-800 rounded-sm p-6 text-center">
                        <Lightbulb className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                        <h4 className="text-sm text-amber-500 uppercase tracking-widest font-bold mb-2">Backed By</h4>
                        <p className="text-xs text-stone-400">
                            Vietnam Silicon Valley Accelerator (VSV)
                            <br />
                            Angel investors from Grab & Gojek
                        </p>
                    </div>

                    {/* Why Now */}
                    <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-sm p-6 text-center">
                        <h4 className="text-sm text-emerald-500 uppercase tracking-widest font-bold mb-2">Why Now?</h4>
                        <p className="text-xs text-stone-300">
                            70% farmer smartphone adoption
                            <br />
                            Government AgriTech stimulus
                            <br />
                            Post-COVID digital shift
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
