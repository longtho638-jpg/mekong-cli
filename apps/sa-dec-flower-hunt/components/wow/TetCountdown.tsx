"use client";

// ============================================================================
// TẾT COUNTDOWN - Fireworks + Festival Timer
// ============================================================================
// Animated countdown to Tết 2026 with particle fireworks
// ============================================================================

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TetCountdownProps {
    targetDate?: Date;
    className?: string;
    compact?: boolean;
}

interface Firework {
    id: number;
    x: number;
    y: number;
    color: string;
    particles: Particle[];
}

interface Particle {
    angle: number;
    velocity: number;
    color: string;
    size: number;
}

const COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#f59e0b", // amber
];

// Tết 2026 - Lunar New Year (approximately January 29, 2026)
const TET_2026 = new Date("2026-01-29T00:00:00+07:00");

export function TetCountdown({
    targetDate = TET_2026,
    className,
    compact = false
}: TetCountdownProps) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });
    const [fireworks, setFireworks] = useState<Firework[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Update countdown
    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const target = targetDate.getTime();
            const diff = target - now;

            if (diff <= 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }

            return {
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
            };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    // Launch fireworks periodically
    useEffect(() => {
        const launchFirework = () => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.random() * rect.width;
            const y = Math.random() * rect.height * 0.6 + rect.height * 0.1;

            const particleCount = 12 + Math.floor(Math.random() * 8);
            const baseColor = COLORS[Math.floor(Math.random() * COLORS.length)];

            const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
                angle: (360 / particleCount) * i + Math.random() * 20,
                velocity: 40 + Math.random() * 40,
                color: Math.random() > 0.3 ? baseColor : COLORS[Math.floor(Math.random() * COLORS.length)],
                size: 2 + Math.random() * 3,
            }));

            const newFirework: Firework = {
                id: Date.now() + Math.random(),
                x,
                y,
                color: baseColor,
                particles,
            };

            setFireworks(prev => [...prev, newFirework]);

            // Remove firework after animation
            setTimeout(() => {
                setFireworks(prev => prev.filter(f => f.id !== newFirework.id));
            }, 2000);
        };

        // Launch fireworks at random intervals
        const interval = setInterval(() => {
            if (Math.random() > 0.3) launchFirework();
        }, 800);

        // Initial burst
        setTimeout(launchFirework, 500);
        setTimeout(launchFirework, 800);

        return () => clearInterval(interval);
    }, []);

    const TimeBlock = ({ value, label }: { value: number; label: string }) => (
        <div className="flex flex-col items-center">
            <motion.div
                key={value}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
            >
                <div className={cn(
                    "bg-gradient-to-b from-red-900/80 to-red-950/90 rounded-2xl flex items-center justify-center border border-red-500/30 backdrop-blur-sm shadow-lg shadow-red-500/20",
                    compact ? "w-14 h-16" : "w-20 h-24 md:w-28 md:h-32"
                )}>
                    <span className={cn(
                        "font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500",
                        compact ? "text-2xl" : "text-4xl md:text-5xl"
                    )}>
                        {String(value).padStart(2, "0")}
                    </span>
                </div>
                {/* Decorative corners */}
                {!compact && (
                    <>
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-amber-500/50 rounded-tl" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-amber-500/50 rounded-tr" />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-amber-500/50 rounded-bl" />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-amber-500/50 rounded-br" />
                    </>
                )}
            </motion.div>
            <span className={cn(
                "font-medium text-amber-400/80 uppercase tracking-wider",
                compact ? "mt-1 text-[10px]" : "mt-2 text-sm md:text-base"
            )}>
                {label}
            </span>
        </div>
    );

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full overflow-hidden rounded-3xl",
                "bg-gradient-to-b from-red-950 via-stone-950 to-red-950",
                compact ? "min-h-[200px]" : "min-h-[500px]",
                className
            )}
        >
            {/* Stars background */}
            <div className="absolute inset-0">
                {[...Array(50)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            opacity: [0.2, 1, 0.2],
                            scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            {/* Fireworks */}
            <AnimatePresence>
                {fireworks.map((fw) => (
                    <div
                        key={fw.id}
                        className="absolute pointer-events-none"
                        style={{ left: fw.x, top: fw.y }}
                    >
                        {fw.particles.map((p, i) => (
                            <motion.div
                                key={i}
                                className="absolute rounded-full"
                                style={{
                                    width: p.size,
                                    height: p.size,
                                    backgroundColor: p.color,
                                    boxShadow: `0 0 6px ${p.color}, 0 0 12px ${p.color}`,
                                }}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                animate={{
                                    x: Math.cos((p.angle * Math.PI) / 180) * p.velocity,
                                    y: Math.sin((p.angle * Math.PI) / 180) * p.velocity + 30,
                                    opacity: 0,
                                    scale: 0,
                                }}
                                transition={{
                                    duration: 1.5,
                                    ease: "easeOut",
                                }}
                            />
                        ))}
                        {/* Center flash */}
                        <motion.div
                            className="absolute w-4 h-4 -translate-x-2 -translate-y-2 rounded-full"
                            style={{ backgroundColor: fw.color }}
                            initial={{ opacity: 1, scale: 1 }}
                            animate={{ opacity: 0, scale: 3 }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                ))}
            </AnimatePresence>

            {/* Content */}
            <div className={cn(
                "relative z-10 flex flex-col items-center justify-center",
                compact ? "min-h-[200px] p-4" : "min-h-[500px] p-8"
            )}>
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("text-center", compact ? "mb-4" : "mb-8")}
                >
                    <div className={compact ? "text-3xl mb-1" : "text-6xl md:text-8xl font-black mb-2"}>🧧</div>
                    <h2 className={cn(
                        "font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-red-400 to-amber-400",
                        compact ? "text-xl" : "text-3xl md:text-5xl"
                    )}>
                        {compact ? "ĐẾM NGƯỢC TẾT 2026" : "CHÚC MỪNG NĂM MỚI"}
                    </h2>
                    {!compact && (
                        <p className="text-lg md:text-xl text-amber-300/70 mt-2">
                            Tết Nguyên Đán 2026 • Năm Bính Ngọ
                        </p>
                    )}
                </motion.div>

                {/* Countdown */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className={cn("flex", compact ? "gap-2" : "gap-3 md:gap-6")}
                >
                    <TimeBlock value={timeLeft.days} label="Ngày" />
                    <div className={cn("flex items-center text-amber-500/50 font-bold", compact ? "text-xl" : "text-4xl")}>:</div>
                    <TimeBlock value={timeLeft.hours} label="Giờ" />
                    <div className={cn("flex items-center text-amber-500/50 font-bold", compact ? "text-xl" : "text-4xl")}>:</div>
                    <TimeBlock value={timeLeft.minutes} label="Phút" />
                    <div className={cn("flex items-center text-amber-500/50 font-bold", compact ? "text-xl" : "text-4xl")}>:</div>
                    <TimeBlock value={timeLeft.seconds} label="Giây" />
                </motion.div>

                {/* Tagline */}
                {!compact && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-8 text-center text-amber-400/60 max-w-md"
                    >
                        🌸 Hẹn gặp bạn tại Làng Hoa Sa Đéc • Mùa Xuân 2026 🌸
                    </motion.p>
                )}
            </div>

            {/* Bottom lanterns */}
            {!compact && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-around px-8 opacity-60">
                    {["🏮", "🎐", "🏮", "🎐", "🏮"].map((emoji, i) => (
                        <motion.span
                            key={i}
                            className="text-3xl"
                            animate={{ y: [0, -5, 0] }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.3,
                            }}
                        >
                            {emoji}
                        </motion.span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TetCountdown;
