"use client";

import { motion, useMotionTemplate, useMotionValue, useTransform } from "framer-motion";
import { MouseEvent } from "react";
import { useAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export const ThreeDCard = ({ children, className, onClick, ...props }: any) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Tilt effect based on generic x/y (if using drag) or we can just use mouseX/mouseY
    // Let's stick to the original simple mouse tilt for better UX on grids

    const { track } = useAnalytics();

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const xPos = clientX - left;
        const yPos = clientY - top;

        mouseX.set(xPos);
        mouseY.set(yPos);

        // Calculate tilt
        const xPct = xPos / width - 0.5;
        const yPct = yPos / height - 0.5;

        x.set(xPct * 20); // Rotate Y
        y.set(yPct * -20); // Rotate X
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
        mouseX.set(0);
        mouseY.set(0);
    }

    const handleClick = (e: any) => {
        track("product_view", { component: "ThreeDCard" });
        if (onClick) onClick(e);
    };

    return (
        <motion.div
            className={cn(
                "group relative border border-white/10 bg-gray-900/40 backdrop-blur-xl overflow-hidden rounded-xl transition-transform duration-200 ease-out transform-style-3d cursor-pointer",
                className
            )}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            style={{
                rotateX: y,
                rotateY: x,
                perspective: 1000
            }}
            whileHover={{ scale: 1.02 }}
            {...props}
        >
            {/* Holographic Shine */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100 z-0"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            650px circle at ${mouseX}px ${mouseY}px,
                            rgba(34, 211, 238, 0.15),
                            transparent 80%
                        )
                    `,
                }}
            />

            {/* Content Content - Ensure Z-index is above shine */}
            <div className="relative z-10 h-full flex flex-col">
                {children}
            </div>
        </motion.div>
    );
};
