"use client";

import { motion } from "framer-motion";
import {
    CheckCircle2,
    Truck,
    Sprout,
    Store,
    ArrowRight
} from "lucide-react";

interface Step {
    id: string;
    icon: React.ReactNode;
    label: string;
    date: string;
    hash: string;
    status: 'completed' | 'pending' | 'processing';
}

interface TraceabilityVisualizerProps {
    productId: string;
    onClose?: () => void;
}

export function TraceabilityVisualizer({ productId, onClose }: TraceabilityVisualizerProps) {
    // Mock simulation of traceability data
    const steps: Step[] = [
        {
            id: 'seed',
            icon: <Sprout className="w-5 h-5" />,
            label: "Seeding & Growth",
            date: "2025-10-15",
            hash: "0x8f...2a91",
            status: 'completed'
        },
        {
            id: 'harvest',
            icon: <CheckCircle2 className="w-5 h-5" />,
            label: "Harvest & QC",
            date: "2025-12-09 08:30",
            hash: "0x3c...b112",
            status: 'completed'
        },
        {
            id: 'transit',
            icon: <Truck className="w-5 h-5" />,
            label: "Cold Chain Transport",
            date: "2025-12-09 14:00",
            hash: "0x1d...e445",
            status: 'processing'
        },
        {
            id: 'store',
            icon: <Store className="w-5 h-5" />,
            label: "Market Listing",
            date: "Pending",
            hash: "---",
            status: 'pending'
        }
    ];

    return (
        <div className="w-full bg-stone-900/80 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        BLOCKCHAIN TRACEABILITY
                    </h3>
                    <p className="text-stone-500 text-xs font-mono mt-1">ASSET_REF: {productId}</p>
                </div>
                <div className="text-emerald-500/50 text-[10px] font-mono border border-emerald-500/20 px-2 py-1 rounded">
                    NETWORK: AGRI-CHAIN-V3
                </div>
            </div>

            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-stone-800">
                    <motion.div
                        initial={{ height: "0%" }}
                        animate={{ height: "60%" }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="w-full bg-emerald-500/50"
                    />
                </div>

                <div className="space-y-6">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.2 }}
                            className="relative flex items-center gap-4 group"
                        >
                            {/* Step Indicator */}
                            <div className={`relative z-10 w-14 h-14 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-300
                                ${step.status === 'completed' ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400' :
                                    step.status === 'processing' ? 'bg-amber-900/20 border-amber-500 text-amber-400 animate-pulse' :
                                        'bg-stone-800/50 border-stone-700 text-stone-500'}`}
                            >
                                {step.icon}
                            </div>

                            {/* Verification Badge */}
                            {step.status === 'completed' && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.2 + 0.3 }}
                                    className="absolute left-10 -bottom-1 bg-black text-emerald-500 rounded-full p-0.5"
                                >
                                    <CheckCircle2 className="w-4 h-4 fill-black" />
                                </motion.div>
                            )}

                            {/* Content */}
                            <div className="flex-1 bg-white/5 border border-white/5 rounded-lg p-3 hover:border-emerald-500/20 transition-colors">
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-bold text-sm ${step.status === 'pending' ? 'text-stone-500' : 'text-white'}`}>
                                        {step.label}
                                    </h4>
                                    <span className="text-[10px] font-mono text-stone-500">{step.date}</span>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-emerald-500/60 truncate max-w-[150px]">
                                        TX: {step.hash}
                                    </span>
                                    {step.status === 'completed' && (
                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 rounded">VERIFIED</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
