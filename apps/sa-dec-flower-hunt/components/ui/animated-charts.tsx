"use client";

import { motion } from "framer-motion";

export const StreamingChart = () => {
    return (
        <div className="w-full h-full flex items-end justify-between px-2 pb-2 gap-1 bg-black/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="w-full bg-emerald-500/40 rounded-t-sm"
                    initial={{ height: "10%" }}
                    animate={{ height: ["10%", "80%", "30%", "60%"] }}
                    transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.1,
                    }}
                />
            ))}
        </div>
    );
};

export const DnaSpinner = () => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-black/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <motion.div
                className="w-24 h-24 border-2 border-emerald-500/30 rounded-full border-t-emerald-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
                className="absolute w-16 h-16 border-2 border-teal-500/30 rounded-full border-b-teal-400"
                animate={{ rotate: -360 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
};

export const GlobeNetwork = () => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-black/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            {/* Simple Abstract Globe */}
            <div className="relative w-32 h-32 rounded-full border border-emerald-500/20 flex items-center justify-center">
                <motion.div
                    className="absolute inset-0 border border-emerald-500/10 rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                />
                <div className="w-2 h-2 bg-emerald-400 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_#10b981]" />

                {/* Connection Lines */}
                <motion.div className="absolute w-full h-[1px] bg-emerald-500/20 top-1/2 left-0 rotate-45" />
                <motion.div className="absolute w-full h-[1px] bg-emerald-500/20 top-1/2 left-0 -rotate-45" />
            </div>
        </div>
    );
};
