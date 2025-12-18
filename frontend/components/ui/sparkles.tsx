"use client";
import React, { useId } from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SparklesProps {
    id?: string;
    className?: string;
    background?: string;
    minSize?: number;
    maxSize?: number;
    speed?: number;
    particleColor?: string;
    particleDensity?: number;
}

export const SparklesCore = ({
    id,
    className,
    background,
    minSize = 0.4,
    maxSize = 1,
    speed = 1,
    particleColor = "#FFF",
    particleDensity = 100,
}: SparklesProps) => {
    const [particles, setParticles] = useState<
        Array<{ id: number; size: number; x: number; y: number; duration: number; delay: number }>
    >([]);
    const generatedId = useId();

    useEffect(() => {
        const newParticles = Array.from({ length: particleDensity }, (_, i) => ({
            id: i,
            size: Math.random() * (maxSize - minSize) + minSize,
            x: Math.random() * 100,
            y: Math.random() * 100,
            duration: (Math.random() * 2 + 1) / speed,
            delay: Math.random() * 2,
        }));
        setParticles(newParticles);
    }, [particleDensity, minSize, maxSize, speed]);

    return (
        <div className={cn("h-full w-full", className)}>
            <svg
                className="h-full w-full"
                style={{ background }}
            >
                <defs>
                    <filter id={`sparkle-blur-${id || generatedId}`}>
                        <feGaussianBlur stdDeviation="0.5" result="blur" />
                    </filter>
                </defs>
                {particles.map((particle) => (
                    <motion.circle
                        key={particle.id}
                        cx={`${particle.x}%`}
                        cy={`${particle.y}%`}
                        r={particle.size}
                        fill={particleColor}
                        filter={`url(#sparkle-blur-${id || generatedId})`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                        }}
                        transition={{
                            duration: particle.duration,
                            repeat: Infinity,
                            delay: particle.delay,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
};
