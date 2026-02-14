"use client";

import { motion } from "framer-motion";
import { Sprout, ShoppingBag, Building2, Package, Truck } from "lucide-react";

const STAKEHOLDERS = [
    { id: "bank", icon: Building2, label: "Ngân Hàng", color: "amber" },
    { id: "supplier", icon: Package, label: "Nhà Cung Cấp", color: "purple" },
    { id: "logistics", icon: Truck, label: "Shipper", color: "rose" },
] as const;

interface StakeholderSelectorProps {
    onSelect: (role: string) => void;
}

export function StakeholderSelector({ onSelect }: StakeholderSelectorProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 mt-6"
        >
            <span className="text-[10px] text-stone-600 uppercase tracking-wider font-mono">
                Bạn là:
            </span>
            <div className="flex items-center gap-2">
                {STAKEHOLDERS.map((s, i) => (
                    <motion.button
                        key={s.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        onClick={() => onSelect(s.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 border border-stone-800 rounded hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all text-stone-500 hover:text-emerald-400"
                    >
                        <s.icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono uppercase tracking-wider">{s.label}</span>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}
