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
        // Simple logic for demo
        const postMoney = inputs.valuation + inputs.investment;
        const invEquity = (inputs.investment / postMoney) * 100;
        const poolDilution = inputs.optionPool;
        const founderEq = 100 - invEquity - poolDilution;

        // Shield score calculation
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

            {/* Background with Beams Collision - The Conflict Field */}
            <div className="fixed inset-0 z-0">
                <BackgroundBeamsWithCollision className="h-full">
                    {/* Empty because we just want the beams in background, content is below */}
                    <div className="hidden"></div>
                </BackgroundBeamsWithCollision>
            </div>


            {/* Main Content - The Logical Flow (Fixed Layout) */}
            <div className="relative z-10 pt-10 pb-20 px-4 md:px-8 max-w-6xl mx-auto font-sans">

                {/* Header */}
                <div className="mb-12 relative text-center">
                    <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400 drop-shadow-2xl">
                        ANTI-DILUTION <br />
                        <span className="text-cyan-400">SHIELD 2.0</span>
                    </h1>
                    <p className="text-slate-400 mt-4 text-lg md:text-xl tracking-[0.2em] uppercase font-medium">
                        Hệ thống phòng thủ tài chính • Chapter 6 Hư Thực
                    </p>
                </div>

                {/* Defense Core (Score) */}
                <div className="mb-12 flex justify-center transform hover:scale-105 transition-transform duration-500">
                    <div className="relative w-64 h-64 flex items-center justify-center">
                        {/* Rotating Rings */}
                        <div className="absolute inset-0 border-[6px] border-cyan-500/30 rounded-full animate-[spin_10s_linear_infinite]" style={{ boxShadow: "0 0 30px rgba(6,182,212,0.2)" }} />
                        <div className="absolute inset-4 border-[3px] border-purple-500/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

                        {/* Score */}
                        <div className="relative z-10 text-center bg-slate-950/80 p-8 rounded-full backdrop-blur-md">
                            <span className="text-7xl font-black text-white drop-shadow-[0_0_25px_rgba(34,211,238,0.8)]">
                                {result.shieldScore}
                            </span>
                            <p className="text-cyan-400 text-xs font-bold mt-2 uppercase tracking-widest">Defense Level</p>
                        </div>
                    </div>
                </div>

                {/* Input Console - Glassmorphism (Stable) */}
                <div className="w-full max-w-5xl mx-auto mb-12 bg-[#0b1121] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden relative">
                    {/* Glass Header */}
                    <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        <span className="ml-4 text-slate-300 font-mono text-sm tracking-wider">📥 TERMINAL_INPUT_NODE_V2.0</span>
                    </div>

                    {/* Input Body */}
                    <div className="p-8 md:p-10 grid md:grid-cols-2 gap-10 relative z-10">
                        <div className="space-y-6">
                            <div className="group">
                                <label className="text-cyan-400 font-bold text-xs uppercase tracking-wider mb-2 block group-hover:text-cyan-300 transition-colors">Pre-Money Valuation</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                                    <input
                                        type="number"
                                        className="w-full bg-[#020617] border border-slate-700 rounded-xl py-4 pl-8 pr-4 text-white font-mono text-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none shadow-inner"
                                        value={inputs.valuation}
                                        placeholder="5000000"
                                        onChange={(e) => setInputs({ ...inputs, valuation: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2 block group-hover:text-emerald-300 transition-colors">Investment Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                                    <input
                                        type="number"
                                        className="w-full bg-[#020617] border border-slate-700 rounded-xl py-4 pl-8 pr-4 text-white font-mono text-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none shadow-inner"
                                        value={inputs.investment}
                                        placeholder="1000000"
                                        onChange={(e) => setInputs({ ...inputs, investment: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between mb-3">
                                    <label className="text-purple-400 font-bold text-xs uppercase tracking-wider">Option Pool</label>
                                    <span className="text-white font-mono font-bold bg-purple-500/20 px-2 py-0.5 rounded text-sm">{inputs.optionPool}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="30"
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
                                    value={inputs.optionPool}
                                    onChange={(e) => setInputs({ ...inputs, optionPool: Number(e.target.value) })}
                                />
                                <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono uppercase">
                                    <span>No Pool</span>
                                    <span>Standard 10%</span>
                                    <span>VC Ask 20%+</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-red-400 font-bold text-xs uppercase tracking-wider mb-3 block">Liquidation Preference</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 1.5, 2, 3].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setInputs({ ...inputs, liquidationPref: val })}
                                            className={cn(
                                                "py-3 rounded-lg border font-bold text-sm transition-all relative overflow-hidden",
                                                inputs.liquidationPref === val
                                                    ? "bg-red-950/40 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                                    : "bg-[#020617] border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
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

                {/* Simulation Output */}
                <div className="grid md:grid-cols-3 gap-6 mb-20">
                    <div className="bg-[#0b1121] p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 md:w-full md:h-1"></div>
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-wider">Post-Money Valuation</p>
                        <p className="text-3xl md:text-3xl font-black text-white group-hover:text-cyan-400 transition-colors font-mono">
                            ${(result.postMoney / 1000000).toFixed(1)}M
                        </p>
                    </div>
                    <div className="bg-[#0b1121] p-6 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 md:w-full md:h-1"></div>
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-wider">Founder Equity</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl md:text-3xl font-black text-white group-hover:text-amber-400 transition-colors font-mono">
                                {result.founderEquity}%
                            </p>
                            <span className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">Retained</span>
                        </div>
                    </div>
                    <div className="bg-[#0b1121] p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 md:w-full md:h-1"></div>
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-wider">Investor Equity</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl md:text-3xl font-black text-white group-hover:text-emerald-400 transition-colors font-mono">
                                {result.investorEquity}%
                            </p>
                            <span className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">Acquired</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
