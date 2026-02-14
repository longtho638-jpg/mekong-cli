"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AgriosVectorLogoProps {
    className?: string;
    variant?: "full" | "icon"; // full = Icon + Text, icon = Icon only
    animate?: boolean;
}

export function AgriosVectorLogo({ className, variant = "full", animate = true }: AgriosVectorLogoProps) {
    return (
        <div className={cn("flex items-center", className)}>
            <svg
                viewBox={variant === "full" ? "0 0 300 100" : "0 0 100 100"}
                className="h-full w-auto"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="neonGradVector" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                    <filter id="glowVector">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* --- ICON PART (0-100 Width) --- */}
                <g className="icon-group">
                    {/* The Digital Lotus Node */}
                    <motion.path
                        d="M50 20 C50 20 70 35 70 50 C70 65 50 80 50 80 C50 80 30 65 30 50 C30 35 50 20 50 20 Z"
                        stroke="url(#neonGradVector)"
                        strokeWidth="3"
                        fill="url(#neonGradVector)"
                        fillOpacity="0.05"
                        filter="url(#glowVector)"
                        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
                        animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />

                    {/* Circuit Connections */}
                    <motion.g
                        initial={animate ? { opacity: 0 } : undefined}
                        animate={animate ? { opacity: 1 } : undefined}
                        transition={{ delay: 0.8, duration: 0.5 }}
                    >
                        <circle cx="50" cy="50" r="4" fill="#fff" />
                        <path d="M50 20 L50 10" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                        <path d="M50 80 L50 90" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                        <path d="M70 50 L80 50" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                        <path d="M30 50 L20 50" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                    </motion.g>
                </g>

                {/* --- TEXT PART (110-300 Width) --- */}
                {variant === "full" && (
                    <motion.g
                        initial={animate ? { opacity: 0, x: -20 } : undefined}
                        animate={animate ? { opacity: 1, x: 0 } : undefined}
                        transition={{ delay: 0.5, duration: 0.8 }}
                    >
                        {/* AGRIOS */}
                        <text
                            x="110"
                            y="60"
                            fontFamily="var(--font-jetbrains-mono), monospace"
                            fontWeight="bold"
                            fontSize="40"
                            fill="#fff"
                            letterSpacing="-0.02em"
                        >
                            AGRIOS
                        </text>
                        {/* .tech */}
                        <text
                            x="260"
                            y="60"
                            fontFamily="var(--font-jetbrains-mono), monospace"
                            fontWeight="bold"
                            fontSize="40"
                            fill="#10B981"
                        >
                            .tech
                        </text>
                        {/* Tagline */}
                        <text
                            x="112"
                            y="85"
                            fontFamily="var(--font-jetbrains-mono), monospace"
                            fontSize="12"
                            fill="#10B981"
                            fillOpacity="0.7"
                            letterSpacing="0.2em"
                        >
                            GARDEN OS
                        </text>
                    </motion.g>
                )}
            </svg>
        </div>
    );
}
