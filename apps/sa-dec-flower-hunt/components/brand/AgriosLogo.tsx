"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AgriosLogoProps {
    className?: string;
    animate?: boolean;
}

export function AgriosLogo({ className, animate = true }: AgriosLogoProps) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={cn("w-10 h-10", className)}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* The Digital Lotus Node */}
            <motion.path
                d="M50 20 C50 20 70 35 70 50 C70 65 50 80 50 80 C50 80 30 65 30 50 C30 35 50 20 50 20 Z"
                stroke="url(#neonGrad)"
                strokeWidth="2"
                fill="url(#neonGrad)"
                fillOpacity="0.1"
                filter="url(#glow)"
                initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
                animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />

            {/* Circuit Connections */}
            <motion.g
                initial={animate ? { opacity: 0 } : undefined}
                animate={animate ? { opacity: 1 } : undefined}
                transition={{ delay: 1, duration: 0.5 }}
            >
                <circle cx="50" cy="50" r="4" fill="#fff" />
                <path d="M50 20 L50 10" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                <path d="M50 80 L50 90" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                <path d="M70 50 L80 50" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                <path d="M30 50 L20 50" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
            </motion.g>
        </svg>
    );
}
