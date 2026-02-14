"use client";

// ============================================================================
// BLOOM ANIMATION - Interactive Flower Blooming Effect
// ============================================================================
// Flowers that bloom/open on hover with petal animations
// ============================================================================

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface BloomFlowerProps {
    variant?: "rose" | "lotus" | "sakura" | "sunflower";
    size?: "sm" | "md" | "lg";
    className?: string;
    autoBloom?: boolean;
}

const FLOWER_CONFIGS = {
    rose: {
        petalCount: 12,
        layers: 3,
        colors: ["#f43f5e", "#fb7185", "#fda4af"],
        centerColor: "#fcd34d",
        petalShape: "ellipse",
    },
    lotus: {
        petalCount: 8,
        layers: 2,
        colors: ["#ec4899", "#f472b6", "#f9a8d4"],
        centerColor: "#fde047",
        petalShape: "pointed",
    },
    sakura: {
        petalCount: 5,
        layers: 1,
        colors: ["#fce7f3", "#fbcfe8", "#f9a8d4"],
        centerColor: "#fef08a",
        petalShape: "heart",
    },
    sunflower: {
        petalCount: 16,
        layers: 2,
        colors: ["#facc15", "#fde047", "#fef08a"],
        centerColor: "#78350f",
        petalShape: "long",
    },
};

const SIZE_MAP = {
    sm: { scale: 0.6, petalSize: 30 },
    md: { scale: 1, petalSize: 50 },
    lg: { scale: 1.5, petalSize: 70 },
};

export function BloomFlower({
    variant = "rose",
    size = "md",
    className,
    autoBloom = false,
}: BloomFlowerProps) {
    const [isBloom, setIsBloom] = useState(autoBloom);
    const config = FLOWER_CONFIGS[variant];
    const sizeConfig = SIZE_MAP[size];

    const petalVariants: Variants = {
        closed: (i: number) => ({
            rotate: (360 / config.petalCount) * i,
            scaleY: 0.3,
            y: 0,
            opacity: 0.5,
        }),
        bloom: (i: number) => ({
            rotate: (360 / config.petalCount) * i + (i % 2 === 0 ? 5 : -5),
            scaleY: 1,
            y: -sizeConfig.petalSize * 0.6,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 10,
                delay: i * 0.05,
            },
        }),
    };

    const getPetalPath = () => {
        switch (config.petalShape) {
            case "pointed":
                return "M0,0 C15,-30 15,-60 0,-80 C-15,-60 -15,-30 0,0";
            case "heart":
                return "M0,0 C20,-20 30,-50 0,-70 C-30,-50 -20,-20 0,0";
            case "long":
                return "M0,0 C10,-20 10,-70 0,-90 C-10,-70 -10,-20 0,0";
            default: // ellipse
                return "M0,0 C20,-20 20,-60 0,-80 C-20,-60 -20,-20 0,0";
        }
    };

    const renderPetals = (layer: number) => {
        const offset = layer * (360 / config.petalCount / config.layers);
        const layerScale = 1 - layer * 0.15;

        return [...Array(config.petalCount)].map((_, i) => (
            <motion.div
                key={`${layer}-${i}`}
                custom={i}
                variants={petalVariants}
                initial="closed"
                animate={isBloom ? "bloom" : "closed"}
                className="absolute origin-bottom"
                style={{
                    width: sizeConfig.petalSize * 0.4,
                    height: sizeConfig.petalSize,
                    transformOrigin: "bottom center",
                }}
            >
                <svg
                    viewBox="-30 -90 60 90"
                    className="w-full h-full"
                    style={{
                        filter: `drop-shadow(0 0 4px ${config.colors[layer]})`,
                    }}
                >
                    <path
                        d={getPetalPath()}
                        fill={config.colors[layer]}
                        stroke={config.colors[0]}
                        strokeWidth="1"
                        opacity={layerScale}
                    />
                </svg>
            </motion.div>
        ));
    };

    return (
        <motion.div
            className={cn(
                "relative cursor-pointer flex items-center justify-center",
                className
            )}
            style={{
                width: sizeConfig.petalSize * 3,
                height: sizeConfig.petalSize * 3,
                transform: `scale(${sizeConfig.scale})`,
            }}
            onMouseEnter={() => setIsBloom(true)}
            onMouseLeave={() => !autoBloom && setIsBloom(false)}
            whileHover={{ scale: 1.1 }}
        >
            {/* Glow effect */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: sizeConfig.petalSize * 2,
                    height: sizeConfig.petalSize * 2,
                    background: `radial-gradient(circle, ${config.colors[2]}40 0%, transparent 70%)`,
                }}
                animate={{
                    scale: isBloom ? [1, 1.3, 1.1] : 0.5,
                    opacity: isBloom ? 1 : 0,
                }}
                transition={{ duration: 0.5 }}
            />

            {/* Petals - render each layer */}
            <div className="absolute flex items-center justify-center">
                {[...Array(config.layers)].map((_, layer) => (
                    <div
                        key={layer}
                        className="absolute flex items-center justify-center"
                        style={{
                            transform: `rotate(${layer * (360 / config.petalCount / config.layers / 2)}deg)`,
                        }}
                    >
                        {renderPetals(layer)}
                    </div>
                ))}
            </div>

            {/* Center */}
            <motion.div
                className="absolute rounded-full z-10"
                style={{
                    backgroundColor: config.centerColor,
                    boxShadow: `0 0 10px ${config.centerColor}, inset 0 -5px 15px rgba(0,0,0,0.2)`,
                }}
                animate={{
                    width: isBloom ? sizeConfig.petalSize * 0.5 : sizeConfig.petalSize * 0.3,
                    height: isBloom ? sizeConfig.petalSize * 0.5 : sizeConfig.petalSize * 0.3,
                    scale: isBloom ? [1, 1.2, 1] : 1,
                }}
                transition={{ type: "spring", stiffness: 200 }}
            />

            {/* Pollen particles */}
            {isBloom && (
                <div className="absolute">
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 rounded-full bg-yellow-300"
                            initial={{ x: 0, y: 0, opacity: 0 }}
                            animate={{
                                x: Math.cos((i * 45 * Math.PI) / 180) * 40,
                                y: Math.sin((i * 45 * Math.PI) / 180) * 40 - 20,
                                opacity: [0, 1, 0],
                            }}
                            transition={{
                                duration: 2,
                                delay: i * 0.1,
                                repeat: Infinity,
                            }}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// Bloom Garden - Multiple flowers
export function BloomGarden({ className }: { className?: string }) {
    const flowers = [
        { variant: "rose" as const, x: "10%", y: "20%", size: "lg" as const },
        { variant: "lotus" as const, x: "30%", y: "60%", size: "md" as const },
        { variant: "sakura" as const, x: "50%", y: "30%", size: "lg" as const },
        { variant: "sunflower" as const, x: "70%", y: "50%", size: "md" as const },
        { variant: "rose" as const, x: "85%", y: "25%", size: "sm" as const },
        { variant: "sakura" as const, x: "15%", y: "70%", size: "sm" as const },
        { variant: "lotus" as const, x: "80%", y: "75%", size: "lg" as const },
    ];

    return (
        <div className={cn("relative w-full h-full min-h-[400px]", className)}>
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 via-stone-950 to-emerald-950" />

            {/* Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-emerald-900/50 to-transparent" />

            {/* Flowers */}
            {flowers.map((flower, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: flower.x, top: flower.y }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.15 }}
                >
                    <BloomFlower variant={flower.variant} size={flower.size} />
                </motion.div>
            ))}

            {/* Instruction */}
            <motion.p
                className="absolute bottom-4 left-1/2 -translate-x-1/2 text-emerald-400/60 text-sm"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                Hover over flowers to make them bloom 🌸
            </motion.p>
        </div>
    );
}

export default BloomFlower;
