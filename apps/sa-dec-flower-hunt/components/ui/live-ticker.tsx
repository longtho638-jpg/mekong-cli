"use client";

import { motion } from "framer-motion";

const TICKER_ITEMS = [
    { symbol: "SADEC-IDX", value: "1,402.50", change: "+2.4%", up: true },
    { symbol: "ORCHID-FUT", value: "$12.40", change: "+0.8%", up: true },
    { symbol: "ROSE-HEDG", value: "$4.20", change: "-1.2%", up: false },
    { symbol: "AGRI-BOND", value: "98.50", change: "+0.1%", up: true },
    { symbol: "NFT-VOL", value: "24.5K", change: "+15%", up: true },
    { symbol: "CHRYS-OPT", value: "$0.85", change: "+5.4%", up: true },
    { symbol: "LOTUS-SPOT", value: "$8.90", change: "-0.5%", up: false },
    { symbol: "SEED-RND", value: "$1.2B", change: "+12%", up: true },
];

export const LiveTicker = () => {
    return (
        <div className="fixed bottom-0 left-0 right-0 h-10 bg-black/90 border-t border-emerald-500/20 backdrop-blur-md z-50 flex items-center overflow-hidden font-mono text-xs">
            <div className="flex items-center absolute left-0 bg-stone-900/80 h-full px-4 z-10 border-r border-stone-700 text-stone-500 font-bold tracking-widest">
                DEMO DATA_
            </div>

            <motion.div
                className="flex whitespace-nowrap"
                animate={{ x: [0, -1000] }}
                transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            >
                {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 mx-6">
                        <span className="text-stone-500">{item.symbol}</span>
                        <span className="text-stone-200">{item.value}</span>
                        <span className={item.up ? "text-emerald-400" : "text-red-400"}>
                            {item.up ? "▲" : "▼"} {item.change}
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
};
