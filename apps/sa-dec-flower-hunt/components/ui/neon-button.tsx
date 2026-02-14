"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { EFFECTS } from "@/lib/design-system";
import { motion } from "framer-motion";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "danger";
    glow?: boolean;
}

export function NeonButton({
    children,
    className,
    variant = "primary",
    glow = true,
    ...props
}: NeonButtonProps) {
    const variants = {
        primary: "bg-emerald-500 text-black hover:bg-emerald-400 font-bold",
        secondary: "bg-stone-800 text-emerald-400 hover:bg-stone-700 border border-emerald-500/20",
        outline: "bg-transparent text-emerald-400 border border-emerald-500 hover:bg-emerald-500/10",
        danger: "bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20"
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
                "px-6 py-3 rounded-xl relative overflow-hidden transition-all duration-300",
                variants[variant],
                glow && variant === 'primary' && "shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]",
                className
            )}
            {...props as any}
        >
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />

            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>
        </motion.button>
    );
}
