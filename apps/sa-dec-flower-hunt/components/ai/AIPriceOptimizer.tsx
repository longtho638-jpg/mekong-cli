"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp,
    DollarSign,
    Sparkles,
    AlertCircle,
    CheckCircle
} from "lucide-react";
import {
    calculateOptimalPrice,
    getCurrentSeason,
    type PriceFactors
} from "@/lib/ai-price-optimizer";

export function AIPriceOptimizer() {
    const [baseCost, setBaseCost] = useState(50000);
    const [category, setCategory] = useState<PriceFactors['category']>('rose');
    const [inventory, setInventory] = useState(25);
    const [competition, setCompetition] = useState(3);
    const [historicalSales, setHistoricalSales] = useState(0);

    const season = getCurrentSeason();

    const recommendation = calculateOptimalPrice({
        baseCost,
        category,
        season,
        inventory,
        competitionCount: competition,
        historicalSales
    });

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-8 h-8 text-amber-500" />
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                            AI Price Optimizer
                        </h1>
                    </div>
                    <p className="text-stone-500">Smart pricing powered by machine learning</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Controls */}
                    <motion.div
                        className="bg-stone-950 border border-stone-800 rounded-sm p-6 space-y-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                            Product Details
                        </h3>

                        {/* Base Cost */}
                        <div>
                            <label className="block text-sm text-stone-400 mb-2">
                                Base Cost: <span className="font-bold text-white">{baseCost.toLocaleString()}đ</span>
                            </label>
                            <input
                                type="range"
                                min="10000"
                                max="200000"
                                step="5000"
                                value={baseCost}
                                onChange={(e) => setBaseCost(Number(e.target.value))}
                                className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm text-stone-400 mb-2">Flower Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as any)}
                                className="w-full bg-stone-900 border border-stone-800 rounded px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="rose">🌹 Rose (High Demand)</option>
                                <option value="lily">🌸 Lily (Medium-High)</option>
                                <option value="orchid">🌺 Orchid (Premium)</option>
                                <option value="sunflower">🌻 Sunflower (Medium)</option>
                                <option value="carnation">💐 Carnation (Standard)</option>
                                <option value="other">🌷 Other</option>
                            </select>
                        </div>

                        {/* Inventory */}
                        <div>
                            <label className="block text-sm text-stone-400 mb-2">
                                Inventory: <span className="font-bold text-white">{inventory} units</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={inventory}
                                onChange={(e) => setInventory(Number(e.target.value))}
                                className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>

                        {/* Competition */}
                        <div>
                            <label className="block text-sm text-stone-400 mb-2">
                                Competition: <span className="font-bold text-white">{competition} sellers</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={competition}
                                onChange={(e) => setCompetition(Number(e.target.value))}
                                className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>

                        {/* Historical Sales */}
                        <div>
                            <label className="block text-sm text-stone-400 mb-2">
                                Past Sales: <span className="font-bold text-white">{historicalSales}</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="500"
                                step="10"
                                value={historicalSales}
                                onChange={(e) => setHistoricalSales(Number(e.target.value))}
                                className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                        </div>

                        {/* Current Season Info */}
                        <div className="bg-stone-900/50 border border-stone-800 rounded p-4">
                            <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
                                Current Season
                            </div>
                            <div className="font-bold text-white capitalize">{season}</div>
                        </div>
                    </motion.div>

                    {/* Recommendation Output */}
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        {/* Optimal Price Card */}
                        <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500/50 rounded-sm p-8 text-center">
                            <div className="text-sm text-emerald-400 uppercase tracking-wider mb-2">
                                AI Recommended Price
                            </div>
                            <motion.div
                                className="text-6xl font-bold text-white mb-4"
                                key={recommendation.optimalPrice}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                            >
                                {recommendation.optimalPrice.toLocaleString()}đ
                            </motion.div>
                            <div className="flex items-center justify-center gap-2 text-sm text-emerald-400">
                                <CheckCircle className="w-4 h-4" />
                                {recommendation.confidence}% Confidence
                            </div>
                        </div>

                        {/* Price Range */}
                        <div className="bg-stone-950 border border-stone-800 rounded-sm p-6">
                            <h4 className="text-sm text-stone-400 uppercase tracking-wider mb-4">
                                Price Range
                            </h4>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 text-center">
                                    <div className="text-xs text-stone-500 mb-1">Min</div>
                                    <div className="font-bold text-stone-300">
                                        {recommendation.minPrice.toLocaleString()}đ
                                    </div>
                                </div>
                                <div className="flex-1 text-center border-x border-stone-800">
                                    <div className="text-xs text-emerald-500 mb-1">Optimal</div>
                                    <div className="font-bold text-emerald-500">
                                        {recommendation.optimalPrice.toLocaleString()}đ
                                    </div>
                                </div>
                                <div className="flex-1 text-center">
                                    <div className="text-xs text-stone-500 mb-1">Max</div>
                                    <div className="font-bold text-stone-300">
                                        {recommendation.maxPrice.toLocaleString()}đ
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-stone-950 border border-stone-800 rounded-sm p-4">
                                <div className="text-xs text-stone-500 mb-1">Demand Score</div>
                                <div className="flex items-center gap-2">
                                    <div className="text-2xl font-bold text-cyan-500">
                                        {recommendation.demandScore}
                                    </div>
                                    <div className="text-xs text-stone-600">/100</div>
                                </div>
                            </div>

                            <div className="bg-stone-950 border border-stone-800 rounded-sm p-4">
                                <div className="text-xs text-stone-500 mb-1">Profit Margin</div>
                                <div className="text-2xl font-bold text-emerald-500">
                                    {recommendation.profitMargin.toFixed(1)}%
                                </div>
                            </div>

                            <div className="bg-stone-950 border border-stone-800 rounded-sm p-4 col-span-2">
                                <div className="text-xs text-stone-500 mb-1">Expected Revenue (Week)</div>
                                <div className="text-2xl font-bold text-amber-500">
                                    {(recommendation.expectedRevenue / 1000).toFixed(0)}K đ
                                </div>
                            </div>
                        </div>

                        {/* AI Reasoning */}
                        <div className="bg-stone-950 border border-amber-500/30 rounded-sm p-6">
                            <h4 className="text-sm text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                AI Reasoning
                            </h4>
                            <ul className="space-y-2">
                                {recommendation.reasoning.map((reason, index) => (
                                    <motion.li
                                        key={index}
                                        className="text-sm text-stone-300 flex items-start gap-2"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        {reason}
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
