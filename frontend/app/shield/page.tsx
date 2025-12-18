"use client";

import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { SparklesCore } from "@/components/ui/sparkles";

// Types
interface TermSheetInput {
    valuation: number;
    investment: number;
    founderOwnership: number;
    optionPool: number;
    liquidationPref: number;
}

export default function ShieldPage() {
    const [inputs, setInputs] = useState<TermSheetInput>({
        valuation: 5000000,
        investment: 1000000,
        founderOwnership: 80,
        optionPool: 10,
        liquidationPref: 1,
    });

    const [result, setResult] = useState({
        postMoney: 0,
        founderEquity: 0,
        investorEquity: 0,
        shieldScore: 0,
    });

    useEffect(() => {
        const postMoney = inputs.valuation + inputs.investment;
        const invEquity = (inputs.investment / postMoney) * 100;
        const poolDilution = inputs.optionPool;
        const founderEq = 100 - invEquity - poolDilution;

        let score = 100;
        if (invEquity > 25) score -= 10;
        if (inputs.liquidationPref > 1) score -= 30;
        score = Math.max(0, score);

        setResult({
            postMoney,
            founderEquity: Number(founderEq.toFixed(2)),
            investorEquity: Number(invEquity.toFixed(2)),
            shieldScore: score,
        });
    }, [inputs]);

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden font-mono selection:bg-cyan-500/30">
            {/* Background Beams */}
            <div className="fixed inset-0 z-0">
                <BackgroundBeamsWithCollision className="h-full">
                    <div className="hidden"></div>
                </BackgroundBeamsWithCollision>
            </div>

            {/* Content Container */}
            <main className="relative z-10 min-h-screen flex flex-col items-center shield-container font-sans">
                <div className="w-full max-w-6xl mx-auto">

                    {/* Header Section */}
                    <div className="mb-12 text-center">
                        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400 drop-shadow-2xl">
                            ANTI-DILUTION <br />
                            <span className="text-cyan-400">SHIELD 2.0</span>
                        </h1>
                        <p className="text-slate-400 mt-4 text-lg md:text-xl tracking-[0.2em] uppercase font-medium">
                            Hệ thống phòng thủ tài chính • Chapter 6 Hư Thực
                        </p>
                    </div>

                    {/* Score Core */}
                    <div className="mb-12 flex justify-center">
                        <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                            <div className="absolute inset-0 border-[6px] border-cyan-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
                            <div className="absolute inset-4 border-[3px] border-purple-500/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                            <div className="relative z-10 text-center bg-slate-950/80 p-6 md:p-8 rounded-full backdrop-blur-md">
                                <span className="text-5xl md:text-7xl font-black text-white drop-shadow-[0_0_25px_rgba(34,211,238,0.8)]">
                                    {result.shieldScore}
                                </span>
                                <p className="text-cyan-400 text-[10px] md:text-xs font-bold mt-2 uppercase tracking-widest">Defense Level</p>
                            </div>
                        </div>
                    </div>

                    {/* Input Console */}
                    <div className="mb-12 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glass-panel">
                        <div className="bg-slate-900/60 p-4 border-b border-slate-800 flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            </div>
                            <span className="ml-4 text-slate-400 font-mono text-xs tracking-wider">📥 TERMINAL_INPUT_NODE_V2.0</span>
                        </div>

                        <div className="p-6 md:p-10 grid md:grid-cols-2 gap-8 md:gap-12">
                            <div className="space-y-6">
                                <div>
                                    <label className="shield-label text-cyan-400">Pre-Money Valuation</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                                        <input
                                            type="number"
                                            className="shield-input w-full text-white font-mono text-lg outline-none transition-all"
                                            value={inputs.valuation}
                                            onChange={(e) => setInputs({ ...inputs, valuation: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="shield-label text-emerald-400">Investment Amount</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                                        <input
                                            type="number"
                                            className="shield-input w-full text-white font-mono text-lg outline-none transition-all"
                                            value={inputs.investment}
                                            onChange={(e) => setInputs({ ...inputs, investment: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="shield-label text-purple-400 mb-0">Option Pool</label>
                                        <span className="text-white font-mono font-bold">{inputs.optionPool}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="30"
                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                        value={inputs.optionPool}
                                        onChange={(e) => setInputs({ ...inputs, optionPool: Number(e.target.value) })}
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                                        <span>NO POOL</span>
                                        <span>STANDARD 10%</span>
                                        <span>VC ASK 20%+</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="shield-label text-red-400">Liquidation Preference</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[1, 1.5, 2, 3].map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => setInputs({ ...inputs, liquidationPref: val })}
                                                className={cn(
                                                    "py-3 rounded-lg border font-bold text-sm transition-all",
                                                    inputs.liquidationPref === val
                                                        ? "bg-red-950/40 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                                        : "bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700"
                                                )}
                                            >
                                                {val}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-20 text-white">
                        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500" />
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Post-Money Valuation</p>
                            <p className="text-2xl md:text-3xl font-black font-mono group-hover:text-cyan-400 transition-colors">
                                ${(result.postMoney / 1000000).toFixed(1)}M
                            </p>
                        </div>
                        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Founder Equity</p>
                            <p className="text-2xl md:text-3xl font-black font-mono group-hover:text-amber-400 transition-colors">
                                {result.founderEquity}%
                            </p>
                        </div>
                        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Investor Equity</p>
                            <p className="text-2xl md:text-3xl font-black font-mono group-hover:text-emerald-400 transition-colors">
                                {result.investorEquity}%
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
