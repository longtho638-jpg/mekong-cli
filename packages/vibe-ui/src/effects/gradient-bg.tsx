import React from 'react';
import { motion } from 'framer-motion';
import { isSafari } from '../utils/browser-detect';

export function AnimatedGradientBg() {
    if (isSafari()) {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute w-[800px] h-[800px] rounded-full opacity-20"
                    style={{
                        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
                    }}
                />
                <div
                    className="absolute right-0 top-1/4 w-[600px] h-[600px] rounded-full opacity-15"
                    style={{
                        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
                    }}
                />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
                className="absolute w-[800px] h-[800px] rounded-full opacity-30"
                style={{
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
                animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute right-0 top-1/4 w-[600px] h-[600px] rounded-full opacity-20"
                style={{
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
                animate={{ x: [0, -80, 0], y: [0, 100, 0], scale: [1.1, 0.9, 1.1] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute left-1/4 bottom-0 w-[500px] h-[500px] rounded-full opacity-25"
                style={{
                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
                animate={{ x: [0, 60, 0], y: [0, -80, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
        </div>
    );
}
