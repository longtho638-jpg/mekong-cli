'use client';

import { motion } from 'framer-motion';
import React, { ReactNode } from 'react';

interface HoloCardProps {
    children: ReactNode;
    className?: string;
}

// M3 Motion Transition
const m3Transition = {
    type: "spring",
    stiffness: 400, // Slightly stiffer for "weighted" feel
    damping: 30,    // Critical damping for no bounce-back
    mass: 1.2       // Heavier mass for importance
};

export function HoloCard({ children, className }: HoloCardProps) {
    return (
        <motion.div
            className={`crystal-prism rounded-[var(--shape-corner-xl)] p-6 relative overflow-hidden group chromatic-edge ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={m3Transition}
            whileHover={{
                y: -4, // Subtle lift (Elevation Level 3 -> 4)
                scale: 1.02,
                transition: { ...m3Transition, duration: 0.4 } // Use duration to override spring for visual smoothness if needed, but spring is preferred
            }}
            whileTap={{ scale: 0.98 }} // Tactile feedback
        >
            {/* M3 State Layer (Hover Overlay) */}
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.08] transition-opacity duration-[var(--motion-duration-medium2)] ease-[var(--motion-easing-standard)] pointer-events-none z-0" />

            {/* Volumetric Shine (Preserved God Tier Effect) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-[var(--motion-easing-emphasized-decelerate)] pointer-events-none z-10" />

            {/* Inner Content - M3 Body Large */}
            <div className="relative z-20">
                {children}
            </div>
        </motion.div>
    );
}
