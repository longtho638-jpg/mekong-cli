"use client";
import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SpotlightProps = {
    className?: string;
    fill?: string;
};

export const Spotlight = ({ className, fill = "white" }: SpotlightProps) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className={cn(
                "pointer-events-none absolute inset-0 z-0 h-full w-full",
                className
            )}
        >
            <svg
                className="h-full w-full"
                viewBox="0 0 1000 1000"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <radialGradient
                        id="spotlight-gradient"
                        cx="50%"
                        cy="0%"
                        r="100%"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0%" stopColor={fill} stopOpacity="0.3" />
                        <stop offset="50%" stopColor={fill} stopOpacity="0.1" />
                        <stop offset="100%" stopColor={fill} stopOpacity="0" />
                    </radialGradient>
                </defs>
                <ellipse
                    cx="500"
                    cy="0"
                    rx="800"
                    ry="600"
                    fill="url(#spotlight-gradient)"
                />
            </svg>
        </motion.div>
    );
};

export const SpotlightCard = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseEnter = () => setOpacity(1);
    const handleMouseLeave = () => setOpacity(0);

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-8",
                className
            )}
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(120,119,198,.1), transparent 40%)`,
                }}
            />
            {children}
        </div>
    );
};
