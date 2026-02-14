"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const GlitchButton = ({
    text,
    onClick,
    className,
}: {
    text: string;
    onClick?: () => void;
    className?: string;
}) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative group px-8 py-4 font-bold text-white bg-black overflow-hidden rounded-full",
                className
            )}
        >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            <span className="relative z-10 flex items-center justify-center gap-2">
                {text}
                <motion.span
                    className="absolute opacity-0 group-hover:opacity-100 text-red-500 mix-blend-screen"
                    animate={{ x: [-2, 2, -2], y: [1, -1, 1] }}
                    transition={{ repeat: Infinity, duration: 0.2 }}
                >
                    {text}
                </motion.span>
                <motion.span
                    className="absolute opacity-0 group-hover:opacity-100 text-cyan-500 mix-blend-screen"
                    animate={{ x: [2, -2, 2], y: [-1, 1, -1] }}
                    transition={{ repeat: Infinity, duration: 0.2, delay: 0.1 }}
                >
                    {text}
                </motion.span>
            </span>
        </button>
    );
};
