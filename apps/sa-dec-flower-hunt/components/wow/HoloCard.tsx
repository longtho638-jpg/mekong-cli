"use client";

// ============================================================================
// HOLOGRAPHIC CARD - Premium Shimmer Effect
// ============================================================================
// Rainbow gradient that moves with mouse, 3D tilt, glass reflections
// Inspired by Pokemon/Trading card holographic effects
// ============================================================================

import { useRef, useState, MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface HoloCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
    intensity?: "low" | "medium" | "high";
}

export function HoloCard({
    children,
    className,
    glowColor = "emerald",
    intensity = "medium",
}: HoloCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Mouse position on card (0-1 range)
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    // Smooth spring animation
    const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
    const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

    // 3D rotation based on mouse position
    const rotateX = useTransform(springY, [0, 1], [10, -10]);
    const rotateY = useTransform(springX, [0, 1], [-10, 10]);

    // Holographic gradient position
    const gradientX = useTransform(springX, [0, 1], [0, 100]);
    const gradientY = useTransform(springY, [0, 1], [0, 100]);

    // Shine position
    const shineX = useTransform(springX, [0, 1], [-100, 200]);
    const shineY = useTransform(springY, [0, 1], [-100, 200]);

    const intensityValues = {
        low: { rotateMultiplier: 0.5, glowOpacity: 0.1, shimmerOpacity: 0.3 },
        medium: { rotateMultiplier: 1, glowOpacity: 0.2, shimmerOpacity: 0.5 },
        high: { rotateMultiplier: 1.5, glowOpacity: 0.3, shimmerOpacity: 0.7 },
    };

    const { rotateMultiplier, glowOpacity, shimmerOpacity } = intensityValues[intensity];

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        mouseX.set(0.5);
        mouseY.set(0.5);
    };

    const glowColors: Record<string, string> = {
        emerald: "rgba(16, 185, 129, 0.4)",
        cyan: "rgba(6, 182, 212, 0.4)",
        purple: "rgba(168, 85, 247, 0.4)",
        pink: "rgba(236, 72, 153, 0.4)",
        amber: "rgba(245, 158, 11, 0.4)",
    };

    return (
        <motion.div
            ref={cardRef}
            className={cn(
                "relative rounded-2xl overflow-hidden cursor-pointer",
                "transform-gpu preserve-3d",
                className
            )}
            style={{
                rotateX: useTransform(rotateX, (v) => v * rotateMultiplier),
                rotateY: useTransform(rotateY, (v) => v * rotateMultiplier),
                perspective: 1000,
                willChange: "transform",
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            {/* Base card with border */}
            <div className="relative bg-stone-900/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                {/* Holographic rainbow gradient overlay */}
                <motion.div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                        background: useTransform(
                            [gradientX, gradientY],
                            ([x, y]) => `
                                linear-gradient(
                                    ${135 + (Number(x) - 50) * 0.5}deg,
                                    hsla(0, 100%, 70%, ${isHovered ? shimmerOpacity * 0.3 : 0}) 0%,
                                    hsla(60, 100%, 70%, ${isHovered ? shimmerOpacity * 0.3 : 0}) 20%,
                                    hsla(120, 100%, 70%, ${isHovered ? shimmerOpacity * 0.3 : 0}) 40%,
                                    hsla(180, 100%, 70%, ${isHovered ? shimmerOpacity * 0.3 : 0}) 60%,
                                    hsla(240, 100%, 70%, ${isHovered ? shimmerOpacity * 0.3 : 0}) 80%,
                                    hsla(300, 100%, 70%, ${isHovered ? shimmerOpacity * 0.3 : 0}) 100%
                                )
                            `
                        ),
                        opacity: isHovered ? 1 : 0,
                        mixBlendMode: "overlay",
                    }}
                />

                {/* Prismatic shine effect */}
                <motion.div
                    className="absolute inset-0 pointer-events-none z-20"
                    style={{
                        background: useTransform(
                            [shineX, shineY],
                            ([x, y]) => `
                                radial-gradient(
                                    circle at ${x}% ${y}%,
                                    rgba(255, 255, 255, ${isHovered ? 0.4 : 0}) 0%,
                                    rgba(255, 255, 255, 0) 50%
                                )
                            `
                        ),
                    }}
                />

                {/* Glitter particles (visible on hover) */}
                {isHovered && (
                    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 bg-white rounded-full"
                                initial={{
                                    x: `${Math.random() * 100}%`,
                                    y: `${Math.random() * 100}%`,
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: [0, 1, 0],
                                    scale: [0, 1, 0],
                                }}
                                transition={{
                                    duration: 1 + Math.random(),
                                    delay: Math.random() * 0.5,
                                    repeat: Infinity,
                                    repeatDelay: Math.random() * 2,
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Edge glow */}
                <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none z-5"
                    style={{
                        boxShadow: isHovered
                            ? `0 0 20px ${glowColors[glowColor]}, inset 0 0 20px ${glowColors[glowColor]}`
                            : "none",
                    }}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                />

                {/* Card content */}
                <div className="relative z-40">
                    {children}
                </div>
            </div>

            {/* Drop shadow that moves with tilt */}
            <motion.div
                className="absolute inset-0 -z-10 rounded-2xl"
                style={{
                    background: glowColors[glowColor],
                    filter: "blur(20px)",
                    transform: useTransform(
                        [rotateX, rotateY],
                        ([rx, ry]) => `translateX(${Number(ry) * 2}px) translateY(${Number(rx) * 2}px)`
                    ),
                    opacity: isHovered ? glowOpacity : 0,
                }}
            />
        </motion.div>
    );
}

// Preset: Product Card with holographic effect
export function HoloProductCard({
    image,
    title,
    price,
    originalPrice,
    badge,
    rating,
}: {
    image: string;
    title: string;
    price: string;
    originalPrice?: string;
    badge?: string;
    rating?: number;
}) {
    return (
        <HoloCard intensity="high" glowColor="emerald">
            <div className="p-4">
                {/* Badge */}
                {badge && (
                    <div className="absolute top-3 right-3 z-50 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                        <Sparkles className="w-3 h-3" />
                        {badge}
                    </div>
                )}

                {/* Image */}
                <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-stone-800 to-stone-900">
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                </div>

                {/* Content */}
                <h3 className="font-bold text-white mb-2 line-clamp-2">{title}</h3>

                {/* Rating */}
                {rating && (
                    <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                            <span
                                key={i}
                                className={i < rating ? "text-amber-400" : "text-stone-600"}
                            >
                                ★
                            </span>
                        ))}
                        <span className="text-xs text-stone-500 ml-1">({rating}.0)</span>
                    </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-emerald-400">{price}</span>
                    {originalPrice && (
                        <span className="text-sm text-stone-500 line-through">{originalPrice}</span>
                    )}
                </div>
            </div>
        </HoloCard>
    );
}

export default HoloCard;
