"use client";

import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { SparklesCore } from "@/components/ui/sparkles";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";

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
            <div className="relative z-10 pt-10 pb-20 px-4 md:px-8 max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-16 relative">
                    <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 text-center">
                        ANTI-DILUTION <br />
                        <span className="text-cyan-400">SHIELD 2.0</span>
                    </h1>
                    <p className="text-center text-slate-400 mt-4 text-lg md:text-xl tracking-widest uppercase">
                        Hệ thống phòng thủ tài chính • Chapter 6 Hư Thực
                    </p>
                </div>

                {/* Defense Core (Score) */}
                <div className="mb-16 flex justify-center">
                    <div className="relative w-64 h-64 flex items-center justify-center">
                        {/* Rotating Rings */}
                        <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                        <div className="absolute inset-4 border-2 border-purple-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

                        {/* Score */}
                        <div className="relative z-10 text-center">
                            <span className="text-7xl font-bold text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
                                {result.shieldScore}
                            </span>
                            <p className="text-cyan-400 text-sm mt-2 uppercase tracking-widest">Defense Level</p>
                        </div>

                        {/* Core Sparkles */}
                        <div className="absolute inset-0 w-full h-full">
                            <SparklesCore
                                id="shield-core"
                                background="transparent"
                                minSize={0.6}
                                maxSize={1.4}
                                particleDensity={20}
                                className="w-full h-full"
                                particleColor="#22d3ee"
                            />
                        </div>
                    </div>
                </div>

                {/* Input Console - 3D Card */}
                <CardContainer className="inter-var w-full max-w-5xl mb-12">
                    <CardBody className="bg-slate-900/80 relative group/card border-slate-700 w-full rounded-xl p-6 md:p-10 border backdrop-blur-3xl shadow-2xl">
                        <CardItem
                            translateZ="50"
                            className="text-2xl font-bold text-neutral-200 mb-8 border-b border-slate-700 pb-4 w-full flex items-center gap-2"
                        >
                            <span>📥</span> Term Sheet Input Node
                        </CardItem>

                        <div className="grid md:grid-cols-2 gap-8">
                            <CardItem translateZ="60" className="w-full space-y-6">
                                <div>
                                    <label className="text-slate-300 font-semibold text-sm mb-2 block">Pre-Money Valuation ($)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-600 rounded-lg p-4 text-cyan-400 font-bold focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 transition-all outline-none font-mono"
                                        value={inputs.valuation}
                                        onChange={(e) => setInputs({ ...inputs, valuation: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-300 font-semibold text-sm mb-2 block">Investment Amount ($)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-600 rounded-lg p-4 text-emerald-400 font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-mono"
                                        value={inputs.investment}
                                        onChange={(e) => setInputs({ ...inputs, investment: Number(e.target.value) })}
                                    />
                                </div>
                            </CardItem>

                            <CardItem translateZ="80" className="w-full space-y-6">
                                <div>
                                    <label className="text-slate-300 font-semibold text-sm mb-2 block">Option Pool (%)</label>
                                    <div className="relative pt-1">
                                        <input
                                            type="range"
                                            min="0" max="30"
                                            className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                            value={inputs.optionPool}
                                            onChange={(e) => setInputs({ ...inputs, optionPool: Number(e.target.value) })}
                                        />
                                        <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                                            <span>0%</span>
                                            <span className="text-purple-400 text-lg font-bold">{inputs.optionPool}%</span>
                                            <span>30%</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-slate-300 font-semibold text-sm mb-2 block">Liquidation Preference (x)</label>
                                    <div className="flex gap-3">
                                        {[1, 1.5, 2, 3].map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => setInputs({ ...inputs, liquidationPref: val })}
                                                className={cn(
                                                    "flex-1 py-3 rounded-lg border-2 transition-all font-bold text-sm",
                                                    inputs.liquidationPref === val
                                                        ? "bg-red-500/20 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                                                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800"
                                                )}
                                            >
                                                {val}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardItem>
                        </div>
                    </CardBody>
                </CardContainer>

                {/* Simulation Output */}
                <div className="grid md:grid-cols-3 gap-6 mb-20">
                    <div className="bg-slate-900/60 p-6 rounded-2xl border border-dashed border-slate-600 backdrop-blur-sm hover:bg-slate-800/80 transition-all group">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-wider">Post-Money Valuation</p>
                        <p className="text-3xl md:text-4xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                            ${(result.postMoney / 1000000).toFixed(1)}M
                        </p>
                    </div>
                    <div className="bg-slate-900/60 p-6 rounded-2xl border border-dashed border-slate-600 backdrop-blur-sm hover:bg-slate-800/80 transition-all group">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-wider">Founder Equity</p>
                        <div className="flex items-end gap-2">
                            <p className="text-3xl md:text-4xl font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                                {result.founderEquity}%
                            </p>
                            <span className="text-slate-500 text-xs mb-1.5 uppercase">retained</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/60 p-6 rounded-2xl border border-dashed border-slate-600 backdrop-blur-sm hover:bg-slate-800/80 transition-all group">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-wider">Investor Equity</p>
                        <div className="flex items-end gap-2">
                            <p className="text-3xl md:text-4xl font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                                {result.investorEquity}%
                            </p>
                            <span className="text-slate-500 text-xs mb-1.5 uppercase">acquired</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
