'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HoloCard } from '@/components/ui/HoloCard';

export function QuantumMap() {
    // Generate sine wave path
    const width = 800; // SVG Viewport width
    const height = 150;
    const points = 13;
    const chapter = 10; // Current chapter

    // Calculate points along a sine wave
    const wavePoints = Array.from({ length: points }, (_, i) => {
        const x = (i / (points - 1)) * width;
        const amplitude = 30;
        const frequency = 2; // Full waves across width
        const y = height / 2 + Math.sin((i / (points - 1)) * Math.PI * frequency * 2) * amplitude;
        return { x, y, id: i + 1 };
    });

    // Create SVG Path string
    const pathD = `M ${wavePoints.map(p => `${p.x},${p.y}`).join(' L ')}`;

    return (
        <div className="relative w-full h-full min-h-[200px] flex items-center justify-center overflow-hidden">
            {/* Liquid Stream Background */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <defs>
                    <linearGradient id="quantum-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(59, 130, 246, 0.2)" />
                        <stop offset="50%" stopColor="rgba(139, 92, 246, 0.8)" />
                        <stop offset="100%" stopColor="rgba(59, 130, 246, 0.2)" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* The Energy Beam */}
                <motion.path
                    d={pathD}
                    fill="none"
                    stroke="url(#quantum-gradient)"
                    strokeWidth="4"
                    filter="url(#glow)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                />

                {/* Pulsing "Energy Packets" traveling the line */}
                <motion.circle
                    r="6"
                    fill="#fff"
                    filter="url(#glow)"
                >
                    <animateMotion
                        dur="3s"
                        repeatCount="indefinite"
                        path={pathD}
                    />
                </motion.circle>
                <motion.circle
                    r="4"
                    fill="#8b5cf6"
                    filter="url(#glow)"
                    opacity="0.7"
                >
                    <animateMotion
                        dur="4s"
                        repeatCount="indefinite"
                        path={pathD}
                        begin="1s"
                    />
                </motion.circle>
            </svg>

            {/* Nodes */}
            <div className="absolute inset-0 w-full h-full">
                {wavePoints.map((point, index) => {
                    // Normalize coordinates for absolute positioning
                    // Warning: exacting positioning on top of SVG requires matching aspect ratio or fixed sizing
                    // For 'WOW' demo in standard view, we'll use % based approximation if svg is 100% width
                    const left = `${(index / (points - 1)) * 100}%`;
                    // Y is tricky with responsive height, we'll keep it simple: nodes sit on the center line roughly
                    // To be precise we interact with the SVG directly. 
                    // Let's render nodes INSIDE the SVG as foreignObjects or groups for perfect alignment.
                    return null;
                })}
            </div>

            {/* Re-render nodes within SVG for precision */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                {wavePoints.map((point, index) => {
                    const isPassed = index + 1 <= chapter;
                    const isCurrent = index + 1 === chapter;

                    return (
                        <g key={point.id} transform={`translate(${point.x}, ${point.y})`}>
                            {/* Node Circle */}
                            <motion.circle
                                r={isCurrent ? 12 : 6}
                                fill={isPassed ? (isCurrent ? "#fbbf24" : "#22c55e") : "#1e293b"}
                                stroke={isPassed ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)"}
                                strokeWidth="2"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.5 }}
                                className="cursor-pointer"
                            />

                            {/* Pulse for Current */}
                            {isCurrent && (
                                <motion.circle
                                    r="20"
                                    fill="none"
                                    stroke="#fbbf24"
                                    strokeWidth="1"
                                    animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            )}

                            {/* Tooltip for Current */}
                            {isCurrent && (
                                <foreignObject x="-100" y="25" width="200" height="100">
                                    <div className="bg-black/80 backdrop-blur-md border border-amber-500/50 p-3 rounded-xl text-center shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                                        <div className="text-[10px] text-amber-500 font-orbitron uppercase tracking-wider mb-1">
                                            Current Objective
                                        </div>
                                        <div className="text-xs text-white">
                                            Chapter {point.id}: Market Entry (Địa Hình)
                                        </div>
                                    </div>
                                </foreignObject>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
