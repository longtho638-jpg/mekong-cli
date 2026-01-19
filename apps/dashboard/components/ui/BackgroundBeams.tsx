"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const BackgroundBeams = ({ className }: { className?: string }) => {
    return (
        <div
            className={cn(
                "absolute h-full w-full inset-0 overflow-hidden bg-neutral-950",
                className
            )}
        >
            <div className="absolute h-full w-full bg-neutral-950 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
            <div className="absolute left-0 top-0 h-full w-full">
                <div className="absolute h-[100vh] w-[100vw] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
            </div>
            <motion.div
                initial={{
                    opacity: 0,
                }}
                animate={{
                    opacity: 1,
                }}
                transition={{
                    duration: 0.5,
                }}
                className="absolute inset-0 h-full w-full"
            >
                <div className="absolute inset-0 bg-neutral-950 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
                <Beam className="top-10 left-10" delay={0} />
                <Beam className="top-40 left-60" delay={2} />
                <Beam className="top-20 left-[40%]" delay={4} />
            </motion.div>
        </div>
    );
};

const Beam = ({ className, delay }: { className?: string; delay: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 3], x: [0, 100, 200], y: [0, -100, -200] }}
            transition={{
                duration: 4,
                repeat: Infinity,
                delay: delay,
                ease: "easeInOut"
            }}
            className={cn("absolute w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-3xl", className)}
        />
    )
}
