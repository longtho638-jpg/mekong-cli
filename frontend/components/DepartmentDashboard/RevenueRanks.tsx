'use client';

import { motion } from 'framer-motion';
import { User, Shield, Crown } from 'lucide-react';
import { HoloCard } from '@/components/ui/HoloCard';

export function RevenueRanks() {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white/50 uppercase tracking-widest text-xs font-orbitron">
                <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
                The Army (Lực Lượng Chiến Đấu)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Infantry */}
                <HoloCard className="border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-400" />
                            <span className="font-orbitron text-sm text-blue-200">Bộ Binh (Standard)</span>
                        </div>
                        <span className="text-2xl font-bold text-white font-orbitron">$25K</span>
                    </div>
                    <div className="w-full bg-blue-900/20 rounded-full h-1.5 mb-2 overflow-hidden">
                        <motion.div
                            className="bg-blue-500 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: '12%' }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-blue-400/60 font-mono">
                        <span>65 Combat Units</span>
                        <span className="text-blue-400">+12%</span>
                    </div>
                </HoloCard>

                {/* Cavalry */}
                <HoloCard className="border-l-4 border-l-purple-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-purple-400" />
                            <span className="font-orbitron text-sm text-purple-200">Kỵ Binh (Specialized)</span>
                        </div>
                        <span className="text-2xl font-bold text-white font-orbitron">$85K</span>
                    </div>
                    <div className="w-full bg-purple-900/20 rounded-full h-1.5 mb-2 overflow-hidden">
                        <motion.div
                            className="bg-purple-500 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: '18%' }}
                            transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-purple-400/60 font-mono">
                        <span>12 Combat Units</span>
                        <span className="text-purple-400">+18%</span>
                    </div>
                </HoloCard>

                {/* Generals */}
                <HoloCard className="border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-amber-400" />
                            <span className="font-orbitron text-sm text-amber-200">Tướng Quân (Equity)</span>
                        </div>
                        <span className="text-2xl font-bold text-white font-orbitron">$260K</span>
                    </div>
                    <div className="w-full bg-amber-900/20 rounded-full h-1.5 mb-2 overflow-hidden">
                        <motion.div
                            className="bg-amber-500 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: '25%' }}
                            transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-amber-400/60 font-mono">
                        <span>5 Combat Units</span>
                        <span className="text-amber-400">+25%</span>
                    </div>
                </HoloCard>

            </div>
        </div>
    );
}
