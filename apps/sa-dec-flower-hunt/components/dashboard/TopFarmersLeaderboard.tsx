"use client";

import { motion } from "framer-motion";
import { Star, TrendingUp } from "lucide-react";

interface TopFarmer {
    id: string;
    name: string;
    total_orders: number;
    total_revenue: number;
    rating: number;
}

export function TopFarmersLeaderboard({ farmers }: { farmers: TopFarmer[] }) {
    const medals = ["🥇", "🥈", "🥉"];

    return (
        <motion.div
            className="bg-stone-950 border border-stone-800 rounded-sm p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
        >
            <div className="mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    Top Farmers
                </h3>
                <p className="text-sm text-stone-500">Last 30 days performance</p>
            </div>

            <div className="space-y-3">
                {farmers.length === 0 ? (
                    <div className="text-center py-8 text-stone-600">
                        No data yet. Start selling to appear here!
                    </div>
                ) : (
                    farmers.map((farmer, index) => (
                        <motion.div
                            key={farmer.id}
                            className="bg-stone-900/50 border border-stone-800 rounded p-4 hover:border-emerald-500/30 transition-colors"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="flex items-center gap-4">
                                {/* Rank */}
                                <div className="text-2xl">
                                    {index < 3 ? medals[index] : `#${index + 1}`}
                                </div>

                                {/* Farmer info */}
                                <div className="flex-1">
                                    <div className="font-bold text-white">{farmer.name}</div>
                                    <div className="flex items-center gap-4 text-xs text-stone-500">
                                        <span>{farmer.total_orders} orders</span>
                                        {farmer.rating && (
                                            <span className="flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                                {farmer.rating.toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Revenue */}
                                <div className="text-right">
                                    <div className="font-bold text-emerald-500">
                                        {(farmer.total_revenue / 1000).toFixed(0)}K
                                    </div>
                                    <div className="text-xs text-stone-500">VNĐ</div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
}
