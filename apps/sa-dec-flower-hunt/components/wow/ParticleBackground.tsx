"use client";

// ============================================================================
// PARTICLE BACKGROUND - Reusable Ambient Particle System
// ============================================================================
// Variants: investor (gold), festival (lanterns), stars, firefly
// ============================================================================

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    opacity: number;
}

type ParticleVariant = "investor" | "festival" | "stars" | "firefly";

const VARIANT_CONFIG = {
    investor: {
        count: 30,
        colors: ["#F59E0B", "#FBBF24", "#FCD34D"],
        sizeRange: [3, 8],
        direction: "up" as const,
        glow: true,
    },
    festival: {
        count: 20,
        colors: ["#DC2626", "#F59E0B", "#FCD34D"],
        sizeRange: [8, 16],
        direction: "float" as const,
        glow: true,
    },
    stars: {
        count: 50,
        colors: ["#FFFFFF", "#E0E7FF", "#C7D2FE"],
        sizeRange: [1, 4],
        direction: "twinkle" as const,
        glow: false,
    },
    firefly: {
        count: 40,
        colors: ["#10B981", "#34D399", "#6EE7B7"],
        sizeRange: [2, 6],
        direction: "float" as const,
        glow: true,
    },
};

interface ParticleBackgroundProps {
    variant?: ParticleVariant;
    className?: string;
    intensity?: "low" | "medium" | "high";
}

export function ParticleBackground({
    variant = "investor",
    className = "",
    intensity = "medium",
}: ParticleBackgroundProps) {
    const [particles, setParticles] = useState<Particle[]>([]);
    const config = VARIANT_CONFIG[variant];

    const intensityMultiplier = {
        low: 0.5,
        medium: 1,
        high: 1.5,
    }[intensity];

    useEffect(() => {
        const count = Math.floor(config.count * intensityMultiplier);
        const newParticles: Particle[] = [];

        for (let i = 0; i < count; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]),
                duration: 3 + Math.random() * 4,
                delay: Math.random() * 5,
                opacity: 0.3 + Math.random() * 0.7,
            });
        }
        setParticles(newParticles);
    }, [variant, intensity]);

    const getAnimationProps = (particle: Particle) => {
        switch (config.direction) {
            case "up":
                return {
                    initial: { y: "100vh", x: `${particle.x}vw`, opacity: 0 },
                    animate: { y: "-10vh", opacity: [0, particle.opacity, 0] },
                    transition: {
                        duration: particle.duration,
                        delay: particle.delay,
                        repeat: Infinity,
                        ease: "linear" as const,
                    },
                };
            case "float":
                return {
                    initial: { y: `${particle.y}vh`, x: `${particle.x}vw` },
                    animate: {
                        y: [`${particle.y}vh`, `${particle.y - 10}vh`, `${particle.y}vh`],
                        x: [`${particle.x}vw`, `${particle.x + 3}vw`, `${particle.x}vw`],
                        opacity: [particle.opacity * 0.5, particle.opacity, particle.opacity * 0.5],
                    },
                    transition: {
                        duration: particle.duration,
                        delay: particle.delay,
                        repeat: Infinity,
                        ease: "easeInOut" as const,
                    },
                };
            case "twinkle":
                return {
                    initial: { y: `${particle.y}vh`, x: `${particle.x}vw`, scale: 1 },
                    animate: {
                        opacity: [0.2, particle.opacity, 0.2],
                        scale: [0.8, 1.2, 0.8],
                    },
                    transition: {
                        duration: particle.duration,
                        delay: particle.delay,
                        repeat: Infinity,
                        ease: "easeInOut" as const,
                    },
                };
        }
    };

    return (
        <div className={`fixed inset-0 pointer-events-none overflow-hidden z-0 ${className}`}>
            {particles.map((particle) => {
                const color = config.colors[particle.id % config.colors.length];
                const animProps = getAnimationProps(particle);

                return (
                    <motion.div
                        key={particle.id}
                        className="absolute rounded-full"
                        style={{
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: color,
                            boxShadow: config.glow
                                ? `0 0 ${particle.size * 2}px ${color}, 0 0 ${particle.size * 4}px ${color}50`
                                : "none",
                            willChange: "transform, opacity",
                        }}
                        {...animProps}
                    />
                );
            })}
        </div>
    );
}

// Lantern component for festival variant
export function FloatingLanterns({ count = 8 }: { count?: number }) {
    const lanterns = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 10 + (i * 80) / count + Math.random() * 10,
        delay: i * 0.5,
        duration: 6 + Math.random() * 3,
    }));

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {lanterns.map((lantern) => (
                <motion.div
                    key={lantern.id}
                    className="absolute"
                    style={{ left: `${lantern.x}%`, willChange: "transform, opacity" }}
                    initial={{ y: "110vh", opacity: 0 }}
                    animate={{ y: "-20vh", opacity: [0, 1, 1, 0] }}
                    transition={{
                        duration: lantern.duration,
                        delay: lantern.delay,
                        repeat: Infinity,
                        ease: "linear" as const,
                    }}
                >
                    <div className="relative">
                        {/* Lantern body */}
                        <div className="w-8 h-12 rounded-full bg-gradient-to-b from-red-500 to-red-700 border-2 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)]">
                            <div className="absolute inset-2 bg-gradient-to-b from-orange-400/50 to-transparent rounded-full" />
                        </div>
                        {/* Lantern top */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-amber-600 rounded-t-full" />
                        {/* Lantern glow */}
                        <div className="absolute inset-0 bg-orange-400/30 rounded-full blur-xl animate-pulse" />
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
