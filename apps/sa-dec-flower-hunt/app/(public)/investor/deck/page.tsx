"use client";

import { motion } from "framer-motion";
import { ArrowRight, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InvestorCoverSlide() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            <motion.div
                className="max-w-4xl w-full text-center space-y-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                {/* Logo/Icon */}
                <motion.div
                    className="flex justify-center"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <div className="w-24 h-24 border-2 border-emerald-500 flex items-center justify-center bg-emerald-900/20">
                        <Terminal className="w-12 h-12 text-emerald-400" />
                    </div>
                </motion.div>

                {/* Main Title */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-4"
                >
                    <h1 className="text-6xl md:text-8xl font-bold tracking-wider text-white">
                        AGRIOS<span className="text-emerald-500">.tech</span>
                    </h1>
                    <div className="h-1 w-32 bg-emerald-500 mx-auto" />
                </motion.div>

                {/* Tagline */}
                <motion.p
                    className="text-xl md:text-2xl text-emerald-400 tracking-wide"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    Hệ Điều Hành Nông Nghiệp Quốc Gia
                </motion.p>

                <motion.p
                    className="text-lg md:text-xl text-stone-400 italic"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    The Operating System for Agriculture
                </motion.p>

                {/* Funding Info */}
                <motion.div
                    className="bg-emerald-950/30 border border-emerald-500/30 rounded-sm p-8 inline-block"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 }}
                >
                    <div className="text-sm text-emerald-500 uppercase tracking-widest mb-2">Seed Round</div>
                    <div className="text-4xl font-bold text-white">
                        $0 <span className="text-emerald-500">→</span> $500K
                    </div>
                    <div className="text-xs text-stone-500 mt-2 uppercase">Raised → Seeking</div>
                </motion.div>

                {/* CTA */}
                <motion.button
                    onClick={() => router.push("/investor/deck/problem")}
                    className="group bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 px-8 rounded-sm flex items-center gap-3 mx-auto transition-all uppercase tracking-wider text-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    whileHover={{ scale: 1.05 }}
                >
                    Start Presentation
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                {/* Hint */}
                <motion.p
                    className="text-xs text-stone-600 uppercase tracking-widest"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                >
                    Use ← → arrow keys to navigate
                </motion.p>
            </motion.div>
        </div>
    );
}
