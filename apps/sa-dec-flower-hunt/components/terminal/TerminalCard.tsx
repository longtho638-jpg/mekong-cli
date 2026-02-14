"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
};

interface TerminalCardProps {
    children: ReactNode;
    className?: string;
    glowOnHover?: boolean;
}

export const TerminalCard = ({ children, className = "", glowOnHover = false }: TerminalCardProps) => {
    return (
        <motion.div
            className={`bg-slate-950/40 border border-emerald-500/20 rounded-sm p-4 ${glowOnHover ? 'hover:border-emerald-500/50 transition-colors' : ''} ${className}`}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeIn}
        >
            {children}
        </motion.div>
    );
};
