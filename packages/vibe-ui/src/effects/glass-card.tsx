import React from 'react';
import { motion } from 'framer-motion';

export interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    glow?: 'emerald' | 'violet' | 'pink' | 'cyan' | 'amber';
    hover?: boolean;
}

export function GlassCard({
    children,
    className = '',
    glow = 'emerald',
    hover = true,
}: GlassCardProps) {
    const glowColors = {
        emerald: 'hover:shadow-emerald-500/20',
        violet: 'hover:shadow-violet-500/20',
        pink: 'hover:shadow-pink-500/20',
        cyan: 'hover:shadow-cyan-500/20',
        amber: 'hover:shadow-amber-500/20',
    };

    const borderColors = {
        emerald: 'hover:border-emerald-500/50',
        violet: 'hover:border-violet-500/50',
        pink: 'hover:border-pink-500/50',
        cyan: 'hover:border-cyan-500/50',
        amber: 'hover:border-amber-500/50',
    };

    return (
        <motion.div
            className={`
        relative backdrop-blur-xl bg-white/5
        border border-white/10 rounded-3xl
        ${hover ? `${glowColors[glow]} ${borderColors[glow]} hover:shadow-2xl` : ''}
        transition-all duration-500 ${className}
      `}
            whileHover={hover ? { scale: 1.02, y: -5 } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rotate-12" />
            </div>
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
}
