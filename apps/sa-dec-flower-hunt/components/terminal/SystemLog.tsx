"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface SystemLogEntry {
    timestamp: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
}

interface SystemLogProps {
    entries: SystemLogEntry[];
    maxEntries?: number;
}

export const SystemLog = ({ entries, maxEntries = 5 }: SystemLogProps) => {
    const [visibleEntries, setVisibleEntries] = useState<SystemLogEntry[]>([]);

    useEffect(() => {
        setVisibleEntries(entries.slice(-maxEntries));
    }, [entries, maxEntries]);

    const typeColors = {
        info: 'text-emerald-500/60',
        success: 'text-emerald-500',
        warning: 'text-amber-500',
        error: 'text-red-500',
    };

    return (
        <div className="font-mono text-[10px] space-y-1 overflow-hidden">
            {visibleEntries.map((entry, index) => (
                <motion.div
                    key={`${entry.timestamp}-${index}`}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={typeColors[entry.type || 'info']}
                >
                    [{entry.timestamp}] {entry.message}
                </motion.div>
            ))}
        </div>
    );
};
