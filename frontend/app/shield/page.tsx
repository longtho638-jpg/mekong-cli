"use client";

import React, { useState, useEffect } from 'react';

// Types
interface TermSheetInput {
    preMoney: number;
    investment: number;
    liquidationPref: string;
    antiDilution: string;
    boardSeats: { founder: number; investor: number; independent: number };
    optionPool: number;
    vestingReset: boolean;
    dragAlong: number;
    noShopDays: number;
}

interface RedFlag {
    term: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    recommendation: string;
}

interface AnalysisResult {
    founderFriendlyScore: number;
    postMoney: number;
    dilution: number;
    founderOwnership: number;
    redFlags: RedFlag[];
    recommendation: 'PROCEED' | 'NEGOTIATE' | 'WALK_AWAY';
}

const defaultInput: TermSheetInput = {
    preMoney: 5000000,
    investment: 1000000,
    liquidationPref: '1x_non_participating',
    antiDilution: 'weighted_average',
    boardSeats: { founder: 2, investor: 1, independent: 0 },
    optionPool: 10,
    vestingReset: false,
    dragAlong: 75,
    noShopDays: 30,
};

const getSeverityColor = (severity: string) => {
    switch (severity) {
        case 'critical': return 'bg-red-500/20 border-red-500 text-red-400';
        case 'high': return 'bg-orange-500/20 border-orange-500 text-orange-400';
        case 'medium': return 'bg-amber-500/20 border-amber-500 text-amber-400';
        default: return 'bg-blue-500/20 border-blue-500 text-blue-400';
    }
};

const getSeverityIcon = (severity: string) => {
    switch (severity) {
        case 'critical': return '🚨';
        case 'high': return '🔴';
        case 'medium': return '🟡';
        default: return '🔵';
    }
};

export default function ShieldPage() {
    const [input, setInput] = useState<TermSheetInput>(defaultInput);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeTermSheet = () => {
        setIsAnalyzing(true);

        setTimeout(() => {
            const redFlags: RedFlag[] = [];
            let score = 100;

            // Check liquidation preference
            if (input.liquidationPref === '2x_participating') {
                redFlags.push({
                    term: 'Liquidation Preference',
                    description: '2x participating preferred is extremely aggressive',
                    severity: 'critical',
                    recommendation: 'Negotiate to 1x non-participating'
                });
                score -= 30;
            } else if (input.liquidationPref === '1x_participating') {
                redFlags.push({
                    term: 'Liquidation Preference',
                    description: '1x participating can significantly reduce founder returns',
                    severity: 'high',
                    recommendation: 'Push for 1x non-participating'
                });
                score -= 15;
            }

            // Check anti-dilution
            if (input.antiDilution === 'full_ratchet') {
                redFlags.push({
                    term: 'Anti-Dilution',
                    description: 'Full ratchet is extremely punitive in down rounds',
                    severity: 'critical',
                    recommendation: 'Insist on broad-based weighted average'
                });
                score -= 25;
            }

            // Check board control
            const totalSeats = input.boardSeats.founder + input.boardSeats.investor + input.boardSeats.independent;
            const founderControl = input.boardSeats.founder > totalSeats / 2;
            if (!founderControl) {
                redFlags.push({
                    term: 'Board Control',
                    description: 'Founders do not have board majority',
                    severity: 'high',
                    recommendation: 'Negotiate for founder majority or equal representation with tie-breaker'
                });
                score -= 20;
            }

            // Check vesting reset
            if (input.vestingReset) {
                redFlags.push({
                    term: 'Vesting Reset',
                    description: 'Founder vesting will restart from zero',
                    severity: 'high',
                    recommendation: 'Negotiate for credit for time served'
                });
                score -= 15;
            }

            // Check drag-along
            if (input.dragAlong < 60) {
                redFlags.push({
                    term: 'Drag-Along',
                    description: `${input.dragAlong}% threshold is too low`,
                    severity: 'medium',
                    recommendation: 'Negotiate to 70-80% threshold'
                });
                score -= 10;
            }

            // Check no-shop
            if (input.noShopDays > 45) {
                redFlags.push({
                    term: 'No-Shop Period',
                    description: `${input.noShopDays} days is too long`,
                    severity: 'medium',
                    recommendation: 'Limit to 30-45 days'
                });
                score -= 10;
            }

            // Check option pool
            if (input.optionPool > 15) {
                redFlags.push({
                    term: 'Option Pool',
                    description: `${input.optionPool}% is larger than typical`,
                    severity: 'low',
                    recommendation: 'Negotiate based on actual hiring plan'
                });
                score -= 5;
            }

            // Calculate ownership
            const postMoney = input.preMoney + input.investment;
            const dilution = (input.investment / postMoney) * 100;
            const founderOwnership = 100 - dilution - input.optionPool;

            const recommendation = score >= 70 ? 'PROCEED' : score >= 50 ? 'NEGOTIATE' : 'WALK_AWAY';

            setAnalysis({
                founderFriendlyScore: Math.max(0, score),
                postMoney,
                dilution,
                founderOwnership,
                redFlags,
                recommendation
            });
            setIsAnalyzing(false);
        }, 1500);
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'from-emerald-400 to-green-500';
        if (score >= 50) return 'from-amber-400 to-yellow-500';
        return 'from-red-400 to-rose-500';
    };

    const getRecommendationStyle = (rec: string) => {
        switch (rec) {
            case 'PROCEED': return 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
            case 'NEGOTIATE': return 'bg-amber-500/20 border-amber-500 text-amber-400';
            default: return 'bg-red-500/20 border-red-500 text-red-400';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-8">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header */}
            <header className="relative z-10 mb-12">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-200 via-green-400 to-emerald-200 bg-clip-text text-transparent">
                            🛡️ Anti-Dilution Shield
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">Chapter 6: Hư Thực - Attack Weakness, Defend Strength</p>
                    </div>
                    <div className="text-right">
                        <a href="/warroom" className="text-amber-400 hover:text-amber-300 transition-colors">
                            ← Back to War Room
                        </a>
                    </div>
                </div>
            </header>

            <div className="relative z-10 grid lg:grid-cols-2 gap-8">
                {/* Input Form */}
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
                    <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                        📋 Term Sheet Input
                    </h2>

                    <div className="space-y-6">
                        {/* Valuation */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Pre-Money Valuation</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                    <input
                                        type="number"
                                        value={input.preMoney}
                                        onChange={(e) => setInput({ ...input, preMoney: Number(e.target.value) })}
                                        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-8 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Investment Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                    <input
                                        type="number"
                                        value={input.investment}
                                        onChange={(e) => setInput({ ...input, investment: Number(e.target.value) })}
                                        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-8 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Liquidation Preference */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Liquidation Preference</label>
                            <select
                                value={input.liquidationPref}
                                onChange={(e) => setInput({ ...input, liquidationPref: e.target.value })}
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                            >
                                <option value="1x_non_participating">1x Non-Participating ✅</option>
                                <option value="1x_participating">1x Participating ⚠️</option>
                                <option value="2x_participating">2x Participating 🚨</option>
                            </select>
                        </div>

                        {/* Anti-Dilution */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Anti-Dilution Protection</label>
                            <select
                                value={input.antiDilution}
                                onChange={(e) => setInput({ ...input, antiDilution: e.target.value })}
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                            >
                                <option value="weighted_average">Broad-Based Weighted Average ✅</option>
                                <option value="narrow_weighted">Narrow Weighted Average ⚠️</option>
                                <option value="full_ratchet">Full Ratchet 🚨</option>
                            </select>
                        </div>

                        {/* Board Seats */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Board Composition</label>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Founder Seats</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="5"
                                        value={input.boardSeats.founder}
                                        onChange={(e) => setInput({ ...input, boardSeats: { ...input.boardSeats, founder: Number(e.target.value) } })}
                                        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2 text-white text-center focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Investor Seats</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="5"
                                        value={input.boardSeats.investor}
                                        onChange={(e) => setInput({ ...input, boardSeats: { ...input.boardSeats, investor: Number(e.target.value) } })}
                                        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2 text-white text-center focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Independent</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="5"
                                        value={input.boardSeats.independent}
                                        onChange={(e) => setInput({ ...input, boardSeats: { ...input.boardSeats, independent: Number(e.target.value) } })}
                                        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2 text-white text-center focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Other Terms */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Option Pool (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="30"
                                    value={input.optionPool}
                                    onChange={(e) => setInput({ ...input, optionPool: Number(e.target.value) })}
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Drag-Along Threshold (%)</label>
                                <input
                                    type="number"
                                    min="50"
                                    max="100"
                                    value={input.dragAlong}
                                    onChange={(e) => setInput({ ...input, dragAlong: Number(e.target.value) })}
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">No-Shop Period (days)</label>
                                <input
                                    type="number"
                                    min="15"
                                    max="90"
                                    value={input.noShopDays}
                                    onChange={(e) => setInput({ ...input, noShopDays: Number(e.target.value) })}
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-3 cursor-pointer bg-slate-700/30 rounded-xl px-4 py-3 w-full border border-slate-600 hover:border-slate-500 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={input.vestingReset}
                                        onChange={(e) => setInput({ ...input, vestingReset: e.target.checked })}
                                        className="w-5 h-5 rounded"
                                    />
                                    <span className="text-sm">Vesting Reset</span>
                                </label>
                            </div>
                        </div>

                        {/* Analyze Button */}
                        <button
                            onClick={analyzeTermSheet}
                            disabled={isAnalyzing}
                            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-semibold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:opacity-50"
                        >
                            {isAnalyzing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Analyzing Term Sheet...
                                </span>
                            ) : (
                                '🛡️ Analyze & Protect'
                            )}
                        </button>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="space-y-6">
                    {analysis ? (
                        <>
                            {/* Score Card */}
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-semibold">📊 Analysis Result</h2>
                                    <div className={`px-4 py-2 rounded-xl border ${getRecommendationStyle(analysis.recommendation)}`}>
                                        {analysis.recommendation === 'PROCEED' && '✅ PROCEED'}
                                        {analysis.recommendation === 'NEGOTIATE' && '⚠️ NEGOTIATE'}
                                        {analysis.recommendation === 'WALK_AWAY' && '🚨 WALK AWAY'}
                                    </div>
                                </div>

                                {/* Score */}
                                <div className="text-center mb-8">
                                    <span className={`text-7xl font-bold bg-gradient-to-r ${getScoreColor(analysis.founderFriendlyScore)} bg-clip-text text-transparent`}>
                                        {analysis.founderFriendlyScore}
                                    </span>
                                    <span className="text-3xl text-slate-400">%</span>
                                    <p className="text-slate-400 mt-2">Founder-Friendly Score</p>
                                </div>

                                {/* Key Metrics */}
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-slate-700/30 rounded-xl p-4">
                                        <p className="text-2xl font-bold text-white">${(analysis.postMoney / 1000000).toFixed(1)}M</p>
                                        <p className="text-sm text-slate-400">Post-Money</p>
                                    </div>
                                    <div className="bg-slate-700/30 rounded-xl p-4">
                                        <p className="text-2xl font-bold text-amber-400">{analysis.dilution.toFixed(1)}%</p>
                                        <p className="text-sm text-slate-400">Dilution</p>
                                    </div>
                                    <div className="bg-slate-700/30 rounded-xl p-4">
                                        <p className="text-2xl font-bold text-emerald-400">{analysis.founderOwnership.toFixed(1)}%</p>
                                        <p className="text-sm text-slate-400">Founder Own</p>
                                    </div>
                                </div>
                            </div>

                            {/* Red Flags */}
                            {analysis.redFlags.length > 0 && (
                                <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
                                    <h2 className="text-2xl font-semibold mb-6">🚩 Red Flags Detected</h2>
                                    <div className="space-y-4">
                                        {analysis.redFlags.map((flag, idx) => (
                                            <div key={idx} className={`border rounded-xl p-4 ${getSeverityColor(flag.severity)}`}>
                                                <div className="flex items-start gap-3">
                                                    <span className="text-xl">{getSeverityIcon(flag.severity)}</span>
                                                    <div>
                                                        <h3 className="font-semibold">{flag.term}</h3>
                                                        <p className="text-sm opacity-80 mt-1">{flag.description}</p>
                                                        <p className="text-sm mt-2 text-white/70">
                                                            💡 <span className="italic">{flag.recommendation}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl text-center">
                            <div className="text-6xl mb-4">🛡️</div>
                            <h3 className="text-xl font-semibold mb-2">Enter Term Sheet Details</h3>
                            <p className="text-slate-400">Fill in the form and click analyze to get your protection score</p>

                            <div className="mt-8 bg-slate-700/30 rounded-xl p-6 text-left">
                                <h4 className="font-semibold text-amber-300 mb-3">💡 Binh Pháp Wisdom</h4>
                                <blockquote className="text-slate-400 italic">
                                    "Đánh vào chỗ trống, tránh chỗ đầy"<br />
                                    <span className="text-sm">(Attack weakness, avoid strength)</span>
                                </blockquote>
                                <p className="text-sm text-slate-500 mt-4">
                                    Know the common investor tactics and protect yourself before signing.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 mt-16 text-center text-slate-500 text-sm">
                <p>🏯 Agency OS v2.0 - Binh Pháp Venture Studio</p>
                <p className="mt-1">Chapter 6: Hư Thực - Know Weakness & Strength</p>
            </footer>
        </div>
    );
}
