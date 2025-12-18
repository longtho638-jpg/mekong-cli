"use client";

import React, { useState, useEffect } from 'react';

// Types
interface ChapterScore {
    chapter: string;
    name: string;
    score: number;
    description: string;
    icon: string;
}

interface CriticalIssue {
    id: number;
    issue: string;
    severity: 'critical' | 'warning' | 'info';
}

// Demo Data
const chapters: ChapterScore[] = [
    { chapter: "1", name: "Kế Hoạch", score: 75, description: "Assessment & SWOT", icon: "📋" },
    { chapter: "2", name: "Tác Chiến", score: 100, description: "Runway & Burn", icon: "💰" },
    { chapter: "3", name: "Mưu Công", score: 50, description: "Win Without Fighting", icon: "🤝" },
    { chapter: "4", name: "Hình Thế", score: 80, description: "Moats & Defense", icon: "🏰" },
    { chapter: "5", name: "Thế Trận", score: 54, description: "Network Effects", icon: "🔗" },
    { chapter: "6", name: "Hư Thực", score: 75, description: "Anti-Dilution 🛡️", icon: "🛡️" },
    { chapter: "7", name: "Quân Tranh", score: 110, description: "Speed & Agility", icon: "⚡" },
    { chapter: "8", name: "Cửu Biến", score: 70, description: "Pivot & Exit", icon: "🔄" },
    { chapter: "9", name: "Hành Quân", score: 82, description: "OKRs & Execution", icon: "📊" },
    { chapter: "10", name: "Địa Hình", score: 70, description: "Market & Timing", icon: "🗺️" },
    { chapter: "11", name: "Cửu Địa", score: 40, description: "Crisis & Survival", icon: "🚨" },
    { chapter: "12", name: "Hỏa Công", score: 60, description: "Disruption", icon: "🔥" },
    { chapter: "13", name: "Dụng Gián", score: 60, description: "Intel & Research", icon: "🕵️" },
];

const criticalIssues: CriticalIssue[] = [
    { id: 1, issue: "Founder does not control board", severity: "critical" },
    { id: 2, issue: "Runway below 6 months", severity: "warning" },
    { id: 3, issue: "Low growth momentum", severity: "info" },
];

const getScoreColor = (score: number) => {
    if (score >= 70) return "from-emerald-400 to-green-500";
    if (score >= 50) return "from-amber-400 to-yellow-500";
    return "from-red-400 to-rose-500";
};

const getScoreGlow = (score: number) => {
    if (score >= 70) return "shadow-emerald-500/30";
    if (score >= 50) return "shadow-amber-500/30";
    return "shadow-red-500/30";
};

const getSeverityStyle = (severity: string) => {
    switch (severity) {
        case "critical": return "bg-red-500/20 border-red-500 text-red-400";
        case "warning": return "bg-amber-500/20 border-amber-500 text-amber-400";
        default: return "bg-blue-500/20 border-blue-500 text-blue-400";
    }
};

export default function WarRoomPage() {
    const [battleReadiness, setBattleReadiness] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
        const avgScore = chapters.reduce((a, b) => a + b.score, 0) / chapters.length;
        const timer = setTimeout(() => setBattleReadiness(Math.round(avgScore)), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-8">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header */}
            <header className={`relative z-10 mb-12 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent">
                            🏯 WAR ROOM
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">Binh Pháp Command Center</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-500">Philosophy</p>
                        <p className="text-xl font-medium text-amber-300/80">"Không đánh mà thắng"</p>
                        <p className="text-xs text-slate-600 mt-1">知彼知己，百戰不殆</p>
                    </div>
                </div>
            </header>

            {/* Battle Readiness Gauge */}
            <section className={`relative z-10 mb-12 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold">⚔️ Battle Readiness</h2>
                        <span className={`text-6xl font-bold bg-gradient-to-r ${getScoreColor(battleReadiness)} bg-clip-text text-transparent`}>
                            {battleReadiness}%
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${getScoreColor(battleReadiness)} transition-all duration-1500 ease-out rounded-full ${getScoreGlow(battleReadiness)} shadow-lg`}
                            style={{ width: `${battleReadiness}%` }}
                        />
                    </div>

                    <div className="flex justify-between mt-3 text-sm text-slate-400">
                        <span>🔴 Critical</span>
                        <span>🟡 Preparing</span>
                        <span>🟢 Battle Ready</span>
                    </div>
                </div>
            </section>

            {/* 13 Chapters Grid */}
            <section className={`relative z-10 mb-12 transition-all duration-1000 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                    📚 13 Chapters of Binh Pháp
                    <span className="text-sm font-normal text-slate-500">Sun Tzu Applied to Startups</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {chapters.map((ch, idx) => (
                        <div
                            key={ch.chapter}
                            className={`group bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-slate-700/30 p-5 hover:border-amber-500/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer hover:shadow-xl hover:shadow-amber-500/10`}
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-2xl">{ch.icon}</span>
                                <span className={`text-xl font-bold bg-gradient-to-r ${getScoreColor(ch.score)} bg-clip-text text-transparent`}>
                                    {ch.score}%
                                </span>
                            </div>
                            <h3 className="font-semibold text-lg text-white/90 group-hover:text-amber-200 transition-colors">
                                {ch.chapter}. {ch.name}
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">{ch.description}</p>

                            {/* Mini progress bar */}
                            <div className="h-1.5 bg-slate-700 rounded-full mt-4 overflow-hidden">
                                <div
                                    className={`h-full bg-gradient-to-r ${getScoreColor(ch.score)} rounded-full transition-all duration-1000`}
                                    style={{ width: `${ch.score}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Critical Issues */}
            <section className={`relative z-10 mb-12 transition-all duration-1000 delay-600 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <h2 className="text-2xl font-semibold mb-6">🚨 Critical Issues</h2>
                <div className="space-y-3">
                    {criticalIssues.map((issue) => (
                        <div
                            key={issue.id}
                            className={`${getSeverityStyle(issue.severity)} border rounded-xl px-5 py-4 flex items-center gap-4 backdrop-blur-sm`}
                        >
                            <span className="text-2xl">
                                {issue.severity === 'critical' ? '🚨' : issue.severity === 'warning' ? '⚠️' : 'ℹ️'}
                            </span>
                            <span className="font-medium">{issue.issue}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* WIN-WIN-WIN Panel */}
            <section className={`relative z-10 transition-all duration-1000 delay-800 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 backdrop-blur-xl rounded-3xl border border-amber-500/30 p-8">
                    <h2 className="text-2xl font-semibold mb-6 text-center text-amber-200">🏆 WIN-WIN-WIN Architecture</h2>

                    <div className="grid grid-cols-3 gap-6 text-center">
                        <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                            <span className="text-4xl mb-3 block">👑</span>
                            <h3 className="font-bold text-lg text-amber-200">ANH</h3>
                            <p className="text-sm text-slate-400 mt-2">Portfolio Equity</p>
                            <p className="text-sm text-slate-400">Cash Flow</p>
                            <p className="text-sm text-slate-400">Legacy</p>
                        </div>

                        <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                            <span className="text-4xl mb-3 block">🏢</span>
                            <h3 className="font-bold text-lg text-amber-200">AGENCY</h3>
                            <p className="text-sm text-slate-400 mt-2">Deal Flow</p>
                            <p className="text-sm text-slate-400">Knowledge</p>
                            <p className="text-sm text-slate-400">Infrastructure</p>
                        </div>

                        <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                            <span className="text-4xl mb-3 block">🚀</span>
                            <h3 className="font-bold text-lg text-amber-200">STARTUP</h3>
                            <p className="text-sm text-slate-400 mt-2">Protection</p>
                            <p className="text-sm text-slate-400">Strategy</p>
                            <p className="text-sm text-slate-400">Network</p>
                        </div>
                    </div>

                    <p className="text-center mt-8 text-lg text-amber-300/70 font-medium">
                        "Cùng thắng mới là thắng lớn" 🏆
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 mt-16 text-center text-slate-500 text-sm">
                <p>🏯 Agency OS v2.0 - Binh Pháp Venture Studio</p>
                <p className="mt-1">168 Modules | 94 Commits | 22 Hubs</p>
            </footer>
        </div>
    );
}
