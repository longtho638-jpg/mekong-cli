"use client";

import { cn } from "@/lib/utils";
import { EFFECTS } from "@/lib/design-system";
import { motion } from "framer-motion";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    hoverEffect?: boolean;
    intensity?: "low" | "medium" | "high";
}

export function GlassPanel({
    children,
    className,
    hoverEffect = false,
    intensity = "medium",
    ...props
}: GlassPanelProps) {
    return (
        <motion.div
            className={cn(
                EFFECTS.glass,
                "rounded-2xl relative overflow-hidden",
                hoverEffect && "hover:border-emerald-500/50 hover:bg-white/10 transition-all duration-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
                intensity === "low" && "bg-white/[0.02]",
                intensity === "high" && "bg-white/[0.1]",
                className
            )}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            {...props as any}
        >
            {/* Glossy Reflection Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {children}
        </motion.div>
    );
}
