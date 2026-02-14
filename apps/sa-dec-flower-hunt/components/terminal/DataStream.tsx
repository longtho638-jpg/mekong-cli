"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface DataStreamProps {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    unit?: string;
}

export const DataStream = ({ label, value, trend, unit }: DataStreamProps) => {
    const [animatedValue, setAnimatedValue] = useState(value);

    useEffect(() => {
        setAnimatedValue(value);
    }, [value]);

    const trendColors = {
        up: 'text-emerald-400',
        down: 'text-red-400',
        neutral: 'text-white',
    };

    const trendIcons = {
        up: '↗',
        down: '↘',
        neutral: '→',
    };

    return (
        <div className="bg-emerald-900/10 border border-emerald-500/10 p-3 rounded-sm">
            <div className="text-[10px] text-stone-500 uppercase mb-1 font-mono">{label}</div>
            <motion.div
                className={`text-xl font-mono font-bold ${trend ? trendColors[trend] : 'text-white'} flex items-baseline gap-1`}
                key={animatedValue}
                initial={{ scale: 1.1, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                {animatedValue}{unit && <span className="text-sm">{unit}</span>}
                {trend && <span className="text-sm ml-1">{trendIcons[trend]}</span>}
            </motion.div>
        </div>
    );
};
