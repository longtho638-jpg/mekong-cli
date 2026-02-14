"use client";

import { motion } from "framer-motion";

interface NodePulseProps {
    size?: 'sm' | 'md' | 'lg';
    color?: 'emerald' | 'amber' | 'red';
    animated?: boolean;
}

export const NodePulse = ({ size = 'md', color = 'emerald', animated = true }: NodePulseProps) => {
    const sizeClasses = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    };

    const colorClasses = {
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        red: 'bg-red-500',
    };

    return (
        <motion.div
            className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full ${animated ? 'animate-pulse' : ''}`}
            animate={animated ? {
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
            } : {}}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        />
    );
};
