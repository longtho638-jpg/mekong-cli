"use client";

import { motion } from "framer-motion";

// Bank Node: Credit Score Visualization
export const CreditScoreVisual = () => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 relative overflow-hidden font-mono">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative z-10 text-center">
                <div className="text-[10px] text-emerald-500 uppercase tracking-widest mb-2">CREDIT_SCORE</div>
                <div className="text-4xl font-bold text-white flex items-center justify-center gap-2">
                    <span className="text-emerald-400">AA+</span>
                    <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-emerald-500 rounded-full"
                    />
                </div>
                <div className="mt-2 w-32 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
                    <motion.div
                        className="h-full bg-emerald-500"
                        initial={{ width: "0%" }}
                        animate={{ width: "85%" }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                    />
                </div>
                <div className="text-[8px] text-stone-500 mt-2">RISK: LOW // CREDIT MODEL v1.0</div>
            </div>
        </div>
    );
};

// Logistics Node: Cold Chain Map
export const LogisticsMapVisual = () => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 relative overflow-hidden px-4">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="w-full space-y-2 relative z-10">
                <div className="flex justify-between items-center text-[9px] font-mono text-stone-400 border-b border-white/5 pb-1">
                    <span>ROUTE: SDC-HCM</span>
                    <span className="text-stone-600">[TARGET]</span>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[8px] text-stone-500 uppercase">TEMP</span>
                        <span className="text-xs font-mono text-cyan-400">18.5°C</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-[8px] text-stone-500 uppercase">HUMIDITY</span>
                        <span className="text-xs font-mono text-blue-400">65%</span>
                    </div>
                </div>
                {/* Simulated Graph */}
                <div className="flex items-end gap-1 h-8 mt-1 opacity-50">
                    {[40, 60, 45, 70, 55, 65, 80].map((h, i) => (
                        <motion.div
                            key={i}
                            className="w-full bg-emerald-500/20"
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Supplier Node: Inventory Grid
export const InventoryVisual = () => {
    return (
        <div className="w-full h-full bg-black/40 relative overflow-hidden p-3 font-mono text-[9px]">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="flex justify-between text-stone-500 mb-2 border-b border-white/5 pb-1">
                <span>SKU</span>
                <span>QTY</span>
                <span>STATUS</span>
            </div>
            <div className="space-y-1 relative z-10">
                {[
                    { sku: "NPK-20", qty: "450kg", status: "LOW" },
                    { sku: "SEED-OR", qty: "1.2k", status: "OK" },
                    { sku: "POT-C5", qty: "500u", status: "OK" },
                    { sku: "SENS-X", qty: "12u", status: "ORDER" }
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.2 }}
                        className="flex justify-between items-center"
                    >
                        <span className="text-stone-300">{item.sku}</span>
                        <span className="text-stone-400">{item.qty}</span>
                        <span className={item.status === "LOW" || item.status === "ORDER" ? "text-amber-400" : "text-emerald-400"}>
                            {item.status}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
