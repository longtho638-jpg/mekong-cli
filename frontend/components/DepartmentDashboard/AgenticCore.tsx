'use client';

import { motion } from 'framer-motion';
import { Eye, Zap } from 'lucide-react';

export function AgenticCore() {
    return (
        <div className="relative flex items-center justify-center p-8">
            {/* The Beam */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent w-full max-w-lg mx-auto" />

            {/* The Core */}
            <motion.div
                className="agentic-core relative z-10 w-16 h-16 rounded-full bg-black border border-purple-500/50 flex items-center justify-center crystal-prism cursor-pointer group"
                whileHover={{ scale: 1.2 }}
            >
                {/* Inner Eye */}
                <div className="text-purple-400 group-hover:text-purple-200 transition-colors">
                    <Eye className="w-6 h-6" />
                </div>

                {/* Rotating Rings */}
                <motion.div
                    className="absolute inset-0 rounded-full border border-purple-500/30 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />

                <motion.div
                    className="absolute -inset-2 rounded-full border border-purple-500/10 border-b-transparent"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />

                {/* Status Dot */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
            </motion.div>

            {/* Insight Text Tooltip (Visible on Hover/State) */}
            <div className="absolute top-full mt-4 text-center">
                <div className="text-[10px] text-purple-400 font-mono tracking-widest uppercase mb-1">AI AGENT ACTIVE</div>
                <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 backdrop-blur-md">
                    Scanning Zone 4 Metadata...
                </div>
            </div>
        </div>
    );
}
