'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

interface AIInsightStripProps {
    insight?: string;
    type?: 'success' | 'warning' | 'info';
}

export function AIInsightStrip({
    insight = "Revenue is +12% vs forecast. Recommended focus: Zone 4 expansion for Q1 target.",
    type = 'success'
}: AIInsightStripProps) {
    const typeStyles = {
        success: 'border-green-500/30 bg-green-500/5',
        warning: 'border-amber-500/30 bg-amber-500/5',
        info: 'border-blue-500/30 bg-blue-500/5'
    };

    const iconColors = {
        success: 'text-green-400',
        warning: 'text-amber-400',
        info: 'text-blue-400'
    };

    return (
        <motion.div
            className={`w-full px-4 py-3 rounded-xl border ${typeStyles[type]} backdrop-blur-sm flex items-center gap-3`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* AI Icon with Pulse */}
            <motion.div
                className={`p-2 rounded-lg bg-white/5 ${iconColors[type]}`}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <Sparkles className="w-4 h-4" />
            </motion.div>

            {/* Insight Text */}
            <div className="flex-1">
                <span className="text-xs text-white/40 uppercase tracking-wider mr-2">AI Insight:</span>
                <span className="text-sm text-white/90">{insight}</span>
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-2">
                <motion.div
                    className="w-2 h-2 rounded-full bg-green-500"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Live</span>
            </div>
        </motion.div>
    );
}
