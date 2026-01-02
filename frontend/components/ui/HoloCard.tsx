'use client';

import { motion } from 'framer-motion';
import React, { ReactNode } from 'react';

interface HoloCardProps {
    children: ReactNode;
    className?: string;
}

export function HoloCard({ children, className }: HoloCardProps) {
    return (
        <motion.div
            className={`crystal-prism rounded-2xl p-6 relative overflow-hidden group chromatic-edge ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
                y: -5,
                rotateX: 2,
                rotateY: -2,
                transition: { type: "spring", stiffness: 300 }
            }}
        >
            {/* Volumetric Shine */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Inner Content */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
}
