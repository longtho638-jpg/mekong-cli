"use client";

// ============================================================================
// FIREFLY GARDEN - Interactive Particle System (Canvas Optimized)
// ============================================================================

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface Firefly {
    x: number;
    y: number;
    size: number;
    opacity: number;
    speed: number;
    angle: number;
    hue: number;
    pulsePhase: number;
}

interface FlowerCluster {
    x: number;
    y: number;
    emoji: string;
    scale: number;
    rotation: number;
}

interface FireflyGardenProps {
    className?: string;
    fireflyCount?: number;
    flowerCount?: number;
    interactive?: boolean;
    showFlowers?: boolean;
}

export function FireflyGarden({
    className,
    fireflyCount = 50,
    flowerCount = 15,
    interactive = true,
    showFlowers = true,
}: FireflyGardenProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [flowers, setFlowers] = useState<FlowerCluster[]>([]);
    const [auroraPosition, setAuroraPosition] = useState({ x: 50, y: 50 });

    // Mouse position refs for direct access in canvas loop (no closure staleness)
    const mouseRef = useRef({ x: 0, y: 0 });

    // Initialize Flowers (Static DOM)
    useEffect(() => {
        const flowerEmojis = ['🌸', '🌺', '🌹', '🌻', '🌷', '🪻', '🌼', '💐', '🌿', '🍀'];
        const newFlowers: FlowerCluster[] = Array.from({ length: flowerCount }, () => ({
            x: 10 + Math.random() * 80,
            y: 60 + Math.random() * 35,
            emoji: flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)],
            scale: 0.8 + Math.random() * 0.8,
            rotation: -15 + Math.random() * 30,
        }));
        setFlowers(newFlowers);
    }, [flowerCount]);

    // Canvas Animation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let fireflies: Firefly[] = [];
        let width = 0;
        let height = 0;

        const initFireflies = () => {
            width = canvas.offsetWidth;
            height = canvas.offsetHeight;
            canvas.width = width;
            canvas.height = height;

            fireflies = Array.from({ length: fireflyCount }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                size: 2 + Math.random() * 4,
                opacity: 0.3 + Math.random() * 0.7,
                speed: 0.2 + Math.random() * 0.5,
                angle: Math.random() * Math.PI * 2,
                hue: 80 + Math.random() * 60,
                pulsePhase: Math.random() * Math.PI * 2,
            }));
        };

        const render = (time: number) => {
            ctx.clearRect(0, 0, width, height);

            // Update & Draw Fireflies
            fireflies.forEach(firefly => {
                // Logic
                let newX = firefly.x + Math.cos(firefly.angle) * firefly.speed;
                let newY = firefly.y + Math.sin(firefly.angle) * firefly.speed;

                // Random wiggle
                if (Math.random() < 0.02) {
                    firefly.angle += (Math.random() - 0.5) * 0.5;
                }

                // Interactive Mouse Attraction
                if (interactive) {
                    const dx = mouseRef.current.x - newX;
                    const dy = mouseRef.current.y - newY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150 && dist > 20) {
                        newX += (dx / dist) * 0.5;
                        newY += (dy / dist) * 0.5;
                    } else if (dist <= 20) {
                        newX -= (dx / dist) * 2;
                        newY -= (dy / dist) * 2;
                    }
                }

                // Boundary Wrap
                if (newX < 0) newX = width;
                if (newX > width) newX = 0;
                if (newY < 0) newY = height;
                if (newY > height) newY = 0;

                firefly.x = newX;
                firefly.y = newY;

                // Draw
                const pulse = Math.sin(time / 1000 + firefly.pulsePhase) * 0.3 + 0.7;
                const currentOpacity = firefly.opacity * pulse;

                ctx.beginPath();
                ctx.arc(firefly.x, firefly.y, firefly.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${firefly.hue}, 100%, 70%, ${currentOpacity})`;
                ctx.fill();

                // Glow
                ctx.beginPath();
                ctx.arc(firefly.x, firefly.y, firefly.size * 2, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${firefly.hue}, 100%, 70%, ${currentOpacity * 0.3})`;
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        // Initial setup
        initFireflies();
        render(performance.now());

        // Handle Resize
        const handleResize = () => initFireflies();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [fireflyCount, interactive]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Update ref for canvas
            mouseRef.current = { x, y };

            // Update state for aurora (CSS transform is cheap)
            setAuroraPosition({
                x: (x / rect.width) * 100,
                y: (y / rect.height) * 100,
            });
        }
    }, []);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full h-full overflow-hidden bg-gradient-to-b from-stone-950 via-emerald-950/20 to-stone-950",
                className
            )}
            onMouseMove={handleMouseMove}
        >
            {/* Night sky gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-indigo-950/30" />

            {/* Aurora glow effect (DOM/CSS is fine here) */}
            <motion.div
                className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
                style={{
                    background: `radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.08) 40%, transparent 70%)`,
                    left: `${auroraPosition.x}%`,
                    top: `${auroraPosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Canvas Layer for Particles */}
            <canvas 
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Flower clusters (DOM) */}
            {showFlowers && (
                <div className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none">
                    {flowers.map((flower, i) => (
                        <motion.div
                            key={i}
                            className="absolute text-4xl select-none"
                            style={{
                                left: `${flower.x}%`,
                                bottom: `${Math.random() * 20}%`,
                                transform: `scale(${flower.scale}) rotate(${flower.rotation}deg)`,
                            }}
                            animate={{
                                y: [0, -5, 0],
                                rotate: [flower.rotation, flower.rotation + 3, flower.rotation],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: Math.random() * 2,
                            }}
                        >
                            {flower.emoji}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Overlay Effects */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)' }}
            />
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.03) 1px, rgba(255,255,255,0.03) 2px)' }}
            />
        </div>
    );
}

export default FireflyGarden;
