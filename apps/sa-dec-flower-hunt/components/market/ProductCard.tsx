"use client";

import { motion } from "framer-motion";
import {
    Leaf,
    History,
    QrCode,
    TrendingUp,
    ShoppingCart,
    ShieldCheck,
    Zap
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { Product } from "@/lib/data/mock-products";

interface ProductCardProps {
    product: Product;
    onAdd?: (id: string) => void;
    onTrace?: (id: string) => void;
}

export function ProductCard({ product, onAdd, onTrace }: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    const discount = Math.round((1 - product.price / product.originalPrice) * 100);

    return (
        <motion.div
            className="group relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ y: -5 }}
        >
            {/* Holographic Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/10 group-hover:via-transparent group-hover:to-purple-500/10 transition-all duration-500 pointer-events-none" />

            {/* Image Section (Digital Twin Container) */}
            <div className="relative h-64 w-full overflow-hidden bg-stone-900/50">
                {/* Grid Overlay for 'Digital' feel */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

                {/* Product Image */}
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <span className="text-8xl filter drop-shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse-slow">
                        {product.image}
                    </span>
                    {/* Placeholder for real image if available */}
                    {/* <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" /> */}
                </div>

                {/* Cyber Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <div className="bg-black/60 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[10px] font-mono px-2 py-1 rounded-sm flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>VERIFIED_ASSET</span>
                    </div>
                    {product.stock < 10 && (
                        <div className="bg-red-900/60 backdrop-blur-md border border-red-500/30 text-red-400 text-[10px] font-mono px-2 py-1 rounded-sm flex items-center gap-1 animate-pulse">
                            <Zap className="w-3 h-3" />
                            <span>LOW_LIQUIDITY: {product.stock}</span>
                        </div>
                    )}
                </div>

                {/* Trace Button (Holographic) */}
                <button
                    onClick={() => onTrace?.(product.id)}
                    className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-full hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-colors"
                >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                </button>

                {/* Quick Add Overlay */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-center"
                >
                    <button
                        onClick={() => onAdd?.(product.id)}
                        className="bg-emerald-500 text-black font-bold uppercase tracking-wider text-xs py-3 px-6 rounded-sm shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] flex items-center gap-2"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        Acquire Asset
                    </button>
                </motion.div>
            </div>

            {/* Data Terminal Content */}
            <div className="p-4 relative">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="text-[10px] text-emerald-500/70 font-mono tracking-widest mb-1">ASSET_ID: {product.id.split('-')[1] || product.id}</div>
                        <h3 className="text-white font-bold text-lg tracking-tight group-hover:text-emerald-400 transition-colors">{product.name}</h3>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 my-4">
                    <div className="bg-white/5 rounded-sm p-2 border border-white/5">
                        <div className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                            <History className="w-3 h-3" />
                            HARVEST
                        </div>
                        <div className="text-xs text-white font-medium mt-1">{product.stats.harvestDate}</div>
                    </div>
                    <div className="bg-white/5 rounded-sm p-2 border border-white/5">
                        <div className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                            <Leaf className="w-3 h-3" />
                            ORIGIN
                        </div>
                        <div className="text-xs text-white font-medium mt-1 truncate">{product.stats.origin}</div>
                    </div>
                </div>

                {/* Footer: Price & Hash */}
                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-stone-500 font-mono">CURRENT VALUE</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-emerald-400">
                                {(product.price).toLocaleString('vi-VN')}₫
                            </span>
                            {discount > 0 && (
                                <span className="text-xs text-stone-500 line-through">
                                    {(product.originalPrice).toLocaleString('vi-VN')}₫
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="flex items-center gap-1 justify-end text-[10px] text-emerald-500/50 font-mono">
                            <TrendingUp className="w-3 h-3" />
                            +2.4%
                        </div>
                        <div className="text-[10px] text-stone-600 font-mono truncate w-20">
                            {product.stats.blockchainHash}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
