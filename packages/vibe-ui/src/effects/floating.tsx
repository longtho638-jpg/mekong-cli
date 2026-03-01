import React from 'react';
import { motion } from 'framer-motion';

export interface FloatingElementProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    distance?: number;
}

export function FloatingElement({ children, delay = 0, duration = 3, distance = 15 }: FloatingElementProps) {
    return (
        <motion.div
            animate={{ y: [0, -distance, 0], rotate: [0, 3, 0, -3, 0] }}
            transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
        >
            {children}
        </motion.div>
    );
}
